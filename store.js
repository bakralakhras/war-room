// War Room — per-user, per-campaign reactive store
// Data lives in localStorage; Supabase Realtime is used only for broadcasting
// the public state to connected player views.

(function () {
  const DEFAULT_THEME = 'ashen-table';
  const DEFAULT_CODEX_FOLDERS = ['Lore', 'Characters', 'Locations', 'Factions', 'Relics', 'Session Notes', 'Mysteries', 'Secrets', 'Quests'];

  // ── User identity ─────────────────────────────────────────────
  // Read from window.Auth if available, else fall back to Supabase's
  // own localStorage cache so we get the right key at parse time.
  function userId() {
    if (window.Auth?.session?.id) return window.Auth.session.id;
    try {
      const raw = JSON.parse(localStorage.getItem('sb-mqnsbxdxpdekykvyclyx-auth-token') || 'null');
      return raw?.user?.id || 'guest';
    } catch { return 'guest'; }
  }

  // ── Storage keys ──────────────────────────────────────────────
  function campaignsKey() { return `warroom_campaigns_${userId()}`; }
  function stateKey(cid)  { return `warroom_state_${userId()}_${cid}`; }
  function activeKey()    { return `warroom_active_${userId()}`; }

  // ── Campaign index ────────────────────────────────────────────
  function loadIndex() {
    try { return JSON.parse(localStorage.getItem(campaignsKey()) || '[]'); } catch { return []; }
  }
  function saveIndex(list) { localStorage.setItem(campaignsKey(), JSON.stringify(list)); }

  function ensureIndex() {
    let list = loadIndex();
    if (list.length > 0) return list;
    const id = crypto.randomUUID();
    list = [{ id, name: 'My Campaign', createdAt: new Date().toISOString() }];
    saveIndex(list);
    localStorage.setItem(activeKey(), id);
    return list;
  }

  function getActiveCampaignId() {
    const list = ensureIndex();
    const stored = localStorage.getItem(activeKey());
    if (stored && list.some(c => c.id === stored)) return stored;
    const id = list[0].id;
    localStorage.setItem(activeKey(), id);
    return id;
  }

  // ── Empty / demo states ───────────────────────────────────────
  function emptyState() {
    return {
      _new: true,
      campaign: { name: 'My Campaign', subtitle: '', session: 1, sessionsTotal: 20, nextSession: '', theme: DEFAULT_THEME, location: { name: '', region: '', note: '' } },
      party: [], factions: [], npcs: [], secrets: [], rumors: [],
      quests: [], religions: [], relics: [], lore: [], relationships: { nodes: [], edges: [] },
      encounters: [], calendar: [], handouts: [], tables: [],
      sessions: [], prep: [], locations: [], timeline: [], codex: [], codexFolders: [...DEFAULT_CODEX_FOLDERS],
    };
  }

  function demoState() {
    const c = window.CAMPAIGN;
    const seededCodex = seedCodexFromWorldData();
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
      npcs:      window.NPCS.map(n => withNpcImageRef({ ...n })),
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
      codex:     seededCodex,
      codexFolders: [...DEFAULT_CODEX_FOLDERS],
    };
  }

  function tableDemoState() {
    const base = demoState();
    const now = new Date().toISOString();
    const playerRoster = [
      {
        id: 'samira',
        name: 'Samira Vale',
        email: 'samira.player@war-room.demo',
        characterId: 'marda-stonebrew',
        character: 'Marda Stonebrew',
        role: 'Dwarven cleric of the Pale Moon',
        hook: 'Your brother died carrying the signet. Halsane knows more than she says.',
      },
      {
        id: 'theo',
        name: 'Theo Marr',
        email: 'theo.player@war-room.demo',
        characterId: 'aelric-vorn',
        character: 'Aelric Vorn',
        role: 'Half-elf warlock of the Hollow Sovereign',
        hook: 'Your patron speaks in a dead king\'s voice and wants the throne room opened.',
      },
    ];
    const publicNpcIds = new Set(['halsane', 'caedren', 'theron']);
    const publicQuestIds = new Set(['q1', 'q2', 'q3']);
    const publicLocationIds = new Set(['cinderhold', 'greymarch', 'ashen-hollow', 'cloister', 'garden']);
    const publicHandoutIds = new Set(['handout-3']);
    return {
      ...base,
      campaign: {
        ...base.campaign,
        name: 'The Black Bell of Vaelthorne',
        subtitle: 'Two heirs, one drowned bell, and a crown that remembers murder.',
        session: 1,
        sessionsTotal: 10,
        nextSession: 'Sat, 27 Vael · 7:00 PM',
        theme: 'grave-crown',
        location: {
          name: 'Ashen Hollow',
          region: 'The Margreave',
          note: 'A flooded mining village where the church bell rings from underwater.',
        },
        dmUser: {
          id: 'ardenna',
          name: 'Ardenna Vale',
          email: 'ardenna.dm@war-room.demo',
          role: 'Dungeon Master',
          title: 'Keeper of the Black Bell',
        },
        playerRoster,
        demoUsers: [
          { id: 'ardenna', name: 'Ardenna Vale', email: 'ardenna.dm@war-room.demo', role: 'DM' },
          { id: 'samira', name: 'Samira Vale', email: 'samira.player@war-room.demo', role: 'Player', character: 'Marda Stonebrew' },
          { id: 'theo', name: 'Theo Marr', email: 'theo.player@war-room.demo', role: 'Player', character: 'Aelric Vorn' },
        ],
        demoPitch: 'A three-user demo table: Ardenna runs the campaign, Samira receives Marda-facing hooks, and Theo receives Aelric-facing hooks.',
      },
      party: [
        { name: 'Marda Stonebrew', role: 'Dwarven Cleric', patron: 'Order of the Pale Moon', hp: '61/61', note: 'Her brother died with the rose signet in his mouth.' },
        { name: 'Aelric Vorn', role: 'Half-elf Warlock', patron: 'The Hollow Sovereign', hp: '38/52', note: 'His patron is a voice from the drowned throne.' },
      ],
      npcs: base.npcs.map(n => ({ ...n, public: publicNpcIds.has(n.id), likely: ['halsane', 'theron', 'caedren'].includes(n.id) })),
      quests: base.quests.map(q => ({
        ...q,
        public: publicQuestIds.has(q.id),
        state: q.id === 'q4' ? 'dormant' : q.state,
      })),
      locations: base.locations.map(l => ({
        ...l,
        public: publicLocationIds.has(l.id),
        party: l.id === 'ashen-hollow',
      })),
      secrets: base.secrets.map(s => ({
        ...s,
        status: s.id === 's5' ? 'revealed' : s.id === 's4' || s.id === 's8' ? 'cracked' : 'sealed',
      })),
      handouts: [
        ...base.handouts.map(h => ({ ...h, public: publicHandoutIds.has(h.id) })),
        {
          id: 'handout-demo-marda',
          title: 'Marda\'s Signet Dream',
          kind: 'vision',
          body: 'You dream of your brother under black water. He opens his hand. The signet is not a ring anymore. It is a tiny bell, ringing without sound.',
          public: true,
        },
        {
          id: 'handout-demo-aelric',
          title: 'Aelric\'s Patron Whisper',
          kind: 'vision',
          body: 'The Hollow Sovereign says: bring me beneath the roses, and I will tell you which king is still breathing.',
          public: true,
        },
      ],
      rumors: base.rumors.map(r => ({ ...r, delivered: false })),
      prep: [
        { id: 'prep-demo-1', kind: 'scene', title: 'Open on the drowned bell', note: 'The bell rings from under the chapel floor. Only Marda can hear the second tone.', done: false },
        { id: 'prep-demo-2', kind: 'scene', title: 'Aelric receives the throne-voice', note: 'Offer a bargain: one true answer for one childhood memory.', done: false },
        { id: 'prep-demo-3', kind: 'beat', title: 'Publish the Iron Writ', note: 'Show players the public proclamation, then let Concord soldiers arrive.', done: false },
        { id: 'prep-demo-4', kind: 'beat', title: 'Crack the ledger secret', note: 'If they read page 6, advance s4 and tick Veiled Hand.', done: false },
      ],
      sessions: [{
        id: 'session-demo-0',
        number: 0,
        title: 'Session Zero · The Table Oath',
        date: 'Before Vael',
        location: 'The Black Bell Chapel',
        bullets: [
          'Samira chose Marda Stonebrew, cleric of the Pale Moon.',
          'Theo chose Aelric Vorn, warlock of the Hollow Sovereign.',
          'Both players agreed: court horror, occult mystery, no clean crowns.',
        ],
        recap: 'The table agreed to a dark royal mystery where grief is political, miracles cost memory, and every public truth has a private owner.',
        createdAt: now,
      }],
      codex: [
        {
          id: 'codex-demo-table',
          title: 'Demo Table: The Black Bell',
          body: '## Cast\nArdenna Vale runs the room. Samira plays Marda Stonebrew. Theo plays Aelric Vorn.\n\n## Player-safe premise\nThe king is dead, the Regent smiles too warmly, and the drowned chapel bell has begun to ring again.\n\n## Keeper notes\nUse Player View to publish only the Iron Writ, known NPCs, and active quests. Keep the Hollow Child, the patron truth, and Ferren alive as DM-only pressure.',
          tags: ['demo', 'table'],
          type: 'session',
          pinned: true,
          folder: 'Session Notes',
          attributes: [{ key: 'Users', value: '1 DM · 2 Players' }],
          linkedIds: [],
          createdAt: now,
          updatedAt: now,
        },
        ...base.codex,
      ],
    };
  }

  function seedCodexFromWorldData(source = {}) {
    const now = new Date().toISOString();
    const loreSource     = source.lore      || window.LORE      || [];
    const religionSource = source.religions || window.RELIGIONS || [];
    const relicSource    = source.relics    || window.RELICS    || [];

    const lore = loreSource.map(l => ({
      id: 'codex-' + l.id,
      title: l.name,
      body: `## What the table knows\n${l.desc || ''}\n\n## Keeper notes\nUse this page as the canonical campaign-bible record for ${l.name}. Link NPCs, factions, secrets, relics, and quests here as they become relevant.\n`,
      tags: [l.kind || 'lore'],
      type: l.kind === 'myth' || l.kind === 'song' ? 'lore' : 'history',
      pinned: false, folder: 'Lore',
      attributes: [{ key: 'Source', value: l.kind || 'lore' }],
      linkedIds: [l.id], createdAt: now, updatedAt: now,
    }));

    const religions = religionSource.map(r => ({
      id: 'codex-' + r.id,
      title: r.name,
      body: `## Doctrine\n${r.desc || r.tenet || ''}\n\n## Rites & signs\n\n\n## Keeper notes\nTrack priests, heresies, relics, taboos, and omens tied to ${r.name}.\n`,
      tags: ['religion', r.kind || 'faith'].filter(Boolean),
      type: 'religion', pinned: false, folder: 'Lore',
      attributes: [{ key: 'Domain', value: r.kind || 'faith' }],
      linkedIds: [r.id], createdAt: now, updatedAt: now,
    }));

    const relics = relicSource.map(r => ({
      id: 'codex-' + r.id,
      title: r.name,
      body: `## Description\n${r.desc || ''}\n\n## Powers, costs, tells\n\n\n## Keeper notes\nWhere is it now? Who wants it? What truth does it prove?\n`,
      tags: [r.category || 'relic', r.kind || r.type].filter(Boolean),
      type: 'relic', pinned: false, folder: 'Relics',
      attributes: [{ key: 'Class', value: r.category || 'relic' }],
      linkedIds: [r.id], createdAt: now, updatedAt: now,
    }));

    return [...lore, ...religions, ...relics];
  }

  function withNpcImageRef(npc) {
    const ref = window.NPC_IMAGE_REFS?.[npc.id];
    if (!ref) return { imageSourceUrl: '', imageCredit: '', ...npc };
    return {
      ...npc,
      image: npc.image || ref.image || '',
      imageSourceUrl: npc.imageSourceUrl || ref.imageSourceUrl || '',
      imageCredit: npc.imageCredit || ref.imageCredit || '',
    };
  }

  function cleanCodexBody(body) {
    return String(body || '').replace(/\[\/?DM\]/g, '').replace(/\n{4,}/g, '\n\n\n');
  }

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

  // ── Load state for a specific campaign ───────────────────────
  function loadStateForCampaign(campaignId) {
    try {
      const raw = localStorage.getItem(stateKey(campaignId));
      if (raw) {
        const parsed = migrateState(JSON.parse(raw));
        if (!parsed.locations)  parsed.locations  = [];
        if (!parsed.timeline)   parsed.timeline   = [];
        if (!parsed.codex)      parsed.codex      = [];
        if (!parsed.codexFolders) parsed.codexFolders = [...DEFAULT_CODEX_FOLDERS];
        if (!parsed.quests)         parsed.quests         = [];
        if (!parsed.religions)      parsed.religions      = [];
        if (!parsed.relics)         parsed.relics         = [];
        if (!parsed.lore)           parsed.lore           = [];
        if (!parsed.relationships)  parsed.relationships  = { nodes: [], edges: [] };
        if (!parsed.encounters) parsed.encounters = [];
        if (!parsed.calendar)   parsed.calendar   = [];
        if (!parsed.handouts)   parsed.handouts   = [];
        if (!parsed.tables)     parsed.tables     = [];
        if (!parsed.inspiration) parsed.inspiration = [];
        if ((!parsed.codex || parsed.codex.length === 0) && ((parsed.lore || []).length || (parsed.religions || []).length || (parsed.relics || []).length)) {
          parsed.codex = seedCodexFromWorldData(parsed);
        }
        parsed.codex      = (parsed.codex || []).map(e => ({
          folder: '', attributes: [], linkedIds: [],
          image: '', imageSourceUrl: '', imageCredit: '',
          ...e,
          body: cleanCodexBody(e.body),
        }));
        parsed.quests     = (parsed.quests || []).map(q => ({ public: false, ...q }));
        parsed.npcs       = (parsed.npcs || []).map(n => withNpcImageRef({ public: false, image: '', imageSourceUrl: '', imageCredit: '', ...n }));
        parsed.locations  = (parsed.locations || []).map(l => ({ public: false, image: '', imageSourceUrl: '', imageCredit: '', ...l }));
        parsed.relics     = parsed.relics.map(r => ({
          category: r.category || (String(r.kind || '').toLowerCase() === 'relic' ? 'relic' : 'item'),
          type: r.type || r.kind || 'relic', image: r.image || '', ...r,
        }));
        parsed.codex = parsed.codex.map(e => ({ type: 'lore', pinned: false, ...e }));
        parsed.codexFolders = Array.from(new Set([...(parsed.codexFolders || []), ...parsed.codex.map(e => e.folder).filter(Boolean)]));
        return parsed;
      }
    } catch (_) {}

    return emptyState();
  }

  // ── Save ─────────────────────────────────────────────────────
  function saveState() {
    try {
      localStorage.setItem(stateKey(activeCampaignId), JSON.stringify(state));
      // Keep campaign index name in sync with campaign.name
      const list = loadIndex();
      const idx = list.findIndex(c => c.id === activeCampaignId);
      if (idx >= 0) {
        list[idx].name      = state.campaign?.name || list[idx].name;
        list[idx].updatedAt = new Date().toISOString();
        saveIndex(list);
      }
    } catch (_) {}
  }

  // ── Realtime broadcast ────────────────────────────────────────
  // DM calls startBroadcast() once on load. After each dispatch the
  // public slice of state is sent (debounced 500ms) to the channel
  // `campaign:<campaignId>`. Players subscribe and receive it.

  let _channel = null;
  let _broadcastTimer = null;

  function publicSnapshot(s) {
    return {
      campaign: {
        name:     s.campaign?.name     || '',
        subtitle: s.campaign?.subtitle || '',
        session:  s.campaign?.session,
        theme:    s.campaign?.theme    || DEFAULT_THEME,
        location: s.campaign?.location || {},
        dmUser: s.campaign?.dmUser || null,
        playerRoster: s.campaign?.playerRoster || [],
        demoPitch: s.campaign?.demoPitch || '',
      },
      party:     s.party || [],
      npcs:      (s.npcs      || []).filter(n => n.public),
      quests:    (s.quests    || []).filter(q => q.public),
      locations: (s.locations || []).filter(l => l.public || l.party),
      secrets:   (s.secrets   || []).filter(sec => sec.status === 'revealed'),
      handouts:  (s.handouts  || []).filter(h => h.public),
      factions:  (s.factions  || []).map(f => ({
        id: f.id, name: f.name, ideology: f.ideology,
        sigil: f.sigil, disposition: f.disposition,
        clock: f.clock, color: f.color,
      })),
    };
  }

  function doBroadcast() {
    if (!_channel) return;
    _channel.send({ type: 'broadcast', event: 'state', payload: publicSnapshot(state) });
  }

  function scheduleBroadcast() {
    if (!_channel) return;
    clearTimeout(_broadcastTimer);
    _broadcastTimer = setTimeout(doBroadcast, 500);
  }

  function cachePlayerSnapshot(campaignId = activeCampaignId) {
    try {
      localStorage.setItem('player_cache_' + campaignId, JSON.stringify(publicSnapshot(state)));
    } catch (_) {}
  }

  // ── Init ──────────────────────────────────────────────────────
  let activeCampaignId = getActiveCampaignId();
  let state = loadStateForCampaign(activeCampaignId);
  const subs = new Set();

  function notify() { subs.forEach(fn => fn(state)); }

  // ── Reducer ───────────────────────────────────────────────────
  function reduce(s, a) {
    switch (a.type) {

      case 'CAMPAIGN_INIT':
        return { ...s, _new: false, campaign: { ...s.campaign, name: a.name, subtitle: a.subtitle || '', sessionsTotal: a.sessionsTotal || 20, theme: s.campaign.theme || DEFAULT_THEME } };
      case 'CAMPAIGN_SET_FIELD':
        return { ...s, campaign: { ...s.campaign, [a.field]: a.value } };
      case 'CAMPAIGN_SET_LOCATION':
        return { ...s, campaign: { ...s.campaign, location: { ...s.campaign.location, ...a.patch } } };

      case 'PARTY_SET_HP':
        return { ...s, party: s.party.map(p => p.name === a.name ? { ...p, hp: a.cur + '/' + a.max } : p) };
      case 'PARTY_ADD':
        return { ...s, party: [...s.party, { name: a.name, role: a.role, patron: a.patron || '—', hp: a.hp || '20/20', note: a.note || '' }] };
      case 'PARTY_REMOVE':
        return { ...s, party: s.party.filter(p => p.name !== a.name) };
      case 'PARTY_SET_FIELD':
        return { ...s, party: s.party.map(p => p.name === a.name ? { ...p, [a.field]: a.value } : p) };

      case 'NPC_ADD': {
        const n = { id: 'npc-' + Date.now(), name: a.name, title: a.title || '', faction: a.faction || '', disposition: a.disposition || 'neutral', location: a.location || '', quote: a.quote || '', likely: false, public: false, image: a.image || '', imageSourceUrl: a.imageSourceUrl || '', imageCredit: a.imageCredit || '', tags: a.tags || [], wants: '', fears: '', appearance: '', voice: '', bonds: [], dmNote: '' };
        return { ...s, npcs: [...s.npcs, n] };
      }
      case 'NPC_REMOVE':
        return { ...s, npcs: s.npcs.filter(n => n.id !== a.id) };
      case 'NPC_SET_FIELD': {
        const nextNpcs = s.npcs.map(n => n.id === a.id ? { ...n, [a.field]: a.value } : n);
        const next = { ...s, npcs: nextNpcs };
        if (a.field === 'name' && next.relationships?.nodes) {
          next.relationships = { ...next.relationships, nodes: next.relationships.nodes.map(n => n.id === a.id ? { ...n, label: a.value } : n) };
        }
        return next;
      }

      case 'FACTION_CLOCK_SET':
        return { ...s, factions: s.factions.map(f => f.id !== a.id ? f : { ...f, clock: { ...f.clock, filled: Math.max(0, Math.min(a.filled, f.clock.segments)) } }) };
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

      case 'QUEST_ADD': {
        const q = { id: 'quest-' + Date.now(), title: a.title || 'Untitled quest', arc: a.arc || 'Main', state: a.state || 'active', public: !!a.public, note: a.note || '', giver: a.giver || '', next: a.next || '', stakes: a.stakes || '', step: a.step != null ? a.step : 0, total: a.total != null ? a.total : 3 };
        return { ...s, quests: [q, ...s.quests] };
      }
      case 'QUEST_SET_FIELD':
        return { ...s, quests: s.quests.map(q => q.id === a.id ? { ...q, [a.field]: a.value } : q) };
      case 'QUEST_REMOVE':
        return { ...s, quests: s.quests.filter(q => q.id !== a.id) };

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
        const kept = s.prep.filter(p => !p.done);
        return { ...s, prep: kept.map(p => ({ ...p, done: false })) };
      }

      case 'LOCATION_ADD': {
        const loc = { id: 'loc-' + Date.now(), label: a.label || 'New Location', name: a.label || 'New Location', x: a.x, y: a.y, kind: a.kind || 'town', note: '', party: false, flagged: false, public: false, image: a.image || '', imageSourceUrl: a.imageSourceUrl || '', imageCredit: a.imageCredit || '' };
        return { ...s, locations: [...s.locations, loc] };
      }
      case 'LOCATION_REMOVE':
        return { ...s, locations: s.locations.filter(l => l.id !== a.id) };
      case 'LOCATION_SET_FIELD':
        return { ...s, locations: s.locations.map(l => l.id === a.id ? { ...l, [a.field]: a.value } : l) };
      case 'LOCATION_SET_PARTY':
        return { ...s, locations: s.locations.map(l => ({ ...l, party: l.id === a.id })) };

      case 'TIMELINE_ADD': {
        const ev = { id: 'ev-' + Date.now(), era: a.era || 'Now', marker: a.marker || 'I', title: a.title || 'Untitled event', note: a.note || a.description || '', party: !!a.party, flagged: !!a.flagged, upcoming: !!a.upcoming, worldDate: a.worldDate || '', sessionRef: a.sessionRef || '', description: a.description || a.note || '', createdAt: new Date().toISOString() };
        return { ...s, timeline: [ev, ...s.timeline] };
      }
      case 'TIMELINE_REMOVE':
        return { ...s, timeline: s.timeline.filter(e => e.id !== a.id) };
      case 'TIMELINE_SET_FIELD':
        return { ...s, timeline: s.timeline.map(e => e.id === a.id ? { ...e, [a.field]: a.value } : e) };

      case 'CODEX_ADD': {
        const entry = { id: 'codex-' + Date.now(), title: a.title || 'Untitled Entry', body: cleanCodexBody(a.body), tags: [], type: a.entryType || 'lore', pinned: false, folder: a.folder || '', attributes: a.attributes || [], linkedIds: a.linkedIds || [], image: a.image || '', imageSourceUrl: a.imageSourceUrl || '', imageCredit: a.imageCredit || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        return { ...s, codex: [entry, ...s.codex] };
      }
      case 'CODEX_REMOVE':
        return { ...s, codex: s.codex.filter(e => e.id !== a.id) };
      case 'CODEX_SET_FIELD':
        return { ...s, codex: s.codex.map(e => e.id === a.id ? { ...e, [a.field]: a.field === 'body' ? cleanCodexBody(a.value) : a.value, updatedAt: new Date().toISOString() } : e) };
      case 'CODEX_FOLDER_ADD': {
        const name = String(a.name || '').trim();
        if (!name) return s;
        const folders = s.codexFolders || [];
        if (folders.some(f => f.toLowerCase() === name.toLowerCase())) return s;
        return { ...s, codexFolders: [...folders, name] };
      }
      case 'CODEX_FOLDER_RENAME': {
        const from = String(a.from || '').trim();
        const to = String(a.to || '').trim();
        if (!from || !to) return s;
        const folders = (s.codexFolders || []).map(f => f === from ? to : f);
        return {
          ...s,
          codexFolders: Array.from(new Set(folders)),
          codex: s.codex.map(e => e.folder === from ? { ...e, folder: to, updatedAt: new Date().toISOString() } : e),
        };
      }
      case 'CODEX_FOLDER_REMOVE': {
        const name = String(a.name || '').trim();
        if (!name) return s;
        return {
          ...s,
          codexFolders: (s.codexFolders || []).filter(f => f !== name),
          codex: s.codex.map(e => e.folder === name ? { ...e, folder: '', updatedAt: new Date().toISOString() } : e),
        };
      }

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
      case 'ENCOUNTER_ENEMY_SET':
        return { ...s, encounters: (s.encounters || []).map(e => e.id === a.encId ? { ...e, enemies: (e.enemies || []).map(en => en.id === a.enemyId ? { ...en, [a.field]: a.value } : en) } : e) };
      case 'ENCOUNTER_ENEMY_REMOVE':
        return { ...s, encounters: (s.encounters || []).map(e => e.id === a.encId ? { ...e, enemies: (e.enemies || []).filter(en => en.id !== a.enemyId) } : e) };

      case 'CALENDAR_ADD': {
        const event = { id: 'cal-' + Date.now(), date: a.date || '', title: a.title || 'Untitled date', kind: a.kind || 'world', notes: a.notes || '' };
        return { ...s, calendar: [event, ...(s.calendar || [])] };
      }
      case 'CALENDAR_SET_FIELD':
        return { ...s, calendar: (s.calendar || []).map(e => e.id === a.id ? { ...e, [a.field]: a.value } : e) };
      case 'CALENDAR_REMOVE':
        return { ...s, calendar: (s.calendar || []).filter(e => e.id !== a.id) };

      case 'HANDOUT_ADD': {
        const handout = { id: 'handout-' + Date.now(), title: a.title || 'Untitled handout', kind: a.kind || 'note', body: a.body || '', image: a.image || '', public: !!a.public };
        return { ...s, handouts: [handout, ...(s.handouts || [])] };
      }
      case 'HANDOUT_SET_FIELD':
        return { ...s, handouts: (s.handouts || []).map(h => h.id === a.id ? { ...h, [a.field]: a.value } : h) };
      case 'HANDOUT_REMOVE':
        return { ...s, handouts: (s.handouts || []).filter(h => h.id !== a.id) };

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
    get()         { return state; },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },

    dispatch(action) {
      // RELIC overrides (kept for back-compat)
      if (action?.type === 'RELIC_ADD') {
        state = { ...state, relics: [{ id: 'relic-' + Date.now(), name: action.name || 'Unnamed item', category: action.category || 'item', type: action.itemType || action.kind || action.category || 'item', kind: action.itemType || action.kind || action.category || 'item', desc: action.desc || '', image: action.image || '' }, ...(state.relics || [])] };
        saveState(); notify(); scheduleBroadcast(); return;
      }
      if (action?.type === 'RELIC_SET_FIELD') {
        state = { ...state, relics: (state.relics || []).map(r => r.id === action.id ? { ...r, [action.field]: action.value } : r) };
        saveState(); notify(); scheduleBroadcast(); return;
      }
      if (action?.type === 'RELIC_REMOVE') {
        state = { ...state, relics: (state.relics || []).filter(r => r.id !== action.id) };
        saveState(); notify(); scheduleBroadcast(); return;
      }

      state = reduce(state, action);
      saveState(); cachePlayerSnapshot(); notify(); scheduleBroadcast();

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

    reload() {
      state = loadStateForCampaign(activeCampaignId);
      notify();
    },

    reset() {
      localStorage.removeItem(stateKey(activeCampaignId));
      state = emptyState();
      saveState(); cachePlayerSnapshot(); notify();
    },

    installTableDemo() {
      const id = 'demo-black-bell-vaelthorne';
      const list = loadIndex();
      const now = new Date().toISOString();
      const existing = list.find(c => c.id === id);
      if (!existing) {
        list.push({ id, name: 'The Black Bell of Vaelthorne', createdAt: now, updatedAt: now, demo: true });
      } else {
        existing.name = 'The Black Bell of Vaelthorne';
        existing.updatedAt = now;
        existing.demo = true;
      }
      saveIndex(list);
      saveState();
      activeCampaignId = id;
      localStorage.setItem(activeKey(), id);
      state = tableDemoState();
      saveState();
      cachePlayerSnapshot(id);
      notify();
      if (_channel) { _channel.unsubscribe(); _channel = null; }
      return id;
    },

    // ── Campaign management ────────────────────────────────────
    campaigns: {
      list()   { return loadIndex(); },
      active() { return activeCampaignId; },

      create(name) {
        const id = crypto.randomUUID();
        const list = loadIndex();
        list.push({ id, name: name || 'New Campaign', createdAt: new Date().toISOString() });
        saveIndex(list);
        return id;
      },

      switchTo(id) {
        const list = loadIndex();
        if (!list.some(c => c.id === id)) return false;
        saveState();
        activeCampaignId = id;
        localStorage.setItem(activeKey(), id);
        state = loadStateForCampaign(id);
        notify();
        if (_channel) { _channel.unsubscribe(); _channel = null; }
        return true;
      },

      rename(id, name) {
        const list = loadIndex();
        const idx = list.findIndex(c => c.id === id);
        if (idx < 0) return;
        list[idx].name = name;
        saveIndex(list);
        if (id === activeCampaignId) {
          state = { ...state, campaign: { ...state.campaign, name } };
          saveState(); notify();
        }
      },

      delete(id) {
        const list = loadIndex();
        if (list.length <= 1) return false;
        localStorage.removeItem(stateKey(id));
        const newList = list.filter(c => c.id !== id);
        saveIndex(newList);
        if (id === activeCampaignId) this.switchTo(newList[0].id);
        return true;
      },
    },

    // ── Realtime ───────────────────────────────────────────────
    startBroadcast(campaignId) {
      const cid = campaignId || activeCampaignId;
      if (_channel) _channel.unsubscribe();
      _channel = window._sb.channel('campaign:' + cid);
      _channel
        .on('broadcast', { event: 'request_state' }, () => doBroadcast())
        .subscribe(status => { if (status === 'SUBSCRIBED') doBroadcast(); });
    },

    stopBroadcast() {
      if (_channel) { _channel.unsubscribe(); _channel = null; }
    },

    getShareLink() {
      const base = window.location.href.replace(/\/[^/]*(\?.*)?$/, '/');
      return `${base}player.html?campaign=${activeCampaignId}`;
    },

    addPlayer(name, character, hook) {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const id = slug || ('player-' + Date.now().toString(36));
      const roster = (state.campaign?.playerRoster || []).filter(p => p.id !== id);
      roster.push({ id, name: name.trim(), character: (character || '').trim(), hook: (hook || '').trim() });
      state = { ...state, campaign: { ...state.campaign, playerRoster: roster } };
      saveState(); cachePlayerSnapshot(); notify(); scheduleBroadcast();
      return id;
    },

    updatePlayer(id, patch) {
      const roster = (state.campaign?.playerRoster || []).map(p =>
        p.id === id ? { ...p, ...patch } : p
      );
      state = { ...state, campaign: { ...state.campaign, playerRoster: roster } };
      saveState(); cachePlayerSnapshot(); notify(); scheduleBroadcast();
    },

    removePlayer(id) {
      const roster = (state.campaign?.playerRoster || []).filter(p => p.id !== id);
      state = { ...state, campaign: { ...state.campaign, playerRoster: roster } };
      saveState(); cachePlayerSnapshot(); notify(); scheduleBroadcast();
    },
  };

  // Cross-tab sync: reload if another tab saved this campaign
  window.addEventListener('storage', (e) => {
    if (e.key === stateKey(activeCampaignId)) {
      state = loadStateForCampaign(activeCampaignId);
      notify();
    }
  });
})();
