// War Room — Demo App Shell
// Renders a live dashboard powered by data.js (window.CAMPAIGN et al.)

const { useState } = React;

// ── Tiny icon set (demo-only, not exported) ────────────────────
const D = {
  sessions: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3" width="12" height="10" rx="1.5"/>
      <path d="M5 3V1.5M11 3V1.5M2 7h12"/>
    </svg>
  ),
  codex: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 2.5h7.5L13 5.5V14H3V2.5Z"/>
      <path d="M10.5 2.5v3H13M6 7h4M6 10h4"/>
    </svg>
  ),
  factions: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="6" r="2.5"/>
      <path d="M3 13.5c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
      <circle cx="13" cy="5" r="1.5"/>
      <path d="M13 8.5c1.1 0 2 .9 2 2"/>
    </svg>
  ),
  characters: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="5.5" r="2.5"/>
      <path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5"/>
    </svg>
  ),
  map: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1.5 3.5L5 2l6 3 3.5-1.5v10L11 15 5 12 1.5 13.5V3.5Z"/>
      <path d="M5 2v10M11 5v10"/>
    </svg>
  ),
  secrets: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="7" width="10" height="7.5" rx="1.5"/>
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2"/>
      <circle cx="8" cy="10.5" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  ),
  rumor: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 2.5h12v8H9l-3 3v-3H2V2.5Z"/>
    </svg>
  ),
  prep: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2.5 13.5l2-6 8-6-1 8-9 4Z"/>
      <circle cx="8" cy="8" r="1.5"/>
    </svg>
  ),
  timeline: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 8h12M5 4.5L2 8l3 3.5M11 4.5L14 8l-3 3.5"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="2.5"/>
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/>
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6c0-2.49-2.01-4.5-4.5-4.5Z"/>
      <circle cx="8" cy="6" r="1.5"/>
    </svg>
  ),
  warroom: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2L3 8v8l9 6 9-6V8L12 2Z"/>
      <path d="M12 2v14M3 8l9 6 9-6"/>
    </svg>
  ),
};

// ── HP helpers ─────────────────────────────────────────────────
function parseHP(hp) {
  const [cur, max] = hp.split('/').map(Number);
  return { cur, max, pct: Math.round((cur / max) * 100) };
}

function initials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('');
}

// ── Sidebar ────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Campaign', icon: D.warroom },
  { id: 'sessions',  label: 'Sessions',   icon: D.sessions,   badge: 14 },
  { id: 'codex',     label: 'Codex',      icon: D.codex },
  { id: 'characters',label: 'Characters', icon: D.characters, badge: 4  },
  { id: 'factions',  label: 'Factions',   icon: D.factions,   badge: 5  },
  { id: 'map',       label: 'Maps',       icon: D.map },
  { id: 'secrets',   label: 'Vault',      icon: D.secrets,    badge: 6  },
  { id: 'rumors',    label: 'Rumors',     icon: D.rumor,      badge: 6  },
  { id: 'prep',      label: 'Prep',       icon: D.prep },
  { id: 'timeline',  label: 'Timeline',   icon: D.timeline },
];

