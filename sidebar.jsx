// Sidebar — primary navigation, brand mark, DM identity at foot.

function Sidebar({ active, onNav, state }) {
  const campaign = state?.campaign || { name: 'War Room', subtitle: '' };
  const sealed = (state?.secrets || []).filter(s => s.status === 'sealed').length;
  const groups = [
    {
      label: 'Play',
      items: [
        { id: 'warroom',  label: 'War Room',     icon: Icon.WarRoom, badge: 'tonight', hot: true },
        { id: 'prep',     label: 'Prep',         icon: Icon.Quill, badge: state?.prep?.filter(p => !p.done).length },
        { id: 'sessions', label: 'Sessions',     icon: Icon.Sessions, badge: state?.sessions?.length || campaign.session },
        { id: 'encounters', label: 'Encounters', icon: Icon.Encounters, badge: state?.encounters?.length },
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
        { id: 'calendar',  label: 'Calendar',      icon: Icon.Calendar, badge: state?.calendar?.length },
        { id: 'maps',      label: 'Maps',          icon: Icon.Maps },
      ],
    },
    {
      label: 'DM Tools',
      items: [
        { id: 'secrets',       label: 'Secrets',       icon: Icon.Secrets, badge: sealed },
        { id: 'rumors',        label: 'Rumors',        icon: Icon.Eye, badge: state?.rumors?.filter(r => !r.delivered).length },
        { id: 'relationships', label: 'Relationships', icon: Icon.Relationships },
        { id: 'items',         label: 'Items & Relics', icon: Icon.Items, badge: state?.relics?.length },
        { id: 'handouts',      label: 'Handouts',       icon: Icon.Handouts, badge: state?.handouts?.length },
        { id: 'tables',        label: 'Random Tables',  icon: Icon.Tables, badge: state?.tables?.length },
        { id: 'inspiration',   label: 'Inspiration',    icon: Icon.Inspiration, badge: state?.inspiration?.length },
      ],
    },
    {
      label: 'Output',
      items: [
        { id: 'player',   label: 'Player View',   icon: Icon.PlayerView },
        { id: 'exports',  label: 'Exports',       icon: Icon.Exports },
        { id: 'settings', label: 'Settings',      icon: Icon.Settings },
      ],
    },
  ];

  return (
    <aside className="sidebar grain">
      <div className="brand">
        <div className="brand-sigil" aria-hidden="true">
          <Sigil kind="crown" size={22} />
        </div>
        <div>
          <div className="brand-name">Vaelthorne</div>
          <div className="brand-tag">War Room · v0.7</div>
        </div>
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
                      {typeof it.badge === 'number' ? it.badge : it.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="side-foot">
        <div className="dm-avatar">A</div>
        <div style={{ minWidth: 0 }}>
          <div className="fg" style={{ fontWeight: 600 }}>Ardenna, DM</div>
          <div className="muted" style={{ fontSize: 11 }}>{campaign.subtitle || campaign.name}</div>
        </div>
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar });
