// War Room — App Shell (Phase 1: store-backed, persistent)

const { useState, useEffect, useRef } = React;

// ── useStore hook ──────────────────────────────────────────────
function useStore() {
  const [s, setS] = useState(window.Store.get());
  useEffect(() => window.Store.subscribe(setS), []);
  return s;
}

// ── Tiny icon set ──────────────────────────────────────────────
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
  trash: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2.5 4.5h11M6 4.5V3h4v1.5M4 4.5l.75 9h6.5l.75-9"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 2.5v11M2.5 8h11"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2.5 8.5l4 4 7-8"/>
    </svg>
  ),
};

// ── Helpers ────────────────────────────────────────────────────
function parseHP(hp) {
  const [cur, max] = hp.split('/').map(Number);
  return { cur, max, pct: Math.round((cur / max) * 100) };
}

function initials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('');
}

const AV_CLASSES = ['av-purple', 'av-slate', 'av-red', 'av-green'];

// ── Sidebar ────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Campaign',   icon: D.warroom },
  { id: 'sessions',   label: 'Sessions',   icon: D.sessions },
  { id: 'factions',   label: 'Factions',   icon: D.factions },
  { id: 'characters', label: 'Characters', icon: D.characters },
  { id: 'party',      label: 'Party',      icon: D.characters },
  { id: 'secrets',    label: 'Vault',      icon: D.secrets },
  { id: 'rumors',     label: 'Rumors',     icon: D.rumor },
  { id: 'prep',       label: 'Prep',       icon: D.prep },
  { id: 'map',        label: 'Maps',       icon: D.map },
  { id: 'codex',      label: 'Codex',      icon: D.codex },
  { id: 'timeline',   label: 'Timeline',   icon: D.timeline },
  { id: 'settings',   label: 'Settings',   icon: D.settings },
];

function Sidebar({ active, onNav, state }) {
  const sealed = state.secrets.filter(s => s.status === 'sealed').length;
  return (
    <aside className="app-sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-label">Navigation</div>
        {NAV_ITEMS.map(item => {
          const badge = item.id === 'sessions'  ? state.sessions.length
                      : item.id === 'factions'  ? state.factions.length
                      : item.id === 'characters'? state.npcs.length
                      : item.id === 'party'     ? state.party.length
                      : item.id === 'secrets'   ? sealed
                      : item.id === 'rumors'    ? state.rumors.length
                      : item.id === 'prep'      ? state.prep.length
                      : null;
          return (
            <div
              key={item.id}
              className={`sidebar-item${active === item.id ? ' active' : ''}`}
              onClick={() => onNav(item.id)}
            >
              <span className="sidebar-icn">{item.icon}</span>
              {item.label}
              {badge > 0 && <span className="sidebar-badge">{badge}</span>}
            </div>
          );
        })}
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
          {state.campaign.name}
        </div>
      </div>
    </aside>
  );
}

// ── Onboarding overlay (first login — set campaign name) ───────
function OnboardingOverlay() {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [total, setTotal] = useState('20');
  const [busy, setBusy] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    window.Store.dispatch({
      type: 'CAMPAIGN_INIT',
      name: name.trim(),
      subtitle: subtitle.trim(),
      sessionsTotal: parseInt(total, 10) || 20,
    });
  }

  return (
    <div className="onboard-overlay">
      <div className="onboard-card">
        <div>
          <div className="onboard-title">Name your campaign.</div>
          <div className="onboard-sub">You can change this at any time from settings.</div>
        </div>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={submit}>
          <div className="field">
            <label>Campaign name</label>
            <input
              type="text"
              placeholder="e.g. Embers of Vaelthorne"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Subtitle <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input
              type="text"
              placeholder="A short tagline"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Planned sessions</label>
            <input
              type="number"
              min="1" max="200"
              value={total}
              onChange={e => setTotal(e.target.value)}
              style={{ width: 100 }}
            />
          </div>
          <button
            className="auth-submit"
            type="submit"
            disabled={!name.trim() || busy}
            style={{ marginTop: 4 }}
          >
            {busy ? 'Setting up…' : 'Open the War Room →'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Topbar ─────────────────────────────────────────────────────
function Topbar({ state, onNav, onNewSession }) {
  const user = window.Auth.session;
  const initials = user
    ? user.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'DM';

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
        <span className="app-campaign-name">{state.campaign.name}</span>
        <span className="app-session-badge">· Session {state.campaign.session}</span>
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <button className="topbar-btn">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="4"/><path d="M10.5 10.5l3 3"/>
          </svg>
          Search
        </button>
        <button className="topbar-btn primary" onClick={onNewSession}>
          + New Session
        </button>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="topbar-avatar" title={user.displayName}>{initials}</div>
            {user.tier === 'premium' && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.10em',
                textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3,
                background: 'oklch(0.22 0.040 80)', color: 'oklch(0.72 0.090 80)',
                border: '1px solid oklch(0.35 0.060 80)',
              }}>Premium</span>
            )}
            <button
              className="topbar-btn"
              style={{ fontSize: 11 }}
              onClick={() => window.Auth.logout()}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
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

