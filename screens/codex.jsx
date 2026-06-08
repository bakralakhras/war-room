// World Codex — DM-only campaign bible with auto-linking, backlinks, templates, folders.

// ── Constants ─────────────────────────────────────────────────────────
const CODEX_TYPES = [
  { id: 'lore',      label: 'Lore',      glyph: '❦',  color: 'var(--brass)' },
  { id: 'history',   label: 'History',   glyph: '◇',  color: 'var(--brass-dim)' },
  { id: 'character', label: 'Character', glyph: '◐',  color: 'var(--brass)' },
  { id: 'place',     label: 'Place',     glyph: '◇',  color: 'var(--slate)' },
  { id: 'faction',   label: 'Faction',   glyph: '✦',  color: 'var(--crimson)' },
  { id: 'mystery',   label: 'Mystery',   glyph: '☽',  color: 'var(--slate)' },
  { id: 'prophecy',  label: 'Prophecy',  glyph: '✧',  color: 'var(--slate)' },
  { id: 'religion',  label: 'Religion',  glyph: '✶',  color: 'var(--slate)' },
  { id: 'relic',     label: 'Relic',     glyph: '◈',  color: 'var(--brass)' },
  { id: 'secret',    label: 'Secret',    glyph: '◆',  color: 'var(--crimson)' },
  { id: 'quest',     label: 'Quest',     glyph: '⚔',  color: 'var(--slate)' },
  { id: 'session',   label: 'Session',   glyph: '◈',  color: 'var(--amber)' },
];

const CODEX_TEMPLATES = {
  lore:
`## Overview


## History


## Significance


## Keeper Notes
`,
  character:
`## Voice & Manner


## Motivation


## What They're Hiding


## Key Relationships


## Notes
`,
  place:
`## First Impression


## Atmosphere


## Who's Here


## What's Hidden


## History
`,
  faction:
`## Core Belief


## Leadership


## Goals


## Secrets


## Resources
`,
  mystery:
`## What Players Know


## What Actually Happened


## Clues Available


## Threads
`,
  prophecy:
`## The Prophecy


## True Meaning


## How It Was Delivered


## Fulfillment Conditions
`,
  session:
`## What Happened


## Player Actions


## World Changes


## Keeper Notes


## Next Session Setup
`,
  history:
`## Canon


## Timeline


## Who still cares


## Keeper notes
`,
  religion:
`## Doctrine


## Rites & taboos


## Important faithful


## Keeper notes
`,
  relic:
`## Description


## Powers, costs, tells


## Current holder


## Keeper notes
`,
  secret:
`## Surface truth


## Real truth


## Clues


## Consequences if revealed
`,
  quest:
`## Hook


## Next actionable step


## Stakes


## Keeper notes
`,
};

const CX_FOLDERS = ['Lore', 'Characters', 'Locations', 'Factions', 'Relics', 'Session Notes', 'Mysteries', 'Secrets', 'Quests'];

// ── Utilities ─────────────────────────────────────────────────────────

function collectEntities(state) {
  const ents = [];
  (state.npcs || []).forEach(n => { if (n.name) ents.push({ id: n.id, name: n.name, kind: 'person', source: 'npc', sub: n.title || n.faction || '' }); });
  (state.factions || []).forEach(f => { if (f.name) ents.push({ id: f.id, name: f.name, kind: 'faction', source: 'faction', sub: f.ideology || f.leader || '' }); });
  (state.locations || []).forEach(l => {
    const nm = l.label || l.name;
    if (nm) ents.push({ id: l.id, name: nm, kind: 'place', source: 'location', sub: l.region || l.kind || '' });
  });
  (state.relics || []).forEach(r => { if (r.name) ents.push({ id: r.id, name: r.name, kind: 'relic', source: 'relic', sub: r.type || r.kind || '' }); });
  (state.religions || []).forEach(r => { if (r.name) ents.push({ id: r.id, name: r.name, kind: 'religion', source: 'religion', sub: r.kind || '' }); });
  (state.lore || []).forEach(l => { if (l.name) ents.push({ id: l.id, name: l.name, kind: 'history', source: 'lore', sub: l.kind || '' }); });
  (state.secrets || []).forEach(s => { if (s.title) ents.push({ id: s.id, name: s.title, kind: 'secret', source: 'secret', sub: s.status || s.weight || '' }); });
  (state.quests || []).forEach(q => { if (q.title) ents.push({ id: q.id, name: q.title, kind: 'quest', source: 'quest', sub: q.state || q.arc || '' }); });
  (state.sessions || []).forEach(s => { if (s.title) ents.push({ id: s.id, name: s.title, kind: 'session', source: 'session', sub: `Session ${s.number || ''}`.trim() }); });
  (state.codex || []).forEach(e => { if (e.title) ents.push({ id: e.id, name: e.title, kind: e.type || 'lore', source: 'codex', sub: e.folder || '' }); });
  return ents.filter(e => e.name && e.name.length > 2);
}

