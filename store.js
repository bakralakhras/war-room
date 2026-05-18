// War Room — per-user reactive store
// Each user gets their own isolated localStorage key.
// Exposes window.Store = { get, subscribe, dispatch, reset, isNew }

(function () {
  // ── Key namespaced per logged-in user ─────────────────────────
  function storeKey() {
    const u = window.Auth && window.Auth.session && window.Auth.session.username;
    return u ? 'warroom_v1_' + u : 'warroom_v1_guest';
  }

  // ── Empty campaign template (what a brand-new user gets) ──────
  function emptyState(user) {
    return {
      _new: true, // flag so the app can show onboarding
      campaign: {
        name:         'My Campaign',
        subtitle:     '',
        session:      1,
        sessionsTotal:20,
        nextSession:  '',
        location:     { name: '', region: '', note: '' },
      },
      party:    [],
      factions: [],
      npcs:     [],
      secrets:  [],
      rumors:   [],
      relics:   [],
      lore:     [],
      sessions: [],
      prep:     [],
    };
  }

  // ── Demo data (only pre-loaded for zechi / omen) ──────────────
  function demoState() {
    const c = window.CAMPAIGN;
    return {
      _new: false,
      campaign: {
        name:         c.name,
        subtitle:     c.subtitle,
        session:      c.session,
        sessionsTotal:c.sessionsTotal,
        nextSession:  c.nextSession,
        location:     { ...c.location },
      },
      party:    c.party.map(p => ({ ...p })),
      factions: window.FACTIONS.map(f => ({ ...f, clock: { ...f.clock } })),
      npcs:     window.NPCS.map(n => ({ ...n })),
      secrets:  window.SECRETS.map(s => ({ ...s })),
      rumors:   window.RUMORS.map(r => ({ ...r })),
      relics:   window.RELICS.map(r => ({ ...r })),
      lore:     window.LORE.map(l => ({ ...l })),
      sessions: [
        {
          id: 'session-13',
          number: c.session - 1,
          title: c.lastSession.title,
          bullets: [...c.lastSession.bullets],
          createdAt: null,
        },
      ],
      prep: c.prep.map((p, i) => ({ ...p, id: 'prep-' + i })),
    };
  }

  const PREMIUM_DEMO_USERS = ['zechi', 'omen'];

  // ── Load state for current user ───────────────────────────────
  function load() {
    const key = storeKey();
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (_) {}

    // First time this user logs in
    const username = window.Auth && window.Auth.session && window.Auth.session.username;
    return PREMIUM_DEMO_USERS.includes(username) ? demoState() : emptyState(username);
  }

  let state = load();

  const subs = new Set();

  function save() {
    try { localStorage.setItem(storeKey(), JSON.stringify(state)); } catch (_) {}
  }

  function notify() { subs.forEach(fn => fn(state)); }

  // ── Reducer ───────────────────────────────────────────────────
  function reduce(s, a) {
    switch (a.type) {

      // ── Onboarding ───────────────────────────────────────────
      case 'CAMPAIGN_INIT':
        return {
          ...s,
          _new: false,
          campaign: {
            ...s.campaign,
            name:         a.name,
            subtitle:     a.subtitle || '',
            sessionsTotal:a.sessionsTotal || 20,
          },
        };

      // ── Campaign fields ──────────────────────────────────────
      case 'CAMPAIGN_SET_FIELD':
        return { ...s, campaign: { ...s.campaign, [a.field]: a.value } };

      case 'CAMPAIGN_SET_LOCATION':
        return { ...s, campaign: { ...s.campaign, location: { ...s.campaign.location, ...a.patch } } };

      // ── Party ────────────────────────────────────────────────
      case 'PARTY_SET_HP': {
        const party = s.party.map(p =>
          p.name === a.name ? { ...p, hp: a.cur + '/' + a.max } : p
        );
        return { ...s, party };
      }

      case 'PARTY_ADD':
        return { ...s, party: [...s.party, { name: a.name, role: a.role, patron: a.patron || '—', hp: a.hp || '20/20', note: a.note || '' }] };

      case 'PARTY_REMOVE':
        return { ...s, party: s.party.filter(p => p.name !== a.name) };

      case 'PARTY_SET_FIELD': {
        const party = s.party.map(p =>
          p.name === a.name ? { ...p, [a.field]: a.value } : p
        );
        return { ...s, party };
      }

      // ── Factions ─────────────────────────────────────────────
      case 'FACTION_CLOCK_SET': {
        const factions = s.factions.map(f => {
          if (f.id !== a.id) return f;
          const filled = Math.max(0, Math.min(a.filled, f.clock.segments));
          return { ...f, clock: { ...f.clock, filled } };
        });
        return { ...s, factions };
      }

      case 'FACTION_SET_DISPOSITION': {
        const factions = s.factions.map(f =>
          f.id === a.id ? { ...f, disposition: a.disposition } : f
        );
        return { ...s, factions };
      }

      case 'FACTION_SET_FIELD': {
        const factions = s.factions.map(f =>
          f.id === a.id ? { ...f, [a.field]: a.value } : f
        );
        return { ...s, factions };
      }

      case 'FACTION_ADD': {
        const f = {
          id: 'faction-' + Date.now(),
          name: a.name, sigil: a.sigil || 'concord',
          ideology: a.ideology || '', leader: a.leader || '',
          seat: a.seat || '', disposition: a.disposition || 'neutral',
          clock: { segments: a.segments || 6, filled: 0, label: a.clockLabel || '' },
          color: a.color || 'iron', summary: a.summary || '',
        };
        return { ...s, factions: [...s.factions, f] };
      }

      case 'FACTION_REMOVE':
        return { ...s, factions: s.factions.filter(f => f.id !== a.id) };

      // ── Secrets ──────────────────────────────────────────────
      case 'SECRET_SET_STATUS': {
        const secrets = s.secrets.map(sec =>
          sec.id === a.id ? { ...sec, status: a.status } : sec
        );
        return { ...s, secrets };
      }

      case 'SECRET_ADD': {
        const sec = {
          id: 'secret-' + Date.now(),
          title: a.title, weight: a.weight || 'Scene',
          status: 'sealed', revealsTo: a.revealsTo || '',
          relates: a.relates || [],
        };
        return { ...s, secrets: [...s.secrets, sec] };
      }

      case 'SECRET_REMOVE':
        return { ...s, secrets: s.secrets.filter(sec => sec.id !== a.id) };

      case 'SECRET_SET_FIELD': {
        const secrets = s.secrets.map(sec =>
          sec.id === a.id ? { ...sec, [a.field]: a.value } : sec
        );
        return { ...s, secrets };
      }

      // ── Rumors ───────────────────────────────────────────────
      case 'RUMOR_ADD': {
        const r = { id: 'r-' + Date.now(), text: a.text, source: a.source || '', weight: a.weight || 'common' };
        return { ...s, rumors: [r, ...s.rumors] };
      }

      case 'RUMOR_REMOVE':
        return { ...s, rumors: s.rumors.filter(r => r.id !== a.id) };

      // ── Sessions ─────────────────────────────────────────────
      case 'SESSION_ADD': {
        const sess = {
          id: 'session-' + Date.now(),
          number: a.number != null ? a.number : (s.sessions.length + 1),
          title: a.title || ('Session ' + (s.sessions.length + 1)),
          bullets: a.bullets || [],
          createdAt: new Date().toISOString(),
        };
        return { ...s, sessions: [sess, ...s.sessions] };
      }

      case 'SESSION_ADD_BULLET': {
        const sessions = s.sessions.map(sess =>
          sess.id === a.id ? { ...sess, bullets: [...sess.bullets, a.text] } : sess
        );
        return { ...s, sessions };
      }

      case 'SESSION_REMOVE_BULLET': {
        const sessions = s.sessions.map(sess =>
          sess.id === a.id
            ? { ...sess, bullets: sess.bullets.filter((_, i) => i !== a.index) }
            : sess
        );
        return { ...s, sessions };
      }

      case 'SESSION_SET_FIELD': {
        const sessions = s.sessions.map(sess =>
          sess.id === a.id ? { ...sess, [a.field]: a.value } : sess
        );
        return { ...s, sessions };
      }

      case 'SESSION_REMOVE':
        return { ...s, sessions: s.sessions.filter(sess => sess.id !== a.id) };

      // ── Prep ─────────────────────────────────────────────────
      case 'PREP_ADD': {
        const item = { id: 'prep-' + Date.now(), kind: a.kind || 'beat', title: a.title, note: a.note || '' };
        return { ...s, prep: [...s.prep, item] };
      }

      case 'PREP_REMOVE':
        return { ...s, prep: s.prep.filter(p => p.id !== a.id) };

      case 'PREP_SET_FIELD': {
        const prep = s.prep.map(p =>
          p.id === a.id ? { ...p, [a.field]: a.value } : p
        );
        return { ...s, prep };
      }

      default:
        return s;
    }
  }

  // ── Public API ────────────────────────────────────────────────
  window.Store = {
    get() { return state; },

    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },

    dispatch(action) {
      state = reduce(state, action);
      save();
      notify();
    },

    // Reload store for current user (call after login)
    reload() {
      state = load();
      notify();
    },

    reset() {
      const username = window.Auth && window.Auth.session && window.Auth.session.username;
      localStorage.removeItem(storeKey());
      state = PREMIUM_DEMO_USERS.includes(username) ? demoState() : emptyState(username);
      save();
      notify();
    },
  };
})();
