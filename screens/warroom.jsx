// War Room dashboard.
// The screen should summarize the user's actual campaign state, never demo copy.

function WarRoom({ state, onNav, onOpenNPC, onOpenFaction, onOpenSecret }) {
  const c = state.campaign || {};
  const campaignLocation = c.location || {};
  const factions = state.factions || [];
  const npcsAll = state.npcs || [];
  const likelyNpcs = npcsAll.filter(n => n.likely);
  const secrets = state.secrets || [];
  const openSecrets = secrets.filter(s => s.status !== 'revealed');
  const quests = state.quests || [];
  const activeQuests = quests.filter(q => q.state === 'active');
  const rumors = (state.rumors || []).filter(r => !r.delivered);
  const prep = state.prep || [];
  const openPrep = prep.filter(p => !p.done);
  const party = state.party || [];
  const locations = state.locations || [];
  const sessions = state.sessions || [];
  const sessionNumber = Math.max(1, Number(c.session) || 1);
  const sessionLabel = toRoman(sessionNumber);
  const sessionTotal = c.sessionsTotal || '?';
  const nextSession = cleanText(c.nextSession) || 'No next session scheduled';
  const partyLocation = locations.find(l => l.party);
  const partyPlace = cleanText(partyLocation?.label || partyLocation?.name || campaignLocation.name) || 'Unknown';
  const partyRegion = cleanText(partyLocation?.region || campaignLocation.region) || 'No region set';
  const lastSession = pickLastSession(sessions, sessionNumber);
  const leadPrep = openPrep[0] || prep[0] || null;
  const beats = openPrep.slice(0, 4);
  const factionClocks = factions
    .filter(f => f.clock)
    .sort((a, b) => clockProgress(b) - clockProgress(a));
  const pulseFactions = factionClocks.slice(0, 3);
  const tableFactions = factionClocks.slice(0, 3);
  const npcPreview = (likelyNpcs.length ? likelyNpcs : npcsAll).slice(0, 3);
  const topFaction = factionClocks[0];
  const visibleSecrets = openSecrets.slice(0, 3);
  const visibleQuests = activeQuests.slice(0, 4);
  const dmLines = buildDmLines({
    openSecrets: openSecrets.length,
    activeQuests: activeQuests.length,
    rumors: rumors.length,
    topFaction,
    partyPlace,
  });

  return (
    <div className="page fade-up">
      <div className="page-header">
        <div>
          <div className="smallcaps" style={{ marginBottom: 6 }}>
            <span className="ember-dot" style={{ marginRight: 8, verticalAlign: 'middle' }}></span>
            Session {sessionNumber} · {nextSession}
          </div>
          <h1 className="page-title herald">The War Room</h1>
          <div className="page-sub">
            {cleanText(c.name) || 'Unnamed campaign'}{c.subtitle ? ` - ${c.subtitle}` : ''}
          </div>
        </div>
        <div className="row" style={{ alignItems: 'center' }}>
          <button className="tbtn" onClick={() => onNav('prep')}>
            <Icon.Quill /> Prep notes
          </button>
          <button className="tbtn brass" onClick={() => onNav('sessions')}>
            <Icon.Play /> Begin session
          </button>
        </div>
      </div>

      <div className="pulse-strip" style={{ marginBottom: 14 }}>
        <div className="pulse-tick">
          <div className="pt-label">Campaign</div>
          <div className="pt-value">Session <span className="mono">{sessionLabel}</span> / {sessionTotal}</div>
          <div className="pt-delta calm">{openPrep.length} prep open</div>
        </div>

        {pulseFactions.map(f => (
          <div className="pulse-tick" key={f.id}>
            <div className="pt-label">{f.name || 'Unnamed faction'}</div>
            <div className="pt-value">
              <span className="mono">{safeClock(f).filled}/{safeClock(f).segments}</span>
              &nbsp;{safeClock(f).label || 'No clock label'}
            </div>
            <div className={clockProgress(f) >= 0.75 ? 'pt-delta danger' : 'pt-delta'}>
              {Math.round(clockProgress(f) * 100)}% advanced
            </div>
          </div>
        ))}

        <div className="pulse-tick">
          <div className="pt-label">Party at</div>
          <div className="pt-value">{partyPlace}</div>
          <div className="pt-delta calm">{partyRegion}</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div className="col">
          <div className="brief">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <WaxSeal size={42} broken={false} label={sessionLabel} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="brief-eyebrow">Session Brief · Live campaign data</div>
                <div className="brief-title">
                  Session {sessionLabel}{leadPrep ? ` - ${leadPrep.title}` : ' - Prep needed'}
                </div>
              </div>
              <span className="tag">{leadPrep ? 'draft' : 'empty'}</span>
            </div>
            <div className="brief-body">
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 320px' }}>
                  <div className="display" style={{ fontSize: 14, color: 'var(--ink)', marginTop: 4 }}>Opening pressure</div>
                  {leadPrep ? (
                    <>
                      <p style={{ margin: '6px 0 12px', fontSize: 13, lineHeight: 1.65 }}>
                        {leadPrep.note || 'This prep item has no note yet. Add the opening beat in Prep.'}
                      </p>
                      <div className="quote" style={{ color: 'var(--ink-dim)', borderLeftColor: 'oklch(0.45 0.08 60 / 0.5)', fontSize: 13.5 }}>
                        {topFaction
                          ? `${topFaction.name} is closest to a clock payoff: ${safeClock(topFaction).label || 'unnamed clock'}.`
                          : 'No faction clock is driving pressure yet.'}
                      </div>
                    </>
                  ) : (
                    <div className="empty" style={{ margin: '8px 0 0' }}>
                      <div className="display">No session prep yet.</div>
                      Add scenes, beats, clues, or complications and they will land here.
                    </div>
                  )}
                </div>
                <div style={{ flex: '0 1 240px', paddingLeft: 14, borderLeft: '1px dashed oklch(0.45 0.08 60 / 0.4)' }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'oklch(0.42 0.13 28)', fontWeight: 700, marginBottom: 8 }}>
                    Beats to land
                  </div>
                  {beats.length ? beats.map((p, i) => (
                    <div key={p.id || i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', borderBottom: i < beats.length - 1 ? '1px dotted oklch(0.45 0.08 60 / 0.35)' : 'none' }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: p.kind === 'scene' ? 'oklch(0.5 0.15 28)' : 'oklch(0.6 0.12 65)',
                        marginTop: 6, flexShrink: 0
                      }}></span>
                      <div style={{ fontSize: 11.5, lineHeight: 1.4, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--f-display)', fontSize: 13, lineHeight: 1.25, marginBottom: 3 }}>{p.title || 'Untitled prep'}</div>
                        <div style={{ color: 'var(--ink-dim)', fontStyle: 'italic', fontSize: 11, lineHeight: 1.4 }}>{p.note || 'No note yet.'}</div>
                      </div>
                    </div>
                  )) : (
                    <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>No open prep beats.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="brief-foot">
              <Icon.Quill />
              <span>{openPrep.length} open prep · {prep.filter(p => p.done).length} done</span>
              <div className="spacer" style={{ flex: 1 }}></div>
              <button className="tbtn brass" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => onNav('sessions')}>
                Open in session mode <Icon.Chevron />
              </button>
            </div>
          </div>

          <div className="card cornered">
            <div className="head">
              <Icon.Factions />
              <span className="title">The War Table</span>
              <div className="spacer"></div>
              <span className="smallcaps">{factionClocks.length} faction clocks</span>
            </div>
            <div className="body" style={{ padding: 14 }}>
              {tableFactions.length ? (
                <>
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                    {tableFactions.map(f => {
                      const clock = safeClock(f);
                      const bannerCls = factionBannerClass(f.color);
                      return (
                        <div key={f.id} className="clickable" onClick={() => onOpenFaction(f.id)}>
                          <div className={`banner ${bannerCls}`}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
                              <div className="banner-sigil">
                                <Sigil kind={f.sigil} size={20} color="oklch(0.95 0.03 80)" />
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div className="banner-name">{f.name || 'Unnamed faction'}</div>
                                <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.75, marginTop: 2 }}>
                                  {lastWord(f.leader) ? `${lastWord(f.leader)}'s standard` : 'Unclaimed standard'}
                                </div>
                              </div>
                            </div>
                            <div className="banner-ideology" style={{ position: 'relative', zIndex: 1 }}>
                              "{f.ideology || 'No doctrine recorded.'}"
                            </div>
                          </div>
                          <div style={{
                            marginTop: -2, padding: '10px 12px 12px',
                            background: 'linear-gradient(180deg, oklch(0.30 0.038 66), oklch(0.26 0.034 64))',
                            border: '1px solid var(--hairline-2)',
                            borderTop: 0,
                            borderRadius: '0 0 var(--r) var(--r)',
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}>
                            <FactionClock segments={clock.segments} filled={clock.filled} size={62} color={f.color}
                              onSegmentClick={(seg) => window.Store.dispatch({ type: 'FACTION_CLOCK_SET', id: f.id, filled: seg + 1 })} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div className="smallcaps" style={{ fontSize: 9.5, marginBottom: 2 }}>Clock</div>
                              <div style={{ fontFamily: 'var(--f-display)', fontSize: 13.5, lineHeight: 1.2 }}>{clock.label || 'No clock label'}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="hr brass" style={{ margin: '14px 0 10px' }}></div>
                  <div className="between">
                    <div className="muted" style={{ fontSize: 12 }}>
                      <span className="mono fg" style={{ marginRight: 6 }}>{factionClocks.filter(f => safeClock(f).filled > 0).length}</span>
                      clocks currently in motion
                    </div>
                    <button className="tbtn" onClick={() => onNav('factions')}>
                      All factions <Icon.Chevron />
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty">
                  <div className="display">No faction clocks yet.</div>
                  Add factions and clocks to see the war table move.
                </div>
              )}
            </div>
          </div>

          <div className="card cornered">
            <div className="head">
              <Icon.Characters />
              <span className="title herald">Likely to appear</span>
              <div className="spacer"></div>
              <span className="smallcaps">{likelyNpcs.length ? `${likelyNpcs.length} marked` : `${npcsAll.length} total`}</span>
            </div>
            <div className="body">
              {npcPreview.length ? (
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
                  {npcPreview.map(n => {
                    const fac = factions.find(f => f.id === n.faction);
                    return (
                      <div key={n.id} className="clickable"
                           onClick={() => onOpenNPC(n.id)}
                           style={{
                             padding: 12,
                             borderRadius: 'var(--r)',
                             border: '1px solid var(--hairline-2)',
                             background: 'linear-gradient(180deg, oklch(0.34 0.042 70), oklch(0.29 0.036 66))',
                           }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'linear-gradient(160deg, oklch(0.46 0.06 55), oklch(0.26 0.04 30))',
                            border: '1px solid var(--brass-dim)',
                            display: 'grid', placeItems: 'center',
                            fontFamily: 'var(--f-display)', fontSize: 17, color: 'var(--brass)',
                            flexShrink: 0,
                          }}>
                            {n.image
                              ? <img src={n.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '50%' }} />
                              : initials(n.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, lineHeight: 1.1 }}>{n.name || 'Unnamed NPC'}</div>
                            <div className="muted" style={{ fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>{n.title || 'No title'}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <DispPill d={n.disposition} />
                          {fac && <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>{fac.name}</span>}
                        </div>
                        <div className="quote" style={{ fontSize: 12.5, marginTop: 10, color: 'var(--fg-1)', borderLeftWidth: 1 }}>
                          "{n.quote || 'No quote recorded.'}"
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty">
                  <div className="display">No characters yet.</div>
                  Create NPCs, then mark likely faces for next session.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card cornered">
            <div className="head">
              <Icon.Eye />
              <span className="title herald">Rumors on the wind</span>
              <div className="spacer"></div>
              <span className="smallcaps">{rumors.length} undelivered</span>
            </div>
            <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 16px' }}>
              {rumors.length ? rumors.slice(0, 3).map((r, i) => (
                <div key={r.id} className="rumor" style={{ '--tilt': i % 2 === 0 ? '-0.8deg' : '0.6deg' }}>
                  <div className="rumor-eyebrow">{r.weight || 'common'}</div>
                  <div className="rumor-quote">"{r.text || 'No rumor text.'}"</div>
                  <div className="rumor-source">- {r.source || 'unknown source'}</div>
                </div>
              )) : (
                <div className="empty">
                  <div className="display">No rumors waiting.</div>
                  Add rumors to seed taverns, roads, courts, and player view.
                </div>
              )}
              <button className="tbtn" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={() => onNav('rumors')}>
                All rumors <Icon.Chevron />
              </button>
            </div>
          </div>

          <div className="card">
            <div className="head">
              <Icon.Sessions />
              <span className="title">Last Session</span>
              <div className="spacer"></div>
              <span className="smallcaps">{lastSession ? `Session ${lastSession.number || '?'}` : 'None'}</span>
            </div>
            <div className="body">
              {lastSession ? (
                <>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, marginBottom: 8, color: 'var(--amber)' }}>
                    {lastSession.title || 'Untitled session'}
                  </div>
                  {(lastSession.recap || lastSession.location || lastSession.date) && (
                    <div className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
                      {[lastSession.date, lastSession.location].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {(lastSession.bullets || []).slice(0, 5).map((b, i, arr) => (
                      <li key={i} style={{
                        fontSize: 12.5, lineHeight: 1.5,
                        padding: '6px 0 6px 16px',
                        borderBottom: i < arr.length - 1 ? '1px dashed var(--hairline-2)' : 'none',
                        position: 'relative',
                      }}>
                        <span style={{
                          position: 'absolute', left: 0, top: 11,
                          width: 6, height: 1, background: 'var(--brass-dim)',
                        }}></span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  {!(lastSession.bullets || []).length && (
                    <div className="muted" style={{ fontSize: 12 }}>No key events recorded for this session.</div>
                  )}
                </>
              ) : (
                <div className="empty">
                  <div className="display">No sessions yet.</div>
                  Start a session ledger and the recap will live here.
                </div>
              )}
            </div>
          </div>

          <div className="card cornered">
            <div className="head">
              <Icon.Secrets />
              <span className="title herald">Sealed Secrets</span>
              <div className="spacer"></div>
              <span className="smallcaps">{openSecrets.length} unrevealed</span>
            </div>
            <div className="body">
              {visibleSecrets.length ? (
                <div className="col" style={{ gap: 8 }}>
                  {visibleSecrets.map(s => (
                    <div key={s.id} className={`seal-card ${s.status} clickable`}
                         onClick={() => onOpenSecret(s.id)}
                         style={{ padding: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <WaxSeal size={42} broken={s.status === 'cracked'} label={(s.weight || 'S')[0]} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="smallcaps" style={{ color: s.status === 'cracked' ? 'var(--amber)' : 'var(--brass-dim)', marginBottom: 2 }}>
                          {s.weight || 'Secret'} · {s.status || 'sealed'}
                        </div>
                        <div style={{ fontFamily: 'var(--f-display)', fontSize: 14, lineHeight: 1.2,
                          color: s.status === 'sealed' ? 'var(--fg-3)' : 'var(--fg-1)',
                          filter: s.status === 'sealed' ? 'blur(3.5px)' : 'none',
                        }}>
                          {s.title || 'Untitled secret'}
                        </div>
                        <div className="muted" style={{ fontSize: 11.5, fontStyle: 'italic', marginTop: 2 }}>
                          {s.status === 'sealed' ? 'Sealed - click to view conditions' : (s.revealsTo || 'No reveal condition')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <div className="display">No sealed secrets.</div>
                  Add secrets and cracked reveals to make the vault useful.
                </div>
              )}
              <div className="hr"></div>
              <button className="tbtn" style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => onNav('secrets')}>
                Open the Vault <Icon.Chevron />
              </button>
            </div>
          </div>

          <div className="card">
            <div className="head">
              <Icon.Quests />
              <span className="title">Active Arcs</span>
              <div className="spacer"></div>
              <span className="smallcaps">{activeQuests.length} active</span>
            </div>
            <div className="body">
              {visibleQuests.length ? visibleQuests.map((q, i) => (
                <div key={q.id} style={{
                  padding: '10px 0',
                  borderBottom: i < visibleQuests.length - 1 ? '1px dashed var(--hairline-2)' : 'none',
                }}>
                  <div className="between">
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 14.5 }}>
                      {q.title || 'Untitled arc'}
                    </div>
                    <span className="pill brass" style={{ padding: '1px 7px', fontSize: 10 }}>
                      {q.arc || 'Main'}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 3, fontStyle: 'italic' }}>
                    {q.next || q.note || 'No next step recorded.'}
                  </div>
                  {Number(q.total) > 0 && (
                    <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                      {Array.from({ length: Number(q.total) }).map((_, j) => (
                        <div key={j} style={{
                          flex: 1, height: 5, borderRadius: 2,
                          background: j < Number(q.step || 0)
                            ? 'linear-gradient(180deg, oklch(0.7 0.12 80), oklch(0.48 0.10 80))'
                            : 'oklch(0.18 0.025 60 / 0.55)',
                          border: '1px solid var(--hairline-2)',
                        }}></div>
                      ))}
                    </div>
                  )}
                </div>
              )) : (
                <div className="empty">
                  <div className="display">No active arcs.</div>
                  Active quests will appear here with their next step.
                </div>
              )}
            </div>
          </div>

          <div className="card cornered">
            <div className="head">
              <Icon.Plus />
              <span className="title">Quick Hand</span>
              <div className="spacer"></div>
              <span className="smallcaps">DM tools</span>
            </div>
            <div className="body">
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <QuickAction icon={Icon.Characters} label="New NPC"       shortcut="N" onClick={() => onNav('characters')} />
                <QuickAction icon={Icon.Locations}  label="New location"  shortcut="L" onClick={() => onNav('maps')} />
                <QuickAction icon={Icon.Secrets}    label="New secret"    shortcut="S" onClick={() => onNav('secrets')} />
                <QuickAction icon={Icon.Maps}       label="Open map"      shortcut="M" onClick={() => onNav('maps')} />
                <QuickAction icon={Icon.Codex}      label="World codex"   shortcut="W" onClick={() => onNav('codex')} />
                <QuickAction icon={Icon.Play}       label="Start session" shortcut="Enter" onClick={() => onNav('sessions')} primary />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 2.2fr', gap: 16, marginTop: 16 }}>
        <div className="dmnote">
          <div className="dmnote-eyebrow">DM annotation</div>
          {dmLines.map((line, i) => (
            <div key={i} style={{ marginTop: i ? 8 : 0 }}>{line}</div>
          ))}
        </div>

        <div className="card cornered">
          <div className="head">
            <Icon.Characters />
            <span className="title herald">The Party</span>
            <div className="spacer"></div>
            <span className="smallcaps">{party.length} {party.length === 1 ? 'member' : 'members'}</span>
          </div>
          <div className="body" style={{ padding: 0 }}>
            {party.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                {party.map((p, i) => (
                  <div key={p.name || i} style={{
                    padding: '14px 16px',
                    borderRight: i < party.length - 1 ? '1px dashed var(--hairline-2)' : 'none',
                    borderBottom: party.length > 2 ? '1px dashed var(--hairline-2)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'linear-gradient(160deg, oklch(0.42 0.05 55), oklch(0.24 0.04 30))',
                        border: '1px solid var(--brass-dim)',
                        display: 'grid', placeItems: 'center',
                        fontFamily: 'var(--f-display)', fontSize: 15, color: 'var(--brass)',
                        flexShrink: 0,
                      }}>{initials(p.name)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, lineHeight: 1.05 }}>{p.name || 'Unnamed hero'}</div>
                        <div className="muted" style={{ fontSize: 11, fontStyle: 'italic' }}>{p.role || 'No role'}</div>
                      </div>
                    </div>
                    <div className="row between" style={{ marginTop: 10, fontSize: 11.5 }}>
                      <span className="mono fg">{p.hp || '--'} HP</span>
                      <span className="muted" style={{ textAlign: 'right', fontStyle: 'italic' }}>{p.note || ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty" style={{ margin: 14 }}>
                <div className="display">No party members.</div>
                Add the party roster so the dashboard can track who is at the table.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Ic, label, shortcut, primary, onClick }) {
  return (
    <button className={primary ? 'tbtn brass' : 'tbtn'}
            style={{ justifyContent: 'flex-start', padding: '9px 11px', height: 'auto' }}
            onClick={onClick}>
      <Ic /> <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      <span className="kbd">{shortcut}</span>
    </button>
  );
}

function cleanText(value) {
  return String(value || '').trim();
}

function safeClock(faction) {
  const clock = faction?.clock || {};
  const segments = Math.max(1, Number(clock.segments) || 1);
  const filled = Math.max(0, Math.min(segments, Number(clock.filled) || 0));
  return { segments, filled, label: cleanText(clock.label) };
}

function clockProgress(faction) {
  const clock = safeClock(faction);
  return clock.filled / clock.segments;
}

function factionBannerClass(color) {
  return color === 'oxblood' ? 'crimson'
    : color === 'iron' ? 'iron'
    : color === 'moon' ? 'moon'
    : color === 'ember' ? 'ember'
    : color === 'forest' ? 'forest'
    : 'brass';
}

function lastWord(value) {
  const words = cleanText(value).split(/\s+/).filter(Boolean);
  return words[words.length - 1] || '';
}

function initials(value) {
  const letters = cleanText(value).split(/\s+/).filter(Boolean).map(w => w[0]).join('');
  return (letters || '?').slice(0, 2).toUpperCase();
}

function toRoman(value) {
  const n = Math.max(1, Math.min(3999, Number(value) || 1));
  const table = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let rest = n;
  let out = '';
  table.forEach(([num, glyph]) => {
    while (rest >= num) {
      out += glyph;
      rest -= num;
    }
  });
  return out;
}

function pickLastSession(sessions, currentSessionNumber) {
  const ordered = [...(sessions || [])].sort((a, b) => {
    const byNumber = (Number(b.number) || 0) - (Number(a.number) || 0);
    if (byNumber) return byNumber;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
  return ordered.find(s => (Number(s.number) || 0) < currentSessionNumber) || ordered[0] || null;
}

function buildDmLines({ openSecrets, activeQuests, rumors, topFaction, partyPlace }) {
  const lines = [];
  lines.push(`${openSecrets} unrevealed secrets, ${activeQuests} active arcs, ${rumors} undelivered rumors.`);
  if (topFaction) {
    const clock = safeClock(topFaction);
    lines.push(`${topFaction.name || 'A faction'} is the hottest pressure: ${clock.filled}/${clock.segments} on ${clock.label || 'an unnamed clock'}.`);
  } else {
    lines.push('No faction clock is currently setting the tempo.');
  }
  lines.push(`Party position: ${partyPlace}.`);
  return lines;
}

Object.assign(window, { WarRoom });
