// Shared UI primitives for The War Room.
// All icons are simple inline SVGs styled with currentColor.

// ── Icons ──────────────────────────────────────────────────────────────
const Icon = {
  WarRoom: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 19 L20 19" />
      <path d="M5 19 L5 13 L19 13 L19 19" />
      <path d="M9 13 L9 7 L15 7 L15 13" />
      <path d="M12 4 L12 7" />
      <circle cx="12" cy="3.2" r="0.8" fill="currentColor" />
    </svg>
  ),
  Sessions: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="4" y="5" width="16" height="14" rx="1.5" />
      <path d="M4 9 L20 9" />
      <path d="M8 5 L8 3" /><path d="M16 5 L16 3" />
    </svg>
  ),
  Codex: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M5 4 L5 20 L19 20 L19 6 L17 4 Z" />
      <path d="M9 8 L15 8" /><path d="M9 11 L15 11" /><path d="M9 14 L13 14" />
    </svg>
  ),
  Characters: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="9" r="3.2" />
      <path d="M5 20 C 5 15.5, 8 14, 12 14 C 16 14, 19 15.5, 19 20" />
    </svg>
  ),
  Locations: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 21 C 12 21, 5 14, 5 10 A 7 7 0 0 1 19 10 C 19 14, 12 21, 12 21 Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  ),
  Factions: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 3 L19 6 L19 13 C 19 17, 15 20, 12 21 C 9 20, 5 17, 5 13 L 5 6 Z" />
      <path d="M12 9 L12 15" /><path d="M9 12 L15 12" />
    </svg>
  ),
  Quests: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 4 L4 20" />
      <path d="M4 4 L16 4 L14 8 L16 12 L4 12" />
    </svg>
  ),
  Timeline: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 3 L12 21" />
      <circle cx="12" cy="6" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="18" r="1.6" />
      <path d="M14 6 L20 6" /><path d="M5 12 L10 12" /><path d="M14 18 L19 18" />
    </svg>
  ),
  Calendar: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="4" y="5" width="16" height="15" rx="1.5" />
      <path d="M4 10 L20 10" /><path d="M9 3 L9 7" /><path d="M15 3 L15 7" />
    </svg>
  ),
  Maps: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 6 L9 4 L15 6 L21 4 L21 18 L15 20 L9 18 L3 20 Z" />
      <path d="M9 4 L9 18" /><path d="M15 6 L15 20" />
    </svg>
  ),
  Secrets: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="5" y="11" width="14" height="9" rx="1.4" />
      <path d="M8 11 L8 8 A 4 4 0 0 1 16 8 L16 11" />
      <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
    </svg>
  ),
  Relationships: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="6" cy="7" r="2" /><circle cx="18" cy="7" r="2" />
      <circle cx="6" cy="17" r="2" /><circle cx="18" cy="17" r="2" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M7.5 8.2 L10.5 11" /><path d="M16.5 8.2 L13.5 11" />
      <path d="M7.5 15.8 L10.5 13" /><path d="M16.5 15.8 L13.5 13" />
    </svg>
  ),
  Encounters: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M5 3 L8 6 L8 14 L5 17 Z" /><path d="M19 3 L16 6 L16 14 L19 17 Z" />
      <path d="M8 10 L16 10" /><path d="M12 17 L12 21" />
    </svg>
  ),
  Items: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 3 L4 8 L4 16 L12 21 L20 16 L20 8 Z" />
      <path d="M4 8 L12 13 L20 8" /><path d="M12 13 L12 21" />
    </svg>
  ),
  Handouts: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M6 3 L18 3 L18 21 L6 21 Z" />
      <path d="M9 7 L15 7" /><path d="M9 11 L15 11" /><path d="M9 15 L13 15" />
    </svg>
  ),
  Tables: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="4" y="4" width="16" height="16" rx="1.4" />
      <path d="M4 10 L20 10" /><path d="M4 16 L20 16" />
      <path d="M10 4 L10 20" /><path d="M16 4 L16 20" />
    </svg>
  ),
  PlayerView: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3" y="5" width="18" height="12" rx="1.5" />
      <path d="M9 21 L15 21" /><path d="M12 17 L12 21" />
    </svg>
  ),
  Exports: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 15 L12 4" /><path d="M8 8 L12 4 L16 8" />
      <path d="M5 14 L5 19 L19 19 L19 14" />
    </svg>
  ),
  Settings: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3 L12 6" /><path d="M12 18 L12 21" />
      <path d="M3 12 L6 12" /><path d="M18 12 L21 12" />
      <path d="M5.6 5.6 L7.7 7.7" /><path d="M16.3 16.3 L18.4 18.4" />
      <path d="M5.6 18.4 L7.7 16.3" /><path d="M16.3 7.7 L18.4 5.6" />
    </svg>
  ),
  Dice: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 3 L21 8 L21 17 L12 22 L3 17 L3 8 Z" />
      <path d="M3 8 L12 13 L21 8" /><path d="M12 13 L12 22" />
    </svg>
  ),
  Plus: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 5 L12 19" /><path d="M5 12 L19 12" />
    </svg>
  ),
  Search: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16 L20 20" />
    </svg>
  ),
  Play: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 5 L19 12 L7 19 Z" />
    </svg>
  ),
  Eye: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 12 C 5 6, 9 4, 12 4 C 15 4, 19 6, 22 12 C 19 18, 15 20, 12 20 C 9 20, 5 18, 2 12 Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Quill: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M20 4 C 14 6, 9 11, 6 17 L 9 18 C 12 14, 16 10, 20 4 Z" />
      <path d="M6 17 L4 21" />
    </svg>
  ),
  Chevron: (p) => (
    <svg className={p.className || 'icn'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M9 6 L15 12 L9 18" />
    </svg>
  ),
};

