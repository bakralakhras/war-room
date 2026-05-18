// The War Room — landing/marketing site.
// Royal, ceremonial, for-DMs-only.

function HeraldicMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="shield-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.36 0.06 70)" />
          <stop offset="100%" stopColor="oklch(0.22 0.04 65)" />
        </linearGradient>
      </defs>
      <path d="M 16 2 L 28 5 L 28 16 C 28 23, 22 28, 16 30 C 10 28, 4 23, 4 16 L 4 5 Z"
            fill="url(#shield-grad)"
            stroke="var(--royal-gold)" strokeWidth="1.1" />
      {/* saber */}
      <path d="M 9 9 L 22 22" stroke="var(--royal-gold)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 22 22 L 24 21 M 22 22 L 23 24" stroke="var(--royal-gold)" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="8.5" cy="8.5" r="1" fill="var(--royal-gold)" />
      {/* quill */}
      <path d="M 23 9 Q 16 14, 9 22 L 11 23 Q 19 17, 24 10 Z"
            fill="oklch(0.92 0.04 80)" stroke="oklch(0.45 0.05 50)" strokeWidth="0.4" />
      <path d="M 9 22 L 6.5 24.5" stroke="oklch(0.45 0.05 50)" strokeWidth="0.8" />
      {/* crown atop shield */}
      <path d="M 11 4 L 12.5 2.4 L 14 4 L 16 2 L 18 4 L 19.5 2.4 L 21 4"
            fill="none" stroke="var(--royal-gold)" strokeWidth="0.8" />
    </svg>
  );
}

function Crown({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="crown-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.86 0.14 80)" />
          <stop offset="100%" stopColor="oklch(0.58 0.11 78)" />
        </linearGradient>
      </defs>
      <path d="M 10 44 L 54 44 L 50 22 L 42 30 L 36 16 L 32 22 L 28 16 L 22 30 L 14 22 Z"
            fill="url(#crown-grad)" stroke="oklch(0.50 0.10 78)" strokeWidth="0.8" />
      <circle cx="32" cy="16" r="2.4" fill="oklch(0.55 0.18 28)" stroke="oklch(0.30 0.16 26)" strokeWidth="0.5" />
      <circle cx="14" cy="22" r="1.6" fill="oklch(0.55 0.18 28)" />
      <circle cx="50" cy="22" r="1.6" fill="oklch(0.55 0.18 28)" />
      <path d="M 10 48 L 54 48" stroke="oklch(0.50 0.10 78)" strokeWidth="1.2" />
      <path d="M 10 52 L 54 52" stroke="oklch(0.50 0.10 78)" strokeWidth="0.6" opacity="0.5" />
    </svg>
  );
}