// ── Panel card shell ───────────────────────────────────────────
function Panel({ icon, title, action, onAction, children }) {
  return (
    <div className="panel-card">
      <div className="panel-head">
        <span className="sidebar-icn" style={{ width: 14, height: 14, color: 'var(--demo-muted)' }}>
          {icon}
        </span>
        <span className="panel-title">{title}</span>
        {action && <span className="panel-action" onClick={onAction}>{action}</span>}
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}

// ── Party panel ────────────────────────────────────────────────
function PartyPanel({ party }) {
  return (
    <Panel icon={D.characters} title="Party">
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
    </Panel>
  );
}

// ── Location panel ─────────────────────────────────────────────
function LocationPanel({ location }) {
  return (
    <Panel icon={D.pin} title="Current Location">
      <div className="location-card" style={{ padding: 0 }}>
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
    </Panel>
  );
}

// ── Last session panel ─────────────────────────────────────────
function LastSessionPanel({ sessions, onNav }) {
  const last = sessions[0];
  if (!last) return null;
  return (
    <Panel icon={D.sessions} title={last.title} action="All sessions →" onAction={() => onNav('sessions')}>
      <ul className="brief-bullets">
        {last.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    </Panel>
  );
}

// ── Prep panel ─────────────────────────────────────────────────
function PrepPanel({ prep, onNav }) {
  return (
    <Panel icon={D.prep} title="Next Session Prep" action="Edit →" onAction={() => onNav('prep')}>
      {prep.length === 0
        ? <div style={{ color: 'var(--demo-muted)', fontSize: 12, fontStyle: 'italic' }}>No prep items yet.</div>
        : prep.map(item => (
          <div className="prep-item" key={item.id}>
            <span className={`prep-kind ${item.kind}`}>{item.kind}</span>
            <div>
              <div className="prep-title">{item.title}</div>
              {item.note && <div className="prep-note">{item.note}</div>}
            </div>
          </div>
        ))
      }
    </Panel>
  );
}

// ── Faction clocks panel ───────────────────────────────────────
function FactionsPanel({ factions, onNav }) {
  return (
    <Panel icon={D.factions} title="Faction Clocks" action="All factions →" onAction={() => onNav('factions')}>
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
                onSegmentClick={seg => window.Store.dispatch({ type: 'FACTION_CLOCK_SET', id: f.id, filled: seg + 1 })}
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
    </Panel>
  );
}

// ── Rumors panel ───────────────────────────────────────────────
function RumorsPanel({ rumors, onNav }) {
  return (
    <Panel icon={D.rumor} title="Current Rumors" action="All rumors →" onAction={() => onNav('rumors')}>
      {rumors.slice(0, 4).map(r => (
        <div className="rumor-item" key={r.id}>
          <div className="rumor-text">"{r.text}"</div>
          <div className="rumor-source">
            — {r.source}
            <span className={`rumor-weight ${r.weight}`}>{r.weight}</span>
          </div>
        </div>
      ))}
    </Panel>
  );
}

// ── Secrets panel ──────────────────────────────────────────────
function SecretsPanel({ secrets, onNav }) {
  return (
    <Panel icon={D.secrets} title="The Vault" action="Open vault →" onAction={() => onNav('secrets')}>
      {secrets.map(s => (
        <div className="secret-item" key={s.id}>
          <span className={`secret-status ${s.status}`}>{s.status}</span>
          <span className={`secret-title${s.status === 'sealed' ? ' sealed-text' : ''}`}>
            {s.status === 'sealed' ? '████████████████████████' : s.title}
          </span>
          <span className="secret-weight">{s.weight}</span>
        </div>
      ))}
    </Panel>
  );
}

// ── Dashboard page ─────────────────────────────────────────────
function DashboardPage({ state, onNav }) {
  const { campaign, party, factions, secrets, rumors, sessions, prep } = state;
  const sealedCount = secrets.filter(s => s.status === 'sealed').length;

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Campaign Overview</div>
          <div className="page-title">{campaign.name}</div>
          <div className="page-sub">{campaign.subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'oklch(0.18 0.020 75)', border: '1px solid oklch(0.35 0.060 75)', borderRadius: 5, fontSize: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber, oklch(0.76 0.130 75))', display: 'inline-block' }} />
          <span style={{ color: 'oklch(0.78 0.080 75)', fontWeight: 600 }}>Next: {campaign.nextSession}</span>
        </div>
      </div>

      <PulseStrip session={campaign.session} total={campaign.sessionsTotal} />

      <div style={{ height: 20 }} />

      <div className="dash-grid">
        <div className="dash-stat">
          <div className="dash-stat-label">Session</div>
          <div className="dash-stat-value">{campaign.session}</div>
          <div className="dash-stat-sub">of {campaign.sessionsTotal} planned</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Active Factions</div>
          <div className="dash-stat-value">{factions.length}</div>
          <div className="dash-stat-sub">
            {factions.filter(f => f.disposition === 'hostile').length} hostile ·{' '}
            {factions.filter(f => f.disposition === 'ally').length} ally
          </div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Sealed Secrets</div>
          <div className="dash-stat-value">{sealedCount}</div>
          <div className="dash-stat-sub">of {secrets.length} total in the vault</div>
        </div>
      </div>

      <div className="dash-cols">
        <div>
          <LastSessionPanel sessions={sessions} onNav={onNav} />
          <PrepPanel prep={prep} onNav={onNav} />
          <RumorsPanel rumors={rumors} onNav={onNav} />
        </div>
        <div>
          <LocationPanel location={campaign.location} />
          <PartyPanel party={party} />
          <FactionsPanel factions={factions} onNav={onNav} />
          <SecretsPanel secrets={secrets} onNav={onNav} />
        </div>
      </div>
    </div>
  );
}

// ── Faction color helpers ──────────────────────────────────────
const FACTION_COLORS = {
  iron:    { fg: 'oklch(0.68 0.025 240)', bg: 'oklch(0.20 0.018 240)' },
  oxblood: { fg: 'oklch(0.62 0.090 15)',  bg: 'oklch(0.18 0.040 15)'  },
  moon:    { fg: 'oklch(0.78 0.040 220)', bg: 'oklch(0.20 0.022 220)' },
  ember:   { fg: 'oklch(0.72 0.110 60)',  bg: 'oklch(0.20 0.045 60)'  },
  forest:  { fg: 'oklch(0.65 0.100 155)', bg: 'oklch(0.18 0.040 155)' },
  brass:   { fg: 'oklch(0.72 0.090 85)',  bg: 'oklch(0.20 0.040 85)'  },
};

function factionColor(color) {
  return FACTION_COLORS[color] || { fg: 'var(--demo-dim)', bg: 'oklch(0.20 0.010 260)' };
}

const DISPOSITIONS = ['ally', 'neutral', 'ambiguous', 'hostile'];

// ── Add-Faction form ───────────────────────────────────────────
function AddFactionForm({ onClose }) {
  const [form, setForm] = useState({ name: '', ideology: '', leader: '', seat: '', segments: '6', color: 'iron', summary: '' });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    window.Store.dispatch({
      type: 'FACTION_ADD',
      name: form.name.trim(),
      ideology: form.ideology.trim(),
      leader: form.leader.trim(),
      seat: form.seat.trim(),
      segments: parseInt(form.segments, 10) || 6,
      color: form.color,
      summary: form.summary.trim(),
    });
    onClose();
  }

  const colors = Object.keys(FACTION_COLORS);

  return (
    <div className="add-faction-form">
      <div className="add-faction-title">New Faction</div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-row">
          <div className="faction-field">
            <label>Name</label>
            <input type="text" placeholder="Faction name" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
          </div>
          <div className="faction-field" style={{ maxWidth: 90 }}>
            <label>Clock size</label>
            <input type="number" min="2" max="12" value={form.segments} onChange={e => set('segments', e.target.value)} />
          </div>
        </div>
        <div className="faction-field">
          <label>Ideology</label>
          <input type="text" placeholder="What do they believe?" value={form.ideology} onChange={e => set('ideology', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="faction-field">
            <label>Leader</label>
            <input type="text" placeholder="Leader name" value={form.leader} onChange={e => set('leader', e.target.value)} />
          </div>
          <div className="faction-field">
            <label>Seat of power</label>
            <input type="text" placeholder="Location" value={form.seat} onChange={e => set('seat', e.target.value)} />
          </div>
        </div>
        <div className="faction-field">
          <label>Colour</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {colors.map(c => {
              const col = factionColor(c);
              return (
                <div
                  key={c}
                  onClick={() => set('color', c)}
                  style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: col.fg,
                    cursor: 'pointer',
                    outline: form.color === c ? `2px solid ${col.fg}` : '2px solid transparent',
                    outlineOffset: 2,
                    transition: 'outline 0.12s',
                  }}
                  title={c}
                />
              );
            })}
          </div>
        </div>
        <div className="faction-field">
          <label>Summary</label>
          <textarea placeholder="Brief description of this faction…" value={form.summary} onChange={e => set('summary', e.target.value)} rows={2} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!form.name.trim()}>Add Faction</button>
        </div>
      </form>
    </div>
  );
}