function Sidebar({ active, onNav }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-label">Navigation</div>
        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`sidebar-item${active === item.id ? ' active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className="sidebar-icn">{item.icon}</span>
            {item.label}
            {item.badge && <span className="sidebar-badge">{item.badge}</span>}
          </div>
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-section-label">Account</div>
        <div className="sidebar-item" onClick={() => onNav('settings')}>
          <span className="sidebar-icn">{D.settings}</span>
          Settings
        </div>
      </div>

      <div className="sidebar-footer">
        <div style={{ fontSize: 10, color: 'var(--demo-muted)', letterSpacing: '0.06em' }}>
          War Room · Squire plan
        </div>
        <div style={{ fontSize: 11, color: 'var(--demo-muted)', marginTop: 3 }}>
          Embers of Vaelthorne
        </div>
      </div>
    </aside>
  );
}

// ── Topbar ─────────────────────────────────────────────────────
function Topbar({ campaign }) {
  return (
    <header className="app-topbar">
      <div className="app-brand">
        <span className="app-brand-mark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 2L3 8v8l9 6 9-6V8L12 2Z"/>
            <path d="M12 2v14M3 8l9 6 9-6"/>
          </svg>
        </span>
        <span className="app-brand-name">War Room</span>
      </div>

      <div className="app-campaign-pill">
        <span className="dot" />
        <span className="app-campaign-name">{campaign.name}</span>
        <span className="app-session-badge">· Session {campaign.session}</span>
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <button className="topbar-btn">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="4"/><path d="M10.5 10.5l3 3"/>
          </svg>
          Search
        </button>
        <button className="topbar-btn">Share</button>
        <button className="topbar-btn primary">+ New Session</button>
        <div className="topbar-avatar">DM</div>
      </div>
    </header>
  );
}

// ── Avatar colors by index ─────────────────────────────────────
const AV_CLASSES = ['av-purple', 'av-slate', 'av-red', 'av-green'];

// ── Party panel ────────────────────────────────────────────────
function PartyPanel({ party }) {
  return (
    <div className="panel-card">
      <div className="panel-head">
        <span className="sidebar-icn" style={{ width: 14, height: 14, color: 'var(--demo-muted)' }}>
          {D.characters}
        </span>
        <span className="panel-title">Party</span>
        <span className="panel-action">Manage</span>
      </div>
      <div className="panel-body">
        {party.map((pc, i) => {
          const { cur, max, pct } = parseHP(pc.hp);
          const low = pct < 50;
          return (
            <div className="party-row" key={pc.name}>
              <div className={`party-avatar ${AV_CLASSES[i % AV_CLASSES.length]}`}>
                {initials(pc.name)}
              </div>
              <div className="party-info">
                <div className="party-name">{pc.name}</div>
                <div className="party-role">{pc.role}</div>
              </div>
              <div className="hp-bar">
                <div className={`hp-bar-fill${low ? ' low' : ''}`} style={{ width: pct + '%' }} />
              </div>
              <div className={`party-hp${low ? ' party-hp-low' : ' party-hp-ok'}`}>
                {cur}/{max}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Location panel ─────────────────────────────────────────────
function LocationPanel({ location }) {
  return (
    <div className="panel-card">
      <div className="panel-head">
        <span className="sidebar-icn" style={{ width: 14, height: 14, color: 'var(--demo-muted)' }}>
          {D.pin}
        </span>
        <span className="panel-title">Current Location</span>
      </div>
      <div className="location-card">
        <div className="location-pin">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6c0-2.49-2.01-4.5-4.5-4.5Z"/>
            <circle cx="8" cy="6" r="1.5"/>
          </svg>
        </div>
        <div>
          <div className="location-name">{location.name}</div>
          <div className="location-region">{location.region}</div>
          <div className="location-note">{location.note}</div>
        </div>
      </div>
    </div>
  );
}

// ── Last session panel ─────────────────────────────────────────
function LastSessionPanel({ lastSession }) {
  return (
    <div className="panel-card">
      <div className="panel-head">
        <span className="sidebar-icn" style={{ width: 14, height: 14, color: 'var(--demo-muted)' }}>
          {D.sessions}
        </span>
        <span className="panel-title">{lastSession.title}</span>
        <span className="panel-action">Full notes →</span>
      </div>
      <div className="panel-body">
        <ul className="brief-bullets">
          {lastSession.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Prep panel ─────────────────────────────────────────────────
function PrepPanel({ prep }) {
  return (
    <div className="panel-card">
      <div className="panel-head">
        <span className="sidebar-icn" style={{ width: 14, height: 14, color: 'var(--demo-muted)' }}>
          {D.prep}
        </span>
        <span className="panel-title">Next Session Prep</span>
        <span className="panel-action">Edit</span>
      </div>
      <div className="panel-body">
        {prep.map((item, i) => (
          <div className="prep-item" key={i}>
            <span className={`prep-kind ${item.kind}`}>{item.kind}</span>
            <div>
              <div className="prep-title">{item.title}</div>
              <div className="prep-note">{item.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Faction clocks panel ───────────────────────────────────────
function FactionsPanel({ factions }) {
  return (
    <div className="panel-card">
      <div className="panel-head">
        <span className="sidebar-icn" style={{ width: 14, height: 14, color: 'var(--demo-muted)' }}>
          {D.factions}
        </span>
        <span className="panel-title">Faction Clocks</span>
        <span className="panel-action">All factions →</span>
      </div>
      <div className="panel-body">
        <div className="faction-list">
          {factions.map(f => (
            <div className="faction-row" key={f.id}>
              <div className="faction-clock-wrap">
                <FactionClock
                  segments={f.clock.segments}
                  filled={f.clock.filled}
                  size={36}
                  color={f.color}
                  label=""
                />
              </div>
              <div className="faction-info">
                <div className="faction-name">{f.name}</div>
                <div className="faction-clock-label">{f.clock.label}</div>
              </div>
              <DispPill d={f.disposition} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Rumors panel ───────────────────────────────────────────────
function RumorsPanel({ rumors }) {
  return (
    <div className="panel-card">
      <div className="panel-head">
        <span className="sidebar-icn" style={{ width: 14, height: 14, color: 'var(--demo-muted)' }}>
          {D.rumor}
        </span>
        <span className="panel-title">Current Rumors</span>
      </div>
      <div className="panel-body">
        {rumors.slice(0, 4).map(r => (
          <div className="rumor-item" key={r.id}>
            <div className="rumor-text">
              "{r.text}"
            </div>
            <div className="rumor-source">
              — {r.source}
              <span className={`rumor-weight ${r.weight}`}>{r.weight}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Secrets panel ──────────────────────────────────────────────
function SecretsPanel({ secrets }) {
  return (
    <div className="panel-card">
      <div className="panel-head">
        <span className="sidebar-icn" style={{ width: 14, height: 14, color: 'var(--demo-muted)' }}>
          {D.secrets}
        </span>
        <span className="panel-title">The Vault</span>
        <span className="panel-action">Open vault →</span>
      </div>
      <div className="panel-body">
        {secrets.map(s => (
          <div className="secret-item" key={s.id}>
            <span className={`secret-status ${s.status}`}>{s.status}</span>
            <span className={`secret-title${s.status === 'sealed' ? ' sealed-text' : ''}`}>
              {s.status === 'sealed'
                ? '████████████████████████'
                : s.title}
            </span>
            <span className="secret-weight">{s.weight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pulse strip ────────────────────────────────────────────────
function PulseStrip({ session, total }) {
  return (
    <div className="demo-pulse-strip">
      <span className="demo-pulse-strip-label">Progress</span>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`demo-pulse-tick${i < session ? ' active' : ''}`} />
      ))}
      <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--demo-muted)' }}>
        {session} / {total}
      </span>
    </div>
  );
}

// ── Dashboard (overview) page ──────────────────────────────────
function DashboardPage() {
  const c = window.CAMPAIGN;
  const factions = window.FACTIONS;
  const secrets = window.SECRETS;
  const rumors = window.RUMORS;

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Campaign Overview</div>
          <div className="page-title">{c.name}</div>
          <div className="page-sub">{c.subtitle}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
            background: 'oklch(0.18 0.020 75)',
            border: '1px solid oklch(0.35 0.060 75)',
            borderRadius: 5,
            fontSize: 12,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber, oklch(0.76 0.130 75))', display: 'inline-block' }} />
            <span style={{ color: 'oklch(0.78 0.080 75)', fontWeight: 600 }}>
              Next: {c.nextSession}
            </span>
          </div>
        </div>
      </div>

      <PulseStrip session={c.session} total={c.sessionsTotal} />

      <div style={{ height: 20 }} />

      <div className="dash-grid">
        <div className="dash-stat">
          <div className="dash-stat-label">Session</div>
          <div className="dash-stat-value">{c.session}</div>
          <div className="dash-stat-sub">of {c.sessionsTotal} planned</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Active Factions</div>
          <div className="dash-stat-value">{factions.length}</div>
          <div className="dash-stat-sub">1 hostile · 1 ally · 3 other</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Sealed Secrets</div>
          <div className="dash-stat-value">{secrets.filter(s => s.status === 'sealed').length}</div>
          <div className="dash-stat-sub">of {secrets.length} total in the vault</div>
        </div>
      </div>

      <div className="dash-cols">
        <div>
          <LastSessionPanel lastSession={c.lastSession} />
          <PrepPanel prep={c.prep} />
          <RumorsPanel rumors={rumors} />
        </div>
        <div>
          <LocationPanel location={c.location} />
          <PartyPanel party={c.party} />
          <FactionsPanel factions={factions} />
          <SecretsPanel secrets={secrets} />
        </div>
      </div>
    </div>
  );
}

// ── Placeholder for unbuilt sections ──────────────────────────
function PlaceholderPage({ title, icon }) {
  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-title">{title}</div>
        </div>
      </div>
      <div className="panel-card">
        <div className="empty-coming">
          <span className="empty-icon" style={{ width: 40, height: 40, color: 'var(--demo-muted)' }}>
            {icon}
          </span>
          <h3>Under Parchment</h3>
          <p>This section of the War Room is being prepared. Return to the Campaign overview to see what is ready.</p>
          <div style={{
            marginTop: 8,
            fontSize: 11,
            fontFamily: 'var(--f-mono)',
            color: 'var(--demo-muted)',
            padding: '4px 10px',
            background: 'oklch(0.18 0.010 260)',
            borderRadius: 4,
          }}>
            demo · work in progress
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root app ───────────────────────────────────────────────────
function DemoApp() {
  const [page, setPage] = useState('dashboard');
  const c = window.CAMPAIGN;

  const content = (() => {
    switch (page) {
      case 'dashboard':   return <DashboardPage />;
      case 'sessions':    return <PlaceholderPage title="Sessions" icon={D.sessions} />;
      case 'codex':       return <PlaceholderPage title="Codex" icon={D.codex} />;
      case 'characters':  return <PlaceholderPage title="Characters" icon={D.characters} />;
      case 'factions':    return <PlaceholderPage title="Factions" icon={D.factions} />;
      case 'map':         return <PlaceholderPage title="Maps" icon={D.map} />;
      case 'secrets':     return <PlaceholderPage title="The Vault" icon={D.secrets} />;
      case 'rumors':      return <PlaceholderPage title="Rumors" icon={D.rumor} />;
      case 'prep':        return <PlaceholderPage title="Session Prep" icon={D.prep} />;
      case 'timeline':    return <PlaceholderPage title="Timeline" icon={D.timeline} />;
      case 'settings':    return <PlaceholderPage title="Settings" icon={D.settings} />;
      default:            return <DashboardPage />;
    }
  })();

  return (
    <div className="app-shell">
      <Topbar campaign={c} />
      <Sidebar active={page} onNav={setPage} />
      <main className="app-main">
        {content}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<DemoApp />);
