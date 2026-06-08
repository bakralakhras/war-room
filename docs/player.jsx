// Player view: subscribes to the DM's public broadcast and gives each player
// a private local desk plus a shared party chronicle.

// ─── DEMO FALLBACK ──────────────────────────────────────────────────────────

function demoPublicState(campaignId) {
  if (campaignId !== 'demo-black-bell-vaelthorne' || !window.CAMPAIGN) return null;
  const publicNpcIds = new Set(['halsane', 'caedren', 'theron']);
  const publicQuestIds = new Set(['q1', 'q2', 'q3']);
  const publicLocationIds = new Set(['cinderhold', 'greymarch', 'ashen-hollow', 'cloister', 'garden']);
  const handout3 = (window.HANDOUTS || []).find(h => h.id === 'handout-3');
  return {
    campaign: {
      name: 'The Black Bell of Vaelthorne',
      subtitle: 'Two heirs, one drowned bell, and a crown that remembers murder.',
      session: 1,
      theme: 'grave-crown',
      location: { name: 'Ashen Hollow', region: 'The Margreave', note: 'A flooded mining village where the church bell rings from underwater.' },
      dmUser: { id: 'ardenna', name: 'Ardenna Vale', email: 'ardenna.dm@war-room.demo', role: 'Dungeon Master' },
      playerRoster: [
        { id: 'samira', name: 'Samira Vale', email: 'samira.player@war-room.demo', characterId: 'marda-stonebrew', character: 'Marda Stonebrew', role: 'Dwarven cleric of the Pale Moon', hook: 'Your brother died carrying the signet. Halsane knows more than she says.' },
        { id: 'theo', name: 'Theo Marr', email: 'theo.player@war-room.demo', characterId: 'aelric-vorn', character: 'Aelric Vorn', role: 'Half-elf warlock of the Hollow Sovereign', hook: "Your patron speaks in a dead king's voice and wants the throne room opened." },
      ],
      demoPitch: 'A three-user demo table: Ardenna runs the campaign, Samira receives Marda-facing hooks, and Theo receives Aelric-facing hooks.',
    },
    party: [
      { name: 'Marda Stonebrew', role: 'Dwarven Cleric', patron: 'Order of the Pale Moon', hp: '61/61', note: 'Her brother died with the rose signet in his mouth.' },
      { name: 'Aelric Vorn', role: 'Half-elf Warlock', patron: 'The Hollow Sovereign', hp: '38/52', note: 'His patron is a voice from the drowned throne.' },
    ],
    npcs: (window.NPCS || []).filter(n => publicNpcIds.has(n.id)).map(n => ({ ...n, public: true })),
    quests: (window.QUESTS || []).filter(q => publicQuestIds.has(q.id)).map(q => ({ ...q, public: true })),
    locations: (window.MAP_LOCATIONS || []).filter(l => publicLocationIds.has(l.id)).map(l => ({ ...l, public: true, party: l.id === 'ashen-hollow' })),
    secrets: (window.SECRETS || []).filter(s => s.id === 's5').map(s => ({ ...s, status: 'revealed' })),
    handouts: [
      ...(handout3 ? [{ ...handout3, public: true }] : []),
      { id: 'handout-demo-marda', title: "Marda's Signet Dream", kind: 'vision', body: 'You dream of your brother under black water. He opens his hand. The signet is not a ring anymore. It is a tiny bell, ringing without sound.', public: true },
      { id: 'handout-demo-aelric', title: "Aelric's Patron Whisper", kind: 'vision', body: 'The Hollow Sovereign says: bring me beneath the roses, and I will tell you which king is still breathing.', public: true },
    ],
    factions: (window.FACTIONS || []).map(f => ({ id: f.id, name: f.name, ideology: f.ideology, sigil: f.sigil, disposition: f.disposition, clock: f.clock, color: f.color })),
    sessions: window.CAMPAIGN?.lastSession ? [window.CAMPAIGN.lastSession] : [],
  };
}

// ─── HOOKS ──────────────────────────────────────────────────────────────────

function usePlayerSync() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign');
  const playerId = params.get('player') || '';

  const initialState = React.useMemo(() => {
    if (!campaignId) return null;
    try {
      const cached = localStorage.getItem('player_cache_' + campaignId);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  }, [campaignId]);

  const fallbackState = React.useMemo(() => demoPublicState(campaignId), [campaignId]);
  const [state, setState] = React.useState(() => initialState || fallbackState);
  const [status, setStatus] = React.useState(() => initialState || fallbackState ? 'cached' : 'connecting');

  React.useEffect(() => {
    if (!campaignId) { setStatus('error'); return; }
    if (!window._sb?.channel) { setStatus(initialState || fallbackState ? 'cached' : 'error'); return; }

    const channel = window._sb.channel('campaign:' + campaignId);
    channel
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        setState(payload);
        setStatus('live');
        try { localStorage.setItem('player_cache_' + campaignId, JSON.stringify(payload)); } catch {}
      })
      .subscribe(subStatus => {
        if (subStatus === 'SUBSCRIBED') {
          channel.send({ type: 'broadcast', event: 'request_state', payload: {} });
          setState(prev => { if (prev) setStatus('cached'); return prev; });
        } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
          setStatus('error');
        }
      });

    return () => channel.unsubscribe();
  }, [campaignId]);

  return { state, status, campaignId, playerId };
}

function defaultDesk(player) {
  return {
    instinct: player?.hook || '',
    journal: '',
    journalEntries: [
      { id: 'journal-1', title: 'Session 1 - First impressions', date: '27 Vael', body: '', createdAt: Date.now() },
    ],
    questions: '',
    mementos: '',
    goals: [
      { id: 'goal-1', text: player?.id === 'theo' ? 'Learn what the Hollow Sovereign truly wants.' : 'Find out why Halsane hid the signet.', done: false },
      { id: 'goal-2', text: 'Ask one dangerous question next session.', done: false },
    ],
    sparks: [
      { id: 'spark-1', title: 'Table mood', tag: 'vibe', note: 'Wet stone, old bells, candle smoke, a crown wrapped in funeral linen.' },
      { id: 'spark-2', title: player?.character || 'My character', tag: 'portrait', note: player?.role || 'What do they look like when no one is watching?' },
    ],
    hp: { current: null, max: null },
    traits: { personality: '', ideals: '', bonds: '', flaws: '' },
    inventory: [],
    abilities: [],
    theories: { nodes: [], edges: [] },
  };
}

function migrateDesk(saved, player) {
  const base = defaultDesk(player);
  const desk = { ...base, ...saved };
  if ((!desk.journalEntries || desk.journalEntries.length === 0) && desk.journal) {
    desk.journalEntries = [{ id: 'journal-migrated', title: 'Earlier character notes', date: '', body: desk.journal, createdAt: Date.now() }];
  }
  desk.journalEntries = (desk.journalEntries || base.journalEntries).map(entry => ({
    createdAt: Date.now(), date: '', body: '', ...entry,
  }));
  if (!desk.hp) desk.hp = base.hp;
  if (!desk.traits) desk.traits = base.traits;
  if (!desk.inventory) desk.inventory = base.inventory;
  if (!desk.abilities) desk.abilities = base.abilities;
  if (!desk.theories) desk.theories = base.theories;
  return desk;
}

