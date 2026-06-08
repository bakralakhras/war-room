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
    portrait: '',
    customChars: [],
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
  if (!desk.portrait) desk.portrait = base.portrait;
  if (!desk.customChars) desk.customChars = base.customChars;
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

  const addTheoryNode = (label, type, sourceId, note, image) => {
    const node = { id: 'tn-' + Date.now(), label: label.trim(), type: type || 'unknown', sourceId: sourceId || null, note: (note || '').trim(), image: (image || '').trim(), x: 0.25 + Math.random() * 0.5, y: 0.25 + Math.random() * 0.5, suspicion: 'medium' };
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
  const addCustomChar = (name, role, image, note) => {
    const c = { id: 'cc-' + Date.now(), name: name.trim(), role: (role||'').trim(), image: (image||'').trim(), note: (note||'').trim() };
    setDesk(d => ({ ...d, customChars: [...(d.customChars||[]), c] }));
    return c.id;
  };
  const updateCustomChar = (id, p) => setDesk(d => ({ ...d, customChars: (d.customChars||[]).map(c => c.id === id ? { ...c, ...p } : c) }));
  const removeCustomChar = (id) => setDesk(d => ({ ...d, customChars: (d.customChars||[]).filter(c => c.id !== id) }));

  return { desk, patch, addGoal, toggleGoal, removeGoal, addJournalEntry, updateJournalEntry, removeJournalEntry, addSpark, removeSpark, patchHp, patchTrait, addInventory, updateInventory, removeInventory, addAbility, removeAbility, addTheoryNode, updateTheoryNode, removeTheoryNode, addTheoryEdge, removeTheoryEdge, addCustomChar, updateCustomChar, removeCustomChar };
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
  const { desk, patch, addGoal, toggleGoal, removeGoal, addJournalEntry, updateJournalEntry, removeJournalEntry, addSpark, removeSpark, patchHp, patchTrait, addInventory, updateInventory, removeInventory, addAbility, removeAbility, addTheoryNode, updateTheoryNode, removeTheoryNode, addTheoryEdge, removeTheoryEdge, addCustomChar, updateCustomChar, removeCustomChar } = usePlayerDesk(campaignId, player);
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
              <PlayerTheories theories={desk.theories || { nodes: [], edges: [] }} publicNpcs={publicNpcs} publicParty={state?.party || []} customChars={desk.customChars || []} player={player} onAddNode={addTheoryNode} onUpdateNode={updateTheoryNode} onRemoveNode={removeTheoryNode} onAddEdge={addTheoryEdge} onRemoveEdge={removeTheoryEdge} />
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
  const [editPortrait, setEditPortrait] = React.useState(false);
  const [portraitDraft, setPortraitDraft] = React.useState('');
  const initials = (player?.character || '?').split(/\s+/).map(s => s[0]).join('').slice(0, 2);
  const portrait = desk.portrait || '';

  const openPortrait = () => { setPortraitDraft(portrait); setEditPortrait(true); };
  const savePortrait = e => { e.preventDefault(); patch('portrait', portraitDraft.trim()); setEditPortrait(false); };

  return (
    <div className="player-hero">
      <div className="player-sigil-wrap" onClick={openPortrait} title="Click to change portrait">
        {portrait
          ? <img src={portrait} alt="" className="player-sigil-img" />
          : <div className="player-sigil">{initials}</div>
        }
        <div className="player-sigil-edit-hint">edit</div>
      </div>
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
      {editPortrait && (
        <div className="theory-node-editor-backdrop" onClick={() => setEditPortrait(false)}>
          <form className="theory-node-editor" onClick={e => e.stopPropagation()} onSubmit={savePortrait}>
            <div className="theory-node-editor-head"><span>Character portrait</span><button type="button" onClick={() => setEditPortrait(false)}>×</button></div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Paste an image URL. This portrait appears on your hero card and in the theory board.</div>
              <input value={portraitDraft} onChange={e => setPortraitDraft(e.target.value)} placeholder="https://…" autoFocus style={{ width: '100%', boxSizing: 'border-box', background: 'oklch(0.14 0.01 60)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '7px 10px', fontSize: 12.5, outline: 'none' }} />
              {portraitDraft && <img src={portraitDraft} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--hairline-2)', alignSelf: 'center' }} />}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="tbtn" onClick={() => { patch('portrait', ''); setEditPortrait(false); }}>Remove portrait</button>
                <button type="submit" className="tbtn brass">Save</button>
              </div>
            </div>
          </form>
        </div>
      )}
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
// Same portrait-card conspiracy board as the DM's relationships screen,
// but private per-player (local storage only, DM never sees it).

const TB_W = 1400, TB_H = 950;
const TB_THREAD_TYPES = ['suspects','trusts','allies','enemies','owes','family','knows','unknown'];

function tbThreadStyle(type) {
  if (type === 'suspects') return { stroke: 'oklch(0.66 0.15 50)',  dash: '5 3', w: 1.4 };
  if (type === 'trusts')   return { stroke: 'oklch(0.6 0.10 150)',  dash: '0',   w: 1.2 };
  if (type === 'allies')   return { stroke: 'oklch(0.55 0.10 150)', dash: '0',   w: 1.2 };
  if (type === 'enemies')  return { stroke: 'oklch(0.55 0.18 26)',  dash: '0',   w: 1.6 };
  if (type === 'owes')     return { stroke: 'oklch(0.66 0.15 50)',  dash: '4 3', w: 1.4 };
  if (type === 'family')   return { stroke: 'oklch(0.74 0.06 80)',  dash: '0',   w: 1.2 };
  if (type === 'loves')    return { stroke: 'oklch(0.7 0.16 26)',   dash: '0',   w: 1.4 };
  return { stroke: 'oklch(0.55 0.014 80)', dash: '2 4', w: 1 };
}

function tbNodeColors(type) {
  const m = {
    npc:     ['oklch(0.42 0.07 80)',  'oklch(0.22 0.05 60)'],
    party:   ['oklch(0.5 0.10 50)',   'oklch(0.28 0.08 50)'],
    self:    ['oklch(0.56 0.14 50)',  'oklch(0.35 0.10 50)'],
    custom:  ['oklch(0.42 0.13 26)',  'oklch(0.22 0.10 26)'],
    faction: ['oklch(0.42 0.07 235)', 'oklch(0.20 0.05 235)'],
    event:   ['oklch(0.38 0.012 60)', 'oklch(0.18 0.012 60)'],
    unknown: ['oklch(0.32 0.012 60)', 'oklch(0.16 0.012 60)'],
  };
  return m[type] || m.unknown;
}

function tbWrapLabel(label, max) {
  const words = String(label || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = []; let line = '';
  words.forEach(w => {
    if (w.length > max) { if (line) { lines.push(line); line = ''; } for (let i = 0; i < w.length; i += max) lines.push(w.slice(i, i + max)); return; }
    const next = line ? line + ' ' + w : w;
    if (next.length <= max) { line = next; } else { lines.push(line); line = w; }
  });
  if (line) lines.push(line);
  return lines;
}

function TBPortrait({ label, type, image, onLinkStart }) {
  const [a, b] = tbNodeColors(type);
  const safe = (label || '').replace(/\W/g, '').slice(0, 8);
  const gradId = 'tbg-' + type + '-' + safe;
  const CW = 60, half = 30;
  const lines = tbWrapLabel(label, 11);
  const lh = 7.5;
  const npH = Math.max(12, lines.length * lh + 4);
  const cardH = 12 + npH + 20;
  return (
    <g>
      <circle cx="0" cy="-30" r="3.5" fill="var(--brass)" stroke="oklch(0.16 0.04 30)" strokeWidth="0.5" />
      <circle cx="0" cy="-30" r="11" fill="transparent" stroke="transparent" onMouseDown={onLinkStart} style={{ cursor: 'crosshair' }} />
      <line x1="0" y1="-27" x2="0" y2="-20" stroke="oklch(0.32 0.014 60)" strokeWidth="0.9" />
      <rect x={-half} y="-20" width={CW} height={cardH} rx="2.5" fill="oklch(0.92 0.04 80)" stroke="oklch(0.4 0.07 60)" strokeWidth="0.7" />
      {image ? (
        <>
          <clipPath id={gradId + '-clip'}><rect x={-half + 2} y="-18" width={CW - 4} height="28" /></clipPath>
          <image href={image} x={-half + 2} y="-18" width={CW - 4} height="28" preserveAspectRatio="xMidYMid slice" clipPath={'url(#' + gradId + '-clip)'} />
        </>
      ) : (
        <rect x={-half + 2} y="-18" width={CW - 4} height="28" fill={'url(#' + gradId + ')'} />
      )}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
      </defs>
      {!image && (
        <>
          <circle cx="0" cy="-5" r="6" fill="oklch(0.16 0.04 30)" opacity="0.6" />
          <path d="M -13 12 Q 0 0 13 12" fill="oklch(0.16 0.04 30)" opacity="0.6" />
        </>
      )}
      <rect x={-half} y="12" width={CW} height={npH} fill="oklch(0.85 0.04 80)" stroke="oklch(0.4 0.07 60)" strokeWidth="0.5" />
      <text textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="9" fill="oklch(0.22 0.06 40)" letterSpacing="0.3">
        {lines.map((l, i) => <tspan key={i} x="0" y={12 + 8 + i * lh}>{l}</tspan>)}
      </text>
    </g>
  );
}

function TBNodeAvatar({ type, image }) {
  const [a] = tbNodeColors(type);
  return (
    <div style={{ width: 26, height: 26, borderRadius: 3, background: a, border: '1px solid var(--brass-dim)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
      {image
        ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'oklch(0 0 0 / 0.4)' }} />
      }
    </div>
  );
}

function TheoryBoard({ theories, publicNpcs, publicParty, customChars, onAddNode, onUpdateNode, onRemoveNode, onAddEdge, onRemoveEdge }) {
  const nodes = theories?.nodes || [], edges = theories?.edges || [];
  const W = TB_W, H = TB_H;

  const [vp, setVp] = React.useState({ x: 0, y: 0, scale: 1 });
  const vpRef = React.useRef({ x: 0, y: 0, scale: 1 });
  React.useEffect(() => { vpRef.current = vp; }, [vp]);

  const [localNodes, setLocalNodes] = React.useState(() => nodes.map(n => ({ ...n })));
  React.useEffect(() => { setLocalNodes(nodes.map(n => ({ ...n }))); }, [nodes.length]);

  const [hovered, setHovered] = React.useState(null);
  const [hovEdge, setHovEdge] = React.useState(null);
  const [drag, setDrag] = React.useState(null);
  const [linkDrag, setLinkDrag] = React.useState(null);
  const [pendingThread, setPendingThread] = React.useState(null);
  const [threadDraft, setThreadDraft] = React.useState({ type: 'suspects', label: '' });
  const [panning, setPanning] = React.useState(false);
  const [editNode, setEditNode] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [showAdd, setShowAdd] = React.useState(false);
  const [filter, setFilter] = React.useState(() => TB_THREAD_TYPES.reduce((a, t) => { a[t] = true; return a; }, {}));

  const svgRef = React.useRef(null);
  const linkRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const panRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const mouseRef = React.useRef({ x: 0, y: 0 });
  const hovEdgeRef = React.useRef(null);
  React.useEffect(() => { hovEdgeRef.current = hovEdge; }, [hovEdge]);

  React.useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
      if (hovEdgeRef.current) { e.preventDefault(); onRemoveEdge(hovEdgeRef.current); setHovEdge(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const onWheel = e => {
      e.preventDefault();
      const v = vpRef.current, r = el.getBoundingClientRect();
      const sx = (e.clientX - r.left) / r.width * W, sy = (e.clientY - r.top) / r.height * H;
      const f = e.deltaY < 0 ? 1.13 : 1 / 1.13;
      const ns = Math.max(0.07, Math.min(7, v.scale * f));
      const cx = (sx - v.x) / v.scale, cy = (sy - v.y) / v.scale;
      const nv = { scale: ns, x: sx - cx * ns, y: sy - cy * ns };
      vpRef.current = nv; setVp(nv);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const applyZoom = ns => {
    const v = vpRef.current; ns = Math.max(0.07, Math.min(7, ns));
    const cx = (W / 2 - v.x) / v.scale, cy = (H / 2 - v.y) / v.scale;
    const nv = { scale: ns, x: W / 2 - cx * ns, y: H / 2 - cy * ns };
    vpRef.current = nv; setVp(nv);
  };

  const fitAll = () => {
    if (!localNodes.length) return;
    const pad = 110;
    const xs = localNodes.map(n => n.x * W), ys = localNodes.map(n => n.y * H);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const bW = x1 - x0 + pad * 2 || 200, bH = y1 - y0 + pad * 2 || 200;
    const scale = Math.min(W / bW, H / bH, 1.8);
    const nv = { scale, x: W / 2 - ((x0 + x1) / 2) * scale, y: H / 2 - ((y0 + y1) / 2) * scale };
    vpRef.current = nv; setVp(nv);
  };

  const screenToContent = (cx, cy) => {
    const v = vpRef.current, r = svgRef.current.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width * W - v.x) / v.scale, y: ((cy - r.top) / r.height * H - v.y) / v.scale };
  };

  const nodeAtPoint = (x, y, exceptId) => localNodes.find(n => n.id !== exceptId && Math.hypot(n.x * W - x, n.y * H - y) <= 46);

  const handleNodeDown = (e, node) => {
    e.stopPropagation();
    const v = vpRef.current, r = svgRef.current.getBoundingClientRect();
    const sx = (e.clientX - r.left) / r.width * W, sy = (e.clientY - r.top) / r.height * H;
    dragRef.current = { id: node.id, ox: (sx - v.x) / v.scale - node.x * W, oy: (sy - v.y) / v.scale - node.y * H };
    setDrag({ id: node.id });
  };

  const handleLinkStart = (e, node) => {
    e.stopPropagation(); e.preventDefault();
    const p = screenToContent(e.clientX, e.clientY);
    const start = { from: node.id, x1: node.x * W, y1: node.y * H, x2: p.x, y2: p.y, over: null };
    linkRef.current = start; setLinkDrag(start); setHovered(node.id);
  };

  const handlePanStart = e => {
    if (e.button !== 0) return;
    const v = vpRef.current, r = svgRef.current.getBoundingClientRect();
    panRef.current = { sx0: (e.clientX - r.left) / r.width * W, sy0: (e.clientY - r.top) / r.height * H, vx0: v.x, vy0: v.y };
    mouseRef.current = { x: e.clientX, y: e.clientY };
    setPanning(true);
  };

  const handleMove = e => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
    if (!dragRef.current && !linkRef.current && !panRef.current) return;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null; if (!svgRef.current) return;
      const r = svgRef.current.getBoundingClientRect();
      const sx = (mouseRef.current.x - r.left) / r.width * W, sy = (mouseRef.current.y - r.top) / r.height * H;
      const v = vpRef.current;
      if (linkRef.current) {
        const p = screenToContent(mouseRef.current.x, mouseRef.current.y);
        const over = nodeAtPoint(p.x, p.y, linkRef.current.from);
        const next = { ...linkRef.current, x2: p.x, y2: p.y, over: over?.id || null };
        linkRef.current = next; setLinkDrag(next); setHovered(over?.id || linkRef.current.from);
      } else if (dragRef.current) {
        const d = dragRef.current, cx = (sx - v.x) / v.scale, cy = (sy - v.y) / v.scale;
        setLocalNodes(prev => prev.map(n => n.id === d.id ? { ...n, x: Math.max(0.01, Math.min(0.99, (cx - d.ox) / W)), y: Math.max(0.01, Math.min(0.99, (cy - d.oy) / H)) } : n));
      } else if (panRef.current) {
        const p = panRef.current;
        const nv = { ...v, x: p.vx0 + (sx - p.sx0), y: p.vy0 + (sy - p.sy0) };
        vpRef.current = nv; setVp(nv);
      }
    });
  };

  const handleUp = e => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (linkRef.current) {
      const pt = e ? screenToContent(e.clientX, e.clientY) : null;
      const target = pt ? nodeAtPoint(pt.x, pt.y, linkRef.current.from) : null;
      const link = { ...linkRef.current, over: target?.id || linkRef.current.over };
      linkRef.current = null; setLinkDrag(null); setHovered(null);
      if (e && link.over) {
        const na = localNodes.find(n => n.id === link.from), nb = localNodes.find(n => n.id === link.over);
        setThreadDraft({ type: 'suspects', label: '' });
        setPendingThread({ a: link.from, b: link.over, x: ((na?.x || 0.5) * W + (nb?.x || 0.5) * W) / 2, y: ((na?.y || 0.5) * H + (nb?.y || 0.5) * H) / 2 });
      }
      return;
    }
    if (dragRef.current) {
      const node = localNodes.find(n => n.id === dragRef.current.id);
      if (node) onUpdateNode(node.id, { x: node.x, y: node.y });
      dragRef.current = null; setDrag(null);
    }
    panRef.current = null; setPanning(false);
  };

  const handleLeave = () => { if (linkRef.current) { linkRef.current = null; setLinkDrag(null); setHovered(null); return; } handleUp(); };

  const sq = search.trim().toLowerCase(), searching = sq.length > 0;
  const matchesSearch = l => (l || '').toLowerCase().includes(sq);
  const visibleEdge = e => filter[e.type] !== false;
  const nodeOpacity = n => {
    if (searching) return matchesSearch(n.label) ? 1 : 0.1;
    const hd = hovered && hovered !== n.id && !edges.some(e => (e.a === hovered && e.b === n.id) || (e.b === hovered && e.a === n.id));
    const ed = hovEdge && !edges.some(e => e.id === hovEdge && (e.a === n.id || e.b === n.id));
    return hd || ed ? 0.18 : 1;
  };
  const edgeOpacity = e => {
    if (searching) { const aM = matchesSearch(localNodes.find(n => n.id === e.a)?.label || ''), bM = matchesSearch(localNodes.find(n => n.id === e.b)?.label || ''); return aM && bM ? 0.9 : aM || bM ? 0.3 : 0.04; }
    if (!hovered && !hovEdge) return 0.9;
    return (hovered && (hovered === e.a || hovered === e.b)) || hovEdge === e.id ? 1 : 0.12;
  };

  const pendingPos = pendingThread ? {
    left: Math.max(18, Math.min(82, ((pendingThread.x * vp.scale + vp.x) / W) * 100)) + '%',
    top: Math.max(16, Math.min(84, ((pendingThread.y * vp.scale + vp.y) / H) * 100)) + '%',
  } : null;
  const tdStyle = tbThreadStyle(threadDraft.type);
  const iS = { background: 'oklch(0.16 0.012 60)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '5px 8px', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };

  const onBoard = new Set(nodes.map(n => n.sourceId).filter(Boolean));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 252px', gap: 16, alignItems: 'start', padding: '0 0 24px' }}>

      <div className="card cornered" style={{ overflow: 'hidden' }}>
        <div className="head" style={{ gap: 6 }}>
          <span className="title">Conspiracy Board</span>
          <div className="spacer" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ background: 'oklch(0.16 0.012 60)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '3px 9px', fontSize: 11.5, outline: 'none', width: 120 }} />
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <button className="tbtn" style={{ fontSize: 13, padding: '1px 8px', lineHeight: 1.4 }} onClick={() => applyZoom(vpRef.current.scale * 1.25)}>+</button>
            <button className="tbtn" style={{ fontSize: 13, padding: '1px 8px', lineHeight: 1.4 }} onClick={() => applyZoom(vpRef.current.scale / 1.25)}>-</button>
            <button className="tbtn" style={{ fontSize: 10.5, padding: '2px 8px' }} onClick={fitAll}>Fit</button>
            <button className="tbtn" style={{ fontSize: 10.5, padding: '2px 8px' }} onClick={() => { const nv = { x: 0, y: 0, scale: 1 }; vpRef.current = nv; setVp(nv); }}>1:1</button>
            <span className="mono muted" style={{ fontSize: 10, minWidth: 34, textAlign: 'right' }}>{Math.round(vp.scale * 100)}%</span>
          </div>
          <span className="smallcaps muted" style={{ fontSize: 10, marginLeft: 4 }}>{edges.filter(visibleEdge).length} threads / {nodes.length} portraits</span>
        </div>

        <div style={{ position: 'relative', height: 'calc(100vh - 295px)', minHeight: 440, background: 'radial-gradient(120% 80% at 50% 30%, oklch(0.20 0.012 60) 0%, oklch(0.13 0.012 60) 100%)', userSelect: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, oklch(0 0 0 / 0.06) 0px, oklch(0 0 0 / 0.06) 1px, transparent 1px, transparent 4px), radial-gradient(oklch(0.32 0.06 60 / 0.12) 1px, transparent 1.6px)', backgroundSize: 'auto, 6px 6px', opacity: 0.6 }} />
          {!nodes.length && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, pointerEvents: 'none' }}>
              <div style={{ color: 'var(--fg-3)', fontFamily: 'var(--f-display)', fontSize: 22, fontStyle: 'italic' }}>No portraits pinned yet</div>
              <div style={{ color: 'var(--fg-4)', fontSize: 12 }}>Add from the panel on the right</div>
            </div>
          )}
          <svg ref={svgRef} viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: linkDrag ? 'crosshair' : drag || panning ? 'grabbing' : 'grab' }} onMouseDown={handlePanStart} onMouseMove={handleMove} onMouseUp={handleUp} onMouseLeave={handleLeave}>
            <defs>
              <filter id="tb-shadow"><feDropShadow dx="0" dy="1" stdDeviation="0.6" floodOpacity="0.55" /></filter>
              <filter id="tb-lift"><feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.5" /></filter>
            </defs>
            <g transform={'translate(' + vp.x + ' ' + vp.y + ') scale(' + vp.scale + ')'}>
              {edges.filter(visibleEdge).map(e => {
                const na = localNodes.find(n => n.id === e.a), nb = localNodes.find(n => n.id === e.b);
                if (!na || !nb) return null;
                const s = tbThreadStyle(e.type);
                const x1 = na.x * W, y1 = na.y * H, x2 = nb.x * W, y2 = nb.y * H;
                const isA = (hovered && (hovered === e.a || hovered === e.b)) || hovEdge === e.id;
                const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                return (
                  <g key={e.id} filter="url(#tb-shadow)" opacity={edgeOpacity(e)}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={s.stroke} strokeWidth={isA ? s.w + 1.2 : s.w} strokeDasharray={s.dash} strokeLinecap="round" pointerEvents="none" />
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={Math.max(20, 20 / vp.scale)} onMouseEnter={() => setHovEdge(e.id)} onMouseLeave={() => setHovEdge(null)} style={{ cursor: 'default' }} />
                    {isA && e.label && e.label !== '-' && (
                      <g transform={'translate(' + mx + ',' + my + ')'}>
                        <rect x="-34" y="-10" width="68" height="18" rx="3" fill="oklch(0.18 0.012 60)" stroke={s.stroke} strokeWidth="0.6" />
                        <text textAnchor="middle" y="4" fontFamily="Cormorant Garamond, serif" fontSize="11.5" fontStyle="italic" fill="oklch(0.92 0.012 80)">{e.label}</text>
                      </g>
                    )}
                  </g>
                );
              })}
              {linkDrag && (
                <g pointerEvents="none" filter="url(#tb-shadow)">
                  <line x1={linkDrag.x1} y1={linkDrag.y1} x2={linkDrag.x2} y2={linkDrag.y2} stroke={tbThreadStyle('suspects').stroke} strokeWidth={tbThreadStyle('suspects').w} strokeDasharray={tbThreadStyle('suspects').dash} strokeLinecap="round" opacity={linkDrag.over ? 0.95 : 0.55} />
                </g>
              )}
              {localNodes.map(n => {
                const cx = n.x * W, cy = n.y * H;
                const isD = drag && drag.id === n.id, isL = linkDrag && (linkDrag.from === n.id || linkDrag.over === n.id);
                return (
                  <g key={n.id} transform={'translate(' + cx + ',' + cy + ')'} opacity={nodeOpacity(n)} filter={isD || isL ? 'url(#tb-lift)' : undefined}
                     onMouseEnter={() => !drag && !linkDrag && setHovered(n.id)} onMouseLeave={() => !drag && !linkDrag && setHovered(null)}
                     onMouseDown={e => handleNodeDown(e, n)} onDoubleClick={() => setEditNode({ ...n })}
                     style={{ cursor: isD ? 'grabbing' : 'grab' }}>
                    <TBPortrait label={n.label} type={n.type} image={n.image || ''} onLinkStart={e => handleLinkStart(e, n)} />
                  </g>
                );
              })}
            </g>
          </svg>

          {pendingThread && (
            <form className="card cornered" onSubmit={e => { e.preventDefault(); onAddEdge(pendingThread.a, pendingThread.b, threadDraft.label.trim(), threadDraft.type); setPendingThread(null); }} style={{ position: 'absolute', ...pendingPos, transform: 'translate(-50%,-50%)', width: 278, zIndex: 5, overflow: 'hidden', boxShadow: 'var(--shadow-card), 0 18px 45px oklch(0 0 0 / 0.45)' }}>
              <div className="head" style={{ padding: '8px 12px' }}>
                <span className="title">Bind a thread</span>
                <div className="spacer" />
                <button type="button" className="tbtn" style={{ fontSize: 10, padding: '1px 7px' }} onClick={() => setPendingThread(null)}>Cancel</button>
              </div>
              <div className="body" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8, fontStyle: 'italic' }}>
                  {localNodes.find(n => n.id === pendingThread.a)?.label || pendingThread.a} {'→'} {localNodes.find(n => n.id === pendingThread.b)?.label || pendingThread.b}
                </div>
                <svg width="100%" height="12" style={{ display: 'block', margin: '-2px 0 8px' }}>
                  <line x1="0" y1="6" x2="100%" y2="6" stroke={tdStyle.stroke} strokeWidth={tdStyle.w + 0.5} strokeDasharray={tdStyle.dash} strokeLinecap="round" opacity="0.9" />
                </svg>
                <div className="grid" style={{ gridTemplateColumns: '110px 1fr', gap: 7 }}>
                  <select value={threadDraft.type} onChange={e => setThreadDraft(d => ({ ...d, type: e.target.value }))} style={iS} autoFocus>
                    {TB_THREAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={threadDraft.label} onChange={e => setThreadDraft(d => ({ ...d, label: e.target.value }))} placeholder="Label (optional)" style={iS} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="submit" className="tbtn brass" style={{ fontSize: 11, padding: '3px 10px' }}>Place thread</button>
                </div>
              </div>
            </form>
          )}
        </div>
        <div style={{ padding: '7px 16px', fontSize: 11, color: 'var(--fg-4)', fontStyle: 'italic', borderTop: '1px solid var(--hairline-2)' }}>
          Scroll to zoom — drag canvas to pan — drag portraits to move — drag tack pin to connect — double-click to edit
        </div>
      </div>

      <div className="col" style={{ gap: 12 }}>
        <div className="card cornered">
          <div className="head"><span className="title">Show / hide</span></div>
          <div className="body" style={{ padding: '6px 14px' }}>
            {TB_THREAD_TYPES.map(type => {
              const s = tbThreadStyle(type);
              return (
                <div key={type} className="between" style={{ padding: '4px 0', cursor: 'pointer' }} onClick={() => setFilter(f => ({ ...f, [type]: !f[type] }))}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="32" height="8"><line x1="0" y1="4" x2="32" y2="4" stroke={s.stroke} strokeWidth="2" strokeDasharray={s.dash} strokeLinecap="round" opacity={filter[type] ? 1 : 0.25} /></svg>
                    <span style={{ fontSize: 12, opacity: filter[type] ? 1 : 0.4, textTransform: 'capitalize' }}>{type}</span>
                  </div>
                  <span className="mono muted" style={{ fontSize: 10 }}>{filter[type] ? 'shown' : 'hidden'}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card cornered">
          <div className="head"><span className="title">Threads</span><div className="spacer" /><span className="smallcaps muted" style={{ fontSize: 10 }}>{edges.length}</span></div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {edges.map(e => {
              const na = nodes.find(n => n.id === e.a), nb = nodes.find(n => n.id === e.b);
              const s = tbThreadStyle(e.type);
              return (
                <div key={e.id} style={{ display: 'flex', gap: 7, alignItems: 'center', padding: '5px 12px', borderBottom: '1px solid var(--hairline-2)', background: hovEdge === e.id ? 'oklch(0.26 0.02 70 / 0.4)' : 'transparent' }} onMouseEnter={() => setHovEdge(e.id)} onMouseLeave={() => setHovEdge(null)}>
                  <svg width="14" height="8" style={{ flexShrink: 0 }}><line x1="0" y1="4" x2="14" y2="4" stroke={s.stroke} strokeWidth="2" strokeDasharray={s.dash} strokeLinecap="round" /></svg>
                  <span style={{ fontSize: 11.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{na?.label || e.a} {'→'} {nb?.label || e.b}</span>
                  <span className="muted" style={{ fontSize: 10, flexShrink: 0, textTransform: 'capitalize' }}>{e.type}</span>
                  <button style={{ background: 'transparent', border: 0, color: 'var(--fg-4)', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1, flexShrink: 0 }} onClick={() => onRemoveEdge(e.id)}>×</button>
                </div>
              );
            })}
            {!edges.length && <div style={{ padding: '10px 14px', color: 'var(--fg-3)', fontSize: 12, fontStyle: 'italic' }}>No threads yet.</div>}
          </div>
        </div>

        <div className="card cornered">
          <div className="head"><span className="title">Portraits</span><div className="spacer" /><span className="smallcaps muted" style={{ fontSize: 10 }}>{nodes.length}</span></div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {nodes.map(n => (
              <div key={n.id} className="clickable" onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)} style={{ padding: '6px 12px', borderBottom: '1px dashed var(--hairline-2)', display: 'flex', gap: 9, alignItems: 'center', background: hovered === n.id ? 'oklch(0.26 0.02 70 / 0.6)' : 'transparent' }}>
                <TBNodeAvatar type={n.type} image={n.image || ''} />
                <div style={{ flex: 1, minWidth: 0 }} onDoubleClick={() => setEditNode({ ...n })} title="Double-click to edit">
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 13 }}>{n.label}</div>
                  <div className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{n.type}</div>
                </div>
                <button style={{ background: 'transparent', border: 0, color: 'var(--fg-4)', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }} onClick={() => onRemoveNode(n.id)}>×</button>
              </div>
            ))}
            {!nodes.length && <div style={{ padding: '10px 14px', color: 'var(--fg-3)', fontSize: 12, fontStyle: 'italic' }}>No portraits pinned yet.</div>}
          </div>
        </div>

        <TBAddPanel nodes={nodes} publicNpcs={publicNpcs} publicParty={publicParty} customChars={customChars} onAdd={onAddNode} />
      </div>

      {editNode && (
        <div className="theory-node-editor-backdrop" onClick={() => setEditNode(null)}>
          <div className="theory-node-editor" onClick={e => e.stopPropagation()}>
            <div className="theory-node-editor-head"><span>{editNode.label}</span><button type="button" onClick={() => setEditNode(null)}>×</button></div>
            <TBNodeEditorBody node={editNode} onSave={p => { onUpdateNode(editNode.id, p); setEditNode(null); }} onRemove={() => { onRemoveNode(editNode.id); setEditNode(null); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function TBNodeEditorBody({ node, onSave, onRemove }) {
  const [d, setD] = React.useState({ label: node.label || '', note: node.note || '', suspicion: node.suspicion || 'medium', image: node.image || '' });
  const iS = { width: '100%', boxSizing: 'border-box', background: 'oklch(0.14 0.01 60)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '7px 10px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px' }}>
      <div><div style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 3 }}>Name / label</div><input value={d.label} onChange={e => setD(p => ({ ...p, label: e.target.value }))} style={iS} autoFocus /></div>
      <div><div style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 3 }}>Portrait URL</div><input value={d.image} onChange={e => setD(p => ({ ...p, image: e.target.value }))} placeholder="https://..." style={iS} /></div>
      <div><div style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 3 }}>Private theory / note</div><textarea value={d.note} onChange={e => setD(p => ({ ...p, note: e.target.value }))} placeholder="What do you suspect about this person?" rows={4} style={{ ...iS, resize: 'vertical' }} /></div>
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
        <button type="button" className="tbtn" style={{ color: 'var(--crimson)' }} onClick={onRemove}>Remove</button>
      </div>
    </div>
  );
}

