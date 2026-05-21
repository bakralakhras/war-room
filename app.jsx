// App shell — routing, tweaks integration, candle vignette, factions index page.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "brass",
  "density": "regular",
  "candle": 80,
  "grain": 50
}/*EDITMODE-END*/;

const ACCENT_PRESETS = {
  brass:   { brass: '0.72 0.105 82',  brass2: '0.58 0.095 78',  brassDim: '0.46 0.07 80' },
  oxblood: { brass: '0.62 0.155 26',  brass2: '0.48 0.140 26',  brassDim: '0.36 0.12 26' },
  ember:   { brass: '0.70 0.150 50',  brass2: '0.55 0.135 50',  brassDim: '0.42 0.12 50' },
  forest:  { brass: '0.62 0.090 150', brass2: '0.48 0.080 150', brassDim: '0.36 0.07 150' },
  moon:    { brass: '0.70 0.080 235', brass2: '0.55 0.075 235', brassDim: '0.42 0.07 235' },
};

function useStore() {
  const [state, setState] = React.useState(() => window.Store.get());
  React.useEffect(() => window.Store.subscribe(setState), []);
  return state;
}

function dispatch(action) {
  window.Store.dispatch(action);
}

function App() {
  const state = useStore();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState({ screen: 'warroom', params: {} });
  const campaignTheme = state.campaign?.theme || 'ashen-table';

  // Apply tweaks → CSS vars / body class
  React.useEffect(() => {
    if (window.applyWarroomTheme) window.applyWarroomTheme(campaignTheme);
  }, [campaignTheme]);

  React.useEffect(() => {
    const a = ACCENT_PRESETS[t.accent] || ACCENT_PRESETS.brass;
    document.documentElement.style.setProperty('--brass',     `oklch(${a.brass})`);
    document.documentElement.style.setProperty('--brass-2',   `oklch(${a.brass2})`);
    document.documentElement.style.setProperty('--brass-dim', `oklch(${a.brassDim})`);
  }, [campaignTheme, t.accent]);

  React.useEffect(() => {
    document.body.classList.toggle('dense', t.density === 'dense');
    document.body.classList.toggle('airy',  t.density === 'airy');
  }, [campaignTheme, t.density]);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--candle', (t.candle / 100).toString());
    document.documentElement.style.setProperty('--grain',  (t.grain / 100).toString());
  }, [campaignTheme, t.candle, t.grain]);

  const nav = (screen, params = {}) => setRoute({ screen, params });
  const openNPC      = (id) => nav('npc',         { id });
  const openFaction  = (id) => nav('faction',     { id });
  const openSecret   = (id) => nav('secrets',     { highlight: id });

  // Expose nav globally so <WikiLink> can call it without prop drilling.
  React.useEffect(() => { window.__navigate = nav; return () => { delete window.__navigate; }; }, []);

  // Sidebar id ↔ screen mapping
  const sidebarActive = (() => {
    const s = route.screen;
    if (s === 'npc') return 'characters';
    if (s === 'faction') return 'factions';
    return s;
  })();

  return (
    <div className="app">
      <Sidebar active={sidebarActive} onNav={(id) => nav(id)} state={state} />
      <main className="main">
        <Topbar route={route} onNav={nav} state={state} />
        <ScreenRouter route={route} nav={nav} state={state} onOpenNPC={openNPC} onOpenFaction={openFaction} onOpenSecret={openSecret} />
      </main>

      <div className="candle-vignette" data-noncommentable=""></div>
      <ToastContainer />

      <TweaksPanel title="War Room · Tweaks">
        <TweakSection label="Aesthetic">
          <TweakSelect
            label="Accent"
            value={t.accent}
            options={[
              { value: 'brass',   label: 'Tarnished brass' },
              { value: 'oxblood', label: 'Deep oxblood' },
              { value: 'ember',   label: 'Muted ember' },
              { value: 'forest',  label: 'Forest green' },
              { value: 'moon',    label: 'Moonlight blue' },
            ]}
            onChange={(v) => setTweak('accent', v)}
          />
        </TweakSection>
        <TweakSection label="Atmosphere">
          <TweakSlider label="Candle level" value={t.candle} min={20} max={100} unit="%" onChange={(v) => setTweak('candle', v)} />
          <TweakSlider label="Grain" value={t.grain} min={0} max={100} unit="%" onChange={(v) => setTweak('grain', v)} />
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio label="Density"
            value={t.density}
            options={['dense', 'regular', 'airy']}
            onChange={(v) => setTweak('density', v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// ── Topbar (breadcrumb + search + quick) ──────────────────────────────
function Topbar({ route, onNav, state }) {
  const crumb = (() => {
    switch (route.screen) {
      case 'warroom':       return ['Play', 'War Room'];
      case 'npc': {
        const n = state.npcs.find(x => x.id === route.params.id);
        return ['World', 'Characters', n ? n.name : 'NPC'];
      }
      case 'characters':    return ['World', 'Characters'];
      case 'faction': {
        const f = state.factions.find(x => x.id === route.params.id);
        return ['World', 'Factions', f ? f.name : 'Faction'];
      }
      case 'factions':      return ['World', 'Factions'];
      case 'maps':          return ['World', 'Maps'];
      case 'relationships': return ['DM Tools', 'Relationships'];
      case 'secrets':       return ['DM Tools', 'Secrets'];
      case 'inspiration':   return ['DM Tools', 'Inspiration'];
      case 'timeline':      return ['World', 'Timeline'];
      case 'codex':         return ['World', 'Codex'];
      case 'prep':          return ['Play', 'Prep'];
      case 'sessions':      return ['Play', 'Sessions'];
      default:              return ['Vaelthorne'];
    }
  })();

  return (
    <div className="topbar grain">
      <div className="crumb">
        <Icon.WarRoom />
        <span>Vaelthorne</span>
        {crumb.map((c, i) => (
          <React.Fragment key={i}>
            <span className="sep">·</span>
            <span style={{ color: i === crumb.length - 1 ? 'var(--fg)' : 'var(--fg-2)', fontWeight: i === crumb.length - 1 ? 600 : 400 }}>
              {c}
            </span>
          </React.Fragment>
        ))}
      </div>
      <div className="top-spacer"></div>
      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'oklch(0 0 0 / 0.35)',
          border: '1px solid var(--hairline-2)',
          borderRadius: 'var(--r)',
          padding: '5px 12px',
          gap: 8,
          width: 280,
          color: 'var(--fg-3)',
          fontSize: 12.5,
        }}>
          <Icon.Search />
          <span style={{ flex: 1 }}>Search the codex…</span>
          <span className="kbd">⌘ K</span>
        </div>
      </div>
      <button className="tbtn"><Icon.Dice /> Roll</button>
      <button className="tbtn brass" onClick={() => onNav('sessions')}><Icon.Play /> Begin session</button>
    </div>
  );
}

// ── Router ───────────────────────────────────────────────────────────
function ScreenRouter({ route, nav, state, onOpenNPC, onOpenFaction, onOpenSecret }) {
  switch (route.screen) {
    case 'warroom':
      return <WarRoom state={state} onNav={nav} onOpenNPC={onOpenNPC} onOpenFaction={onOpenFaction} onOpenSecret={onOpenSecret} />;
    case 'npc':
      return <NPCProfile state={state} npcId={route.params.id} onNav={nav} onOpenFaction={onOpenFaction} onOpenSecret={onOpenSecret} />;
    case 'characters':
      return <CharactersIndex state={state} onOpenNPC={onOpenNPC} />;
    case 'factions':
    case 'faction':
      return <FactionsIndex state={state} factionId={route.params.id} onNav={nav} onOpenNPC={onOpenNPC} />;
    case 'maps':
    case 'locations':
      return <MapView state={state} onNav={nav} onOpenNPC={onOpenNPC} />;
    case 'relationships':
      return <Relationships state={state} onOpenNPC={onOpenNPC} />;
    case 'secrets':
      return <Secrets state={state} onOpenNPC={onOpenNPC} onOpenFaction={onOpenFaction} />;
    case 'rumors':
      return <Rumors state={state} />;
    case 'timeline':
      return <Timeline state={state} onNav={nav} />;
    case 'codex':
      return <WorldCodex state={state} onNav={nav} onOpenNPC={onOpenNPC} onOpenFaction={onOpenFaction} highlight={route.params.highlight} />;
    case 'prep':
      return <PrepPlanner state={state} />;
    case 'sessions':
      return <Sessions state={state} onNav={nav} />;
    case 'encounters':
      return <Encounters state={state} />;
    case 'calendar':
      return <Calendar state={state} />;
    case 'quests':
      return <Quests state={state} />;
    case 'items':
      return <Items state={state} />;
    case 'handouts':
      return <Handouts state={state} />;
    case 'tables':
      return <RandomTables state={state} />;
    case 'inspiration':
      return <Inspiration state={state} />;
    case 'player':
      return <PlayerView state={state} />;
    case 'exports':
      return <Exports state={state} />;
    case 'settings':
      return <Settings state={state} />;
    default:
      return <Stub label={route.screen} onNav={nav} />;
  }
}

// ── Encounters ───────────────────────────────────────────────────────
function Encounters({ state }) {
  const encounters = state.encounters || [];
  const sessions   = state.sessions  || [];
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', location: '', threat: 'medium', session: '', notes: '' });
  const iStyle = { width: '100%', boxSizing: 'border-box', background: 'oklch(0.16 0.012 60 / 0.55)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' };

  const addEncounter = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    window.Store.dispatch({ type: 'ENCOUNTER_ADD', title: form.title.trim(), location: form.location.trim(), threat: form.threat, session: form.session, notes: form.notes.trim() });
    setForm({ title: '', location: '', threat: 'medium', session: '', notes: '' });
    setAdding(false);
  };

  const setField = (id, field, value) => window.Store.dispatch({ type: 'ENCOUNTER_SET_FIELD', id, field, value });

  const threatBg = { deadly: { background: 'oklch(0.35 0.12 25 / 0.5)', borderColor: 'oklch(0.55 0.15 25)' } };
  const threatPill = { low: 'iron', medium: 'moon', high: 'brass', deadly: 'iron' };

  const sessionLabel = (sessId) => {
    const s = sessions.find(s => s.id === sessId);
    return s ? `Session ${s.number}` : null;
  };

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Planned scenes</div>
          <h1 className="page-title">Encounters</h1>
          <div className="page-sub">{encounters.length} scenes staged</div>
        </div>
        <button className="tbtn brass" onClick={() => setAdding(v => !v)}><Icon.Plus /> New encounter</button>
      </div>

      {adding && (
        <form className="card cornered" onSubmit={addEncounter} style={{ marginBottom: 14 }}>
          <div className="head"><Icon.Encounters /><span className="title">Stage an encounter</span><div className="spacer"></div><button className="tbtn brass" type="submit"><Icon.Plus /> Add</button><button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button></div>
          <div className="body">
            <div className="grid" style={{ gridTemplateColumns: '1fr 140px 110px', gap: 10, marginBottom: 10 }}>
              <Field label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} autoFocus />
              <Field label="Location" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} />
              <Field label="Threat" value={form.threat} onChange={v => setForm(f => ({ ...f, threat: v }))} options={[{value:'low',label:'Low'},{value:'medium',label:'Medium'},{value:'high',label:'High'},{value:'deadly',label:'Deadly'}]} />
            </div>
            <div className="grid" style={{ gridTemplateColumns: '220px 1fr', gap: 10 }}>
              <Field label="Linked session" value={form.session} onChange={v => setForm(f => ({ ...f, session: v }))}
                options={[{value:'',label:'— none —'}, ...sessions.map(s => ({ value: s.id, label: `Session ${s.number} — ${s.title}` }))]} />
              <Field label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
            </div>
          </div>
        </form>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {encounters.map(enc => {
          const linked = sessionLabel(enc.session);
          return (
            <div key={enc.id} className="card cornered" style={enc.threat === 'deadly' ? threatBg.deadly : {}}>
              <div className="head">
                <Icon.Encounters />
                <span className="title">{enc.title}</span>
                <div className="spacer"></div>
                {linked && <span className="pill iron" style={{ fontSize: 10 }}>{linked}</span>}
                <span className={`pill ${threatPill[enc.threat] || 'iron'}`}>{enc.threat || 'medium'}</span>
              </div>
              <div className="body" style={{ padding: '10px 14px' }}>
                {/* Location + threat inline */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input value={enc.location || ''} onChange={e => setField(enc.id, 'location', e.target.value)}
                    style={{ ...iStyle, flex: 1, fontSize: 12 }} placeholder="Location…" />
                  <select value={enc.threat || 'medium'} onChange={e => setField(enc.id, 'threat', e.target.value)}
                    style={{ ...iStyle, width: 110, fontSize: 12 }}>
                    {['low','medium','high','deadly'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={enc.session || ''} onChange={e => setField(enc.id, 'session', e.target.value)}
                    style={{ ...iStyle, width: 130, fontSize: 12 }}>
                    <option value="">No session</option>
                    {sessions.map(s => <option key={s.id} value={s.id}>Session {s.number}</option>)}
                  </select>
                </div>

                {/* Enemy roster — compact */}
                {(enc.enemies || []).length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    {(enc.enemies || []).map(en => (
                      <div key={en.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5, padding: '5px 8px', background: 'oklch(0.18 0.012 60 / 0.5)', borderRadius: 'var(--r)', border: '1px solid var(--hairline-2)' }}>
                        <span style={{ fontSize: 12, color: 'oklch(0.75 0.1 25)', fontWeight: 700, flexShrink: 0, minWidth: 22 }}>{en.count}×</span>
                        <span style={{ fontFamily: 'var(--f-display)', fontSize: 13.5, flex: 1 }}>{en.name}</span>
                        {en.hp > 0 && <span className="pill iron" style={{ fontSize: 10 }}>HP {en.hp}</span>}
                        {en.note && <span className="muted" style={{ fontSize: 11, fontStyle: 'italic', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{en.note}</span>}
                        <button style={{ background: 'transparent', border: 0, color: 'var(--fg-4)', cursor: 'pointer', fontSize: 13, padding: '0 2px', lineHeight: 1 }}
                          onClick={() => window.Store.dispatch({ type: 'ENCOUNTER_ENEMY_REMOVE', encId: enc.id, enemyId: en.id })}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                <EncounterAddEnemy encId={enc.id} iStyle={iStyle} npcs={state.npcs || []} />

                {/* DM notes */}
                {(enc.notes || enc.notes === '') && (
                  <textarea value={enc.notes || ''} onChange={e => setField(enc.id, 'notes', e.target.value)} rows={2}
                    style={{ ...iStyle, resize: 'vertical', lineHeight: 1.5, marginTop: 10, fontSize: 12 }}
                    placeholder="Tactics, conditions, retreats, rewards…" />
                )}

                {/* Status + remove */}
                <div className="row wrap gap-sm" style={{ marginTop: 10 }}>
                  {['planned','running','resolved'].map(s => (
                    <button key={s} className={(enc.status || 'planned') === s ? 'tbtn brass' : 'tbtn'} style={{ fontSize: 11 }} onClick={() => setField(enc.id, 'status', s)}>{s}</button>
                  ))}
                  <button className="tbtn" style={{ fontSize: 11 }} onClick={() => window.Store.dispatch({ type: 'ENCOUNTER_REMOVE', id: enc.id })}>Remove</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!encounters.length && <div className="empty"><div className="display">No encounters staged.</div>Plan the next fight, social scene, chase, or trap.</div>}
    </div>
  );
}

function EncounterAddEnemy({ encId, iStyle, npcs }) {
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState({ name: '', count: 1, hp: 10, note: '' });

  const pickNpc = (id) => {
    const npc = (npcs || []).find(n => n.id === id);
    if (npc) setF(x => ({ ...x, name: npc.name }));
  };

  const submit = () => {
    if (!f.name.trim()) return;
    window.Store.dispatch({ type: 'ENCOUNTER_ENEMY_ADD', id: encId, ...f });
    setF({ name: '', count: 1, hp: 10, note: '' });
    setOpen(false);
  };

  if (!open) return (
    <button className="tbtn" style={{ fontSize: 11 }} onClick={() => setOpen(true)}><Icon.Plus /> Add enemy</button>
  );
  return (
    <div style={{ marginTop: 6, padding: 10, background: 'oklch(0.16 0.012 60 / 0.55)', borderRadius: 'var(--r)', border: '1px solid var(--hairline-2)' }}>
      {/* Pick from existing characters */}
      {(npcs || []).length > 0 && (
        <select defaultValue="" onChange={e => pickNpc(e.target.value)}
          style={{ ...iStyle, fontSize: 12, marginBottom: 6 }}>
          <option value="" disabled>Pick from your characters…</option>
          {(npcs || []).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
      )}
      <div className="grid" style={{ gridTemplateColumns: '1fr 46px 54px', gap: 6, marginBottom: 6 }}>
        <input value={f.name} onChange={e => setF(x => ({ ...x, name: e.target.value }))} placeholder="Name" style={{ ...iStyle, fontSize: 12 }} />
        <input type="number" value={f.count} onChange={e => setF(x => ({ ...x, count: Number(e.target.value) }))} min={1} style={{ ...iStyle, fontSize: 12, textAlign: 'center' }} title="×count" />
        <input type="number" value={f.hp} onChange={e => setF(x => ({ ...x, hp: Number(e.target.value) }))} min={0} style={{ ...iStyle, fontSize: 12, textAlign: 'center' }} title="HP" />
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr auto auto', gap: 6 }}>
        <input value={f.note} onChange={e => setF(x => ({ ...x, note: e.target.value }))} placeholder="Note (optional)" style={{ ...iStyle, fontSize: 12 }} onKeyDown={e => e.key === 'Enter' && submit()} />
        <button className="tbtn brass" style={{ fontSize: 11 }} onClick={submit}><Icon.Plus /> Add</button>
        <button className="tbtn" style={{ fontSize: 11 }} onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

function Rumors({ state }) {
  const rumors = state.rumors || [];
  const [filter, setFilter] = React.useState('open');
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ text: '', source: '', weight: 'common' });
  const weights = ['common', 'tactical', 'ominous', 'lore', 'secret'];
  const visible = rumors.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'delivered') return r.delivered;
    if (filter === 'open') return !r.delivered;
    return r.weight === filter && !r.delivered;
  });
  const countFor = f => f === 'open' ? rumors.filter(r => !r.delivered).length
    : f === 'delivered' ? rumors.filter(r => r.delivered).length
    : f === 'all' ? rumors.length
    : rumors.filter(r => r.weight === f && !r.delivered).length;

  const addRumor = (e) => {
    e.preventDefault();
    if (!form.text.trim()) return;
    window.Store.dispatch({ type: 'RUMOR_ADD', text: form.text.trim(), source: form.source.trim(), weight: form.weight });
    setForm({ text: '', source: '', weight: 'common' });
    setAdding(false);
  };
  const setField = (id, field, value) => window.Store.dispatch({ type: 'RUMOR_SET_FIELD', id, field, value });

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Loose talk, useful lies</div>
          <h1 className="page-title">Rumors</h1>
          <div className="page-sub">Track what is circulating, what reached the party, and what still waits in the wind.</div>
        </div>
        <button className="tbtn brass" onClick={() => setAdding(v => !v)}><Icon.Plus /> New rumor</button>
      </div>

      <div className="row wrap" style={{ marginBottom: 14 }}>
        {['open', ...weights, 'delivered', 'all'].map(f => (
          <button key={f} className={filter === f ? 'tbtn brass' : 'tbtn'} onClick={() => setFilter(f)}>
            {f} <span className="badge">{countFor(f)}</span>
          </button>
        ))}
      </div>

      {adding && (
        <form className="card cornered" onSubmit={addRumor} style={{ marginBottom: 14 }}>
          <div className="head"><Icon.Plus /><span className="title">Add a rumor</span></div>
          <div className="body">
            <div className="grid" style={{ gridTemplateColumns: '1fr 180px', gap: 12 }}>
              <Field label="Rumor" value={form.text} onChange={v => setForm(f => ({ ...f, text: v }))} autoFocus placeholder="A bell tolled at the wrong hour..." />
              <Field label="Weight" value={form.weight} onChange={v => setForm(f => ({ ...f, weight: v }))} options={weights.map(w => ({ value: w, label: w }))} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="Source" value={form.source} onChange={v => setForm(f => ({ ...f, source: v }))} placeholder="innkeep, courier, market child" />
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="tbtn brass" type="submit">Add rumor</button>
              <button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="rumor-board">
        {visible.map((r, i) => (
          <div key={r.id} className={`rumor-record ${r.delivered ? 'delivered' : ''}`}>
            <div className="rumor" style={{ '--tilt': i % 2 === 0 ? '-0.45deg' : '0.35deg' }}>
              <div className="between" style={{ alignItems: 'center', marginBottom: 8 }}>
                <select value={r.weight || 'common'} onChange={e => setField(r.id, 'weight', e.target.value)} className="rumor-select">
                  {weights.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <span className={r.delivered ? 'pill forest' : 'pill brass'}>{r.delivered ? 'delivered' : 'unverified'}</span>
              </div>
              <textarea value={r.text || ''} onChange={e => setField(r.id, 'text', e.target.value)} className="rumor-edit" />
              <input value={r.source || ''} onChange={e => setField(r.id, 'source', e.target.value)} className="rumor-source-edit" placeholder="source" />
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <button className={r.delivered ? 'tbtn' : 'tbtn brass'} onClick={() => window.Store.dispatch({ type: 'RUMOR_TOGGLE_DELIVERED', id: r.id })}>
                {r.delivered ? 'Mark unverified' : 'Mark delivered'}
              </button>
              <button className="tbtn" onClick={() => { if (window.confirm('Remove this rumor?')) window.Store.dispatch({ type: 'RUMOR_REMOVE', id: r.id }); }}>Remove</button>
            </div>
          </div>
        ))}
        {!visible.length && <div className="empty"><div className="display">No rumors here.</div>Try another filter or add a new whisper.</div>}
      </div>
    </div>
  );
}


function Calendar({ state }) {
  const events = (state.calendar || []).slice().sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  const [adding, setAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [form, setForm] = React.useState({ date: '', title: '', kind: 'world', notes: '' });
  const currentDate = state.campaign?.nextSession ? state.campaign.nextSession.split('·')[0].trim() : '';
  const iStyle = { width: '100%', boxSizing: 'border-box', background: 'oklch(0.16 0.012 60 / 0.55)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' };

  const kindColor = { session: 'brass', deadline: 'iron', omen: 'moon', world: 'iron' };
  const kindAccent = {
    session:  { left: 'var(--brass)',                    dot: 'var(--brass)' },
    deadline: { left: 'oklch(0.55 0.15 25)',              dot: 'oklch(0.65 0.15 25)' },
    omen:     { left: 'oklch(0.55 0.08 280)',             dot: 'oklch(0.65 0.08 280)' },
    world:    { left: 'var(--hairline-2)',                dot: 'var(--fg-3)' },
  };

  const addEvent = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    window.Store.dispatch({ type: 'CALENDAR_ADD', date: form.date.trim(), title: form.title.trim(), kind: form.kind, notes: form.notes.trim() });
    setForm({ date: '', title: '', kind: 'world', notes: '' });
    setAdding(false);
  };

  const set = (id, field, value) => window.Store.dispatch({ type: 'CALENDAR_SET_FIELD', id, field, value });
  const visible = filter === 'all' ? events : events.filter(e => e.kind === filter);

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Campaign almanac</div>
          <h1 className="page-title">Calendar</h1>
          <div className="page-sub">{events.length} dates · omens, deadlines, and session marks</div>
        </div>
        <button className="tbtn brass" onClick={() => setAdding(v => !v)}><Icon.Plus /> New date</button>
      </div>

      {/* Current date banner */}
      {currentDate && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: 'oklch(0.24 0.025 65 / 0.6)', border: '1px solid var(--brass-dim)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon.Calendar />
          <span className="smallcaps" style={{ fontSize: 10 }}>Next session</span>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 16, color: 'var(--brass)' }}>{currentDate}</span>
        </div>
      )}

      {adding && (
        <form className="card cornered" onSubmit={addEvent} style={{ marginBottom: 16 }}>
          <div className="head"><Icon.Calendar /><span className="title">Add a date</span><div className="spacer"></div><button className="tbtn brass" type="submit"><Icon.Plus /> Add</button><button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button></div>
          <div className="body">
            <div className="grid" style={{ gridTemplateColumns: '140px 1fr 120px', gap: 10, marginBottom: 10 }}>
              <Field label="In-world date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} placeholder="14 Vael" autoFocus />
              <Field label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
              <Field label="Kind" value={form.kind} onChange={v => setForm(f => ({ ...f, kind: v }))} options={[{value:'session',label:'session'},{value:'deadline',label:'deadline'},{value:'omen',label:'omen'},{value:'world',label:'world'}]} />
            </div>
            <Field label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} multiline />
          </div>
        </form>
      )}

      {/* Kind filters */}
      <div className="row gap-sm" style={{ marginBottom: 16 }}>
        {['all','session','deadline','omen','world'].map(k => (
          <button key={k} className={filter === k ? 'tbtn brass' : 'tbtn'} onClick={() => setFilter(k)}>{k}</button>
        ))}
      </div>

      {/* Almanac timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {visible.map((ev, i) => {
          const accent = kindAccent[ev.kind] || kindAccent.world;
          const isEditing = editingId === ev.id;
          return (
            <div key={ev.id} style={{ display: 'flex', gap: 0 }}>
              {/* Timeline spine */}
              <div style={{ width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent.dot, border: '2px solid var(--bg)', marginTop: 18, flexShrink: 0, zIndex: 1 }} />
                {i < visible.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--hairline-2)', minHeight: 16 }} />}
              </div>
              {/* Event card */}
              <div style={{ flex: 1, marginBottom: i < visible.length - 1 ? 0 : 0, paddingBottom: 16 }}>
                <div className="card cornered" style={{ borderLeft: `3px solid ${accent.left}` }}>
                  {isEditing ? (
                    <div className="body">
                      <div className="grid" style={{ gridTemplateColumns: '140px 1fr 120px', gap: 8, marginBottom: 8 }}>
                        <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 4 }}>Date</div><input value={ev.date || ''} onChange={e => set(ev.id, 'date', e.target.value)} style={iStyle} /></label>
                        <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 4 }}>Title</div><input value={ev.title || ''} onChange={e => set(ev.id, 'title', e.target.value)} style={iStyle} /></label>
                        <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 4 }}>Kind</div>
                          <select value={ev.kind || 'world'} onChange={e => set(ev.id, 'kind', e.target.value)} style={iStyle}>
                            {['session','deadline','omen','world'].map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                        </label>
                      </div>
                      <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 4 }}>Notes</div><textarea value={ev.notes || ''} onChange={e => set(ev.id, 'notes', e.target.value)} rows={2} style={{ ...iStyle, resize: 'vertical' }} /></label>
                      <div className="row gap-sm" style={{ marginTop: 10 }}>
                        <button className="tbtn brass" onClick={() => setEditingId(null)}>Done</button>
                        <button className="tbtn" onClick={() => { window.Store.dispatch({ type: 'CALENDAR_REMOVE', id: ev.id }); setEditingId(null); }}>Remove</button>
                      </div>
                    </div>
                  ) : (
                    <div className="body" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'default' }}>
                      <div style={{ minWidth: 90, flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, color: accent.dot, lineHeight: 1.2 }}>{ev.date || '—'}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: ev.notes ? 5 : 0 }}>
                          <span style={{ fontFamily: 'var(--f-display)', fontSize: 16 }}>{ev.title}</span>
                          <span className={`pill ${kindColor[ev.kind] || 'iron'}`} style={{ fontSize: 10 }}>{ev.kind || 'world'}</span>
                        </div>
                        {ev.notes && <div style={{ fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.5 }}>{ev.notes}</div>}
                      </div>
                      <button className="tbtn" style={{ fontSize: 11, padding: '3px 8px', flexShrink: 0 }} onClick={() => setEditingId(ev.id)}>Edit</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!visible.length && <div className="empty"><div className="display">No dates recorded.</div>Add feast days, travel clocks, deadlines, and session history.</div>}
    </div>
  );
}