function usePlayerDesk(campaignId, player) {
  const key = React.useMemo(() => {
    const playerKey = player?.id || 'guest';
    return campaignId ? `player_desk_${campaignId}_${playerKey}` : null;
  }, [campaignId, player?.id]);

  const [desk, setDesk] = React.useState(() => {
    if (!key) return defaultDesk(player);
    try {
      const saved = localStorage.getItem(key);
      return saved ? migrateDesk(JSON.parse(saved), player) : defaultDesk(player);
    } catch { return defaultDesk(player); }
  });

  React.useEffect(() => {
    setDesk(() => {
      if (!key) return defaultDesk(player);
      try {
        const saved = localStorage.getItem(key);
        return saved ? migrateDesk(JSON.parse(saved), player) : defaultDesk(player);
      } catch { return defaultDesk(player); }
    });
  }, [key]);

  React.useEffect(() => {
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(desk)); } catch {}
  }, [key, desk]);

  const patch = (field, value) => setDesk(d => ({ ...d, [field]: value }));
  const addGoal = (text) => { const c = text.trim(); if (!c) return; setDesk(d => ({ ...d, goals: [...d.goals, { id: 'goal-' + Date.now(), text: c, done: false }] })); };
  const toggleGoal = (id) => setDesk(d => ({ ...d, goals: d.goals.map(g => g.id === id ? { ...g, done: !g.done } : g) }));
  const removeGoal = (id) => setDesk(d => ({ ...d, goals: d.goals.filter(g => g.id !== id) }));
  const addJournalEntry = () => {
    const entry = { id: 'journal-' + Date.now(), title: 'New journal entry', date: '', body: '', createdAt: Date.now() };
    setDesk(d => ({ ...d, journalEntries: [entry, ...(d.journalEntries || [])] }));
    return entry.id;
  };
  const updateJournalEntry = (id, p) => setDesk(d => ({ ...d, journalEntries: (d.journalEntries || []).map(e => e.id === id ? { ...e, ...p } : e) }));
  const removeJournalEntry = (id) => setDesk(d => {
    const remaining = (d.journalEntries || []).filter(e => e.id !== id);
    return { ...d, journalEntries: remaining.length ? remaining : defaultDesk(player).journalEntries };
  });
  const addSpark = (spark) => {
    const title = spark.title.trim(); const note = spark.note.trim();
    if (!title && !note) return;
    setDesk(d => ({ ...d, sparks: [{ id: 'spark-' + Date.now(), title: title || 'Untitled spark', tag: spark.tag.trim() || 'idea', note }, ...d.sparks] }));
  };
  const removeSpark = (id) => setDesk(d => ({ ...d, sparks: d.sparks.filter(s => s.id !== id) }));
  const patchHp = (field, value) => setDesk(d => ({ ...d, hp: { ...d.hp, [field]: value } }));
  const patchTrait = (field, value) => setDesk(d => ({ ...d, traits: { ...d.traits, [field]: value } }));
  const addInventory = (name) => { if (!name.trim()) return; setDesk(d => ({ ...d, inventory: [...(d.inventory || []), { id: 'inv-' + Date.now(), name: name.trim(), qty: 1, note: '' }] })); };
  const updateInventory = (id, p) => setDesk(d => ({ ...d, inventory: (d.inventory || []).map(i => i.id === id ? { ...i, ...p } : i) }));
  const removeInventory = (id) => setDesk(d => ({ ...d, inventory: (d.inventory || []).filter(i => i.id !== id) }));
  const addAbility = (name, desc) => { if (!name.trim()) return; setDesk(d => ({ ...d, abilities: [...(d.abilities || []), { id: 'ab-' + Date.now(), name: name.trim(), desc: desc.trim() }] })); };
  const removeAbility = (id) => setDesk(d => ({ ...d, abilities: (d.abilities || []).filter(a => a.id !== id) }));

  const addTheoryNode = (label, type, npcId, note) => {
    const node = { id: 'tn-' + Date.now(), label: label.trim(), type: type || 'unknown', npcId: npcId || null, note: (note || '').trim(), x: 0.25 + Math.random() * 0.5, y: 0.25 + Math.random() * 0.5, suspicion: 'medium' };
    setDesk(d => ({ ...d, theories: { ...d.theories, nodes: [...(d.theories?.nodes || []), node] } }));
    return node.id;
  };
  const updateTheoryNode = (id, p) => setDesk(d => ({ ...d, theories: { ...d.theories, nodes: (d.theories?.nodes || []).map(n => n.id === id ? { ...n, ...p } : n) } }));
  const removeTheoryNode = (id) => setDesk(d => ({ ...d, theories: { nodes: (d.theories?.nodes || []).filter(n => n.id !== id), edges: (d.theories?.edges || []).filter(e => e.a !== id && e.b !== id) } }));
  const addTheoryEdge = (a, b, label, type) => {
    const edge = { id: 'te-' + Date.now(), a, b, label: (label || '').trim(), type: type || 'unknown' };
    setDesk(d => ({ ...d, theories: { ...d.theories, edges: [...(d.theories?.edges || []), edge] } }));
  };
  const removeTheoryEdge = (id) => setDesk(d => ({ ...d, theories: { ...d.theories, edges: (d.theories?.edges || []).filter(e => e.id !== id) } }));

  return { desk, patch, addGoal, toggleGoal, removeGoal, addJournalEntry, updateJournalEntry, removeJournalEntry, addSpark, removeSpark, patchHp, patchTrait, addInventory, updateInventory, removeInventory, addAbility, removeAbility, addTheoryNode, updateTheoryNode, removeTheoryNode, addTheoryEdge, removeTheoryEdge };
}

