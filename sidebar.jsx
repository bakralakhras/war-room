// Sidebar — primary navigation, brand mark, DM identity at foot.

function Sidebar({ active, onNav, state }) {
  const campaign = state?.campaign || { name: 'War Room', subtitle: '' };
  const [campaigns, setCampaigns] = React.useState(() => window.Store.campaigns.list());
  const [showCampaignPicker, setShowCampaignPicker] = React.useState(false);
  const [, setNowTick] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => setNowTick(t => t + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  // Refresh campaign list when state changes (name edits, new campaigns)
  React.useEffect(() => {
    setCampaigns(window.Store.campaigns.list());
  }, [state?.campaign?.name]);

  const activeCampaignId = window.Store.campaigns.active();

  const sealed = (state?.secrets || []).filter(s => s.status === 'sealed').length;
  const nextSessionBadge = window.nextSessionCountdownLabel
    ? window.nextSessionCountdownLabel(campaign.nextSession)
    : null;

  const groups = [
    {
      label: 'Play',
      items: [
        { id: 'warroom',    label: 'War Room',     icon: Icon.WarRoom,   badge: nextSessionBadge || 'tonight', hot: !!nextSessionBadge },
        { id: 'prep',       label: 'Prep',         icon: Icon.Quill,     badge: state?.prep?.filter(p => !p.done).length },
        { id: 'sessions',   label: 'Sessions',     icon: Icon.Sessions,  badge: state?.sessions?.length || campaign.session },
        { id: 'encounters', label: 'Encounters',   icon: Icon.Encounters, badge: state?.encounters?.length },
      ],
    },
    {
      label: 'World',
      items: [
        { id: 'codex',     label: 'World Codex',   icon: Icon.Codex },
        { id: 'characters',label: 'Characters',    icon: Icon.Characters, badge: state?.npcs?.length },
        { id: 'locations', label: 'Locations',     icon: Icon.Locations,  badge: state?.locations?.length },
        { id: 'factions',  label: 'Factions',      icon: Icon.Factions,   badge: state?.factions?.length },
        { id: 'quests',    label: 'Quests',        icon: Icon.Quests,     badge: state?.quests?.filter(q => q.state === 'active').length },
        { id: 'timeline',  label: 'Timeline',      icon: Icon.Timeline },
        { id: 'calendar',  label: 'Calendar',      icon: Icon.Calendar,   badge: state?.calendar?.length },
        { id: 'maps',      label: 'Maps',          icon: Icon.Maps },
      ],
    },
    {
      label: 'DM Tools',
      items: [
        { id: 'secrets',       label: 'Secrets',        icon: Icon.Secrets,       badge: sealed },
        { id: 'rumors',        label: 'Rumors',         icon: Icon.Eye,           badge: state?.rumors?.filter(r => !r.delivered).length },
        { id: 'relationships', label: 'Relationships',  icon: Icon.Relationships },
        { id: 'items',         label: 'Items & Relics', icon: Icon.Items,         badge: state?.relics?.length },
        { id: 'handouts',      label: 'Handouts',       icon: Icon.Handouts,      badge: state?.handouts?.length },
        { id: 'tables',        label: 'Random Tables',  icon: Icon.Tables,        badge: state?.tables?.length },
        { id: 'inspiration',   label: 'Inspiration',    icon: Icon.Inspiration,   badge: state?.inspiration?.length },
      ],
    },
    {
      label: 'Output',
      items: [
        { id: 'player',   label: 'Player View', icon: Icon.PlayerView },
        { id: 'exports',  label: 'Exports',     icon: Icon.Exports },
        { id: 'settings', label: 'Settings',    icon: Icon.Settings },
      ],
    },
  ];

  const user = window.Auth?.session;

  return (
    <aside className="sidebar grain">
      <div className="brand">
        <div className="brand-sigil" aria-hidden="true">
          <Sigil kind="crown" size={22} />
        </div>
        <div>
          <div className="brand-name">War Room</div>
          <div className="brand-tag">v0.8</div>
        </div>
      </div>

      {/* Campaign switcher */}
      <div
        style={{
          margin: '0 8px 4px',
          padding: '7px 10px',
          borderRadius: 'var(--r)',
          background: 'oklch(0 0 0 / 0.25)',
          border: '1px solid var(--hairline-2)',
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={() => setShowCampaignPicker(v => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-4)', marginBottom: 1 }}>Campaign</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 13.5, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {campaign.name || 'My Campaign'}
            </div>
          </div>
          <span style={{ color: 'var(--fg-4)', fontSize: 10, flexShrink: 0 }}>{showCampaignPicker ? '▲' : '▼'}</span>
        </div>

        {showCampaignPicker && (
          <div
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: 'var(--panel)', border: '1px solid var(--hairline-2)',
              borderRadius: 'var(--r)', marginTop: 4, overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {campaigns.map(c => (
              <div
                key={c.id}
                onClick={() => {
                  if (c.id !== activeCampaignId) {
                    window.Store.campaigns.switchTo(c.id);
                    setCampaigns(window.Store.campaigns.list());
                  }
                  setShowCampaignPicker(false);
                  onNav('warroom');
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  fontFamily: 'var(--f-display)',
                  cursor: c.id === activeCampaignId ? 'default' : 'pointer',
                  background: c.id === activeCampaignId ? 'oklch(0 0 0 / 0.2)' : 'transparent',
                  color: c.id === activeCampaignId ? 'var(--brass)' : 'var(--fg)',
                  borderBottom: '1px solid var(--hairline-2)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {c.id === activeCampaignId && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--brass)', flexShrink: 0 }} />}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              </div>
            ))}
            <div
              onClick={() => { setShowCampaignPicker(false); onNav('campaigns'); }}
              style={{ padding: '8px 12px', fontSize: 11.5, color: 'var(--brass)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon.Plus /> Manage campaigns
            </div>
          </div>
        )}
      </div>

      <div className="side-scroll">
        {groups.map((g) => (
          <div className="nav-group" key={g.label}>
            <div className="nav-group-label">{g.label}</div>
            {g.items.map((it) => {
              const Ic = it.icon;
              const isActive = active === it.id;
              return (
                <div
                  key={it.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onNav(it.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onNav(it.id); }}
                >
                  <Ic />
                  <span>{it.label}</span>
                  {it.badge != null && (
                    <span className={`badge ${it.hot ? 'hot' : ''}`}>
                      {it.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="side-foot">
        <div className="dm-avatar">{(user?.displayName || 'D')[0].toUpperCase()}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="fg" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.displayName || 'DM'}
          </div>
          <div className="muted" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.username || ''}
          </div>
        </div>
        {user && (
          <button
            title="Sign out"
            onClick={() => window.Auth.logout()}
            style={{ background: 'transparent', border: 0, color: 'var(--fg-4)', cursor: 'pointer', fontSize: 14, padding: '2px 4px', lineHeight: 1, flexShrink: 0 }}
          >
            ⎋
          </button>
        )}
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar });
