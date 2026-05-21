// Interactive Map — tactical war table treatment.
// Parchment region with inked hatching, pins for locations, pulsing rune for party.

function MapView({ state, onNav, onOpenNPC }) {
  const locs = state.locations || [];
  const [selected, setSelected] = React.useState(locs.find(l => l.party)?.id || locs[0]?.id);
  const [layers, setLayers] = React.useState({
    political: true,
    secret:    false,
    danger:    true,
    party:     true,
  });
  const [showHidden, setShowHidden] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ label: '', kind: 'town', note: '' });
  const [draftPoint, setDraftPoint] = React.useState(null);

  const sel = locs.find(l => l.id === selected);
  React.useEffect(() => {
    if (!sel && locs[0]) setSelected(locs.find(l => l.party)?.id || locs[0].id);
  }, [locs.length, selected]);
  const addPin = (e) => {
    e.preventDefault();
    if (!form.label.trim() || !draftPoint) return;
    window.Store.dispatch({ type: 'LOCATION_ADD', label: form.label.trim(), x: draftPoint.x, y: draftPoint.y, kind: form.kind });
    setTimeout(() => {
      const created = window.Store.get().locations.at(-1);
      if (created) {
        window.Store.dispatch({ type: 'LOCATION_SET_FIELD', id: created.id, field: 'note', value: form.note.trim() });
        setSelected(created.id);
      }
    }, 0);
    setForm({ label: '', kind: 'town', note: '' });
    setDraftPoint(null);
    setAdding(false);
  };

  const startAdding = () => {
    setAdding(true);
    setDraftPoint(null);
  };

  const cancelAdding = () => {
    setAdding(false);
    setDraftPoint(null);
    setForm({ label: '', kind: 'town', note: '' });
  };

  // visible locations
  const visible = locs.filter(l => !l.hidden || showHidden);

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Cartography</div>
          <h1 className="page-title">The Margreave</h1>
          <div className="page-sub">Tactical map · scale ≈ 40 leagues</div>
        </div>
        <div className="row" style={{ alignItems: 'center' }}>
          <button className={adding ? 'tbtn brass' : 'tbtn'} onClick={adding ? cancelAdding : startAdding}><Icon.Plus /> Add pin</button>
          <button className="tbtn" onClick={() => selected && window.Store.dispatch({ type: 'LOCATION_SET_PARTY', id: selected })}><Icon.PlayerView /> Player layer</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* MAP */}
        <div className="card cornered" style={{ overflow: 'hidden' }}>
          <div className="head">
            <Icon.Maps />
            <span className="title">Region: The Margreave</span>
            <div className="spacer"></div>
            <span className="smallcaps">{visible.length} locations</span>
          </div>
          <div style={{ position: 'relative', aspectRatio: '4/3' }}>
            <MapCanvas locs={visible} selected={selected} onSelect={setSelected} layers={layers}
              adding={adding} draftPoint={draftPoint} onPlaceDraft={setDraftPoint} />
            {adding && (
              <div style={{
                position: 'absolute', top: 14, left: 14,
                padding: '7px 10px',
                background: 'oklch(0.16 0.012 60 / 0.9)',
                border: '1px solid var(--brass-dim)', borderRadius: 4,
                fontSize: 11.5, color: 'var(--brass)',
                fontFamily: 'var(--f-mono)', letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {draftPoint ? 'Pin position selected' : 'Click the map to place the pin'}
              </div>
            )}
            {/* compass */}
            <div style={{
              position: 'absolute', top: 14, right: 14,
              width: 56, height: 56,
              opacity: 0.85,
            }}>
              <Compass />
            </div>
            {/* scale */}
            <div style={{
              position: 'absolute', bottom: 14, left: 14,
              padding: '5px 9px', background: 'oklch(0.16 0.012 60 / 0.85)',
              border: '1px solid var(--brass-dim)', borderRadius: 4,
              fontFamily: 'var(--f-mono)', fontSize: 10.5, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'var(--brass)',
            }}>
              ━━ 5 leagues
            </div>
            {/* legend chip */}
            <div style={{
              position: 'absolute', bottom: 14, right: 14,
              padding: '6px 10px',
              background: 'oklch(0.16 0.012 60 / 0.88)',
              border: '1px solid var(--hairline)', borderRadius: 6,
              fontSize: 11,
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <span><span className="dot" style={{ background: 'var(--brass)', marginRight: 5 }}></span>Settlement</span>
              <span><span className="dot ambig" style={{ marginRight: 5 }}></span>Danger</span>
              <span><span className="dot ally" style={{ marginRight: 5 }}></span>Party</span>
            </div>
          </div>
        </div>

        {/* RIGHT — layer toggles + selected pin details */}
        <div className="col">
          <div className="card">
            <div className="head">
              <Icon.Eye />
              <span className="title">Layers</span>
            </div>
            <div className="body">
              <LayerToggle label="Political borders" value={layers.political} onChange={(v) => setLayers({ ...layers, political: v })} />
              <LayerToggle label="Active dangers"    value={layers.danger}    onChange={(v) => setLayers({ ...layers, danger: v })} />
              <LayerToggle label="Party position"    value={layers.party}     onChange={(v) => setLayers({ ...layers, party: v })} />
              <LayerToggle label="DM-only marks"     value={showHidden}       onChange={setShowHidden} dm />
            </div>
          </div>

          {adding && (
            <form className="card cornered" onSubmit={addPin}>
              <div className="head">
                <Icon.Locations />
                <span className="title">Add pin</span>
                <div className="spacer"></div>
                <span className="smallcaps">{draftPoint ? `coord ${(draftPoint.x * 100).toFixed(0)}, ${(draftPoint.y * 100).toFixed(0)}` : 'choose point'}</span>
              </div>
              <div className="body">
                {!draftPoint && (
                  <div className="quote" style={{ fontSize: 12.5, marginBottom: 10 }}>
                    Click the parchment map first. The pin will be placed exactly where you mark it.
                  </div>
                )}
                <Field label="Location" value={form.label} onChange={(v) => setForm(f => ({ ...f, label: v }))} autoFocus />
                <div style={{ marginTop: 10 }}>
                  <Field label="Kind" value={form.kind} onChange={(v) => setForm(f => ({ ...f, kind: v }))} />
                </div>
                <div style={{ marginTop: 10 }}>
                  <Field label="Note" value={form.note} onChange={(v) => setForm(f => ({ ...f, note: v }))} multiline />
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="tbtn brass" type="submit" disabled={!draftPoint || !form.label.trim()}><Icon.Plus /> Place pin</button>
                  <button className="tbtn" type="button" onClick={cancelAdding}>Cancel</button>
                </div>
              </div>
            </form>
          )}

          {/* Selected pin */}
          <div className="card cornered">
            <div className="head">
              <Icon.Locations />
              <span className="title">Pin</span>
              <div className="spacer"></div>
              {sel && <span className="smallcaps">{sel.kind}</span>}
            </div>
            <div className="body">
              {sel && (
                <>
                  <div className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>{sel.label}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                    {`coord ${(sel.x * 100).toFixed(0)}, ${(sel.y * 100).toFixed(0)} · ${sel.kind}`}
                  </div>
                  <div className="hr"></div>
                  <div style={{ fontSize: 13, lineHeight: 1.55 }}>{sel.note}</div>
                  {sel.party && (
                    <div className="pill brass" style={{ marginTop: 12 }}>
                      <span className="dot ally" style={{ marginRight: 6 }}></span>Party here · Session XIV
                    </div>
                  )}
                  {sel.hidden && (
                    <div className="pill ox" style={{ marginTop: 12 }}>DM only · hidden from player view</div>
                  )}
                  {sel.public && (
                    <div className="pill brass" style={{ marginTop: 12 }}>Player safe · visible in player view</div>
                  )}
                  {!sel.party && (
                    <button className="tbtn" style={{ marginTop: 12 }} onClick={() => window.Store.dispatch({ type: 'LOCATION_SET_PARTY', id: sel.id })}>
                      <Icon.PlayerView /> Move party here
                    </button>
                  )}
                  <button className={sel.public ? 'tbtn brass' : 'tbtn'} style={{ marginTop: 8, marginLeft: sel.party ? 0 : 8 }} onClick={() => window.Store.dispatch({ type: 'LOCATION_SET_FIELD', id: sel.id, field: 'public', value: !sel.public })}>
                    <Icon.PlayerView /> {sel.public ? 'Published' : 'Publish pin'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Pins list */}
          <div className="card">
            <div className="head">
              <Icon.Search />
              <span className="title">All pins</span>
            </div>
            <div className="body" style={{ padding: 0, maxHeight: 220, overflowY: 'auto' }}>
              {visible.map(l => (
                <div key={l.id}
                  className="clickable"
                  onClick={() => setSelected(l.id)}
                  style={{
                    padding: '8px 14px',
                    borderBottom: '1px dashed var(--hairline-2)',
                    background: l.id === selected ? 'oklch(0.26 0.02 70 / 0.6)' : 'transparent',
                    fontSize: 12.5,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                  <PinDot kind={l.kind} party={l.party} hidden={l.hidden} />
                  <span style={{ fontFamily: 'var(--f-display)', fontSize: 13.5, flex: 1 }}>{l.label}</span>
                  <span className="muted" style={{ fontSize: 10.5 }}>{l.kind}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayerToggle({ label, value, onChange, dm }) {
  return (
    <div className="between" style={{ padding: '7px 0', borderBottom: '1px dashed var(--hairline-2)' }}>
      <div>
        <span style={{ fontSize: 13 }}>{label}</span>
        {dm && <span className="pill ox" style={{ marginLeft: 8, padding: '1px 6px', fontSize: 9.5 }}>DM</span>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 36, height: 20, borderRadius: 999,
          border: '1px solid var(--hairline)',
          background: value ? 'linear-gradient(180deg, oklch(0.48 0.08 80), oklch(0.36 0.08 80))' : 'oklch(0 0 0 / 0.4)',
          position: 'relative', cursor: 'pointer', padding: 0,
        }}>
        <span style={{
          position: 'absolute', top: 1, left: value ? 17 : 1,
          width: 16, height: 16, borderRadius: '50%',
          background: 'oklch(0.92 0.02 80)',
          boxShadow: '0 1px 2px oklch(0 0 0 / 0.6)',
          transition: 'left 0.18s',
        }}></span>
      </button>
    </div>
  );
}

// ── Map canvas: parchment with hatching, rivers, pin overlay ──────────────
function MapCanvas({ locs, selected, onSelect, layers, adding, draftPoint, onPlaceDraft }) {
  const onMapClick = (e) => {
    if (!adding) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onPlaceDraft({ x, y });
  };

  return (
    <svg viewBox="0 0 800 600" onClick={onMapClick}
         style={{ display: 'block', width: '100%', height: '100%', cursor: adding ? 'crosshair' : 'default' }}>
      <defs>
        <radialGradient id="m-paper" cx="50%" cy="40%" r="80%">
          <stop offset="0%"  stopColor="oklch(0.84 0.05 82)" />
          <stop offset="60%" stopColor="oklch(0.74 0.05 78)" />
          <stop offset="100%" stopColor="oklch(0.55 0.07 65)" />
        </radialGradient>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="oklch(0.32 0.08 30)" strokeWidth="0.6" opacity="0.18" />
        </pattern>
        <pattern id="hatch-water" patternUnits="userSpaceOnUse" width="8" height="8">
          <path d="M0 4 Q 2 2 4 4 T 8 4" stroke="oklch(0.42 0.07 235 / 0.45)" strokeWidth="0.6" fill="none" />
        </pattern>
        <pattern id="hatch-forest" patternUnits="userSpaceOnUse" width="10" height="10">
          <path d="M2 8 L5 3 L8 8 Z" fill="oklch(0.42 0.07 150 / 0.35)" />
        </pattern>
        <radialGradient id="ring-pulse" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.7 0.16 50 / 0.6)" />
          <stop offset="100%" stopColor="oklch(0.7 0.16 50 / 0)" />
        </radialGradient>
      </defs>

      {/* paper */}
      <rect width="800" height="600" fill="url(#m-paper)" />
      <rect width="800" height="600" fill="url(#hatch)" opacity="0.7" />

      {/* coast — rough ink line */}
      <path d="M 720 40 C 690 120, 760 220, 730 320 C 710 420, 760 500, 700 580"
            stroke="oklch(0.22 0.06 40)" strokeWidth="1.4" fill="none" opacity="0.65" />

      {/* water — east sea */}
      <path d="M 720 40 C 690 120, 760 220, 730 320 C 710 420, 760 500, 700 580 L 800 600 L 800 0 L 740 0 Z"
            fill="url(#hatch-water)" opacity="0.9" />

      {/* great forest (west) */}
      <path d="M 30 220 C 70 200, 120 230, 160 220 C 200 210, 240 240, 230 280 C 240 320, 180 340, 130 320 C 80 330, 40 290, 30 220 Z"
            fill="url(#hatch-forest)" stroke="oklch(0.32 0.06 150 / 0.55)" strokeWidth="0.8" opacity="0.85" />

      {/* mountain ridge (north) */}
      <g opacity="0.55" stroke="oklch(0.22 0.06 40)" fill="none" strokeWidth="0.9">
        {[80, 130, 180, 230, 280, 330, 380, 430, 480].map((x, i) => (
          <path key={i} d={`M ${x} 90 l 14 -16 l 14 16`} />
        ))}
      </g>
      <text x="220" y="60" fontFamily="Cormorant Garamond, serif" fontSize="18" fontStyle="italic"
            fill="oklch(0.22 0.06 40)" opacity="0.55" letterSpacing="3">The Cinder Reaches</text>

      {/* rivers */}
      <path d="M 380 100 Q 400 200, 360 290 T 320 480"
            stroke="oklch(0.42 0.08 235 / 0.65)" strokeWidth="1.6" fill="none" />
      <path d="M 380 100 Q 480 180, 520 280 T 580 470"
            stroke="oklch(0.42 0.08 235 / 0.55)" strokeWidth="1.2" fill="none" />

      {/* political border (dashed) */}
      {layers.political && (
        <path d="M 100 130 C 200 160, 300 110, 420 150 C 540 190, 620 160, 700 200"
              stroke="oklch(0.32 0.14 26 / 0.55)" strokeWidth="1.2" strokeDasharray="5 4" fill="none" />
      )}

      {/* labels — region names */}
      <text x="500" y="200" fontFamily="Cormorant Garamond, serif" fontSize="14" fontStyle="italic"
            fill="oklch(0.22 0.06 40)" opacity="0.6" letterSpacing="2">Vaelthorne · old march</text>
      <text x="100" y="500" fontFamily="Cormorant Garamond, serif" fontSize="14" fontStyle="italic"
            fill="oklch(0.22 0.06 40)" opacity="0.6" letterSpacing="2">The Margreave</text>
      <text x="600" y="540" fontFamily="Cormorant Garamond, serif" fontSize="13" fontStyle="italic"
            fill="oklch(0.22 0.06 40)" opacity="0.55" letterSpacing="2">Salt Sea</text>

      {/* danger zone — blockade */}
      {layers.danger && (
        <g>
          <circle cx={0.86 * 800} cy={0.62 * 600} r="38"
                  fill="oklch(0.5 0.16 26 / 0.18)" stroke="oklch(0.45 0.16 26 / 0.55)"
                  strokeWidth="1" strokeDasharray="3 3" />
        </g>
      )}

      {/* pins */}
      {draftPoint && (
        <g transform={`translate(${draftPoint.x * 800}, ${draftPoint.y * 600})`} style={{ pointerEvents: 'none' }}>
          <circle r="16" fill="oklch(0.7 0.16 50 / 0.18)" stroke="var(--brass)" strokeWidth="1" strokeDasharray="3 3" />
          <PinSVG kind="town" party={false} hidden={false} selected />
          <text x="10" y="4" fontFamily="Cormorant Garamond, serif" fontSize="13"
                fill="oklch(0.22 0.06 40)" fontWeight="600">new pin</text>
        </g>
      )}
      {locs.map(l => (
        <g key={l.id}
           transform={`translate(${l.x * 800}, ${l.y * 600})`}
           onClick={(e) => { e.stopPropagation(); onSelect(l.id); }}
           style={{ cursor: 'pointer' }}>
          {l.party && layers.party && (
            <>
              <circle r="22" fill="url(#ring-pulse)">
                <animate attributeName="r" values="14;28;14" dur="3.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.2;0.9" dur="3.2s" repeatCount="indefinite" />
              </circle>
            </>
          )}
          <PinSVG kind={l.kind} party={l.party} hidden={l.hidden} selected={selected === l.id} />
          <text x="10" y="4" fontFamily="Cormorant Garamond, serif" fontSize="13"
                fill={l.party ? 'oklch(0.32 0.13 26)' : 'oklch(0.22 0.06 40)'}
                fontWeight={selected === l.id ? '600' : '500'}
                style={{ pointerEvents: 'none' }}>
            {l.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PinSVG({ kind, party, hidden, selected }) {
  const fillByKind = {
    capital:  'oklch(0.42 0.13 26)',
    fortress: 'oklch(0.32 0.014 60)',
    town:     'oklch(0.5 0.10 80)',
    abbey:    'oklch(0.5 0.07 235)',
    port:     'oklch(0.42 0.07 150)',
    ruin:     'oklch(0.32 0.06 30)',
    omen:     'oklch(0.58 0.16 50)',
    hidden:   'oklch(0.32 0.16 26)',
    danger:   'oklch(0.42 0.18 26)',
  };
  const f = fillByKind[kind] || 'oklch(0.42 0.07 60)';
  if (party) {
    return (
      <g>
        <circle r="8" fill="oklch(0.92 0.04 80)" stroke="oklch(0.32 0.13 26)" strokeWidth="1.5" />
        <circle r="3" fill="oklch(0.42 0.13 26)" />
        {selected && <circle r="11" fill="none" stroke="oklch(0.7 0.105 82)" strokeWidth="1.4" strokeDasharray="2 2" />}
      </g>
    );
  }
  if (hidden) {
    return (
      <g>
        <polygon points="0,-7 6,0 0,7 -6,0" fill={f} stroke="oklch(0.16 0.04 30)" strokeWidth="1.2" />
        <circle r="2" fill="oklch(0.16 0.04 30)" />
        {selected && <polygon points="0,-10 9,0 0,10 -9,0" fill="none" stroke="oklch(0.7 0.105 82)" strokeWidth="1.2" strokeDasharray="2 2" />}
      </g>
    );
  }
  return (
    <g>
      <circle r="6" fill={f} stroke="oklch(0.16 0.04 30)" strokeWidth="1.2" />
      <circle r="1.6" fill="oklch(0.92 0.04 80)" />
      {selected && <circle r="10" fill="none" stroke="oklch(0.7 0.105 82)" strokeWidth="1.4" strokeDasharray="2 2" />}
    </g>
  );
}

function PinDot({ kind, party, hidden }) {
  if (party) return <span className="dot ally"></span>;
  if (hidden) return <span className="dot ambig"></span>;
  const colorMap = {
    capital: 'oklch(0.55 0.13 26)',
    fortress: 'oklch(0.5 0.012 60)',
    town: 'oklch(0.6 0.10 80)',
    abbey: 'oklch(0.6 0.07 235)',
    port: 'oklch(0.55 0.07 150)',
    ruin: 'oklch(0.42 0.06 30)',
    omen: 'oklch(0.66 0.16 50)',
    danger: 'oklch(0.55 0.18 26)',
  };
  return <span className="dot" style={{ background: colorMap[kind] || 'var(--brass)' }}></span>;
}

function Compass() {
  return (
    <svg viewBox="0 0 56 56" style={{ width: '100%', height: '100%' }}>
      <circle cx="28" cy="28" r="24" fill="oklch(0.16 0.012 60 / 0.85)" stroke="var(--brass-2)" strokeWidth="1" />
      <circle cx="28" cy="28" r="20" fill="none" stroke="var(--brass-dim)" strokeWidth="0.5" />
      <polygon points="28,6 32,28 28,28" fill="oklch(0.55 0.13 26)" stroke="var(--brass)" strokeWidth="0.5" />
      <polygon points="28,50 24,28 28,28" fill="oklch(0.42 0.07 80)" stroke="var(--brass)" strokeWidth="0.5" />
      <polygon points="28,28 50,28 28,32" fill="oklch(0.42 0.07 80)" stroke="var(--brass)" strokeWidth="0.5" />
      <polygon points="28,28 6,28 28,24" fill="oklch(0.42 0.07 80)" stroke="var(--brass)" strokeWidth="0.5" />
      <circle cx="28" cy="28" r="2" fill="var(--brass)" />
      <text x="28" y="14" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="8" fill="var(--brass)">N</text>
    </svg>
  );
}

Object.assign(window, { MapView });