function usePartyChronicle(campaignId, player) {
  const cacheKey = campaignId ? `party_chronicle_${campaignId}` : null;
  const [entries, setEntries] = React.useState(() => {
    if (!cacheKey) return [];
    try { const s = localStorage.getItem(cacheKey); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  React.useEffect(() => {
    if (!cacheKey || !window._sb?.channel) return;
    const ch = window._sb.channel('chronicle:' + campaignId);
    ch.on('broadcast', { event: 'entry' }, ({ payload }) => {
      setEntries(prev => {
        if (prev.some(e => e.id === payload.id)) return prev;
        const next = [payload, ...prev].slice(0, 200);
        try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
        return next;
      });
    }).subscribe();
    return () => ch.unsubscribe();
  }, [campaignId, cacheKey]);

  const postEntry = (body, characterName) => {
    if (!body.trim()) return;
    const entry = {
      id: 'chr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      author: characterName || player?.character || 'Unknown',
      body: body.trim(),
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      createdAt: Date.now(),
    };
    setEntries(prev => {
      const next = [entry, ...prev].slice(0, 200);
      try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
      return next;
    });
    if (window._sb?.channel) {
      try {
        const ch = window._sb.channel('chronicle:' + campaignId);
        ch.send({ type: 'broadcast', event: 'entry', payload: entry });
      } catch {}
    }
  };

  return { entries, postEntry };
}

function useThemePicker(campaignId, playerId, dmTheme) {
  const key = campaignId && playerId ? `player_theme_${campaignId}_${playerId}` : null;
  const [theme, setTheme] = React.useState(() => {
    if (!key) return dmTheme || 'ashen-table';
    try { return localStorage.getItem(key) || dmTheme || 'ashen-table'; } catch { return dmTheme || 'ashen-table'; }
  });

  React.useEffect(() => {
    if (window.applyWarroomTheme) window.applyWarroomTheme(theme);
  }, [theme]);

  React.useEffect(() => {
    if (!key) return;
    const saved = (() => { try { return localStorage.getItem(key); } catch { return null; } })();
    if (!saved && dmTheme) setTheme(dmTheme);
  }, [dmTheme]);

  const pick = (id) => { setTheme(id); if (key) { try { localStorage.setItem(key, id); } catch {} } };
  const reset = () => { setTheme(dmTheme || 'ashen-table'); if (key) { try { localStorage.removeItem(key); } catch {} } };
  return { theme, pick, reset };
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────

function PlayerApp() {
  const { state, status, campaignId, playerId } = usePlayerSync();
  const campaign = state?.campaign || {};
  const player = (campaign.playerRoster || []).find(p => p.id === playerId);
  const { desk, patch, addGoal, toggleGoal, removeGoal, addJournalEntry, updateJournalEntry, removeJournalEntry, addSpark, removeSpark, patchHp, patchTrait, addInventory, updateInventory, removeInventory, addAbility, removeAbility, addTheoryNode, updateTheoryNode, removeTheoryNode, addTheoryEdge, removeTheoryEdge } = usePlayerDesk(campaignId, player);
  const { entries: chronicle, postEntry } = usePartyChronicle(campaignId, player);
  const { theme, pick: pickTheme, reset: resetTheme } = useThemePicker(campaignId, playerId, campaign.theme);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [themeOpen, setThemeOpen] = React.useState(false);
  const [activeNpc, setActiveNpc] = React.useState(null);

  if (!campaignId) return <EmptyPlayerState title="No campaign linked" text="Ask your DM for the player link." />;

  const publicSecrets = (state?.secrets || []).filter(s => s.status === 'revealed');
  const publicQuests = (state?.quests || []).filter(q => q.public && q.state === 'active');
  const publicNpcs = (state?.npcs || []).filter(n => n.public);
  const publicLocations = (state?.locations || []).filter(l => l.public || l.party);
  const safeHandouts = (state?.handouts || []).filter(h => h.public);
  const character = (state?.party || []).find(p => p.name === player?.character);
  const currentPlace = publicLocations.find(l => l.party) || campaign.location;

  return (
    <div className="app player-app" style={{ gridTemplateColumns: '1fr' }}>
      <main className="main">
        <PlayerTopbar campaign={campaign} status={status} onThemeOpen={() => setThemeOpen(true)} />

        {!state ? (
          <EmptyPlayerState title="Waiting for the DM..." text="The DM must have the War Room open to push data." />
        ) : (
          <div className="page fade-up player-page">
            <PlayerHero campaign={campaign} player={player} character={character} currentPlace={currentPlace} desk={desk} patch={patch} />

            <PlayerTabs active={activeTab} onChange={setActiveTab} counts={{
              journal: desk.journalEntries?.length || 0,
              chronicle: chronicle.length,
              intel: publicQuests.length + publicNpcs.length + publicLocations.length + publicSecrets.length + safeHandouts.length,
              sparks: desk.sparks?.length || 0,
              party: (state?.party || []).length,
              theories: (desk.theories?.nodes || []).length,
            }} />

            {activeTab === 'overview' && (
              <PlayerOverview state={state} player={player} currentPlace={currentPlace} publicQuests={publicQuests} publicSecrets={publicSecrets} desk={desk} patch={patch} addGoal={addGoal} toggleGoal={toggleGoal} removeGoal={removeGoal} onOpenJournal={() => setActiveTab('journal')} />
            )}
            {activeTab === 'character' && (
              <PlayerCharacter state={state} player={player} character={character} desk={desk} patchHp={patchHp} patchTrait={patchTrait} addInventory={addInventory} updateInventory={updateInventory} removeInventory={removeInventory} addAbility={addAbility} removeAbility={removeAbility} />
            )}
            {activeTab === 'journal' && (
              <PlayerJournal entries={desk.journalEntries || []} chronicle={chronicle} player={player} onAdd={addJournalEntry} onUpdate={updateJournalEntry} onRemove={removeJournalEntry} onPost={postEntry} />
            )}
            {activeTab === 'intel' && (
              <PlayerIntel state={state} player={player} publicQuests={publicQuests} publicNpcs={publicNpcs} publicLocations={publicLocations} publicSecrets={publicSecrets} safeHandouts={safeHandouts} onNpcClick={setActiveNpc} />
            )}
            {activeTab === 'party' && (
              <PlayerParty state={state} player={player} />
            )}
            {activeTab === 'inspiration' && (
              <PlayerInspirationPage desk={desk} patch={patch} addSpark={addSpark} removeSpark={removeSpark} />
            )}
            {activeTab === 'theories' && (
              <PlayerTheories theories={desk.theories || { nodes: [], edges: [] }} publicNpcs={publicNpcs} onAddNode={addTheoryNode} onUpdateNode={updateTheoryNode} onRemoveNode={removeTheoryNode} onAddEdge={addTheoryEdge} onRemoveEdge={removeTheoryEdge} />
            )}
          </div>
        )}
      </main>

      {themeOpen && (
        <ThemePicker currentTheme={theme} dmTheme={campaign.theme} onPick={pickTheme} onReset={resetTheme} onClose={() => setThemeOpen(false)} />
      )}
      {activeNpc && (
        <NpcModal npc={activeNpc} onClose={() => setActiveNpc(null)} />
      )}

      <div className="candle-vignette" data-noncommentable=""></div>
    </div>
  );
}

// ─── LAYOUT ─────────────────────────────────────────────────────────────────

function PlayerTopbar({ campaign, status, onThemeOpen }) {
  const statusPill = status === 'live'
    ? <span className="pill brass">live</span>
    : status === 'cached'
    ? <span className="pill iron">cached</span>
    : status === 'error'
    ? <span className="pill iron">offline</span>
    : <span className="pill iron">connecting…</span>;

  return (
    <div className="topbar grain">
      <div className="crumb">
        <Icon.PlayerView />
        <span>{campaign.name || 'War Room'}</span>
        <span className="sep">/</span>
        <span style={{ color: 'var(--fg)', fontWeight: 600 }}>Player Desk</span>
      </div>
      <div className="top-spacer" />
      {statusPill}
      <button type="button" className="tbtn" onClick={onThemeOpen} title="Change table mood">
        ◐ Mood
      </button>
    </div>
  );
}

function PlayerHero({ campaign, player, character, currentPlace, desk, patch }) {
  const initials = (player?.character || '?').split(/\s+/).map(s => s[0]).join('').slice(0, 2);
  return (
    <div className="player-hero">
      <div className="player-sigil">{initials}</div>
      <div className="player-hero-main">
        <div className="smallcaps">Published campaign</div>
        <h1>{campaign.name || 'Player View'}</h1>
        <p>{campaign.subtitle || 'Only player-safe records appear here.'}</p>
        <div className="player-meta">
          <span>Session {campaign.session || '?'}</span>
          <span>{currentPlace?.label || currentPlace?.name || 'Location unknown'}</span>
          <span>{player?.name ? `${player.name}'s desk` : 'Shared player view'}</span>
        </div>
      </div>
      <div className="player-character-card">
        <div className="smallcaps">Playing</div>
        <h2>{player?.character || 'Unassigned character'}</h2>
        <div className="muted">{player?.role || character?.role || 'Ask the DM for a seat link.'}</div>
        <textarea
          className="player-textarea instinct"
          value={desk.instinct}
          onChange={e => patch('instinct', e.target.value)}
          placeholder="What is your character afraid to say out loud?"
        />
      </div>
    </div>
  );
}

function PlayerTabs({ active, onChange, counts }) {
  const tabs = [
    { id: 'overview',    label: 'Overview',    note: 'at table' },
    { id: 'character',   label: 'Character',   note: 'your sheet' },
    { id: 'journal',     label: 'Journal',     note: `${counts.journal}e · ${counts.chronicle}p` },
    { id: 'intel',       label: 'Intel',       note: `${counts.intel} records` },
    { id: 'party',       label: 'Party',       note: `${counts.party} members` },
    { id: 'inspiration', label: 'Inspiration', note: `${counts.sparks} pins` },
    { id: 'theories',    label: 'Theories',    note: `${counts.theories} node${counts.theories !== 1 ? 's' : ''}` },
  ];
  return (
    <div className="player-tabs" role="tablist" aria-label="Player pages">
      {tabs.map(tab => (
        <button key={tab.id} type="button" className={active === tab.id ? 'active' : ''} onClick={() => onChange(tab.id)}>
          <span>{tab.label}</span>
          <small>{tab.note}</small>
        </button>
      ))}
    </div>
  );
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────

function PlayerOverview({ state, player, currentPlace, publicQuests, publicSecrets, desk, patch, addGoal, toggleGoal, removeGoal, onOpenJournal }) {
  const nextQuest = publicQuests[0];
  const latestJournal = (desk.journalEntries || [])[0];
  return (
    <div className="player-tab-page overview">
      <div className="player-overview-grid">
        <PlayerPanel icon={Icon.PlayerView} title="Tonight's Focus" kicker="quick play">
          <div className="player-focus-card">
            {currentPlace?.image && (
              <img className="player-focus-image" src={currentPlace.image} alt="" />
            )}
            <span>Current place</span>
            <h3>{currentPlace?.label || currentPlace?.name || 'Unknown road'}</h3>
            <p>{currentPlace?.note || 'The table has not published a location note yet.'}</p>
          </div>
          <div className="player-focus-card">
            <span>Character pressure</span>
            <h3>{player?.character || 'Your character'}</h3>
            <p>{desk.instinct || player?.hook || 'Write what your character wants right now.'}</p>
          </div>
          <div className="player-focus-card">
            <span>Next thread</span>
            <h3>{nextQuest?.title || 'No active thread'}</h3>
            <p>{nextQuest?.note || nextQuest?.next || 'Wait for the DM to publish an active quest.'}</p>
          </div>
        </PlayerPanel>

        <PlayerGoals goals={desk.goals} onAdd={addGoal} onToggle={toggleGoal} onRemove={removeGoal} />

        <PlayerPanel icon={Icon.Secrets} title="Recent Reveals" empty="No secrets revealed yet.">
          {publicSecrets.slice(0, 3).map(s => <IntelRow key={s.id} title={s.title} meta="revealed" text={s.text || s.note || ''} />)}
        </PlayerPanel>

        <PlayerPanel title="Latest Journal" kicker="private">
          {latestJournal ? (
            <div className="player-latest-journal">
              <span>{latestJournal.date || 'Undated'}</span>
              <h3>{latestJournal.title}</h3>
              <p>{latestJournal.body || 'No words yet. Open the journal page when the session ends.'}</p>
              <button type="button" onClick={onOpenJournal}>Open journal</button>
            </div>
          ) : (
            <div className="muted">No journal entries yet.</div>
          )}
        </PlayerPanel>

        <PrivateNotes desk={desk} patch={patch} compact />

        <PlayerPanel icon={Icon.Characters} title="Party Snapshot" empty="No party published.">
          {(state.party || []).map((p, i) => (
            <IntelRow key={i} title={p.name} meta={p.role} text={p.note || p.patron || ''} active={p.name === player?.character} />
          ))}
        </PlayerPanel>
      </div>
    </div>
  );
}

// ─── CHARACTER TAB ───────────────────────────────────────────────────────────

function HpTracker({ hp, onPatch }) {
  const cur = hp.current ?? '';
  const max = hp.max ?? '';
  const pct = (hp.current != null && hp.max != null && hp.max > 0)
    ? Math.min(100, Math.round((hp.current / hp.max) * 100)) : null;
  const barColor = pct == null ? 'var(--brass)' : pct > 60 ? 'var(--forest)' : pct > 25 ? 'var(--amber)' : 'var(--crimson)';
  return (
    <div className="pc-hp-tracker">
      <div className="pc-hp-bar-wrap">
        {pct != null && <div className="pc-hp-bar" style={{ width: pct + '%', background: barColor }} />}
      </div>
      <div className="pc-hp-controls">
        <button type="button" onClick={() => onPatch('current', Math.max(0, (hp.current || 0) - 1))}>−</button>
        <input type="number" className="pc-hp-input" value={cur} onChange={e => onPatch('current', e.target.value === '' ? null : Number(e.target.value))} placeholder="HP" />
        <span className="pc-hp-sep">/</span>
        <input type="number" className="pc-hp-input" value={max} onChange={e => onPatch('max', e.target.value === '' ? null : Number(e.target.value))} placeholder="Max" />
        <button type="button" onClick={() => onPatch('current', Math.min(hp.max || 999, (hp.current || 0) + 1))}>+</button>
      </div>
    </div>
  );
}

function TraitFields({ traits, onPatch }) {
  const fields = [
    { key: 'personality', label: 'Personality', placeholder: 'How your character presents themselves…' },
    { key: 'ideals',      label: 'Ideals',       placeholder: 'What does your character believe in?' },
    { key: 'bonds',       label: 'Bonds',        placeholder: 'Who or what do they hold dear?' },
    { key: 'flaws',       label: 'Flaws',        placeholder: 'What holds them back, haunts them?' },
  ];
  return (
    <div className="pc-traits-grid">
      {fields.map(f => (
        <div key={f.key} className="pc-trait-field">
          <label className="player-label">{f.label}</label>
          <textarea className="player-textarea compact" value={traits[f.key] || ''} onChange={e => onPatch(f.key, e.target.value)} placeholder={f.placeholder} />
        </div>
      ))}
    </div>
  );
}

function InventoryList({ inventory, onAdd, onUpdate, onRemove }) {
  const [draft, setDraft] = React.useState('');
  const submit = e => { e.preventDefault(); onAdd(draft); setDraft(''); };
  return (
    <div className="pc-inventory">
      {(inventory || []).map(item => (
        <div key={item.id} className="pc-inv-row">
          <input className="pc-inv-name" value={item.name} onChange={e => onUpdate(item.id, { name: e.target.value })} />
          <input type="number" className="pc-inv-qty" value={item.qty} min={0} onChange={e => onUpdate(item.id, { qty: Number(e.target.value) })} />
          <input className="pc-inv-note" value={item.note} onChange={e => onUpdate(item.id, { note: e.target.value })} placeholder="note" />
          <button type="button" className="pc-inv-del" onClick={() => onRemove(item.id)}>×</button>
        </div>
      ))}
      <form className="player-addline" onSubmit={submit}>
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add item…" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}

function AbilityList({ abilities, onAdd, onRemove }) {
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const submit = e => { e.preventDefault(); onAdd(name, desc); setName(''); setDesc(''); };
  return (
    <div className="pc-abilities">
      {(abilities || []).map(a => (
        <div key={a.id} className="pc-ability-row">
          <div className="pc-ability-text">
            <strong>{a.name}</strong>
            {a.desc && <p>{a.desc}</p>}
          </div>
          <button type="button" onClick={() => onRemove(a.id)}>×</button>
        </div>
      ))}
      <form className="pc-ability-form" onSubmit={submit}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Feature or ability name…" />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Short description (optional)" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}

function PlayerCharacter({ state, player, character, desk, patchHp, patchTrait, addInventory, updateInventory, removeInventory, addAbility, removeAbility }) {
  const charData = character || {};
  const dmHp = charData.hp || null;
  return (
    <div className="player-tab-page pc-page">
      <div className="pc-grid">

        <PlayerPanel title="Vitals" kicker="hit points & identity">
          <div className="pc-vitals">
            <div className="pc-vitals-name">
              <div className="smallcaps">Character</div>
              <h2>{player?.character || 'Unnamed character'}</h2>
              <div className="muted">{player?.role || charData.role || '—'}</div>
              {charData.patron && <div className="muted" style={{ marginTop: 4 }}>{charData.patron}</div>}
            </div>
            <div>
              <div className="smallcaps" style={{ marginBottom: 6 }}>Hit Points</div>
              {dmHp && <div className="pc-dm-hp muted">DM reports: {dmHp}</div>}
              <HpTracker hp={desk.hp} onPatch={patchHp} />
            </div>
          </div>
        </PlayerPanel>

        <PlayerPanel title="Character Hook" kicker="instinct & drive">
          <label className="player-label">Your instinct — what do they want right now?</label>
          <div className="pc-hook-display">{desk.instinct || <span className="muted">Write your instinct in the hero card above.</span>}</div>
          {player?.hook && (
            <div className="pc-hook-dm">
              <span className="smallcaps">DM hook</span>
              <p>{player.hook}</p>
            </div>
          )}
        </PlayerPanel>

        <PlayerPanel title="Character Traits" kicker="personality, ideals, bonds, flaws" style={{ gridColumn: '1 / -1' }}>
          <TraitFields traits={desk.traits} onPatch={patchTrait} />
        </PlayerPanel>

        <PlayerPanel title="Inventory & Equipment" kicker="carried items">
          <InventoryList inventory={desk.inventory} onAdd={addInventory} onUpdate={updateInventory} onRemove={removeInventory} />
        </PlayerPanel>

        <PlayerPanel title="Features & Abilities" kicker="class features, spells, traits">
          <AbilityList abilities={desk.abilities} onAdd={addAbility} onRemove={removeAbility} />
        </PlayerPanel>

      </div>
    </div>
  );
}

// ─── JOURNAL TAB ─────────────────────────────────────────────────────────────

function ChronicleEntry({ entry, isOwn }) {
  const initials = (entry.author || '?').split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
  return (
    <article className={`chronicle-entry ${isOwn ? 'chronicle-own' : ''}`}>
      <div className="chronicle-entry-avatar">{initials}</div>
      <div className="chronicle-entry-body">
        <div className="chronicle-entry-head">
          <strong>{entry.author}</strong>
          <span>{entry.date}</span>
        </div>
        <p>{entry.body}</p>
      </div>
    </article>
  );
}

function ChronicleComposer({ player, onPost }) {
  const [body, setBody] = React.useState('');
  const submit = e => {
    e.preventDefault();
    if (!body.trim()) return;
    onPost(body, player?.character);
    setBody('');
  };
  const initials = (player?.character || '?').split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
  return (
    <form className="chronicle-composer" onSubmit={submit}>
      <div className="chronicle-composer-row">
        <div className="chronicle-composer-avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <div className="chronicle-composer-head">
            <span style={{ fontFamily: 'var(--f-display)', fontSize: 15 }}>{player?.character || 'Your character'}</span>
            <span className="muted" style={{ fontSize: 11 }}>posting to party chronicle</span>
          </div>
          <textarea
            className="player-textarea compact"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={"What happened this session? What stood out? Who do you trust less now?"}
            style={{ marginTop: 8 }}
          />
          <button type="submit" className="chronicle-post-btn" disabled={!body.trim()} style={{ marginTop: 8 }}>Post</button>
        </div>
      </div>
    </form>
  );
}

function PlayerJournal({ entries, chronicle, player, onAdd, onUpdate, onRemove, onPost }) {
  const [sub, setSub] = React.useState('private');
  const [selectedId, setSelectedId] = React.useState(entries[0]?.id || null);
  const selected = entries.find(e => e.id === selectedId) || entries[0];

  React.useEffect(() => {
    if (!entries.some(e => e.id === selectedId)) setSelectedId(entries[0]?.id || null);
  }, [entries.length, selectedId]);

  const add = () => { const id = onAdd(); setSelectedId(id); };

  return (
    <div className="player-tab-page journal-page">
      <div className="journal-subtabs">
        <button type="button" className={sub === 'private' ? 'active' : ''} onClick={() => setSub('private')}>
          Private Journal <small>{entries.length} entries</small>
        </button>
        <button type="button" className={sub === 'chronicle' ? 'active' : ''} onClick={() => setSub('chronicle')}>
          Party Chronicle <small>{chronicle.length} posts</small>
        </button>
      </div>

      {sub === 'private' && (
        <div className="player-journal-shell">
          <aside className="player-journal-list">
            <div className="player-journal-actions">
              <div>
                <div className="smallcaps">Private journal</div>
                <strong>{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</strong>
              </div>
              <button type="button" onClick={add}>New day</button>
            </div>
            {entries.map(entry => (
              <button key={entry.id} type="button" className={selected?.id === entry.id ? 'active' : ''} onClick={() => setSelectedId(entry.id)}>
                <span>{entry.date || 'Undated'}</span>
                <strong>{entry.title || 'Untitled entry'}</strong>
                <small>{entry.body ? entry.body.slice(0, 86) : 'No thoughts written yet.'}</small>
              </button>
            ))}
          </aside>
          <section className="player-journal-editor">
            {selected ? (
              <>
                <div className="player-journal-head">
                  <input value={selected.title} onChange={e => onUpdate(selected.id, { title: e.target.value })} placeholder="Entry title" />
                  <input value={selected.date} onChange={e => onUpdate(selected.id, { date: e.target.value })} placeholder="Date or session" />
                  <button type="button" onClick={() => onRemove(selected.id)}>Delete</button>
                </div>
                <textarea className="player-textarea journal" value={selected.body} onChange={e => onUpdate(selected.id, { body: e.target.value })} placeholder={"Write this as your character, or as the player behind them.\n\nWhat happened today? What did it cost? Who do you trust less now?"} />
              </>
            ) : (
              <div className="empty">Create a journal entry to begin.</div>
            )}
          </section>
        </div>
      )}

      {sub === 'chronicle' && (
        <div className="chronicle-page">
          <ChronicleComposer player={player} onPost={onPost} />
          <div className="chronicle-feed">
            {chronicle.length === 0
              ? <div className="empty">No entries yet. Be the first to post to the party chronicle.</div>
              : chronicle.map(e => <ChronicleEntry key={e.id} entry={e} isOwn={e.author === player?.character} />)
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INTEL TAB ───────────────────────────────────────────────────────────────

function FactionIntelRow({ faction }) {
  const dispColor = { ally: 'var(--forest)', hostile: 'var(--crimson)', ambiguous: 'var(--amber)', neutral: 'var(--fg-3)' };
  const clock = faction.clock;
  const pct = clock && clock.segments ? Math.round((clock.filled / clock.segments) * 100) : null;
  return (
    <div className="intel-faction-row">
      <div className="intel-faction-main">
        <strong>{faction.name}</strong>
        <span className="intel-faction-disp" style={{ color: dispColor[faction.disposition] || 'var(--fg-3)' }}>{faction.disposition || 'unknown'}</span>
      </div>
      {faction.ideology && <p className="intel-faction-ideology">{faction.ideology}</p>}
      {clock && (
        <div className="intel-faction-clock">
          <div className="intel-clock-bar-wrap">
            <div className="intel-clock-bar" style={{ width: (pct || 0) + '%' }} />
          </div>
          <span>{clock.filled}/{clock.segments} — {clock.label}</span>
        </div>
      )}
    </div>
  );
}

function QuestIntelRow({ quest }) {
  return (
    <div className="intel-quest-row">
      <div className="intel-quest-head">
        <strong>{quest.title}</strong>
        {quest.arc && <span className="intel-quest-arc">{quest.arc}</span>}
      </div>
      {quest.note && <p>{quest.note}</p>}
      {quest.stakes && <p className="intel-quest-stakes"><em>Stakes:</em> {quest.stakes}</p>}
      {quest.next && <p className="intel-quest-next">↳ {quest.next}</p>}
    </div>
  );
}

function PlayerIntel({ state, player, publicQuests, publicNpcs, publicLocations, publicSecrets, safeHandouts, onNpcClick }) {
  const factions = state?.factions || [];
  const sessions = (state?.sessions || []).slice(0, 3);

  return (
    <div className="player-tab-page intel-page">
      <div className="player-intel-grid">

        <PlayerPanel icon={Icon.Quests} title="Active Threads" empty="No quests published.">
          {publicQuests.map(q => <QuestIntelRow key={q.id} quest={q} />)}
        </PlayerPanel>

        <PlayerPanel icon={Icon.Characters} title="Known Faces" empty="No characters published.">
          {publicNpcs.map(n => <FaceRow key={n.id} npc={n} onClick={onNpcClick} />)}
        </PlayerPanel>

        <PlayerPanel icon={Icon.Locations} title="Known Places" empty="No locations published.">
          {publicLocations.length > 0 && (
            <div className="player-place-grid">
              {publicLocations.map(l => <PlaceCard key={l.id} loc={l} />)}
            </div>
          )}
        </PlayerPanel>

        <PlayerPanel icon={Icon.Secrets} title="Revealed Truths" empty="No secrets revealed yet.">
          {publicSecrets.map(s => <IntelRow key={s.id} title={s.title} meta="revealed" text={s.text || s.note || ''} />)}
        </PlayerPanel>

        {factions.length > 0 && (
          <PlayerPanel title="Factions" kicker="power & disposition">
            {factions.map(f => <FactionIntelRow key={f.id} faction={f} />)}
          </PlayerPanel>
        )}

        <PlayerPanel icon={Icon.Handouts} title="Handouts & Visions" empty="No handouts published.">
          <div className="player-handouts">
            {safeHandouts.map(h => <HandoutCard key={h.id} handout={h} />)}
          </div>
        </PlayerPanel>

        {sessions.length > 0 && (
          <PlayerPanel title="Session History" kicker="recent past">
            {sessions.map((s, i) => (
              <div key={i} className="intel-session-row">
                <strong>{s.title || `Session ${i + 1}`}</strong>
                {(s.bullets || []).slice(0, 3).map((b, j) => <p key={j}>• {b}</p>)}
              </div>
            ))}
          </PlayerPanel>
        )}

        <PlayerPanel icon={Icon.Characters} title="The Party" empty="No party published.">
          {(state.party || []).map((p, i) => (
            <IntelRow key={i} title={p.name} meta={p.role} text={p.note || p.patron || ''} active={p.name === player?.character} />
          ))}
        </PlayerPanel>

      </div>
    </div>
  );
}

// ─── PARTY TAB ───────────────────────────────────────────────────────────────

function PartyMemberCard({ member, isPlayer, isExpanded, onClick }) {
  const parts = member.hp ? member.hp.split('/').map(s => parseInt(s, 10)) : [null, null];
  const [cur, max] = parts;
  const pct = cur != null && max != null && max > 0 ? Math.round((cur / max) * 100) : null;
  const barColor = pct == null ? 'var(--brass)' : pct > 60 ? 'var(--forest)' : pct > 25 ? 'var(--amber)' : 'var(--crimson)';
  const initial = (member.name || '?').split(/\s+/).map(s => s[0]).join('').slice(0, 2);

  return (
    <div className={`party-member-card ${isPlayer ? 'is-player' : ''} ${isExpanded ? 'expanded' : ''}`} onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="party-member-head">
        <div className="party-member-avatar">{initial}</div>
        <div className="party-member-info">
          <strong>{member.name}{isPlayer && <span className="party-you-badge">you</span>}</strong>
          <span>{member.role}</span>
        </div>
        {member.hp && (
          <div className="party-member-hp">
            <div className="party-hp-bar-wrap">
              <div className="party-hp-bar" style={{ width: (pct || 0) + '%', background: barColor }} />
            </div>
            <span className="party-hp-label">{member.hp}</span>
          </div>
        )}
      </div>
      {isExpanded && (
        <div className="party-member-detail">
          {member.patron && <div className="party-member-row"><span className="smallcaps">Patron</span><span>{member.patron}</span></div>}
          {member.note && <div className="party-member-row"><span className="smallcaps">Note</span><span>{member.note}</span></div>}
        </div>
      )}
    </div>
  );
}

function PlayerParty({ state, player }) {
  const [expandedId, setExpandedId] = React.useState(null);
  const party = state?.party || [];
  const factions = (state?.factions || []);
  const allies = factions.filter(f => f.disposition === 'ally');

  return (
    <div className="player-tab-page party-page">
      <div className="party-grid">
        <PlayerPanel title="Party Roster" kicker={`${party.length} adventurers`} empty="No party data published by the DM.">
          <div className="party-roster">
            {party.map((m, i) => {
              const isMe = m.name === player?.character;
              const id = m.name + i;
              return (
                <PartyMemberCard
                  key={id}
                  member={m}
                  isPlayer={isMe}
                  isExpanded={expandedId === id}
                  onClick={() => setExpandedId(expandedId === id ? null : id)}
                />
              );
            })}
          </div>
        </PlayerPanel>

        <div className="party-side">
          <PlayerPanel title="Current Situation" kicker="where you are">
            <IntelRow
              title={state?.campaign?.location?.name || 'Location unknown'}
              meta="current location"
              text={state?.campaign?.location?.note || ''}
            />
            {state?.campaign?.nextSession && (
              <PlayerNextSession value={state.campaign.nextSession} />
            )}
          </PlayerPanel>

          {allies.length > 0 && (
            <PlayerPanel title="Allied Factions" kicker="on your side">
              {allies.map(f => <IntelRow key={f.id} title={f.name} meta="ally" text={f.ideology || ''} />)}
            </PlayerPanel>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── INSPIRATION TAB ─────────────────────────────────────────────────────────

function PlayerNextSession({ value }) {
  const [, setNowTick] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => setNowTick(t => t + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  const display = window.formatNextSession12 ? window.formatNextSession12(value) : value;
  const countdown = window.nextSessionCountdownLabel ? window.nextSessionCountdownLabel(value) : null;
  return (
    <div className="player-next-session">
      <div>
        <span className="smallcaps">Next session</span>
        <strong>{display}</strong>
      </div>
      {countdown && <b>{countdown}</b>}
    </div>
  );
}

function PlayerInspirationPage({ desk, patch, addSpark, removeSpark }) {
  return (
    <div className="player-tab-page inspiration-page">
      <div className="player-inspiration-grid">
        <PlayerInspirationBoard sparks={desk.sparks} onAdd={addSpark} onRemove={removeSpark} />
        <PrivateNotes desk={desk} patch={patch} />
      </div>
    </div>
  );
}

function PlayerInspirationBoard({ sparks, onAdd, onRemove }) {
  const [draft, setDraft] = React.useState({ title: '', tag: '', note: '' });
  const submit = e => { e.preventDefault(); onAdd(draft); setDraft({ title: '', tag: '', note: '' }); };
  return (
    <PlayerPanel title="Inspiration Board" kicker="portraits / songs / vibes">
      <form className="player-spark-form" onSubmit={submit}>
        <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Spark title" />
        <input value={draft.tag} onChange={e => setDraft(d => ({ ...d, tag: e.target.value }))} placeholder="tag" />
        <textarea value={draft.note} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} placeholder="Quote, image idea, playlist note, costume detail…" />
        <button type="submit">Pin spark</button>
      </form>
      <div className="player-sparks">
        {sparks.map(s => (
          <article key={s.id} className="player-spark">
            <button type="button" onClick={() => onRemove(s.id)} aria-label="Remove spark">×</button>
            <span>{s.tag}</span>
            <h3>{s.title}</h3>
            <p>{s.note}</p>
          </article>
        ))}
      </div>
    </PlayerPanel>
  );
}

// ─── THEORY BOARD ────────────────────────────────────────────────────────────

const THEORY_W = 1200, THEORY_H = 800, NODE_R = 30;
const THEORY_TYPE_COLOR = { npc: 'var(--brass)', unknown: 'oklch(0.6 0.06 270)', faction: 'var(--amber)', event: 'var(--crimson)' };
const THEORY_EDGE_COLOR = { suspects: 'var(--amber)', trusts: 'var(--forest)', enemy: 'var(--crimson)', knows: 'var(--fg-3)', connected: 'var(--brass)', unknown: 'oklch(0.5 0.03 270)' };
const THEORY_EDGE_TYPES = ['suspects', 'trusts', 'enemy', 'knows', 'connected', 'unknown'];

function TheoryBoard({ theories, publicNpcs, onAddNode, onUpdateNode, onRemoveNode, onAddEdge, onRemoveEdge }) {
  const svgRef = React.useRef(null);
  const [vp, setVp] = React.useState({ x: 40, y: 40, scale: 1 });
  const vpRef = React.useRef({ x: 40, y: 40, scale: 1 });
  React.useEffect(() => { vpRef.current = vp; }, [vp]);
  const [localNodes, setLocalNodes] = React.useState(() => (theories.nodes || []).map(n => ({ ...n })));
  React.useEffect(() => { setLocalNodes((theories.nodes || []).map(n => ({ ...n }))); }, [(theories.nodes || []).length]);
  const [selected, setSelected] = React.useState(null);
  const [hovEdge, setHovEdge] = React.useState(null);
  const [connectFrom, setConnectFrom] = React.useState(null);
  const [edgePending, setEdgePending] = React.useState(null);
  const [edgeDraft, setEdgeDraft] = React.useState({ label: '', type: 'suspects' });
  const [editNode, setEditNode] = React.useState(null);
  const [addPanel, setAddPanel] = React.useState(false);
  const dragRef = React.useRef(null);
  const panRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const mouseRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const handler = e => {
      e.preventDefault();
      const v = vpRef.current, r = el.getBoundingClientRect();
      const sx = (e.clientX - r.left) / r.width * THEORY_W, sy = (e.clientY - r.top) / r.height * THEORY_H;
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const ns = Math.max(0.15, Math.min(5, v.scale * f));
      const cx = (sx - v.x) / v.scale, cy = (sy - v.y) / v.scale;
      const nv = { scale: ns, x: sx - cx * ns, y: sy - cy * ns };
      vpRef.current = nv; setVp(nv);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  React.useEffect(() => {
    const h = e => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (selected) { onRemoveNode(selected); setSelected(null); }
      else if (hovEdge) { onRemoveEdge(hovEdge); setHovEdge(null); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [selected, hovEdge]);

  const onMouseMove = e => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
    if (!dragRef.current && !panRef.current) return;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = svgRef.current; if (!el) return;
      const r = el.getBoundingClientRect(), v = vpRef.current;
      const { x: mx, y: my } = mouseRef.current;
      if (dragRef.current) {
        const { id, ox, oy } = dragRef.current;
        const px = ((mx - r.left) / r.width * THEORY_W - v.x) / v.scale - ox;
        const py = ((my - r.top) / r.height * THEORY_H - v.y) / v.scale - oy;
        setLocalNodes(prev => prev.map(n => n.id === id ? { ...n, x: Math.max(0.01, Math.min(0.99, px / THEORY_W)), y: Math.max(0.01, Math.min(0.99, py / THEORY_H)) } : n));
      }
      if (panRef.current) {
        const { smx, smy, svp } = panRef.current;
        const dx = (mx - r.left) / r.width * THEORY_W - (smx - r.left) / r.width * THEORY_W;
        const dy = (my - r.top) / r.height * THEORY_H - (smy - r.top) / r.height * THEORY_H;
        const nv = { ...svp, x: svp.x + dx, y: svp.y + dy };
        vpRef.current = nv; setVp(nv);
      }
    });
  };

  const onMouseUp = () => {
    if (dragRef.current) {
      const node = localNodes.find(n => n.id === dragRef.current.id);
      if (node) onUpdateNode(node.id, { x: node.x, y: node.y });
      dragRef.current = null;
    }
    panRef.current = null;
  };

  const onNodeDown = (e, node) => {
    e.stopPropagation();
    if (connectFrom !== null) {
      if (connectFrom !== node.id) { setEdgePending({ from: connectFrom, to: node.id }); setConnectFrom(null); }
      return;
    }
    setSelected(node.id);
    const el = svgRef.current, r = el.getBoundingClientRect(), v = vpRef.current;
    const mx = (e.clientX - r.left) / r.width * THEORY_W, my = (e.clientY - r.top) / r.height * THEORY_H;
    dragRef.current = { id: node.id, ox: (mx - v.x) / v.scale - node.x * THEORY_W, oy: (my - v.y) / v.scale - node.y * THEORY_H };
  };

  const onCanvasDown = e => {
    if (connectFrom === null) setSelected(null);
    if (!connectFrom) panRef.current = { smx: e.clientX, smy: e.clientY, svp: { ...vpRef.current } };
  };

  const submitEdge = e => {
    e.preventDefault();
    if (edgePending) onAddEdge(edgePending.from, edgePending.to, edgeDraft.label, edgeDraft.type);
    setEdgePending(null); setEdgeDraft({ label: '', type: 'suspects' }); setConnectFrom(null);
  };

  const existingNpcIds = (theories.nodes || []).map(n => n.npcId).filter(Boolean);

  return (
    <div className="theory-board-wrap">
      <div className="theory-toolbar">
        <button className={`tbtn ${connectFrom !== null ? 'brass' : ''}`} onClick={() => setConnectFrom(connectFrom !== null ? null : '')}>
          {connectFrom === null ? 'Connect nodes' : connectFrom === '' ? 'Click first node...' : 'Click second node...'}
        </button>
        <button className={`tbtn ${addPanel ? 'brass' : ''}`} onClick={() => setAddPanel(v => !v)}>Add node</button>
        <span className="theory-toolbar-sep" />
        <button className="tbtn" onClick={() => { const nv = { x: 40, y: 40, scale: 1 }; vpRef.current = nv; setVp(nv); }}>Reset view</button>
        <span className="theory-hint">{connectFrom !== null ? (connectFrom === '' ? 'Click the first node to connect from' : 'Now click the target node') : selected ? 'Delete/Backspace to remove node -- Double-click to edit' : 'Drag nodes -- Scroll to zoom -- Drag canvas to pan'}</span>
      </div>
      {edgePending && (
        <form className="theory-edge-form" onSubmit={submitEdge}>
          <span style={{ fontSize: 12, color: 'var(--fg-3)', flexShrink: 0 }}>Type:</span>
          <select value={edgeDraft.type} onChange={e => setEdgeDraft(d => ({ ...d, type: e.target.value }))}>
            {THEORY_EDGE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <input value={edgeDraft.label} onChange={e => setEdgeDraft(d => ({ ...d, label: e.target.value }))} placeholder="Optional note..." autoFocus style={{ flex: 1 }} />
          <button type="submit" className="tbtn brass">Add connection</button>
          <button type="button" className="tbtn" onClick={() => { setEdgePending(null); setConnectFrom(null); }}>Cancel</button>
        </form>
      )}
      <div className="theory-canvas-wrap">
        {addPanel && (
          <TheoryAddPanel publicNpcs={publicNpcs} existingNpcIds={existingNpcIds} onAdd={(label, type, npcId, note) => { onAddNode(label, type, npcId, note); setAddPanel(false); }} onClose={() => setAddPanel(false)} />
        )}
        <svg ref={svgRef} className="theory-svg" viewBox={`0 0 ${THEORY_W} ${THEORY_H}`} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onMouseDown={onCanvasDown} style={{ cursor: connectFrom !== null ? 'crosshair' : 'default' }}>
          <defs>
            <marker id="th-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill="oklch(0.45 0.02 60)" />
            </marker>
          </defs>
          <g transform={`translate(${vp.x},${vp.y}) scale(${vp.scale})`}>
            {(theories.edges || []).map(edge => {
              const na = localNodes.find(n => n.id === edge.a), nb = localNodes.find(n => n.id === edge.b);
              if (!na || !nb) return null;
              const ax = na.x * THEORY_W, ay = na.y * THEORY_H, bx = nb.x * THEORY_W, by = nb.y * THEORY_H;
              const col = THEORY_EDGE_COLOR[edge.type] || 'var(--fg-3)', isHov = hovEdge === edge.id;
              return (
                <g key={edge.id}>
                  <line x1={ax} y1={ay} x2={bx} y2={by} stroke={col} strokeWidth={isHov ? 2.5 : 1.5} strokeOpacity={isHov ? 0.9 : 0.5} strokeDasharray={edge.type === 'unknown' ? '6,4' : undefined} markerEnd="url(#th-arrow)" />
                  <line x1={ax} y1={ay} x2={bx} y2={by} stroke="transparent" strokeWidth={18} onMouseEnter={() => setHovEdge(edge.id)} onMouseLeave={() => setHovEdge(null)} onClick={() => { if (window.confirm('Remove this connection?')) onRemoveEdge(edge.id); }} style={{ cursor: 'pointer' }} />
                  <text x={(ax + bx) / 2} y={(ay + by) / 2 - 8} textAnchor="middle" fontSize={10} fill={col} fillOpacity={0.8} style={{ userSelect: 'none', pointerEvents: 'none' }}>{edge.label || edge.type}</text>
                </g>
              );
            })}
            {localNodes.map(node => {
              const cx = node.x * THEORY_W, cy = node.y * THEORY_H;
              const isSel = selected === node.id, isConnSrc = connectFrom === node.id;
              const col = THEORY_TYPE_COLOR[node.type] || 'var(--fg-3)';
              const suspRing = node.suspicion === 'high' ? 'var(--crimson)' : node.suspicion === 'medium' ? 'var(--amber)' : 'var(--forest)';
              const initials = (node.label || '?').split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
              return (
                <g key={node.id} style={{ cursor: 'pointer' }} onMouseDown={e => onNodeDown(e, node)} onDoubleClick={e => { e.stopPropagation(); setEditNode({ ...node }); }}>
                  {(isSel || isConnSrc) && <circle cx={cx} cy={cy} r={NODE_R + 8} fill="none" stroke={isConnSrc ? 'var(--amber)' : 'white'} strokeWidth={1.5} strokeOpacity={0.55} />}
                  <circle cx={cx} cy={cy} r={NODE_R + 3} fill="none" stroke={suspRing} strokeWidth={2.5} strokeOpacity={0.4} />
                  <circle cx={cx} cy={cy} r={NODE_R} fill="oklch(0.16 0.015 60)" stroke={col} strokeWidth={isSel ? 2.5 : 1.5} />
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={13} fontWeight={700} fill={col} style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: 'var(--f-display)' }}>{initials}</text>
                  <text x={cx} y={cy + NODE_R + 15} textAnchor="middle" fontSize={11.5} fill="var(--fg-1)" style={{ userSelect: 'none', pointerEvents: 'none' }}>{node.label.length > 16 ? node.label.slice(0, 15) + '...' : node.label}</text>
                  {node.note && <text x={cx} y={cy + NODE_R + 28} textAnchor="middle" fontSize={9.5} fill="var(--fg-4)" style={{ userSelect: 'none', pointerEvents: 'none' }}>{node.note.slice(0, 26)}{node.note.length > 26 ? '...' : ''}</text>}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      {editNode && <TheoryNodeEditor node={editNode} onSave={p => { onUpdateNode(editNode.id, p); setEditNode(null); }} onRemove={() => { onRemoveNode(editNode.id); setEditNode(null); setSelected(null); }} onClose={() => setEditNode(null)} />}
    </div>
  );
}

function TheoryAddPanel({ publicNpcs, existingNpcIds, onAdd, onClose }) {
  const [tab, setTab] = React.useState(publicNpcs.length ? 'npc' : 'custom');
  const [label, setLabel] = React.useState('');
  const [type, setType] = React.useState('unknown');
  const [note, setNote] = React.useState('');
  const iS = { width: '100%', boxSizing: 'border-box', background: 'oklch(0.14 0.01 60)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '7px 10px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit' };
  const addCustom = e => { e.preventDefault(); if (!label.trim()) return; onAdd(label, type, null, note); };
  return (
    <div className="theory-add-panel">
      <div className="theory-add-head"><span>Add to board</span><button type="button" onClick={onClose}>x</button></div>
      <div className="theory-subtabs">
        <button type="button" className={tab === 'npc' ? 'active' : ''} onClick={() => setTab('npc')}>Known NPC</button>
        <button type="button" className={tab === 'custom' ? 'active' : ''} onClick={() => setTab('custom')}>Unknown / Theory</button>
      </div>
      {tab === 'npc' && (
        <div className="theory-npc-list">
          {publicNpcs.length === 0 && <div className="muted" style={{ padding: 12, fontSize: 12 }}>No NPCs published by the DM yet.</div>}
          {publicNpcs.map(n => {
            const added = existingNpcIds.includes(n.id);
            return <button key={n.id} type="button" className="theory-npc-btn" disabled={added} onClick={() => onAdd(n.name, 'npc', n.id, '')}><span className="theory-npc-name">{n.name}</span>{n.title && <span className="theory-npc-title">{n.title}</span>}{added && <span className="smallcaps" style={{ fontSize: 9, color: 'var(--fg-4)', marginLeft: 'auto', flexShrink: 0 }}>on board</span>}</button>;
          })}
        </div>
      )}
      {tab === 'custom' && (
        <form onSubmit={addCustom} style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div><div style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 3 }}>Label *</div><input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. The Contact, Unknown Mage..." style={iS} autoFocus /></div>
          <div><div style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 3 }}>Type</div><select value={type} onChange={e => setType(e.target.value)} style={{ ...iS, paddingRight: 8 }}><option value="unknown">Unknown person</option><option value="faction">Faction / organization</option><option value="event">Event / incident</option><option value="npc">Known NPC (manual)</option></select></div>
          <div><div style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 3 }}>Your theory (private)</div><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What do you suspect? What did you observe?" style={{ ...iS, resize: 'vertical', minHeight: 60 }} /></div>
          <button type="submit" className="tbtn brass">Add to board</button>
        </form>
      )}
    </div>
  );
}

function TheoryNodeEditor({ node, onSave, onRemove, onClose }) {
  const [d, setD] = React.useState({ label: node.label, note: node.note || '', suspicion: node.suspicion || 'medium' });
  const iS = { width: '100%', boxSizing: 'border-box', background: 'oklch(0.14 0.01 60)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '7px 10px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit' };
  React.useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="theory-node-editor-backdrop" onClick={onClose}>
      <div className="theory-node-editor" onClick={e => e.stopPropagation()}>
        <div className="theory-node-editor-head"><span>{node.label}</span><button type="button" onClick={onClose}>x</button></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px' }}>
          <div><div style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 3 }}>Name / label</div><input value={d.label} onChange={e => setD(p => ({ ...p, label: e.target.value }))} style={iS} autoFocus /></div>
          <div><div style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 3 }}>Your theory / private note</div><textarea value={d.note} onChange={e => setD(p => ({ ...p, note: e.target.value }))} placeholder="What do you suspect? What did you notice?" rows={5} style={{ ...iS, resize: 'vertical' }} /></div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 6 }}>Suspicion level</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['low', 'var(--forest)'], ['medium', 'var(--amber)'], ['high', 'var(--crimson)']].map(([s, col]) => (
                <button key={s} type="button" className="tbtn" style={{ flex: 1, justifyContent: 'center', borderColor: d.suspicion === s ? col : undefined, color: d.suspicion === s ? col : undefined }} onClick={() => setD(p => ({ ...p, suspicion: s }))}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--hairline-2)' }}>
            <button type="button" className="tbtn brass" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onSave(d)}>Save</button>
            <button type="button" className="tbtn" style={{ color: 'var(--crimson)' }} onClick={onRemove}>Remove node</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerTheories({ theories, publicNpcs, onAddNode, onUpdateNode, onRemoveNode, onAddEdge, onRemoveEdge }) {
  const nodes = theories?.nodes || [], edges = theories?.edges || [];
  return (
    <div className="player-tab-page theories-page">
      <div className="theories-header">
        <div><h2 style={{ fontFamily: 'var(--f-display)', fontSize: 24, margin: 0 }}>Theory Board</h2><p style={{ fontSize: 12.5, color: 'var(--fg-4)', margin: '4px 0 0' }}>Private to you -- your suspects, hunches, and conspiracy map.</p></div>
        <span style={{ fontSize: 11, color: 'var(--fg-4)' }}>{nodes.length} node{nodes.length !== 1 ? 's' : ''} / {edges.length} connection{edges.length !== 1 ? 's' : ''}</span>
      </div>
      {nodes.length === 0 && edges.length === 0 && <div className="theory-empty"><p>Nothing mapped yet. Use <strong>Add node</strong> to place NPCs or theories, then <strong>Connect nodes</strong> to draw links.</p></div>}
      <TheoryBoard theories={theories} publicNpcs={publicNpcs} onAddNode={onAddNode} onUpdateNode={onUpdateNode} onRemoveNode={onRemoveNode} onAddEdge={onAddEdge} onRemoveEdge={onRemoveEdge} />
    </div>
  );
}
// ─── MODALS / OVERLAYS ───────────────────────────────────────────────────────

function NpcModal({ npc, onClose }) {
  React.useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const initial = (npc.name || '?')[0].toUpperCase();
  const dispColor = { ally: 'var(--forest)', hostile: 'var(--crimson)', ambiguous: 'var(--amber)', neutral: 'var(--fg-3)' };

  return (
    <div className="npc-modal-backdrop" onClick={onClose}>
      <div className="npc-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="npc-modal-close" onClick={onClose}>✕</button>
        <div className="npc-modal-head">
          <div className="npc-modal-avatar">{npc.image ? <img src={npc.image} alt="" /> : initial}</div>
          <div>
            <h2>{npc.name}</h2>
            <div className="muted">{npc.title || npc.location || 'Known contact'}</div>
            {npc.disposition && (
              <span className="npc-modal-disp" style={{ color: dispColor[npc.disposition] || 'var(--fg-2)' }}>{npc.disposition}</span>
            )}
          </div>
        </div>
        <div className="npc-modal-body">
          {npc.summary && <div className="npc-modal-section"><div className="smallcaps">About</div><p>{npc.summary}</p></div>}
          {npc.ideology && <div className="npc-modal-section"><div className="smallcaps">Ideology</div><p>{npc.ideology}</p></div>}
          {npc.location && <div className="npc-modal-section"><div className="smallcaps">Known Location</div><p>{npc.location}</p></div>}
          {npc.note && <div className="npc-modal-section"><div className="smallcaps">Party Note</div><p>{npc.note}</p></div>}
          {(npc.imageCredit || npc.imageSourceUrl) && (
            <div className="npc-modal-section">
              <div className="smallcaps">Image source</div>
              <p className="player-image-credit">
                {npc.imageCredit && <span>{npc.imageCredit}</span>}
                {npc.imageSourceUrl && <a href={npc.imageSourceUrl} target="_blank" rel="noreferrer">source</a>}
              </p>
            </div>
          )}
          {npc.leader && <div className="npc-modal-section"><div className="smallcaps">Leads</div><p>{npc.leader}</p></div>}
          {npc.seat && <div className="npc-modal-section"><div className="smallcaps">Seat of Power</div><p>{npc.seat}</p></div>}
        </div>
      </div>
    </div>
  );
}

function ThemePicker({ currentTheme, dmTheme, onPick, onReset, onClose }) {
  const themes = window.WARROOM_THEMES || [];
  return (
    <div className="theme-picker-backdrop" onClick={onClose}>
      <div className="theme-picker-panel" onClick={e => e.stopPropagation()}>
        <div className="theme-picker-head">
          <span>Table Mood</span>
          <button type="button" onClick={onClose}>✕</button>
        </div>
        <div className="theme-picker-grid">
          {themes.map(t => (
            <button
              key={t.id}
              type="button"
              className={`theme-swatch-btn ${currentTheme === t.id ? 'active' : ''}`}
              onClick={() => { onPick(t.id); onClose(); }}
              title={t.tagline || t.name}
            >
              <div className="theme-swatch-colors">
                {(t.swatches || []).slice(0, 4).map((s, i) => (
                  <span key={i} style={{ background: s }} />
                ))}
              </div>
              <span className="theme-swatch-name">{t.name}</span>
              {t.id === dmTheme && <span className="theme-swatch-dm">DM</span>}
            </button>
          ))}
        </div>
        {currentTheme !== dmTheme && (
          <button type="button" className="theme-picker-reset" onClick={() => { onReset(); onClose(); }}>
            Reset to DM's theme
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SHARED SUB-COMPONENTS ───────────────────────────────────────────────────

function PlayerGoals({ goals, onAdd, onToggle, onRemove }) {
  const [text, setText] = React.useState('');
  const submit = e => { e.preventDefault(); onAdd(text); setText(''); };
  return (
    <PlayerPanel title="Personal Goals" kicker="your agenda">
      <div className="player-goals">
        {goals.map(g => (
          <label key={g.id} className={`player-goal ${g.done ? 'done' : ''}`}>
            <input type="checkbox" checked={g.done} onChange={() => onToggle(g.id)} />
            <span>{g.text}</span>
            <button type="button" onClick={() => onRemove(g.id)} aria-label="Remove goal">×</button>
          </label>
        ))}
      </div>
      <form className="player-addline" onSubmit={submit}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Add a character goal…" />
        <button type="submit">Add</button>
      </form>
    </PlayerPanel>
  );
}

function PrivateNotes({ desk, patch, compact = false }) {
  return (
    <PlayerPanel title="Questions & Mementos" kicker={compact ? 'quick notes' : 'bring to table'}>
      <label className="player-label">Questions for the DM</label>
      <textarea className="player-textarea compact" value={desk.questions} onChange={e => patch('questions', e.target.value)} placeholder="What do you want to ask between sessions?" />
      <label className="player-label">Mementos / inventory notes</label>
      <textarea className="player-textarea compact" value={desk.mementos} onChange={e => patch('mementos', e.target.value)} placeholder="Keepsakes, promises, injuries, debts, strange items…" />
    </PlayerPanel>
  );
}

function PlayerPanel({ icon: I, title, kicker, empty, children, style }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <div className="card cornered player-panel" style={style}>
      <div className="head">
        {I && <I />}
        <span className="title">{title}</span>
        {kicker && <span className="sub">{kicker}</span>}
      </div>
      <div className="body">{items.length ? items : <div className="muted">{empty}</div>}</div>
    </div>
  );
}

function IntelRow({ title, meta, text, active }) {
  return (
    <div className={`player-intel ${active ? 'active' : ''}`}>
      <div>
        <strong>{title}</strong>
        {text && <p>{text}</p>}
      </div>
      {meta && <span>{meta}</span>}
    </div>
  );
}

function FaceRow({ npc, onClick }) {
  return (
    <div
      className={`player-face ${onClick ? 'clickable' : ''}`}
      onClick={onClick ? () => onClick(npc) : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick(npc) : undefined}
    >
      <div className="player-avatar">
        {npc.image ? <img src={npc.image} alt="" /> : (npc.name || '?')[0]}
      </div>
      <div>
        <strong>{npc.name}</strong>
        <p>{npc.title || npc.location || 'Known contact'}</p>
        {npc.disposition && <span className={`disp-badge disp-${npc.disposition}`}>{npc.disposition}</span>}
        {(npc.imageCredit || npc.imageSourceUrl) && (
          <div className="player-image-credit">
            {npc.imageCredit && <span>{npc.imageCredit}</span>}
            {npc.imageSourceUrl && <a href={npc.imageSourceUrl} target="_blank" rel="noreferrer">source</a>}
          </div>
        )}
      </div>
      {onClick && <span className="face-expand">›</span>}
    </div>
  );
}

function PlaceCard({ loc }) {
  return (
    <article className={`player-place-card ${loc.party ? 'current' : ''}`}>
      <div className="player-place-media">
        {loc.image ? <img src={loc.image} alt="" /> : <Icon.Locations />}
        {loc.party && <span>party here</span>}
      </div>
      <div className="player-place-body">
        <div className="smallcaps">{loc.kind || 'place'}</div>
        <h3>{loc.label || loc.name || 'Unknown place'}</h3>
        <p>{loc.note || 'No public note yet.'}</p>
        {(loc.imageCredit || loc.imageSourceUrl) && (
          <div className="player-image-credit">
            {loc.imageCredit && <span>{loc.imageCredit}</span>}
            {loc.imageSourceUrl && <a href={loc.imageSourceUrl} target="_blank" rel="noreferrer">source</a>}
          </div>
        )}
      </div>
    </article>
  );
}

function HandoutCard({ handout }) {
  return (
    <article className="player-handout">
      <div className="player-handout-media">
        {handout.image ? <img src={handout.image} alt="" /> : <Icon.Handouts />}
      </div>
      <div>
        <span>{handout.kind || 'note'}</span>
        <h3>{handout.title}</h3>
        <p>{handout.body}</p>
      </div>
    </article>
  );
}

function EmptyPlayerState({ title, text }) {
  return (
    <div className="app" style={{ gridTemplateColumns: '1fr' }}>
      <main className="main">
        <div className="page fade-up" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, marginBottom: 12 }}>{title}</div>
            <div style={{ color: 'var(--fg-3)', fontSize: 14 }}>{text}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── BOOT ────────────────────────────────────────────────────────────────────

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PlayerApp />);
