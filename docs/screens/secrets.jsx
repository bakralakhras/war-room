// Secret / Reveal Tracker — "the Vault."
// Sealed = wax intact + blurred text. Cracked = wax broken, text visible, faded edges.
// Revealed = no wax, full opacity, marked revealed.

function Secrets({ state, onOpenNPC, onOpenFaction }) {
  const secrets = state.secrets || [];
  const npcs = state.npcs || [];
  const factions = state.factions || [];
  const [animating, setAnimating] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', weight: 'Scene', revealsTo: '', onReveal: '', relates: [] });
  const toggleRelate = (id) => {
    setForm(f => ({
      ...f,
      relates: f.relates.includes(id) ? f.relates.filter(x => x !== id) : [...f.relates, id]
    }));
  };
  const addSecret = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    window.Store.dispatch({
      type: 'SECRET_ADD',
      title: form.title.trim(),
      weight: form.weight,
      revealsTo: form.revealsTo.trim(),
      onReveal: form.onReveal.trim(),
      relates: form.relates
    });
    setForm({ title: '', weight: 'Scene', revealsTo: '', onReveal: '', relates: [] });
    setAdding(false);
  };

  const advance = (id) => {
    setAnimating(id);
    setTimeout(() => {
      const current = secrets.find(s => s.id === id);
      if (current) {
        const next = current.status === 'sealed' ? 'cracked'
                   : current.status === 'cracked' ? 'revealed'
                   : 'sealed';
        window.Store.dispatch({ type: 'SECRET_SET_STATUS', id, status: next });
      }
      setTimeout(() => setAnimating(null), 600);
    }, 50);
  };

  const filtered = filter === 'all' ? secrets : secrets.filter(s => s.status === filter);

  const tally = {
    sealed:   secrets.filter(s => s.status === 'sealed').length,
    cracked:  secrets.filter(s => s.status === 'cracked').length,
    revealed: secrets.filter(s => s.status === 'revealed').length,
  };

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>The Vault</div>
          <h1 className="page-title">Secrets &amp; Reveals</h1>
          <div className="page-sub">Some are for the party. Some are for the world. Some are for you alone.</div>
        </div>
        <div className="row" style={{ alignItems: 'center' }}>
          <button className="tbtn" onClick={() => setAdding(v => !v)}><Icon.Plus /> Seal a secret</button>
        </div>
      </div>

      {adding && (
        <form className="card cornered" onSubmit={addSecret} style={{ marginBottom: 14 }}>
          <div className="head">
            <Icon.Secrets />
            <span className="title">Seal a new secret</span>
            <div className="spacer"></div>
            <span className="smallcaps">DM only</span>
          </div>
          <div className="body">
            <div className="grid" style={{ gridTemplateColumns: '1fr 160px', gap: 10 }}>
              <Field label="Title" value={form.title} onChange={(v) => setForm(f => ({ ...f, title: v }))} autoFocus />
              <Field label="Weight" value={form.weight} onChange={(v) => setForm(f => ({ ...f, weight: v }))} />
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <Field label="Reveals when" value={form.revealsTo} onChange={(v) => setForm(f => ({ ...f, revealsTo: v }))} />
              <Field label="On reveal" value={form.onReveal} onChange={(v) => setForm(f => ({ ...f, onReveal: v }))} />
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 6 }}>Relates to</div>
              <div className="row wrap gap-sm">
                {[...npcs.map(n => ({ id: n.id, label: n.name, icon: Icon.Characters })), ...factions.map(f => ({ id: f.id, label: f.name, icon: Icon.Factions }))].map(item => {
                  const I = item.icon;
                  const active = form.relates.includes(item.id);
                  return (
                    <button key={item.id} type="button" className={active ? 'tbtn brass' : 'tbtn'}
                      style={{ fontSize: 11, padding: '4px 9px' }}
                      onClick={() => toggleRelate(item.id)}>
                      <I /> {item.label}
                    </button>
                  );
                })}
                {!npcs.length && !factions.length && <span className="muted" style={{ fontSize: 12 }}>No characters or factions yet.</span>}
              </div>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="tbtn brass" type="submit"><Icon.Plus /> Seal</button>
              <button className="tbtn" type="button" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      {/* tally plaques */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 14 }}>
        <FilterPlaque label="All" value={secrets.length} active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterPlaque label="Sealed"   value={tally.sealed}   active={filter === 'sealed'}   onClick={() => setFilter('sealed')}   accent="oxblood" />
        <FilterPlaque label="Cracked"  value={tally.cracked}  active={filter === 'cracked'}  onClick={() => setFilter('cracked')}  accent="ember" />
        <FilterPlaque label="Revealed" value={tally.revealed} active={filter === 'revealed'} onClick={() => setFilter('revealed')} accent="brass" />
      </div>

      {/* the vault */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {filtered.map(s => (
          <SealCard key={s.id} secret={s} animating={animating === s.id}
                    onAdvance={() => advance(s.id)}
                    npcs={npcs} factions={factions}
                    onOpenNPC={onOpenNPC} onOpenFaction={onOpenFaction} />
        ))}
        {filtered.length === 0 && (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>
            <div className="display">No secrets here.</div>
            That is itself a kind of secret.
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPlaque({ label, value, active, onClick, accent }) {
  const color = {
    oxblood: 'oklch(0.78 0.13 26)',
    ember:   'var(--ember)',
    brass:   'var(--brass)',
  }[accent] || 'var(--fg-1)';
  return (
    <div className="plaque clickable" onClick={onClick}
         style={{
           cursor: 'pointer',
           borderColor: active ? 'var(--brass)' : 'var(--brass-dim)',
           boxShadow: active ? 'var(--shadow-plate), 0 0 0 1px var(--brass)' : 'var(--shadow-plate)',
         }}>
      <div className="label">{label}</div>
      <div className="value" style={{ color }}>{value}</div>
      <div className="meta">{active ? 'showing' : 'click to filter'}</div>
    </div>
  );
}

function SealCard({ secret: s, animating, onAdvance, npcs, factions, onOpenNPC, onOpenFaction }) {
  const [open, setOpen] = React.useState(false);

  const tone = s.status === 'sealed' ? 'ox' : s.status === 'cracked' ? 'ember' : 'brass';

  return (
    <div className={`seal-card ${s.status}`} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          transform: animating ? 'rotate(-12deg) scale(1.05)' : 'rotate(0) scale(1)',
          transition: 'transform 0.45s cubic-bezier(.3,.7,.4,1.2)',
          flexShrink: 0,
        }}>
          <WaxSeal size={56} broken={s.status !== 'sealed'} label={s.weight[0]} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="between">
            <span className={`pill ${tone}`}>{s.weight} · {s.status}</span>
            <span className="muted" style={{ fontSize: 11, fontFamily: 'var(--f-mono)' }}>{s.id.toUpperCase()}</span>
          </div>
          <div style={{
            fontFamily: 'var(--f-display)',
            fontSize: 19, lineHeight: 1.3,
            marginTop: 8,
            color: s.status === 'sealed' ? 'var(--fg-3)' : 'var(--fg)',
            filter: s.status === 'sealed' ? 'blur(4px)' : 'none',
            transition: 'filter 0.5s, color 0.5s',
          }}>
            {s.title}
          </div>

          <div style={{ marginTop: 8 }}>
            <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 4 }}>Reveals when</div>
            <div className="muted" style={{ fontSize: 12.5, fontStyle: 'italic' }}>{s.revealsTo}</div>
          </div>

          {/* relations */}
          {(s.relates || []).length > 0 && (
            <div className="row wrap gap-sm" style={{ marginTop: 10 }}>
              {(s.relates || []).map(rid => {
                const npc = npcs.find(n => n.id === rid);
                const fac = factions.find(f => f.id === rid);
                const subject = npc || fac;
                if (!subject) return null;
                return (
                  <span key={rid}
                        className="pill iron clickable"
                        style={{ cursor: 'pointer', fontSize: 10 }}
                        onClick={() => npc ? onOpenNPC(npc.id) : onOpenFaction(fac.id)}>
                    {npc ? <Icon.Characters /> : <Icon.Factions />}
                    <span style={{ marginLeft: 2 }}>{subject.name}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* on reveal */}
          {open && (
            <div style={{
              marginTop: 12, padding: '10px 12px',
              border: '1px dashed var(--brass-dim)', borderRadius: 'var(--r)',
              background: 'oklch(0.16 0.012 60 / 0.55)',
            }}>
              <div className="smallcaps" style={{ marginBottom: 4 }}>On reveal</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--fg-1)' }}>{s.onReveal}</div>
            </div>
          )}
        </div>
      </div>

      {/* footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--hairline-2)',
        background: 'oklch(0 0 0 / 0.25)',
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        <button className="tbtn" style={{ fontSize: 11, padding: '4px 9px' }} onClick={() => setOpen(o => !o)}>
          {open ? 'Hide consequences' : 'See consequences'}
        </button>
        <div className="spacer"></div>
        {s.status !== 'revealed' && (
          <button className={s.status === 'cracked' ? 'tbtn primary' : 'tbtn'}
                  style={{ fontSize: 11, padding: '4px 9px' }}
                  onClick={onAdvance}>
            {s.status === 'sealed' ? <><Icon.Eye /> Crack the seal</> : <><Icon.Quill /> Reveal to party</>}
          </button>
        )}
        {s.status === 'revealed' && (
          <button className="tbtn" style={{ fontSize: 11, padding: '4px 9px' }} onClick={onAdvance}>
            Re-seal
          </button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Secrets });