// ── Sigils (faction emblems) ───────────────────────────────────────────
const Sigil = ({ kind, size = 28, color }) => {
  const s = size;
  const stroke = color || 'currentColor';
  const sw = 1.2;
  if (kind === 'concord') {
    return (
      <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth={sw}>
        <circle cx="14" cy="14" r="11" />
        <path d="M6 6 L18 18" /><path d="M22 6 L10 18" />
        <path d="M6 6 L9 6 L9 9" /><path d="M22 6 L19 6 L19 9" />
      </svg>
    );
  }
  if (kind === 'hand') {
    return (
      <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth={sw}>
        <path d="M14 3 C 9 3, 5 7, 5 13 C 5 19, 10 25, 14 25 C 18 25, 23 19, 23 13 C 23 7, 19 3, 14 3 Z" />
        <ellipse cx="14" cy="13" rx="4" ry="2.5" /><circle cx="14" cy="13" r="1" fill={stroke} />
      </svg>
    );
  }
  if (kind === 'moon') {
    return (
      <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth={sw}>
        <path d="M19 5 A 11 11 0 1 0 19 23 A 8 8 0 0 1 19 5 Z" />
        <path d="M14 14 L14 8" /><path d="M11 11 L17 11" />
      </svg>
    );
  }
  if (kind === 'crown') {
    return (
      <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth={sw}>
        <path d="M4 20 L24 20 L22 11 L18 14 L14 8 L10 14 L6 11 Z" />
        <circle cx="14" cy="8" r="1.2" fill={stroke} />
        <circle cx="6" cy="11" r="1" fill={stroke} />
        <circle cx="22" cy="11" r="1" fill={stroke} />
        <path d="M4 22 L24 22" />
      </svg>
    );
  }
  if (kind === 'anchor') {
    return (
      <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth={sw}>
        <circle cx="14" cy="7" r="2" />
        <path d="M14 9 L14 22" />
        <path d="M9 13 L19 13" />
        <path d="M6 18 C 8 22, 12 23, 14 22" />
        <path d="M22 18 C 20 22, 16 23, 14 22" />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" stroke={stroke} strokeWidth={sw}>
      <polygon points="14,3 24,9 24,19 14,25 4,19 4,9" />
    </svg>
  );
};

// ── Faction clock (ritual segmented circle) ────────────────────────────
function FactionClock({ segments, filled, size = 96, color = 'oxblood', label, onSegmentClick }) {
  const cx = size / 2, cy = size / 2;
  const rOuter = size / 2 - 4;
  const rInner = size / 2 - 18;
  const gap = 0.018;
  const step = (Math.PI * 2) / segments;
  const fillStops = {
    oxblood: ['oklch(0.5 0.16 26)', 'oklch(0.32 0.14 26)'],
    ember:   ['oklch(0.7 0.16 50)',  'oklch(0.42 0.14 50)'],
    moon:    ['oklch(0.72 0.09 235)','oklch(0.42 0.08 235)'],
    forest:  ['oklch(0.6 0.1 150)',  'oklch(0.36 0.08 150)'],
    iron:    ['oklch(0.62 0.014 80)','oklch(0.38 0.012 80)'],
  }[color] || ['oklch(0.5 0.16 26)', 'oklch(0.32 0.14 26)'];

  const wedgePath = (i) => {
    const a0 = -Math.PI / 2 + i * step + gap;
    const a1 = -Math.PI / 2 + (i + 1) * step - gap;
    const x0o = cx + rOuter * Math.cos(a0), y0o = cy + rOuter * Math.sin(a0);
    const x1o = cx + rOuter * Math.cos(a1), y1o = cy + rOuter * Math.sin(a1);
    const x0i = cx + rInner * Math.cos(a0), y0i = cy + rInner * Math.sin(a0);
    const x1i = cx + rInner * Math.cos(a1), y1i = cy + rInner * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0o} ${y0o} A ${rOuter} ${rOuter} 0 ${large} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 ${large} 0 ${x0i} ${y0i} Z`;
  };

  const tickMarks = [];
  for (let i = 0; i < segments; i++) {
    const a = -Math.PI / 2 + i * step;
    const r0 = rOuter + 2, r1 = rOuter + 5;
    tickMarks.push(
      <line key={i}
        x1={cx + r0 * Math.cos(a)} y1={cy + r0 * Math.sin(a)}
        x2={cx + r1 * Math.cos(a)} y2={cy + r1 * Math.sin(a)}
        stroke="var(--brass-dim)" strokeWidth="1" />
    );
  }

  return (
    <div className="clock" style={{ '--size': size + 'px' }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id={`fc-fill-${color}-${size}`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor={fillStops[0]} />
            <stop offset="100%" stopColor={fillStops[1]} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={rOuter + 6} fill="none" stroke="var(--brass-dim)" strokeWidth="0.6" opacity="0.6" />
        {tickMarks}
        {Array.from({ length: segments }).map((_, i) => (
          <path key={`e${i}`} d={wedgePath(i)}
            fill="oklch(0 0 0 / 0.35)"
            stroke="var(--hairline)"
            strokeWidth="0.5"
            onClick={onSegmentClick ? () => onSegmentClick(i) : undefined}
            style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
          />
        ))}
        {Array.from({ length: filled }).map((_, i) => (
          <path key={`f${i}`} d={wedgePath(i)}
            fill={`url(#fc-fill-${color}-${size})`}
            stroke="var(--brass-dim)"
            strokeWidth="0.5"
            onClick={onSegmentClick ? () => onSegmentClick(i) : undefined}
            style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
          />
        ))}
        <circle cx={cx} cy={cy} r={rInner - 2} fill="oklch(0.16 0.012 60)" stroke="var(--brass-dim)" strokeWidth="0.5" />
      </svg>
      <div className="center">
        <span><b>{filled}</b>/{segments}</span>
      </div>
    </div>
  );
}