function PrepPlanner({ state }) {
  const prep = state.prep || [];
  const openPrep = prep.filter(p => !p.done);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ kind: 'beat', title: '', note: '' });
  const inputStyle = { width: '100%', boxSizing: 'border-box', background: 'oklch(0.16 0.012 60 / 0.55)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '8px 10px', fontSize: 13 };
  const addPrep = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    window.Store.dispatch({ type: 'PREP_ADD', kind: form.kind, title: form.title.trim(), note: form.note.trim() });
    setForm({ kind: 'beat', title: '', note: '' });
    setAdding(false);
  };
  const groups = [
    { id: 'scene', label: 'Scenes', items: prep.filter(p => p.kind === 'scene' && !p.done) },
    { id: 'beat', label: 'Beats', items: prep.filter(p => p.kind === 'beat' && !p.done) },
    { id: 'clue', label: 'Clues', items: prep.filter(p => p.kind === 'clue' && !p.done) },
    { id: 'followup', label: 'Follow-ups', items: prep.filter(p => p.kind === 'followup' && !p.done) },
  ];
  const done = prep.filter(p => p.done);
  const kindColor = { scene: 'brass', beat: 'moon', clue: 'iron', followup: 'iron' };
  const renderItem = (item) => (
    <div key={item.id} className="card cornered" style={{ marginBottom: 8, opacity: item.done ? 0.5 : 1, borderLeft: `3px solid ${item.done ? 'var(--hairline-2)' : 'var(--brass-dim)'}` }}>
      <div className="body" style={{ padding: '10px 12px' }}>
        {/* Title row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <button onClick={() => window.Store.dispatch({ type: 'PREP_TOGGLE_DONE', id: item.id })}
            style={{ width: 18, height: 18, borderRadius: 3, border: `1.5px solid ${item.done ? 'var(--brass)' : 'var(--hairline-2)'}`, background: item.done ? 'var(--brass)' : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'grid', placeItems: 'center', color: item.done ? 'var(--bg)' : 'transparent', fontSize: 11 }}>✓</button>
          <input value={item.title || ''} onChange={e => window.Store.dispatch({ type: 'PREP_SET_FIELD', id: item.id, field: 'title', value: e.target.value })}
            placeholder="Prep item title…"
            style={{ flex: 1, background: 'transparent', border: 0, color: item.done ? 'var(--fg-3)' : 'var(--fg)', fontSize: 14, outline: 'none', fontFamily: 'var(--f-display)', textDecoration: item.done ? 'line-through' : 'none' }} />
          <select value={item.kind || 'beat'} onChange={e => window.Store.dispatch({ type: 'PREP_SET_FIELD', id: item.id, field: 'kind', value: e.target.value })}
            style={{ background: 'transparent', border: 0, color: 'var(--fg-3)', fontSize: 10.5, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="scene">scene</option><option value="beat">beat</option><option value="clue">clue</option><option value="followup">followup</option>
          </select>
          <button style={{ background: 'transparent', border: 0, color: 'var(--fg-3)', cursor: 'pointer', fontSize: 13, padding: '0 2px' }} onClick={() => window.Store.dispatch({ type: 'PREP_REMOVE', id: item.id })}>×</button>
        </div>
        {/* Note */}
        {(!item.done || item.note) && (
          <textarea value={item.note || ''} onChange={e => window.Store.dispatch({ type: 'PREP_SET_FIELD', id: item.id, field: 'note', value: e.target.value })}
            rows={2} placeholder="Notes, conditions, what to watch for…"
            style={{ width: '100%', boxSizing: 'border-box', background: 'oklch(0.16 0.012 60 / 0.4)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg-2)', padding: '6px 9px', fontSize: 12, outline: 'none', resize: 'none', lineHeight: 1.5, fontFamily: 'inherit' }} />
        )}
      </div>
    </div>
  );

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Before the table</div>
          <h1 className="page-title">Session Prep</h1>
          <div className="page-sub">{openPrep.length} open · {done.length} done · organized for planning, not play automation</div>
        </div>
        <div className="row">
          <button className="tbtn" onClick={() => window.Store.dispatch({ type: 'PREP_CARRY_FORWARD' })}>Carry unfinished</button>
          <button className="tbtn brass" onClick={() => setAdding(v => !v)}><Icon.Plus /> New prep</button>
        </div>
      </div>

      {adding && (
        <form className="card cornered" onSubmit={addPrep} style={{ marginBottom: 14 }}>
          <div className="head"><Icon.Quill /><span className="title">Add prep</span><div className="spacer"></div><button className="tbtn brass" type="submit"><Icon.Plus /> Add</button><button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button></div>
          <div className="body">
            <div className="grid" style={{ gridTemplateColumns: '160px 1fr', gap: 10 }}>
              <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Kind</div><select value={form.kind} onChange={(e) => setForm(f => ({ ...f, kind: e.target.value }))} style={inputStyle}><option value="scene">scene</option><option value="beat">beat</option><option value="clue">clue</option><option value="followup">followup</option></select></label>
              <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Title</div><input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} autoFocus /></label>
            </div>
            <label style={{ display: 'block', marginTop: 10 }}><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Note</div><textarea value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} rows={4} style={{ ...inputStyle, resize: 'vertical' }} /></label>
          </div>
        </form>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(220px, 1fr))', gap: 12 }}>
        {groups.map(group => (
          <div key={group.id}>
            <div className="smallcaps" style={{ margin: '0 0 8px 4px' }}>{group.label} · {group.items.length}</div>
            {group.items.map(renderItem)}
            {!group.items.length && <div className="card cornered"><div className="body muted">Nothing queued.</div></div>}
          </div>
        ))}
      </div>

      {!!done.length && (
        <>
          <div className="hr"></div>
          <div className="smallcaps" style={{ marginBottom: 8 }}>Done · {done.length}</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 }}>
            {done.map(renderItem)}
          </div>
        </>
      )}
    </div>
  );
}