// ── Faction detail panel ───────────────────────────────────────
function FactionDetail({ faction }) {
  const col = factionColor(faction.color);

  function patch(field, value) {
    window.Store.dispatch({ type: 'FACTION_SET_FIELD', id: faction.id, field, value });
  }

  function patchClock(field, value) {
    const updated = { ...faction.clock, [field]: value };
    window.Store.dispatch({ type: 'FACTION_SET_FIELD', id: faction.id, field: 'clock', value: updated });
  }

  function setDisposition(d) {
    window.Store.dispatch({ type: 'FACTION_SET_DISPOSITION', id: faction.id, disposition: d });
  }

  function advanceClock(seg) {
    const next = faction.clock.filled === seg + 1 ? seg : seg + 1;
    window.Store.dispatch({ type: 'FACTION_CLOCK_SET', id: faction.id, filled: next });
  }

  function remove() {
    if (window.confirm('Remove ' + faction.name + '? This cannot be undone.')) {
      window.Store.dispatch({ type: 'FACTION_REMOVE', id: faction.id });
    }
  }

  return (
    <div className="faction-detail">
      <div className="faction-detail-header">
        <div className="faction-detail-sigil" style={{ background: col.bg, borderColor: col.fg + '44' }}>
          <Sigil kind={faction.sigil} size={28} color={col.fg} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="faction-detail-name">
            <input
              value={faction.name}
              onChange={e => patch('name', e.target.value)}
              placeholder="Faction name"
            />
          </div>
          <div style={{ marginTop: 4 }}>
            <DispPill d={faction.disposition} />
          </div>
        </div>
      </div>

      <div className="faction-detail-body">

        {/* Clock */}
        <div className="faction-clock-section">
          <FactionClock
            segments={faction.clock.segments}
            filled={faction.clock.filled}
            size={80}
            color={faction.color}
            label=""
            onSegmentClick={advanceClock}
          />
          <div className="faction-clock-controls">
            <label>Clock — {faction.clock.label || 'untitled'}</label>
            <input
              type="text"
              value={faction.clock.label || ''}
              onChange={e => patchClock('label', e.target.value)}
              placeholder="Clock label…"
            />
            <span className="clock-progress-text">
              {faction.clock.filled} / {faction.clock.segments} segments filled
            </span>
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              <button
                className="btn-secondary"
                style={{ fontSize: 11, padding: '3px 10px' }}
                onClick={() => window.Store.dispatch({ type: 'FACTION_CLOCK_SET', id: faction.id, filled: Math.max(0, faction.clock.filled - 1) })}
              >− Back</button>
              <button
                className="btn-secondary"
                style={{ fontSize: 11, padding: '3px 10px' }}
                onClick={() => window.Store.dispatch({ type: 'FACTION_CLOCK_SET', id: faction.id, filled: Math.min(faction.clock.segments, faction.clock.filled + 1) })}
              >+ Advance</button>
            </div>
          </div>
        </div>

        {/* Disposition */}
        <div className="disposition-row">
          <label>Disposition</label>
          <div className="disposition-pills">
            {DISPOSITIONS.map(d => (
              <button
                key={d}
                className={`disp-btn${faction.disposition === d ? ' active-' + d : ''}`}
                onClick={() => setDisposition(d)}
              >{d}</button>
            ))}
          </div>
        </div>

        {/* Meta fields */}
        <div className="faction-meta">
          <div className="faction-field">
            <label>Ideology</label>
            <input value={faction.ideology || ''} onChange={e => patch('ideology', e.target.value)} placeholder="What do they believe?" />
          </div>
          <div className="form-row">
            <div className="faction-field">
              <label>Leader</label>
              <input value={faction.leader || ''} onChange={e => patch('leader', e.target.value)} placeholder="Name" />
            </div>
            <div className="faction-field">
              <label>Seat of power</label>
              <input value={faction.seat || ''} onChange={e => patch('seat', e.target.value)} placeholder="Location" />
            </div>
          </div>
          <div className="faction-field">
            <label>Summary</label>
            <textarea value={faction.summary || ''} onChange={e => patch('summary', e.target.value)} placeholder="Describe this faction…" />
          </div>
        </div>
      </div>

      <div className="faction-detail-actions">
        <button className="btn-danger" onClick={remove}>Remove faction</button>
      </div>
    </div>
  );
}

