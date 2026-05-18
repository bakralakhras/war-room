// War Room — remaining page components (loaded after demo.jsx globals are set)
// Pages: Rumors, Prep, Timeline, Codex, Map, Settings

const { useState: _useState, useEffect: _useEffect, useRef: _useRef, useCallback: _useCallback } = React;

// ════════════════════════════════════════════════════════════════
// RUMORS
// ════════════════════════════════════════════════════════════════

const RUMOR_WEIGHTS = ['common', 'ominous', 'tactical', 'secret', 'lore'];

function AddRumorForm({ onClose }) {
  const [text, setText]     = _useState('');
  const [source, setSource] = _useState('');
  const [weight, setWeight] = _useState('common');

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    window.Store.dispatch({ type: 'RUMOR_ADD', text: text.trim(), source: source.trim(), weight });
    onClose();
  }

  return (
    <div className="add-rumor-form">
      <div className="new-session-label">New Rumor</div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="faction-field">
          <label>The rumor</label>
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            placeholder="What is being whispered?" rows={2}
            style={{ background: 'oklch(0.17 0.010 260)', border: '1px solid var(--demo-border)', borderRadius: 4, padding: '7px 10px', color: 'var(--demo-text)', fontFamily: 'var(--f-display)', fontSize: 13, outline: 'none', width: '100%', resize: 'none', fontStyle: 'italic' }}
            autoFocus
          />
        </div>
        <div className="faction-field">
          <label>Source</label>
          <input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="Who said it?" />
        </div>
        <div className="faction-field">
          <label>Weight</label>
          <div className="weight-selector">
            {RUMOR_WEIGHTS.map(w => (
              <button key={w} type="button" className={`weight-pill${weight === w ? ' active ' + w : ''}`} onClick={() => setWeight(w)}>{w}</button>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!text.trim()}>Add rumor</button>
        </div>
      </form>
    </div>
  );
}

function RumorCard({ rumor }) {
  function patch(field, value) {
    window.Store.dispatch({ type: 'RUMOR_SET_FIELD', id: rumor.id, field, value });
  }

  return (
    <div className={`rumor-card${rumor.delivered ? ' delivered' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
        <span className={`rumor-weight ${rumor.weight}`} style={{ flexShrink: 0 }}>{rumor.weight}</span>
      </div>
      <div className="rumor-card-body">
        <textarea
          className="rumor-card-text"
          value={rumor.text}
          rows={2}
          onChange={e => { autoResizeTA(e.target); patch('text', e.target.value); }}
          onFocus={e => autoResizeTA(e.target)}
          ref={el => el && autoResizeTA(el)}
        />
        <input
          className="rumor-card-source"
          value={rumor.source || ''}
          onChange={e => patch('source', e.target.value)}
          placeholder="— source unknown"
        />
      </div>
      <div className="rumor-card-actions">
        <button
          className="rumor-deliver-btn"
          onClick={() => window.Store.dispatch({ type: 'RUMOR_TOGGLE_DELIVERED', id: rumor.id })}
        >{rumor.delivered ? 'Delivered' : 'Deliver'}</button>
        <button
          className="icon-btn"
          onClick={() => window.Store.dispatch({ type: 'RUMOR_REMOVE', id: rumor.id })}
          title="Remove rumor"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 1l8 8M9 1L1 9"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function RumorsPage({ rumors }) {
  const [filter, setFilter]  = _useState('all');
  const [adding, setAdding]  = _useState(false);

  const visible = filter === 'all'
    ? rumors
    : filter === 'delivered'
    ? rumors.filter(r => r.delivered)
    : rumors.filter(r => r.weight === filter && !r.delivered);

  const undelivered = rumors.filter(r => !r.delivered).length;

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Word on the street</div>
          <div className="page-title">Rumors</div>
        </div>
        <button className="btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Rumor'}
        </button>
      </div>

      {adding && <AddRumorForm onClose={() => setAdding(false)} />}

      <div className="rumors-filter">
        {['all', ...RUMOR_WEIGHTS, 'delivered'].map(f => {
          const count = f === 'all' ? rumors.length
            : f === 'delivered' ? rumors.filter(r => r.delivered).length
            : rumors.filter(r => r.weight === f).length;
          return (
            <button key={f} className={`vault-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f} {count > 0 ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {rumors.length === 0 ? (
        <div className="vault-empty">
          <h3>No rumors in circulation</h3>
          <p>Add the whispers, warnings, and half-truths your players might hear.</p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>Start the gossip</button>
        </div>
      ) : (
        <div>
          {visible.map(r => <RumorCard key={r.id} rumor={r} />)}
          {visible.length === 0 && (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--demo-muted)', fontSize: 12 }}>
              No {filter} rumors.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PREP
// ════════════════════════════════════════════════════════════════

function PrepPage({ prep }) {
  const [adding, setAdding]   = _useState(false);
  const [form, setForm]       = _useState({ kind: 'scene', title: '', note: '' });

  const scenes = prep.filter(p => p.kind === 'scene');
  const beats  = prep.filter(p => p.kind === 'beat');
  const done   = prep.filter(p => p.done);

  function addItem(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    window.Store.dispatch({ type: 'PREP_ADD', kind: form.kind, title: form.title.trim(), note: form.note.trim() });
    setForm(f => ({ ...f, title: '', note: '' }));
    setAdding(false);
  }

  function carryForward() {
    if (window.confirm('Clear all done items and keep only unfinished prep?')) {
      window.Store.dispatch({ type: 'PREP_CARRY_FORWARD' });
    }
  }

  function PrepItem({ item }) {
    return (
      <div className={`prep-card${item.done ? ' done' : ''}`}>
        <div
          className={`prep-checkbox${item.done ? ' checked' : ''}`}
          onClick={() => window.Store.dispatch({ type: 'PREP_TOGGLE_DONE', id: item.id })}
        >
          {item.done && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M1.5 5l3 3 4-5"/>
            </svg>
          )}
        </div>
        <div className="prep-card-body">
          <input
            className="prep-card-title"
            value={item.title}
            onChange={e => window.Store.dispatch({ type: 'PREP_SET_FIELD', id: item.id, field: 'title', value: e.target.value })}
          />
          <input
            className="prep-card-note"
            value={item.note || ''}
            onChange={e => window.Store.dispatch({ type: 'PREP_SET_FIELD', id: item.id, field: 'note', value: e.target.value })}
            placeholder="DM note…"
          />
        </div>
        <span className={`prep-kind ${item.kind}`} style={{ flexShrink: 0 }}>{item.kind}</span>
        <button className="icon-btn" onClick={() => window.Store.dispatch({ type: 'PREP_REMOVE', id: item.id })}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 1l8 8M9 1L1 9"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Before the session</div>
          <div className="page-title">Session Prep</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {done.length > 0 && (
            <button className="btn-secondary" onClick={carryForward}>Carry forward</button>
          )}
          <button className="btn-primary" onClick={() => setAdding(a => !a)}>
            {adding ? 'Cancel' : '+ Add Item'}
          </button>
        </div>
      </div>

      {adding && (
        <div className="add-rumor-form">
          <div className="new-session-label">New Prep Item</div>
          <form onSubmit={addItem} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={`weight-pill${form.kind === 'scene' ? ' active scene' : ''}`} onClick={() => setForm(f => ({ ...f, kind: 'scene' }))} style={{ padding: '4px 12px' }}>Scene</button>
              <button type="button" className={`weight-pill${form.kind === 'beat' ? ' active beat' : ''}`} onClick={() => setForm(f => ({ ...f, kind: 'beat' }))} style={{ padding: '4px 12px' }}>Beat</button>
            </div>
            <div className="faction-field">
              <label>Title</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What happens?" autoFocus />
            </div>
            <div className="faction-field">
              <label>DM note</label>
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Conditions, options, context…" />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={!form.title.trim()}>Add</button>
            </div>
          </form>
        </div>
      )}

      {prep.length === 0 && !adding ? (
        <div className="vault-empty">
          <h3>No prep yet</h3>
          <p>Plan your scenes and story beats before each session.</p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>Add first item</button>
        </div>
      ) : (
        <div>
          {scenes.length > 0 && (
            <div>
              <div className="prep-section-label">Scenes</div>
              {scenes.map(p => <PrepItem key={p.id} item={p} />)}
            </div>
          )}
          {beats.length > 0 && (
            <div>
              <div className="prep-section-label">Beats</div>
              {beats.map(p => <PrepItem key={p.id} item={p} />)}
            </div>
          )}
          {done.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div className="prep-actions-bar">
                <span style={{ fontSize: 11, color: 'var(--demo-muted)' }}>{done.length} item{done.length !== 1 ? 's' : ''} done</span>
                <button className="btn-secondary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={carryForward}>Carry forward →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TIMELINE
// ════════════════════════════════════════════════════════════════

function TimelinePage({ timeline, sessions }) {
  const [adding, setAdding] = _useState(false);
  const [form, setForm]     = _useState({ worldDate: '', sessionRef: '', title: '', description: '' });
  const [oldest, setOldest] = _useState(false);

  const ordered = oldest ? [...timeline].reverse() : timeline;

  function addEvent(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    window.Store.dispatch({ type: 'TIMELINE_ADD', ...form });
    setForm({ worldDate: '', sessionRef: '', title: '', description: '' });
    setAdding(false);
  }

  function patch(id, field, value) {
    window.Store.dispatch({ type: 'TIMELINE_SET_FIELD', id, field, value });
  }

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">What has come to pass</div>
          <div className="page-title">Timeline</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setOldest(o => !o)}>
            {oldest ? 'Newest first' : 'Oldest first'}
          </button>
          <button className="btn-primary" onClick={() => setAdding(a => !a)}>
            {adding ? 'Cancel' : '+ Add Event'}
          </button>
        </div>
      </div>

      {adding && (
        <div className="add-rumor-form" style={{ marginBottom: 20 }}>
          <div className="new-session-label">New Event</div>
          <form onSubmit={addEvent} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="faction-field" style={{ flex: 1 }}>
                <label>World date</label>
                <input type="text" value={form.worldDate} onChange={e => setForm(f => ({ ...f, worldDate: e.target.value }))} placeholder="e.g. Day 14, Month of Frost" autoFocus />
              </div>
              <div className="faction-field" style={{ maxWidth: 100 }}>
                <label>Session #</label>
                <input type="text" value={form.sessionRef} onChange={e => setForm(f => ({ ...f, sessionRef: e.target.value }))} placeholder="13" />
              </div>
            </div>
            <div className="faction-field">
              <label>Title</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What happened?" />
            </div>
            <div className="faction-field">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details…" rows={2} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={!form.title.trim()}>Add event</button>
            </div>
          </form>
        </div>
      )}

      {timeline.length === 0 && !adding ? (
        <div className="vault-empty">
          <h3>No events recorded</h3>
          <p>Build a chronological record of the campaign — battles, discoveries, deaths, turning points.</p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>Record first event</button>
        </div>
      ) : (
        <div className="timeline-list">
          {ordered.map(ev => (
            <div className="timeline-event" key={ev.id}>
              <div className="timeline-dot" />
              <div className="timeline-event-body">
                <div className="timeline-event-header">
                  <input
                    className="timeline-date-input"
                    value={ev.worldDate || ''}
                    onChange={e => patch(ev.id, 'worldDate', e.target.value)}
                    placeholder="World date…"
                  />
                  {ev.sessionRef && (
                    <span className="timeline-session-badge">Session {ev.sessionRef}</span>
                  )}
                  <button className="icon-btn" onClick={() => window.Store.dispatch({ type: 'TIMELINE_REMOVE', id: ev.id })}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l8 8M9 1L1 9"/></svg>
                  </button>
                </div>
                <input
                  className="timeline-title-input"
                  value={ev.title}
                  onChange={e => patch(ev.id, 'title', e.target.value)}
                  placeholder="Event title…"
                />
                <textarea
                  className="timeline-desc-input"
                  value={ev.description || ''}
                  rows={1}
                  onChange={e => { autoResizeTA(e.target); patch(ev.id, 'description', e.target.value); }}
                  onFocus={e => autoResizeTA(e.target)}
                  ref={el => el && autoResizeTA(el)}
                  placeholder="What happened…"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CODEX
// ════════════════════════════════════════════════════════════════

// ── Codex helpers ──────────────────────────────────────────────
const CODEX_TYPES = [
  { id: 'lore',      label: 'Lore',      hue: 80  },
  { id: 'character', label: 'Character', hue: 300 },
  { id: 'location',  label: 'Location',  hue: 155 },
  { id: 'session',   label: 'Session',   hue: 220 },
  { id: 'rumor',     label: 'Rumor',     hue: 30  },
  { id: 'note',      label: 'Note',      hue: 260 },
];

const MENTION_KIND_META = {
  npc:      { label: 'NPC',      hue: 300, page: 'characters' },
  pc:       { label: 'Player',   hue: 155, page: 'party'      },
  faction:  { label: 'Faction',  hue: 80,  page: 'factions'   },
  location: { label: 'Location', hue: 180, page: 'map'        },
  secret:   { label: 'Secret',   hue: 270, page: 'secrets'    },
  rumor:    { label: 'Rumor',    hue: 30,  page: 'rumors'     },
};

function codexTypeStyle(typeId) {
  const t = CODEX_TYPES.find(t => t.id === typeId) || CODEX_TYPES[0];
  return {
    color: `oklch(0.70 0.090 ${t.hue})`,
    background: `oklch(0.18 0.035 ${t.hue})`,
    border: `1px solid oklch(0.32 0.055 ${t.hue})`,
  };
}

function getAllEntities(state) {
  const out = [];
  (state.party || []).forEach(p => out.push({ id: 'pc-' + p.name, name: p.name, kind: 'pc', sub: p.role || '' }));
  (state.npcs || []).forEach(n => out.push({ id: n.id, name: n.name, kind: 'npc', sub: n.title || '' }));
  (state.factions || []).forEach(f => out.push({ id: f.id, name: f.name, kind: 'faction', sub: '' }));
  (state.locations || []).forEach(l => out.push({ id: l.id, name: l.name || l.label, kind: 'location', sub: l.kind || '' }));
  (state.secrets || []).forEach(s => out.push({ id: s.id, name: s.title, kind: 'secret', sub: s.weight || '' }));
  (state.rumors || []).forEach(r => out.push({ id: r.id, name: (r.text || '').slice(0, 48) + ((r.text || '').length > 48 ? '…' : ''), kind: 'rumor', sub: r.source || '' }));
  return out;
}

function parseMentions(body) {
  const re = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let m;
  while ((m = re.exec(body || '')) !== null) links.push({ name: m[1], id: m[2] });
  return links;
}

// Render body text with @[Name](id) as styled chips
function renderBodyWithMentions(text, allEntities, onNav) {
  const re = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', content: text.slice(last, m.index) });
    const entity = allEntities.find(e => e.id === m[2]);
    parts.push({ type: 'mention', name: m[1], id: m[2], kind: entity?.kind || 'npc' });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });

  return parts.map((p, i) => {
    if (p.type === 'text') {
      return p.content.split('\n').reduce((acc, line, j, arr) => {
        acc.push(line);
        if (j < arr.length - 1) acc.push(<br key={`br-${i}-${j}`} />);
        return acc;
      }, []);
    }
    const meta = MENTION_KIND_META[p.kind] || MENTION_KIND_META.npc;
    const chipStyle = {
      color: `oklch(0.72 0.080 ${meta.hue})`,
      background: `oklch(0.18 0.030 ${meta.hue})`,
      borderColor: `oklch(0.32 0.050 ${meta.hue})`,
    };
    return (
      <button
        key={`m-${i}`}
        className="codex-mention-chip"
        style={chipStyle}
        onClick={() => onNav && onNav(meta.page)}
        title={'Go to ' + p.name}
      >
        <span className="codex-mention-chip-kind">{meta.label}</span>
        {p.name}
        <span className="codex-mention-chip-arrow">↗</span>
      </button>
    );
  });
}

function CodexListItem({ entry, active, onClick }) {
  const ts = codexTypeStyle(entry.type || 'lore');
  const typeLabel = (CODEX_TYPES.find(t => t.id === entry.type) || CODEX_TYPES[0]).label;
  const excerpt = (entry.body || '').replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1').slice(0, 90);
  const links = parseMentions(entry.body);

  return (
    <div className={`codex-item${active ? ' active' : ''}`} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {entry.pinned && <span style={{ color: 'oklch(0.72 0.090 80)', fontSize: 12, lineHeight: 1 }}>★</span>}
        <span className="codex-type-badge" style={ts}>{typeLabel}</span>
        <div className="codex-item-title" style={{ flex: 1 }}>{entry.title}</div>
      </div>
      {excerpt && <div className="codex-item-excerpt">{excerpt}{excerpt.length >= 90 ? '…' : ''}</div>}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
        {(entry.tags || []).slice(0, 3).map(t => <span key={t} className="codex-tag">{t}</span>)}
        {links.length > 0 && <span className="codex-tag" style={{ color: 'oklch(0.60 0.050 220)', borderColor: 'oklch(0.28 0.030 220)' }}>⟁ {links.length}</span>}
      </div>
    </div>
  );
}

function CodexEditor({ entry, patch, allEntities, onDelete, onNav }) {
  const [body, setBody]             = _useState(entry.body || '');
  const [tagDraft, setTagDraft]     = _useState('');
  const [mentionState, setMention]  = _useState(null);
  const [dropCursor, setDropCursor] = _useState(0);
  const [preview, setPreview]       = _useState(false);
  const taRef   = _useRef(null);
  const saveRef = _useRef(null);

  _useEffect(() => {
    setBody(entry.body || '');
    setMention(null);
    setPreview(false);
  }, [entry.id]);

  function debounceSave(val) {
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => patch('body', val), 350);
  }

  function onBodyChange(e) {
    const val = e.target.value;
    setBody(val);
    debounceSave(val);
    const pos = e.target.selectionStart;
    const before = val.slice(0, pos);
    const m = before.match(/@([^@\[\n\r]*)$/);
    if (m) {
      setMention({ query: m[1], atStart: pos - m[0].length, cursorEnd: pos });
      setDropCursor(0);
    } else {
      setMention(null);
    }
  }

  const filteredEntities = mentionState
    ? allEntities.filter(e => !mentionState.query || e.name.toLowerCase().includes(mentionState.query.toLowerCase())).slice(0, 6)
    : [];

  function selectMention(entity) {
    const ta = taRef.current;
    if (!ta || !mentionState) return;
    const val = ta.value;
    const link = `@[${entity.name}](${entity.id})`;
    const newVal = val.slice(0, mentionState.atStart) + link + val.slice(mentionState.cursorEnd);
    setBody(newVal);
    debounceSave(newVal);
    setMention(null);
    setTimeout(() => {
      ta.focus();
      const p = mentionState.atStart + link.length;
      ta.setSelectionRange(p, p);
    }, 0);
  }

  function onBodyKeyDown(e) {
    if (!mentionState || !filteredEntities.length) return;
    if (e.key === 'ArrowDown')      { e.preventDefault(); setDropCursor(c => Math.min(c + 1, filteredEntities.length - 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setDropCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter')     { e.preventDefault(); selectMention(filteredEntities[dropCursor]); }
    else if (e.key === 'Escape')    { setMention(null); }
  }

  function addTag(e) {
    if ((e.key === 'Enter' || e.key === ',') && tagDraft.trim()) {
      e.preventDefault();
      const tag = tagDraft.trim().replace(/,$/, '').toLowerCase();
      if (!(entry.tags || []).includes(tag)) patch('tags', [...(entry.tags || []), tag]);
      setTagDraft('');
    }
  }

  const links = parseMentions(body);
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="codex-editor">
      <div className="codex-editor-header">
        <div className="codex-title-row">
          <input
            className="codex-editor-title"
            value={entry.title}
            onChange={e => patch('title', e.target.value)}
            placeholder="Entry title…"
          />
          <button
            className="codex-pin-btn"
            onClick={() => patch('pinned', !entry.pinned)}
            title={entry.pinned ? 'Unpin' : 'Pin to top'}
            style={{ color: entry.pinned ? 'oklch(0.72 0.090 80)' : 'var(--demo-muted)' }}
          >★</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div className="codex-type-row">
            {CODEX_TYPES.map(t => {
              const active = (entry.type || 'lore') === t.id;
              return (
                <button
                  key={t.id}
                  className="codex-type-btn"
                  style={active ? codexTypeStyle(t.id) : {}}
                  onClick={() => patch('type', t.id)}
                >{t.label}</button>
              );
            })}
          </div>
          <button
            className={`codex-view-toggle${preview ? ' active' : ''}`}
            onClick={() => setPreview(p => !p)}
            title={preview ? 'Switch to edit' : 'Switch to preview'}
          >{preview ? 'Edit' : 'Preview'}</button>
        </div>

        <div className="codex-tag-row">
          {(entry.tags || []).map(tag => (
            <button key={tag} className="dossier-tag" onClick={() => patch('tags', (entry.tags || []).filter(t => t !== tag))} title="Remove tag">
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

      {/* Body: preview or edit */}
      {preview ? (
        <div className="codex-preview" onClick={() => setPreview(false)}>
          {body.trim()
            ? renderBodyWithMentions(body, allEntities, onNav)
            : <span className="codex-preview-empty">Nothing written yet. Click to start writing.</span>
          }
        </div>
      ) : (
        <div className="codex-body-wrap">
          <textarea
            ref={taRef}
            className="codex-editor-body"
            value={body}
            onChange={onBodyChange}
            onKeyDown={onBodyKeyDown}
            placeholder={"Write freely — lore, history, DM notes…\n\nType @ to link a player, character, location, faction, secret, or rumor."}
          />
          {mentionState && filteredEntities.length > 0 && (
            <div className="codex-mention-dropdown">
              <div className="codex-mention-header">
                <span>Link entity</span>
                <span className="codex-mention-query">{mentionState.query ? `"${mentionState.query}"` : 'type to filter…'}</span>
              </div>
              {filteredEntities.map((e, i) => {
                const meta = MENTION_KIND_META[e.kind] || MENTION_KIND_META.npc;
                const kindStyle = {
                  background: `oklch(0.20 0.030 ${meta.hue})`,
                  color: `oklch(0.68 0.070 ${meta.hue})`,
                  borderColor: `oklch(0.34 0.050 ${meta.hue})`,
                };
                return (
                  <div
                    key={e.id}
                    className={`codex-mention-item${i === dropCursor ? ' active' : ''}`}
                    onMouseDown={ev => { ev.preventDefault(); selectMention(e); }}
                    onMouseEnter={() => setDropCursor(i)}
                  >
                    <span className="codex-mention-kind" style={kindStyle}>{meta.label}</span>
                    <span className="codex-mention-name">{e.name}</span>
                    {e.sub && <span className="codex-mention-sub">{e.sub}</span>}
                  </div>
                );
              })}
              <div className="codex-mention-hint">↑↓ navigate · Enter to link · Esc dismiss</div>
            </div>
          )}
        </div>
      )}

      {links.length > 0 && (
        <div className="codex-links-panel">
          <div className="codex-links-label">Linked</div>
          <div className="codex-links-chips">
            {links.map((l, i) => {
              const entity = allEntities.find(e => e.id === l.id);
              const meta = MENTION_KIND_META[entity?.kind || 'npc'];
              const chipStyle = {
                color: `oklch(0.68 0.070 ${meta.hue})`,
                background: `oklch(0.18 0.028 ${meta.hue})`,
                borderColor: `oklch(0.30 0.045 ${meta.hue})`,
                cursor: 'pointer',
              };
              return (
                <button
                  key={i}
                  className="codex-entity-chip"
                  style={chipStyle}
                  onClick={() => onNav && onNav(meta.page)}
                  title={'Go to ' + (entity ? entity.name : l.name)}
                >
                  <span className="codex-entity-kind">{meta.label}</span>
                  {entity ? entity.name : l.name}
                  <span style={{ opacity: 0.6, fontSize: 9 }}>↗</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="codex-editor-footer">
        <span className="codex-word-count">{wordCount}w · {body.length}c</span>
        <button className="btn-danger" onClick={onDelete}>Delete entry</button>
      </div>
    </div>
  );
}

function CodexPage({ codex, onNav }) {
  const [selectedId, setSelectedId] = _useState(codex[0]?.id || null);
  const [search, setSearch]         = _useState('');
  const [typeFilter, setTypeFilter] = _useState('');
  const [sortBy, setSortBy]         = _useState('newest');

  const allEntities = getAllEntities(window.Store.get());
  const selected = codex.find(e => e.id === selectedId) || null;

  function addEntry() {
    window.Store.dispatch({ type: 'CODEX_ADD', title: 'Untitled Entry', entryType: typeFilter || 'lore' });
    setTimeout(() => {
      const s = window.Store.get();
      if (s.codex[0]) setSelectedId(s.codex[0].id);
    }, 50);
  }

  function patch(field, value) {
    if (!selected) return;
    window.Store.dispatch({ type: 'CODEX_SET_FIELD', id: selected.id, field, value });
  }

  function deleteEntry() {
    if (!selected) return;
    if (window.confirm('Delete "' + selected.title + '"?')) {
      window.Store.dispatch({ type: 'CODEX_REMOVE', id: selected.id });
      const remaining = codex.filter(e => e.id !== selected.id);
      setSelectedId(remaining[0]?.id || null);
    }
  }

  const visible = codex.filter(e => {
    const matchSearch = !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.body || '').toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || e.type === typeFilter;
    return matchSearch && matchType;
  }).sort((a, b) => {
    if (sortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
    return a.title.localeCompare(b.title);
  });

  const pinned   = visible.filter(e => e.pinned);
  const unpinned = visible.filter(e => !e.pinned);

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">DM's Notebook</div>
          <div className="page-title">Codex</div>
        </div>
        <button className="btn-primary" onClick={addEntry}>+ New Entry</button>
      </div>

      {codex.length === 0 ? (
        <div className="vault-empty">
          <h3>The codex is empty</h3>
          <p>Write lore, NPC backgrounds, faction histories — anything you need to remember. Link players, characters, locations, and secrets with @mentions.</p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={addEntry}>Write first entry</button>
        </div>
      ) : (
        <div className="codex-layout">
          <div className="codex-sidebar">
            <input
              className="codex-search"
              placeholder="Search entries…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <div className="codex-type-filter-row">
              <button className={`codex-filter-btn${!typeFilter ? ' active' : ''}`} onClick={() => setTypeFilter('')}>All</button>
              {CODEX_TYPES.map(t => (
                <button
                  key={t.id}
                  className={`codex-filter-btn${typeFilter === t.id ? ' active' : ''}`}
                  onClick={() => setTypeFilter(typeFilter === t.id ? '' : t.id)}
                >{t.label}</button>
              ))}
            </div>

            <div className="codex-sort-row">
              <button className={`codex-sort-btn${sortBy === 'newest' ? ' active' : ''}`} onClick={() => setSortBy('newest')}>Newest</button>
              <button className={`codex-sort-btn${sortBy === 'az' ? ' active' : ''}`} onClick={() => setSortBy('az')}>A–Z</button>
            </div>

            {pinned.length > 0 && (
              <>
                <div className="codex-section-divider">Pinned</div>
                {pinned.map(e => (
                  <CodexListItem key={e.id} entry={e} active={selected?.id === e.id} onClick={() => setSelectedId(e.id)} />
                ))}
                {unpinned.length > 0 && <div className="codex-section-divider">All entries</div>}
              </>
            )}

            <div className="codex-list">
              {unpinned.map(e => (
                <CodexListItem key={e.id} entry={e} active={selected?.id === e.id} onClick={() => setSelectedId(e.id)} />
              ))}
              {visible.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--demo-muted)', fontSize: 12 }}>No entries match.</div>
              )}
            </div>
          </div>

          {selected
            ? <CodexEditor key={selected.id} entry={selected} patch={patch} allEntities={allEntities} onDelete={deleteEntry} onNav={onNav} />
            : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--demo-muted)', fontSize: 13 }}>Select an entry</div>
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAP
// ════════════════════════════════════════════════════════════════

const LOC_KINDS = ['town', 'capital', 'fortress', 'abbey', 'port', 'ruin', 'dungeon', 'other'];

const LOC_KIND_STYLE = {
  capital:  { bg: 'oklch(0.22 0.040 80)',  border: 'oklch(0.55 0.090 80)',  icon: '♛' },
  fortress: { bg: 'oklch(0.20 0.030 240)', border: 'oklch(0.45 0.070 240)', icon: '⚔' },
  town:     { bg: 'oklch(0.20 0.020 150)', border: 'oklch(0.45 0.060 150)', icon: '⌂' },
  abbey:    { bg: 'oklch(0.20 0.025 200)', border: 'oklch(0.45 0.060 200)', icon: '✝' },
  port:     { bg: 'oklch(0.20 0.030 220)', border: 'oklch(0.45 0.065 220)', icon: '⚓' },
  ruin:     { bg: 'oklch(0.18 0.020 40)',  border: 'oklch(0.40 0.050 40)',  icon: '⌬' },
  dungeon:  { bg: 'oklch(0.16 0.020 300)', border: 'oklch(0.38 0.055 300)', icon: '◈' },
  other:    { bg: 'oklch(0.18 0.010 260)', border: 'oklch(0.38 0.012 260)', icon: '●' },
};

function MapPin({ loc, selected, onClick }) {
  const style = LOC_KIND_STYLE[loc.kind] || LOC_KIND_STYLE.other;
  return (
    <div
      className={`map-pin${selected ? ' selected' : ''}`}
      style={{ left: (loc.x * 100) + '%', top: (loc.y * 100) + '%' }}
      onClick={e => { e.stopPropagation(); onClick(); }}
      title={loc.name}
    >
      {loc.party && <div className="map-pin-pulse" />}
      <div className="map-pin-icon" style={{ background: style.bg, borderColor: style.border, color: style.border }}>
        <span style={{ fontSize: 11, lineHeight: 1 }}>{style.icon}</span>
      </div>
      <div className="map-pin-label">{loc.label || loc.name}</div>
    </div>
  );
}

function MapPage({ locations }) {
  const [selectedId, setSelectedId] = _useState(locations.find(l => l.party)?.id || locations[0]?.id || null);
  const [addMode, setAddMode]       = _useState(false);
  const [kindFilter, setKindFilter] = _useState('all');
  const canvasRef = _useRef(null);

  const selected = locations.find(l => l.id === selectedId) || null;
  const visible  = kindFilter === 'all' ? locations : locations.filter(l => l.kind === kindFilter);

  function handleCanvasClick(e) {
    if (!addMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = parseFloat(((e.clientX - rect.left) / rect.width).toFixed(3));
    const y = parseFloat(((e.clientY - rect.top)  / rect.height).toFixed(3));
    window.Store.dispatch({ type: 'LOCATION_ADD', x, y, label: 'New Location', kind: 'town' });
    setAddMode(false);
  }

  function patch(field, value) {
    if (!selected) return;
    window.Store.dispatch({ type: 'LOCATION_SET_FIELD', id: selected.id, field, value });
  }

  function setPartyHere() {
    if (!selected) return;
    window.Store.dispatch({ type: 'LOCATION_SET_PARTY', id: selected.id });
  }

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">The world</div>
          <div className="page-title">Map</div>
        </div>
      </div>

      <div className="map-layout">
        {/* Sidebar: location list */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button className={`vault-tab${kindFilter === 'all' ? ' active' : ''}`} style={{ fontSize: 10, padding: '3px 9px' }} onClick={() => setKindFilter('all')}>All ({locations.length})</button>
              {LOC_KINDS.filter(k => locations.some(l => l.kind === k)).map(k => (
                <button key={k} className={`vault-tab${kindFilter === k ? ' active' : ''}`} style={{ fontSize: 10, padding: '3px 9px' }} onClick={() => setKindFilter(k)}>{k}</button>
              ))}
            </div>
          </div>
          <div className="map-sidebar">
            {visible.map(loc => {
              const s = LOC_KIND_STYLE[loc.kind] || LOC_KIND_STYLE.other;
              return (
                <div
                  key={loc.id}
                  className={`map-loc-item${selectedId === loc.id ? ' active' : ''}`}
                  onClick={() => setSelectedId(loc.id)}
                >
                  <div className="map-loc-icon" style={{ background: s.bg, color: s.border }}>
                    <span style={{ fontSize: 11 }}>{s.icon}</span>
                  </div>
                  <span className="map-loc-name">{loc.label || loc.name}</span>
                  {loc.party && <span style={{ fontSize: 9, color: 'var(--brass, oklch(0.72 0.090 85))', flexShrink: 0 }}>HERE</span>}
                  <span className="map-loc-kind">{loc.kind}</span>
                </div>
              );
            })}
            {locations.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--demo-muted)' }}>
                Click the map to place your first location.
              </div>
            )}
          </div>
        </div>

        {/* Map + detail */}
        <div className="map-container">
          <div className="map-mode-bar">
            <span className="map-mode-hint">
              {addMode ? '🎯 Click anywhere on the map to place a new location.' : 'Click a pin to select it. Use the button to place new locations.'}
            </span>
            <button
              className={addMode ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: 11, padding: '4px 12px' }}
              onClick={() => setAddMode(m => !m)}
            >
              {addMode ? 'Cancel placement' : '+ Place location'}
            </button>
          </div>

          <div
            ref={canvasRef}
            className={`map-canvas-wrap${!addMode ? ' view-mode' : ''}`}
            onClick={handleCanvasClick}
          >
            <div className="map-bg" />
            <div className="map-grid" />
            {locations.map(loc => (
              <MapPin
                key={loc.id}
                loc={loc}
                selected={selectedId === loc.id}
                onClick={() => setSelectedId(loc.id)}
              />
            ))}
          </div>

          {/* Selected location detail */}
          {selected && (
            <div className="map-detail">
              <div className="map-detail-header">
                <div className="map-loc-icon" style={{ ...LOC_KIND_STYLE[selected.kind] && { background: LOC_KIND_STYLE[selected.kind].bg, color: LOC_KIND_STYLE[selected.kind].border }, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13 }}>{(LOC_KIND_STYLE[selected.kind] || LOC_KIND_STYLE.other).icon}</span>
                </div>
                <input
                  style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600, color: 'oklch(0.92 0.010 260)', background: 'transparent', border: 'none', outline: 'none', flex: 1, borderBottom: '1px solid transparent' }}
                  value={selected.label || selected.name || ''}
                  onChange={e => { patch('label', e.target.value); patch('name', e.target.value); }}
                  placeholder="Location name"
                />
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className={selected.party ? 'btn-primary' : 'btn-secondary'}
                    style={{ fontSize: 11, padding: '4px 10px' }}
                    onClick={setPartyHere}
                  >{selected.party ? '★ Party here' : 'Move party here'}</button>
                  <button className="icon-btn" onClick={() => {
                    if (window.confirm('Remove this location?')) {
                      window.Store.dispatch({ type: 'LOCATION_REMOVE', id: selected.id });
                      setSelectedId(locations.filter(l => l.id !== selected.id)[0]?.id || null);
                    }
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l8 8M9 1L1 9"/></svg>
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div className="faction-field" style={{ flex: 1 }}>
                  <label>Kind</label>
                  <select
                    value={selected.kind}
                    onChange={e => patch('kind', e.target.value)}
                    style={{ background: 'oklch(0.17 0.010 260)', border: '1px solid var(--demo-border)', borderRadius: 4, padding: '6px 8px', color: 'var(--demo-text)', fontFamily: 'inherit', fontSize: 12, outline: 'none', width: '100%' }}
                  >
                    {LOC_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="faction-field" style={{ flex: 2 }}>
                  <label>Region</label>
                  <input value={selected.region || ''} onChange={e => patch('region', e.target.value)} placeholder="Region name" />
                </div>
              </div>
              <div className="faction-field">
                <label>Note</label>
                <textarea value={selected.note || ''} onChange={e => patch('note', e.target.value)} placeholder="Atmosphere, inhabitants, current situation…" rows={2} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════════════════════

function SettingsPage({ state }) {
  const { campaign } = state;
  const user = window.Auth.session;

  const [saved, setSaved] = _useState(false);

  function setCampaignField(field, value) {
    window.Store.dispatch({ type: 'CAMPAIGN_SET_FIELD', field, value });
    flash();
  }

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="main-inner">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Configuration</div>
          <div className="page-title">Settings</div>
        </div>
        {saved && (
          <span style={{ fontSize: 12, color: 'oklch(0.65 0.110 155)', alignSelf: 'center' }}>✓ Saved</span>
        )}
      </div>

      <div className="settings-sections">

        {/* Campaign */}
        <div className="settings-section">
          <div className="settings-section-head">Campaign</div>
          <div className="settings-section-body">
            <div className="settings-field">
              <label>Campaign name</label>
              <input value={campaign.name} onChange={e => setCampaignField('name', e.target.value)} />
            </div>
            <div className="settings-field">
              <label>Subtitle / tagline</label>
              <input value={campaign.subtitle || ''} onChange={e => setCampaignField('subtitle', e.target.value)} placeholder="A short tagline" />
            </div>
            <div className="settings-row">
              <div className="settings-field">
                <label>Current session</label>
                <input type="number" min="1" value={campaign.session} onChange={e => setCampaignField('session', parseInt(e.target.value, 10) || 1)} />
              </div>
              <div className="settings-field">
                <label>Planned sessions</label>
                <input type="number" min="1" value={campaign.sessionsTotal} onChange={e => setCampaignField('sessionsTotal', parseInt(e.target.value, 10) || 20)} />
              </div>
            </div>
            <div className="settings-field">
              <label>Next session</label>
              <input value={campaign.nextSession || ''} onChange={e => setCampaignField('nextSession', e.target.value)} placeholder="e.g. Sat, 27 Vael · 19:00" />
            </div>
          </div>
        </div>

        {/* Current location */}
        <div className="settings-section">
          <div className="settings-section-head">Party Location</div>
          <div className="settings-section-body">
            <div className="settings-row">
              <div className="settings-field">
                <label>Location name</label>
                <input value={campaign.location?.name || ''} onChange={e => window.Store.dispatch({ type: 'CAMPAIGN_SET_LOCATION', patch: { name: e.target.value } })} placeholder="Where is the party?" />
              </div>
              <div className="settings-field">
                <label>Region</label>
                <input value={campaign.location?.region || ''} onChange={e => window.Store.dispatch({ type: 'CAMPAIGN_SET_LOCATION', patch: { region: e.target.value } })} placeholder="Region" />
              </div>
            </div>
            <div className="settings-field">
              <label>Atmosphere note</label>
              <input value={campaign.location?.note || ''} onChange={e => window.Store.dispatch({ type: 'CAMPAIGN_SET_LOCATION', patch: { note: e.target.value } })} placeholder="Smell, mood, sensory detail…" />
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="settings-section">
          <div className="settings-section-head">Account</div>
          <div className="settings-section-body">
            <div className="settings-field">
              <label>Username</label>
              <input value={user?.username || ''} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="settings-field">
              <label>Tier</label>
              <input value={user?.tier || 'free'} disabled style={{ opacity: 0.6, textTransform: 'capitalize' }} />
            </div>
            <button className="btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => window.Auth.logout()}>
              Sign out
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="settings-section danger-zone">
          <div className="settings-section-head">Danger Zone</div>
          <div className="settings-section-body">
            <p style={{ fontSize: 12, color: 'var(--demo-muted)', lineHeight: 1.5 }}>
              Reset wipes all campaign data for your account and reloads the defaults. This cannot be undone.
            </p>
            <button
              className="btn-danger"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => {
                if (window.confirm('Reset all campaign data? This cannot be undone.')) {
                  window.Store.reset();
                }
              }}
            >
              Reset campaign data
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Shared utility exposed to demo.jsx
// ════════════════════════════════════════════════════════════════

function autoResizeTA(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

Object.assign(window, { RumorsPage, PrepPage, TimelinePage, CodexPage, MapPage, SettingsPage });