// ── Wax seal ──────────────────────────────────────────────────────────
function WaxSeal({ size = 56, broken = false, label = "S" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <defs>
        <radialGradient id="wax-grad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="oklch(0.55 0.20 26)" />
          <stop offset="60%" stopColor="oklch(0.36 0.16 26)" />
          <stop offset="100%" stopColor="oklch(0.22 0.14 26)" />
        </radialGradient>
        <filter id="wax-drop">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.5" />
        </filter>
      </defs>
      <g filter="url(#wax-drop)">
        {!broken ? (
          <>
            <path d="M28 4 C 36 5, 48 9, 51 18 C 54 26, 50 36, 45 42 C 40 48, 32 52, 26 50 C 18 48, 8 44, 5 36 C 2 28, 6 18, 12 12 C 18 6, 22 3, 28 4 Z"
                  fill="url(#wax-grad)" stroke="oklch(0.55 0.18 26 / 0.6)" strokeWidth="0.5"/>
            <circle cx="28" cy="28" r="14" fill="none" stroke="oklch(0.62 0.18 26 / 0.5)" strokeWidth="0.6" />
            <text x="28" y="33" textAnchor="middle" fontFamily="Cormorant Garamond, serif"
                  fontSize="20" fontStyle="italic" fill="oklch(0.92 0.04 80)">
              {label}
            </text>
          </>
        ) : (
          <>
            <path d="M28 4 C 36 5, 44 9, 46 14 L 30 24 L 22 16 L 8 14 C 14 8, 22 3, 28 4 Z"
                  fill="url(#wax-grad)" stroke="oklch(0.55 0.18 26 / 0.6)" strokeWidth="0.5"/>
            <path d="M48 18 C 52 24, 52 34, 46 42 C 40 48, 32 52, 26 50 C 22 49, 14 45, 10 38 L 22 26 L 30 28 L 38 20 Z"
                  fill="url(#wax-grad)" stroke="oklch(0.55 0.18 26 / 0.6)" strokeWidth="0.5"/>
            <path d="M22 18 L 30 26 L 22 30 L 32 38" stroke="oklch(0.15 0.04 30)" strokeWidth="0.8" fill="none" opacity="0.4"/>
          </>
        )}
      </g>
    </svg>
  );
}

