// World Codex — wiki-style note editor with auto-linking, backlinks, DM blocks, templates, folders.

// ── Constants ─────────────────────────────────────────────────────────
const CODEX_TYPES = [
  { id: 'lore',      label: 'Lore',      glyph: '❦',  color: 'var(--brass)' },
  { id: 'character', label: 'Character', glyph: '◐',  color: 'var(--brass)' },
  { id: 'place',     label: 'Place',     glyph: '◇',  color: 'oklch(0.70 0.09 145)' },
  { id: 'faction',   label: 'Faction',   glyph: '✦',  color: 'oklch(0.72 0.12 28)' },
  { id: 'mystery',   label: 'Mystery',   glyph: '☽',  color: 'var(--slate)' },
  { id: 'prophecy',  label: 'Prophecy',  glyph: '✧',  color: 'var(--slate)' },
  { id: 'session',   label: 'Session',   glyph: '◈',  color: 'var(--amber)' },
];

const CODEX_TEMPLATES = {
  lore:
`## Overview


## History


## Significance


## DM Notes
[DM]

[/DM]`,
  character:
`## Voice & Manner


## Motivation


## What They're Hiding
[DM]

[/DM]
## Key Relationships


## Notes
`,
  place:
`## First Impression


## Atmosphere


## Who's Here


## What's Hidden
[DM]

[/DM]
## History
`,
  faction:
`## Core Belief


## Leadership


## Goals


## Secrets
[DM]

[/DM]
## Resources
`,
  mystery:
`## What Players Know


## What Actually Happened
[DM]

[/DM]
## Clues Available


## Threads
`,
  prophecy:
`## The Prophecy


## True Meaning
[DM]

[/DM]
## How It Was Delivered


## Fulfillment Conditions
`,
  session:
`## What Happened


## Player Actions


## World Changes


## DM Notes
[DM]

[/DM]
## Next Session Setup
`,
};

const CX_FOLDERS = ['Lore', 'Characters', 'Locations', 'Factions', 'Session Notes', 'Mysteries'];

// ── Utilities ─────────────────────────────────────────────────────────

function collectEntities(state) {
  const ents = [];
  (state.npcs || []).forEach(n => { if (n.name) ents.push({ id: n.id, name: n.name, kind: 'person' }); });
  (state.factions || []).forEach(f => { if (f.name) ents.push({ id: f.id, name: f.name, kind: 'faction' }); });
  (state.locations || []).forEach(l => {
    const nm = l.label || l.name;
    if (nm) ents.push({ id: l.id, name: nm, kind: 'place' });
  });
  (state.codex || []).forEach(e => { if (e.title) ents.push({ id: e.id, name: e.title, kind: e.type || 'lore' }); });
  return ents.filter(e => e.name && e.name.length > 2);
}

function computeBacklinks(entryId, entryTitle, allEntries) {
  if (!entryTitle || entryTitle.length < 2) return [];
  const title = entryTitle.toLowerCase();
  return allEntries
    .filter(e => e.id !== entryId && e.body)
    .filter(e => e.body.toLowerCase().includes(title))
    .map(e => ({ id: e.id, title: e.title, type: e.type }));
}

