// Inspiration Board — images, quotes, videos, links. The DM's mood board.

function Inspiration({ state }) {
  const items = state.inspiration || [];

  const [addOpen, setAddOpen]   = React.useState(false);
  const [activeType, setActiveType] = React.useState('image');
  const [filter, setFilter]     = React.useState('all');
  const [form, setForm]         = React.useState(emptyForm());
  const [hovered, setHovered]   = React.useState(null);
  const fileRef = React.useRef(null);

  function emptyForm() {
    return { url: '', title: '', body: '', attribution: '', tags: [], note: '', color: 'shadow' };
  }

  const TAGS = ['mood', 'character', 'location', 'encounter', 'lore', 'reference'];

  const TAG_PILL = {
    mood:      { bg: 'oklch(0.30 0.06 280)', color: 'oklch(0.80 0.08 280)' },
    character: { bg: 'oklch(0.30 0.07 55)',  color: 'oklch(0.80 0.10 55)'  },
    location:  { bg: 'oklch(0.25 0.06 150)', color: 'oklch(0.72 0.10 150)' },
    encounter: { bg: 'oklch(0.28 0.08 25)',  color: 'oklch(0.75 0.12 25)'  },
    lore:      { bg: 'oklch(0.28 0.06 235)', color: 'oklch(0.75 0.09 235)' },
    reference: { bg: 'oklch(0.26 0.02 60)',  color: 'oklch(0.65 0.04 60)'  },
  };

  const QUOTE_BG = {
    shadow:  ['oklch(0.22 0.015 60)',  'oklch(0.18 0.012 60)'],
    brass:   ['oklch(0.26 0.04 75)',   'oklch(0.20 0.03 70)'],
    crimson: ['oklch(0.26 0.07 25)',   'oklch(0.20 0.05 20)'],
    moon:    ['oklch(0.24 0.05 235)',  'oklch(0.19 0.04 230)'],
    forest:  ['oklch(0.24 0.05 150)',  'oklch(0.19 0.04 145)'],
    ember:   ['oklch(0.26 0.06 50)',   'oklch(0.20 0.05 45)'],
  };

  const QUOTE_BORDER = {
    shadow: 'oklch(0.38 0.015 60)',
    brass:  'oklch(0.50 0.10 75)',
    crimson:'oklch(0.45 0.14 25)',
    moon:   'oklch(0.44 0.09 235)',
    forest: 'oklch(0.42 0.09 150)',
    ember:  'oklch(0.48 0.12 50)',
  };

  const detectType = (url) => {
    if (!url.trim()) return activeType;
    if (/youtube\.com\/watch|youtu\.be\/|youtube\.com\/embed/.test(url)) return 'youtube';
    if (/tiktok\.com/.test(url)) return 'tiktok';
    if (/\.(jpg|jpeg|png|webp|gif|avif|bmp|svg)(\?|$)/i.test(url) || /picsum|unsplash|pexels/.test(url)) return 'image';
    if (/pinterest\.|pin\.it/.test(url)) return 'image';
    return 'link';
  };

  const ytId = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|v=|embed\/)([^&?/\s]{11})/);
    return m ? m[1] : null;
  };

  const domain = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
  };

  const handleUrlChange = (url) => {
    const t = detectType(url);
    setActiveType(t);
    setForm(f => ({ ...f, url }));
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setActiveType('upload');
      setForm(f => ({ ...f, url: ev.target.result, title: f.title || file.name.replace(/\.[^.]+$/, '') }));
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const canSubmit = () => {
    if (activeType === 'quote') return form.body.trim().length > 0;
    return form.url.trim().length > 0;
  };

  const addItem = () => {
    if (!canSubmit()) return;
    window.Store.dispatch({
      type: 'INSPO_ADD',
      item: { type: activeType, url: form.url, title: form.title, body: form.body, attribution: form.attribution, tags: form.tags, note: form.note, color: form.color },
    });
    setForm(emptyForm());
    setActiveType('image');
    setAddOpen(false);
  };

  const removeItem = (id) => window.Store.dispatch({ type: 'INSPO_REMOVE', id });

  const filtered = filter === 'all' ? items : items.filter(i => (i.tags || []).includes(filter));

  const iStyle = { width: '100%', boxSizing: 'border-box', background: 'oklch(0.16 0.012 60)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r)', color: 'var(--fg)', padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' };

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>Mood board · references · sparks</div>
          <h1 className="page-title">Inspiration</h1>
          <div className="page-sub">{items.length} pinned · images, quotes, videos, and links</div>
        </div>
        <div className="row" style={{ alignItems: 'center' }}>
          <button className="tbtn brass" onClick={() => setAddOpen(v => !v)}>
            <Icon.Plus /> {addOpen ? 'Cancel' : 'Pin something'}
          </button>
        </div>
      </div>

      {/* ── Add form ── */}
      {addOpen && (
        <div className="card cornered" style={{ marginBottom: 20, borderColor: 'var(--brass-dim)' }}>
          <div className="head">
            <Icon.Inspiration />
            <span className="title">Pin to your board</span>
          </div>
          <div className="body" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Type tabs */}
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              {[['image','Image URL'],['youtube','YouTube'],['tiktok','TikTok'],['link','Link'],['quote','Quote'],['upload','Upload']].map(([t, label]) => (
                <button key={t}
                  className={activeType === t ? 'tbtn brass' : 'tbtn'}
                  style={{ fontSize: 11.5, padding: '3px 10px' }}
                  onClick={() => { setActiveType(t); setForm(f => ({ ...f })); }}>
                  {label}
                </button>
              ))}
            </div>

            {/* URL / Quote body input */}
            {activeType === 'quote' ? (
              <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="The quote…"
                rows={3}
                style={{ ...iStyle, resize: 'vertical', lineHeight: 1.6, fontFamily: 'Cormorant Garamond, serif', fontSize: 15 }}
                autoFocus />
            ) : activeType === 'upload' ? (
              <div>
                <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button className="tbtn" onClick={() => fileRef.current?.click()}>Choose file…</button>
                  {form.url && <span className="muted" style={{ fontSize: 11, fontStyle: 'italic' }}>File loaded ✓</span>}
                </div>
              </div>
            ) : (
              <input value={form.url}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder={activeType === 'youtube' ? 'https://youtube.com/watch?v=…' : activeType === 'tiktok' ? 'https://tiktok.com/@…' : 'https://…'}
                style={iStyle}
                autoFocus />
            )}

            {/* Title / Attribution */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 4 }}>
                  {activeType === 'quote' ? 'Attribution' : 'Title (optional)'}
                </div>
                {activeType === 'quote' ? (
                  <input value={form.attribution} onChange={e => setForm(f => ({ ...f, attribution: e.target.value }))}
                    placeholder="— source, speaker" style={iStyle} />
                ) : (
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Label this pin…" style={iStyle} />
                )}
              </label>
              {activeType === 'quote' && (
                <label>
                  <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 4 }}>Card color</div>
                  <select value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={iStyle}>
                    {['shadow','brass','crimson','moon','forest','ember'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              )}
              {activeType !== 'quote' && (
                <label>
                  <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 4 }}>DM note</div>
                  <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="Private context…" style={iStyle} />
                </label>
              )}
            </div>

            {/* Tag chips */}
            <div>
              <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 6 }}>Tags</div>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {TAGS.map(tag => {
                  const active = form.tags.includes(tag);
                  const p = TAG_PILL[tag];
                  return (
                    <button key={tag} onClick={() => toggleTag(tag)} style={{
                      padding: '3px 10px', fontSize: 11.5, borderRadius: 20,
                      background: active ? p.bg : 'transparent',
                      border: `1px solid ${active ? p.color : 'var(--hairline-2)'}`,
                      color: active ? p.color : 'var(--fg-3)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>{tag}</button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="row">
              <button className="tbtn brass" onClick={addItem} disabled={!canSubmit()} style={{ opacity: canSubmit() ? 1 : 0.4 }}>
                <Icon.Plus /> Pin it
              </button>
              <button className="tbtn" onClick={() => { setAddOpen(false); setForm(emptyForm()); setActiveType('image'); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tag filter bar ── */}
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <button className={filter === 'all' ? 'tbtn brass' : 'tbtn'} style={{ fontSize: 11.5 }} onClick={() => setFilter('all')}>
          All <span className="badge">{items.length}</span>
        </button>
        {TAGS.filter(t => items.some(i => (i.tags || []).includes(t))).map(tag => {
          const p = TAG_PILL[tag];
          const count = items.filter(i => (i.tags || []).includes(tag)).length;
          return (
            <button key={tag} onClick={() => setFilter(filter === tag ? 'all' : tag)} style={{
              padding: '4px 12px', fontSize: 11.5, borderRadius: 20,
              background: filter === tag ? p.bg : 'transparent',
              border: `1px solid ${filter === tag ? p.color : 'var(--hairline-2)'}`,
              color: filter === tag ? p.color : 'var(--fg-3)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {tag} <span style={{ opacity: 0.65, marginLeft: 4 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Masonry board ── */}
      {filtered.length === 0 ? (
        <div className="empty" style={{ marginTop: 60 }}>
          <div className="display">Nothing pinned yet.</div>
          {filter !== 'all' ? 'Try a different tag.' : 'Images, quotes, video links — pin anything that sparks the campaign.'}
        </div>
      ) : (
        <div style={{ columns: '3 260px', columnGap: 16 }}>
          {filtered.map(item => (
            <div key={item.id} style={{ breakInside: 'avoid', marginBottom: 16, display: 'inline-block', width: '100%' }}>
              <InspoCard item={item} hovered={hovered === item.id}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                onRemove={() => removeItem(item.id)}
                ytId={ytId} domain={domain} QUOTE_BG={QUOTE_BG} QUOTE_BORDER={QUOTE_BORDER} TAG_PILL={TAG_PILL} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InspoCard({ item, hovered, onMouseEnter, onMouseLeave, onRemove, ytId, domain, QUOTE_BG, QUOTE_BORDER, TAG_PILL }) {
  const [imgError, setImgError] = React.useState(false);

  const tagPillStyle = (tag) => {
    const p = TAG_PILL[tag] || { bg: 'oklch(0.26 0.02 60)', color: 'oklch(0.60 0.04 60)' };
    return { background: p.bg, color: p.color, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontFamily: 'inherit' };
  };

  const TagRow = ({ tags }) => (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
      {(tags || []).map(t => <span key={t} style={tagPillStyle(t)}>{t}</span>)}
    </div>
  );

  const RemoveBtn = ({ dark }) => (
    <button
      onClick={e => { e.stopPropagation(); onRemove(); }}
      style={{
        position: 'absolute', top: 8, right: 8,
        width: 26, height: 26, borderRadius: '50%',
        background: dark ? 'oklch(0 0 0 / 0.65)' : 'oklch(0.18 0.012 60 / 0.85)',
        border: '1px solid oklch(1 0 0 / 0.15)',
        color: 'oklch(0.80 0 0)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, lineHeight: 1,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.15s',
      }}>×</button>
  );

  // ── Image / Upload ──────────────────────────────────────────────
  if (item.type === 'image' || item.type === 'upload') {
    return (
      <div style={{ position: 'relative', borderRadius: 'var(--r)', overflow: 'hidden', border: '1px solid var(--hairline-2)' }}
        onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {!imgError ? (
          <img src={item.url} alt={item.title || ''} onError={() => setImgError(true)}
            style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
        ) : (
          <div style={{ height: 160, background: 'oklch(0.20 0.015 60)', display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center', color: 'var(--fg-3)', fontSize: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚠</div>
              Image unavailable
            </div>
          </div>
        )}
        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(transparent 35%, oklch(0 0 0 / 0.80))',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: hovered ? 'auto' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '10px 12px',
        }}>
          {item.title && (
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: 'oklch(0.95 0.02 80)', lineHeight: 1.25 }}>
              {item.title}
            </div>
          )}
          {item.note && (
            <div style={{ fontSize: 11, color: 'oklch(0.70 0.02 80)', fontStyle: 'italic', marginTop: 4 }}>
              {item.note}
            </div>
          )}
          <TagRow tags={item.tags} />
        </div>
        <RemoveBtn dark />
      </div>
    );
  }

  // ── YouTube ─────────────────────────────────────────────────────
  if (item.type === 'youtube') {
    const vid = ytId(item.url);
    return (
      <div style={{ position: 'relative', borderRadius: 'var(--r)', overflow: 'hidden', border: '1px solid var(--hairline-2)' }}
        onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {vid ? (
          <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt=""
            style={{ width: '100%', display: 'block' }} onError={() => {}} />
        ) : (
          <div style={{ height: 140, background: 'oklch(0.16 0.02 25)', display: 'grid', placeItems: 'center' }}>
            <div style={{ color: 'oklch(0.65 0.1 25)', fontSize: 32 }}>▶</div>
          </div>
        )}
        {/* Play overlay */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'oklch(0 0 0 / 0.25)' }}>
          <a href={item.url} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'oklch(0 0 0 / 0.72)',
              border: '2px solid oklch(1 0 0 / 0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', transition: 'transform 0.15s',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5 L19 12 L8 19 Z" />
              </svg>
            </div>
          </a>
        </div>
        {/* Title bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, oklch(0 0 0 / 0.85))',
          padding: '24px 12px 10px',
        }}>
          {item.title && (
            <a href={item.url} target="_blank" rel="noopener"
              style={{ color: 'var(--fg)', textDecoration: 'none', fontFamily: 'var(--f-display)', fontSize: 13.5, lineHeight: 1.25 }}>
              {item.title}
            </a>
          )}
          <TagRow tags={item.tags} />
        </div>
        <RemoveBtn dark />
      </div>
    );
  }

  // ── TikTok ──────────────────────────────────────────────────────
  if (item.type === 'tiktok') {
    return (
      <div style={{ position: 'relative', borderRadius: 'var(--r)', overflow: 'hidden', border: '1px solid var(--hairline-2)', background: 'oklch(0.18 0.015 330)' }}
        onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <div style={{ padding: '16px 14px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, oklch(0.55 0.2 330), oklch(0.55 0.2 190))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M19.6 7.5a5.2 5.2 0 0 1-3.2-1.1v7.3a5.5 5.5 0 1 1-5.5-5.5h.4v2.4a3.2 3.2 0 1 0 3.2 3.1V2h2.4a5.2 5.2 0 0 0 2.7 5.5Z" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: 'var(--fg)' }}>{item.title || 'TikTok'}</div>
              <a href={item.url} target="_blank" rel="noopener" style={{ fontSize: 11, color: 'var(--fg-3)', wordBreak: 'break-all', textDecoration: 'none' }}>
                {domain(item.url)}
              </a>
            </div>
          </div>
          {item.note && <div style={{ fontSize: 12, color: 'var(--fg-2)', fontStyle: 'italic' }}>{item.note}</div>}
          <TagRow tags={item.tags} />
          <a href={item.url} target="_blank" rel="noopener" className="tbtn" style={{ display: 'inline-flex', marginTop: 10, fontSize: 11 }}>
            Open in TikTok ↗
          </a>
        </div>
        <RemoveBtn />
      </div>
    );
  }

  // ── Quote ────────────────────────────────────────────────────────
  if (item.type === 'quote') {
    const color = item.color || 'shadow';
    const [bg1, bg2] = QUOTE_BG[color] || QUOTE_BG.shadow;
    const border = QUOTE_BORDER[color] || QUOTE_BORDER.shadow;
    return (
      <div style={{ position: 'relative', borderRadius: 'var(--r)', border: `1px solid ${border}`, background: `linear-gradient(160deg, ${bg1} 0%, ${bg2} 100%)`, padding: '20px 18px' }}
        onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {/* Opening mark */}
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, lineHeight: 0.8, color: border, marginBottom: 8, userSelect: 'none' }}>"</div>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 16.5, lineHeight: 1.65,
          fontStyle: 'italic',
          color: 'oklch(0.92 0.02 80)',
        }}>
          {item.body}
        </div>
        {item.attribution && (
          <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--fg-3)', textAlign: 'right', letterSpacing: '0.04em' }}>
            — {item.attribution}
          </div>
        )}
        {item.note && (
          <div style={{ marginTop: 10, padding: '6px 8px', background: 'oklch(0 0 0 / 0.25)', borderRadius: 4, fontSize: 11, color: 'var(--fg-3)', fontStyle: 'italic' }}>
            {item.note}
          </div>
        )}
        <TagRow tags={item.tags} />
        <RemoveBtn />
      </div>
    );
  }

  // ── Link (generic / Pinterest) ───────────────────────────────────
  return (
    <div style={{ position: 'relative', borderRadius: 'var(--r)', border: '1px solid var(--hairline-2)', background: 'oklch(0.22 0.012 60)', padding: '14px 16px' }}
      onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 'var(--r)',
          background: 'oklch(0.18 0.012 60)',
          border: '1px solid var(--hairline-2)',
          display: 'grid', placeItems: 'center',
          flexShrink: 0,
          color: 'var(--brass)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 14.5, lineHeight: 1.25, marginBottom: 4 }}>
            {item.title || domain(item.url)}
          </div>
          <a href={item.url} target="_blank" rel="noopener"
            style={{ fontSize: 11, color: 'var(--fg-3)', wordBreak: 'break-all', textDecoration: 'none', display: 'block', marginBottom: 4 }}
            onMouseOver={e => e.target.style.color = 'var(--brass)'}
            onMouseOut={e => e.target.style.color = 'var(--fg-3)'}>
            {item.url}
          </a>
          {item.note && <div style={{ fontSize: 12, color: 'var(--fg-2)', fontStyle: 'italic' }}>{item.note}</div>}
          <TagRow tags={item.tags} />
        </div>
      </div>
      <RemoveBtn />
    </div>
  );
}

Object.assign(window, { Inspiration });
