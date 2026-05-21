// War Room — per-user reactive store
// Each user gets their own isolated localStorage key.
// Exposes window.Store = { get, subscribe, dispatch, reset }

(function () {
  const DEFAULT_THEME = 'ashen-table';

  function storeKey() {
    const u = window.Auth && window.Auth.session && window.Auth.session.username;
    return u ? 'warroom_v1_' + u : 'warroom_v1_guest';
  }

  // ── Empty state for brand-new users ───────────────────────────
  function emptyState() {
    return {
      _new: true,
      campaign: { name: 'My Campaign', subtitle: '', session: 1, sessionsTotal: 20, nextSession: '', theme: DEFAULT_THEME, location: { name: '', region: '', note: '' } },
      party: [], factions: [], npcs: [], secrets: [], rumors: [],
      quests: [], religions: [], relics: [], lore: [], relationships: { nodes: [], edges: [] },
      encounters: [], calendar: [], handouts: [], tables: [],
      sessions: [], prep: [], locations: [], timeline: [], codex: [],
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
        theme: DEFAULT_THEME,
        location: { ...c.location },
      },
      party:     c.party.map(p => ({ ...p })),
      factions:  window.FACTIONS.map(f => ({ ...f, clock: { ...f.clock } })),
      npcs:      window.NPCS.map(n => ({ ...n })),
      secrets:   window.SECRETS.map(s => ({ ...s, relates: s.relates || [], notes: '' })),
      rumors:    window.RUMORS.map(r => ({ ...r, delivered: false })),
      quests:    window.QUESTS.map(q => ({ ...q })),
      religions: window.RELIGIONS.map(r => ({ ...r })),
      relics:    window.RELICS.map(r => ({ ...r })),
      lore:      window.LORE.map(l => ({ ...l })),
      relationships: {
        nodes: window.RELATIONSHIPS.nodes.map(n => ({ ...n })),
        edges: window.RELATIONSHIPS.edges.map(e => ({ ...e })),
      },
      encounters: window.ENCOUNTERS ? window.ENCOUNTERS.map(e => ({ ...e, enemies: (e.enemies || []).map(en => ({ ...en })) })) : [],
      calendar:   window.CALENDAR   ? window.CALENDAR.map(e => ({ ...e }))   : [],
      handouts:   window.HANDOUTS   ? window.HANDOUTS.map(h => ({ ...h }))   : [],
      tables:     window.TABLES     ? window.TABLES.map(t => ({ ...t, entries: [...(t.entries || [])], lastRoll: null })) : [],
      sessions: [{
        id: 'session-13', number: c.session - 1,
        title: c.lastSession.title, bullets: [...c.lastSession.bullets], createdAt: null,
        date: '7 Vael', location: 'Ashen Hollow · The Drowned Lantern',
        recap: 'The party descended into the flooded cellars and found Ferren\'s study stripped bare — save for the half-burned ledger floating face-down in six inches of black water. Halsane recognized Marda\'s brother\'s signet and went silent. Whatever she knows, she did not say. Sable took a wax-sealed letter from the body on the stairs before anyone else could read the seal.',
      }],
      prep:      c.prep.map((p, i) => ({ ...p, id: 'prep-' + i, done: false })),
      locations: window.MAP_LOCATIONS ? window.MAP_LOCATIONS.map(l => ({ ...l })) : [],
      timeline:  window.TIMELINE ? window.TIMELINE.map(e => ({ ...e })) : [],
      codex:     [],
    };
  }

  const PREMIUM_DEMO_USERS = ['zechi', 'omen'];

  function migrateState(parsed) {
    if (!parsed.campaign) parsed.campaign = emptyState().campaign;
    parsed.campaign = {
      ...emptyState().campaign,
      ...parsed.campaign,
      theme: parsed.campaign.theme || DEFAULT_THEME,
      location: { ...emptyState().campaign.location, ...(parsed.campaign.location || {}) },
    };
    return parsed;
  }

  function load() {
    const username = window.Auth && window.Auth.session && window.Auth.session.username;
    try {
      const raw = localStorage.getItem(storeKey());
      if (raw) {
        const parsed = migrateState(JSON.parse(raw));
        // Migrate older saves that are missing new fields
        if (!parsed.locations) parsed.locations = [];
        if (!parsed.timeline)  parsed.timeline  = [];
        if (!parsed.codex)     parsed.codex     = [];
        if (!parsed.quests)    parsed.quests    = window.QUESTS ? window.QUESTS.map(q => ({ ...q })) : [];
        if (!parsed.religions) parsed.religions = window.RELIGIONS ? window.RELIGIONS.map(r => ({ ...r })) : [];
        if (!parsed.relics)    parsed.relics    = window.RELICS ? window.RELICS.map(r => ({ ...r })) : [];
        if (!parsed.lore)      parsed.lore      = window.LORE ? window.LORE.map(l => ({ ...l })) : [];
        if (!parsed.relationships) parsed.relationships = window.RELATIONSHIPS
          ? { nodes: window.RELATIONSHIPS.nodes.map(n => ({ ...n })), edges: window.RELATIONSHIPS.edges.map(e => ({ ...e })) }
          : { nodes: [], edges: [] };
        if (!parsed.encounters) parsed.encounters = [];
        if (!parsed.calendar)   parsed.calendar   = [];
        if (!parsed.handouts)   parsed.handouts   = [];
        if (!parsed.tables)     parsed.tables     = [];
        // Merge new seeded items by id (doesn't overwrite existing user entries)
        if (window.HANDOUTS) {
          const have = new Set(parsed.handouts.map(h => h.id));
          window.HANDOUTS.forEach(h => { if (!have.has(h.id)) parsed.handouts.push({ ...h }); });
        }
        if (window.TABLES) {
          const have = new Set(parsed.tables.map(t => t.id));
          window.TABLES.forEach(t => { if (!have.has(t.id)) parsed.tables.push({ ...t, entries: [...(t.entries || [])], lastRoll: null }); });
        }
        if (window.RELICS) {
          const have = new Set(parsed.relics.map(r => r.id));
          window.RELICS.forEach(r => { if (!have.has(r.id)) parsed.relics.push({ category: r.category || 'relic', type: r.type || r.kind || 'relic', image: r.image || '', ...r }); });
        }
        if (window.CALENDAR) {
          const have = new Set(parsed.calendar.map(c => c.id));
          window.CALENDAR.forEach(c => { if (!have.has(c.id)) parsed.calendar.push({ ...c }); });
        }
        if (!parsed.inspiration) parsed.inspiration = [];
        if (window.INSPO) {
          const have = new Set(parsed.inspiration.map(i => i.id));
          window.INSPO.forEach(i => { if (!have.has(i.id)) parsed.inspiration.push({ ...i }); });
        }
        parsed.codex = (parsed.codex || []).map(e => ({ folder: '', attributes: [], ...e }));
        parsed.quests = (parsed.quests || []).map(q => ({ public: false, ...q }));
        parsed.npcs = (parsed.npcs || []).map(n => ({ public: false, image: '', ...n }));
        parsed.locations = (parsed.locations || []).map(l => ({ public: false, ...l }));
        parsed.relics = parsed.relics.map(r => ({
          category: r.category || (String(r.kind || '').toLowerCase() === 'relic' ? 'relic' : 'item'),
          type: r.type || r.kind || 'relic',
          image: r.image || '',
          ...r
        }));
        parsed.codex = parsed.codex.map(e => ({ type: 'lore', pinned: false, ...e }));
        if (!username && parsed._new && !parsed.npcs?.length && !parsed.factions?.length) return demoState();
        return parsed;
      }
    } catch (_) {}
    return (!username || PREMIUM_DEMO_USERS.includes(username)) ? demoState() : emptyState();
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
        return { ...s, _new: false, campaign: { ...s.campaign, name: a.name, subtitle: a.subtitle || '', sessionsTotal: a.sessionsTotal || 20, theme: s.campaign.theme || DEFAULT_THEME } };

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
        const n = { id: 'npc-' + Date.now(), name: a.name, title: a.title || '', faction: a.faction || '', disposition: a.disposition || 'neutral', location: a.location || '', quote: a.quote || '', likely: false, public: false, image: a.image || '', tags: a.tags || [], wants: '', fears: '', appearance: '', voice: '', bonds: [], dmNote: '' };
        return { ...s, npcs: [...s.npcs, n] };
      }
      case 'NPC_REMOVE':
        return { ...s, npcs: s.npcs.filter(n => n.id !== a.id) };
      case 'NPC_SET_FIELD': {
        const nextNpcs = s.npcs.map(n => n.id === a.id ? { ...n, [a.field]: a.value } : n);
        const next = { ...s, npcs: nextNpcs };
        if (a.field === 'name' && next.relationships?.nodes) {
          next.relationships = {
            ...next.relationships,
            nodes: next.relationships.nodes.map(n => n.id === a.id ? { ...n, label: a.value } : n)
          };
        }
        return next;
      }

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
        const sec = { id: 'secret-' + Date.now(), title: a.title, weight: a.weight || 'Scene', status: 'sealed', revealsTo: a.revealsTo || '', relates: a.relates || [], notes: '', onReveal: a.onReveal || '' };
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

      // Quests
      case 'QUEST_ADD': {
        const q = { id: 'quest-' + Date.now(), title: a.title || 'Untitled quest', arc: a.arc || 'Main', state: a.state || 'active', public: !!a.public, note: a.note || '', giver: a.giver || '', next: a.next || '', stakes: a.stakes || '', step: a.step != null ? a.step : 0, total: a.total != null ? a.total : 3 };
        return { ...s, quests: [q, ...s.quests] };
      }
      case 'QUEST_SET_FIELD':
        return { ...s, quests: s.quests.map(q => q.id === a.id ? { ...q, [a.field]: a.value } : q) };
      case 'QUEST_REMOVE':
        return { ...s, quests: s.quests.filter(q => q.id !== a.id) };

      // ── Sessions ─────────────────────────────────────────────
      case 'SESSION_ADD': {
        const sess = { id: 'session-' + Date.now(), number: a.number != null ? a.number : (s.sessions.length + 1), title: a.title || ('Session ' + (s.sessions.length + 1)), bullets: a.bullets || [], createdAt: new Date().toISOString(), date: a.date || '', location: a.location || '', recap: a.recap || '' };
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
        const loc = { id: 'loc-' + Date.now(), label: a.label || 'New Location', name: a.label || 'New Location', x: a.x, y: a.y, kind: a.kind || 'town', note: '', party: false, flagged: false, public: false };
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
        const ev = {
          id: 'ev-' + Date.now(),
          era: a.era || 'Now',
          marker: a.marker || 'I',
          title: a.title || 'Untitled event',
          note: a.note || a.description || '',
          party: !!a.party,
          flagged: !!a.flagged,
          upcoming: !!a.upcoming,
          worldDate: a.worldDate || '',
          sessionRef: a.sessionRef || '',
          description: a.description || a.note || '',
          createdAt: new Date().toISOString()
        };
        return { ...s, timeline: [ev, ...s.timeline] };
      }
      case 'TIMELINE_REMOVE':
        return { ...s, timeline: s.timeline.filter(e => e.id !== a.id) };
      case 'TIMELINE_SET_FIELD':
        return { ...s, timeline: s.timeline.map(e => e.id === a.id ? { ...e, [a.field]: a.value } : e) };

      // ── Codex ────────────────────────────────────────────────
      case 'CODEX_ADD': {
        const entry = {
          id: 'codex-' + Date.now(),
          title: a.title || 'Untitled Entry',
          body: a.body || '',
          tags: [],
          type: a.entryType || 'lore',
          pinned: false,
          folder: a.folder || '',
          attributes: a.attributes || [],
          createdAt: new Date().toISOString(),
        };
        return { ...s, codex: [entry, ...s.codex] };
      }
      case 'CODEX_REMOVE':
        return { ...s, codex: s.codex.filter(e => e.id !== a.id) };
      case 'CODEX_SET_FIELD':
        return { ...s, codex: s.codex.map(e => e.id === a.id ? { ...e, [a.field]: a.value } : e) };

      // Relics
      case 'RELIC_ADD': {
        const relic = { id: 'relic-' + Date.now(), name: a.name || 'Unnamed relic', category: a.category || 'relic', type: a.itemType || a.kind || 'relic', kind: a.itemType || a.kind || 'relic', desc: a.desc || '', image: a.image || '' };
        return { ...s, relics: [relic, ...s.relics] };
      }
      case 'RELIC_SET_FIELD':
        return { ...s, relics: s.relics.map(r => r.id === a.id ? { ...r, [a.field]: a.value } : r) };
      case 'RELIC_REMOVE':
        return { ...s, relics: s.relics.filter(r => r.id !== a.id) };

      case 'STORE_IMPORT':
        return migrateState({ ...s, ...a.state });

      // Encounters
      case 'ENCOUNTER_ADD': {
        const encounter = { id: 'encounter-' + Date.now(), title: a.title || 'Untitled encounter', location: a.location || '', threat: a.threat || 'medium', status: a.status || 'planned', notes: a.notes || '', enemies: [], session: a.session || '' };
        return { ...s, encounters: [encounter, ...(s.encounters || [])] };
      }
      case 'ENCOUNTER_SET_FIELD':
        return { ...s, encounters: (s.encounters || []).map(e => e.id === a.id ? { ...e, [a.field]: a.value } : e) };
      case 'ENCOUNTER_REMOVE':
        return { ...s, encounters: (s.encounters || []).filter(e => e.id !== a.id) };
      case 'ENCOUNTER_ENEMY_ADD': {
        const enemy = { id: 'en-' + Date.now(), name: a.name || 'Enemy', count: a.count || 1, hp: a.hp || 10, maxHp: a.hp || 10, ac: a.ac || 12, note: a.note || '' };
        return { ...s, encounters: (s.encounters || []).map(e => e.id === a.id ? { ...e, enemies: [...(e.enemies || []), enemy] } : e) };
      }
      case 'ENCOUNTER_ENEMY_SET': {
        return { ...s, encounters: (s.encounters || []).map(e => e.id === a.encId ? { ...e, enemies: (e.enemies || []).map(en => en.id === a.enemyId ? { ...en, [a.field]: a.value } : en) } : e) };
      }
      case 'ENCOUNTER_ENEMY_REMOVE': {
        return { ...s, encounters: (s.encounters || []).map(e => e.id === a.encId ? { ...e, enemies: (e.enemies || []).filter(en => en.id !== a.enemyId) } : e) };
      }

      // Calendar
      case 'CALENDAR_ADD': {
        const event = { id: 'cal-' + Date.now(), date: a.date || '', title: a.title || 'Untitled date', kind: a.kind || 'world', notes: a.notes || '' };
        return { ...s, calendar: [event, ...(s.calendar || [])] };
      }
      case 'CALENDAR_SET_FIELD':
        return { ...s, calendar: (s.calendar || []).map(e => e.id === a.id ? { ...e, [a.field]: a.value } : e) };
      case 'CALENDAR_REMOVE':
        return { ...s, calendar: (s.calendar || []).filter(e => e.id !== a.id) };

      // Handouts
      case 'HANDOUT_ADD': {
        const handout = { id: 'handout-' + Date.now(), title: a.title || 'Untitled handout', kind: a.kind || 'note', body: a.body || '', image: a.image || '', public: !!a.public };
        return { ...s, handouts: [handout, ...(s.handouts || [])] };
      }
      case 'HANDOUT_SET_FIELD':
        return { ...s, handouts: (s.handouts || []).map(h => h.id === a.id ? { ...h, [a.field]: a.value } : h) };
      case 'HANDOUT_REMOVE':
        return { ...s, handouts: (s.handouts || []).filter(h => h.id !== a.id) };

      // Random tables
      case 'TABLE_ADD': {
        const table = { id: 'table-' + Date.now(), title: a.title || 'Untitled table', die: a.die || 'd6', entries: a.entries || [''], lastRoll: null };
        return { ...s, tables: [table, ...(s.tables || [])] };
      }
      case 'TABLE_SET_FIELD':
        return { ...s, tables: (s.tables || []).map(t => t.id === a.id ? { ...t, [a.field]: a.value } : t) };
      case 'TABLE_REMOVE':
        return { ...s, tables: (s.tables || []).filter(t => t.id !== a.id) };
      case 'TABLE_ROLL': {
        const rolled = (s.tables || []).map(t => {
          if (t.id !== a.id) return t;
          const entries = (t.entries || []).filter(Boolean);
          const index = entries.length ? Math.floor(Math.random() * entries.length) : 0;
          return { ...t, lastRoll: entries.length ? { index, text: entries[index], at: new Date().toISOString() } : null };
        });
        return { ...s, tables: rolled };
      }
      // Relationships board
      case 'REL_NODE_MOVE': {
        const nodes = s.relationships.nodes.map(n => n.id === a.id ? { ...n, x: a.x, y: a.y } : n);
        return { ...s, relationships: { ...s.relationships, nodes } };
      }
      case 'REL_NODE_ADD': {
        if (s.relationships.nodes.some(n => n.id === a.id)) return s;
        const node = { id: a.id, label: a.label || a.id, kind: a.kind || 'noble', x: a.x || 0.5, y: a.y || 0.5, ring: a.ring || '' };
        return { ...s, relationships: { ...s.relationships, nodes: [...s.relationships.nodes, node] } };
      }
      case 'REL_NODE_REMOVE': {
        const nodes = s.relationships.nodes.filter(n => n.id !== a.id);
        const edges = s.relationships.edges.filter(e => e.a !== a.id && e.b !== a.id);
        return { ...s, relationships: { nodes, edges } };
      }
      case 'REL_EDGE_ADD': {
        const edge = { a: a.a, b: a.b, rel: a.rel || 'ally', label: a.label || '', secret: !!a.secret };
        return { ...s, relationships: { ...s.relationships, edges: [...s.relationships.edges, edge] } };
      }
      case 'REL_EDGE_REMOVE': {
        const edges = s.relationships.edges.filter((_, i) => i !== a.index);
        return { ...s, relationships: { ...s.relationships, edges } };
      }

      // ── Inspiration board ──────────────────────────────────
      case 'INSPO_ADD': {
        const item = { id: 'inspo-' + Date.now(), createdAt: Date.now(), tags: [], ...a.item };
        return { ...s, inspiration: [item, ...(s.inspiration || [])] };
      }
      case 'INSPO_REMOVE':
        return { ...s, inspiration: (s.inspiration || []).filter(i => i.id !== a.id) };
      case 'INSPO_SET_FIELD':
        return { ...s, inspiration: (s.inspiration || []).map(i => i.id === a.id ? { ...i, [a.field]: a.value } : i) };

      default:
        return s;
    }
  }

  // ── Public API ────────────────────────────────────────────────
  window.Store = {
    get()          { return state; },
    subscribe(fn)  { subs.add(fn); return () => subs.delete(fn); },
    dispatch(action) {
      if (action && action.type === 'RELIC_ADD') {
        const relic = {
          id: 'relic-' + Date.now(),
          name: action.name || 'Unnamed item',
          category: action.category || 'item',
          type: action.itemType || action.kind || action.category || 'item',
          kind: action.itemType || action.kind || action.category || 'item',
          desc: action.desc || '',
          image: action.image || ''
        };
        state = { ...state, relics: [relic, ...(state.relics || [])] };
        save(); notify(); return;
      }
      if (action && action.type === 'RELIC_SET_FIELD') {
        state = { ...state, relics: (state.relics || []).map(r => r.id === action.id ? { ...r, [action.field]: action.value } : r) };
        save(); notify(); return;
      }
      if (action && action.type === 'RELIC_REMOVE') {
        state = { ...state, relics: (state.relics || []).filter(r => r.id !== action.id) };
        save(); notify(); return;
      }
      state = reduce(state, action); save(); notify();
      const TOAST_MAP = {
        NPC_ADD:       { msg: 'Character added',     icon: '✦' },
        QUEST_ADD:     { msg: 'Quest created',        icon: '⚔' },
        SESSION_ADD:   { msg: 'Session logged',       icon: '📜' },
        PREP_ADD:      { msg: 'Prep item added',      icon: '✦' },
        RUMOR_ADD:     { msg: 'Rumor pinned',         icon: '👁' },
        INSPO_ADD:     { msg: 'Inspiration captured', icon: '✦' },
        ENCOUNTER_ADD: { msg: 'Encounter saved',      icon: '⚔' },
        FACTION_ADD:   { msg: 'Faction created',      icon: '✦' },
        HANDOUT_ADD:   { msg: 'Handout added',        icon: '✦' },
        REL_NODE_ADD:  { msg: 'Node added to board',  icon: '✦' },
        SECRET_ADD:    { msg: 'Secret sealed',        icon: '🔒' },
        CALENDAR_ADD:  { msg: 'Event added',          icon: '✦' },
        TABLE_ADD:     { msg: 'Table created',        icon: '✦' },
      };
      if (action && TOAST_MAP[action.type] && window.toast) {
        const t = TOAST_MAP[action.type];
        window.toast(t.msg, { icon: t.icon });
      }
    },
    reload()       { state = load(); notify(); },
    reset() {
      const username = window.Auth && window.Auth.session && window.Auth.session.username;
      localStorage.removeItem(storeKey());
      state = (!username || PREMIUM_DEMO_USERS.includes(username)) ? demoState() : emptyState();
      save(); notify();
    },
  };

  window.addEventListener('storage', (event) => {
    if (event.key !== storeKey()) return;
    state = load();
    notify();
  });
})();
