// NPC Profile - editable dossier page.

function NPCProfile({ state, npcId, onNav, onOpenFaction, onOpenSecret }) {
  const npcs = state.npcs || [];
  const factions = state.factions || [];
  const secrets = state.secrets || [];
  const npc = npcs.find(n => n.id === npcId) || npcs[0];
  const [editing, setEditing] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');

  if (!npc) return <div className="empty"><div className="display">No character found.</div></div>;

  const fac = factions.find(f => f.id === npc.faction);
  const relatedSecrets = secrets.filter(s => (s.relates || []).includes(npc.id));
  const bonds = listValue(npc.bonds);
  const tags = listValue(npc.tags);
  const set = (field, value) => window.Store.dispatch({ type: 'NPC_SET_FIELD', id: npc.id, field, value });
  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'oklch(0.16 0.012 60 / 0.55)',
    border: '1px solid var(--hairline-2)',
    borderRadius: 'var(--r)',
    color: 'var(--fg)',
    padding: '8px 10px',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
  };

  const handlePortraitUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    readPortrait(
      file,
      (image) => {
        set('image', image);
        e.target.value = '';
      },
      (message) => {
        setUploadError(message);
        e.target.value = '';
      }
    );
  };
  const handlePortraitDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    setUploadError('');
    readPortrait(file, (image) => set('image', image), setUploadError);
  };

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="smallcaps" style={{ marginBottom: 6 }}>
            <span className="muted" style={{ cursor: 'pointer' }} onClick={() => onNav('characters')}>Characters</span>
            <span style={{ margin: '0 8px', opacity: 0.5 }}>&gt;</span>
            <span>Dossier</span>
          </div>
          {editing ? (
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 820 }}>
              <label>
                <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Name</div>
                <input value={npc.name || ''} onChange={e => set('name', e.target.value)} autoFocus style={{ ...inputStyle, fontFamily: 'var(--f-display)', fontSize: 24 }} />
              </label>
              <label>
                <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 5 }}>Title</div>
                <input value={npc.title || ''} onChange={e => set('title', e.target.value)} style={inputStyle} />
              </label>
            </div>
          ) : (
            <>
              <h1 className="page-title">{npc.name || 'Unnamed character'}</h1>
              <div className="page-sub">{npc.title || 'No title recorded.'}</div>
            </>
          )}
        </div>
        <div className="row" style={{ alignItems: 'center' }}>
          {editing ? (
            <select value={npc.disposition || 'neutral'} onChange={e => set('disposition', e.target.value)} style={{ ...inputStyle, width: 150 }}>
              <option value="ally">ally</option>
              <option value="neutral">neutral</option>
              <option value="rival">rival</option>
              <option value="enemy">enemy</option>
            </select>
          ) : (
            <DispPill d={npc.disposition} />
          )}
          <button className={editing ? 'tbtn brass' : 'tbtn'} onClick={() => setEditing(v => !v)}>
            <Icon.Quill /> {editing ? 'Done editing' : 'Edit'}
          </button>
          <button className={npc.public ? 'tbtn brass' : 'tbtn'} onClick={() => set('public', !npc.public)}>
            <Icon.PlayerView /> {npc.public ? 'Shown to party' : 'Show to party'}
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <div className="col">
          <div className="card cornered">
            <div className="body" style={{ padding: 16 }}>
              <div style={{
                aspectRatio: '4/5',
                borderRadius: 'var(--r)',
                border: '1px solid var(--brass-dim)',
                background: npc.image ? 'oklch(0.14 0.01 60)' :
                  'repeating-linear-gradient(45deg, oklch(0.25 0.014 64) 0, oklch(0.25 0.014 64) 8px, oklch(0.21 0.014 60) 8px, oklch(0.21 0.014 60) 16px)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 0 4px oklch(0.16 0.012 60), inset 0 0 0 5px oklch(0.4 0.07 80 / 0.4)',
              }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handlePortraitDrop}
              >
                {npc.image ? (
                  <img src={npc.image} alt={npc.name || 'Character portrait'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <>
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'grid', placeItems: 'center',
                      fontFamily: 'var(--f-mono)', fontSize: 11,
                      color: 'var(--fg-3)', letterSpacing: '0.16em', textTransform: 'uppercase',
                    }}>portrait - {firstName(npc.name)}</div>
                    <div style={{ position: 'absolute', top: 8, left: 8 }}>
                      <Sigil kind={fac ? fac.sigil : 'crown'} size={22} color="var(--brass)" />
                    </div>
                  </>
                )}
                {npc.image && (
                  <button style={{
                    position: 'absolute', bottom: 8, left: 8,
                    padding: '3px 9px', fontSize: 10.5,
                    background: 'oklch(0.18 0.012 60 / 0.9)', border: '1px solid var(--hairline-2)',
                    borderRadius: 'var(--r)', color: 'var(--fg-3)', cursor: 'pointer',
                  }} onClick={() => set('image', '')}>Clear</button>
                )}
              </div>
              <label className="tbtn brass" style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: 10,
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
              }}>
                <Icon.Plus /> {npc.image ? 'Replace portrait' : 'Upload portrait'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePortraitUpload}
                  title={npc.image ? 'Replace portrait' : 'Upload portrait'}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    fontSize: 80,
                  }}
                />
              </label>
              <div className="muted" style={{ marginTop: 6, fontSize: 11.5, textAlign: 'center' }}>
                JPG, PNG, or WebP. You can also drop an image on the frame.
              </div>
              {uploadError && (
                <div style={{
                  marginTop: 8,
                  padding: '7px 9px',
                  border: '1px solid var(--crimson)',
                  borderRadius: 'var(--r)',
                  color: 'oklch(0.82 0.12 28)',
                  background: 'oklch(0.18 0.06 28 / 0.45)',
                  fontSize: 12,
                  lineHeight: 1.35,
                }}>{uploadError}</div>
              )}

              <div style={{ marginTop: 14, textAlign: 'center' }}>
                <div className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>{npc.name || 'Unnamed character'}</div>
                <div className="muted" style={{ fontStyle: 'italic', fontSize: 12.5, marginTop: 4 }}>{npc.title || 'No title'}</div>
              </div>

              <div className="hr brass" style={{ margin: '12px 0' }}></div>

              <div className="col" style={{ gap: 8 }}>
                <Attr label="Location" value={npc.location} editing={editing} onChange={v => set('location', v)} inputStyle={inputStyle} />
                <FactionAttr value={npc.faction || ''} fac={fac} factions={factions} editing={editing} set={set} onOpenFaction={onOpenFaction} inputStyle={inputStyle} />
                <Attr label="Appearance" value={npc.appearance} editing={editing} onChange={v => set('appearance', v)} inputStyle={inputStyle} />
                <Attr label="Voice" value={npc.voice} editing={editing} onChange={v => set('voice', v)} inputStyle={inputStyle} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="body" style={{ padding: 12 }}>
              <div className="between" style={{ marginBottom: 8 }}>
                <div className="smallcaps">Tags</div>
                {editing && (
                  <label className="row" style={{ gap: 6, fontSize: 11 }}>
                    <input type="checkbox" checked={!!npc.likely} onChange={e => set('likely', e.target.checked)} />
                    likely next session
                  </label>
                )}
              </div>
              {editing ? (
                <input value={tags.join(', ')} onChange={e => set('tags', splitList(e.target.value))} placeholder="court, spy, merchant" style={inputStyle} />
              ) : (
                <div className="row wrap gap-sm">
                  {tags.length ? tags.map(t => <span key={t} className="pill iron" style={{ fontSize: 10.5 }}>{t}</span>) : <span className="muted">No tags recorded.</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col">
          <div className="ledger">
            <div className="head"><Icon.Quill /> <span>From the chronicle</span></div>
            <div className="body" style={{ padding: '22px 24px' }}>
              {editing ? (
                <textarea value={npc.quote || ''} onChange={e => set('quote', e.target.value)} rows={4} placeholder="A line that captures this character." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55, color: 'var(--ink)' }} />
              ) : (
                <div className="display" style={{ fontSize: 24, fontStyle: 'italic', lineHeight: 1.4, color: 'var(--ink)' }}>
                  "{npc.quote || 'No quote recorded.'}"
                </div>
              )}
              <div className="muted" style={{ marginTop: 10, fontStyle: 'italic', fontSize: 12, color: 'var(--ink-dim)' }}>
                {npc.location ? `- associated with ${npc.location}` : '- add a location or scene note'}
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <TextPanel title="Wants" value={npc.wants} editing={editing} onChange={v => set('wants', v)} inputStyle={inputStyle} warm />
            <TextPanel title="Fears" value={npc.fears} editing={editing} onChange={v => set('fears', v)} inputStyle={inputStyle} danger />
          </div>

          <div className="card cornered">
            <div className="head">
              <Icon.Secrets />
              <span className="title">What they carry</span>
              <div className="spacer"></div>
              <span className="smallcaps">{relatedSecrets.length} sealed</span>
            </div>
            <div className="body">
              <div className="col" style={{ gap: 8 }}>
                {relatedSecrets.length === 0 && <div className="muted" style={{ fontStyle: 'italic' }}>No secrets attributed.</div>}
                {relatedSecrets.map(s => (
                  <div key={s.id} className={`seal-card ${s.status} clickable`}
                       onClick={() => onOpenSecret(s.id)}
                       style={{ padding: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <WaxSeal size={40} broken={s.status !== 'sealed'} label={(s.weight || 'S')[0]} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="smallcaps" style={{ color: 'var(--brass-dim)', marginBottom: 2 }}>
                        {s.weight || 'Secret'} · {s.status || 'sealed'}
                      </div>
                      <div style={{
                        fontFamily: 'var(--f-display)', fontSize: 14.5,
                        color: s.status === 'sealed' ? 'var(--fg-3)' : 'var(--fg-1)',
                        filter: s.status === 'sealed' ? 'blur(3.5px)' : 'none',
                      }}>{s.title || 'Untitled secret'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
            <TextPanel title="DM note" icon={Icon.Quill} value={npc.dmNote || npc.note} editing={editing} onChange={v => set('dmNote', v)} inputStyle={inputStyle} />
            <div className="card cornered">
              <div className="head">
                <Icon.Relationships />
                <span className="title">Bonds</span>
              </div>
              <div className="body">
                {editing ? (
                  <textarea value={bonds.join('\n')} onChange={e => set('bonds', splitLines(e.target.value))} rows={5} placeholder="One bond per line" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.45 }} />
                ) : (
                  <>
                    {bonds.length === 0 && <div className="muted" style={{ fontStyle: 'italic' }}>None recorded.</div>}
                    {bonds.map((b, i) => (
                      <div key={i} className="lrow" style={{ padding: '6px 0' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--brass)', flexShrink: 0 }}></span>
                        <span style={{ fontSize: 12.5 }}>{b}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function Attr({ label, value, editing, onChange, inputStyle }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10, alignItems: 'center' }}>
      <div className="smallcaps" style={{ fontSize: 9.5 }}>{label}</div>
      {editing ? (
        <input value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: 12.5 }} />
      ) : (
        <div style={{ fontSize: 12.5, color: value ? 'var(--fg-1)' : 'var(--fg-3)', fontStyle: value ? 'normal' : 'italic' }}>
          {value || 'Not recorded'}
        </div>
      )}
    </div>
  );
}

function FactionAttr({ value, fac, factions, editing, set, onOpenFaction, inputStyle }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10, alignItems: 'center' }}>
      <div className="smallcaps" style={{ fontSize: 9.5 }}>Faction</div>
      {editing ? (
        <select value={value || ''} onChange={e => set('faction', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: 12.5 }}>
          <option value="">none</option>
          {factions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      ) : (
        <div onClick={fac ? () => onOpenFaction(fac.id) : null} style={{
          fontSize: 12.5,
          color: fac ? 'var(--brass)' : 'var(--fg-3)',
          cursor: fac ? 'pointer' : 'default',
          textDecoration: fac ? 'underline dotted var(--brass-dim)' : 'none',
          textUnderlineOffset: 3,
          fontStyle: fac ? 'normal' : 'italic',
        }}>{fac ? fac.name : 'None'}</div>
      )}
    </div>
  );
}

function TextPanel({ title, icon: IconComponent, value, editing, onChange, inputStyle, warm, danger }) {
  return (
    <div className={`card ${warm ? 'warm ' : ''}cornered`} style={danger ? { background: 'linear-gradient(180deg, oklch(0.24 0.05 26 / 0.5), oklch(0.2 0.04 26 / 0.4))' } : null}>
      <div className="head">
        {IconComponent && <IconComponent />}
        <span className="title" style={{ color: danger ? 'oklch(0.78 0.13 26)' : warm ? 'var(--brass)' : undefined }}>{title}</span>
      </div>
      <div className="body">
        {editing ? (
          <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.45 }} />
        ) : (
          <div className="display" style={{ fontSize: 18, lineHeight: 1.35, color: value ? undefined : 'var(--fg-3)', fontStyle: value ? 'normal' : 'italic' }}>
            {value || 'Not recorded.'}
          </div>
        )}
      </div>
    </div>
  );
}

function listValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value).split(/[\n,]/).map(v => v.trim()).filter(Boolean);
}

function splitList(value) {
  return String(value || '').split(',').map(v => v.trim()).filter(Boolean);
}

function splitLines(value) {
  return String(value || '').split('\n').map(v => v.trim()).filter(Boolean);
}

function firstName(value) {
  return String(value || 'unknown').trim().split(/\s+/)[0] || 'unknown';
}

function readPortrait(file, onReady, onError) {
  if (!file || !String(file.type || '').startsWith('image/')) {
    onError?.('Choose a normal image file: PNG, JPG, or WebP.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const source = reader.result;
    const img = new Image();
    img.onload = () => {
      try {
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas is unavailable.');
        ctx.drawImage(img, 0, 0, width, height);
        onReady(canvas.toDataURL('image/jpeg', 0.78));
      } catch (err) {
        onError?.('Could not process that image. Try a smaller JPG or PNG.');
      }
    };
    img.onerror = () => onError?.('This image format could not be displayed here. Try JPG, PNG, or WebP.');
    img.src = source;
  };
  reader.onerror = () => onError?.('Could not read that file.');
  reader.readAsDataURL(file);
}

Object.assign(window, { NPCProfile });
