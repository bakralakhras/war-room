function usePlayerStore() {
  const [state, setState] = React.useState(() => window.Store.get());
  React.useEffect(() => window.Store.subscribe(setState), []);
  return state;
}

function PlayerApp() {
  const state = usePlayerStore();
  const campaign = state.campaign || {};
  React.useEffect(() => {
    if (window.applyWarroomTheme) window.applyWarroomTheme(campaign.theme || 'ashen-table');
  }, [campaign.theme]);
  const publicSecrets = (state.secrets || []).filter(s => s.status === 'revealed');
  const publicQuests = (state.quests || []).filter(q => q.public && q.state === 'active');
  const publicNpcs = (state.npcs || []).filter(n => n.public);
  const publicLocations = (state.locations || []).filter(l => l.public || l.party);
  const safeHandouts = (state.handouts || []).filter(h => h.public);

  return (
    <div className="app" style={{ gridTemplateColumns: '1fr' }}>
      <main className="main">
        <div className="topbar grain">
          <div className="crumb">
            <Icon.PlayerView />
            <span>{campaign.name || 'War Room'}</span>
            <span className="sep">·</span>
            <span style={{ color: 'var(--fg)', fontWeight: 600 }}>Player View</span>
          </div>
          <div className="top-spacer"></div>
          <span className="pill brass">live table packet</span>
        </div>

        <div className="page fade-up">
          <div className="page-header">
            <div>
              <div className="smallcaps" style={{ marginBottom: 6 }}>Published by the DM</div>
              <h1 className="page-title">{campaign.name || 'Player View'}</h1>
              <div className="page-sub">{campaign.subtitle || 'Only player-safe records appear here.'}</div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            <PlayerPanel icon={Icon.Quests} title="Quests" empty="No quests published.">
              {publicQuests.map(q => <div key={q.id} className="lrow"><span>{q.title}</span><span className="muted">{q.note || ''}</span></div>)}
            </PlayerPanel>

            <PlayerPanel icon={Icon.Characters} title="Known Faces" empty="No characters published.">
              {publicNpcs.map(n => (
                <div key={n.id} className="lrow">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--brass-dim)', overflow: 'hidden', background: 'oklch(0.18 0.012 60 / 0.8)', display: 'grid', placeItems: 'center', flex: '0 0 auto', color: 'var(--brass)', fontFamily: 'var(--f-display)' }}>
                      {n.image ? <img src={n.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : (n.name || '?')[0]}
                    </span>
                    <span>{n.name}</span>
                  </span>
                  <span className="muted">{n.title || n.location || ''}</span>
                </div>
              ))}
            </PlayerPanel>

            <PlayerPanel icon={Icon.Locations} title="Known Places" empty="No locations published.">
              {publicLocations.map(l => <div key={l.id} className="lrow"><span>{l.label || l.name}</span><span className="muted">{l.party ? 'party here' : (l.kind || '')}</span></div>)}
            </PlayerPanel>

            <PlayerPanel icon={Icon.Secrets} title="Reveals" empty="No secrets revealed.">
              {publicSecrets.map(s => <div key={s.id} className="lrow">{s.title}</div>)}
            </PlayerPanel>

            <PlayerPanel icon={Icon.Handouts} title="Handouts" empty="No handouts published.">
              {safeHandouts.map(h => (
                <div key={h.id} className="card cornered" style={{ marginBottom: 10 }}>
                  <div className="body" style={{ padding: 12, display: 'flex', gap: 12 }}>
                    <div style={{ width: 84, height: 84, border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', overflow: 'hidden', background: 'oklch(0.16 0.012 60 / 0.55)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                      {h.image ? <img src={h.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon.Handouts />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="row gap-sm" style={{ marginBottom: 6 }}><span className="pill brass">{h.kind || 'note'}</span></div>
                      <div style={{ fontFamily: 'var(--f-display)', fontSize: 18 }}>{h.title}</div>
                      <div className="quote" style={{ marginTop: 6, fontSize: 12.5 }}>{h.body}</div>
                    </div>
                  </div>
                </div>
              ))}
            </PlayerPanel>
          </div>
        </div>
      </main>
      <div className="candle-vignette" data-noncommentable=""></div>
    </div>
  );
}

function PlayerPanel({ icon: I, title, empty, children }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <div className="card cornered">
      <div className="head"><I /><span className="title">{title}</span></div>
      <div className="body">{items.length ? items : <div className="muted">{empty}</div>}</div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PlayerApp />);
