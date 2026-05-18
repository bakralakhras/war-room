// War Room — per-user reactive store
// Each user gets their own isolated localStorage key.
// Exposes window.Store = { get, subscribe, dispatch, reset }

(function () {
  function storeKey() {
    const u = window.Auth && window.Auth.session && window.Auth.session.username;
    return u ? 'warroom_v1_' + u : 'warroom_v1_guest';
  }

  // ── Empty state for brand-new users ───────────────────────────
  function emptyState() {
    return {
      _new: true,
      campaign: { name: 'My Campaign', subtitle: '', session: 1, sessionsTotal: 20, nextSession: '', location: { name: '', region: '', note: '' } },
      party: [], factions: [], npcs: [], secrets: [], rumors: [],
      relics: [], lore: [], sessions: [], prep: [],
      locations: [], timeline: [], codex: [],
    };
  }

  // ── Demo data for zechi / omen ────────────────────────────────
  function demoState() {
    const c = window.CAMPAIGN;
    return {
      _new: false,
      campaign: {
        name: c.name, subtitle: c.subtitle, session: c.session,
        sessionsTotal: c.sessionsTotal, nextSession: c.nextSession,
        location: { ...c.location },
      },
      party:     c.party.map(p => ({ ...p })),
      factions:  window.FACTIONS.map(f => ({ ...f, clock: { ...f.clock } })),
      npcs:      window.NPCS.map(n => ({ ...n })),
      secrets:   window.SECRETS.map(s => ({ ...s, relates: s.relates || [], notes: '' })),
      rumors:    window.RUMORS.map(r => ({ ...r, delivered: false })),
      relics:    window.RELICS.map(r => ({ ...r })),
      lore:      window.LORE.map(l => ({ ...l })),
      sessions: [{
        id: 'session-13', number: c.session - 1,
        title: c.lastSession.title, bullets: [...c.lastSession.bullets], createdAt: null,
      }],
      prep:      c.prep.map((p, i) => ({ ...p, id: 'prep-' + i, done: false })),
      locations: window.MAP_LOCATIONS ? window.MAP_LOCATIONS.map(l => ({ ...l })) : [],
      timeline:  [],
      codex:     [],
    };
  }

  const PREMIUM_DEMO_USERS = ['zechi', 'omen'];

  function load() {
    try {
      const raw = localStorage.getItem(storeKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migrate older saves that are missing new fields
        if (!parsed.locations) parsed.locations = [];
        if (!parsed.timeline)  parsed.timeline  = [];
        if (!parsed.codex)     parsed.codex     = [];
        return parsed;
      }
    } catch (_) {}
    const username = window.Auth && window.Auth.session && window.Auth.session.username;
    return PREMIUM_DEMO_USERS.includes(username) ? demoState() : emptyState();
  }

  let state = load();
  const subs = new Set();

  function save()   { try { localStorage.setItem(storeKey(), JSON.stringify(state)); } catch (_) {} }
  function notify() { subs.forEach(fn => fn(state)); }

  // ── Reducer ───────────────────────────────────────────────────
  function reduce(s, a) {
    switch (a.type) {

      // ── Onboarding ───────────────────────────────────────────
      case 'CAMPAIGN_INIT':
        return { ...s, _new: false, campaign: { ...s.campaign, name: a.name, subtitle: a.subtitle || '', sessionsTotal: a.sessionsTotal || 20 } };

      // ── Campaign ─────────────────────────────────────────────
      case 'CAMPAIGN_SET_FIELD':
        return { ...s, campaign: { ...s.campaign, [a.field]: a.value } };
      case 'CAMPAIGN_SET_LOCATION':
        return { ...s, campaign: { ...s.campaign, location: { ...s.campaign.location, ...a.patch } } };

      // ── Party ────────────────────────────────────────────────
      case 'PARTY_SET_HP': {
        return { ...s, party: s.party.map(p => p.name === a.name ? { ...p, hp: a.cur + '/' + a.max } : p) };
      }
      case 'PARTY_ADD':
        return { ...s, party: [...s.party, { name: a.name, role: a.role, patron: a.patron || '—', hp: a.hp || '20/20', note: a.note || '' }] };
      case 'PARTY_REMOVE':
        return { ...s, party: s.party.filter(p => p.name !== a.name) };
      case 'PARTY_SET_FIELD':
        return { ...s, party: s.party.map(p => p.name === a.name ? { ...p, [a.field]: a.value } : p) };

      // ── NPCs ─────────────────────────────────────────────────
      case 'NPC_ADD': {
        const n = { id: 'npc-' + Date.now(), name: a.name, title: a.title || '', faction: a.faction || '', disposition: a.disposition || 'neutral', location: a.location || '', quote: a.quote || '', likely: false, tags: a.tags || [], wants: '', fears: '', appearance: '', voice: '', bonds: '', dmNote: '' };
        return { ...s, npcs: [...s.npcs, n] };
      }
      case 'NPC_REMOVE':
        return { ...s, npcs: s.npcs.filter(n => n.id !== a.id) };
      case 'NPC_SET_FIELD':
        return { ...s, npcs: s.npcs.map(n => n.id === a.id ? { ...n, [a.field]: a.value } : n) };

      // ── Factions ─────────────────────────────────────────────
      case 'FACTION_CLOCK_SET': {
        return { ...s, factions: s.factions.map(f => {
          if (f.id !== a.id) return f;
          return { ...f, clock: { ...f.clock, filled: Math.max(0, Math.min(a.filled, f.clock.segments)) } };
        })};
      }
      case 'FACTION_SET_DISPOSITION':
        return { ...s, factions: s.factions.map(f => f.id === a.id ? { ...f, disposition: a.disposition } : f) };
      case 'FACTION_SET_FIELD':
        return { ...s, factions: s.factions.map(f => f.id === a.id ? { ...f, [a.field]: a.value } : f) };
      case 'FACTION_ADD': {
        const f = { id: 'faction-' + Date.now(), name: a.name, sigil: a.sigil || 'concord', ideology: a.ideology || '', leader: a.leader || '', seat: a.seat || '', disposition: a.disposition || 'neutral', clock: { segments: a.segments || 6, filled: 0, label: a.clockLabel || '' }, color: a.color || 'iron', summary: a.summary || '' };
        return { ...s, factions: [...s.factions, f] };
      }
      case 'FACTION_REMOVE':
        return { ...s, factions: s.factions.filter(f => f.id !== a.id) };

      // ── Secrets ──────────────────────────────────────────────
      case 'SECRET_SET_STATUS':
        return { ...s, secrets: s.secrets.map(sec => sec.id === a.id ? { ...sec, status: a.status } : sec) };
      case 'SECRET_SET_FIELD':
        return { ...s, secrets: s.secrets.map(sec => sec.id === a.id ? { ...sec, [a.field]: a.value } : sec) };
      case 'SECRET_ADD': {
        const sec = { id: 'secret-' + Date.now(), title: a.title, weight: a.weight || 'Scene', status: 'sealed', revealsTo: a.revealsTo || '', relates: [], notes: '' };
        return { ...s, secrets: [...s.secrets, sec] };
      }
      case 'SECRET_REMOVE':
        return { ...s, secrets: s.secrets.filter(sec => sec.id !== a.id) };

      // ── Rumors ───────────────────────────────────────────────
      case 'RUMOR_ADD': {
        const r = { id: 'r-' + Date.now(), text: a.text, source: a.source || '', weight: a.weight || 'common', delivered: false };
        return { ...s, rumors: [r, ...s.rumors] };
      }
      case 'RUMOR_REMOVE':
        return { ...s, rumors: s.rumors.filter(r => r.id !== a.id) };
      case 'RUMOR_SET_FIELD':
        return { ...s, rumors: s.rumors.map(r => r.id === a.id ? { ...r, [a.field]: a.value } : r) };
      case 'RUMOR_TOGGLE_DELIVERED':
        return { ...s, rumors: s.rumors.map(r => r.id === a.id ? { ...r, delivered: !r.delivered } : r) };

      // ── Sessions ─────────────────────────────────────────────
      case 'SESSION_ADD': {
        const sess = { id: 'session-' + Date.now(), number: a.number != null ? a.number : (s.sessions.length + 1), title: a.title || ('Session ' + (s.sessions.length + 1)), bullets: a.bullets || [], createdAt: new Date().toISOString() };
        return { ...s, sessions: [sess, ...s.sessions] };
      }
      case 'SESSION_ADD_BULLET':
        return { ...s, sessions: s.sessions.map(sess => sess.id === a.id ? { ...sess, bullets: [...sess.bullets, a.text] } : sess) };
      case 'SESSION_REMOVE_BULLET':
        return { ...s, sessions: s.sessions.map(sess => sess.id === a.id ? { ...sess, bullets: sess.bullets.filter((_, i) => i !== a.index) } : sess) };
      case 'SESSION_SET_FIELD':
        return { ...s, sessions: s.sessions.map(sess => sess.id === a.id ? { ...sess, [a.field]: a.value } : sess) };
      case 'SESSION_REMOVE':
        return { ...s, sessions: s.sessions.filter(sess => sess.id !== a.id) };

      // ── Prep ─────────────────────────────────────────────────
      case 'PREP_ADD': {
        const item = { id: 'prep-' + Date.now(), kind: a.kind || 'beat', title: a.title, note: a.note || '', done: false };
        return { ...s, prep: [...s.prep, item] };
      }
      case 'PREP_REMOVE':
        return { ...s, prep: s.prep.filter(p => p.id !== a.id) };
      case 'PREP_SET_FIELD':
        return { ...s, prep: s.prep.map(p => p.id === a.id ? { ...p, [a.field]: a.value } : p) };
      case 'PREP_TOGGLE_DONE':
        return { ...s, prep: s.prep.map(p => p.id === a.id ? { ...p, done: !p.done } : p) };
      case 'PREP_CARRY_FORWARD': {
        // Move undone prep items to a fresh list (used between sessions)
        const kept = s.prep.filter(p => !p.done);
        return { ...s, prep: kept.map(p => ({ ...p, done: false })) };
      }

      // ── Locations (Map) ───────────────────────────────────────
      case 'LOCATION_ADD': {
        const loc = { id: 'loc-' + Date.now(), label: a.label || 'New Location', name: a.label || 'New Location', x: a.x, y: a.y, kind: a.kind || 'town', note: '', party: false, flagged: false };
        return { ...s, locations: [...s.locations, loc] };
      }
      case 'LOCATION_REMOVE':
        return { ...s, locations: s.locations.filter(l => l.id !== a.id) };
      case 'LOCATION_SET_FIELD':
        return { ...s, locations: s.locations.map(l => l.id === a.id ? { ...l, [a.field]: a.value } : l) };
      case 'LOCATION_SET_PARTY': {
        // Only one location can be "party is here"
        return { ...s, locations: s.locations.map(l => ({ ...l, party: l.id === a.id })) };
      }

      // ── Timeline ─────────────────────────────────────────────
      case 'TIMELINE_ADD': {
        const ev = { id: 'ev-' + Date.now(), worldDate: a.worldDate || '', sessionRef: a.sessionRef || '', title: a.title || '', description: a.description || '', createdAt: new Date().toISOString() };
        return { ...s, timeline: [ev, ...s.timeline] };
      }
      case 'TIMELINE_REMOVE':
        return { ...s, timeline: s.timeline.filter(e => e.id !== a.id) };
      case 'TIMELINE_SET_FIELD':
        return { ...s, timeline: s.timeline.map(e => e.id === a.id ? { ...e, [a.field]: a.value } : e) };

      // ── Codex ────────────────────────────────────────────────
      case 'CODEX_ADD': {
        const entry = { id: 'codex-' + Date.now(), title: a.title || 'Untitled Entry', body: '', tags: [], createdAt: new Date().toISOString() };
        return { ...s, codex: [entry, ...s.codex] };
      }
      case 'CODEX_REMOVE':
        return { ...s, codex: s.codex.filter(e => e.id !== a.id) };
      case 'CODEX_SET_FIELD':
        return { ...s, codex: s.codex.map(e => e.id === a.id ? { ...e, [a.field]: a.value } : e) };

      default:
        return s;
    }
  }

  // ── Public API ────────────────────────────────────────────────
  window.Store = {
    get()          { return state; },
    subscribe(fn)  { subs.add(fn); return () => subs.delete(fn); },
    dispatch(action) { state = reduce(state, action); save(); notify(); },
    reload()       { state = load(); notify(); },
    reset() {
      const username = window.Auth && window.Auth.session && window.Auth.session.username;
      localStorage.removeItem(storeKey());
      state = PREMIUM_DEMO_USERS.includes(username) ? demoState() : emptyState();
      save(); notify();
    },
  };
})();