function Sessions({ state, onNav }) {
  const sessions = state.sessions || [];
  const [selectedId, setSelectedId] = React.useState(sessions[0]?.id || null);
  const [adding, setAdding] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState('');
  const [newForm, setNewForm] = React.useState({ title: '', date: '', location: '' });
  const selected = sessions.find(s => s.id === selectedId) || sessions[0] || null;
  const iStyle = { width: '100%', boxSizing: 'border-box', background: 'oklch(0.16 0.012 60 / 0.55)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '8px 11px', fontSize: 13, outline: 'none', fontFamily: 'inherit' };

  React.useEffect(() => {
    if (!selected && sessions[0]) setSelectedId(sessions[0].id);
  }, [sessions.length, selectedId]);

  const addSession = (e) => {
    e.preventDefault();
    if (!newForm.title.trim()) return;
    const nextNumber = Math.max(0, ...sessions.map(s => Number(s.number) || 0)) + 1;
    window.Store.dispatch({ type: 'SESSION_ADD', number: nextNumber, title: newForm.title.trim(), date: newForm.date.trim(), location: newForm.location.trim(), bullets: [], recap: '' });
    setNewForm({ title: '', date: '', location: '' });
    setAdding(false);
    setTimeout(() => setSelectedId(window.Store.get().sessions[0]?.id), 0);
  };

  const addBullet = (e) => {
    e.preventDefault();
    if (!selected || !noteDraft.trim()) return;
    window.Store.dispatch({ type: 'SESSION_ADD_BULLET', id: selected.id, text: noteDraft.trim() });
    setNoteDraft('');
  };

  const set = (field, value) => window.Store.dispatch({ type: 'SESSION_SET_FIELD', id: selected.id, field, value });

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Session ledger</div>
          <h1 className="page-title">Sessions</h1>
          <div className="page-sub">{sessions.length} records · notes persist in this browser</div>
        </div>
        <div className="row">
          <button className="tbtn" onClick={() => onNav('warroom')}><Icon.WarRoom /> War Room</button>
          <button className="tbtn brass" onClick={() => setAdding(v => !v)}><Icon.Plus /> New session</button>
        </div>
      </div>

      {adding && (
        <form className="card cornered" onSubmit={addSession} style={{ marginBottom: 14 }}>
          <div className="head"><Icon.Sessions /><span className="title">Open a new session ledger</span><div className="spacer"></div><span className="smallcaps">Session {Math.max(0, ...sessions.map(s => Number(s.number) || 0)) + 1}</span></div>
          <div className="body">
            <div className="grid" style={{ gridTemplateColumns: '1fr 160px 200px', gap: 10 }}>
              <Field label="Title" value={newForm.title} onChange={v => setNewForm(f => ({ ...f, title: v }))} autoFocus placeholder="The Bells of Cinderhold" />
              <Field label="In-world date" value={newForm.date} onChange={v => setNewForm(f => ({ ...f, date: v }))} placeholder="14 Vael" />
              <Field label="Location" value={newForm.location} onChange={v => setNewForm(f => ({ ...f, location: v }))} placeholder="Cinderhold" />
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="tbtn brass" type="submit"><Icon.Plus /> Create session</button>
              <button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid" style={{ gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* Left — session list */}
        <div className="card cornered">
          <div className="head"><Icon.Sessions /><span className="title">Ledger</span><div className="spacer"></div><span className="smallcaps">{sessions.length}</span></div>
          <div style={{ padding: 0, maxHeight: 620, overflowY: 'auto' }}>
            {sessions.map(sess => (
              <div key={sess.id} className="clickable" onClick={() => setSelectedId(sess.id)}
                style={{ padding: '11px 14px', borderBottom: '1px dashed var(--hairline-2)', background: selected?.id === sess.id ? 'oklch(0.26 0.02 70 / 0.6)' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div className="smallcaps" style={{ fontSize: 9.5 }}>Session {sess.number}</div>
                  {sess.date && <div className="muted" style={{ fontSize: 10.5 }}>{sess.date}</div>}
                </div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, lineHeight: 1.25, marginTop: 2 }}>{sess.title}</div>
                {sess.location && <div className="muted" style={{ fontSize: 10.5, fontStyle: 'italic', marginTop: 2 }}>{sess.location}</div>}
                <div className="muted" style={{ fontSize: 10.5, marginTop: 3 }}>{(sess.bullets || []).length} events{sess.recap ? ' · has recap' : ''}</div>
              </div>
            ))}
            {sessions.length === 0 && <div className="empty" style={{ margin: 14 }}><div className="display">No sessions yet.</div>Begin with a title.</div>}
          </div>
        </div>

        {/* Right — session detail */}
        {selected ? (
          <div className="col" style={{ gap: 14 }}>
            {/* Header card */}
            <div className="card cornered">
              <div className="head"><Icon.Quill /><span className="title">Chronicle</span><div className="spacer"></div><span className="smallcaps">Session {selected.number}</span></div>
              <div className="body">
                <input value={selected.title} onChange={e => set('title', e.target.value)}
                  style={{ ...iStyle, fontFamily: 'var(--f-display)', fontSize: 22, padding: '9px 11px', marginBottom: 10 }} />
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <label>
                    <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 4 }}>In-world date</div>
                    <input value={selected.date || ''} onChange={e => set('date', e.target.value)} placeholder="14 Vael" style={iStyle} />
                  </label>
                  <label>
                    <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 4 }}>Location</div>
                    <input value={selected.location || ''} onChange={e => set('location', e.target.value)} placeholder="Where did the session take place?" style={iStyle} />
                  </label>
                </div>
              </div>
            </div>

            {/* Recap card */}
            <div className="card cornered">
              <div className="head"><Icon.Quill /><span className="title">Recap</span><div className="spacer"></div><span className="muted" style={{ fontSize: 11 }}>What the party would remember</span></div>
              <div className="body">
                <textarea value={selected.recap || ''} onChange={e => set('recap', e.target.value)}
                  placeholder="Write a one-paragraph recap — what happened, what changed, what the party knows now that they didn't before."
                  rows={5}
                  style={{ ...iStyle, resize: 'vertical', lineHeight: 1.55, fontSize: 13.5 }} />
              </div>
            </div>

            {/* Key events card */}
            <div className="card cornered">
              <div className="head"><Icon.Sessions /><span className="title">Key Events</span><div className="spacer"></div><span className="smallcaps">{(selected.bullets || []).length}</span></div>
              <div className="body">
                <div className="col" style={{ gap: 6, marginBottom: 12 }}>
                  {(selected.bullets || []).map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed var(--hairline-2)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brass)', flexShrink: 0, marginTop: 1 }}></span>
                      <input value={b}
                        onChange={e => { const bullets = [...(selected.bullets || [])]; bullets[i] = e.target.value; set('bullets', bullets); }}
                        style={{ flex: 1, background: 'transparent', border: 0, color: 'var(--fg-1)', fontSize: 13, outline: 'none' }} />
                      <button className="tbtn" style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => window.Store.dispatch({ type: 'SESSION_REMOVE_BULLET', id: selected.id, index: i })}>×</button>
                    </div>
                  ))}
                </div>
                <form onSubmit={addBullet} style={{ display: 'flex', gap: 8 }}>
                  <input value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                    placeholder="What happened? One bullet per beat."
                    style={{ flex: 1, ...iStyle }} />
                  <button className="tbtn brass" type="submit"><Icon.Plus /> Add</button>
                </form>
                <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
                  <button className="tbtn" style={{ color: 'oklch(0.55 0.1 25)' }} onClick={() => { if (window.confirm(`Delete "${selected.title}"?`)) window.Store.dispatch({ type: 'SESSION_REMOVE', id: selected.id }); }}>Delete session</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card cornered"><div className="body"><div className="empty"><div className="display">Nothing selected.</div>Create a session to begin the ledger.</div></div></div>
        )}
      </div>
    </div>
  );
}