// ── Disposition pill ───────────────────────────────────────────────────
function DispPill({ d }) {
  const map = {
    ally:     { cls: 'forest', txt: 'Ally' },
    hostile:  { cls: 'ox',     txt: 'Hostile' },
    neutral:  { cls: 'iron',   txt: 'Neutral' },
    ambiguous:{ cls: 'ember',  txt: 'Ambiguous' },
  };
  const m = map[d] || map.neutral;
  return <span className={`pill ${m.cls}`}><span className={`dot ${d === 'ambiguous' ? 'ambig' : d}`}></span>{m.txt}</span>;
}

Object.assign(window, { Icon, Sigil, FactionClock, WaxSeal, DispPill });

// ── WikiLink: hover preview + click-to-navigate ─────────────────────
function getEntity(id) {
  const npc = (window.NPCS || []).find(n => n.id === id);
  if (npc) return { ...npc, _type: 'npc' };
  const fac = (window.FACTIONS || []).find(f => f.id === id);
  if (fac) return { ...fac, _type: 'faction' };
  const loc = (window.MAP_LOCATIONS || []).find(l => l.id === id);
  if (loc) return { ...loc, _type: 'location' };
  const rel = (window.RELIGIONS || []).find(r => r.id === id);
  if (rel) return { ...rel, _type: 'religion' };
  const it  = (window.RELICS || []).find(r => r.id === id);
  if (it)  return { ...it, _type: 'relic' };
  const lore= (window.LORE || []).find(l => l.id === id);
  if (lore) return { ...lore, _type: 'lore' };
  return null;
}

function WikiLink({ id, children, kind }) {
  const [hover, setHover] = React.useState(false);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const ref = React.useRef(null);

  const entity = getEntity(id);
  if (!entity) return <span>{children}</span>;

  const onEnter = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: r.left, y: r.bottom + 6 });
    setHover(true);
  };
  const onLeave = () => setHover(false);
  const onClick = () => {
    const nav = window.__navigate;
    if (!nav) return;
    if (entity._type === 'npc') nav('npc', { id: entity.id });
    else if (entity._type === 'faction') nav('faction', { id: entity.id });
    else if (entity._type === 'location') nav('maps');
    else nav('codex', { highlight: entity.id });
  };

  const cls = kind || (
    entity.disposition === 'hostile' ? 'crimson' :
    entity.disposition === 'ally' ? 'forest' :
    entity._type === 'lore' ? 'slate' : ''
  );

  return (
    <>
      <span ref={ref} className={`wikilink ${cls}`}
            onMouseEnter={onEnter} onMouseLeave={onLeave}
            onClick={onClick}>
        {children}
      </span>
      {hover && <WikiHover entity={entity} x={pos.x} y={pos.y} />}
    </>
  );
}

function WikiHover({ entity, x, y }) {
  const W = 280, M = 12;
  const left = Math.min(window.innerWidth - W - M, Math.max(M, x));
  const top  = Math.min(window.innerHeight - 200, Math.max(M, y));

  const e = entity;
  const summary = (() => {
    if (e._type === 'npc') return `"${e.quote}"`;
    if (e._type === 'faction') return e.summary;
    if (e._type === 'location') return e.note;
    if (e._type === 'religion') return e.tenets;
    if (e._type === 'relic') return e.desc;
    if (e._type === 'lore') return e.desc;
    return '';
  })();

  const tags = (() => {
    if (e._type === 'npc') return [e.disposition, ...(e.tags || []).slice(0, 2)];
    if (e._type === 'faction') return [e.disposition, e.clock?.label];
    if (e._type === 'location') return [e.kind, e.party ? 'party here' : null];
    if (e._type === 'religion' || e._type === 'relic' || e._type === 'lore') return [e._type, e.kind];
    return [];
  })().filter(Boolean);

  const portrait = e._type === 'faction' ? (
    <div className="wp-portrait">
      <Sigil kind={e.sigil} size={22} color="var(--brass)" />
    </div>
  ) : (
    <div className="wp-portrait">{e.name[0]}</div>
  );

  return ReactDOM.createPortal(
    <div className="wiki-popover" style={{ left, top }}>
      <div className="wp-row">
        {portrait}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="wp-name">{e.name}</div>
          {(e.title || e.kind) && <div className="wp-title">{e.title || e.kind}</div>}
        </div>
      </div>
      <div className="wp-tags">
        {tags.map((t, i) => (
          <span key={i} className="pill iron" style={{ fontSize: 10, padding: '1px 6px' }}>{t}</span>
        ))}
      </div>
      <div className="wp-summary">{summary}</div>
      <div className="wp-kbd">click to open</div>
    </div>,
    document.body
  );
}

Object.assign(window, { WikiLink, WikiHover, getEntity });
