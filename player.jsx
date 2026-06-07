// Player view: subscribes to the DM's public broadcast and gives each player
// a private local desk for journals, goals, questions, mementos, and inspiration.

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
  };
}

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
      {
        id: 'journal-1',
        title: 'Session 1 - First impressions',
        date: '27 Vael',
        body: '',
        createdAt: Date.now(),
      },
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
  };
}

function migrateDesk(saved, player) {
  const base = defaultDesk(player);
  const desk = { ...base, ...saved };
  if ((!desk.journalEntries || desk.journalEntries.length === 0) && desk.journal) {
    desk.journalEntries = [{
      id: 'journal-migrated',
      title: 'Earlier character notes',
      date: '',
      body: desk.journal,
      createdAt: Date.now(),
    }];
  }
  desk.journalEntries = (desk.journalEntries || base.journalEntries).map(entry => ({
    createdAt: Date.now(),
    date: '',
    body: '',
    ...entry,
  }));
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
    } catch {
      return defaultDesk(player);
    }
  });

  React.useEffect(() => {
    setDesk(() => {
      if (!key) return defaultDesk(player);
      try {
        const saved = localStorage.getItem(key);
        return saved ? migrateDesk(JSON.parse(saved), player) : defaultDesk(player);
      } catch {
        return defaultDesk(player);
      }
    });
  }, [key]);

  React.useEffect(() => {
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(desk)); } catch {}
  }, [key, desk]);

  const patch = (field, value) => setDesk(d => ({ ...d, [field]: value }));
  const addGoal = (text) => {
    const clean = text.trim();
    if (!clean) return;
    setDesk(d => ({ ...d, goals: [...d.goals, { id: 'goal-' + Date.now(), text: clean, done: false }] }));
  };
  const toggleGoal = (id) => setDesk(d => ({ ...d, goals: d.goals.map(g => g.id === id ? { ...g, done: !g.done } : g) }));
  const removeGoal = (id) => setDesk(d => ({ ...d, goals: d.goals.filter(g => g.id !== id) }));
  const addJournalEntry = () => {
    const entry = { id: 'journal-' + Date.now(), title: 'New journal entry', date: '', body: '', createdAt: Date.now() };
    setDesk(d => ({ ...d, journalEntries: [entry, ...(d.journalEntries || [])] }));
    return entry.id;
  };
  const updateJournalEntry = (id, patch) => setDesk(d => ({
    ...d,
    journalEntries: (d.journalEntries || []).map(entry => entry.id === id ? { ...entry, ...patch } : entry),
  }));
  const removeJournalEntry = (id) => setDesk(d => {
    const remaining = (d.journalEntries || []).filter(entry => entry.id !== id);
    return { ...d, journalEntries: remaining.length ? remaining : defaultDesk(player).journalEntries };
  });
  const addSpark = (spark) => {
    const title = spark.title.trim();
    const note = spark.note.trim();
    if (!title && !note) return;
    setDesk(d => ({ ...d, sparks: [{ id: 'spark-' + Date.now(), title: title || 'Untitled spark', tag: spark.tag.trim() || 'idea', note }, ...d.sparks] }));
  };
  const removeSpark = (id) => setDesk(d => ({ ...d, sparks: d.sparks.filter(s => s.id !== id) }));

  return { desk, patch, addGoal, toggleGoal, removeGoal, addJournalEntry, updateJournalEntry, removeJournalEntry, addSpark, removeSpark };
}