function CharactersIndex({ state, onOpenNPC }) {
  const npcs = state.npcs || [];
  const factions = state.factions || [];
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', title: '', location: '' });
  const addNPC = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    window.Store.dispatch({ type: 'NPC_ADD', name: form.name.trim(), title: form.title.trim(), location: form.location.trim() });
    setForm({ name: '', title: '', location: '' });
    setAdding(false);
    setTimeout(() => {
      const created = window.Store.get().npcs.at(-1);
      if (created) onOpenNPC(created.id);
    }, 0);
  };
  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Dramatis Personae</div>
          <h1 className="page-title">Characters</h1>
          <div className="page-sub">{npcs.length} dossiers · click any to open</div>
        </div>
        <div className="row">
          <button className="tbtn" onClick={() => setAdding(v => !v)}><Icon.Plus /> New NPC</button>
        </div>
      </div>
      {adding && (
        <form className="card cornered" onSubmit={addNPC} style={{ marginBottom: 14 }}>
          <div className="head">
            <Icon.Characters />
            <span className="title">New dossier</span>
          </div>
          <div className="body">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Name" value={form.name} onChange={(v) => setForm(f => ({ ...f, name: v }))} autoFocus />
              <Field label="Title" value={form.title} onChange={(v) => setForm(f => ({ ...f, title: v }))} />
              <Field label="Location" value={form.location} onChange={(v) => setForm(f => ({ ...f, location: v }))} />
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="tbtn brass" type="submit"><Icon.Plus /> Create NPC</button>
              <button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        </form>
      )}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {npcs.map(n => {
          const fac = factions.find(f => f.id === n.faction);
          return (
            <div key={n.id} className="card cornered clickable" onClick={() => onOpenNPC(n.id)}>
              <div className="body">
                <div className="row" style={{ alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(160deg, oklch(0.4 0.04 50), oklch(0.22 0.04 30))',
                    border: '1px solid var(--brass-dim)',
                    display: 'grid', placeItems: 'center',
                    fontFamily: 'var(--f-display)', fontSize: 20, color: 'var(--brass)',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {n.image
                      ? <img src={n.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : (n.name || '?')[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 17 }}>{n.name}</div>
                    <div className="muted" style={{ fontSize: 11.5, fontStyle: 'italic' }}>{n.title}</div>
                  </div>
                </div>
                <div className="row" style={{ marginTop: 10, gap: 6 }}>
                  <DispPill d={n.disposition} />
                  {fac && <span className="pill iron">{fac.name}</span>}
                  {n.public && <span className="pill brass">player safe</span>}
                </div>
                <div className="quote" style={{ fontSize: 12.5, marginTop: 10, color: 'var(--fg-2)' }}>
                  "{n.quote}"
                </div>
                <div className="row gap-sm" style={{ marginTop: 10 }}>
                  <button className={n.public ? 'tbtn brass' : 'tbtn'} onClick={(e) => { e.stopPropagation(); window.Store.dispatch({ type: 'NPC_SET_FIELD', id: n.id, field: 'public', value: !n.public }); }}>
                    <Icon.PlayerView /> {n.public ? 'Published' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Factions index — also shows a single faction in detail when an id is provided
function FactionsIndex({ state, factionId, onNav, onOpenNPC }) {
  const factions = state.factions || [];
  const npcs = state.npcs || [];
  const selected = factionId ? factions.find(f => f.id === factionId) : null;
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', ideology: '', leader: '', seat: '', clockLabel: '' });
  const addFaction = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    window.Store.dispatch({
      type: 'FACTION_ADD',
      name: form.name.trim(),
      ideology: form.ideology.trim() || 'New power in motion',
      leader: form.leader.trim(),
      seat: form.seat.trim(),
      clockLabel: form.clockLabel.trim() || 'Unwritten scheme'
    });
    setForm({ name: '', ideology: '', leader: '', seat: '', clockLabel: '' });
    setAdding(false);
    setTimeout(() => {
      const created = window.Store.get().factions.at(-1);
      if (created) onNav('faction', { id: created.id });
    }, 0);
  };
  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Powers in motion</div>
          <h1 className="page-title">{selected ? selected.name : 'Factions'}</h1>
          <div className="page-sub">{selected ? selected.ideology : 'Five clocks turn. Three of them point at the throne.'}</div>
        </div>
        <div className="row">
          {selected && <button className="tbtn" onClick={() => onNav('factions')}><Icon.Chevron /> All factions</button>}
          <button className="tbtn" onClick={() => setAdding(v => !v)}><Icon.Plus /> New faction</button>
        </div>
      </div>

      {adding && (
        <form className="card cornered" onSubmit={addFaction} style={{ marginBottom: 14 }}>
          <div className="head">
            <Icon.Factions />
            <span className="title">Raise a banner</span>
          </div>
          <div className="body">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Name" value={form.name} onChange={(v) => setForm(f => ({ ...f, name: v }))} autoFocus />
              <Field label="Ideology" value={form.ideology} onChange={(v) => setForm(f => ({ ...f, ideology: v }))} />
              <Field label="Leader" value={form.leader} onChange={(v) => setForm(f => ({ ...f, leader: v }))} />
              <Field label="Seat" value={form.seat} onChange={(v) => setForm(f => ({ ...f, seat: v }))} />
            </div>
            <div style={{ marginTop: 10 }}>
              <Field label="Clock" value={form.clockLabel} onChange={(v) => setForm(f => ({ ...f, clockLabel: v }))} />
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="tbtn brass" type="submit"><Icon.Plus /> Create faction</button>
              <button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      {selected ? (
        <FactionDetail f={selected} npcs={npcs} onNav={onNav} onOpenNPC={onOpenNPC} />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {factions.map(f => (
            <div key={f.id} className="card cornered clickable" onClick={() => onNav('faction', { id: f.id })}>
              <div className="body" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <FactionClock segments={f.clock.segments} filled={f.clock.filled} size={96} color={f.color}
                  onSegmentClick={(seg) => dispatch({ type: 'FACTION_CLOCK_SET', id: f.id, filled: seg + 1 })} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sigil kind={f.sigil} size={22} color="var(--brass)" />
                    <span style={{ fontFamily: 'var(--f-display)', fontSize: 19, lineHeight: 1.15 }}>{f.name}</span>
                  </div>
                  <div className="quote" style={{ fontSize: 13.5, color: 'var(--fg-1)', lineHeight: 1.4 }}>
                    "{f.ideology}"
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <DispPill d={f.disposition} />
                    <span className="muted" style={{ fontSize: 11.5 }}>{f.clock.label} · {f.clock.filled}/{f.clock.segments}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FactionDetail({ f, npcs, onNav, onOpenNPC }) {
  const members = npcs.filter(n => n.faction === f.id);
  return (
    <div className="grid" style={{ gridTemplateColumns: '320px 1fr', gap: 16 }}>
      <div className="col">
        <div className="card cornered">
          <div className="body" style={{ display: 'grid', placeItems: 'center', padding: '22px' }}>
            <Sigil kind={f.sigil} size={80} color="var(--brass)" />
            <div className="display" style={{ marginTop: 12, fontSize: 22, textAlign: 'center' }}>{f.name}</div>
            <DispPill d={f.disposition} />
          </div>
        </div>
        <div className="card cornered">
          <div className="body">
            <div className="smallcaps" style={{ marginBottom: 8 }}>Particulars</div>
            <div className="lrow"><span className="muted" style={{ fontSize: 11, width: 70 }}>LEADER</span><span style={{ fontSize: 13 }}>{f.leader}</span></div>
            <div className="lrow"><span className="muted" style={{ fontSize: 11, width: 70 }}>SEAT</span><span style={{ fontSize: 13 }}>{f.seat}</span></div>
            <div className="lrow"><span className="muted" style={{ fontSize: 11, width: 70 }}>MEMBERS</span><span style={{ fontSize: 13 }}>{members.length} on record</span></div>
          </div>
        </div>
      </div>

      <div className="col">
        <div className="card cornered">
          <div className="head">
            <Icon.Factions />
            <span className="title">The Clock</span>
            <div className="spacer"></div>
            <span className="smallcaps">{f.clock.filled}/{f.clock.segments}</span>
          </div>
          <div className="body" style={{ display: 'flex', gap: 24, alignItems: 'center', padding: '24px' }}>
            <FactionClock segments={f.clock.segments} filled={f.clock.filled} size={140} color={f.color}
              onSegmentClick={(seg) => dispatch({ type: 'FACTION_CLOCK_SET', id: f.id, filled: seg + 1 })} />
            <div style={{ flex: 1 }}>
              <div className="smallcaps" style={{ marginBottom: 6 }}>What this clock counts</div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1.25 }}>{f.clock.label}</div>
              <div className="quote" style={{ marginTop: 12, fontSize: 13.5 }}>{f.summary}</div>
              <div className="row gap-sm" style={{ marginTop: 12 }}>
                <button className="tbtn" onClick={() => dispatch({ type: 'FACTION_CLOCK_SET', id: f.id, filled: Math.min(f.clock.segments, f.clock.filled + 1) })}>Advance clock</button>
                <button className="tbtn" onClick={() => dispatch({ type: 'FACTION_CLOCK_SET', id: f.id, filled: Math.max(0, f.clock.filled - 1) })}>Pull back</button>
              </div>
            </div>
          </div>
        </div>

        <div className="card cornered">
          <div className="head">
            <Icon.Characters />
            <span className="title">Members on record</span>
            <div className="spacer"></div>
            <span className="smallcaps">{members.length}</span>
          </div>
          <div className="body">
            {members.length === 0 && <div className="muted" style={{ fontStyle: 'italic' }}>None named yet.</div>}
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {members.map(n => (
                <div key={n.id} className="clickable lrow" style={{ padding: 8, borderBottom: 'none', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', background: 'oklch(0.22 0.014 64 / 0.5)' }}
                     onClick={() => onOpenNPC(n.id)}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(160deg, oklch(0.4 0.04 50), oklch(0.22 0.04 30))',
                    border: '1px solid var(--brass-dim)',
                    display: 'grid', placeItems: 'center',
                    fontFamily: 'var(--f-display)', fontSize: 15, color: 'var(--brass)',
                    flexShrink: 0,
                  }}>{n.name[0]}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 14 }}>{n.name}</div>
                    <div className="muted" style={{ fontSize: 11, fontStyle: 'italic' }}>{n.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quests ───────────────────────────────────────────────────────────
function Quests({ state }) {
  const quests = state.quests || [];
  const [adding, setAdding] = React.useState(false);
  const [filter, setFilter] = React.useState('active');
  const [form, setForm] = React.useState({ title: '', arc: 'Main', giver: '', next: '', stakes: '', note: '' });

  const addQuest = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    window.Store.dispatch({ type: 'QUEST_ADD', title: form.title.trim(), arc: form.arc, giver: form.giver.trim(), next: form.next.trim(), stakes: form.stakes.trim(), note: form.note.trim(), state: 'active', step: 0, total: 3, public: false });
    setForm({ title: '', arc: 'Main', giver: '', next: '', stakes: '', note: '' });
    setAdding(false);
  };

  const set = (id, field, value) => window.Store.dispatch({ type: 'QUEST_SET_FIELD', id, field, value });

  const visible = filter === 'all' ? quests : quests.filter(q => (q.state || 'active') === filter);
  const arcColor = { Main: 'brass', Side: 'iron', Personal: 'moon' };
  const stateColor = { active: 'brass', held: 'iron', completed: 'iron', dormant: 'iron', failed: 'iron' };

  const iStyle = { width: '100%', boxSizing: 'border-box', background: 'oklch(0.16 0.012 60 / 0.55)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' };

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Threads of obligation</div>
          <h1 className="page-title">Quests</h1>
          <div className="page-sub">{quests.filter(q => (q.state || 'active') === 'active').length} active · {quests.length} total</div>
        </div>
        <button className="tbtn brass" onClick={() => setAdding(v => !v)}><Icon.Plus /> New quest</button>
      </div>

      {adding && (
        <form className="card cornered" onSubmit={addQuest} style={{ marginBottom: 14 }}>
          <div className="head"><Icon.Quests /><span className="title">Write a quest</span><div className="spacer"></div><button className="tbtn brass" type="submit"><Icon.Plus /> Add</button><button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button></div>
          <div className="body">
            <div className="grid" style={{ gridTemplateColumns: '1fr 120px 1fr', gap: 10, marginBottom: 10 }}>
              <Field label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} autoFocus />
              <Field label="Arc" value={form.arc} onChange={v => setForm(f => ({ ...f, arc: v }))} options={[{value:'Main',label:'Main'},{value:'Side',label:'Side'},{value:'Personal',label:'Personal'}]} />
              <Field label="Quest giver" value={form.giver} onChange={v => setForm(f => ({ ...f, giver: v }))} placeholder="Who gave this thread?" />
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Current objective" value={form.next} onChange={v => setForm(f => ({ ...f, next: v }))} placeholder="The very next thing to do." />
              <Field label="Stakes" value={form.stakes} onChange={v => setForm(f => ({ ...f, stakes: v }))} placeholder="What happens if they fail?" />
            </div>
            <div style={{ marginTop: 10 }}><Field label="Notes" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} multiline /></div>
          </div>
        </form>
      )}

      <div className="row gap-sm" style={{ marginBottom: 14 }}>
        {['active', 'held', 'completed', 'all'].map(s => (
          <button key={s} className={filter === s ? 'tbtn brass' : 'tbtn'} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {visible.map(q => (
          <div key={q.id} className="card cornered" style={{ opacity: q.state === 'completed' || q.state === 'dormant' ? 0.7 : 1 }}>
            <div className="head">
              <Icon.Quests />
              <span className="title">{q.title}</span>
              <div className="spacer"></div>
              {q.arc && <span className={`pill ${arcColor[q.arc] || 'iron'}`}>{q.arc}</span>}
              <span className={`pill ${stateColor[q.state] || 'iron'}`}>{q.state || 'active'}</span>
            </div>
            <div className="body">
              {/* Progress dots */}
              {(q.total > 0) && (
                <div style={{ display: 'flex', gap: 5, marginBottom: 12, alignItems: 'center' }}>
                  {Array.from({ length: q.total || 3 }).map((_, i) => (
                    <button key={i} onClick={() => { set(q.id, 'step', i + 1); }}
                      style={{ width: 10, height: 10, borderRadius: '50%', border: '1px solid var(--brass-dim)', background: i < (q.step || 0) ? 'var(--brass)' : 'transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
                  ))}
                  <span className="muted" style={{ fontSize: 10.5, marginLeft: 4 }}>{q.step || 0}/{q.total || 3}</span>
                </div>
              )}

              {/* Current objective */}
              <div style={{ marginBottom: 10 }}>
                <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Current objective</div>
                <input value={q.next || ''} onChange={e => set(q.id, 'next', e.target.value)}
                  placeholder="What is the very next thing to do?"
                  style={{ ...iStyle, fontFamily: 'var(--f-display)', fontSize: 15, background: 'oklch(0.22 0.02 65 / 0.5)', borderColor: 'var(--brass-dim)' }} />
              </div>

              {/* Giver + Stakes row */}
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div>
                  <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Quest giver</div>
                  <input value={q.giver || ''} onChange={e => set(q.id, 'giver', e.target.value)} placeholder="—" style={iStyle} />
                </div>
                <div>
                  <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Stakes</div>
                  <input value={q.stakes || ''} onChange={e => set(q.id, 'stakes', e.target.value)} placeholder="What's at risk?" style={iStyle} />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 12 }}>
                <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Notes</div>
                <textarea value={q.note || ''} onChange={e => set(q.id, 'note', e.target.value)} rows={2} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.45 }} placeholder="Background, complications, history…" />
              </div>

              {/* Actions */}
              <div className="row wrap gap-sm">
                {['active', 'held', 'completed', 'failed'].map(s => (
                  <button key={s} className={(q.state || 'active') === s ? 'tbtn brass' : 'tbtn'} onClick={() => set(q.id, 'state', s)}>{s}</button>
                ))}
                <button className={q.public ? 'tbtn brass' : 'tbtn'} onClick={() => set(q.id, 'public', !q.public)}>
                  <Icon.PlayerView /> {q.public ? 'Published' : 'Publish'}
                </button>
                <button className="tbtn" onClick={() => window.Store.dispatch({ type: 'QUEST_REMOVE', id: q.id })}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!visible.length && <div className="empty"><div className="display">No {filter} quests.</div></div>}
    </div>
  );
}

function Items({ state }) {
  const relics = state.relics || [];
  const [adding, setAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [category, setCategory] = React.useState('all');
  const [type, setType] = React.useState('all');
  const [form, setForm] = React.useState({ name: '', category: 'relic', type: 'sword', desc: '', image: '' });
  const [editForm, setEditForm] = React.useState(null);
  const typeSuggestions = ['sword', 'necklace', 'ring', 'armor', 'tool', 'book', 'consumable', 'key', 'artifact'];
  const types = Array.from(new Set(relics.map(r => r.type || r.kind).filter(Boolean))).sort();
  const filtered = relics.filter(r => {
    if (category !== 'all' && (r.category || (r.kind === 'relic' ? 'relic' : 'item')) !== category) return false;
    if (type !== 'all' && (r.type || r.kind) !== type) return false;
    return true;
  });
  const readImage = (file, setter) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(f => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };
  const openAdd = () => {
    const nextCategory = category === 'item' || category === 'relic' ? category : 'relic';
    const nextType = type !== 'all' ? type : 'sword';
    setForm({ name: '', category: nextCategory, type: nextType, desc: '', image: '' });
    setAdding(v => !v);
    setEditingId(null);
  };
  const addRelicFromForm = (formEl) => {
    const values = new FormData(formEl);
    const recordName = String(values.get('name') || form.name || '').trim();
    const recordCategory = String(values.get('category') || form.category || 'item');
    const recordType = String(values.get('itemType') || form.type || recordCategory).trim() || recordCategory;
    const recordDesc = String(values.get('desc') || form.desc || '').trim();
    if (!recordName) return;
    window.Store.dispatch({ type: 'RELIC_ADD', name: recordName, category: recordCategory, itemType: recordType, desc: recordDesc, image: form.image });
    setCategory(recordCategory);
    setType(recordType);
    setForm({ name: '', category: recordCategory, type: recordType, desc: '', image: '' });
    setAdding(false);
  };
  const addRelic = (e) => {
    e.preventDefault();
    addRelicFromForm(e.currentTarget);
  };
  React.useEffect(() => {
    if (!adding) return undefined;
    const handleNativeAdd = (event) => {
      const button = event.target.closest?.('[data-relic-add]');
      if (!button) return;
      const formEl = button.closest('form');
      if (!formEl) return;
      event.preventDefault();
      addRelicFromForm(formEl);
    };
    document.addEventListener('click', handleNativeAdd);
    return () => document.removeEventListener('click', handleNativeAdd);
  }, [adding, form.image]);
  const beginEdit = (item) => {
    setAdding(false);
    setEditingId(item.id);
    setEditForm({
      name: item.name || '',
      category: item.category || (item.kind === 'relic' ? 'relic' : 'item'),
      type: item.type || item.kind || '',
      desc: item.desc || '',
      image: item.image || '',
    });
  };
  const saveEdit = (e) => {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const next = {
      name: String(values.get('editName') || '').trim(),
      category: String(values.get('editCategory') || 'item'),
      type: String(values.get('editType') || '').trim(),
      desc: String(values.get('editDesc') || ''),
      image: editForm?.image || '',
    };
    if (!editingId || !next.name) return;
    ['name', 'category', 'type', 'desc', 'image'].forEach(field => {
      window.Store.dispatch({ type: 'RELIC_SET_FIELD', id: editingId, field, value: next[field] || '' });
    });
    window.Store.dispatch({ type: 'RELIC_SET_FIELD', id: editingId, field: 'kind', value: next.type || next.category });
    setEditingId(null);
    setEditForm(null);
  };
  const inputStyle = { width: '100%', boxSizing: 'border-box', background: 'oklch(0.16 0.012 60 / 0.55)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '8px 10px', fontSize: 13, outline: 'none' };
  const TypeInput = ({ value, onChange, id, name }) => (
    <label style={{ display: 'block' }}>
      <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Type</div>
      <input name={name} list={id} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
      <datalist id={id}>{typeSuggestions.map(t => <option key={t} value={t} />)}</datalist>
    </label>
  );
  const ImageBox = ({ image, compact }) => (
    <div style={{ width: compact ? 86 : '100%', height: compact ? 86 : undefined, aspectRatio: compact ? undefined : '1/1', maxWidth: compact ? 86 : 180, border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', overflow: 'hidden', background: 'oklch(0.16 0.012 60 / 0.55)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
      {image ? <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon.Items />}
    </div>
  );
  const TextInput = ({ name, value, onChange, autoFocus }) => (
    <input name={name} value={value} onChange={(e) => onChange(e.target.value)} autoFocus={autoFocus} style={inputStyle} />
  );
  const SelectInput = ({ name, value, onChange }) => (
    <select name={name} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
      <option value="item">item</option>
      <option value="relic">relic</option>
    </select>
  );
  const TextAreaInput = ({ name, value, onChange }) => (
    <textarea name={name} value={value} onChange={(e) => onChange(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.45 }} />
  );
  return (
    <div className="page fade-up">
      <div className="page-header"><div><div className="smallcaps" style={{ marginBottom: 6 }}>Armory and relic vault</div><h1 className="page-title">Items &amp; Relics</h1><div className="page-sub">{filtered.length} shown · {relics.length} records</div></div><button className="tbtn brass" onClick={openAdd}><Icon.Plus /> New record</button></div>
      <div className="row wrap gap-sm" style={{ marginBottom: 14 }}>
        {['all', 'item', 'relic'].map(c => <button key={c} className={category === c ? 'tbtn brass' : 'tbtn'} onClick={() => setCategory(c)}>{c}</button>)}
        <button className={type === 'all' ? 'tbtn brass' : 'tbtn'} onClick={() => setType('all')}>all types</button>
        {types.map(t => <button key={t} className={type === t ? 'tbtn brass' : 'tbtn'} onClick={() => setType(t)}>{t}</button>)}
      </div>
      {adding && <form className="card cornered" onSubmit={addRelic} style={{ marginBottom: 14 }}><div className="head"><Icon.Items /><span className="title">Register an item or relic</span><div className="spacer"></div><button className="tbtn brass" type="button" data-relic-add="1"><Icon.Plus /> Add record</button><button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button></div><div className="body"><div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}><label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Name</div><input name="name" defaultValue={form.name} autoFocus style={inputStyle} /></label><label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Class</div><select name="category" defaultValue={form.category} style={inputStyle}><option value="item">item</option><option value="relic">relic</option></select></label><label style={{ display: 'block' }}><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Type</div><input name="itemType" list="item-type-suggestions" defaultValue={form.type} style={inputStyle} /><datalist id="item-type-suggestions">{typeSuggestions.map(t => <option key={t} value={t} />)}</datalist></label></div><label style={{ display: 'block', marginTop: 10 }}><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Description</div><textarea name="desc" defaultValue={form.desc} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.45 }} /></label><div className="row wrap gap-sm" style={{ marginTop: 10, alignItems: 'center' }}><ImageBox image={form.image} compact /><label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Picture</div><input type="file" accept="image/*" onChange={(e) => readImage(e.target.files?.[0], setForm)} style={{ color: 'var(--fg-1)' }} /></label><button className="tbtn" type="button" onClick={() => setForm(f => ({ ...f, image: '' }))}>Clear image</button></div></div></form>}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(390px, 1fr))', gap: 10 }}>{filtered.map(r => {
        const isEditing = editingId === r.id && editForm;
        return <div key={r.id} className="card cornered"><div className="body" style={{ padding: 12 }}>{isEditing ? <form onSubmit={saveEdit}><div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}><label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Name</div><input name="editName" defaultValue={editForm.name} autoFocus style={inputStyle} /></label><label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Class</div><select name="editCategory" defaultValue={editForm.category} style={inputStyle}><option value="item">item</option><option value="relic">relic</option></select></label><label style={{ display: 'block' }}><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Type</div><input name="editType" list={`item-type-edit-${r.id}`} defaultValue={editForm.type} style={inputStyle} /><datalist id={`item-type-edit-${r.id}`}>{typeSuggestions.map(t => <option key={t} value={t} />)}</datalist></label></div><label style={{ display: 'block', marginTop: 10 }}><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Description</div><textarea name="editDesc" defaultValue={editForm.desc} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.45 }} /></label><div className="row wrap gap-sm" style={{ marginTop: 10, alignItems: 'center' }}><ImageBox image={editForm.image} compact /><label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Picture</div><input type="file" accept="image/*" onChange={(e) => readImage(e.target.files?.[0], setEditForm)} style={{ color: 'var(--fg-1)' }} /></label><button className="tbtn" type="button" onClick={() => setEditForm(f => ({ ...f, image: '' }))}>Clear image</button></div><div className="row" style={{ marginTop: 12 }}><button className="tbtn brass" type="submit">Save</button><button className="tbtn" type="button" onClick={() => { setEditingId(null); setEditForm(null); }}>Cancel</button></div></form> : <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><ImageBox image={r.image} compact /><div style={{ flex: 1, minWidth: 0 }}><div className="row gap-sm" style={{ marginBottom: 7 }}><span className={r.category === 'item' ? 'pill iron' : 'pill brass'}>{r.category || 'relic'}</span><span className="pill iron">{r.type || r.kind}</span></div><div style={{ fontFamily: 'var(--f-display)', fontSize: 18, lineHeight: 1.1 }}>{r.name}</div><div className="quote" style={{ marginTop: 8, fontSize: 12.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.desc}</div><div className="row gap-sm" style={{ marginTop: 10 }}><button className="tbtn" onClick={() => beginEdit(r)}>Edit</button><button className="tbtn" onClick={() => window.Store.dispatch({ type: 'RELIC_REMOVE', id: r.id })}>Delete</button></div></div></div>}</div></div>;
      })}</div>
      {!filtered.length && <div className="empty"><div className="display">No records match.</div>Add a record or loosen the active filters.</div>}
    </div>
  );
}

function Handouts({ state }) {
  const handouts = state.handouts || [];
  const [adding, setAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [image, setImage] = React.useState('');
  const iStyle = { width: '100%', boxSizing: 'border-box', background: 'oklch(0.16 0.012 60 / 0.55)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '8px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' };

  const readImage = (file) => { if (!file) return; const r = new FileReader(); r.onload = () => setImage(r.result); r.readAsDataURL(file); };

  const addHandout = (e) => {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const title = String(values.get('title') || '').trim();
    if (!title) return;
    window.Store.dispatch({ type: 'HANDOUT_ADD', title, kind: String(values.get('kind') || 'note'), body: String(values.get('body') || ''), public: values.get('public') === 'on', image });
    setImage(''); setAdding(false);
  };

  const setField = (id, field, value) => window.Store.dispatch({ type: 'HANDOUT_SET_FIELD', id, field, value });

  const HandoutPreview = ({ h }) => {
    const isLetter = h.kind === 'letter';
    const isDocument = h.kind === 'document';
    const isImage = h.kind === 'image' || h.kind === 'map';

    const letterStyle = {
      background: 'oklch(0.88 0.025 80)',
      border: '1px solid oklch(0.72 0.04 70)',
      borderRadius: 2,
      padding: '20px 24px',
      fontFamily: 'var(--f-display)',
      fontSize: 14,
      color: 'oklch(0.22 0.02 60)',
      lineHeight: 1.7,
      whiteSpace: 'pre-wrap',
      boxShadow: '0 2px 12px oklch(0 0 0 / 0.4), inset 0 0 40px oklch(0.7 0.03 70 / 0.3)',
    };

    const documentStyle = {
      background: 'oklch(0.15 0.008 60)',
      border: '1px solid var(--hairline-2)',
      borderRadius: 'var(--r)',
      padding: '16px 18px',
      fontFamily: 'var(--f-mono)',
      fontSize: 12,
      color: 'var(--fg-1)',
      lineHeight: 1.65,
      whiteSpace: 'pre-wrap',
    };

    if (isImage && h.image) return <img src={h.image} style={{ width: '100%', borderRadius: 'var(--r)', display: 'block' }} />;
    if (isLetter) return <div style={letterStyle}>{h.body || <span style={{ opacity: 0.4 }}>No text yet.</span>}</div>;
    if (isDocument) return <div style={documentStyle}>{h.body || <span style={{ opacity: 0.4 }}>No text yet.</span>}</div>;
    return <div style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{h.body}</div>;
  };

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Player-facing papers</div>
          <h1 className="page-title">Handouts</h1>
          <div className="page-sub">{handouts.length} handouts · images and text persist locally</div>
        </div>
        <button className="tbtn brass" onClick={() => { setAdding(v => !v); setImage(''); }}><Icon.Plus /> New handout</button>
      </div>

      {adding && (
        <form className="card cornered" onSubmit={addHandout} style={{ marginBottom: 14 }}>
          <div className="head"><Icon.Handouts /><span className="title">Prepare a handout</span><div className="spacer"></div><button className="tbtn brass" type="submit"><Icon.Plus /> Add</button><button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button></div>
          <div className="body">
            <div className="grid" style={{ gridTemplateColumns: '1fr 150px', gap: 10, marginBottom: 10 }}>
              <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Title</div><input name="title" autoFocus style={iStyle} /></label>
              <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Kind</div>
                <select name="kind" defaultValue="note" style={iStyle}><option value="note">note</option><option value="letter">letter</option><option value="document">document</option><option value="image">image</option></select>
              </label>
            </div>
            <label style={{ display: 'block', marginBottom: 10 }}><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Text</div><textarea name="body" rows={5} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.6 }} /></label>
            <div className="row wrap gap-sm" style={{ alignItems: 'center' }}>
              {image && <img src={image} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--r)' }} />}
              <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Picture</div><input type="file" accept="image/*" onChange={e => readImage(e.target.files?.[0])} style={{ color: 'var(--fg-1)', fontSize: 12 }} /></label>
              <label className="row gap-sm" style={{ marginLeft: 'auto' }}><input name="public" type="checkbox" /> <span style={{ fontSize: 13 }}>Player safe</span></label>
            </div>
          </div>
        </form>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
        {handouts.map(h => (
          <div key={h.id} className="card cornered">
            <div className="head">
              <Icon.Handouts />
              <span className="title">{h.title}</span>
              <div className="spacer"></div>
              <span className="pill iron">{h.kind || 'note'}</span>
              {h.public && <span className="pill brass">player safe</span>}
            </div>
            <div className="body">
              {editingId === h.id ? (
                <div>
                  <div className="grid" style={{ gridTemplateColumns: '1fr 150px', gap: 10, marginBottom: 10 }}>
                    <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Title</div><input value={h.title} onChange={e => setField(h.id, 'title', e.target.value)} style={iStyle} /></label>
                    <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Kind</div>
                      <select value={h.kind || 'note'} onChange={e => setField(h.id, 'kind', e.target.value)} style={iStyle}>
                        {['note','letter','document','image'].map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </label>
                  </div>
                  <label style={{ display: 'block', marginBottom: 10 }}><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Text</div><textarea value={h.body || ''} onChange={e => setField(h.id, 'body', e.target.value)} rows={6} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.6 }} /></label>
                  <div className="row gap-sm">
                    <label className="row gap-sm"><input type="checkbox" checked={!!h.public} onChange={e => setField(h.id, 'public', e.target.checked)} /> <span style={{ fontSize: 13 }}>Player safe</span></label>
                    <div className="spacer"></div>
                    <button className="tbtn brass" onClick={() => setEditingId(null)}>Done</button>
                    <button className="tbtn" onClick={() => { window.Store.dispatch({ type: 'HANDOUT_REMOVE', id: h.id }); setEditingId(null); }}>Delete</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 12 }}><HandoutPreview h={h} /></div>
                  <div className="row gap-sm">
                    <button className="tbtn" onClick={() => setEditingId(h.id)}>Edit</button>
                    <button className={h.public ? 'tbtn brass' : 'tbtn'} onClick={() => setField(h.id, 'public', !h.public)}>
                      <Icon.PlayerView /> {h.public ? 'Published' : 'Publish to players'}
                    </button>
                    <button className="tbtn" onClick={() => window.Store.dispatch({ type: 'HANDOUT_REMOVE', id: h.id })}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {!handouts.length && <div className="empty"><div className="display">No handouts prepared.</div>Add letters, clues, images, or table-safe notes.</div>}
    </div>
  );
}

function RandomTables({ state }) {
  const tables = state.tables || [];
  const [adding, setAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [expandedId, setExpandedId] = React.useState(null);
  const [rolling, setRolling] = React.useState({});
  const iStyle = { width: '100%', boxSizing: 'border-box', background: 'oklch(0.16 0.012 60 / 0.55)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '8px 10px', fontSize: 13, outline: 'none' };

  const roll = (t) => {
    setRolling(r => ({ ...r, [t.id]: true }));
    setTimeout(() => {
      window.Store.dispatch({ type: 'TABLE_ROLL', id: t.id });
      setRolling(r => ({ ...r, [t.id]: false }));
    }, 320);
  };

  const addTable = (e) => {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const title = String(values.get('title') || '').trim();
    if (!title) return;
    const entries = String(values.get('entries') || '').split('\n').map(s => s.trim()).filter(Boolean);
    window.Store.dispatch({ type: 'TABLE_ADD', title, die: String(values.get('die') || 'd6'), entries });
    setAdding(false);
  };

  const saveTable = (e, id) => {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    window.Store.dispatch({ type: 'TABLE_SET_FIELD', id, field: 'title', value: String(values.get('title') || '').trim() || 'Untitled table' });
    window.Store.dispatch({ type: 'TABLE_SET_FIELD', id, field: 'die', value: String(values.get('die') || 'd6') });
    window.Store.dispatch({ type: 'TABLE_SET_FIELD', id, field: 'entries', value: String(values.get('entries') || '').split('\n').map(s => s.trim()).filter(Boolean) });
    setEditingId(null);
  };

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Procedural sparks</div>
          <h1 className="page-title">Random Tables</h1>
          <div className="page-sub">{tables.length} tables · roll results persist until rerolled</div>
        </div>
        <div className="row gap-sm">
          {tables.length > 1 && (
            <button className="tbtn" onClick={() => tables.forEach(t => roll(t))}>
              <Icon.Dice /> Roll all
            </button>
          )}
          <button className="tbtn brass" onClick={() => setAdding(v => !v)}><Icon.Plus /> New table</button>
        </div>
      </div>

      {adding && (
        <form className="card cornered" onSubmit={addTable} style={{ marginBottom: 14 }}>
          <div className="head"><Icon.Tables /><span className="title">Write a table</span><div className="spacer"></div><button className="tbtn brass" type="submit"><Icon.Plus /> Add</button><button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button></div>
          <div className="body">
            <div className="grid" style={{ gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 10 }}>
              <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Title</div><input name="title" autoFocus style={iStyle} /></label>
              <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Die</div>
                <select name="die" defaultValue="d6" style={iStyle}>{['d4','d6','d8','d10','d12','d20','d100'].map(d => <option key={d} value={d}>{d}</option>)}</select>
              </label>
            </div>
            <label style={{ display: 'block' }}><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Entries, one per line</div><textarea name="entries" rows={6} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.5 }} /></label>
          </div>
        </form>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14 }}>
        {tables.map(t => {
          const isEditing = editingId === t.id;
          const isExpanded = expandedId === t.id;
          const isRolling = !!rolling[t.id];
          const entries = t.entries || [];

          return (
            <div key={t.id} className="card cornered">
              {isEditing ? (
                <form onSubmit={e => saveTable(e, t.id)}>
                  <div className="head"><Icon.Tables /><span className="title">Edit table</span><div className="spacer"></div><button className="tbtn brass" type="submit">Save</button><button className="tbtn" type="button" onClick={() => setEditingId(null)}>Cancel</button></div>
                  <div className="body">
                    <div className="grid" style={{ gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 10 }}>
                      <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Title</div><input name="title" defaultValue={t.title} autoFocus style={iStyle} /></label>
                      <label><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Die</div><select name="die" defaultValue={t.die || 'd6'} style={iStyle}>{['d4','d6','d8','d10','d12','d20','d100'].map(d => <option key={d} value={d}>{d}</option>)}</select></label>
                    </div>
                    <label style={{ display: 'block' }}><div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Entries, one per line</div><textarea name="entries" defaultValue={entries.join('\n')} rows={8} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.5 }} /></label>
                  </div>
                </form>
              ) : (
                <>
                  <div className="head">
                    <Icon.Tables />
                    <span className="title">{t.title}</span>
                    <div className="spacer"></div>
                    <span className="pill brass" style={{ fontSize: 12 }}>{t.die || 'd6'}</span>
                    <span className="pill iron" style={{ fontSize: 10 }}>{entries.length}</span>
                  </div>
                  <div className="body">
                    {/* Roll result — the hero of the card */}
                    <div style={{
                      minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '14px 16px', marginBottom: 14,
                      background: t.lastRoll ? 'oklch(0.22 0.025 65 / 0.7)' : 'oklch(0.16 0.012 60 / 0.4)',
                      border: `1px solid ${t.lastRoll ? 'var(--brass-dim)' : 'var(--hairline-2)'}`,
                      borderRadius: 'var(--r)',
                      transition: 'all 0.3s ease',
                      opacity: isRolling ? 0.3 : 1,
                    }}>
                      {t.lastRoll ? (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, color: 'var(--fg)', lineHeight: 1.4 }}>{t.lastRoll.text}</div>
                          <div className="muted" style={{ fontSize: 10.5, marginTop: 4 }}>#{t.lastRoll.index + 1} on {t.die || 'd6'}</div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--fg-3)', fontSize: 13, fontStyle: 'italic' }}>No roll yet</div>
                      )}
                    </div>

                    {/* Big roll button */}
                    <button className="tbtn brass" style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '10px', marginBottom: 10, fontFamily: 'var(--f-display)', letterSpacing: '0.03em' }}
                      onClick={() => roll(t)}>
                      <Icon.Dice /> Roll {t.die || 'd6'}
                    </button>

                    {/* Entry list toggle */}
                    <div>
                      <button className="tbtn" style={{ width: '100%', justifyContent: 'center', fontSize: 11, padding: '5px' }} onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                        {isExpanded ? '▲ Hide entries' : `▼ Show all ${entries.length} entries`}
                      </button>
                      {isExpanded && (
                        <ol style={{ margin: '10px 0 0', paddingLeft: 22, lineHeight: 1.65 }}>
                          {entries.map((entry, i) => (
                            <li key={i} style={{ fontSize: 12.5, color: t.lastRoll?.index === i ? 'var(--brass)' : 'var(--fg-2)', marginBottom: 3, fontWeight: t.lastRoll?.index === i ? 600 : 400 }}>{entry}</li>
                          ))}
                        </ol>
                      )}
                    </div>

                    <div className="row gap-sm" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
                      <button className="tbtn" onClick={() => setEditingId(t.id)}>Edit</button>
                      <button className="tbtn" onClick={() => window.Store.dispatch({ type: 'TABLE_REMOVE', id: t.id })}>Delete</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {!tables.length && <div className="empty"><div className="display">No tables written.</div>Add encounters, treasure quirks, rumors, weather, or complications.</div>}
    </div>
  );
}

function PlayerView({ state }) {
  const publicSecrets = (state.secrets || []).filter(s => s.status === 'revealed');
  const safeHandouts = (state.handouts || []).filter(h => h.public);
  const publicQuests = (state.quests || []).filter(q => q.public && q.state === 'active');
  const publicNpcs = (state.npcs || []).filter(n => n.public);
  const publicLocations = (state.locations || []).filter(l => l.public || l.party);
  return <div className="page fade-up"><div className="page-header"><div><div className="smallcaps" style={{ marginBottom: 6 }}>Table-facing packet</div><h1 className="page-title">Player View</h1><div className="page-sub">Only DM-published records are shown here.</div></div><button className="tbtn brass" onClick={() => window.open('player.html', '_blank', 'noopener')}><Icon.PlayerView /> Open player tab</button></div><div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}><div className="card cornered"><div className="head"><Icon.Quests /><span className="title">Public quests</span></div><div className="body">{publicQuests.map(q => <div key={q.id} className="lrow"><span>{q.title}</span></div>)}{!publicQuests.length && <div className="muted">No quests published.</div>}</div></div><div className="card cornered"><div className="head"><Icon.Characters /><span className="title">Known faces</span></div><div className="body">{publicNpcs.map(n => <div key={n.id} className="lrow"><span>{n.name}</span><span className="muted">{n.title}</span></div>)}{!publicNpcs.length && <div className="muted">No characters published.</div>}</div></div><div className="card cornered"><div className="head"><Icon.Locations /><span className="title">Known places</span></div><div className="body">{publicLocations.map(l => <div key={l.id} className="lrow"><span>{l.label || l.name}</span><span className="muted">{l.party ? 'party here' : l.kind}</span></div>)}{!publicLocations.length && <div className="muted">No locations published.</div>}</div></div><div className="card cornered"><div className="head"><Icon.Secrets /><span className="title">Known reveals</span></div><div className="body">{publicSecrets.map(s => <div key={s.id} className="lrow">{s.title}</div>)}{!publicSecrets.length && <div className="muted">No secrets revealed.</div>}</div></div><div className="card cornered"><div className="head"><Icon.Handouts /><span className="title">Handouts</span></div><div className="body">{safeHandouts.map(h => <div key={h.id} className="lrow">{h.title}</div>)}{!safeHandouts.length && <div className="muted">No handouts published.</div>}</div></div></div></div>;
}

function Exports({ state }) {
  const json = JSON.stringify(state, null, 2);
  return <div className="page fade-up"><div className="page-header"><div><div className="smallcaps" style={{ marginBottom: 6 }}>Local archive</div><h1 className="page-title">Exports</h1><div className="page-sub">Campaign data as JSON for backup.</div></div></div><div className="card cornered"><div className="head"><Icon.Exports /><span className="title">Campaign JSON</span></div><div className="body"><textarea readOnly value={json} style={{ width: '100%', minHeight: 460, boxSizing: 'border-box', background: 'oklch(0.12 0.012 60)', color: 'var(--fg-1)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', padding: 12, fontFamily: 'var(--f-mono)', fontSize: 11 }} /></div></div></div>;
}

function Settings({ state }) {
  const [raw, setRaw] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const campaign = state.campaign || {};
  const location = campaign.location || {};
  const themes = window.WARROOM_THEMES || [];
  const currentTheme = campaign.theme || 'ashen-table';
  const user = window.Auth && window.Auth.session;
  const json = JSON.stringify(state, null, 2);

  const flash = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  const setCampaignField = (field, value) => {
    window.Store.dispatch({ type: 'CAMPAIGN_SET_FIELD', field, value });
    flash();
  };

  const setNumberField = (field, value, fallback) => {
    const parsed = parseInt(value, 10);
    setCampaignField(field, Number.isFinite(parsed) && parsed > 0 ? parsed : fallback);
  };

  const setLocationField = (field, value) => {
    window.Store.dispatch({ type: 'CAMPAIGN_SET_LOCATION', patch: { [field]: value } });
    flash();
  };

  const importState = () => {
    try {
      window.Store.dispatch({ type: 'STORE_IMPORT', state: JSON.parse(raw) });
      setRaw('');
      flash();
    } catch {
      window.alert('Invalid JSON.');
    }
  };

  return (
    <div className="page fade-up settings-page">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Campaign workshop</div>
          <h1 className="page-title">Settings</h1>
          <div className="page-sub">Name the table, set the next gathering, and choose the room's mood.</div>
        </div>
        {saved && <span className="pill brass">saved</span>}
      </div>

      <div className="settings-grid">
        <div className="card cornered settings-panel settings-primary">
          <div className="head"><Icon.WarRoom /><span className="title">Campaign Identity</span></div>
          <div className="body">
            <div className="settings-form-grid two">
              <Field label="Campaign name" value={campaign.name || ''} onChange={v => setCampaignField('name', v)} placeholder="The Ashes of Vaelthorne" />
              <Field label="Subtitle / table promise" value={campaign.subtitle || ''} onChange={v => setCampaignField('subtitle', v)} placeholder="A short sentence with the campaign's flavor" />
            </div>
            <div className="settings-form-grid session">
              <SettingNumber label="Current session" value={campaign.session || 1} onChange={v => setNumberField('session', v, 1)} />
              <SettingNumber label="Planned sessions" value={campaign.sessionsTotal || 20} onChange={v => setNumberField('sessionsTotal', v, 20)} />
              <Field label="Next session" value={campaign.nextSession || ''} onChange={v => setCampaignField('nextSession', v)} placeholder="Sat, 27 Vael - 19:00" />
            </div>
          </div>
        </div>

        <div className="card cornered settings-panel">
          <div className="head"><Icon.Locations /><span className="title">Party Location</span></div>
          <div className="body">
            <div className="settings-form-grid two">
              <Field label="Location name" value={location.name || ''} onChange={v => setLocationField('name', v)} placeholder="Where is the party now?" />
              <Field label="Region" value={location.region || ''} onChange={v => setLocationField('region', v)} placeholder="Province, plane, city ward" />
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="Atmosphere note" value={location.note || ''} onChange={v => setLocationField('note', v)} placeholder="Rain on slate roofs, cedar smoke, distant bells" />
            </div>
          </div>
        </div>

        <div className="card cornered settings-panel settings-wide">
          <div className="head"><Icon.Settings /><span className="title">Campaign Mood</span><div className="spacer"></div><span className="sub">shared with player view</span></div>
          <div className="body">
            <div className="theme-grid">
              {themes.map(theme => (
                <ThemeChoice
                  key={theme.id}
                  theme={theme}
                  selected={theme.id === currentTheme}
                  onSelect={() => setCampaignField('theme', theme.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="card cornered settings-panel">
          <div className="head"><Icon.PlayerView /><span className="title">Account</span></div>
          <div className="body">
            <div className="settings-readout">
              <span>Username</span>
              <b>{user?.username || 'Guest'}</b>
            </div>
            <div className="settings-readout">
              <span>Tier</span>
              <b>{user?.tier || 'local'}</b>
            </div>
            {window.Auth && <button className="tbtn" style={{ marginTop: 12 }} onClick={() => window.Auth.logout()}>Sign out</button>}
          </div>
        </div>

        <div className="card cornered settings-panel">
          <div className="head"><Icon.Exports /><span className="title">Archive</span></div>
          <div className="body">
            <Field label="Paste import JSON" value={raw} onChange={setRaw} multiline />
            <div className="settings-actions">
              <button className="tbtn brass" onClick={importState}>Import</button>
              <button className="tbtn" onClick={() => { if (window.confirm('Reset campaign data?')) window.Store.reset(); }}>Reset campaign</button>
            </div>
            <details className="settings-export-wrap">
              <summary>Show export JSON</summary>
              <textarea readOnly value={json} className="settings-export" />
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingNumber({ label, value, onChange }) {
  return (
    <label className="setting-number">
      <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>{label}</div>
      <input type="number" min="1" value={value} onChange={e => onChange(e.target.value)} />
    </label>
  );
}

function ThemeChoice({ theme, selected, onSelect }) {
  return (
    <button type="button" className={`theme-choice ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="theme-sample">
        <div className="theme-sample-top" style={{ background: theme.art || theme.swatches[0] }}></div>
        <div className="theme-sample-card" style={{ background: theme.swatches[1], borderColor: theme.swatches[2] }}>
          <span style={{ background: theme.swatches[2] }}></span>
          <i style={{ background: theme.swatches[3] }}></i>
        </div>
      </div>
      <div className="theme-copy">
        <span>{theme.name}</span>
        <em>{theme.tagline}</em>
      </div>
      {selected && <strong className="theme-selected-mark">Selected</strong>}
      <div className="theme-swatches">
        {theme.swatches.map((swatch, index) => <i key={index} style={{ background: swatch }}></i>)}
      </div>
    </button>
  );
}

function Stub({ label, onNav }) {
  const labels = {
    sessions: 'Sessions',
    encounters: 'Encounters',
    codex: 'World Codex',
    locations: 'Locations',
    quests: 'Quests',
    calendar: 'Calendar',
    items: 'Items & Relics',
    handouts: 'Handouts',
    tables: 'Random Tables',
    player: 'Player View',
    exports: 'Exports',
    settings: 'Settings',
  };
  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Coming after the next session</div>
          <h1 className="page-title">{labels[label] || label}</h1>
          <div className="page-sub">This room of the war room has not been built yet. Six screens of the prototype are real — the rest awaits a quill.</div>
        </div>
        <button className="tbtn" onClick={() => onNav('warroom')}><Icon.WarRoom /> Back to the War Room</button>
      </div>
      <div className="empty">
        <div className="display">Not yet inscribed.</div>
        Try the War Room, the Map, the Relationships board, the Vault, the Timeline, or a Character.
      </div>
    </div>
  );
}

Object.assign(window, { App });

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