function entityTypeInfo(kind) {
  if (kind === 'person') return CODEX_TYPES.find(t => t.id === 'character') || CODEX_TYPES[0];
  return CODEX_TYPES.find(t => t.id === kind) || CODEX_TYPES[0];
}

function openCodexEntity(ent, handlers) {
  if (!ent) return;
  if (ent.source === 'npc' && handlers.onOpenNPC) handlers.onOpenNPC(ent.id);
  else if (ent.source === 'faction' && handlers.onOpenFaction) handlers.onOpenFaction(ent.id);
  else if (ent.source === 'secret' && handlers.onOpenSecret) handlers.onOpenSecret(ent.id);
  else if (ent.source === 'location' && handlers.onNav) handlers.onNav('maps', { highlight: ent.id });
  else if (ent.source === 'quest' && handlers.onNav) handlers.onNav('quests', { highlight: ent.id });
  else if ((ent.source === 'relic' || ent.source === 'religion' || ent.source === 'lore') && handlers.onNav) {
    const codexId = 'codex-' + ent.id;
    handlers.onNav('codex', { highlight: codexId });
  } else if (ent.source === 'codex' && handlers.onSelect) {
    handlers.onSelect(ent.id);
  }
}

function folderForCodexType(type) {
  const map = {
    character: 'Characters',
    place: 'Locations',
    faction: 'Factions',
    relic: 'Relics',
    session: 'Session Notes',
    mystery: 'Mysteries',
    prophecy: 'Mysteries',
    secret: 'Secrets',
    quest: 'Quests',
    religion: 'Lore',
    history: 'Lore',
    lore: 'Lore',
  };
  return map[type] || 'Lore';
}

function computeBacklinks(entryId, entryTitle, allEntries) {
  if (!entryTitle || entryTitle.length < 2) return [];
  const title = entryTitle.toLowerCase();
  const wiki = `[[${title}]]`;
  return allEntries
    .filter(e => e.id !== entryId && e.body)
    .filter(e => {
      const body = e.body.toLowerCase();
      return body.includes(title) || body.includes(wiki);
    })
    .map(e => ({ id: e.id, title: e.title, type: e.type }));
}

function findCampaignThreads(entry, state) {
  const haystack = `${entry.title || ''}\n${entry.body || ''}`.toLowerCase();
  const mentions = (value) => value && haystack.includes(String(value).toLowerCase());
  const rows = [];

  (state.secrets || []).forEach(s => {
    if (mentions(s.title) || (s.relates || []).some(mentions)) {
      rows.push({ id: s.id, kind: 'secret', title: s.title, meta: s.status || s.weight, source: 'secret' });
    }
  });
  (state.quests || []).forEach(q => {
    if (mentions(q.title) || mentions(q.giver) || mentions(q.next) || mentions(q.stakes)) {
      rows.push({ id: q.id, kind: 'quest', title: q.title, meta: q.state || q.arc, source: 'quest' });
    }
  });
  (state.rumors || []).forEach(r => {
    if (mentions(r.text) || mentions(r.source) || (r.relates || []).some(mentions)) {
      rows.push({ id: r.id, kind: 'lore', title: r.text, meta: r.delivered ? 'delivered rumor' : 'undelivered rumor', source: 'rumor' });
    }
  });
  (state.prep || []).forEach(p => {
    if (mentions(p.title) || mentions(p.note)) {
      rows.push({ id: p.id, kind: 'session', title: p.title, meta: p.done ? 'done prep' : 'open prep', source: 'prep' });
    }
  });

  return rows.slice(0, 8);
}

// Build highlighted HTML — entity auto-links and headers.
function stripLegacyDmTags(text) {
  return String(text || '').replace(/\[\/?DM\]/g, '').replace(/\n{4,}/g, '\n\n\n');
}