// ── NAV ──────────────────────────────────────────────────────────────
function SiteNav() {
  return (
    <nav className="site-nav">
      <a href="#top" className="brand-mark" style={{ textDecoration: 'none' }}>
        <div className="sigil-shield"><HeraldicMark size={32} /></div>
        <div className="word">
          <b>WAR ROOM</b>
          <small>For the DM, &amp; no other</small>
        </div>
      </a>
      <div className="nav-links">
        <a href="#pillars">The Tool</a>
        <a href="#codex">The Codex</a>
        <a href="#vault">The Vault</a>
        <a href="#decree">By Royal Decree</a>
        <a href="#tiers">Tiers</a>
        <a href="#faq">FAQ</a>
      </div>
      <div className="nav-spacer"></div>
      <div className="nav-actions">
        <a href="demo.html" className="r-btn ghost">Sign in</a>
        <a href="demo.html" className="r-btn gold">Open the War Room <span className="arrow">→</span></a>
      </div>
    </nav>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────
function MiniDashboard() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: 480, background: 'oklch(0.20 0.030 62)' }}>
      {/* sidebar */}
      <div style={{
        background: 'linear-gradient(180deg, oklch(0.18 0.025 60), oklch(0.16 0.022 60))',
        borderRight: '1px solid oklch(0 0 0 / 0.55)',
        padding: '14px 10px',
        fontSize: 11.5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--hairline-2)' }}>
          <HeraldicMark size={22} />
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 14 }}>Vaelthorne</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--fg-4)', padding: '8px 6px 4px' }}>Play</div>
          {[
            { l: 'War Room', a: true },
            { l: 'Sessions' },
            { l: 'Encounters' },
          ].map(it => (
            <div key={it.l} style={{
              padding: '5px 8px', borderRadius: 4,
              background: it.a ? 'linear-gradient(90deg, oklch(0.28 0.04 70 / 0.7), transparent)' : 'transparent',
              color: it.a ? 'var(--fg)' : 'var(--fg-2)',
              fontSize: 11.5, marginBottom: 2, position: 'relative',
            }}>
              {it.a && <span style={{ position: 'absolute', left: 2, top: 6, bottom: 6, width: 2, background: 'var(--royal-gold)', borderRadius: 1 }}></span>}
              {it.l}
            </div>
          ))}
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--fg-4)', padding: '10px 6px 4px' }}>World</div>
          {['Codex', 'Characters', 'Factions', 'Maps', 'Timeline'].map(l => (
            <div key={l} style={{ padding: '5px 8px', fontSize: 11.5, color: 'var(--fg-2)' }}>{l}</div>
          ))}
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--fg-4)', padding: '10px 6px 4px' }}>DM Tools</div>
          {['Secrets', 'Relationships', 'Handouts'].map(l => (
            <div key={l} style={{ padding: '5px 8px', fontSize: 11.5, color: 'var(--fg-2)' }}>{l}</div>
          ))}
        </div>
      </div>
      {/* main content */}
      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--royal-gold)', marginBottom: 4 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--candle)', marginRight: 6, verticalAlign: 'middle' }}></span>
          Session XIV approaches
        </div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, lineHeight: 1, color: 'var(--fg)' }}>The War Room</div>
        <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--fg-3)', marginTop: 2 }}>Embers of Vaelthorne</div>

        {/* mini pulse strip */}
        <div style={{ display: 'flex', marginTop: 14, border: '1px solid var(--hairline-2)', borderRadius: 6, overflow: 'hidden' }}>
          {[
            { l: 'Iron Concord', v: '5/8', d: '+2' },
            { l: 'Veiled Hand', v: '4/6', d: '+1' },
            { l: 'Saltbrothers', v: '3/6', d: 'held' },
            { l: 'Ashen Court', v: '1/4', d: 'calm' },
          ].map(c => (
            <div key={c.l} style={{ flex: 1, padding: '7px 9px', borderRight: '1px dashed var(--hairline-2)', background: 'oklch(0.22 0.028 62 / 0.5)' }}>
              <div style={{ fontSize: 8.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fg-3)', fontWeight: 600 }}>{c.l}</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 13, color: 'var(--fg)', marginTop: 2 }}>{c.v}</div>
              <div style={{ fontSize: 9.5, color: c.d.startsWith('+') ? 'var(--ember)' : 'var(--forest)', fontFamily: 'var(--f-mono)' }}>{c.d}</div>
            </div>
          ))}
        </div>

        {/* session brief + rumor */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginTop: 12 }}>
          <div style={{
            padding: '14px 14px 12px', borderRadius: 6,
            background: 'radial-gradient(140% 100% at 50% 0%, oklch(0.92 0.05 84) 0%, oklch(0.84 0.06 78) 100%)',
            color: 'var(--ink)', border: '1px solid oklch(0.55 0.07 70 / 0.45)',
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <WaxSeal size={28} label="XIV" />
              <div>
                <div style={{ fontSize: 8.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'oklch(0.42 0.13 28)', fontWeight: 700 }}>Session Brief</div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 14, lineHeight: 1.1 }}>XIV — Bells of Cinderhold</div>
              </div>
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.55, color: 'var(--ink)' }}>
              Bells out of tune at <span style={{ color: 'oklch(0.32 0.16 28)', textDecoration: 'underline dotted' }}>@Cinderhold</span>.
              A funeral procession winds through the lower city.{' '}
              <span style={{ color: 'oklch(0.32 0.16 28)', textDecoration: 'underline dotted' }}>@Theron</span>'s widow does not weep.
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(180deg, oklch(0.90 0.055 82), oklch(0.83 0.065 78))',
            color: 'var(--ink)', padding: '12px 14px', borderRadius: 3,
            transform: 'rotate(-0.6deg)', position: 'relative',
            boxShadow: '0 8px 14px -10px oklch(0 0 0 / 0.55)',
          }}>
            <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, var(--royal-gold), var(--royal-gold-2))', boxShadow: '0 1px 2px oklch(0 0 0 / 0.55)' }}></div>
            <div style={{ fontSize: 8.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'oklch(0.40 0.10 40)', fontWeight: 700, marginTop: 6 }}>OMINOUS</div>
            <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 12.5, lineHeight: 1.4, marginTop: 4, color: 'var(--ink)' }}>
              "A child sings the regicide rhyme. No one remembers teaching it."
            </div>
          </div>
        </div>

        {/* faction banners */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
          {[
            { name: 'Iron Concord', cls: 'iron',    sigil: 'concord', seg: 8, fill: 5, color: 'iron' },
            { name: 'Veiled Hand',  cls: 'crimson', sigil: 'hand',    seg: 6, fill: 4, color: 'oxblood' },
            { name: 'Saltbrothers', cls: 'forest',  sigil: 'anchor',  seg: 6, fill: 3, color: 'forest' },
          ].map(b => (
            <div key={b.name}>
              <div className={`banner ${b.cls}`} style={{ padding: '8px 10px 14px', borderRadius: '4px 4px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'oklch(0 0 0 / 0.35)', border: '1px solid oklch(1 0 0 / 0.25)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Sigil kind={b.sigil} size={12} color="oklch(0.95 0.03 80)" />
                  </div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 12, lineHeight: 1 }}>{b.name}</div>
                </div>
              </div>
              <div style={{ background: 'oklch(0.24 0.030 62)', borderRadius: '0 0 4px 4px', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FactionClock segments={b.seg} filled={b.fill} size={32} color={b.color} />
                <div style={{ fontSize: 10, color: 'var(--fg-2)', fontStyle: 'italic' }}>marching</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <header className="hero" id="top">
      <div className="hero-eyebrow">By Royal Decree · Anno MMXXVI</div>
      <div className="crown" style={{ marginBottom: 16 }}>
        <Crown size={72} />
      </div>
      <h1>
        The realm runs <em>itself.</em><br />
        You run <em>the table.</em>
      </h1>
      <p className="subhead">
        A worldbuilding command center for the Dungeon Master alone.
        Five faction clocks turn whether you watch or not.
        Every secret you keep is sealed in wax.
        Every name you write is linked to every other name.
      </p>
      <div className="hero-cta">
        <a href="demo.html" className="r-btn gold">
          Open the War Room <span className="arrow">→</span>
        </a>
        <a href="#pillars" className="r-btn ghost">Watch · II minutes</a>
      </div>
      <div className="hero-fineprint">
        Local-first · No player ever sees this <span className="dot"></span> Free for the first 100 articles
      </div>

      <div className="hero-mockup-wrap">
        <div className="hero-mockup">
          <div className="chrome">
            <i style={{ background: 'oklch(0.55 0.18 26)' }}></i>
            <i style={{ background: 'oklch(0.7 0.13 80)' }}></i>
            <i style={{ background: 'oklch(0.55 0.10 145)' }}></i>
            <div className="url">vaelthorne.warroom.local <span style={{ opacity: 0.5 }}>· session XIV</span></div>
          </div>
          <MiniDashboard />
        </div>
      </div>
    </header>
  );
}

// ── Manifesto ─────────────────────────────────────────────────────────
function Manifesto() {
  return (
    <section className="manifesto">
      <div className="manifesto-quote">
        Your players will never see this.<br />They were never meant to.
      </div>
      <div className="manifesto-attr">— DM's Oath, the first article ever written</div>
    </section>
  );
}

// ── Three Pillars ─────────────────────────────────────────────────────
function Pillars() {
  return (
    <section className="section" id="pillars">
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <div className="eyebrow"><span className="roman">I.</span> The pillars</div>
        <h2 className="display-h">Three rooms in one <em>court.</em></h2>
        <div className="lede" style={{ margin: '0 auto' }}>
          The War Room you run from. The Codex you write in. The Vault you hold over them.
        </div>
      </div>

      <div className="pillars">
        <div className="pillar">
          <div className="roman-num">I.</div>
          <h3>The War Room</h3>
          <p>
            A single screen to begin a session from. Faction clocks turning live.
            The party's last known location. Sealed secrets queued to surface.
            Rumors on the wind. Every NPC likely to walk in tonight.
          </p>
          <div className="pillar-mock" style={{ background: 'linear-gradient(180deg, oklch(0.26 0.034 64), oklch(0.20 0.030 62))', display: 'grid', placeItems: 'center' }}>
            <FactionClock segments={8} filled={5} size={88} color="oxblood" />
          </div>
        </div>
        <div className="pillar">
          <div className="roman-num">II.</div>
          <h3>The Codex</h3>
          <p>
            Every name you write becomes a link to every other name.
            NPCs, places, factions, lore, relics — one keystroke (<span style={{ fontFamily: 'var(--f-mono)', color: 'var(--royal-gold)' }}>@</span>)
            and the realm cross-references itself.
          </p>
          <div className="pillar-mock" style={{
            background: 'radial-gradient(140% 100% at 50% 0%, oklch(0.92 0.045 84), oklch(0.82 0.060 78))',
            display: 'grid', placeItems: 'center', color: 'var(--ink)',
            fontFamily: 'var(--f-display)', fontStyle: 'italic',
          }}>
            <div style={{ textAlign: 'center', padding: '0 14px' }}>
              <span style={{ color: 'oklch(0.32 0.16 28)' }}>@Halsane</span> baptised <span style={{ color: 'oklch(0.32 0.16 28)' }}>@Theron</span> in his cradle.
            </div>
          </div>
        </div>
        <div className="pillar">
          <div className="roman-num">III.</div>
          <h3>The Vault</h3>
          <p>
            Every secret sealed in wax until the world earns it.
            Cracks open when a condition is met. The players never see the seal.
            You see them all.
          </p>
          <div className="pillar-mock" style={{
            background: 'radial-gradient(140% 80% at 50% 0%, oklch(0.30 0.05 30), oklch(0.20 0.04 30))',
            display: 'grid', placeItems: 'center',
          }}>
            <WaxSeal size={72} label="◆" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Living World ──────────────────────────────────────────────────────
function LivingWorld() {
  const [filled, setFilled] = React.useState(5);
  return (
    <section className="section" id="living">
      <div className="feature-row">
        <div className="feature-text">
          <div className="eyebrow"><span className="roman">II.</span> A living world</div>
          <h2>Five clocks tick whether you <em>watch</em> or not.</h2>
          <p className="lede">
            Factions march on their own schedules. Pull a pin and the world holds its breath. Push a pin and an army moves.
          </p>
          <ul className="feature-bullets">
            <li>Ritual-circle clocks with 4/6/8 segments — segmented in brass, filled in oxblood, ember, or moonlight</li>
            <li>Tick by single segment, by event, or by session — the world honors all three</li>
            <li>Every clock writes itself into the chronicle. Roll it back. The chronicle remembers.</li>
            <li>Embed any clock inside its faction's codex page. It ticks where you read.</li>
          </ul>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <FactionClock segments={8} filled={filled} size={240} color="oxblood" />
          <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 24 }}>The Iron Concord</div>
            <div style={{ fontStyle: 'italic', color: 'var(--fg-2)', fontSize: 13.5, marginTop: 4 }}>March on Greymarch · <span className="mono">{filled}/8</span></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="r-btn ghost" onClick={() => setFilled(f => Math.max(0, f - 1))}>− Pull back</button>
            <button className="r-btn red"   onClick={() => setFilled(f => Math.min(8, f + 1))}>Advance the march →</button>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-3)', fontStyle: 'italic' }}>Try it — yes, it ticks for real.</div>
        </div>
      </div>
    </section>
  );
}

// ── Codex feature ─────────────────────────────────────────────────────
function CodexFeature() {
  return (
    <section className="section" id="codex">
      <div className="feature-row reverse">
        <div className="feature-text">
          <div className="eyebrow"><span className="roman">III.</span> The codex that links itself</div>
          <h2>Type <em>@</em> and the realm <em>cross-references.</em></h2>
          <p className="lede">
            Write a paragraph about a single innkeeper and you have written a thread that pulls on twelve other articles.
          </p>
          <ul className="feature-bullets">
            <li>Mention any NPC, faction, place, item, religion, or lore entry by typing @ — fuzzy search built in</li>
            <li>Every mention is bidirectional: the linked page shows where it's been named</li>
            <li>Drop caps, structured headers, freeform body. No mode switching. Markdown if you want it.</li>
            <li>Drag-to-reorder document tree with folders, color-coded icons, and a "recently quilled" rail</li>
          </ul>
        </div>
        <div style={{ position: 'relative' }}>
          <div className="doc-mock">
            <div className="doc-hd">
              <div className="crumb">Codex · People · Vaelthorne</div>
              <span style={{ marginLeft: 'auto', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'oklch(0.42 0.13 28)', fontWeight: 700 }}>● DM only</span>
            </div>
            <div className="doc-title">Halsane Mire</div>
            <div className="doc-meta">Abbess of the Drowned Lantern · last quilled 14 Vael</div>
            <p className="dropcap">
              Sixty years old and skin like vellum. Right hand permanently
              inked from chronicling. She speaks <em>quietly</em>, pauses before nouns,
              and addresses everyone by their full given name as if it were a small
              act of mercy. She runs <span className="ment faction">Pale Moon</span>,
              the cloister that took in the orphans of the Pale Plague — including
              her own brother and <span className="ment">Caedren Vask</span>, the
              boy who would grow to wear the Iron Writ.
            </p>
            <p>
              She hides the witness in the lower cells beneath
              <span className="ment place"> Drowned Lantern</span>.
              She has not lit the lantern these three nights.
            </p>

            <div className="embed-seal">
              <div className="seal-pellet">S</div>
              <div className="seal-txt">
                <b>Sealed · Campaign secret</b>
                <span className="seal-body">She baptised Theron Vael in his cradle. She has not slept since hearing the rhyme.</span>
                <div style={{ marginTop: 4, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'oklch(0.42 0.13 28)', fontStyle: 'normal', fontWeight: 700 }}>
                  reveals when Halsane is given no other choice
                </div>
              </div>
            </div>

            <p>
              <span className="ment lore">Concordat of Asters</span> mentions her
              house in the marginalia. She does not.
            </p>
          </div>

          {/* mention palette */}
          <div className="mention-palette">
            <div className="mp-search"><b>@con</b><span style={{ marginLeft: 4, opacity: 0.5 }}>|</span></div>
            <div className="mp-list">
              <div className="mp-row active">
                <div className="mp-icn fac">✦</div>
                <div className="mp-name">Iron <b style={{ color: 'var(--royal-gold)' }}>Con</b>cord</div>
                <div className="mp-kind">Faction</div>
              </div>
              <div className="mp-row">
                <div className="mp-icn npc">◐</div>
                <div className="mp-name">Caedren Vask</div>
                <div className="mp-kind">Person</div>
              </div>
              <div className="mp-row">
                <div className="mp-icn plc">◇</div>
                <div className="mp-name"><b style={{ color: 'var(--royal-gold)' }}>Con</b>cordat-of-Asters Garden</div>
                <div className="mp-kind">Place</div>
              </div>
              <div className="mp-row">
                <div className="mp-icn fac">❦</div>
                <div className="mp-name">The <b style={{ color: 'var(--royal-gold)' }}>Con</b>cordat of Asters</div>
                <div className="mp-kind">Lore</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Vault ─────────────────────────────────────────────────────────────
function VaultFeature() {
  const [open, setOpen] = React.useState(false);
  return (
    <section className="section" id="vault">
      <div className="feature-row">
        <div className="feature-text">
          <div className="eyebrow"><span className="roman">IV.</span> Secrets, sealed in wax</div>
          <h2>Some things are <em>for you alone.</em></h2>
          <p className="lede">
            A secret in War Room is not a hidden field. It is a sealed object with a condition.
            The wax breaks when the condition is met.
          </p>
          <ul className="feature-bullets">
            <li>Three weights: campaign, arc, scene — each with its own seal color and consequence</li>
            <li>Reveal conditions are first-class: "when party reaches X", "after session N", "when @NPC asks"</li>
            <li>Revealed secrets unlock everywhere they were mentioned — including inside other documents</li>
            <li>Inline secret blocks live inside the page where you wrote them. They blur until they don't.</li>
          </ul>
        </div>
        <div className="vault-stack">
          <div className="vault-card bg1"></div>
          <div className="vault-card bg2"></div>
          <div className={`vault-card ${open ? 'open' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
            <div className="stamp"><WaxSeal size={80} broken={open} label="C" /></div>
            <div className="v-eyebrow">Campaign · {open ? 'cracked' : 'sealed'}</div>
            <div className="v-title">
              {open ? "The Regent ordered the regicide." : "Something held by the king. Something kept by the keeper."}
            </div>
            <div className="v-meta">
              {open ? 'revealed when the ledger is read in full' : '— click the seal to break it —'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Cartography ───────────────────────────────────────────────────────
function MapPreview() {
  return (
    <div style={{
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
      border: '1px solid var(--royal-gold-dim)',
      boxShadow: '0 30px 60px -30px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(0 0 0 / 0.45)',
    }}>
      <svg viewBox="0 0 600 420" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <defs>
          <radialGradient id="ml-paper" cx="50%" cy="40%" r="80%">
            <stop offset="0%" stopColor="oklch(0.86 0.05 82)" />
            <stop offset="60%" stopColor="oklch(0.76 0.05 78)" />
            <stop offset="100%" stopColor="oklch(0.58 0.07 65)" />
          </radialGradient>
          <pattern id="ml-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="oklch(0.32 0.08 30)" strokeWidth="0.6" opacity="0.18" />
          </pattern>
          <pattern id="ml-water" patternUnits="userSpaceOnUse" width="8" height="8">
            <path d="M0 4 Q 2 2 4 4 T 8 4" stroke="oklch(0.42 0.07 235 / 0.45)" strokeWidth="0.6" fill="none" />
          </pattern>
          <radialGradient id="ml-ring" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.7 0.16 50 / 0.65)" />
            <stop offset="100%" stopColor="oklch(0.7 0.16 50 / 0)" />
          </radialGradient>
        </defs>
        <rect width="600" height="420" fill="url(#ml-paper)" />
        <rect width="600" height="420" fill="url(#ml-hatch)" opacity="0.7" />
        {/* coast/sea border east */}
        <path d="M 540 30 C 510 90, 580 160, 550 240 C 530 320, 580 380, 530 410"
              stroke="oklch(0.22 0.06 40)" strokeWidth="1.4" fill="none" opacity="0.65" />
        <path d="M 540 30 C 510 90, 580 160, 550 240 C 530 320, 580 380, 530 410 L 600 420 L 600 0 L 555 0 Z"
              fill="url(#ml-water)" opacity="0.9" />
        {/* rivers */}
        <path d="M 290 80 Q 310 160, 270 230 T 240 350" stroke="oklch(0.42 0.08 235 / 0.65)" strokeWidth="1.4" fill="none" />
        <path d="M 290 80 Q 360 130, 400 220 T 440 340" stroke="oklch(0.42 0.08 235 / 0.55)" strokeWidth="1.1" fill="none" />
        {/* region labels */}
        <text x="380" y="150" fontFamily="Cormorant Garamond, serif" fontSize="13" fontStyle="italic" fill="oklch(0.22 0.06 40)" opacity="0.6" letterSpacing="2">Vaelthorne</text>
        <text x="60"  y="370" fontFamily="Cormorant Garamond, serif" fontSize="13" fontStyle="italic" fill="oklch(0.22 0.06 40)" opacity="0.6" letterSpacing="2">The Margreave</text>
        {/* pins */}
        {[
          { x: 310, y: 140, label: 'Cinderhold',      col: 'oklch(0.42 0.13 26)' },
          { x: 480, y: 200, label: 'Greymarch',        col: 'oklch(0.32 0.014 60)' },
          { x: 220, y: 260, label: 'Ashen Hollow',     party: true },
          { x: 420, y: 320, label: 'Tidefast',         col: 'oklch(0.42 0.07 150)' },
          { x: 350, y: 50,  label: 'Garden of Asters', col: 'oklch(0.32 0.06 30)' },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.x}, ${p.y})`}>
            {p.party && (
              <circle r="18" fill="url(#ml-ring)">
                <animate attributeName="r" values="12;22;12" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.2;1" dur="3s" repeatCount="indefinite" />
              </circle>
            )}
            <circle r={p.party ? 7 : 6} fill={p.party ? 'oklch(0.92 0.04 80)' : p.col}
                    stroke={p.party ? 'oklch(0.32 0.13 26)' : 'oklch(0.16 0.04 30)'} strokeWidth="1.2" />
            {p.party && <circle r="3" fill="oklch(0.42 0.13 26)" />}
            <text x="10" y="4" fontFamily="Cormorant Garamond, serif" fontSize="12" fontWeight="500"
                  fill={p.party ? 'oklch(0.32 0.13 26)' : 'oklch(0.22 0.06 40)'}>{p.label}</text>
          </g>
        ))}
        {/* compass */}
        <g transform="translate(540, 50)">
          <circle r="22" fill="oklch(0.16 0.012 60 / 0.85)" stroke="var(--royal-gold-2)" strokeWidth="1" />
          <polygon points="0,-20 4,0 0,0" fill="oklch(0.55 0.13 26)" stroke="var(--royal-gold)" strokeWidth="0.4" />
          <polygon points="0,20 -4,0 0,0" fill="oklch(0.42 0.07 80)" stroke="var(--royal-gold)" strokeWidth="0.4" />
          <text textAnchor="middle" y="-13" fontFamily="Cormorant Garamond, serif" fontSize="7" fill="var(--royal-gold)">N</text>
        </g>
      </svg>
    </div>
  );
}

function Cartography() {
  return (
    <section className="section" id="map">
      <div className="feature-row reverse">
        <div className="feature-text">
          <div className="eyebrow"><span className="roman">V.</span> Cartography</div>
          <h2>A war table you can <em>pin to.</em></h2>
          <p className="lede">
            Maps that look like maps. Pins that open the article. Layers you toggle off for the player view.
          </p>
          <ul className="feature-bullets">
            <li>Parchment maps with ink rivers, hatched coasts, region labels, compass rose</li>
            <li>DM-only pins: hidden libraries, omen-sightings, dangers — invisible to the player layer</li>
            <li>Click any pin to open its codex page. Drag it. Mark it deceased. Move it across the realm.</li>
          </ul>
        </div>
        <MapPreview />
      </div>
    </section>
  );
}

// ── By Royal Decree ───────────────────────────────────────────────────
function ByRoyalDecree() {
  const items = [
    { roman: 'I.',    title: 'War Room dashboard',     desc: 'A single-screen launchpad for any session. Faction clocks, party position, sealed teasers, rumor reel.' },
    { roman: 'II.',   title: 'Codex with @-linking',   desc: 'Every name a link. Bidirectional. Backlinks every page.' },
    { roman: 'III.',  title: 'Sealed Secrets Vault',   desc: 'Inline secret blocks with reveal conditions. Wax breaks where the condition resolves.' },
    { roman: 'IV.',   title: 'Faction clocks',         desc: '4/6/8-segment ritual circles. Living world ticks on its own cadence.' },
    { roman: 'V.',    title: 'Cartography',            desc: 'Parchment maps with DM-only pins, layer toggles, and a separate player view.' },
    { roman: 'VI.',   title: 'Relationship board',     desc: 'A conspiracy board of blood, love, debt, enmity, and secret threads. Hover to isolate.' },
    { roman: 'VII.',  title: 'Timeline chronicle',     desc: 'Roman-numeral medallions along a brass spine. Branches for what-the-chronicle-omits.' },
    { roman: 'VIII.', title: 'Session prep template',  desc: 'A new session document seeded with expected NPCs, locations, and current clock states.' },
    { roman: 'IX.',   title: 'Handouts & Player View', desc: 'Push a sealed envelope to the player layer with one click. Pull it back the next morning.' },
    { roman: 'X.',    title: 'Random tables & rolls',  desc: 'Tavern names, hooks, omens, dice. Built-in. Local. No network round-trip.' },
    { roman: 'XI.',   title: 'Local-first storage',    desc: 'Your campaign lives on your machine. Export to one file. Cloud-sync optional.' },
    { roman: 'XII.',  title: 'No player accounts',     desc: 'There is one DM. There are no other DMs. There are no players. The tool agrees.' },
  ];
  return (
    <section className="section" id="decree">
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 0' }}>
        <div className="eyebrow"><span className="roman">VI.</span> By royal decree</div>
        <h2 className="display-h">What the war room <em>holds.</em></h2>
        <div className="lede" style={{ margin: '0 auto' }}>
          Twelve articles of governance, signed in brass.
        </div>
      </div>
      <div className="decree-grid">
        {items.map((it) => (
          <div key={it.roman} className="decree-item">
            <div className="roman">{it.roman}</div>
            <div>
              <h4>{it.title}</h4>
              <p>{it.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────
function Attest() {
  return (
    <section className="section" id="attest">
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 0' }}>
        <div className="eyebrow"><span className="roman">VII.</span> Dungeon Masters attest</div>
        <h2 className="display-h">Three letters, <em>none asked for.</em></h2>
      </div>
      <div className="attest-row">
        <div className="attest">
          <div className="stamp-wax"><WaxSeal size={36} label="✦" /></div>
          <div className="roman-num">Letter I.</div>
          <blockquote>I haven't lost a plot thread in three campaigns. The clocks remember even when I do not.</blockquote>
          <cite>Brenwick of the Pale Tower<span>Running &ldquo;Twelve Banners&rdquo; · 51 sessions</span></cite>
        </div>
        <div className="attest">
          <div className="stamp-wax"><WaxSeal size={36} label="❦" /></div>
          <div className="roman-num">Letter II.</div>
          <blockquote>I wrote one innkeeper. A week later I clicked his name in the Codex and an entire trade war fell out of the backlinks.</blockquote>
          <cite>Iola Vere<span>Running &ldquo;Salt &amp; Steel&rdquo; · 28 sessions</span></cite>
        </div>
        <div className="attest">
          <div className="stamp-wax"><WaxSeal size={36} label="◆" /></div>
          <div className="roman-num">Letter III.</div>
          <blockquote>My players think I have ten notebooks. I have one window. They are not invited.</blockquote>
          <cite>Theon Marlovich<span>Running &ldquo;The Long Reign&rdquo; · 14 sessions</span></cite>
        </div>
      </div>
    </section>
  );
}

// ── Tiers ─────────────────────────────────────────────────────────────
function Tiers() {
  return (
    <section className="section" id="tiers">
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <div className="eyebrow"><span className="roman">VIII.</span> By the realm's coin</div>
        <h2 className="display-h">Three <em>ranks.</em> Pay what becomes you.</h2>
        <div className="lede" style={{ margin: '0 auto' }}>
          One DM per campaign. No seats. No add-ons. No surprise.
        </div>
      </div>
      <div className="tiers">
        <div className="tier">
          <div className="tier-rank">Rank I</div>
          <div className="tier-name">Squire</div>
          <div className="tier-blurb">Begin your first campaign. Free as long as you keep it small.</div>
          <div className="price free">Free<span className="per">/forever</span></div>
          <ul className="tier-list">
            <li>One campaign</li>
            <li>Up to 100 codex articles</li>
            <li>Faction clocks, secrets, maps</li>
            <li>Local-first storage</li>
            <li className="muted">Custom domain</li>
            <li className="muted">Player view portal</li>
            <li className="muted">Cloud sync</li>
          </ul>
          <a href="demo.html" className="r-btn ghost" style={{ justifyContent: 'center' }}>Begin a campaign</a>
        </div>

        <div className="tier featured">
          <div className="tier-badge">Most Sworn</div>
          <div className="tier-rank">Rank II</div>
          <div className="tier-name">Knight</div>
          <div className="tier-blurb">For the DM running a serious campaign. Unlimited everything, two devices.</div>
          <div className="price"><span className="currency">$</span>9<span className="per">/mo</span></div>
          <ul className="tier-list">
            <li>Three campaigns</li>
            <li>Unlimited articles, secrets, factions</li>
            <li>Cloud sync · two devices</li>
            <li>Player view portal · per-player permissions</li>
            <li>Inline handouts &amp; wax stamps</li>
            <li>Random tables &amp; generators</li>
            <li className="muted">Co-DM / scribe seats</li>
          </ul>
          <a href="demo.html" className="r-btn gold" style={{ justifyContent: 'center' }}>Swear the oath →</a>
        </div>

        <div className="tier">
          <div className="tier-rank">Rank III</div>
          <div className="tier-name">Sovereign</div>
          <div className="tier-blurb">For the DM with a publisher, a podcast, or an unreasonable number of factions.</div>
          <div className="price"><span className="currency">$</span>19<span className="per">/mo</span></div>
          <ul className="tier-list">
            <li>Unlimited campaigns</li>
            <li>Unlimited devices</li>
            <li>Co-DM &amp; scribe seats</li>
            <li>Public Codex hosting (one realm)</li>
            <li>Custom domain &amp; theme</li>
            <li>Priority quills (support)</li>
            <li>Export to PDF, EPUB, &amp; Foundry</li>
          </ul>
          <a href="demo.html" className="r-btn ghost" style={{ justifyContent: 'center' }}>Take the throne</a>
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────
function FAQ() {
  const items = [
    {
      q: 'Is this for any tabletop system?',
      a: "Yes. The Codex is system-agnostic — there are no class fields, no rule lookups, no stat blocks unless you write them. If you run 5e, PF2, BitD, Mörk Borg, or a system of your own invention, the war room won't argue with you.",
    },
    {
      q: 'Do my players get logins?',
      a: "No, by design. There are no player accounts in the war room. A player view exists — a public-facing read-only portal you push handouts and maps to — but it is a separate surface. Players never see what you write.",
    },
    {
      q: 'Where does my data live?',
      a: "Local-first. Your campaign is a file on your machine. Cloud sync is optional and end-to-end encrypted on the Knight tier and above. You can export the whole realm to a single file at any time.",
    },
    {
      q: 'What if I already use Notion / Obsidian / a binder?',
      a: "Import from markdown, plain text, or a folder of files. The war room will infer document types where it can and leave the rest as freeform notes. Linking is added by hand the first time and remembered forever.",
    },
    {
      q: 'I run multiple campaigns. Can I share lore between them?',
      a: "On Sovereign, yes — a Realm is a shared codex layer that multiple campaigns can reference. Useful for shared settings, ongoing pantheons, and recurring NPCs.",
    },
    {
      q: 'Will there be AI features?',
      a: "Only where you ask for them. We will not write your campaign for you. We may help you find a name you forgot, summarize a session you wrote, or roll a tavern when you are stuck. The realm is yours.",
    },
  ];
  return (
    <section className="section" id="faq">
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <div className="eyebrow"><span className="roman">IX.</span> The DM's quill (FAQ)</div>
        <h2 className="display-h">Questions the realm <em>keeps asking.</em></h2>
      </div>
      <div className="faq-list" style={{ margin: '36px auto 0' }}>
        {items.map((it, i) => (
          <details key={i} className="faq-item" open={i === 0}>
            <summary>{it.q}</summary>
            <p>{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ── Founder Note ──────────────────────────────────────────────────────
function FounderNote() {
  return (
    <section className="section tight" id="founder">
      <div className="founder">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <WaxSeal size={64} label="A" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>A word from the keeper.</h3>
            <p className="dropcap">
              I built this tool for myself because I lost three campaigns to a stack of paper notebooks
              and one to a cloud drive that quietly stopped syncing in 2021. The war room is what
              I wish I had then. It is one window, on my machine, that remembers everything I have
              told it, links what I have linked, and seals what I have asked it to seal.
            </p>
            <p style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--ink)', margin: '0 0 14px' }}>
              If you, too, have lost a campaign to a notebook, this is for you.<br />
              If you are running one now, this will outlive it.
            </p>
            <div className="sig">Ardenna, of the keep.</div>
            <div className="sig-meta">Founder &amp; first scribe · Anno MMXXVI</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Last CTA ──────────────────────────────────────────────────────────
function LastCTA() {
  return (
    <section className="last-cta">
      <div style={{ marginBottom: 22 }}>
        <div className="candle-flame"></div>
      </div>
      <h2>Open the war room.<br /><em>The realm is waiting.</em></h2>
      <p>One DM. One window. One realm that keeps its own counsel.</p>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
        <a href="demo.html" className="r-btn gold">Begin a campaign <span className="arrow">→</span></a>
        <a href="#pillars" className="r-btn ghost">Walk the rooms again</a>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────
function SiteFoot() {
  return (
    <footer className="site-foot">
      <div className="foot-grid">
        <div>
          <div className="brand-mark" style={{ marginBottom: 12 }}>
            <div className="sigil-shield"><HeraldicMark size={28} /></div>
            <div className="word">
              <b>WAR ROOM</b>
              <small>For the DM, &amp; no other</small>
            </div>
          </div>
          <p style={{ color: 'var(--fg-3)', fontSize: 12.5, fontStyle: 'italic', maxWidth: 280, lineHeight: 1.55 }}>
            A local-first command center for the dungeon master. Built in a candlelit room. Updated when there is news worth quilling.
          </p>
        </div>
        <div>
          <h5>The Tool</h5>
          <a href="#pillars">War Room</a>
          <a href="#codex">Codex</a>
          <a href="#vault">Vault</a>
          <a href="#map">Cartography</a>
          <a href="#decree">All features</a>
        </div>
        <div>
          <h5>The Realm</h5>
          <a href="#tiers">Tiers</a>
          <a href="#attest">Letters</a>
          <a href="#faq">FAQ</a>
          <a href="demo.html">Live demo</a>
        </div>
        <div>
          <h5>The Keep</h5>
          <a href="#">Changelog</a>
          <a href="#">Roadmap</a>
          <a href="#">Press kit</a>
          <a href="#">Contact</a>
        </div>
      </div>
      <div className="foot-bottom">
        <span className="seal">Hollow Sovereign Press · MMXXVI</span>
        <span>Local-first · Open in beta · No tracking, no telemetry, no surveillance</span>
      </div>
    </footer>
  );
}

// ── App root ──────────────────────────────────────────────────────────
function SiteApp() {
  return (
    <div className="site">
      <SiteNav />
      <main>
        <Hero />
        <Manifesto />
        <Pillars />
        <LivingWorld />
        <CodexFeature />
        <VaultFeature />
        <Cartography />
        <ByRoyalDecree />
        <Attest />
        <Tiers />
        <FAQ />
        <FounderNote />
        <LastCTA />
      </main>
      <SiteFoot />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SiteApp />);
