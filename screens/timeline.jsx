// Timeline — vertical engraved ribbon. Three eras: Before / Reign / Embers / Now / Soon.
// Each event marker is a Roman-numeral medallion. Flagged events get a wax-dot. Upcoming events shimmer faintly.

function Timeline({ state, onNav }) {
  const events = state.timeline || [];
  const eras = ['Before', 'Reign', 'Embers', 'Now', 'Soon'];
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', note: '', era: 'Now', marker: 'NEW' });
  const addEvent = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    window.Store.dispatch({ type: 'TIMELINE_ADD', title: form.title.trim(), note: form.note.trim(), era: form.era || 'Now', marker: form.marker || 'NEW', flagged: true });
    setForm({ title: '', note: '', era: 'Now', marker: 'NEW' });
    setAdding(false);
  };

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Chronicle</div>
          <h1 className="page-title">Timeline of Vaelthorne</h1>
          <div className="page-sub">The reign, the ember, the years not yet written.</div>
        </div>
        <div className="row" style={{ alignItems: 'center' }}>
          <button className="tbtn" onClick={() => setAdding(v => !v)}><Icon.Plus /> Mark an event</button>
          <button className="tbtn"><Icon.PlayerView /> Player view</button>
        </div>
      </div>

      {adding && (
        <form className="card cornered" onSubmit={addEvent} style={{ marginBottom: 14 }}>
          <div className="head">
            <Icon.Timeline />
            <span className="title">Mark the chronicle</span>
          </div>
          <div className="body">
            <div className="grid" style={{ gridTemplateColumns: '1fr 140px 140px', gap: 10 }}>
              <Field label="Title" value={form.title} onChange={(v) => setForm(f => ({ ...f, title: v }))} autoFocus />
              <Field label="Era" value={form.era} onChange={(v) => setForm(f => ({ ...f, era: v }))} />
              <Field label="Marker" value={form.marker} onChange={(v) => setForm(f => ({ ...f, marker: v }))} />
            </div>
            <div style={{ marginTop: 10 }}>
              <Field label="Note" value={form.note} onChange={(v) => setForm(f => ({ ...f, note: v }))} multiline />
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="tbtn brass" type="submit"><Icon.Plus /> Add event</button>
              <button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Spine */}
        <div className="card cornered">
          <div className="head">
            <Icon.Timeline />
            <span className="title">The Spine</span>
            <div className="spacer"></div>
            <span className="smallcaps">{events.length} entries</span>
          </div>
          <div className="body" style={{ padding: '24px 32px 32px' }}>
            <div style={{ position: 'relative', paddingLeft: 60 }}>
              {/* the engraved vertical line */}
              <div style={{
                position: 'absolute', left: 28, top: 8, bottom: 8,
                width: 3,
                background:
                  'linear-gradient(180deg, transparent 0%, var(--brass-dim) 6%, var(--brass-2) 18%, var(--brass-dim) 50%, var(--brass-2) 82%, var(--brass-dim) 94%, transparent 100%)',
                opacity: 0.45,
                borderRadius: 2,
                boxShadow: '0 0 4px oklch(0 0 0 / 0.5)',
              }}></div>

              {eras.map((era, ei) => {
                const inEra = events.filter(e => e.era === era);
                if (!inEra.length) return null;
                return (
                  <div key={era} style={{ marginBottom: 28 }}>
                    {/* era band */}
                    <div style={{
                      marginLeft: -32,
                      padding: '4px 12px',
                      display: 'inline-block',
                      background: era === 'Now' ? 'oklch(0.4 0.13 26 / 0.18)'
                                : era === 'Soon' ? 'oklch(0.4 0.12 50 / 0.15)'
                                : 'oklch(0 0 0 / 0.35)',
                      border: '1px solid var(--hairline-2)',
                      borderRadius: 'var(--r-sm)',
                      fontFamily: 'var(--f-display)',
                      fontSize: 13,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: era === 'Now' ? 'oklch(0.78 0.13 26)'
                           : era === 'Soon' ? 'var(--ember)'
                           : 'var(--brass)',
                      marginBottom: 12,
                    }}>{era}</div>

                    {inEra.map((e, i) => (
                      <TimelineRow key={`${era}-${i}`} event={e} onNav={onNav} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side rail */}
        <div className="col">
          <div className="card cornered">
            <div className="head">
              <Icon.Eye />
              <span className="title">Filter</span>
            </div>
            <div className="body">
              <div className="row wrap gap-sm">
                <span className="pill brass">Party events</span>
                <span className="pill ember">Upcoming</span>
                <span className="pill ox">Flagged</span>
                <span className="pill iron">Faction marks</span>
              </div>
            </div>
          </div>

          <div className="card cornered">
            <div className="head">
              <Icon.Sessions />
              <span className="title">Sessions on the spine</span>
            </div>
            <div className="body">
              {events.filter(e => e.party).map(e => (
                <div key={e.marker} className="lrow" style={{ padding: '8px 0' }}>
                  <Medallion roman={e.marker} small />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 13.5 }}>{e.title}</div>
                    <div className="muted" style={{ fontSize: 11, fontStyle: 'italic' }}>{e.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ledger">
            <div className="head"><Icon.Quill /> <span>What the chronicle omits</span></div>
            <div className="body" style={{ padding: '14px 18px', fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink)' }}>
              The Hollow Child's birth is not in any public copy of the chronicle.
              Only this one. Only because you wrote it here.
              <div className="muted" style={{ marginTop: 8, fontStyle: 'italic', fontSize: 11, color: 'var(--ink-dim)' }}>
                — DM-only annotation, Session IX
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ event: e, onNav }) {
  const flagColor = e.upcoming ? 'oklch(0.66 0.16 50)'
                  : e.flagged ? 'oklch(0.55 0.18 26)'
                  : 'var(--brass-dim)';
  return (
    <div style={{
      position: 'relative',
      padding: '10px 0 10px 0',
      marginLeft: -8,
    }}>
      {/* medallion at -38 left from inner content */}
      <div style={{ position: 'absolute', left: -52, top: 8 }}>
        <Medallion roman={e.marker} flagged={e.flagged} upcoming={e.upcoming} party={e.party} />
      </div>

      <div style={{
        padding: '10px 14px',
        borderRadius: 'var(--r)',
        border: '1px solid var(--hairline-2)',
        background: e.upcoming
          ? 'linear-gradient(180deg, oklch(0.26 0.04 50 / 0.35), oklch(0.18 0.03 50 / 0.3))'
          : 'linear-gradient(180deg, oklch(0.245 0.014 64), oklch(0.21 0.014 62))',
        position: 'relative',
      }}>
        <div className="between">
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, color: 'var(--fg)' }}>
            {e.title}
          </div>
          {e.party && <span className="pill brass" style={{ padding: '1px 7px', fontSize: 10 }}>session</span>}
          {e.upcoming && !e.party && <span className="pill ember" style={{ padding: '1px 7px', fontSize: 10 }}>upcoming</span>}
          {e.flagged && !e.party && !e.upcoming && <span className="pill ox" style={{ padding: '1px 7px', fontSize: 10 }}>flagged</span>}
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 4, fontStyle: 'italic', lineHeight: 1.5 }}>
          {e.note}
        </div>
      </div>
    </div>
  );
}

function Medallion({ roman, flagged, upcoming, party, small }) {
  const size = small ? 30 : 40;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: party ? 'radial-gradient(circle at 30% 30%, oklch(0.55 0.13 26), oklch(0.28 0.12 26))'
                : upcoming ? 'radial-gradient(circle at 30% 30%, oklch(0.42 0.12 50), oklch(0.22 0.10 50))'
                : flagged ? 'radial-gradient(circle at 30% 30%, oklch(0.45 0.16 26), oklch(0.25 0.14 26))'
                : 'radial-gradient(circle at 30% 30%, oklch(0.42 0.06 80), oklch(0.22 0.04 75))',
      border: '1px solid var(--brass-dim)',
      boxShadow: 'inset 0 1px 0 oklch(0.6 0.08 80 / 0.4), 0 1px 4px oklch(0 0 0 / 0.5)',
      display: 'grid', placeItems: 'center',
      fontFamily: 'var(--f-display)',
      fontSize: small ? 12 : 14,
      color: 'oklch(0.92 0.04 80)',
      fontStyle: 'italic',
      letterSpacing: 1,
    }}>
      {roman}
    </div>
  );
}

Object.assign(window, { Timeline });