function buildHighlight(text, entities) {
  let out = stripLegacyDmTags(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Headers
  out = out.replace(/^(## .+)$/gm, '<span class="cx-h2">$1</span>');
  out = out.replace(/^(# .+)$/gm,  '<span class="cx-h1">$1</span>');
  out = out.replace(/\[\[([^\]]+)\]\]/g, '<mark class="cx-link cx-wiki">[[$1]]</mark>');
  out = out.replace(/==([^=\n](?:.*?[^=\n])?)==/g, '<mark class="cx-user-highlight">==$1==</mark>');

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
function WorldCodex({ state, onNav, onOpenNPC, onOpenFaction, onOpenSecret, highlight }) {
  const entries  = React.useMemo(() => state.codex || [], [state.codex]);
  const entities = React.useMemo(() => collectEntities(state), [state]);

  const [selectedId,   setSelectedId]   = React.useState(() => entries[0]?.id || null);
  const [search,       setSearch]       = React.useState('');
  const [folderFilter, setFolderFilter] = React.useState(null);
  const [sidebarOpen,  setSidebarOpen]  = React.useState(true);

  React.useEffect(() => {
    if (highlight) {
      const found = entries.find(e => e.id === highlight);
      if (found) setSelectedId(found.id);
    }
  }, [highlight]);

  const allFolders = React.useMemo(() => {
    const s = new Set(state.codexFolders || CX_FOLDERS);
    entries.forEach(e => { if (e.folder) s.add(e.folder); });
    return [...s];
  }, [entries, state.codexFolders]);

  const filtered = React.useMemo(() => entries.filter(e => {
    if (folderFilter === '__uncat__') return !e.folder;
    if (folderFilter && e.folder !== folderFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (e.title || '').toLowerCase().includes(q) || (e.body || '').toLowerCase().includes(q);
    }
    return true;
  }), [entries, folderFilter, search]);

  const createNew = (type = 'lore', folderOverride = null) => {
    const folder = folderOverride !== null
      ? folderOverride
      : (folderFilter && folderFilter !== '__uncat__') ? folderFilter : folderForCodexType(type);
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

  const addFolder = (name) => {
    window.Store.dispatch({ type: 'CODEX_FOLDER_ADD', name });
    setFolderFilter(name);
  };

  const renameFolder = (from, to) => {
    window.Store.dispatch({ type: 'CODEX_FOLDER_RENAME', from, to });
    if (folderFilter === from) setFolderFilter(to);
  };

  const deleteFolder = (name) => {
    window.Store.dispatch({ type: 'CODEX_FOLDER_REMOVE', name });
    if (folderFilter === name) setFolderFilter(null);
  };

  const selectedEntry = entries.find(e => e.id === selectedId);

  return (
    <div className={`cx-shell ${sidebarOpen ? '' : 'notes-closed'}`}>
      {sidebarOpen ? (
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
          onAddFolder={addFolder}
          onRenameFolder={renameFolder}
          onDeleteFolder={deleteFolder}
          onToggleSidebar={() => setSidebarOpen(false)}
        />
      ) : (
        <button className="cx-notes-tab" onClick={() => setSidebarOpen(true)}>Notes</button>
      )}
      {selectedEntry ? (
        <CodexEditor
          key={selectedEntry.id}
          entry={selectedEntry}
          allEntries={entries}
          entities={entities}
          state={state}
          onSelect={setSelectedId}
          onNav={onNav}
          onDelete={() => {
            window.Store.dispatch({ type: 'CODEX_REMOVE', id: selectedEntry.id });
            const rem = entries.filter(e => e.id !== selectedEntry.id);
            setSelectedId(rem[0]?.id || null);
          }}
          onOpenNPC={onOpenNPC}
          onOpenFaction={onOpenFaction}
          onOpenSecret={onOpenSecret}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
        />
      ) : (
        <CodexWelcome onNew={createNew} count={entries.length} />
      )}
    </div>
  );
}

// ── CodexSidebar ──────────────────────────────────────────────────────
function CodexSidebar({ entries, filtered, selectedId, onSelect, search, setSearch, folderFilter, setFolderFilter, allFolders, onNew, onAddFolder, onRenameFolder, onDeleteFolder, onToggleSidebar }) {
  const [newMenu, setNewMenu] = React.useState(false);
  const [addingFolder, setAddingFolder] = React.useState(false);
  const [folderDraft, setFolderDraft] = React.useState('');
  const [editingFolder, setEditingFolder] = React.useState(null);
  const [editingDraft, setEditingDraft] = React.useState('');
  const [armedFolder, setArmedFolder] = React.useState(null);
  const [collapsedGroups, setCollapsedGroups] = React.useState({});
  const uncatCount = entries.filter(e => !e.folder).length;

  const submitFolder = () => {
    const name = folderDraft.trim();
    if (!name) return;
    onAddFolder(name);
    setFolderDraft('');
    setAddingFolder(false);
  };

  const submitRename = (from) => {
    const name = editingDraft.trim();
    if (!name || name === from) { setEditingFolder(null); return; }
    onRenameFolder(from, name);
    setEditingFolder(null);
    setEditingDraft('');
  };

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

  const toggleGroup = (folder) => {
    const key = folder || '__uncat__';
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="cx-sidebar">
      <div className="cx-sidebar-top">
        <div className="cx-sidebar-actions">
          <button className="tbtn" title="Collapse notes" onClick={onToggleSidebar}>Notes</button>
          <button className="tbtn brass" style={{ width: '100%', justifyContent: 'center', fontSize: 11.5 }}
            onClick={() => setNewMenu(v => !v)}>
            <Icon.Plus /> New Note
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          {newMenu && (
            <div className="cx-new-menu">
              {allFolders.map(f => (
                <button key={f} className="cx-new-opt"
                  onClick={() => { onNew('lore', f); setNewMenu(false); setFolderFilter(f); }}>
                  <span style={{ color: 'var(--brass)', width: 14, textAlign: 'center', fontSize: 10 }}>+</span>
                  {f}
                </button>
              ))}
              <button className="cx-new-opt"
                onClick={() => { onNew('lore', ''); setNewMenu(false); setFolderFilter('__uncat__'); }}>
                <span style={{ color: 'var(--fg-4)', width: 14, textAlign: 'center', fontSize: 10 }}>+</span>
                Uncategorized
              </button>
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
          <div className="cx-tree-label cx-tree-label-row">
            <span>Folders</span>
            <button className="cx-icon-btn" title="New folder" onClick={() => setAddingFolder(v => !v)}>+</button>
          </div>
          {addingFolder && (
            <div className="cx-folder-edit">
              <input value={folderDraft} placeholder="Folder name" autoFocus
                onChange={e => setFolderDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') submitFolder();
                  if (e.key === 'Escape') { setAddingFolder(false); setFolderDraft(''); }
                }} />
              <button onClick={submitFolder}>Add</button>
            </div>
          )}
          <div className={`cx-folder-row ${!folderFilter ? 'active' : ''}`} onClick={() => setFolderFilter(null)}>
            <span>All notes</span><span className="cx-count">{entries.length}</span>
          </div>
          {allFolders.map(f => {
            const cnt = entries.filter(e => e.folder === f).length;
            return (
              <div key={f} className={`cx-folder-row cx-folder-managed ${folderFilter === f ? 'active' : ''}`}
                onClick={() => editingFolder ? null : setFolderFilter(folderFilter === f ? null : f)}>
                {editingFolder === f ? (
                  <input className="cx-folder-rename" value={editingDraft} autoFocus
                    onClick={e => e.stopPropagation()}
                    onChange={e => setEditingDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitRename(f);
                      if (e.key === 'Escape') { setEditingFolder(null); setEditingDraft(''); }
                    }}
                    onBlur={() => submitRename(f)} />
                ) : (
                  <span className="cx-folder-name">{f}</span>
                )}
                <span className="cx-folder-tools" onClick={e => e.stopPropagation()}>
                  <span className="cx-count">{cnt}</span>
                  <button className="cx-icon-btn" title="Rename folder"
                    onClick={() => { setEditingFolder(f); setEditingDraft(f); setArmedFolder(null); }}>...</button>
                  <button className={`cx-icon-btn ${armedFolder === f ? 'danger' : ''}`} title="Delete folder"
                    onClick={() => {
                      if (armedFolder === f) { onDeleteFolder(f); setArmedFolder(null); }
                      else setArmedFolder(f);
                    }}>
                    {armedFolder === f ? '!' : 'x'}
                  </button>
                </span>
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
          {groups.map(({ folder, items }) => {
            const key = folder || '__uncat__';
            const collapsed = !!collapsedGroups[key];
            return (
              <div key={key} className="cx-note-group">
                <button className="cx-group-header" onClick={() => toggleGroup(folder)}>
                  <span className={`cx-caret ${collapsed ? '' : 'open'}`}>�</span>
                  <span>{folder || 'Uncategorized'}</span>
                  <span className="cx-count">{items.length}</span>
                </button>
                {!collapsed && items.map(e => {
                  const t = CODEX_TYPES.find(x => x.id === e.type) || CODEX_TYPES[0];
                  const preview = (e.body || '').replace(/\[DM\][\s\S]*?\[\/DM\]/g, '').replace(/^##?\s/gm, '').trim().slice(0, 52);
                  return (
                    <div key={e.id} className={`cx-entry-row ${selectedId === e.id ? 'active' : ''}`}
                      onClick={() => onSelect(e.id)}>
                      <div className="cx-entry-name">
                        <span style={{ color: t.color, fontSize: 9, flexShrink: 0 }}>{t.glyph}</span>
                        <span>{e.title || 'Untitled'}</span>
                      </div>
                      {preview && <div className="cx-entry-pre">{preview}...</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
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
function CodexEditor({ entry, allEntries, entities, state, onDelete, onSelect, onNav, onOpenNPC, onOpenFaction, onOpenSecret, sidebarOpen, onToggleSidebar }) {
  const [title,   setTitle]   = React.useState(entry.title  || '');
  const [body,    setBody]    = React.useState(stripLegacyDmTags(entry.body));
  const [type,    setType]    = React.useState(entry.type   || 'lore');
  const [folder,  setFolder]  = React.useState(entry.folder || '');
  const [tags,    setTags]    = React.useState(entry.tags   || []);
  const [attrs,   setAttrs]   = React.useState(entry.attributes || []);
  const [image,   setImage]   = React.useState(entry.image || '');
  const [imageSourceUrl, setImageSourceUrl] = React.useState(entry.imageSourceUrl || '');
  const [imageCredit, setImageCredit] = React.useState(entry.imageCredit || '');
  const [tagIn,   setTagIn]   = React.useState('');
  const [attrK,   setAttrK]   = React.useState('');
  const [attrV,   setAttrV]   = React.useState('');
  const [saved,   setSaved]   = React.useState(true);
  const [mode,    setMode]    = React.useState('write');
  const [inspectorOpen, setInspectorOpen] = React.useState(false);
  const [mediaOpen, setMediaOpen] = React.useState(false);
  const [deleteArmed, setDeleteArmed] = React.useState(false);
  const timers  = React.useRef({});
  const bodyRef = React.useRef(null);
  const imageFileRef = React.useRef(null);

  const clearFieldTimer = (field) => {
    if (!timers.current[field]) return;
    clearTimeout(timers.current[field]);
    delete timers.current[field];
  };

  const clearAllTimers = () => {
    Object.keys(timers.current).forEach(clearFieldTimer);
  };

  React.useEffect(() => () => clearAllTimers(), []);

  const autosave = (field, val) => {
    setSaved(false);
    clearFieldTimer(field);
    timers.current[field] = setTimeout(() => {
      window.Store.dispatch({ type: 'CODEX_SET_FIELD', id: entry.id, field, value: val });
      delete timers.current[field];
      setSaved(Object.keys(timers.current).length === 0);
    }, 480);
  };

  const immediate = (field, val) => {
    clearFieldTimer(field);
    window.Store.dispatch({ type: 'CODEX_SET_FIELD', id: entry.id, field, value: val });
    setSaved(Object.keys(timers.current).length === 0);
  };

  const deleteNote = () => {
    clearAllTimers();
    onDelete();
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
  const campaignThreads = React.useMemo(() => findCampaignThreads({ ...entry, title, body }, state), [entry, title, body, state]);
  const handlers = { onSelect, onNav, onOpenNPC, onOpenFaction, onOpenSecret };

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

  const readHeroImage = (file) => {
    if (!file || !String(file.type || '').startsWith('image/')) return;
    readCodexAsset(file, (value) => {
      setImage(value);
      setImageSourceUrl('');
      immediate('image', value);
      immediate('imageSourceUrl', '');
      if (imageFileRef.current) imageFileRef.current.value = '';
    });
  };

  const fi = {
    background: 'oklch(0.16 0.012 60 / 0.55)', border: '1px solid var(--hairline-2)',
    borderRadius: 'var(--r)', color: 'var(--fg)', padding: '4px 8px',
    fontSize: 11.5, outline: 'none', fontFamily: 'inherit',
  };
  const typeInfo = CODEX_TYPES.find(t => t.id === type) || CODEX_TYPES[0];
  const modes = [
    { id: 'write', label: 'Write' },
    { id: 'split', label: 'Split' },
    { id: 'preview', label: 'Preview' },
  ];

  const updateBody = (next) => {
    setBody(next);
    autosave('body', next);
  };

  const insertSnippet = (before, after = '', fallback = '') => {
    const node = bodyRef.current;
    if (!node) {
      updateBody(`${body}${before}${fallback}${after}`);
      return;
    }
    const start = node.selectionStart ?? body.length;
    const end = node.selectionEnd ?? start;
    const selected = body.slice(start, end) || fallback;
    const next = body.slice(0, start) + before + selected + after + body.slice(end);
    updateBody(next);
    requestAnimationFrame(() => {
      node.focus();
      const cursorStart = start + before.length;
      const cursorEnd = cursorStart + selected.length;
      node.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const copyWikiLink = async () => {
    const link = `[[${(title || 'Untitled').trim()}]]`;
    try {
      await navigator.clipboard?.writeText(link);
      setSaved(true);
    } catch {
      insertSnippet(link);
    }
  };

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
          <button className={`tbtn ${sidebarOpen ? 'brass' : ''}`} style={{ fontSize: 11.5 }}
            onClick={onToggleSidebar}>
            Notes
          </button>
          <div className="cx-mode-switch" role="group" aria-label="Codex view mode">
            {modes.map(m => (
              <button key={m.id} className={`tbtn ${mode === m.id ? 'brass' : ''}`} style={{ fontSize: 11.5 }}
                onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          <button className="tbtn" style={{ fontSize: 11.5 }}
            onClick={copyWikiLink}>
            Copy link
          </button>
          <button className={`tbtn ${inspectorOpen ? 'brass' : ''}`} style={{ fontSize: 11.5 }}
            onClick={() => setInspectorOpen(v => !v)}>
            Inspector
          </button>
          <button className={`tbtn ${deleteArmed ? 'danger' : ''}`} style={{ fontSize: 11.5 }}
            onClick={() => deleteArmed ? deleteNote() : setDeleteArmed(true)}>
            {deleteArmed ? 'Confirm delete' : 'Delete note'}
          </button>
          {deleteArmed && (
            <button className="tbtn" style={{ fontSize: 11.5 }}
              onClick={() => setDeleteArmed(false)}>
              Cancel
            </button>
          )}
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
        <div className={`cx-write cx-mode-${mode}`}>
          {(mode === 'write' || mode === 'split') && (
            <div className="cx-main-pane cx-editor-pane">
              {image && (
                <div className="cx-hero-strip">
                  <img src={image} alt={title || 'Codex hero'} />
                  <CodexImageCredit credit={imageCredit} sourceUrl={imageSourceUrl} />
                </div>
              )}
              <div className="cx-toolbar">
                <div className="cx-tool-group" aria-label="Formatting tools">
                  <button className="tbtn" onClick={() => insertSnippet('## ', '', 'Heading')}>H2</button>
                  <button className="tbtn" onClick={() => insertSnippet('- ', '', 'List item')}>List</button>
                  <button className="tbtn" onClick={() => insertSnippet('> ', '', 'Quoted note')}>Quote</button>
                  <button className="tbtn" onClick={() => insertSnippet('[[', ']]', title || 'Linked page')}>Link</button>
                  <button className="tbtn" title="Highlight selection (Ctrl+Shift+H)" onClick={() => insertSnippet('==', '==', 'Highlighted text')}>Highlight</button>
                  <button className="tbtn" onClick={() => insertSnippet('\n## Scene\n\n## Clues\n\n## Open Questions\n', '', '')}>Session</button>
                </div>
                <span className="muted cx-toolbar-note">
                  Entity names auto-highlight. Use [[Note title]] for links, ==text== for highlights.
                </span>
              </div>
              <CodexBodyEditor ref={bodyRef} value={body} entities={entities}
                onChange={updateBody} onHighlightShortcut={() => insertSnippet('==', '==', 'Highlighted text')} />
            </div>
          )}

          {(mode === 'split' || mode === 'preview') && (
            <div className="cx-main-pane cx-preview-pane">
              <CodexPreview title={title} body={body} typeInfo={typeInfo} image={image} imageCredit={imageCredit} imageSourceUrl={imageSourceUrl} />
            </div>
          )}

          <div className="cx-tags">
            {tags.map(t => (
              <span key={t} className="cx-tag">
                {t}<button className="cx-tag-x" onClick={() => rmTag(t)}>x</button>
              </span>
            ))}
            <input className="cx-tag-in" value={tagIn} placeholder="+ tag"
              onChange={e => setTagIn(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }} />
          </div>
        </div>
        {/* Right panel */}
        {inspectorOpen && (
        <div className="cx-right">
          <div className="cx-panel cx-note-controls cx-media-panel">
            <button className="cx-panel-toggle" onClick={() => setMediaOpen(v => !v)}>
              <span>Media</span>
              <span>{image ? 'image attached' : 'optional'}</span>
            </button>
            <input ref={imageFileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => readHeroImage(e.target.files?.[0])} />
            {image && !mediaOpen && (
              <button className="cx-media-thumb" onClick={() => setMediaOpen(true)}>
                <img src={image} alt="" />
              </button>
            )}
            {mediaOpen && (
              <>
                {image && <div className="cx-image-drop"><img src={image} alt="" /></div>}
                <div className="cx-control-stack" style={{ marginTop: 8 }}>
                  <button className="tbtn brass" onClick={() => imageFileRef.current?.click()}>Upload image</button>
                  {image && <button className="tbtn" onClick={() => { setImage(''); immediate('image', ''); }}>Clear image</button>}
                </div>
                <div className="cx-image-fields">
                  <input style={fi} value={image} placeholder="Image URL / Pinterest image address"
                    onChange={e => { setImage(e.target.value); autosave('image', e.target.value); }} />
                  <input style={fi} value={imageSourceUrl} placeholder="Pinterest/source page URL"
                    onChange={e => { setImageSourceUrl(e.target.value); autosave('imageSourceUrl', e.target.value); }} />
                  <input style={fi} value={imageCredit} placeholder="Credit / artist / board"
                    onChange={e => { setImageCredit(e.target.value); autosave('imageCredit', e.target.value); }} />
                </div>
              </>
            )}
          </div>

          <div className="cx-panel cx-note-controls">
            <div className="cx-panel-hd">Note controls</div>
            <div className="cx-control-stack">
              {modes.map(m => (
                <button key={m.id} className={`tbtn ${mode === m.id ? 'brass' : ''}`} onClick={() => setMode(m.id)}>
                  {m.label}
                </button>
              ))}
              <button className="tbtn" onClick={copyWikiLink}>
                Copy [[link]]
              </button>
              <button className={`tbtn ${deleteArmed ? 'danger' : ''}`}
                onClick={() => deleteArmed ? deleteNote() : setDeleteArmed(true)}>
                {deleteArmed ? 'Confirm delete' : 'Delete note'}
              </button>
              {deleteArmed && (
                <button className="tbtn" onClick={() => setDeleteArmed(false)}>
                  Keep note
                </button>
              )}
            </div>
            <div className="cx-hint" style={{ padding: '8px 0 0' }}>
              Edits autosave. Delete needs a second click so a stray hand does not burn the page.
            </div>
          </div>

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
                    <div key={bl.id} className="cx-bl"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelect(bl.id)}>
                      <span style={{ color: t.color, fontSize: 9, marginRight: 5 }}>{t.glyph}</span>
                      {bl.title}
                    </div>
                  );
                })
            }
          </div>

          <div className="cx-panel">
            <div className="cx-panel-hd">Campaign links</div>
            {detected.length === 0
              ? <div className="cx-hint">Mention NPCs, factions, places, relics, secrets, or quests and they become jump links here.</div>
              : detected.map(ent => {
                  const t = entityTypeInfo(ent.kind);
                  return (
                    <div key={ent.id} className="cx-bl"
                      style={{ cursor: 'pointer' }}
                      onClick={() => openCodexEntity(ent, handlers)}>
                      <span style={{ color: t.color, fontSize: 9, marginRight: 5 }}>{t.glyph}</span>
                      {ent.name}
                      <span className="muted" style={{ fontSize: 9, marginLeft: 4 }}>{ent.source}</span>
                    </div>
                  );
                })
            }
          </div>

          <div className="cx-panel">
            <div className="cx-panel-hd">
              Live threads
              {campaignThreads.length > 0 && <span className="cx-badge">{campaignThreads.length}</span>}
            </div>
            {campaignThreads.length === 0
              ? <div className="cx-hint">Secrets, quests, rumors, and prep that mention this page will gather here.</div>
              : campaignThreads.map(row => {
                  const t = entityTypeInfo(row.kind);
                  return (
                    <div key={`${row.source}-${row.id}`} className="cx-bl"
                      style={{ cursor: row.source === 'secret' || row.source === 'quest' ? 'pointer' : 'default' }}
                      onClick={() => openCodexEntity({ ...row, name: row.title }, handlers)}>
                      <span style={{ color: t.color, fontSize: 9, marginRight: 5 }}>{t.glyph}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>{row.title}</span>
                      <span className="muted" style={{ fontSize: 9, marginLeft: 4 }}>{row.meta}</span>
                    </div>
                  );
                })
            }
          </div>

          <div className="cx-panel">
            <div className="cx-panel-hd">Keeper actions</div>
            <button className="tbtn" style={{ width: '100%', justifyContent: 'center', fontSize: 11.5, marginBottom: 6 }}
              onClick={() => window.Store.dispatch({ type: 'PREP_ADD', kind: 'lore', title: title || 'Codex follow-up', note: `Review codex page: ${title || entry.id}` })}>
              Send to prep
            </button>
            <button className="tbtn" style={{ width: '100%', justifyContent: 'center', fontSize: 11.5 }}
              onClick={() => window.Store.dispatch({ type: 'SECRET_ADD', title: `${title || 'Codex'} truth`, weight: 'Lore', revealsTo: `When ${title || 'this lore'} matters at the table.`, relates: [entry.id] })}>
              Seal as secret
            </button>
          </div>
        </div>
        )}
    </div>
      </div>
  );
}

// ── CodexBodyEditor — highlight overlay ──────────────────────────────
const CodexBodyEditor = React.forwardRef(function CodexBodyEditor({ value, entities, onChange, onHighlightShortcut }, ref) {
  const mirrorRef = React.useRef(null);

  const syncScroll = () => {
    if (mirrorRef.current && ref && ref.current) {
      mirrorRef.current.scrollTop  = ref.current.scrollTop;
      mirrorRef.current.scrollLeft = ref.current.scrollLeft;
    }
  };

  const html = React.useMemo(() => buildHighlight(value, entities), [value, entities]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      onHighlightShortcut?.();
    }
  };

  return (
    <div className="cx-wrap">
      <div ref={mirrorRef} className="cx-mirror" aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: html }} />
      <textarea ref={ref} className="cx-area" value={value} spellCheck={true}
        onChange={e => onChange(e.target.value)} onScroll={syncScroll} onKeyDown={handleKeyDown} />
    </div>
  );
});

// ── CodexPreview ──────────────────────────────────────────────────────
function CodexPreview({ title, body, typeInfo, image, imageCredit, imageSourceUrl }) {
  const cleanBody = stripLegacyDmTags(body);
  const renderInline = (line, keyPrefix) => {
    const parts = String(line).split(/(\[\[[^\]]+\]\]|==[^=\n](?:.*?[^=\n])?==)/g).filter(Boolean);
    return parts.map((part, i) => {
      const match = part.match(/^\[\[([^\]]+)\]\]$/);
      if (match) return <span key={`${keyPrefix}-w-${i}`} className="cx-pv-wiki">{match[1]}</span>;
      const highlight = part.match(/^==(.+)==$/);
      if (highlight) return <mark key={`${keyPrefix}-h-${i}`} className="cx-pv-highlight">{highlight[1]}</mark>;
      return <React.Fragment key={`${keyPrefix}-t-${i}`}>{part}</React.Fragment>;
    });
  };
  const renderLines = (text, pfx) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <div key={pfx + i} className="cx-pv-h2">{line.slice(3)}</div>;
      if (line.startsWith('# '))  return <div key={pfx + i} className="cx-pv-h1">{line.slice(2)}</div>;
      if (!line.trim()) return <div key={pfx + i} style={{ height: 6 }} />;
      if (line.startsWith('- ')) return <div key={pfx + i} className="cx-pv-line cx-pv-list">{renderInline(line.slice(2), pfx + i)}</div>;
      if (line.startsWith('> ')) return <div key={pfx + i} className="cx-pv-line cx-pv-quote">{renderInline(line.slice(2), pfx + i)}</div>;
      return <div key={pfx + i} className="cx-pv-line">{renderInline(line, pfx + i)}</div>;
    });

  return (
    <div className="cx-preview">
      {image && (
        <div className="cx-pv-hero">
          <img src={image} alt={title || 'Codex hero'} />
          <CodexImageCredit credit={imageCredit} sourceUrl={imageSourceUrl} />
        </div>
      )}
      <div className="cx-pv-eyebrow" style={{ color: typeInfo.color }}>{typeInfo.glyph} {typeInfo.label}</div>
      <div className="cx-pv-title display">{title || 'Untitled'}</div>
      <div style={{ height: 16 }} />
      {renderLines(cleanBody, 'p')}
    </div>
  );
}

function CodexImageCredit({ credit, sourceUrl }) {
  if (!credit && !sourceUrl) return null;
  return (
    <div className="image-credit">
      {credit && <span>{credit}</span>}
      {sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer">source</a>}
    </div>
  );
}

function readCodexAsset(file, onReady) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxSide = 1500;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return onReady(reader.result);
      ctx.drawImage(img, 0, 0, width, height);
      onReady(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => onReady(reader.result);
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
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