function PlayerApp() {
  const { state, status, campaignId, playerId } = usePlayerSync();
  const campaign = state?.campaign || {};
  const player = (campaign.playerRoster || []).find(p => p.id === playerId);
  const { desk, patch, addGoal, toggleGoal, removeGoal, addJournalEntry, updateJournalEntry, removeJournalEntry, addSpark, removeSpark } = usePlayerDesk(campaignId, player);
  const [activeTab, setActiveTab] = React.useState('overview');

  React.useEffect(() => {
    if (window.applyWarroomTheme) window.applyWarroomTheme(campaign.theme || 'ashen-table');
  }, [campaign.theme]);

  if (!campaignId) {
    return <EmptyPlayerState title="No campaign linked" text="Ask your DM for the player link." />;
  }

  const publicSecrets = (state?.secrets || []).filter(s => s.status === 'revealed');
  const publicQuests = (state?.quests || []).filter(q => q.public && q.state === 'active');
  const publicNpcs = (state?.npcs || []).filter(n => n.public);
  const publicLocations = (state?.locations || []).filter(l => l.public || l.party);
  const safeHandouts = (state?.handouts || []).filter(h => h.public);
  const character = (state?.party || []).find(p => p.name === player?.character);
  const currentPlace = publicLocations.find(l => l.party) || campaign.location;

  const statusPill = status === 'live'
    ? <span className="pill brass">live</span>
    : status === 'cached'
    ? <span className="pill iron">cached / waiting for DM</span>
    : status === 'error'
    ? <span className="pill iron">offline</span>
    : <span className="pill iron">connecting...</span>;

  return (
    <div className="app player-app" style={{ gridTemplateColumns: '1fr' }}>
      <main className="main">
        <div className="topbar grain">
          <div className="crumb">
            <Icon.PlayerView />
            <span>{campaign.name || 'War Room'}</span>
            <span className="sep">/</span>
            <span style={{ color: 'var(--fg)', fontWeight: 600 }}>Player Desk</span>
          </div>
          <div className="top-spacer"></div>
          {statusPill}
        </div>

        {!state ? (
          <EmptyPlayerState title="Waiting for the DM..." text="The DM must have the War Room open to push data." />
        ) : (
          <div className="page fade-up player-page">
            <PlayerHero campaign={campaign} player={player} character={character} currentPlace={currentPlace} desk={desk} patch={patch} />

            <PlayerTabs active={activeTab} onChange={setActiveTab} counts={{
              journal: desk.journalEntries?.length || 0,
              intel: publicQuests.length + publicNpcs.length + publicLocations.length + publicSecrets.length + safeHandouts.length,
              sparks: desk.sparks?.length || 0,
            }} />

            {activeTab === 'overview' && (
              <PlayerOverview
                state={state}
                player={player}
                currentPlace={currentPlace}
                publicQuests={publicQuests}
                publicSecrets={publicSecrets}
                desk={desk}
                patch={patch}
                addGoal={addGoal}
                toggleGoal={toggleGoal}
                removeGoal={removeGoal}
                onOpenJournal={() => setActiveTab('journal')}
              />
            )}

            {activeTab === 'journal' && (
              <PlayerJournal
                entries={desk.journalEntries || []}
                onAdd={addJournalEntry}
                onUpdate={updateJournalEntry}
                onRemove={removeJournalEntry}
              />
            )}

            {activeTab === 'intel' && (
              <PlayerIntel
                state={state}
                player={player}
                publicQuests={publicQuests}
                publicNpcs={publicNpcs}
                publicLocations={publicLocations}
                publicSecrets={publicSecrets}
                safeHandouts={safeHandouts}
              />
            )}

            {activeTab === 'inspiration' && (
              <PlayerInspirationPage
                desk={desk}
                patch={patch}
                addSpark={addSpark}
                removeSpark={removeSpark}
              />
            )}
          </div>
        )}
      </main>
      <div className="candle-vignette" data-noncommentable=""></div>
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
    { id: 'overview', label: 'Overview', note: 'at table' },
    { id: 'journal', label: 'Journal', note: `${counts.journal} entries` },
    { id: 'intel', label: 'Intel', note: `${counts.intel} records` },
    { id: 'inspiration', label: 'Inspiration', note: `${counts.sparks} pins` },
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

function PlayerOverview({ state, player, currentPlace, publicQuests, publicSecrets, desk, patch, addGoal, toggleGoal, removeGoal, onOpenJournal }) {
  const nextQuest = publicQuests[0];
  const latestJournal = (desk.journalEntries || [])[0];
  return (
    <div className="player-tab-page overview">
      <div className="player-overview-grid">
        <PlayerPanel icon={Icon.PlayerView} title="Tonight's Focus" kicker="quick play">
          <div className="player-focus-card">
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

function PlayerJournal({ entries, onAdd, onUpdate, onRemove }) {
  const [selectedId, setSelectedId] = React.useState(entries[0]?.id || null);
  const selected = entries.find(entry => entry.id === selectedId) || entries[0];

  React.useEffect(() => {
    if (!entries.some(entry => entry.id === selectedId)) setSelectedId(entries[0]?.id || null);
  }, [entries.length, selectedId]);

  const add = () => {
    const id = onAdd();
    setSelectedId(id);
  };

  return (
    <div className="player-tab-page journal-page">
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
              <textarea
                className="player-textarea journal"
                value={selected.body}
                onChange={e => onUpdate(selected.id, { body: e.target.value })}
                placeholder={"Write this as your character, or as the player behind them.\n\nWhat happened today? What did it cost? Who do you trust less now?"}
              />
            </>
          ) : (
            <div className="empty">Create a journal entry to begin.</div>
          )}
        </section>
      </div>
    </div>
  );
}

function PlayerGoals({ goals, onAdd, onToggle, onRemove }) {
  const [text, setText] = React.useState('');
  const submit = (e) => {
    e.preventDefault();
    onAdd(text);
    setText('');
  };
  return (
    <PlayerPanel title="Personal Goals" kicker="your agenda">
      <div className="player-goals">
        {goals.map(g => (
          <label key={g.id} className={`player-goal ${g.done ? 'done' : ''}`}>
            <input type="checkbox" checked={g.done} onChange={() => onToggle(g.id)} />
            <span>{g.text}</span>
            <button type="button" onClick={() => onRemove(g.id)} aria-label="Remove goal">x</button>
          </label>
        ))}
      </div>
      <form className="player-addline" onSubmit={submit}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Add a character goal..." />
        <button type="submit">Add</button>
      </form>
    </PlayerPanel>
  );
}

function PlayerIntel({ state, player, publicQuests, publicNpcs, publicLocations, publicSecrets, safeHandouts }) {
  return (
    <div className="player-tab-page intel-page">
      <div className="player-intel-grid">
        <PlayerPanel icon={Icon.Quests} title="Active Threads" empty="No quests published.">
          {publicQuests.map(q => <IntelRow key={q.id} title={q.title} meta={q.arc || q.state} text={q.note || q.next || q.stakes || ''} />)}
        </PlayerPanel>

        <PlayerPanel icon={Icon.Characters} title="Known Faces" empty="No characters published.">
          {publicNpcs.map(n => <FaceRow key={n.id} npc={n} />)}
        </PlayerPanel>

        <PlayerPanel icon={Icon.Locations} title="Known Places" empty="No locations published.">
          {publicLocations.map(l => <IntelRow key={l.id} title={l.label || l.name} meta={l.party ? 'party here' : (l.kind || '')} text={l.note || ''} />)}
        </PlayerPanel>

        <PlayerPanel icon={Icon.Secrets} title="Revealed Truths" empty="No secrets revealed yet.">
          {publicSecrets.map(s => <IntelRow key={s.id} title={s.title} meta="revealed" text={s.text || s.note || ''} />)}
        </PlayerPanel>

        <PlayerPanel icon={Icon.Handouts} title="Handouts & Visions" empty="No handouts published.">
          <div className="player-handouts">
            {safeHandouts.map(h => <HandoutCard key={h.id} handout={h} />)}
          </div>
        </PlayerPanel>

        <PlayerPanel icon={Icon.Characters} title="The Party" empty="No party published.">
          {(state.party || []).map((p, i) => (
            <IntelRow key={i} title={p.name} meta={p.role} text={p.note || p.patron || ''} active={p.name === player?.character} />
          ))}
        </PlayerPanel>
      </div>
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
  const submit = (e) => {
    e.preventDefault();
    onAdd(draft);
    setDraft({ title: '', tag: '', note: '' });
  };
  return (
    <PlayerPanel title="Inspiration Board" kicker="portraits / songs / vibes">
      <form className="player-spark-form" onSubmit={submit}>
        <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Spark title" />
        <input value={draft.tag} onChange={e => setDraft(d => ({ ...d, tag: e.target.value }))} placeholder="tag" />
        <textarea value={draft.note} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} placeholder="Quote, image idea, playlist note, costume detail..." />
        <button type="submit">Pin spark</button>
      </form>
      <div className="player-sparks">
        {sparks.map(s => (
          <article key={s.id} className="player-spark">
            <button type="button" onClick={() => onRemove(s.id)} aria-label="Remove spark">x</button>
            <span>{s.tag}</span>
            <h3>{s.title}</h3>
            <p>{s.note}</p>
          </article>
        ))}
      </div>
    </PlayerPanel>
  );
}

function PrivateNotes({ desk, patch, compact = false }) {
  return (
    <PlayerPanel title="Questions & Mementos" kicker={compact ? 'quick notes' : 'bring to table'}>
      <label className="player-label">Questions for the DM</label>
      <textarea className="player-textarea compact" value={desk.questions} onChange={e => patch('questions', e.target.value)} placeholder="What do you want to ask between sessions?" />
      <label className="player-label">Mementos / inventory notes</label>
      <textarea className="player-textarea compact" value={desk.mementos} onChange={e => patch('mementos', e.target.value)} placeholder="Keepsakes, promises, injuries, debts, strange items..." />
    </PlayerPanel>
  );
}

function PlayerPanel({ icon: I, title, kicker, empty, children }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <div className="card cornered player-panel">
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

function FaceRow({ npc }) {
  return (
    <div className="player-face">
      <div className="player-avatar">
        {npc.image ? <img src={npc.image} alt="" /> : (npc.name || '?')[0]}
      </div>
      <div>
        <strong>{npc.name}</strong>
        <p>{npc.title || npc.location || 'Known contact'}</p>
      </div>
    </div>
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PlayerApp />);