function TBAddPanel({ nodes, publicNpcs, publicParty, customChars, onAdd }) {
  const [tab, setTab] = React.useState('dm');
  const [cname, setCname] = React.useState('');
  const [crole, setCrele] = React.useState('');
  const [cimg, setCimg] = React.useState('');
  const [cnote, setCnote] = React.useState('');
  const [ctype, setCtype] = React.useState('custom');
  const onBoard = new Set(nodes.map(n => n.sourceId).filter(Boolean));
  const iS = { background: 'oklch(0.16 0.012 60)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '5px 8px', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };
  return (
    <div className="card cornered">
      <div className="head"><span className="title">Add portrait</span></div>
      <div className="theory-subtabs" style={{ borderBottom: '1px solid var(--hairline)' }}>
        <button type="button" className={tab === 'dm' ? 'active' : ''} onClick={() => setTab('dm')}>DM NPCs</button>
        <button type="button" className={tab === 'party' ? 'active' : ''} onClick={() => setTab('party')}>Party</button>
        <button type="button" className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>Mine</button>
        <button type="button" className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>New</button>
      </div>
      {tab === 'dm' && (
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {!publicNpcs.length && <div style={{ padding: '10px 14px', color: 'var(--fg-3)', fontSize: 12, fontStyle: 'italic' }}>No NPCs published by DM yet.</div>}
          {publicNpcs.map(n => {
            const added = onBoard.has(n.id);
            return (
              <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderBottom: '1px solid var(--hairline-2)' }}>
                <div style={{ opacity: added ? 0.45 : 1 }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 13 }}>{n.name}</div>
                  {n.title && <div className="muted" style={{ fontSize: 10 }}>{n.title}</div>}
                </div>
                <button className="tbtn" style={{ fontSize: 10.5, padding: '2px 8px' }} disabled={added} onClick={() => onAdd(n.name, 'npc', n.id, '', n.image || '')}>Pin</button>
              </div>
            );
          })}
        </div>
      )}
      {tab === 'party' && (
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {!(publicParty || []).length && <div style={{ padding: '10px 14px', color: 'var(--fg-3)', fontSize: 12, fontStyle: 'italic' }}>No party members published yet.</div>}
          {(publicParty || []).map(m => {
            const pid = 'party-' + (m.name || '').replace(/\s+/g, '-').toLowerCase();
            const added = onBoard.has(pid);
            return (
              <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderBottom: '1px solid var(--hairline-2)' }}>
                <div style={{ opacity: added ? 0.45 : 1 }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 13 }}>{m.name}</div>
                  {m.role && <div className="muted" style={{ fontSize: 10 }}>{m.role}</div>}
                </div>
                <button className="tbtn" style={{ fontSize: 10.5, padding: '2px 8px' }} disabled={added} onClick={() => onAdd(m.name, 'party', pid, '', m.image || '')}>Pin</button>
              </div>
            );
          })}
        </div>
      )}
      {tab === 'mine' && (
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {!(customChars || []).length && <div style={{ padding: '10px 14px', color: 'var(--fg-3)', fontSize: 12, fontStyle: 'italic' }}>No custom contacts yet — create one under New.</div>}
          {(customChars || []).map(c => {
            const added = onBoard.has(c.id);
            return (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderBottom: '1px solid var(--hairline-2)' }}>
                <div style={{ opacity: added ? 0.45 : 1 }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 13 }}>{c.name}</div>
                  {c.role && <div className="muted" style={{ fontSize: 10 }}>{c.role}</div>}
                </div>
                <button className="tbtn" style={{ fontSize: 10.5, padding: '2px 8px' }} disabled={added} onClick={() => onAdd(c.name, 'custom', c.id, c.note || '', c.image || '')}>Pin</button>
              </div>
            );
          })}
        </div>
      )}
      {tab === 'new' && (
        <form style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }} onSubmit={e => { e.preventDefault(); if (!cname.trim()) return; onAdd(cname, ctype, null, cnote, cimg); setCname(''); setCrele(''); setCimg(''); setCnote(''); }}>
          <input value={cname} onChange={e => setCname(e.target.value)} placeholder="Name *" style={iS} autoFocus />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <input value={crole} onChange={e => setCrele(e.target.value)} placeholder="Role / title" style={iS} />
            <select value={ctype} onChange={e => setCtype(e.target.value)} style={iS}>
              <option value="custom">Unknown person</option>
              <option value="faction">Faction</option>
              <option value="event">Event</option>
              <option value="npc">Named NPC</option>
            </select>
          </div>
          <input value={cimg} onChange={e => setCimg(e.target.value)} placeholder="Portrait URL (optional)" style={iS} />
          <textarea value={cnote} onChange={e => setCnote(e.target.value)} placeholder="Private notes / theory..." rows={3} style={{ ...iS, resize: 'vertical' }} />
          <button type="submit" className="tbtn brass">Add to board</button>
        </form>
      )}
    </div>
  );
}

function PlayerTheories({ theories, publicNpcs, publicParty, customChars, player, onAddNode, onUpdateNode, onRemoveNode, onAddEdge, onRemoveEdge }) {
  const nodes = theories?.nodes || [], edges = theories?.edges || [];
  return (
    <div className="player-tab-page" style={{ padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '20px 24px 12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 24, margin: 0 }}>Theory Board</h2>
          <p style={{ fontSize: 12.5, color: 'var(--fg-4)', margin: '4px 0 0' }}>Private to you — suspects, hunches, connections. The DM never sees this.</p>
        </div>
        <span style={{ fontSize: 11, color: 'var(--fg-4)' }}>{nodes.length} portrait{nodes.length !== 1 ? 's' : ''} / {edges.length} thread{edges.length !== 1 ? 's' : ''}</span>
      </div>
      <TheoryBoard theories={theories} publicNpcs={publicNpcs} publicParty={publicParty} customChars={customChars} player={player} onAddNode={onAddNode} onUpdateNode={onUpdateNode} onRemoveNode={onRemoveNode} onAddEdge={onAddEdge} onRemoveEdge={onRemoveEdge} />
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