// Build highlighted HTML — entity auto-links, DM blocks, headers.
function buildHighlight(text, entities) {
  let out = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // DM blocks first
  out = out.replace(/\[DM\]([\s\S]*?)\[\/DM\]/g, '<span class="cx-dm">[DM]$1[/DM]</span>');

  // Headers
  out = out.replace(/^(## .+)$/gm, '<span class="cx-h2">$1</span>');
  out = out.replace(/^(# .+)$/gm,  '<span class="cx-h1">$1</span>');

  // Entity auto-links (longest first to prevent partial shadowing)
  const sorted = [...entities].sort((a, b) => b.name.length - a.name.length);
  sorted.forEach(ent => {
    const esc = ent.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`\\b(${esc})\\b`, 'gi'),
      `<mark class="cx-link cx-${ent.kind}">$1</mark>`);
  });

  return out + '\n';
}

// ── WorldCodex ────────────────────────────────────────────────────────
function WorldCodex({ state, onNav, onOpenNPC, onOpenFaction, highlight }) {
  const entries  = React.useMemo(() => state.codex || [], [state.codex]);
  const entities = React.useMemo(() => collectEntities(state), [state]);

  const [selectedId,   setSelectedId]   = React.useState(() => entries[0]?.id || null);
  const [search,       setSearch]       = React.useState('');
  const [folderFilter, setFolderFilter] = React.useState(null);

  React.useEffect(() => {
    if (highlight) {
      const found = entries.find(e => e.id === highlight);
      if (found) setSelectedId(found.id);
    }
  }, [highlight]);

  const allFolders = React.useMemo(() => {
    const s = new Set(CX_FOLDERS);
    entries.forEach(e => { if (e.folder) s.add(e.folder); });
    return [...s];
  }, [entries]);

  const filtered = React.useMemo(() => entries.filter(e => {
    if (folderFilter === '__uncat__') return !e.folder;
    if (folderFilter && e.folder !== folderFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (e.title || '').toLowerCase().includes(q) || (e.body || '').toLowerCase().includes(q);
    }
    return true;
  }), [entries, folderFilter, search]);

  const createNew = (type = 'lore') => {
    const folder = (folderFilter && folderFilter !== '__uncat__') ? folderFilter : '';
    window.Store.dispatch({
      type: 'CODEX_ADD',
      title: 'Untitled ' + (CODEX_TYPES.find(t => t.id === type)?.label || 'Note'),
      entryType: type,
      body: CODEX_TEMPLATES[type] || '',
      folder,
      attributes: [],
    });
    setTimeout(() => {
      const e = window.Store.get().codex[0];
      if (e) setSelectedId(e.id);
    }, 0);
  };

  const selectedEntry = entries.find(e => e.id === selectedId);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <CodexSidebar
        entries={entries}
        filtered={filtered}
        selectedId={selectedId}
        onSelect={setSelectedId}
        search={search}
        setSearch={setSearch}
        folderFilter={folderFilter}
        setFolderFilter={setFolderFilter}
        allFolders={allFolders}
        onNew={createNew}
      />
      {selectedEntry ? (
        <CodexEditor
          key={selectedEntry.id}
          entry={selectedEntry}
          allEntries={entries}
          entities={entities}
          state={state}
          onDelete={() => {
            window.Store.dispatch({ type: 'CODEX_REMOVE', id: selectedEntry.id });
            const rem = entries.filter(e => e.id !== selectedEntry.id);
            setSelectedId(rem[0]?.id || null);
          }}
          onOpenNPC={onOpenNPC}
          onOpenFaction={onOpenFaction}
        />
      ) : (
        <CodexWelcome onNew={createNew} count={entries.length} />
      )}
    </div>
  );
}

// ── CodexSidebar ──────────────────────────────────────────────────────
function CodexSidebar({ entries, filtered, selectedId, onSelect, search, setSearch, folderFilter, setFolderFilter, allFolders, onNew }) {
  const [newMenu, setNewMenu] = React.useState(false);
  const uncatCount = entries.filter(e => !e.folder).length;

  const groups = React.useMemo(() => {
    if (folderFilter) return [{ folder: folderFilter, items: filtered }];
    const map = {};
    const uncat = [];
    filtered.forEach(e => {
      if (e.folder) { (map[e.folder] = map[e.folder] || []).push(e); }
      else uncat.push(e);
    });
    const g = Object.entries(map).map(([f, items]) => ({ folder: f, items }));
    if (uncat.length) g.push({ folder: null, items: uncat });
    return g;
  }, [filtered, folderFilter]);

  return (
    <div className="cx-sidebar">
      <div className="cx-sidebar-top">
        <div style={{ position: 'relative' }}>
          <button className="tbtn brass" style={{ width: '100%', justifyContent: 'center', fontSize: 11.5 }}
            onClick={() => setNewMenu(v => !v)}>
            <Icon.Plus /> New Note
          </button>
          {newMenu && (
            <div className="cx-new-menu">
              {CODEX_TYPES.map(t => (
                <button key={t.id} className="cx-new-opt"
                  onClick={() => { onNew(t.id); setNewMenu(false); }}>
                  <span style={{ color: t.color, width: 14, textAlign: 'center', fontSize: 10 }}>{t.glyph}</span>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="cx-search">
          <Icon.Search />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…" />
        </div>
      </div>

      <div className="cx-sidebar-scroll">
        <div className="cx-folder-tree">
          <div className="cx-tree-label">Folders</div>
          <div className={`cx-folder-row ${!folderFilter ? 'active' : ''}`} onClick={() => setFolderFilter(null)}>
            <span>All notes</span><span className="cx-count">{entries.length}</span>
          </div>
          {allFolders.map(f => {
            const cnt = entries.filter(e => e.folder === f).length;
            if (!cnt && !CX_FOLDERS.includes(f)) return null;
            return (
              <div key={f} className={`cx-folder-row ${folderFilter === f ? 'active' : ''}`}
                onClick={() => setFolderFilter(folderFilter === f ? null : f)}>
                <span>{f}</span><span className="cx-count">{cnt}</span>
              </div>
            );
          })}
          {uncatCount > 0 && (
            <div className={`cx-folder-row ${folderFilter === '__uncat__' ? 'active' : ''}`}
              onClick={() => setFolderFilter(folderFilter === '__uncat__' ? null : '__uncat__')}>
              <span className="muted">Uncategorized</span>
              <span className="cx-count">{uncatCount}</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--hairline-2)', marginTop: 4 }}>
          {groups.map(({ folder, items }) => (
            <div key={folder || '__u'}>
              {!folderFilter && (
                <div className="cx-tree-label" style={{ marginTop: 10, color: folder ? 'var(--fg-3)' : 'var(--fg-4)' }}>
                  {folder || 'Uncategorized'}
                </div>
              )}
              {items.map(e => {
                const t = CODEX_TYPES.find(x => x.id === e.type) || CODEX_TYPES[0];
                const preview = (e.body || '').replace(/\[DM\][\s\S]*?\[\/DM\]/g, '').replace(/^##?\s/gm, '').trim().slice(0, 52);
                return (
                  <div key={e.id} className={`cx-entry-row ${selectedId === e.id ? 'active' : ''}`}
                    onClick={() => onSelect(e.id)}>
                    <div className="cx-entry-name">
                      <span style={{ color: t.color, fontSize: 9, flexShrink: 0 }}>{t.glyph}</span>
                      <span>{e.title || 'Untitled'}</span>
                    </div>
                    {preview && <div className="cx-entry-pre">{preview}…</div>}
                  </div>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="cx-hint" style={{ padding: '12px 14px' }}>
              {entries.length === 0 ? 'No notes yet.' : 'Nothing matches.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CodexEditor ───────────────────────────────────────────────────────
function CodexEditor({ entry, allEntries, entities, state, onDelete, onOpenNPC, onOpenFaction }) {
  const [title,   setTitle]   = React.useState(entry.title  || '');
  const [body,    setBody]    = React.useState(entry.body   || '');
  const [type,    setType]    = React.useState(entry.type   || 'lore');
  const [folder,  setFolder]  = React.useState(entry.folder || '');
  const [tags,    setTags]    = React.useState(entry.tags   || []);
  const [attrs,   setAttrs]   = React.useState(entry.attributes || []);
  const [tagIn,   setTagIn]   = React.useState('');
  const [attrK,   setAttrK]   = React.useState('');
  const [attrV,   setAttrV]   = React.useState('');
  const [saved,   setSaved]   = React.useState(true);
  const [preview, setPreview] = React.useState(false);
  const timer   = React.useRef(null);
  const bodyRef = React.useRef(null);

  const autosave = (field, val) => {
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      window.Store.dispatch({ type: 'CODEX_SET_FIELD', id: entry.id, field, value: val });
      setSaved(true);
    }, 480);
  };

  const immediate = (field, val) => {
    clearTimeout(timer.current);
    window.Store.dispatch({ type: 'CODEX_SET_FIELD', id: entry.id, field, value: val });
    setSaved(true);
  };

  const backlinks = React.useMemo(
    () => computeBacklinks(entry.id, title, allEntries),
    [entry.id, title, allEntries]
  );

  const detected = React.useMemo(() =>
    entities
      .filter(e => e.id !== entry.id && e.name.length > 2 &&
        (body || '').toLowerCase().includes(e.name.toLowerCase()))
      .slice(0, 10),
    [body, entities, entry.id]
  );

  const insertDM = () => {
    const ta = bodyRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = body.slice(s, e);
    const next = body.slice(0, s) + `[DM]\n${sel || ''}\n[/DM]` + body.slice(e);
    setBody(next); autosave('body', next);
  };

  const addTag = () => {
    const t = tagIn.trim();
    if (!t || tags.includes(t)) { setTagIn(''); return; }
    const next = [...tags, t]; setTags(next); setTagIn(''); immediate('tags', next);
  };
  const rmTag = t => { const next = tags.filter(x => x !== t); setTags(next); immediate('tags', next); };

  const addAttr = () => {
    if (!attrK.trim()) return;
    const next = [...attrs, { key: attrK.trim(), value: attrV.trim() }];
    setAttrs(next); setAttrK(''); setAttrV(''); immediate('attributes', next);
  };
  const rmAttr = i => { const next = attrs.filter((_, j) => j !== i); setAttrs(next); immediate('attributes', next); };

  const fi = {
    background: 'oklch(0.16 0.012 60 / 0.55)', border: '1px solid var(--hairline-2)',
    borderRadius: 'var(--r)', color: 'var(--fg)', padding: '4px 8px',
    fontSize: 11.5, outline: 'none', fontFamily: 'inherit',
  };
  const typeInfo = CODEX_TYPES.find(t => t.id === type) || CODEX_TYPES[0];

  return (
    <div className="cx-editor">
      {/* Title bar */}
      <div className="cx-head">
        <input className="cx-title" value={title} placeholder="Untitled"
          onChange={e => { setTitle(e.target.value); autosave('title', e.target.value); }} />
        <div className="row" style={{ gap: 8, flexShrink: 0, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: saved ? 'var(--fg-4)' : 'var(--brass)', fontStyle: 'italic', transition: 'color 0.3s' }}>
            {saved ? '✓ saved' : 'saving…'}
          </span>
          <button className={`tbtn ${preview ? 'brass' : ''}`} style={{ fontSize: 11.5 }}
            onClick={() => setPreview(v => !v)}>
            {preview ? '✎ Edit' : '◉ Preview'}
          </button>
          <button className="tbtn" style={{ fontSize: 11.5, color: 'var(--crimson)' }}
            onClick={() => { if (confirm('Delete this note?')) onDelete(); }}>✕</button>
        </div>
      </div>

      {/* Meta bar */}
      <div className="cx-meta">
        <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
          {CODEX_TYPES.map(t => (
            <button key={t.id} className={`tbtn ${type === t.id ? 'brass' : ''}`}
              style={{ fontSize: 10.5, padding: '3px 8px' }}
              onClick={() => { setType(t.id); immediate('type', t.id); }}>
              <span style={{ color: type === t.id ? 'inherit' : t.color, fontSize: 9 }}>{t.glyph}</span>
              {' '}{t.label}
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>Folder</span>
          <input style={{ ...fi, width: 128 }} value={folder} placeholder="e.g. Lore"
            list="cx-flist"
            onChange={e => { setFolder(e.target.value); autosave('folder', e.target.value); }} />
          <datalist id="cx-flist">{CX_FOLDERS.map(f => <option key={f} value={f} />)}</datalist>
        </div>
      </div>

      {/* Body */}
      <div className="cx-body">
        <div className="cx-write">
          {preview ? (
            <CodexPreview title={title} body={body} typeInfo={typeInfo} />
          ) : (
            <>
              <div className="cx-toolbar">
                <button className="tbtn" style={{ fontSize: 11 }} onClick={insertDM}
                  title="Wrap selected text in a DM-only block">🔒 DM block</button>
                <span className="muted" style={{ fontSize: 10 }}>
                  ## Heading · [DM]…[/DM] · entity names auto-highlight as you type
                </span>
              </div>
              <CodexBodyEditor ref={bodyRef} value={body} entities={entities}
                onChange={v => { setBody(v); autosave('body', v); }} />
            </>
          )}
          <div className="cx-tags">
            {tags.map(t => (
              <span key={t} className="cx-tag">
                {t}<button className="cx-tag-x" onClick={() => rmTag(t)}>✕</button>
              </span>
            ))}
            <input className="cx-tag-in" value={tagIn} placeholder="+ tag"
              onChange={e => setTagIn(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }} />
          </div>
        </div>

        {/* Right panel */}
        <div className="cx-right">
          <div className="cx-panel">
            <div className="cx-panel-hd">Properties</div>
            {attrs.map((a, i) => (
              <div key={i} className="cx-attr">
                <span className="cx-attr-k">{a.key}</span>
                <span className="cx-attr-v">{a.value}</span>
                <button className="cx-attr-x" onClick={() => rmAttr(i)}>✕</button>
              </div>
            ))}
            <div className="row" style={{ gap: 4, marginTop: 6 }}>
              <input style={{ ...fi, flex: 1 }} placeholder="Key" value={attrK}
                onChange={e => setAttrK(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAttr()} />
              <input style={{ ...fi, flex: 1 }} placeholder="Value" value={attrV}
                onChange={e => setAttrV(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAttr()} />
              <button className="tbtn" style={{ padding: '4px 8px', fontSize: 11 }} onClick={addAttr}>+</button>
            </div>
          </div>

          <div className="cx-panel">
            <div className="cx-panel-hd">
              Backlinks
              {backlinks.length > 0 && <span className="cx-badge">{backlinks.length}</span>}
            </div>
            {backlinks.length === 0
              ? <div className="cx-hint">No other notes mention this yet.</div>
              : backlinks.map(bl => {
                  const t = CODEX_TYPES.find(x => x.id === bl.type) || CODEX_TYPES[0];
                  return (
                    <div key={bl.id} className="cx-bl">
                      <span style={{ color: t.color, fontSize: 9, marginRight: 5 }}>{t.glyph}</span>
                      {bl.title}
                    </div>
                  );
                })
            }
          </div>

          <div className="cx-panel">
            <div className="cx-panel-hd">Detected in text</div>
            {detected.length === 0
              ? <div className="cx-hint">Entity names you write will appear here.</div>
              : detected.map(ent => {
                  const t = CODEX_TYPES.find(x => x.id === ent.kind) || CODEX_TYPES[0];
                  const clickable = ent.kind === 'person' || ent.kind === 'faction';
                  return (
                    <div key={ent.id} className="cx-bl"
                      style={{ cursor: clickable ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (ent.kind === 'person' && onOpenNPC) onOpenNPC(ent.id);
                        else if (ent.kind === 'faction' && onOpenFaction) onOpenFaction(ent.id);
                      }}>
                      <span style={{ color: t.color, fontSize: 9, marginRight: 5 }}>{t.glyph}</span>
                      {ent.name}
                      <span className="muted" style={{ fontSize: 9, marginLeft: 4 }}>{ent.kind}</span>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CodexBodyEditor — highlight overlay ──────────────────────────────
const CodexBodyEditor = React.forwardRef(function CodexBodyEditor({ value, entities, onChange }, ref) {
  const mirrorRef = React.useRef(null);

  const syncScroll = () => {
    if (mirrorRef.current && ref && ref.current) {
      mirrorRef.current.scrollTop  = ref.current.scrollTop;
      mirrorRef.current.scrollLeft = ref.current.scrollLeft;
    }
  };

  const html = React.useMemo(() => buildHighlight(value, entities), [value, entities]);

  return (
    <div className="cx-wrap">
      <div ref={mirrorRef} className="cx-mirror" aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: html }} />
      <textarea ref={ref} className="cx-area" value={value} spellCheck={true}
        onChange={e => onChange(e.target.value)} onScroll={syncScroll} />
    </div>
  );
});

// ── CodexPreview ──────────────────────────────────────────────────────
function CodexPreview({ title, body, typeInfo }) {
  const segments = [];
  let rest = body || '';
  while (rest.length) {
    const ds = rest.indexOf('[DM]'), de = rest.indexOf('[/DM]');
    if (ds !== -1 && de !== -1 && ds < de) {
      if (ds > 0) segments.push({ dm: false, text: rest.slice(0, ds) });
      segments.push({ dm: true, text: rest.slice(ds + 4, de) });
      rest = rest.slice(de + 5);
    } else { segments.push({ dm: false, text: rest }); rest = ''; }
  }

  const renderLines = (text, pfx) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <div key={pfx + i} className="cx-pv-h2">{line.slice(3)}</div>;
      if (line.startsWith('# '))  return <div key={pfx + i} className="cx-pv-h1">{line.slice(2)}</div>;
      if (!line.trim()) return <div key={pfx + i} style={{ height: 6 }} />;
      return <div key={pfx + i} className="cx-pv-line">{line}</div>;
    });

  return (
    <div className="cx-preview">
      <div className="cx-pv-eyebrow" style={{ color: typeInfo.color }}>{typeInfo.glyph} {typeInfo.label}</div>
      <div className="cx-pv-title display">{title || 'Untitled'}</div>
      <div style={{ height: 16 }} />
      {segments.map((seg, i) =>
        seg.dm ? (
          <div key={i} className="cx-pv-dm">
            <span className="cx-pv-dm-badge">DM only</span>
            {renderLines(seg.text, `d${i}-`)}
          </div>
        ) : renderLines(seg.text, `p${i}-`)
      )}
    </div>
  );
}

// ── CodexWelcome ──────────────────────────────────────────────────────
function CodexWelcome({ onNew, count }) {
  return (
    <div className="cx-welcome">
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 64, opacity: 0.15, lineHeight: 1 }}>❦</div>
      <div className="display" style={{ fontSize: 26, color: 'var(--fg-2)' }}>
        {count === 0 ? 'Your world awaits.' : 'Select a note or create a new one.'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--fg-3)', maxWidth: 380, lineHeight: 1.7, textAlign: 'center' }}>
        Write lore, session notes, mysteries, prophecies.
        Entity names you mention are automatically highlighted as you type — no manual linking needed.
      </div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
        {CODEX_TYPES.map(t => (
          <button key={t.id} className="tbtn" onClick={() => onNew(t.id)} style={{ fontSize: 12 }}>
            <span style={{ color: t.color }}>{t.glyph}</span> {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { WorldCodex });
