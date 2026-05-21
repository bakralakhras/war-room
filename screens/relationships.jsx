// Relationship Graph — pan + zoom conspiracy board for 60+ NPCs.

function Relationships({ state, onOpenNPC }) {
  const data = state.relationships || { nodes: [], edges: [] };
  const npcs = state.npcs || [];
  const W = 1400, H = 950; // content canvas — large enough for 60+ nodes

  // Viewport: translate + scale applied to the content group
  const [vp, setVp] = React.useState({ x: 0, y: 0, scale: 1 });
  const vpRef = React.useRef({ x: 0, y: 0, scale: 1 });
  React.useEffect(() => { vpRef.current = vp; }, [vp]);

  // Local node state for smooth dragging, re-synced when node count changes
  const [localNodes, setLocalNodes] = React.useState(() => data.nodes.map(n => ({ ...n })));
  React.useEffect(() => { setLocalNodes(data.nodes.map(n => ({ ...n }))); }, [data.nodes.length]);

  const [search, setSearch]         = React.useState('');
  const [filter, setFilter]         = React.useState({ ally: true, blood: true, love: true, enmity: true, debt: true, secret: true });
  const [hovered, setHovered]       = React.useState(null);
  const [hovEdge, setHovEdge]       = React.useState(null);
  const [drag, setDrag]             = React.useState(null);
  const [panning, setPanning]       = React.useState(false);
  const [addingEdge, setAddingEdge] = React.useState(false);
  const [edgeForm, setEdgeForm]     = React.useState({ a: '', b: '', rel: 'ally', label: '', secret: false });

  const svgRef   = React.useRef(null);
  const dragRef  = React.useRef(null);  // active node drag — read in RAF
  const panRef   = React.useRef(null);  // active canvas pan — read in RAF
  const rafRef   = React.useRef(null);  // pending animation frame id
  const mouseRef = React.useRef({ x: 0, y: 0 }); // latest mouse position

  // Non-passive wheel listener so we can call preventDefault and prevent page scroll
  React.useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const v = vpRef.current;
      const r = el.getBoundingClientRect();
      const sx = (e.clientX - r.left) / r.width  * W;
      const sy = (e.clientY - r.top)  / r.height * H;
      const factor = e.deltaY < 0 ? 1.13 : (1 / 1.13);
      const ns = Math.max(0.07, Math.min(7, v.scale * factor));
      // Keep the content point under the cursor fixed
      const cx = (sx - v.x) / v.scale;
      const cy = (sy - v.y) / v.scale;
      const nv = { scale: ns, x: sx - cx * ns, y: sy - cy * ns };
      vpRef.current = nv;
      setVp(nv);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Zoom toward SVG center
  const applyZoom = (ns) => {
    const v = vpRef.current;
    ns = Math.max(0.07, Math.min(7, ns));
    const cx = (W / 2 - v.x) / v.scale;
    const cy = (H / 2 - v.y) / v.scale;
    const nv = { scale: ns, x: W / 2 - cx * ns, y: H / 2 - cy * ns };
    vpRef.current = nv;
    setVp(nv);
  };

  const fitAll = () => {
    if (!localNodes.length) return;
    const pad = 110;
    const xs = localNodes.map(n => n.x * W);
    const ys = localNodes.map(n => n.y * H);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const bW = x1 - x0 + pad * 2 || 200;
    const bH = y1 - y0 + pad * 2 || 200;
    const scale = Math.min(W / bW, H / bH, 1.8);
    const nv = {
      scale,
      x: W / 2 - ((x0 + x1) / 2) * scale,
      y: H / 2 - ((y0 + y1) / 2) * scale,
    };
    vpRef.current = nv;
    setVp(nv);
  };

  const handleNodeDown = (e, node) => {
    e.stopPropagation();
    const v = vpRef.current;
    const r = svgRef.current.getBoundingClientRect();
    const sx = (e.clientX - r.left) / r.width  * W;
    const sy = (e.clientY - r.top)  / r.height * H;
    const cx = (sx - v.x) / v.scale;
    const cy = (sy - v.y) / v.scale;
    const d = { id: node.id, ox: cx - node.x * W, oy: cy - node.y * H };
    dragRef.current = d;
    setDrag(d);
  };

  const handlePanStart = (e) => {
    if (e.button !== 0) return;
    const v = vpRef.current;
    const r = svgRef.current.getBoundingClientRect();
    panRef.current = {
      sx0: (e.clientX - r.left) / r.width  * W,
      sy0: (e.clientY - r.top)  / r.height * H,
      vx0: v.x, vy0: v.y,
    };
    mouseRef.current = { x: e.clientX, y: e.clientY };
    setPanning(true);
  };

  const handleMove = (e) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
    if (!dragRef.current && !panRef.current) return;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!svgRef.current) return;
      const r = svgRef.current.getBoundingClientRect();
      const sx = (mouseRef.current.x - r.left) / r.width  * W;
      const sy = (mouseRef.current.y - r.top)  / r.height * H;
      const v = vpRef.current;

      if (dragRef.current) {
        const d = dragRef.current;
        const cx = (sx - v.x) / v.scale;
        const cy = (sy - v.y) / v.scale;
        const nx = Math.max(0.01, Math.min(0.99, (cx - d.ox) / W));
        const ny = Math.max(0.01, Math.min(0.99, (cy - d.oy) / H));
        setLocalNodes(prev => prev.map(n => n.id === d.id ? { ...n, x: nx, y: ny } : n));
      } else if (panRef.current) {
        const p = panRef.current;
        const nv = { ...v, x: p.vx0 + (sx - p.sx0), y: p.vy0 + (sy - p.sy0) };
        vpRef.current = nv;
        setVp(nv);
      }
    });
  };

  const handleUp = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (dragRef.current) {
      const node = localNodes.find(n => n.id === dragRef.current.id);
      if (node) window.Store.dispatch({ type: 'REL_NODE_MOVE', id: node.id, x: node.x, y: node.y });
      dragRef.current = null;
      setDrag(null);
    }
    panRef.current = null;
    setPanning(false);
  };

  const visibleEdge = (e) => {
    if (e.secret && !filter.secret) return false;
    const r = e.rel;
    if (r === 'ally' || r === 'loyal' || r === 'pact') return filter.ally;
    if (r === 'blood' || r === 'brother' || r === 'ward') return filter.blood;
    if (r === 'love') return filter.love;
    if (r === 'enmity') return filter.enmity;
    if (r === 'debt' || r === 'knows') return filter.debt;
    return true;
  };

  const edgeStyle = (rel) => {
    if (rel === 'enmity')                     return { stroke: 'oklch(0.55 0.18 26)',  dash: '0',   w: 1.6 };
    if (rel === 'love')                       return { stroke: 'oklch(0.7 0.16 26)',   dash: '0',   w: 1.4 };
    if (rel === 'blood' || rel === 'brother') return { stroke: 'oklch(0.74 0.06 80)',  dash: '0',   w: 1.2 };
    if (rel === 'ward')                       return { stroke: 'oklch(0.7 0.07 235)',  dash: '0',   w: 1.4 };
    if (rel === 'loyal' || rel === 'ally')    return { stroke: 'oklch(0.6 0.08 150)',  dash: '0',   w: 1.2 };
    if (rel === 'debt')                       return { stroke: 'oklch(0.66 0.15 50)',  dash: '4 3', w: 1.4 };
    if (rel === 'knows')                      return { stroke: 'oklch(0.55 0.014 80)', dash: '2 4', w: 1   };
    if (rel === 'pact')                       return { stroke: 'oklch(0.66 0.16 50)',  dash: '1 3', w: 1.6 };
    return { stroke: 'oklch(0.55 0.014 80)', dash: '2 3', w: 1 };
  };

  const addEdge = () => {
    if (!edgeForm.a || !edgeForm.b || edgeForm.a === edgeForm.b) return;
    window.Store.dispatch({ type: 'REL_EDGE_ADD', ...edgeForm });
    setEdgeForm({ a: '', b: '', rel: 'ally', label: '', secret: false });
    setAddingEdge(false);
  };

  const removeEdge = (index) => window.Store.dispatch({ type: 'REL_EDGE_REMOVE', index });

  const onBoard  = new Set(data.nodes.map(n => n.id));
  const offBoard = npcs.filter(n => !onBoard.has(n.id));

  const addToBoard = (npc) => {
    window.Store.dispatch({
      type: 'REL_NODE_ADD',
      id: npc.id, label: npc.name,
      kind: (npc.tags || []).includes('captain') ? 'captain'
          : (npc.tags || []).includes('noble')   ? 'noble'
          : 'clerk',
      x: 0.1 + Math.random() * 0.8,
      y: 0.1 + Math.random() * 0.8,
    });
  };

  const removeFromBoard = (id) => window.Store.dispatch({ type: 'REL_NODE_REMOVE', id });

  // Search + highlight helpers
  const sq = search.trim().toLowerCase();
  const searching = sq.length > 0;
  const npcForNode = (id) => npcs.find(n => n.id === id);
  const nodeLabel = (node) => npcForNode(node.id)?.name || node.label;
  const nodeImage = (node) => npcForNode(node.id)?.image || '';
  const nodeKind = (node) => {
    const npc = npcForNode(node.id);
    return npc ? inferNodeKind(npc) : node.kind;
  };
  const matchesSearch = (label) => (label || '').toLowerCase().includes(sq);

  const nodeOpacity = (n) => {
    if (searching) return matchesSearch(nodeLabel(n)) ? 1 : 0.1;
    const hovDim = hovered && hovered !== n.id && !data.edges.some(e =>
      (e.a === hovered && e.b === n.id) || (e.b === hovered && e.a === n.id));
    const edgeDim = hovEdge !== null && !data.edges.some((e, i) =>
      i === hovEdge && (e.a === n.id || e.b === n.id));
    return hovDim || edgeDim ? 0.18 : 1;
  };

  const edgeOpacity = (e, i) => {
    if (searching) {
      const aNode = localNodes.find(n => n.id === e.a);
      const bNode = localNodes.find(n => n.id === e.b);
      const aM = matchesSearch(aNode ? nodeLabel(aNode) : '');
      const bM = matchesSearch(bNode ? nodeLabel(bNode) : '');
      return aM && bM ? 0.9 : aM || bM ? 0.3 : 0.04;
    }
    const isNodeHov = hovered && (hovered === e.a || hovered === e.b);
    const isEdgeHov = hovEdge === i;
    if (!hovered && hovEdge === null) return e.secret ? 0.55 : 0.9;
    return (isNodeHov || isEdgeHov) ? 1 : 0.12;
  };

  const iS = { // input style shorthand
    background: 'oklch(0.16 0.012 60)',
    border: '1px solid var(--hairline-2)',
    borderRadius: 'var(--r)',
    color: 'var(--fg)',
    padding: '5px 8px',
    fontSize: 12,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Web of influence</div>
          <h1 className="page-title">Relationships</h1>
          <div className="page-sub">Who owes whom, who loves whom, who buried whom.</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 252px', gap: 16, alignItems: 'start' }}>

        {/* ── Conspiracy Board ─────────────────────────────────────── */}
        <div className="card cornered" style={{ overflow: 'hidden' }}>
          <div className="head" style={{ gap: 6 }}>
            <Icon.Relationships />
            <span className="title">The Conspiracy Board</span>
            <div className="spacer" />

            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                background: 'oklch(0.16 0.012 60)',
                border: '1px solid var(--hairline-2)',
                borderRadius: 'var(--r)',
                color: 'var(--fg)',
                padding: '3px 9px',
                fontSize: 11.5,
                outline: 'none',
                width: 120,
              }}
            />

            {/* Zoom controls */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <button className="tbtn" style={{ fontSize: 13, padding: '1px 8px', lineHeight: 1.4 }} onClick={() => applyZoom(vpRef.current.scale * 1.25)}>+</button>
              <button className="tbtn" style={{ fontSize: 13, padding: '1px 8px', lineHeight: 1.4 }} onClick={() => applyZoom(vpRef.current.scale / 1.25)}>−</button>
              <button className="tbtn" style={{ fontSize: 10.5, padding: '2px 8px' }} onClick={fitAll}>Fit</button>
              <button className="tbtn" style={{ fontSize: 10.5, padding: '2px 8px' }} onClick={() => { const nv = { x: 0, y: 0, scale: 1 }; vpRef.current = nv; setVp(nv); }}>1:1</button>
              <span className="mono muted" style={{ fontSize: 10, minWidth: 34, textAlign: 'right' }}>{Math.round(vp.scale * 100)}%</span>
            </div>

            <span className="smallcaps muted" style={{ fontSize: 10, marginLeft: 4 }}>
              {data.edges.filter(visibleEdge).length} threads · {data.nodes.length} portraits
            </span>
          </div>

          <div style={{
            position: 'relative',
            height: 'calc(100vh - 295px)',
            minHeight: 440,
            background: 'radial-gradient(120% 80% at 50% 30%, oklch(0.20 0.012 60) 0%, oklch(0.13 0.012 60) 100%)',
            userSelect: 'none',
            overflow: 'hidden',
          }}>
            {/* Cork texture overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage:
                'repeating-linear-gradient(0deg, oklch(0 0 0 / 0.06) 0px, oklch(0 0 0 / 0.06) 1px, transparent 1px, transparent 4px),' +
                'radial-gradient(oklch(0.32 0.06 60 / 0.12) 1px, transparent 1.6px)',
              backgroundSize: 'auto, 6px 6px',
              opacity: 0.6,
            }} />

            {/* Empty-state hint */}
            {data.nodes.length === 0 && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10, pointerEvents: 'none',
              }}>
                <div style={{ color: 'var(--fg-3)', fontFamily: 'var(--f-display)', fontSize: 22, fontStyle: 'italic' }}>
                  No portraits pinned yet
                </div>
                <div style={{ color: 'var(--fg-4)', fontSize: 12 }}>
                  Add NPCs from the panel on the right
                </div>
              </div>
            )}

            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                cursor: drag || panning ? 'grabbing' : 'grab',
              }}
              onMouseDown={handlePanStart}
              onMouseMove={handleMove}
              onMouseUp={handleUp}
              onMouseLeave={handleUp}
            >
              <defs>
                <filter id="rel-thread-shadow">
                  <feDropShadow dx="0" dy="1" stdDeviation="0.6" floodOpacity="0.55" />
                </filter>
                <filter id="rel-node-lift">
                  <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.5" />
                </filter>
                <filter id="rel-search-glow">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="oklch(0.8 0.15 80)" floodOpacity="0.7" />
                </filter>
              </defs>

              {/* All content inside the viewport transform */}
              <g transform={`translate(${vp.x} ${vp.y}) scale(${vp.scale})`}>

                {/* ── Edges ── */}
                {data.edges.filter(visibleEdge).map((e, i) => {
                  const a = localNodes.find(n => n.id === e.a);
                  const b = localNodes.find(n => n.id === e.b);
                  if (!a || !b) return null;
                  const s  = edgeStyle(e.rel);
                  const x1 = a.x * W, y1 = a.y * H;
                  const x2 = b.x * W, y2 = b.y * H;
                  const isNodeHov = hovered && (hovered === a.id || hovered === b.id);
                  const isEdgeHov = hovEdge === i;
                  const isActive  = isNodeHov || isEdgeHov;
                  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
                  return (
                    <g key={i} filter="url(#rel-thread-shadow)" opacity={edgeOpacity(e, i)}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={s.stroke} strokeWidth={isActive ? s.w + 1.2 : s.w}
                            strokeDasharray={s.dash} strokeLinecap="round" pointerEvents="none" />
                      {/* wider invisible hit area */}
                      <line x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke="transparent" strokeWidth={Math.max(20, 20 / vp.scale)}
                            onMouseEnter={() => setHovEdge(i)} onMouseLeave={() => setHovEdge(null)}
                            style={{ cursor: 'default' }} />
                      {isActive && e.label && e.label !== '—' && (
                        <g transform={`translate(${midX},${midY})`}>
                          <rect x="-34" y="-10" width="68" height="18" rx="3"
                                fill="oklch(0.18 0.012 60)" stroke={s.stroke} strokeWidth="0.6" />
                          <text textAnchor="middle" y="4"
                                fontFamily="Cormorant Garamond, serif" fontSize="11.5" fontStyle="italic"
                                fill="oklch(0.92 0.012 80)">{e.label}</text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* ── Nodes ── */}
                {localNodes.map(n => {
                  const cx = n.x * W, cy = n.y * H;
                  const isDragging    = drag && drag.id === n.id;
                  const isSearchMatch = searching && matchesSearch(nodeLabel(n));
                  return (
                    <g key={n.id}
                       transform={`translate(${cx},${cy})`}
                       opacity={nodeOpacity(n)}
                       filter={isDragging ? 'url(#rel-node-lift)' : isSearchMatch ? 'url(#rel-search-glow)' : undefined}
                       onMouseEnter={() => !drag && setHovered(n.id)}
                       onMouseLeave={() => !drag && setHovered(null)}
                       onMouseDown={(e) => handleNodeDown(e, n)}
                       onDoubleClick={() => onOpenNPC && onOpenNPC(n.id)}
                       style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
                      <NodePortrait kind={nodeKind(n)} label={nodeLabel(n)} image={nodeImage(n)} />
                    </g>
                  );
                })}

              </g>
            </svg>
          </div>

          <div style={{ padding: '7px 16px', fontSize: 11, color: 'var(--fg-4)', fontStyle: 'italic', borderTop: '1px solid var(--hairline-2)' }}>
            Scroll to zoom · drag canvas to pan · drag portraits to move · double-click to open dossier
          </div>
        </div>

        {/* ── Right panel ───────────────────────────────────────────── */}
        <div className="col" style={{ gap: 12 }}>

          {/* Thread legend */}
          <div className="card cornered">
            <div className="head"><Icon.Eye /><span className="title">Show / hide</span></div>
            <div className="body" style={{ padding: '8px 14px' }}>
              <ThreadKey color="oklch(0.74 0.06 80)"   label="Bloodline"     on={filter.blood}  onToggle={() => setFilter(f => ({ ...f, blood:  !f.blood  }))} />
              <ThreadKey color="oklch(0.6 0.08 150)"   label="Allegiance"    on={filter.ally}   onToggle={() => setFilter(f => ({ ...f, ally:   !f.ally   }))} />
              <ThreadKey color="oklch(0.7 0.16 26)"    label="Love"          on={filter.love}   onToggle={() => setFilter(f => ({ ...f, love:   !f.love   }))} />
              <ThreadKey color="oklch(0.55 0.18 26)"   label="Enmity"        on={filter.enmity} onToggle={() => setFilter(f => ({ ...f, enmity: !f.enmity }))} />
              <ThreadKey color="oklch(0.66 0.15 50)"   label="Debt / Knows"  dash on={filter.debt}   onToggle={() => setFilter(f => ({ ...f, debt:   !f.debt   }))} />
              <ThreadKey color="oklch(0.66 0.16 50)"   label="Secret threads" dash secret on={filter.secret} onToggle={() => setFilter(f => ({ ...f, secret: !f.secret }))} />
            </div>
          </div>

          {/* Threads list */}
          <div className="card cornered">
            <div className="head">
              <Icon.Relationships />
              <span className="title">Threads</span>
              <div className="spacer" />
              <span className="smallcaps muted" style={{ fontSize: 10 }}>{data.edges.length}</span>
              <button className="tbtn" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => setAddingEdge(v => !v)}>
                <Icon.Plus /> Add
              </button>
            </div>

            {addingEdge && (
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--hairline-2)', background: 'oklch(0.18 0.012 60 / 0.5)' }}>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                  <select value={edgeForm.a} onChange={e => setEdgeForm(f => ({ ...f, a: e.target.value }))} style={iS}>
                    <option value="">From…</option>
                    {data.nodes.map(n => <option key={n.id} value={n.id}>{nodeLabel(n)}</option>)}
                  </select>
                  <select value={edgeForm.b} onChange={e => setEdgeForm(f => ({ ...f, b: e.target.value }))} style={iS}>
                    <option value="">To…</option>
                    {data.nodes.map(n => <option key={n.id} value={n.id}>{nodeLabel(n)}</option>)}
                  </select>
                </div>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                  <select value={edgeForm.rel} onChange={e => setEdgeForm(f => ({ ...f, rel: e.target.value }))} style={iS}>
                    {['ally','blood','love','enmity','debt','knows','loyal','ward','pact','brother'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <input value={edgeForm.label} onChange={e => setEdgeForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="Label…" style={iS} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'var(--fg-2)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={edgeForm.secret} onChange={e => setEdgeForm(f => ({ ...f, secret: e.target.checked }))} />
                    DM-only secret
                  </label>
                  <div style={{ flex: 1 }} />
                  <button className="tbtn brass" style={{ fontSize: 11, padding: '3px 10px' }} onClick={addEdge}>Add thread</button>
                  <button className="tbtn" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => setAddingEdge(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {data.edges.map((e, i) => {
                const nodeA = data.nodes.find(n => n.id === e.a);
                const nodeB = data.nodes.find(n => n.id === e.b);
                const s = edgeStyle(e.rel);
                return (
                  <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--hairline-2)', background: hovEdge === i ? 'oklch(0.26 0.02 70 / 0.4)' : 'transparent' }}
                    onMouseEnter={() => setHovEdge(i)} onMouseLeave={() => setHovEdge(null)}>
                    <svg width="14" height="8" style={{ flexShrink: 0 }}>
                      <line x1="0" y1="4" x2="14" y2="4" stroke={s.stroke} strokeWidth="2" strokeDasharray={s.dash} strokeLinecap="round" />
                    </svg>
                    <span style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nodeA?.label || e.a} → {nodeB?.label || e.b}
                    </span>
                    <span className="muted" style={{ fontSize: 10, flexShrink: 0 }}>{e.rel}</span>
                    {e.secret && <span className="pill iron" style={{ fontSize: 9, padding: '1px 4px', flexShrink: 0 }}>DM</span>}
                    <button style={{ background: 'transparent', border: 0, color: 'var(--fg-4)', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
                      onClick={() => removeEdge(i)}>×</button>
                  </div>
                );
              })}
              {!data.edges.length && <div style={{ padding: '10px 14px', color: 'var(--fg-3)', fontSize: 12, fontStyle: 'italic' }}>No threads yet.</div>}
            </div>
          </div>

          {/* Portraits on the board */}
          <div className="card cornered">
            <div className="head">
              <Icon.Characters />
              <span className="title">Portraits</span>
              <div className="spacer" />
              <span className="smallcaps muted" style={{ fontSize: 10 }}>{data.nodes.length}</span>
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {data.nodes.map(n => (
                <div key={n.id}
                  className="clickable"
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ padding: '7px 12px', borderBottom: '1px dashed var(--hairline-2)', display: 'flex', gap: 9, alignItems: 'center', background: hovered === n.id ? 'oklch(0.26 0.02 70 / 0.6)' : 'transparent' }}>
                  <NodeAvatar kind={nodeKind(n)} image={nodeImage(n)} />
                  <div style={{ flex: 1, minWidth: 0 }}
                    onDoubleClick={() => onOpenNPC && onOpenNPC(n.id)}
                    title="Double-click to open dossier">
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 13 }}>{nodeLabel(n)}</div>
                    <div className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{nodeKind(n)}</div>
                  </div>
                  <button style={{ background: 'transparent', border: 0, color: 'var(--fg-4)', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}
                    title="Remove from board" onClick={() => removeFromBoard(n.id)}>×</button>
                </div>
              ))}
              {!data.nodes.length && <div style={{ padding: '10px 14px', color: 'var(--fg-3)', fontSize: 12, fontStyle: 'italic' }}>No portraits pinned yet.</div>}
            </div>
          </div>

          {/* Add to board */}
          {offBoard.length > 0 && (
            <div className="card cornered">
              <div className="head"><Icon.Plus /><span className="title">Add portrait</span></div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {offBoard.map(npc => (
                  <div key={npc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderBottom: '1px solid var(--hairline-2)' }}>
                    <span style={{ fontFamily: 'var(--f-display)', fontSize: 13 }}>{npc.name}</span>
                    <button className="tbtn" style={{ fontSize: 10.5, padding: '2px 8px' }} onClick={() => addToBoard(npc)}>Pin</button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Portrait card rendered as SVG group (centered at 0,0) ──────────
function NodePortrait({ kind, label, image }) {
  const colors = {
    noble:   ['oklch(0.42 0.07 80)',  'oklch(0.22 0.05 60)'],
    soldier: ['oklch(0.38 0.012 60)', 'oklch(0.18 0.012 60)'],
    cleric:  ['oklch(0.42 0.07 235)', 'oklch(0.20 0.05 235)'],
    witness: ['oklch(0.62 0.07 235)', 'oklch(0.32 0.06 235)'],
    clerk:   ['oklch(0.42 0.13 26)',  'oklch(0.22 0.10 26)'],
    captain: ['oklch(0.4 0.07 150)',  'oklch(0.2 0.05 150)'],
    party:   ['oklch(0.5 0.10 50)',   'oklch(0.28 0.08 50)'],
    ghost:   ['oklch(0.62 0.012 80)', 'oklch(0.4 0.012 80)'],
  };
  const [a, b] = colors[kind] || colors.noble;
  const gradId = `grad-${kind}-${(label || '').replace(/\W/g, '')}`;
  return (
    <g>
      {/* tack pin */}
      <circle cx="0" cy="-30" r="3.5" fill="var(--brass)" stroke="oklch(0.16 0.04 30)" strokeWidth="0.5" />
      <line x1="0" y1="-27" x2="0" y2="-20" stroke="oklch(0.32 0.014 60)" strokeWidth="0.9" />
      {/* portrait card */}
      <rect x="-30" y="-20" width="60" height="44" rx="2.5"
            fill="oklch(0.92 0.04 80)" stroke="oklch(0.4 0.07 60)" strokeWidth="0.7" />
      {/* colored fill / uploaded portrait */}
      {image ? (
        <>
          <clipPath id={`${gradId}-clip`}>
            <rect x="-28" y="-18" width="56" height="28" />
          </clipPath>
          <image href={image} x="-28" y="-18" width="56" height="28" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${gradId}-clip)`} />
        </>
      ) : (
        <rect x="-28" y="-18" width="56" height="28" fill={`url(#${gradId})`} />
      )}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
      </defs>
      {!image && (
        <>
          <circle cx="0" cy="-5" r="6" fill="oklch(0.16 0.04 30)" opacity="0.6" />
          <path d="M -13 12 Q 0 0 13 12" fill="oklch(0.16 0.04 30)" opacity="0.6" />
        </>
      )}
      {/* nameplate */}
      <rect x="-30" y="12" width="60" height="12" fill="oklch(0.85 0.04 80)" stroke="oklch(0.4 0.07 60)" strokeWidth="0.5" />
      <text textAnchor="middle" y="21" fontFamily="Cormorant Garamond, serif"
            fontSize="9" fill="oklch(0.22 0.06 40)" letterSpacing="0.3">{label}</text>
      {kind === 'ghost' && (
        <rect x="-30" y="-20" width="60" height="44" rx="2.5" fill="oklch(0.92 0.04 80 / 0.45)" />
      )}
    </g>
  );
}

// ── Small square avatar for the right-panel list ───────────────────
function NodeAvatar({ kind, image }) {
  const colors = {
    noble:   'oklch(0.45 0.08 80)',
    soldier: 'oklch(0.32 0.012 60)',
    cleric:  'oklch(0.42 0.07 235)',
    witness: 'oklch(0.5 0.07 235)',
    clerk:   'oklch(0.42 0.13 26)',
    captain: 'oklch(0.4 0.07 150)',
    party:   'oklch(0.5 0.10 50)',
    ghost:   'oklch(0.55 0.012 80)',
  };
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 3,
      background: colors[kind] || 'oklch(0.4 0.07 80)',
      border: '1px solid var(--brass-dim)',
      display: 'grid', placeItems: 'center', flexShrink: 0,
      opacity: kind === 'ghost' ? 0.6 : 1,
      overflow: 'hidden',
    }}>
      {image ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'oklch(0 0 0 / 0.4)' }} />}
    </div>
  );
}

function inferNodeKind(npc) {
  const tags = npc.tags || [];
  if (tags.includes('captain')) return 'captain';
  if (tags.includes('noble')) return 'noble';
  if (tags.includes('cleric') || tags.includes('priest')) return 'cleric';
  if (tags.includes('soldier')) return 'soldier';
  if (tags.includes('witness')) return 'witness';
  return 'clerk';
}

// ── Thread type toggle row ─────────────────────────────────────────
function ThreadKey({ color, label, dash, secret, on, onToggle }) {
  return (
    <div className="between" style={{ padding: '5px 0', cursor: 'pointer' }} onClick={onToggle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="32" height="8">
          <line x1="0" y1="4" x2="32" y2="4" stroke={color}
                strokeWidth="2" strokeDasharray={dash ? '5 3' : '0'}
                strokeLinecap="round" opacity={on ? 1 : 0.25} />
        </svg>
        <span style={{ fontSize: 12.5, opacity: on ? 1 : 0.4 }}>{label}</span>
        {secret && <span className="pill iron" style={{ padding: '1px 5px', fontSize: 9 }}>DM</span>}
      </div>
      <span className="mono muted" style={{ fontSize: 10 }}>{on ? 'shown' : 'hidden'}</span>
    </div>
  );
}

Object.assign(window, { Relationships });
