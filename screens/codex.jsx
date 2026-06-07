// World Codex — DM-only campaign bible with auto-linking, backlinks, templates, folders.

// ── Constants ─────────────────────────────────────────────────────────
const CODEX_TYPES = [
  { id: 'lore',      label: 'Lore',      glyph: '❦',  color: 'var(--brass)' },
  { id: 'history',   label: 'History',   glyph: '◇',  color: 'oklch(0.74 0.08 85)' },
  { id: 'character', label: 'Character', glyph: '◐',  color: 'var(--brass)' },
  { id: 'place',     label: 'Place',     glyph: '◇',  color: 'oklch(0.70 0.09 145)' },
  { id: 'faction',   label: 'Faction',   glyph: '✦',  color: 'oklch(0.72 0.12 28)' },
  { id: 'mystery',   label: 'Mystery',   glyph: '☽',  color: 'var(--slate)' },
  { id: 'prophecy',  label: 'Prophecy',  glyph: '✧',  color: 'var(--slate)' },
  { id: 'religion',  label: 'Religion',  glyph: '✶',  color: 'oklch(0.70 0.09 235)' },
  { id: 'relic',     label: 'Relic',     glyph: '◈',  color: 'oklch(0.76 0.12 72)' },
  { id: 'secret',    label: 'Secret',    glyph: '◆',  color: 'oklch(0.72 0.14 28)' },
  { id: 'quest',     label: 'Quest',     glyph: '⚔',  color: 'oklch(0.70 0.10 145)' },
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
  return allEntries
    .filter(e => e.id !== entryId && e.body)
    .filter(e => e.body.toLowerCase().includes(title))
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
    const folder = (folderFilter && folderFilter !== '__uncat__') ? folderFilter : folderForCodexType(type);
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
function CodexEditor({ entry, allEntries, entities, state, onDelete, onSelect, onNav, onOpenNPC, onOpenFaction, onOpenSecret }) {
  const [title,   setTitle]   = React.useState(entry.title  || '');
  const [body,    setBody]    = React.useState(stripLegacyDmTags(entry.body));
  const [type,    setType]    = React.useState(entry.type   || 'lore');
  const [folder,  setFolder]  = React.useState(entry.folder || '');
  const [tags,    setTags]    = React.useState(entry.tags   || []);
  const [attrs,   setAttrs]   = React.useState(entry.attributes || []);
  const [tagIn,   setTagIn]   = React.useState('');
  const [attrK,   setAttrK]   = React.useState('');
  const [attrV,   setAttrV]   = React.useState('');
  const [saved,   setSaved]   = React.useState(true);
  const [preview, setPreview] = React.useState(false);
  const [deleteArmed, setDeleteArmed] = React.useState(false);
  const timers  = React.useRef({});
  const bodyRef = React.useRef(null);

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
        <div className="cx-write">
          {preview ? (
            <CodexPreview title={title} body={body} typeInfo={typeInfo} />
          ) : (
            <>
              <div className="cx-toolbar">
                <span className="muted" style={{ fontSize: 10 }}>
                  This book is DM-only. Use ## headings; entity names auto-highlight as you type.
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
          <div className="cx-panel cx-note-controls">
            <div className="cx-panel-hd">Note controls</div>
            <div className="cx-control-stack">
              <button className={`tbtn ${preview ? '' : 'brass'}`} onClick={() => setPreview(false)}>
                Edit note
              </button>
              <button className={`tbtn ${preview ? 'brass' : ''}`} onClick={() => setPreview(true)}>
                Preview note
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
                    <div key={bl.id} className="cx-bl">
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
  const cleanBody = stripLegacyDmTags(body);
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
      {renderLines(cleanBody, 'p')}
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