// ── Factions page ──────────────────────────────────────────────
function FactionsPage({ factions }) {
  const [selectedId, setSelectedId] = useState(factions[0]?.id || null);
  const [adding, setAdding] = useState(false);

  // If the selected faction was deleted, fall back to first
  const selected = factions.find(f => f.id === selectedId) || factions[0] || null;

  // Auto-select first faction when one is added
  useEffect(() => {
    if (factions.length && !selected) setSelectedId(factions[0].id);
  }, [factions.length]);

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Power & Conflict</div>
          <div className="page-title">Factions</div>
        </div>
        <button className="btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Faction'}
        </button>
      </div>

      {factions.length === 0 && !adding ? (
        <div className="factions-empty">
          <span style={{ width: 36, height: 36, color: 'var(--demo-muted)', opacity: 0.3 }}>{D.factions}</span>
          <h3>No factions yet</h3>
          <p>Add the powers at play in your campaign — guilds, courts, cults, armies.</p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>Add your first faction</button>
        </div>
      ) : (
        <div className="factions-layout">
          <div>
            {adding && <AddFactionForm onClose={() => setAdding(false)} />}
            <div className="factions-list">
              {factions.map(f => {
                const col = factionColor(f.color);
                return (
                  <div
                    key={f.id}
                    className={`faction-card-item${selected?.id === f.id ? ' active' : ''}`}
                    onClick={() => setSelectedId(f.id)}
                  >
                    <div className="faction-card-sigil" style={{ background: col.bg, borderColor: col.fg + '44' }}>
                      <Sigil kind={f.sigil} size={18} color={col.fg} />
                    </div>
                    <div className="faction-card-info">
                      <div className="faction-card-name">{f.name}</div>
                      <div className="faction-card-clock-label">{f.clock.label || 'No clock label'}</div>
                    </div>
                    <FactionClock
                      segments={f.clock.segments}
                      filled={f.clock.filled}
                      size={32}
                      color={f.color}
                      label=""
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {selected && <FactionDetail key={selected.id} faction={selected} />}
        </div>
      )}
    </div>
  );
}

// ── Vault / Secrets ────────────────────────────────────────────
const SECRET_STATUSES = ['sealed', 'cracked', 'revealed'];
const SECRET_WEIGHTS  = ['Campaign', 'Arc', 'Scene'];

// Build a flat pool of connectable entities from state
function buildEntityPool(state) {
  const pool = [];
  (state.party || []).forEach(p =>
    pool.push({ id: 'char:' + p.name, label: p.name, sub: p.role, kind: 'character' })
  );
  (state.npcs || []).forEach(n =>
    pool.push({ id: n.id, label: n.name, sub: n.title, kind: 'npc' })
  );
  (state.factions || []).forEach(f =>
    pool.push({ id: f.id, label: f.name, sub: f.ideology, kind: 'faction' })
  );
  return pool;
}

function entityLabel(id, pool) {
  const e = pool.find(p => p.id === id);
  return e ? e.label : id;
}

// ── Entity connection picker ───────────────────────────────────
function EntityPicker({ relates, onChange, pool }) {
  const [search, setSearch] = useState('');

  const selected  = pool.filter(e => relates.includes(e.id));
  const available = pool.filter(e => !relates.includes(e.id));
  const filtered  = search
    ? available.filter(e =>
        e.label.toLowerCase().includes(search.toLowerCase()) ||
        (e.sub || '').toLowerCase().includes(search.toLowerCase())
      )
    : available;

  function add(id) {
    onChange([...relates, id]);
    setSearch('');
  }

  function remove(id) {
    onChange(relates.filter(r => r !== id));
  }

  return (
    <div className="faction-field">
      <label>Connected to</label>
      {selected.length > 0 && (
        <div className="entity-chips">
          {selected.map(e => (
            <span key={e.id} className={`entity-chip kind-${e.kind}`}>
              {e.label}
              <button className="entity-chip-remove" onClick={() => remove(e.id)}>×</button>
            </span>
          ))}
        </div>
      )}
      <input
        className="entity-search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Link a character, NPC, or faction…"
      />
      {search && (
        <div className="entity-results">
          {filtered.slice(0, 8).map(e => (
            <div key={e.id} className="entity-result" onClick={() => add(e.id)}>
              <span className="entity-result-name">{e.label}</span>
              <span className="entity-result-kind">{e.kind}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '6px 8px', fontSize: 11, color: 'var(--demo-muted)' }}>No matches</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add secret form ────────────────────────────────────────────
function AddSecretForm({ onClose }) {
  const [form, setForm] = useState({ title: '', weight: 'Scene', revealsTo: '' });
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    window.Store.dispatch({
      type: 'SECRET_ADD',
      title: form.title.trim(),
      weight: form.weight,
      revealsTo: form.revealsTo.trim(),
    });
    onClose();
  }

  return (
    <div className="new-session-form">
      <div className="new-session-label">New Secret</div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="faction-field">
          <label>The secret</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="State it plainly." autoFocus />
        </div>
        <div className="faction-field">
          <label>Weight</label>
          <div className="weight-row">
            {SECRET_WEIGHTS.map(w => (
              <button
                key={w} type="button"
                className={`weight-btn${form.weight === w ? ' active ' + w : ''}`}
                onClick={() => set('weight', w)}
              >{w}</button>
            ))}
          </div>
        </div>
        <div className="faction-field">
          <label>Reveals when</label>
          <input type="text" value={form.revealsTo} onChange={e => set('revealsTo', e.target.value)} placeholder="What triggers this reveal?" />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!form.title.trim()}>Seal it</button>
        </div>
      </form>
    </div>
  );
}

// ── Secret detail ──────────────────────────────────────────────
function SecretDetail({ secret, pool }) {
  function patch(field, value) {
    window.Store.dispatch({ type: 'SECRET_SET_FIELD', id: secret.id, field, value });
  }

  function setStatus(status) {
    window.Store.dispatch({ type: 'SECRET_SET_STATUS', id: secret.id, status });
  }

  function remove() {
    if (window.confirm('Permanently delete this secret?')) {
      window.Store.dispatch({ type: 'SECRET_REMOVE', id: secret.id });
    }
  }

  return (
    <div className="secret-detail">
      <div className="secret-detail-header">
        {/* Status selector */}
        <div className="secret-status-bar">
          {SECRET_STATUSES.map(s => (
            <button
              key={s}
              className={`secret-status-btn${secret.status === s ? ' active ' + s : ''}`}
              onClick={() => setStatus(s)}
            >{s}</button>
          ))}
        </div>

        {/* Title */}
        <input
          className="secret-title-input"
          value={secret.title}
          onChange={e => patch('title', e.target.value)}
          placeholder="The secret…"
        />

        {/* Weight */}
        <div className="weight-row">
          {SECRET_WEIGHTS.map(w => (
            <button
              key={w}
              className={`weight-btn${secret.weight === w ? ' active ' + w : ''}`}
              onClick={() => patch('weight', w)}
            >{w}</button>
          ))}
        </div>
      </div>

      <div className="secret-detail-body">
        <div className="faction-field">
          <label>Reveals when</label>
          <input
            value={secret.revealsTo || ''}
            onChange={e => patch('revealsTo', e.target.value)}
            placeholder="What triggers this reveal?"
          />
        </div>

        <EntityPicker
          relates={secret.relates || []}
          onChange={v => patch('relates', v)}
          pool={pool}
        />

        <div className="faction-field">
          <label>DM Notes</label>
          <textarea
            value={secret.notes || ''}
            onChange={e => patch('notes', e.target.value)}
            placeholder="Context, consequences, foreshadowing planted…"
            rows={4}
          />
        </div>
      </div>

      <div className="secret-detail-actions" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderTop: '1px solid var(--demo-border)' }}>
        <div style={{ fontSize: 11, color: 'var(--demo-muted)', alignSelf: 'center' }}>
          {(secret.relates || []).length} connection{secret.relates?.length !== 1 ? 's' : ''}
        </div>
        <button className="btn-danger" onClick={remove}>Delete</button>
      </div>
    </div>
  );
}

// ── Vault page ─────────────────────────────────────────────────
function VaultPage({ secrets, state }) {
  const [filter, setFilter]     = useState('all');
  const [selectedId, setSelectedId] = useState(secrets[0]?.id || null);
  const [adding, setAdding]     = useState(false);
  const pool = buildEntityPool(state);

  const prevLen = useRef(secrets.length);
  useEffect(() => {
    if (secrets.length > prevLen.current && secrets[secrets.length - 1]) {
      setSelectedId(secrets[secrets.length - 1].id);
    }
    if (secrets.length === 0) setSelectedId(null);
    prevLen.current = secrets.length;
  }, [secrets.length]);

  const visible = filter === 'all' ? secrets : secrets.filter(s => s.status === filter);
  const selected = secrets.find(s => s.id === selectedId) || visible[0] || null;

  const counts = {
    sealed:   secrets.filter(s => s.status === 'sealed').length,
    cracked:  secrets.filter(s => s.status === 'cracked').length,
    revealed: secrets.filter(s => s.status === 'revealed').length,
  };

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">What the players don't know</div>
          <div className="page-title">The Vault</div>
        </div>
        <button className="btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Secret'}
        </button>
      </div>

      {secrets.length === 0 && !adding ? (
        <div className="vault-empty">
          <span style={{ width: 36, height: 36, color: 'var(--demo-muted)', opacity: 0.3 }}>{D.secrets}</span>
          <h3>The vault is empty</h3>
          <p>Seal your campaign's hidden truths here — who ordered the murder, who is the heir, what the patron actually wants.</p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>Seal the first secret</button>
        </div>
      ) : (
        <div className="vault-layout">
          <div>
            {adding && <AddSecretForm onClose={() => setAdding(false)} />}

            {/* Filter tabs */}
            <div className="vault-tabs">
              {['all', 'sealed', 'cracked', 'revealed'].map(f => (
                <button
                  key={f}
                  className={`vault-tab${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? `All (${secrets.length})` : `${f} (${counts[f]})`}
                </button>
              ))}
            </div>

            <div className="vault-list">
              {visible.map(s => (
                <div
                  key={s.id}
                  className={`secret-list-item status-${s.status}${selected?.id === s.id ? ' active' : ''}`}
                  onClick={() => setSelectedId(s.id)}
                >
                  <div className="secret-list-top">
                    <span className={`secret-status-dot ${s.status}`} />
                    <span className={`secret-list-title${s.status === 'sealed' ? ' blurred' : ''}`}>
                      {s.title}
                    </span>
                    <span className={`secret-weight-chip ${s.weight}`}>{s.weight}</span>
                  </div>
                  {(s.relates || []).length > 0 && (
                    <div className="secret-list-relates">
                      {s.relates.map(id => entityLabel(id, pool)).join(' · ')}
                    </div>
                  )}
                </div>
              ))}
              {visible.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--demo-muted)', fontSize: 12 }}>
                  No {filter} secrets.
                </div>
              )}
            </div>
          </div>

          {selected && <SecretDetail key={selected.id} secret={selected} pool={pool} />}
        </div>
      )}
    </div>
  );
}

// ── Character helpers ──────────────────────────────────────────
function hpStatus(pct) {
  if (pct <= 25) return 'crit';
  if (pct <= 50) return 'low';
  return '';
}

function hpColor(pct) {
  if (pct <= 25) return 'oklch(0.62 0.160 15)';
  if (pct <= 50) return 'oklch(0.65 0.150 30)';
  return 'oklch(0.65 0.130 155)';
}

// ── Add character form ─────────────────────────────────────────
function AddCharacterForm({ onClose }) {
  const [form, setForm] = useState({ name: '', role: '', patron: '', curHp: '20', maxHp: '20', note: '' });
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    window.Store.dispatch({
      type: 'PARTY_ADD',
      name: form.name.trim(),
      role: form.role.trim(),
      patron: form.patron.trim() || '—',
      hp: (parseInt(form.curHp, 10) || 20) + '/' + (parseInt(form.maxHp, 10) || 20),
      note: form.note.trim(),
    });
    onClose();
  }

  return (
    <div className="new-session-form">
      <div className="new-session-label">New Character</div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="faction-field">
          <label>Name</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Character name" autoFocus />
        </div>
        <div className="form-row">
          <div className="faction-field">
            <label>Class / Role</label>
            <input type="text" value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Half-elf Warlock" />
          </div>
          <div className="faction-field">
            <label>Patron / Affiliation</label>
            <input type="text" value={form.patron} onChange={e => set('patron', e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div className="form-row">
          <div className="faction-field" style={{ maxWidth: 80 }}>
            <label>Current HP</label>
            <input type="number" min="0" value={form.curHp} onChange={e => set('curHp', e.target.value)} />
          </div>
          <div className="faction-field" style={{ maxWidth: 80 }}>
            <label>Max HP</label>
            <input type="number" min="1" value={form.maxHp} onChange={e => set('maxHp', e.target.value)} />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!form.name.trim()}>Add character</button>
        </div>
      </form>
    </div>
  );
}

// ── Character detail ───────────────────────────────────────────
function CharacterDetail({ pc }) {
  const { cur, max } = parseHP(pc.hp);
  const pct = Math.round((cur / max) * 100);

  function setCur(val) {
    const n = Math.max(0, Math.min(parseInt(val, 10) || 0, max));
    window.Store.dispatch({ type: 'PARTY_SET_HP', name: pc.name, cur: n, max });
  }

  function setMax(val) {
    const m = Math.max(1, parseInt(val, 10) || 1);
    const c = Math.min(cur, m);
    window.Store.dispatch({ type: 'PARTY_SET_HP', name: pc.name, cur: c, max: m });
  }

  function adjust(delta) { setCur(cur + delta); }

  function patch(field, value) {
    window.Store.dispatch({ type: 'PARTY_SET_FIELD', name: pc.name, field, value });
  }

  function remove() {
    if (window.confirm('Remove ' + pc.name + ' from the party?')) {
      window.Store.dispatch({ type: 'PARTY_REMOVE', name: pc.name });
    }
  }

  return (
    <div className="char-detail">
      <div className="char-detail-header">
        <div className="char-detail-avatar" style={{ background: AV_CLASSES_BG[AV_CLASSES.indexOf(AV_CLASSES[0])], ...avatarStyle(pc.name) }}>
          {initials(pc.name)}
        </div>
        <div style={{ flex: 1 }}>
          <input
            className="char-detail-name"
            value={pc.name}
            onChange={e => patch('name', e.target.value)}
            placeholder="Character name"
          />
          <input
            className="char-detail-role"
            value={pc.role || ''}
            onChange={e => patch('role', e.target.value)}
            placeholder="Class / Role"
          />
        </div>
      </div>

      <div className="hp-tracker">
        <div className="hp-tracker-label">Hit Points</div>
        <div className="hp-bar-large">
          <div
            className={`hp-bar-large-fill ${hpStatus(pct)}`}
            style={{ width: Math.max(0, pct) + '%' }}
          />
        </div>
        <div className="hp-controls">
          <button className="hp-btn" onClick={() => adjust(-1)}>−</button>
          <button className="hp-btn" onClick={() => adjust(-5)} style={{ fontSize: 11 }}>−5</button>
          <div className="hp-display">
            <input
              className="hp-current"
              style={{ color: hpColor(pct) }}
              type="number"
              value={cur}
              min={0}
              max={max}
              onChange={e => setCur(e.target.value)}
            />
            <div className="hp-max-row">
              / <input
                className="hp-max-input"
                type="number"
                value={max}
                min={1}
                onChange={e => setMax(e.target.value)}
              /> max
            </div>
          </div>
          <button className="hp-btn" onClick={() => adjust(5)} style={{ fontSize: 11 }}>+5</button>
          <button className="hp-btn" onClick={() => adjust(1)}>+</button>
        </div>
        <button className="hp-full-btn" onClick={() => setCur(max)}>
          Full heal
        </button>
      </div>

      <div className="char-meta">
        <div className="faction-field">
          <label>Patron / Affiliation</label>
          <input value={pc.patron || '—'} onChange={e => patch('patron', e.target.value)} placeholder="—" />
        </div>
        <div className="faction-field">
          <label>Notes</label>
          <textarea value={pc.note || ''} onChange={e => patch('note', e.target.value)} placeholder="Character notes, debts, conditions…" rows={3} />
        </div>
      </div>

      <div className="char-detail-actions">
        <button className="btn-danger" onClick={remove}>Remove character</button>
      </div>
    </div>
  );
}

// Avatar style helper — deterministic color per name
function avatarStyle(name) {
  const hues = [300, 230, 20, 155, 270, 50];
  const h = hues[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % hues.length];
  return {
    background: `oklch(0.22 0.055 ${h})`,
    color: `oklch(0.75 0.075 ${h})`,
  };
}
const AV_CLASSES_BG = [];

// ── Party page (HP tracker) ────────────────────────────────────
function PartyPage({ party }) {
  const [selectedName, setSelectedName] = useState(party[0]?.name || null);
  const [adding, setAdding] = useState(false);

  const prevLen = useRef(party.length);
  useEffect(() => {
    if (party.length > prevLen.current) setSelectedName(party[party.length - 1]?.name);
    if (party.length === 0) setSelectedName(null);
    prevLen.current = party.length;
  }, [party.length]);

  const selected = party.find(p => p.name === selectedName) || party[0] || null;

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">The Party</div>
          <div className="page-title">Party</div>
        </div>
        <button className="btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Character'}
        </button>
      </div>

      {party.length === 0 && !adding ? (
        <div className="characters-empty">
          <span style={{ width: 36, height: 36, color: 'var(--demo-muted)', opacity: 0.3 }}>{D.characters}</span>
          <h3>No party members yet</h3>
          <p>Add your players' characters to track HP and notes mid-session.</p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>Add first character</button>
        </div>
      ) : (
        <div className="characters-layout">
          <div>
            {adding && <AddCharacterForm onClose={() => setAdding(false)} />}
            <div className="characters-list">
              {party.map(pc => {
                const { cur, max } = parseHP(pc.hp);
                const pct = Math.round((cur / max) * 100);
                return (
                  <div
                    key={pc.name}
                    className={`character-item${selected?.name === pc.name ? ' active' : ''}`}
                    onClick={() => setSelectedName(pc.name)}
                  >
                    <div className="char-avatar" style={avatarStyle(pc.name)}>
                      {initials(pc.name)}
                    </div>
                    <div className="char-info">
                      <div className="char-name">{pc.name}</div>
                      <div className="char-role">{pc.role}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div className="char-hp-mini" style={{ color: hpColor(pct) }}>{cur}/{max}</div>
                      <div style={{ width: 44, height: 3, background: 'oklch(0.22 0.010 260)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: hpColor(pct), borderRadius: 2, transition: 'width 0.2s' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {selected && <CharacterDetail key={selected.name} pc={selected} />}
        </div>
      )}
    </div>
  );
}

// ── NPC Add form ───────────────────────────────────────────────
function AddNPCForm({ onClose }) {
  const state = window.Store.get();
  const [form, setForm] = useState({ name: '', title: '', faction: '', disposition: 'neutral', location: '', quote: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    window.Store.dispatch({
      type: 'NPC_ADD',
      name: form.name.trim(),
      title: form.title.trim(),
      faction: form.faction.trim(),
      disposition: form.disposition,
      location: form.location.trim(),
      quote: form.quote.trim(),
    });
    onClose();
  }

  return (
    <div className="new-session-form" style={{ marginBottom: 16 }}>
      <div className="new-session-label">New NPC</div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="faction-field">
          <label>Name</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" autoFocus />
        </div>
        <div className="faction-field">
          <label>Title / Role</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Captain of the Guard" />
        </div>
        <div className="form-row">
          <div className="faction-field">
            <label>Faction</label>
            <input type="text" value={form.faction} onChange={e => set('faction', e.target.value)} placeholder="Faction id or name" />
          </div>
          <div className="faction-field">
            <label>Disposition</label>
            <select value={form.disposition} onChange={e => set('disposition', e.target.value)}
              style={{ background: 'oklch(0.17 0.010 260)', border: '1px solid var(--demo-border)', borderRadius: 4, color: 'var(--demo-text)', padding: '7px 10px', fontFamily: 'inherit', fontSize: 13, outline: 'none' }}>
              <option value="ally">Ally</option>
              <option value="neutral">Neutral</option>
              <option value="ambiguous">Ambiguous</option>
              <option value="hostile">Hostile</option>
            </select>
          </div>
        </div>
        <div className="faction-field">
          <label>Quote</label>
          <input type="text" value={form.quote} onChange={e => set('quote', e.target.value)} placeholder="Their defining line…" />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!form.name.trim()}>Add NPC</button>
        </div>
      </form>
    </div>
  );
}

// ── NPC Dossier detail view ────────────────────────────────────
function NPCDossier({ npc, secrets, factions, onBack }) {
  const [tagDraft, setTagDraft] = useState('');
  const patch = (field, value) => window.Store.dispatch({ type: 'NPC_SET_FIELD', id: npc.id, field, value });

  const linkedSecrets = secrets.filter(s => s.relates && s.relates.includes(npc.id));

  const factionName = (() => {
    const f = factions.find(f => f.id === npc.faction);
    return f ? f.name : npc.faction || '—';
  })();

  function addTag(e) {
    if ((e.key === 'Enter' || e.key === ',') && tagDraft.trim()) {
      e.preventDefault();
      const tag = tagDraft.trim().replace(/,$/, '');
      if (!npc.tags.includes(tag)) patch('tags', [...(npc.tags || []), tag]);
      setTagDraft('');
    }
  }

  function removeTag(tag) {
    patch('tags', (npc.tags || []).filter(t => t !== tag));
  }

  function autoGrow(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  return (
    <div className="main-inner">
      <div style={{ marginBottom: 20 }}>
        <button className="dossier-back-btn" onClick={onBack}>
          ← All Characters
        </button>
      </div>

      <div className="dossier-layout">
        <div className="dossier-portrait-col">
          <div className="dossier-portrait" style={avatarStyle(npc.name)}>
            {initials(npc.name)}
          </div>

          <div className="dossier-pills-col">
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--demo-muted)', marginBottom: 4 }}>Disposition</div>
            <select
              className="dossier-disp-select"
              value={npc.disposition || 'neutral'}
              onChange={e => patch('disposition', e.target.value)}
            >
              <option value="ally">Ally</option>
              <option value="neutral">Neutral</option>
              <option value="ambiguous">Ambiguous</option>
              <option value="hostile">Hostile</option>
            </select>

            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--demo-muted)', marginTop: 10, marginBottom: 4 }}>Faction</div>
            <input
              className="dossier-input"
              value={npc.faction || ''}
              onChange={e => patch('faction', e.target.value)}
              placeholder="Faction id…"
              style={{ fontSize: 12 }}
            />
            {npc.faction && <div style={{ fontSize: 11, color: 'var(--demo-muted)', marginTop: 3 }}>{factionName}</div>}

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontSize: 12, color: 'var(--demo-muted)' }}>
                <input
                  type="checkbox"
                  checked={!!npc.likely}
                  onChange={e => patch('likely', e.target.checked)}
                  style={{ accentColor: 'oklch(0.72 0.090 85)' }}
                />
                Likely this session
              </label>
            </div>
          </div>
        </div>

        <div className="dossier-content">
          <div className="dossier-name-row">
            <input
              className="dossier-name-input"
              value={npc.name || ''}
              onChange={e => patch('name', e.target.value)}
              placeholder="Name"
            />
            <input
              className="dossier-title-input"
              value={npc.title || ''}
              onChange={e => patch('title', e.target.value)}
              placeholder="Title or role…"
            />
          </div>

          <div className="dossier-two-col">
            <div className="dossier-field">
              <div className="dossier-label">Wants</div>
              <textarea
                className="dossier-textarea"
                value={npc.wants || ''}
                onChange={e => { patch('wants', e.target.value); autoGrow(e.target); }}
                ref={el => el && autoGrow(el)}
                placeholder="What do they want above all else?"
                rows={3}
              />
            </div>
            <div className="dossier-field">
              <div className="dossier-label">Fears</div>
              <textarea
                className="dossier-textarea"
                value={npc.fears || ''}
                onChange={e => { patch('fears', e.target.value); autoGrow(e.target); }}
                ref={el => el && autoGrow(el)}
                placeholder="What do they dread?"
                rows={3}
              />
            </div>
          </div>

          <div className="dossier-field">
            <div className="dossier-label">Quote</div>
            <input
              className="dossier-input"
              value={npc.quote || ''}
              onChange={e => patch('quote', e.target.value)}
              placeholder="Their defining line…"
              style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic' }}
            />
          </div>

          <div className="dossier-two-col">
            <div className="dossier-field">
              <div className="dossier-label">Appearance</div>
              <textarea
                className="dossier-textarea"
                value={npc.appearance || ''}
                onChange={e => { patch('appearance', e.target.value); autoGrow(e.target); }}
                ref={el => el && autoGrow(el)}
                placeholder="How they look, dress, carry themselves…"
                rows={3}
              />
            </div>
            <div className="dossier-field">
              <div className="dossier-label">Voice</div>
              <textarea
                className="dossier-textarea"
                value={npc.voice || ''}
                onChange={e => { patch('voice', e.target.value); autoGrow(e.target); }}
                ref={el => el && autoGrow(el)}
                placeholder="Speech patterns, accent, cadence…"
                rows={3}
              />
            </div>
          </div>

          <div className="dossier-field">
            <div className="dossier-label">Location</div>
            <input
              className="dossier-input"
              value={npc.location || ''}
              onChange={e => patch('location', e.target.value)}
              placeholder="Where are they usually found?"
            />
          </div>

          <div className="dossier-field">
            <div className="dossier-label">Bonds</div>
            <textarea
              className="dossier-textarea"
              value={npc.bonds || ''}
              onChange={e => { patch('bonds', e.target.value); autoGrow(e.target); }}
              ref={el => el && autoGrow(el)}
              placeholder="Relationships, debts, loyalties…"
              rows={2}
            />
          </div>

          <div className="dossier-field">
            <div className="dossier-label" style={{ color: 'oklch(0.65 0.080 80)' }}>DM Note <span style={{ opacity: 0.6, textTransform: 'none', letterSpacing: 0, fontSize: 9, fontWeight: 400 }}>(private)</span></div>
            <textarea
              className="dossier-textarea dm-note"
              value={npc.dmNote || ''}
              onChange={e => { patch('dmNote', e.target.value); autoGrow(e.target); }}
              ref={el => el && autoGrow(el)}
              placeholder="Behind-the-screen notes — hidden from players…"
              rows={2}
            />
          </div>

          <div className="dossier-field">
            <div className="dossier-label">Tags</div>
            <div className="dossier-tags">
              {(npc.tags || []).map(tag => (
                <button key={tag} className="dossier-tag" onClick={() => removeTag(tag)} title="Click to remove">
                  {tag} ×
                </button>
              ))}
              <input
                className="dossier-tag-add"
                value={tagDraft}
                onChange={e => setTagDraft(e.target.value)}
                onKeyDown={addTag}
                placeholder="+ tag"
              />
            </div>
          </div>

          {linkedSecrets.length > 0 && (
            <div className="dossier-secrets-panel">
              <div className="dossier-secrets-title">Linked Secrets ({linkedSecrets.length})</div>
              {linkedSecrets.map(sec => (
                <div key={sec.id} className="dossier-secret-row">
                  <span className={`dossier-secret-badge ${sec.status}`}>{sec.status}</span>
                  <span className="dossier-secret-title">{sec.title}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
            <button className="btn-danger" onClick={() => {
              if (window.confirm('Delete ' + npc.name + '? This cannot be undone.')) {
                window.Store.dispatch({ type: 'NPC_REMOVE', id: npc.id });
                onBack();
              }
            }}>Delete NPC</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Characters page (NPC dossier grid) ─────────────────────────
function CharactersPage({ npcs, secrets, factions }) {
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);

  const selected = npcs.find(n => n.id === selectedId);

  if (selected) {
    return (
      <NPCDossier
        npc={selected}
        secrets={secrets}
        factions={factions}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Dramatis Personae</div>
          <div className="page-title">Characters</div>
        </div>
        <button className="btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ New NPC'}
        </button>
      </div>

      {adding && <AddNPCForm onClose={() => setAdding(false)} />}

      {npcs.length === 0 && !adding ? (
        <div className="npc-empty">
          <span style={{ width: 36, height: 36, color: 'var(--demo-muted)', opacity: 0.3 }}>{D.characters}</span>
          <h3>No characters yet</h3>
          <p>Add the NPCs your players will encounter — allies, enemies, and everyone in between.</p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>Add first NPC</button>
        </div>
      ) : (
        <div className="npc-grid">
          {npcs.map(npc => {
            const factionName = (() => {
              const f = factions.find(f => f.id === npc.faction);
              return f ? f.name : npc.faction || '';
            })();
            return (
              <div key={npc.id} className="npc-card" onClick={() => setSelectedId(npc.id)}>
                <div className="npc-card-portrait" style={avatarStyle(npc.name)}>
                  {initials(npc.name)}
                  {npc.likely && <span className="npc-card-likely">this session</span>}
                </div>
                <div className="npc-card-body">
                  <div className="npc-card-name">{npc.name}</div>
                  {npc.title && <div className="npc-card-title">{npc.title}</div>}
                  <div className="npc-card-pills">
                    <span className={`npc-disp-pill ${npc.disposition || 'neutral'}`}>
                      {npc.disposition || 'neutral'}
                    </span>
                    {factionName && (
                      <span className="npc-faction-pill">{factionName}</span>
                    )}
                  </div>
                  {npc.quote && <div className="npc-card-quote">"{npc.quote}"</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Session helpers ────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function autoResize(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

// ── New session form ───────────────────────────────────────────
function NewSessionForm({ sessions, onClose, onCreated }) {
  const nextNum = sessions.length
    ? Math.max(...sessions.map(s => s.number || 0)) + 1
    : 1;
  const [title, setTitle] = useState('Session ' + nextNum);
  const [note, setNote] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    window.Store.dispatch({
      type: 'SESSION_ADD',
      number: nextNum,
      title: title.trim(),
      bullets: note.trim() ? [note.trim()] : [],
    });
    onClose();
    onCreated && onCreated();
  }

  return (
    <div className="new-session-form">
      <div className="new-session-label">New Session</div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="faction-field">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            placeholder="Session title…"
          />
        </div>
        <div className="faction-field">
          <label>Opening note <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="First bullet point…"
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!title.trim()}>Create session</button>
        </div>
      </form>
    </div>
  );
}

// ── Session detail ─────────────────────────────────────────────
function SessionDetail({ session }) {
  const [bulletDraft, setBulletDraft] = useState('');
  const inputRef = useRef(null);

  function setTitle(v) {
    window.Store.dispatch({ type: 'SESSION_SET_FIELD', id: session.id, field: 'title', value: v });
  }

  function addBullet(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const text = bulletDraft.trim();
    if (!text) return;
    window.Store.dispatch({ type: 'SESSION_ADD_BULLET', id: session.id, text });
    setBulletDraft('');
  }

  function removeBullet(index) {
    window.Store.dispatch({ type: 'SESSION_REMOVE_BULLET', id: session.id, index });
  }

  function editBullet(index, value) {
    const bullets = session.bullets.map((b, i) => i === index ? value : b);
    window.Store.dispatch({ type: 'SESSION_SET_FIELD', id: session.id, field: 'bullets', value: bullets });
  }

  function deleteSession() {
    if (window.confirm('Delete "' + session.title + '"? This cannot be undone.')) {
      window.Store.dispatch({ type: 'SESSION_REMOVE', id: session.id });
    }
  }

  return (
    <div className="session-detail">
      <div className="session-detail-header">
        <div className="session-detail-num">Session {session.number}</div>
        <input
          className="session-detail-title"
          value={session.title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Session title…"
        />
        {session.createdAt && (
          <div className="session-detail-date">{formatDate(session.createdAt)}</div>
        )}
      </div>

      <div className="session-bullets">
        {session.bullets.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--demo-muted)', fontStyle: 'italic', padding: '4px 0' }}>
            No notes yet — add the first bullet below.
          </div>
        )}
        {session.bullets.map((b, i) => (
          <div className="session-bullet" key={i}>
            <span className="bullet-dash">—</span>
            <textarea
              className="bullet-text"
              value={b}
              rows={1}
              onChange={e => {
                autoResize(e.target);
                editBullet(i, e.target.value);
              }}
              onFocus={e => autoResize(e.target)}
              ref={el => el && autoResize(el)}
            />
            <button className="bullet-remove" onClick={() => removeBullet(i)} title="Remove">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M1 1l8 8M9 1L1 9"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="add-bullet-row">
        <span style={{ color: 'var(--demo-muted)', fontSize: 13, flexShrink: 0 }}>—</span>
        <input
          ref={inputRef}
          className="add-bullet-input"
          value={bulletDraft}
          onChange={e => setBulletDraft(e.target.value)}
          onKeyDown={addBullet}
          placeholder="Add a note…"
        />
        <span className="add-bullet-hint">↵ enter</span>
      </div>

      <div className="session-detail-actions">
        <button className="btn-danger" onClick={deleteSession}>Delete session</button>
      </div>
    </div>
  );
}

// ── Sessions page ──────────────────────────────────────────────
function SessionsPage({ sessions, startNew }) {
  const [selectedId, setSelectedId] = useState(sessions[0]?.id || null);
  const [adding, setAdding] = useState(startNew);

  // When a new session is dispatched it'll be first in the list — select it
  const prevLen = useRef(sessions.length);
  useEffect(() => {
    if (sessions.length > prevLen.current && sessions[0]) {
      setSelectedId(sessions[0].id);
    }
    prevLen.current = sessions.length;
  }, [sessions.length]);

  // If selected was deleted, fall back
  const selected = sessions.find(s => s.id === selectedId) || sessions[0] || null;

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Campaign Chronicle</div>
          <div className="page-title">Sessions</div>
        </div>
        <button className="btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ New Session'}
        </button>
      </div>

      {sessions.length === 0 && !adding ? (
        <div className="sessions-empty">
          <span style={{ width: 36, height: 36, color: 'var(--demo-muted)', opacity: 0.3 }}>{D.sessions}</span>
          <h3>No sessions recorded</h3>
          <p>Start logging your sessions to build a chronicle of the campaign.</p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>
            Record first session
          </button>
        </div>
      ) : (
        <div className="sessions-layout">
          <div>
            {adding && (
              <NewSessionForm
                sessions={sessions}
                onClose={() => setAdding(false)}
                onCreated={() => setAdding(false)}
              />
            )}
            <div className="sessions-list">
              {sessions.map(s => (
                <div
                  key={s.id}
                  className={`session-item${selected?.id === s.id ? ' active' : ''}`}
                  onClick={() => setSelectedId(s.id)}
                >
                  <span className="session-num">#{s.number}</span>
                  <div className="session-item-info">
                    <div className="session-item-title">{s.title}</div>
                    <div className="session-item-meta">
                      {s.bullets.length} note{s.bullets.length !== 1 ? 's' : ''}
                      {s.createdAt ? ' · ' + formatDate(s.createdAt) : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {selected && <SessionDetail key={selected.id} session={selected} />}
        </div>
      )}
    </div>
  );
}

// ── Placeholder ────────────────────────────────────────────────
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
          <span className="empty-icon" style={{ width: 40, height: 40, color: 'var(--demo-muted)' }}>{icon}</span>
          <h3>Under Parchment</h3>
          <p>This section is being built. Coming in the next phase.</p>
        </div>
      </div>
    </div>
  );
}

// ── Root app ───────────────────────────────────────────────────
function DemoApp() {
  const state = useStore();
  const [page, setPage] = useState('dashboard');
  const [sessionStartNew, setSessionStartNew] = useState(false);
  const isNew = state._new;

  function navTo(p) {
    setPage(p);
    setSessionStartNew(false);
  }

  function openNewSession() {
    setPage('sessions');
    setSessionStartNew(true);
  }

  const content = (() => {
    switch (page) {
      case 'dashboard':   return <DashboardPage state={state} onNav={navTo} />;
      case 'sessions':    return <SessionsPage sessions={state.sessions} startNew={sessionStartNew} />;
      case 'factions':    return <FactionsPage factions={state.factions} />;
      case 'characters':  return <CharactersPage npcs={state.npcs} secrets={state.secrets} factions={state.factions} />;
      case 'party':       return <PartyPage party={state.party} />;
      case 'secrets':     return <VaultPage secrets={state.secrets} state={state} />;
      case 'rumors':      return <RumorsPage rumors={state.rumors} />;
      case 'prep':        return <PrepPage prep={state.prep} />;
      case 'map':         return <MapPage locations={state.locations} campaign={state.campaign} />;
      case 'codex':       return <CodexPage codex={state.codex} onNav={navTo} />;
      case 'timeline':    return <TimelinePage timeline={state.timeline} sessions={state.sessions} />;
      case 'settings':    return <SettingsPage state={state} onNav={navTo} />;
      default:            return <DashboardPage state={state} onNav={navTo} />;
    }
  })();

  return (
    <div className="app-shell">
      {isNew && <OnboardingOverlay />}
      <Topbar state={state} onNav={navTo} onNewSession={openNewSession} />
      <Sidebar active={page} onNav={navTo} state={state} />
      <main className="app-main">{content}</main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<DemoApp />);
