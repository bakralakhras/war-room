# Player View Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the player view from 4 thin tabs into a full 6-tab personal desk with character sheet, shared party chronicle, rich NPC dossiers, faction/quest intel, party roster, and a personal theme picker.

**Architecture:** All changes live in `player.jsx` (hooks + components) and `styles.css` (new blocks appended). No new HTML files. Party Chronicle uses Supabase broadcast on channel `chronicle:${campaignId}` — same pattern as the existing state channel — with localStorage caching. Theme picker persists locally. All character-sheet data extends the existing `player_desk` localStorage key via `migrateDesk`.

**Tech Stack:** React 18 (UMD/Babel standalone), Supabase Realtime JS v2, CSS custom properties (oklch), window.WARROOM_THEMES

---

## File Map

| File | Changes |
|---|---|
| `player.jsx` | Full extension: new hooks, 6 tabs, all new components |
| `styles.css` | Append ~400 lines of new CSS at end of file |

---

### Task 1: Extend desk state — HP, traits, inventory, abilities

**Files:**
- Modify: `player.jsx` — `defaultDesk`, `migrateDesk`, `usePlayerDesk`

- [ ] **Step 1: Update `defaultDesk` to include new fields**

In `player.jsx`, replace the `defaultDesk` function with:

```js
function defaultDesk(player) {
  return {
    instinct: player?.hook || '',
    journal: '',
    journalEntries: [
      { id: 'journal-1', title: 'Session 1 - First impressions', date: '27 Vael', body: '', createdAt: Date.now() },
    ],
    questions: '',
    mementos: '',
    goals: [
      { id: 'goal-1', text: player?.id === 'theo' ? 'Learn what the Hollow Sovereign truly wants.' : 'Find out why Halsane hid the signet.', done: false },
      { id: 'goal-2', text: 'Ask one dangerous question next session.', done: false },
    ],
    sparks: [
      { id: 'spark-1', title: 'Table mood', tag: 'vibe', note: 'Wet stone, old bells, candle smoke, a crown wrapped in funeral linen.' },
      { id: 'spark-2', title: player?.character || 'My character', tag: 'portrait', note: player?.role || 'What do they look like when no one is watching?' },
    ],
    // NEW
    hp: { current: null, max: null },
    traits: { personality: '', ideals: '', bonds: '', flaws: '' },
    inventory: [],
    abilities: [],
  };
}
```

- [ ] **Step 2: Update `migrateDesk` to carry new fields through migration**

Replace `migrateDesk`:

```js
function migrateDesk(saved, player) {
  const base = defaultDesk(player);
  const desk = { ...base, ...saved };
  if ((!desk.journalEntries || desk.journalEntries.length === 0) && desk.journal) {
    desk.journalEntries = [{ id: 'journal-migrated', title: 'Earlier character notes', date: '', body: desk.journal, createdAt: Date.now() }];
  }
  desk.journalEntries = (desk.journalEntries || base.journalEntries).map(entry => ({
    createdAt: Date.now(), date: '', body: '', ...entry,
  }));
  // migrate new fields with defaults if missing
  if (!desk.hp) desk.hp = base.hp;
  if (!desk.traits) desk.traits = base.traits;
  if (!desk.inventory) desk.inventory = base.inventory;
  if (!desk.abilities) desk.abilities = base.abilities;
  return desk;
}
```

- [ ] **Step 3: Add new desk handlers to `usePlayerDesk`**

Inside `usePlayerDesk`, after `removeSpark`, add:

```js
const patchHp = (field, value) => setDesk(d => ({ ...d, hp: { ...d.hp, [field]: value } }));
const patchTrait = (field, value) => setDesk(d => ({ ...d, traits: { ...d.traits, [field]: value } }));
const addInventory = (item) => {
  const name = item.trim();
  if (!name) return;
  setDesk(d => ({ ...d, inventory: [...(d.inventory || []), { id: 'inv-' + Date.now(), name, qty: 1, note: '' }] }));
};
const updateInventory = (id, patch) => setDesk(d => ({ ...d, inventory: (d.inventory || []).map(i => i.id === id ? { ...i, ...patch } : i) }));
const removeInventory = (id) => setDesk(d => ({ ...d, inventory: (d.inventory || []).filter(i => i.id !== id) }));
const addAbility = (name, desc) => {
  if (!name.trim()) return;
  setDesk(d => ({ ...d, abilities: [...(d.abilities || []), { id: 'ab-' + Date.now(), name: name.trim(), desc: desc.trim() }] }));
};
const removeAbility = (id) => setDesk(d => ({ ...d, abilities: (d.abilities || []).filter(a => a.id !== id) }));
```

Update the return of `usePlayerDesk` to include all new handlers:

```js
return { desk, patch, addGoal, toggleGoal, removeGoal, addJournalEntry, updateJournalEntry, removeJournalEntry, addSpark, removeSpark, patchHp, patchTrait, addInventory, updateInventory, removeInventory, addAbility, removeAbility };
```

- [ ] **Step 4: Commit**

```bash
git add player.jsx
git commit -m "feat(player): extend desk state — hp, traits, inventory, abilities"
```

---

### Task 2: usePartyChronicle hook (shared journal via Supabase broadcast)

**Files:**
- Modify: `player.jsx` — add new hook after `usePlayerDesk`

- [ ] **Step 1: Add the hook**

```js
function usePartyChronicle(campaignId, player) {
  const cacheKey = campaignId ? `party_chronicle_${campaignId}` : null;
  const [entries, setEntries] = React.useState(() => {
    if (!cacheKey) return [];
    try { const s = localStorage.getItem(cacheKey); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  React.useEffect(() => {
    if (!cacheKey || !window._sb?.channel) return;
    const ch = window._sb.channel('chronicle:' + campaignId);
    ch.on('broadcast', { event: 'entry' }, ({ payload }) => {
      setEntries(prev => {
        if (prev.some(e => e.id === payload.id)) return prev;
        const next = [payload, ...prev].slice(0, 200);
        try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
        return next;
      });
    }).subscribe();
    return () => ch.unsubscribe();
  }, [campaignId, cacheKey]);

  const postEntry = (body, characterName) => {
    if (!body.trim()) return;
    const entry = {
      id: 'chr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      author: characterName || player?.character || 'Unknown',
      body: body.trim(),
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      createdAt: Date.now(),
    };
    setEntries(prev => {
      const next = [entry, ...prev].slice(0, 200);
      try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
      return next;
    });
    if (window._sb?.channel) {
      try {
        const ch = window._sb.channel('chronicle:' + campaignId);
        ch.send({ type: 'broadcast', event: 'entry', payload: entry });
      } catch {}
    }
  };

  return { entries, postEntry };
}
```

- [ ] **Step 2: Commit**

```bash
git add player.jsx
git commit -m "feat(player): usePartyChronicle hook — broadcast shared journal"
```

---

### Task 3: useThemePicker hook + ThemePicker component

**Files:**
- Modify: `player.jsx` — add hook and component

- [ ] **Step 1: Add `useThemePicker` hook**

```js
function useThemePicker(campaignId, playerId, dmTheme) {
  const key = campaignId && playerId ? `player_theme_${campaignId}_${playerId}` : null;
  const [theme, setTheme] = React.useState(() => {
    if (!key) return dmTheme || 'ashen-table';
    try { return localStorage.getItem(key) || dmTheme || 'ashen-table'; } catch { return dmTheme || 'ashen-table'; }
  });

  React.useEffect(() => {
    if (window.applyWarroomTheme) window.applyWarroomTheme(theme);
  }, [theme]);

  // Keep in sync when DM changes theme and player hasn't set a personal override
  React.useEffect(() => {
    if (!key) return;
    const saved = (() => { try { return localStorage.getItem(key); } catch { return null; } })();
    if (!saved && dmTheme) { setTheme(dmTheme); }
  }, [dmTheme]);

  const pick = (id) => {
    setTheme(id);
    if (key) { try { localStorage.setItem(key, id); } catch {} }
  };
  const reset = () => {
    setTheme(dmTheme || 'ashen-table');
    if (key) { try { localStorage.removeItem(key); } catch {} }
  };
  return { theme, pick, reset };
}
```

- [ ] **Step 2: Add `ThemePicker` component**

```jsx
function ThemePicker({ currentTheme, dmTheme, onPick, onReset, onClose }) {
  const themes = window.WARROOM_THEMES || [];
  return (
    <div className="theme-picker-backdrop" onClick={onClose}>
      <div className="theme-picker-panel" onClick={e => e.stopPropagation()}>
        <div className="theme-picker-head">
          <span>Table Mood</span>
          <button type="button" onClick={onClose}>✕</button>
        </div>
        <div className="theme-picker-grid">
          {themes.map(t => (
            <button
              key={t.id}
              type="button"
              className={`theme-swatch-btn ${currentTheme === t.id ? 'active' : ''}`}
              onClick={() => { onPick(t.id); onClose(); }}
              title={t.name}
            >
              <div className="theme-swatch-colors">
                {(t.swatches || []).slice(0, 4).map((s, i) => (
                  <span key={i} style={{ background: s }} />
                ))}
              </div>
              <span className="theme-swatch-name">{t.name}</span>
              {t.id === dmTheme && <span className="theme-swatch-dm">DM</span>}
            </button>
          ))}
        </div>
        {currentTheme !== dmTheme && (
          <button type="button" className="theme-picker-reset" onClick={() => { onReset(); onClose(); }}>
            Reset to DM's theme
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add player.jsx
git commit -m "feat(player): useThemePicker hook + ThemePicker swatch panel"
```

---

### Task 4: Updated PlayerApp + PlayerTopbar + 6-tab PlayerTabs

**Files:**
- Modify: `player.jsx` — `PlayerApp`, add `PlayerTopbar`, update `PlayerTabs`

- [ ] **Step 1: Replace `PlayerApp`**

```jsx
function PlayerApp() {
  const { state, status, campaignId, playerId } = usePlayerSync();
  const campaign = state?.campaign || {};
  const player = (campaign.playerRoster || []).find(p => p.id === playerId);
  const { desk, patch, addGoal, toggleGoal, removeGoal, addJournalEntry, updateJournalEntry, removeJournalEntry, addSpark, removeSpark, patchHp, patchTrait, addInventory, updateInventory, removeInventory, addAbility, removeAbility } = usePlayerDesk(campaignId, player);
  const { entries: chronicle, postEntry } = usePartyChronicle(campaignId, player);
  const { theme, pick: pickTheme, reset: resetTheme } = useThemePicker(campaignId, playerId, campaign.theme);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [themeOpen, setThemeOpen] = React.useState(false);
  const [activeNpc, setActiveNpc] = React.useState(null);

  if (!campaignId) return <EmptyPlayerState title="No campaign linked" text="Ask your DM for the player link." />;

  const publicSecrets = (state?.secrets || []).filter(s => s.status === 'revealed');
  const publicQuests = (state?.quests || []).filter(q => q.public && q.state === 'active');
  const publicNpcs = (state?.npcs || []).filter(n => n.public);
  const publicLocations = (state?.locations || []).filter(l => l.public || l.party);
  const safeHandouts = (state?.handouts || []).filter(h => h.public);
  const character = (state?.party || []).find(p => p.name === player?.character);
  const currentPlace = publicLocations.find(l => l.party) || campaign.location;

  return (
    <div className="app player-app" style={{ gridTemplateColumns: '1fr' }}>
      <main className="main">
        <PlayerTopbar
          campaign={campaign}
          status={status}
          onThemeOpen={() => setThemeOpen(true)}
        />

        {!state ? (
          <EmptyPlayerState title="Waiting for the DM..." text="The DM must have the War Room open to push data." />
        ) : (
          <div className="page fade-up player-page">
            <PlayerHero campaign={campaign} player={player} character={character} currentPlace={currentPlace} desk={desk} patch={patch} />

            <PlayerTabs active={activeTab} onChange={setActiveTab} counts={{
              journal: desk.journalEntries?.length || 0,
              chronicle: chronicle.length,
              intel: publicQuests.length + publicNpcs.length + publicLocations.length + publicSecrets.length + safeHandouts.length,
              sparks: desk.sparks?.length || 0,
              party: (state?.party || []).length,
            }} />

            {activeTab === 'overview' && (
              <PlayerOverview state={state} player={player} currentPlace={currentPlace} publicQuests={publicQuests} publicSecrets={publicSecrets} desk={desk} patch={patch} addGoal={addGoal} toggleGoal={toggleGoal} removeGoal={removeGoal} onOpenJournal={() => setActiveTab('journal')} />
            )}
            {activeTab === 'character' && (
              <PlayerCharacter state={state} player={player} character={character} desk={desk} patchHp={patchHp} patchTrait={patchTrait} addInventory={addInventory} updateInventory={updateInventory} removeInventory={removeInventory} addAbility={addAbility} removeAbility={removeAbility} />
            )}
            {activeTab === 'journal' && (
              <PlayerJournal entries={desk.journalEntries || []} chronicle={chronicle} player={player} onAdd={addJournalEntry} onUpdate={updateJournalEntry, updateJournalEntry} onUpdate={updateJournalEntry} onRemove={removeJournalEntry} onPost={postEntry} />
            )}
            {activeTab === 'intel' && (
              <PlayerIntel state={state} player={player} publicQuests={publicQuests} publicNpcs={publicNpcs} publicLocations={publicLocations} publicSecrets={publicSecrets} safeHandouts={safeHandouts} onNpcClick={setActiveNpc} />
            )}
            {activeTab === 'party' && (
              <PlayerParty state={state} player={player} />
            )}
            {activeTab === 'inspiration' && (
              <PlayerInspirationPage desk={desk} patch={patch} addSpark={addSpark} removeSpark={removeSpark} />
            )}
          </div>
        )}
      </main>

      {themeOpen && (
        <ThemePicker currentTheme={theme} dmTheme={campaign.theme} onPick={pickTheme} onReset={resetTheme} onClose={() => setThemeOpen(false)} />
      )}
      {activeNpc && (
        <NpcModal npc={activeNpc} onClose={() => setActiveNpc(null)} />
      )}

      <div className="candle-vignette" data-noncommentable=""></div>
    </div>
  );
}
```

- [ ] **Step 2: Add `PlayerTopbar` component**

```jsx
function PlayerTopbar({ campaign, status, onThemeOpen }) {
  const statusPill = status === 'live'
    ? <span className="pill brass">live</span>
    : status === 'cached'
    ? <span className="pill iron">cached</span>
    : status === 'error'
    ? <span className="pill iron">offline</span>
    : <span className="pill iron">connecting…</span>;

  return (
    <div className="topbar grain">
      <div className="crumb">
        <Icon.PlayerView />
        <span>{campaign.name || 'War Room'}</span>
        <span className="sep">/</span>
        <span style={{ color: 'var(--fg)', fontWeight: 600 }}>Player Desk</span>
      </div>
      <div className="top-spacer" />
      {statusPill}
      <button type="button" className="tbtn" onClick={onThemeOpen} title="Change table mood">
        ◐ Mood
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Replace `PlayerTabs` with 6-tab version**

```jsx
function PlayerTabs({ active, onChange, counts }) {
  const tabs = [
    { id: 'overview',    label: 'Overview',    note: 'at table' },
    { id: 'character',   label: 'Character',   note: 'your sheet' },
    { id: 'journal',     label: 'Journal',     note: `${counts.journal} entries` },
    { id: 'intel',       label: 'Intel',       note: `${counts.intel} records` },
    { id: 'party',       label: 'Party',       note: `${counts.party} members` },
    { id: 'inspiration', label: 'Inspiration', note: `${counts.sparks} pins` },
  ];
  return (
    <div className="player-tabs" role="tablist" aria-label="Player pages">
      {tabs.map(tab => (
        <button key={tab.id} type="button" className={active === tab.id ? 'active' : ''} onClick={() => onChange(tab.id)}>
          <span>{tab.label}</span>
          <small>{tab.note}</small>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add player.jsx
git commit -m "feat(player): 6-tab nav, PlayerTopbar with mood button, useThemePicker wired"
```

---

### Task 5: PlayerCharacter page

**Files:**
- Modify: `player.jsx` — add `PlayerCharacter`, `HpTracker`, `TraitFields`, `InventoryList`, `AbilityList`

- [ ] **Step 1: Add `HpTracker`**

```jsx
function HpTracker({ hp, onPatch }) {
  const cur = hp.current ?? '';
  const max = hp.max ?? '';
  const pct = (hp.current != null && hp.max != null && hp.max > 0)
    ? Math.min(100, Math.round((hp.current / hp.max) * 100)) : null;
  const barColor = pct == null ? 'var(--brass)' : pct > 60 ? 'var(--forest)' : pct > 25 ? 'var(--amber)' : 'var(--crimson)';
  return (
    <div className="pc-hp-tracker">
      <div className="pc-hp-bar-wrap">
        {pct != null && <div className="pc-hp-bar" style={{ width: pct + '%', background: barColor }} />}
      </div>
      <div className="pc-hp-controls">
        <button type="button" onClick={() => onPatch('current', Math.max(0, (hp.current || 0) - 1))}>−</button>
        <input
          type="number" className="pc-hp-input" value={cur}
          onChange={e => onPatch('current', e.target.value === '' ? null : Number(e.target.value))}
          placeholder="HP"
        />
        <span className="pc-hp-sep">/</span>
        <input
          type="number" className="pc-hp-input" value={max}
          onChange={e => onPatch('max', e.target.value === '' ? null : Number(e.target.value))}
          placeholder="Max"
        />
        <button type="button" onClick={() => onPatch('current', Math.min(hp.max || 0, (hp.current || 0) + 1))}>+</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `TraitFields`**

```jsx
function TraitFields({ traits, onPatch }) {
  const fields = [
    { key: 'personality', label: 'Personality', placeholder: 'How your character presents themselves…' },
    { key: 'ideals', label: 'Ideals', placeholder: 'What does your character believe in?' },
    { key: 'bonds', label: 'Bonds', placeholder: 'Who or what do they hold dear?' },
    { key: 'flaws', label: 'Flaws', placeholder: 'What holds them back, haunts them?' },
  ];
  return (
    <div className="pc-traits-grid">
      {fields.map(f => (
        <div key={f.key} className="pc-trait-field">
          <label className="player-label">{f.label}</label>
          <textarea
            className="player-textarea compact"
            value={traits[f.key] || ''}
            onChange={e => onPatch(f.key, e.target.value)}
            placeholder={f.placeholder}
          />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Add `InventoryList`**

```jsx
function InventoryList({ inventory, onAdd, onUpdate, onRemove }) {
  const [draft, setDraft] = React.useState('');
  const submit = e => { e.preventDefault(); onAdd(draft); setDraft(''); };
  return (
    <div className="pc-inventory">
      {(inventory || []).map(item => (
        <div key={item.id} className="pc-inv-row">
          <input
            className="pc-inv-name"
            value={item.name}
            onChange={e => onUpdate(item.id, { name: e.target.value })}
          />
          <input
            type="number"
            className="pc-inv-qty"
            value={item.qty}
            min={0}
            onChange={e => onUpdate(item.id, { qty: Number(e.target.value) })}
          />
          <input
            className="pc-inv-note"
            value={item.note}
            onChange={e => onUpdate(item.id, { note: e.target.value })}
            placeholder="note"
          />
          <button type="button" className="pc-inv-del" onClick={() => onRemove(item.id)}>×</button>
        </div>
      ))}
      <form className="player-addline" onSubmit={submit}>
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add item…" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Add `AbilityList`**

```jsx
function AbilityList({ abilities, onAdd, onRemove }) {
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const submit = e => {
    e.preventDefault();
    onAdd(name, desc);
    setName(''); setDesc('');
  };
  return (
    <div className="pc-abilities">
      {(abilities || []).map(a => (
        <div key={a.id} className="pc-ability-row">
          <strong>{a.name}</strong>
          {a.desc && <p>{a.desc}</p>}
          <button type="button" onClick={() => onRemove(a.id)}>×</button>
        </div>
      ))}
      <form className="pc-ability-form" onSubmit={submit}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Feature or ability name…" />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Short description (optional)" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Add `PlayerCharacter` page**

```jsx
function PlayerCharacter({ state, player, character, desk, patchHp, patchTrait, addInventory, updateInventory, removeInventory, addAbility, removeAbility }) {
  const charData = character || {};
  const dmHp = charData.hp || null;

  return (
    <div className="player-tab-page pc-page">
      <div className="pc-grid">

        <PlayerPanel title="Vitals" kicker="hit points">
          <div className="pc-vitals">
            <div className="pc-vitals-name">
              <div className="smallcaps">Character</div>
              <h2>{player?.character || 'Unnamed character'}</h2>
              <div className="muted">{player?.role || charData.role || '—'}</div>
              {charData.patron && <div className="muted" style={{ marginTop: 4 }}>{charData.patron}</div>}
            </div>
            <div>
              <div className="smallcaps" style={{ marginBottom: 6 }}>Hit Points</div>
              {dmHp && <div className="pc-dm-hp muted" style={{ marginBottom: 6 }}>DM reports: {dmHp}</div>}
              <HpTracker hp={desk.hp} onPatch={patchHp} />
            </div>
          </div>
        </PlayerPanel>

        <PlayerPanel title="Character Traits" kicker="personality & beliefs">
          <TraitFields traits={desk.traits} onPatch={patchTrait} />
        </PlayerPanel>

        <PlayerPanel title="Character Hook" kicker="your instinct">
          <label className="player-label">What does your character want right now?</label>
          <textarea
            className="player-textarea compact"
            value={desk.instinct}
            onChange={e => { /* patch handled in PlayerHero but also available here */ }}
            placeholder="What is your character afraid to say out loud?"
            readOnly
          />
          <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>Edit this in the Overview hero card.</div>
          {player?.hook && (
            <div className="pc-hook-dm">
              <span className="smallcaps">DM hook</span>
              <p>{player.hook}</p>
            </div>
          )}
        </PlayerPanel>

        <PlayerPanel title="Inventory & Equipment" kicker="carried items">
          <InventoryList
            inventory={desk.inventory}
            onAdd={addInventory}
            onUpdate={updateInventory}
            onRemove={removeInventory}
          />
        </PlayerPanel>

        <PlayerPanel title="Features & Abilities" kicker="class features, spells, traits">
          <AbilityList
            abilities={desk.abilities}
            onAdd={addAbility}
            onRemove={removeAbility}
          />
        </PlayerPanel>

        <PlayerPanel title="Private Notes" kicker="questions & mementos">
          <label className="player-label">Questions for the DM</label>
          <textarea className="player-textarea compact" value={desk.questions} onChange={e => { /* patch */ }} placeholder="What do you want to ask?" readOnly />
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Edit in the Inspiration tab.</div>
          <label className="player-label">Mementos</label>
          <textarea className="player-textarea compact" value={desk.mementos} onChange={e => { /* patch */ }} placeholder="Keepsakes, promises, injuries…" readOnly />
        </PlayerPanel>

      </div>
    </div>
  );
}
```

Note: The "instinct" and private notes are read-only pointers here — the edit lives in the canonical location (hero card / inspiration). This avoids dual-edit confusion.

- [ ] **Step 6: Commit**

```bash
git add player.jsx
git commit -m "feat(player): character sheet page — HP tracker, traits, inventory, abilities"
```

---

### Task 6: Updated PlayerJournal with sub-tabs + ChronicleEntry/Composer

**Files:**
- Modify: `player.jsx` — `PlayerJournal`, add `ChronicleEntry`, `ChronicleComposer`

- [ ] **Step 1: Add `ChronicleEntry`**

```jsx
function ChronicleEntry({ entry }) {
  return (
    <article className="chronicle-entry">
      <div className="chronicle-entry-head">
        <strong>{entry.author}</strong>
        <span>{entry.date}</span>
      </div>
      <p>{entry.body}</p>
    </article>
  );
}
```

- [ ] **Step 2: Add `ChronicleComposer`**

```jsx
function ChronicleComposer({ player, onPost }) {
  const [body, setBody] = React.useState('');
  const submit = e => {
    e.preventDefault();
    if (!body.trim()) return;
    onPost(body, player?.character);
    setBody('');
  };
  return (
    <form className="chronicle-composer" onSubmit={submit}>
      <div className="chronicle-composer-head">
        <span className="smallcaps">Post to party chronicle</span>
        <span className="muted" style={{ fontSize: 12 }}>as {player?.character || 'your character'}</span>
      </div>
      <textarea
        className="player-textarea compact"
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={"Write a session note the whole party will see…\n\nWhat happened? What did it cost? Who do you trust less now?"}
      />
      <button type="submit" disabled={!body.trim()}>Post to chronicle</button>
    </form>
  );
}
```

- [ ] **Step 3: Replace `PlayerJournal` with sub-tabbed version**

```jsx
function PlayerJournal({ entries, chronicle, player, onAdd, onUpdate, onRemove, onPost }) {
  const [sub, setSub] = React.useState('private');
  const [selectedId, setSelectedId] = React.useState(entries[0]?.id || null);
  const selected = entries.find(e => e.id === selectedId) || entries[0];

  React.useEffect(() => {
    if (!entries.some(e => e.id === selectedId)) setSelectedId(entries[0]?.id || null);
  }, [entries.length, selectedId]);

  const add = () => { const id = onAdd(); setSelectedId(id); };

  return (
    <div className="player-tab-page journal-page">
      <div className="journal-subtabs">
        <button type="button" className={sub === 'private' ? 'active' : ''} onClick={() => setSub('private')}>
          Private Journal <small>{entries.length} entries</small>
        </button>
        <button type="button" className={sub === 'chronicle' ? 'active' : ''} onClick={() => setSub('chronicle')}>
          Party Chronicle <small>{chronicle.length} posts</small>
        </button>
      </div>

      {sub === 'private' && (
        <div className="player-journal-shell">
          <aside className="player-journal-list">
            <div className="player-journal-actions">
              <div>
                <div className="smallcaps">Private journal</div>
                <strong>{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</strong>
              </div>
              <button type="button" onClick={add}>New day</button>
            </div>
            {entries.map(entry => (
              <button key={entry.id} type="button" className={selected?.id === entry.id ? 'active' : ''} onClick={() => setSelectedId(entry.id)}>
                <span>{entry.date || 'Undated'}</span>
                <strong>{entry.title || 'Untitled entry'}</strong>
                <small>{entry.body ? entry.body.slice(0, 86) : 'No thoughts written yet.'}</small>
              </button>
            ))}
          </aside>
          <section className="player-journal-editor">
            {selected ? (
              <>
                <div className="player-journal-head">
                  <input value={selected.title} onChange={e => onUpdate(selected.id, { title: e.target.value })} placeholder="Entry title" />
                  <input value={selected.date} onChange={e => onUpdate(selected.id, { date: e.target.value })} placeholder="Date or session" />
                  <button type="button" onClick={() => onRemove(selected.id)}>Delete</button>
                </div>
                <textarea className="player-textarea journal" value={selected.body} onChange={e => onUpdate(selected.id, { body: e.target.value })} placeholder={"Write this as your character, or as the player behind them.\n\nWhat happened today? What did it cost? Who do you trust less now?"} />
              </>
            ) : (
              <div className="empty">Create a journal entry to begin.</div>
            )}
          </section>
        </div>
      )}

      {sub === 'chronicle' && (
        <div className="chronicle-page">
          <ChronicleComposer player={player} onPost={onPost} />
          <div className="chronicle-feed">
            {chronicle.length === 0
              ? <div className="empty">No entries yet. Be the first to post to the party chronicle.</div>
              : chronicle.map(e => <ChronicleEntry key={e.id} entry={e} />)
            }
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add player.jsx
git commit -m "feat(player): journal with private/chronicle sub-tabs, party chronicle composer"
```

---

### Task 7: NpcModal + enhanced FaceRow

**Files:**
- Modify: `player.jsx` — `FaceRow`, add `NpcModal`

- [ ] **Step 1: Add `NpcModal`**

```jsx
function NpcModal({ npc, onClose }) {
  React.useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const initial = (npc.name || '?')[0].toUpperCase();
  const dispositionColor = { ally: 'var(--forest)', hostile: 'var(--crimson)', ambiguous: 'var(--amber)', neutral: 'var(--fg-3)' };

  return (
    <div className="npc-modal-backdrop" onClick={onClose}>
      <div className="npc-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="npc-modal-close" onClick={onClose}>✕</button>

        <div className="npc-modal-head">
          <div className="npc-modal-avatar">{npc.image ? <img src={npc.image} alt="" /> : initial}</div>
          <div>
            <h2>{npc.name}</h2>
            <div className="muted">{npc.title || npc.location || 'Known contact'}</div>
            {npc.disposition && (
              <span className="npc-modal-disp" style={{ color: dispositionColor[npc.disposition] || 'var(--fg-2)' }}>
                {npc.disposition}
              </span>
            )}
          </div>
        </div>

        <div className="npc-modal-body">
          {npc.summary && (
            <div className="npc-modal-section">
              <div className="smallcaps">About</div>
              <p>{npc.summary}</p>
            </div>
          )}
          {npc.ideology && (
            <div className="npc-modal-section">
              <div className="smallcaps">Ideology</div>
              <p>{npc.ideology}</p>
            </div>
          )}
          {npc.location && (
            <div className="npc-modal-section">
              <div className="smallcaps">Known Location</div>
              <p>{npc.location}</p>
            </div>
          )}
          {npc.note && (
            <div className="npc-modal-section">
              <div className="smallcaps">Party Note</div>
              <p>{npc.note}</p>
            </div>
          )}
          {npc.leader && (
            <div className="npc-modal-section">
              <div className="smallcaps">Leads</div>
              <p>{npc.leader}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `FaceRow` to accept `onClick`**

```jsx
function FaceRow({ npc, onClick }) {
  return (
    <div className={`player-face ${onClick ? 'clickable' : ''}`} onClick={onClick ? () => onClick(npc) : undefined} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={onClick ? e => e.key === 'Enter' && onClick(npc) : undefined}>
      <div className="player-avatar">
        {npc.image ? <img src={npc.image} alt="" /> : (npc.name || '?')[0]}
      </div>
      <div>
        <strong>{npc.name}</strong>
        <p>{npc.title || npc.location || 'Known contact'}</p>
        {npc.disposition && <span className={`disp-badge disp-${npc.disposition}`}>{npc.disposition}</span>}
      </div>
      {onClick && <span className="face-expand">›</span>}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add player.jsx
git commit -m "feat(player): NPC detail modal, FaceRow with expand affordance"
```

---

### Task 8: Enhanced PlayerIntel — factions with clocks, richer quests, timeline

**Files:**
- Modify: `player.jsx` — `PlayerIntel`, add `FactionIntelRow`, `QuestIntelRow`

- [ ] **Step 1: Add `FactionIntelRow`**

```jsx
function FactionIntelRow({ faction }) {
  const dispColor = { ally: 'var(--forest)', hostile: 'var(--crimson)', ambiguous: 'var(--amber)', neutral: 'var(--fg-3)' };
  const clock = faction.clock;
  const pct = clock && clock.segments ? Math.round((clock.filled / clock.segments) * 100) : null;
  return (
    <div className="intel-faction-row">
      <div className="intel-faction-main">
        <strong>{faction.name}</strong>
        <span className="intel-faction-disp" style={{ color: dispColor[faction.disposition] || 'var(--fg-3)' }}>
          {faction.disposition || 'unknown'}
        </span>
      </div>
      {faction.ideology && <p className="intel-faction-ideology">{faction.ideology}</p>}
      {clock && (
        <div className="intel-faction-clock">
          <div className="intel-clock-bar-wrap">
            <div className="intel-clock-bar" style={{ width: (pct || 0) + '%' }} />
          </div>
          <span>{clock.filled}/{clock.segments} — {clock.label}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add `QuestIntelRow`**

```jsx
function QuestIntelRow({ quest }) {
  return (
    <div className="intel-quest-row">
      <div className="intel-quest-head">
        <strong>{quest.title}</strong>
        {quest.arc && <span className="intel-quest-arc">{quest.arc}</span>}
      </div>
      {quest.note && <p>{quest.note}</p>}
      {quest.stakes && <p className="intel-quest-stakes"><em>Stakes:</em> {quest.stakes}</p>}
      {quest.next && <p className="intel-quest-next">↳ {quest.next}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Replace `PlayerIntel` with enhanced version**

```jsx
function PlayerIntel({ state, player, publicQuests, publicNpcs, publicLocations, publicSecrets, safeHandouts, onNpcClick }) {
  const factions = state?.factions || [];
  const sessions = (state?.sessions || []).slice(0, 3);

  return (
    <div className="player-tab-page intel-page">
      <div className="player-intel-grid">

        <PlayerPanel icon={Icon.Quests} title="Active Threads" empty="No quests published.">
          {publicQuests.map(q => <QuestIntelRow key={q.id} quest={q} />)}
        </PlayerPanel>

        <PlayerPanel icon={Icon.Characters} title="Known Faces" empty="No characters published.">
          {publicNpcs.map(n => <FaceRow key={n.id} npc={n} onClick={onNpcClick} />)}
        </PlayerPanel>

        <PlayerPanel icon={Icon.Locations} title="Known Places" empty="No locations published.">
          {publicLocations.map(l => <IntelRow key={l.id} title={l.label || l.name} meta={l.party ? 'party here' : (l.kind || '')} text={l.note || ''} />)}
        </PlayerPanel>

        <PlayerPanel icon={Icon.Secrets} title="Revealed Truths" empty="No secrets revealed yet.">
          {publicSecrets.map(s => <IntelRow key={s.id} title={s.title} meta="revealed" text={s.text || s.note || ''} />)}
        </PlayerPanel>

        {factions.length > 0 && (
          <PlayerPanel title="Factions" kicker="power & disposition" empty="No faction data published.">
            {factions.map(f => <FactionIntelRow key={f.id} faction={f} />)}
          </PlayerPanel>
        )}

        <PlayerPanel icon={Icon.Handouts} title="Handouts & Visions" empty="No handouts published.">
          <div className="player-handouts">
            {safeHandouts.map(h => <HandoutCard key={h.id} handout={h} />)}
          </div>
        </PlayerPanel>

        {sessions.length > 0 && (
          <PlayerPanel title="Session History" kicker="recent past" empty="No sessions logged.">
            {sessions.map((s, i) => (
              <div key={i} className="intel-session-row">
                <strong>{s.title || `Session ${i + 1}`}</strong>
                {(s.bullets || []).slice(0, 3).map((b, j) => <p key={j}>• {b}</p>)}
              </div>
            ))}
          </PlayerPanel>
        )}

        <PlayerPanel icon={Icon.Characters} title="The Party" empty="No party published.">
          {(state.party || []).map((p, i) => (
            <IntelRow key={i} title={p.name} meta={p.role} text={p.note || p.patron || ''} active={p.name === player?.character} />
          ))}
        </PlayerPanel>

      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add player.jsx
git commit -m "feat(player): enhanced intel — factions with clocks, quest details, session history"
```

---

### Task 9: PlayerParty tab

**Files:**
- Modify: `player.jsx` — add `PlayerParty`, `PartyMemberCard`

- [ ] **Step 1: Add `PartyMemberCard`**

```jsx
function PartyMemberCard({ member, isPlayer, isExpanded, onClick }) {
  const hp = member.hp ? member.hp.split('/').map(Number) : [null, null];
  const [cur, max] = hp;
  const pct = cur != null && max != null && max > 0 ? Math.round((cur / max) * 100) : null;
  const barColor = pct == null ? 'var(--brass)' : pct > 60 ? 'var(--forest)' : pct > 25 ? 'var(--amber)' : 'var(--crimson)';
  const initial = (member.name || '?').split(/\s+/).map(s => s[0]).join('').slice(0, 2);

  return (
    <div className={`party-member-card ${isPlayer ? 'is-player' : ''} ${isExpanded ? 'expanded' : ''}`} onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="party-member-head">
        <div className="party-member-avatar">{initial}</div>
        <div className="party-member-info">
          <strong>{member.name} {isPlayer && <span className="party-you-badge">you</span>}</strong>
          <span>{member.role}</span>
        </div>
        {member.hp && (
          <div className="party-member-hp">
            <div className="party-hp-bar-wrap">
              <div className="party-hp-bar" style={{ width: (pct || 0) + '%', background: barColor }} />
            </div>
            <span className="party-hp-label">{member.hp}</span>
          </div>
        )}
      </div>
      {isExpanded && (
        <div className="party-member-detail">
          {member.patron && <div className="party-member-row"><span className="smallcaps">Patron</span><span>{member.patron}</span></div>}
          {member.note && <div className="party-member-row"><span className="smallcaps">Note</span><span>{member.note}</span></div>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add `PlayerParty`**

```jsx
function PlayerParty({ state, player }) {
  const [expandedId, setExpandedId] = React.useState(null);
  const party = state?.party || [];

  return (
    <div className="player-tab-page party-page">
      <div className="party-grid">
        <PlayerPanel title="Party Roster" kicker={`${party.length} adventurers`} empty="No party data published by the DM.">
          <div className="party-roster">
            {party.map((m, i) => {
              const isMe = m.name === player?.character;
              const id = m.name + i;
              return (
                <PartyMemberCard
                  key={id}
                  member={m}
                  isPlayer={isMe}
                  isExpanded={expandedId === id}
                  onClick={() => setExpandedId(expandedId === id ? null : id)}
                />
              );
            })}
          </div>
        </PlayerPanel>

        <PlayerPanel title="Party Status" kicker="current situation">
          <IntelRow title={state?.campaign?.location?.name || 'Location unknown'} meta="current location" text={state?.campaign?.location?.note || ''} />
          {(state?.factions || []).filter(f => f.disposition === 'ally').map(f => (
            <IntelRow key={f.id} title={f.name} meta="ally faction" text={f.ideology || ''} />
          ))}
        </PlayerPanel>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add player.jsx
git commit -m "feat(player): party tab — roster with HP bars, expandable member cards"
```

---

### Task 10: CSS additions for all new components

**Files:**
- Modify: `styles.css` — append new blocks at the end

- [ ] **Step 1: Append CSS**

At the very end of `styles.css`, append:

```css
/* ─────────────────────────────────────────────────────────────────────────
   Player View Redesign — New Components
   ──────────────────────────────────────────────────────────────────────── */

/* Journal sub-tabs */
.journal-subtabs {
  display: flex;
  gap: 2px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--hairline);
  padding-bottom: 8px;
}
.journal-subtabs button {
  background: none;
  border: none;
  color: var(--fg-3);
  font: 500 13px/1 var(--f-ui);
  padding: 6px 14px;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.journal-subtabs button small {
  font-size: 11px;
  color: var(--fg-4);
}
.journal-subtabs button:hover { color: var(--fg-1); background: var(--panel-2); }
.journal-subtabs button.active { color: var(--brass); border-bottom: 2px solid var(--brass); }

/* Party Chronicle */
.chronicle-page { display: grid; grid-template-rows: auto 1fr; gap: 16px; height: 100%; }
.chronicle-composer {
  background: var(--card-bg);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chronicle-composer-head { display: flex; justify-content: space-between; align-items: baseline; }
.chronicle-composer button[type=submit] {
  align-self: flex-end;
  background: var(--brass);
  color: var(--void);
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font: 600 12px var(--f-ui);
  cursor: pointer;
  letter-spacing: .03em;
}
.chronicle-composer button[type=submit]:disabled { opacity: .45; cursor: default; }
.chronicle-feed { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.chronicle-entry {
  background: var(--card-bg);
  border: 1px solid var(--hairline);
  border-radius: 8px;
  padding: 12px 16px;
}
.chronicle-entry-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.chronicle-entry-head strong { color: var(--brass); font-size: 13px; }
.chronicle-entry-head span { color: var(--fg-4); font-size: 11px; }
.chronicle-entry p { color: var(--fg-1); font-size: 14px; line-height: 1.6; margin: 0; }

/* NPC Modal */
.npc-modal-backdrop {
  position: fixed; inset: 0; z-index: 500;
  background: oklch(0 0 0 / 0.65);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.npc-modal {
  background: var(--card-bg);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  max-width: 520px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 24px 64px oklch(0 0 0 / 0.5);
}
.npc-modal-close {
  position: absolute; top: 14px; right: 14px;
  background: var(--panel-2); border: none; border-radius: 6px;
  color: var(--fg-3); cursor: pointer; width: 28px; height: 28px;
  font-size: 13px; display: grid; place-items: center;
}
.npc-modal-close:hover { color: var(--fg); background: var(--plate); }
.npc-modal-head {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--hairline);
}
.npc-modal-head h2 { font: 600 22px var(--f-display); color: var(--fg); margin: 0 0 4px; }
.npc-modal-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--plate); color: var(--brass);
  font: 600 20px var(--f-display);
  display: grid; place-items: center; flex-shrink: 0;
}
.npc-modal-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.npc-modal-disp { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; margin-top: 4px; display: block; }
.npc-modal-body { padding: 16px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
.npc-modal-section p { color: var(--fg-2); font-size: 14px; line-height: 1.6; margin: 4px 0 0; }

/* Disposition badge (inline) */
.disp-badge {
  display: inline-block; font-size: 10px; font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase;
  padding: 2px 6px; border-radius: 4px;
  background: var(--panel-2); margin-top: 2px;
}
.disp-badge.disp-ally { color: var(--forest); }
.disp-badge.disp-hostile { color: var(--crimson); }
.disp-badge.disp-ambiguous { color: var(--amber); }
.disp-badge.disp-neutral { color: var(--fg-3); }
.player-face.clickable { cursor: pointer; }
.player-face.clickable:hover { background: var(--panel-2); border-radius: 8px; }
.face-expand { color: var(--fg-4); font-size: 18px; margin-left: auto; }

/* Intel — factions */
.intel-faction-row {
  padding: 10px 0;
  border-bottom: 1px solid var(--hairline-2);
}
.intel-faction-row:last-child { border-bottom: none; }
.intel-faction-main { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.intel-faction-main strong { font-size: 14px; color: var(--fg-1); }
.intel-faction-disp { font-size: 11px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; }
.intel-faction-ideology { color: var(--fg-3); font-size: 12px; margin: 2px 0 6px; }
.intel-faction-clock { display: flex; flex-direction: column; gap: 4px; }
.intel-clock-bar-wrap {
  height: 5px; background: var(--panel-2); border-radius: 3px; overflow: hidden;
}
.intel-clock-bar {
  height: 100%; background: var(--brass); border-radius: 3px;
  transition: width .3s ease;
}
.intel-faction-clock span { font-size: 11px; color: var(--fg-4); }

/* Intel — quests */
.intel-quest-row {
  padding: 10px 0;
  border-bottom: 1px solid var(--hairline-2);
}
.intel-quest-row:last-child { border-bottom: none; }
.intel-quest-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 4px; }
.intel-quest-head strong { font-size: 14px; color: var(--fg-1); }
.intel-quest-arc { font-size: 11px; color: var(--brass-2); font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
.intel-quest-row p { color: var(--fg-2); font-size: 13px; line-height: 1.5; margin: 2px 0; }
.intel-quest-stakes { color: var(--amber) !important; }
.intel-quest-next { color: var(--forest) !important; }

/* Intel — session history */
.intel-session-row {
  padding: 10px 0;
  border-bottom: 1px solid var(--hairline-2);
}
.intel-session-row:last-child { border-bottom: none; }
.intel-session-row strong { font-size: 13px; color: var(--fg-1); display: block; margin-bottom: 4px; }
.intel-session-row p { color: var(--fg-3); font-size: 12px; margin: 2px 0; }

/* Character Sheet (pc-) */
.pc-page {}
.pc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 780px) { .pc-grid { grid-template-columns: 1fr; } }
.pc-vitals { display: flex; flex-direction: column; gap: 16px; }
.pc-vitals-name h2 { font: 600 20px var(--f-display); margin: 4px 0 2px; }
.pc-dm-hp { font-size: 12px; }
.pc-hp-tracker { display: flex; flex-direction: column; gap: 8px; }
.pc-hp-bar-wrap {
  height: 8px; background: var(--panel-2); border-radius: 4px; overflow: hidden;
}
.pc-hp-bar { height: 100%; border-radius: 4px; transition: width .3s ease, background .3s ease; }
.pc-hp-controls { display: flex; align-items: center; gap: 6px; }
.pc-hp-controls button {
  width: 28px; height: 28px; border-radius: 6px;
  background: var(--panel-2); border: 1px solid var(--hairline);
  color: var(--fg); font-size: 16px; cursor: pointer; display: grid; place-items: center;
}
.pc-hp-controls button:hover { background: var(--plate); }
.pc-hp-input {
  width: 58px; text-align: center;
  background: var(--field-bg); border: 1px solid var(--hairline);
  border-radius: 6px; color: var(--fg); font: 600 15px var(--f-mono);
  padding: 4px 6px;
}
.pc-hp-sep { color: var(--fg-3); font-size: 16px; }
.pc-traits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
@media (max-width: 560px) { .pc-traits-grid { grid-template-columns: 1fr; } }
.pc-trait-field { display: flex; flex-direction: column; gap: 4px; }
.pc-hook-dm {
  margin-top: 10px;
  padding: 10px 12px;
  background: var(--panel-2);
  border-left: 3px solid var(--brass);
  border-radius: 0 6px 6px 0;
}
.pc-hook-dm .smallcaps { margin-bottom: 4px; }
.pc-hook-dm p { color: var(--fg-2); font-size: 13px; margin: 0; }

/* Inventory */
.pc-inventory { display: flex; flex-direction: column; gap: 6px; }
.pc-inv-row {
  display: grid; grid-template-columns: 1fr 48px 1fr 24px;
  gap: 6px; align-items: center;
}
.pc-inv-name, .pc-inv-note {
  background: var(--field-bg); border: 1px solid var(--hairline);
  border-radius: 6px; color: var(--fg); font: 13px var(--f-ui);
  padding: 4px 8px;
}
.pc-inv-qty {
  background: var(--field-bg); border: 1px solid var(--hairline);
  border-radius: 6px; color: var(--fg); font: 13px var(--f-mono);
  padding: 4px 6px; text-align: center;
}
.pc-inv-del {
  background: none; border: none; color: var(--fg-4);
  cursor: pointer; font-size: 16px; line-height: 1;
}
.pc-inv-del:hover { color: var(--crimson); }

/* Abilities */
.pc-abilities { display: flex; flex-direction: column; gap: 8px; }
.pc-ability-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 10px; background: var(--panel-2); border-radius: 8px;
}
.pc-ability-row strong { font-size: 13px; color: var(--fg-1); white-space: nowrap; }
.pc-ability-row p { font-size: 12px; color: var(--fg-3); margin: 2px 0 0; flex: 1; }
.pc-ability-row button {
  background: none; border: none; color: var(--fg-4);
  cursor: pointer; font-size: 16px; flex-shrink: 0;
}
.pc-ability-row button:hover { color: var(--crimson); }
.pc-ability-form { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.pc-ability-form input, .pc-ability-form textarea {
  background: var(--field-bg); border: 1px solid var(--hairline);
  border-radius: 6px; color: var(--fg); font: 13px var(--f-ui);
  padding: 6px 10px; resize: vertical;
}
.pc-ability-form textarea { min-height: 48px; }
.pc-ability-form button {
  align-self: flex-end;
  background: var(--panel-2); border: 1px solid var(--hairline);
  border-radius: 6px; color: var(--fg-2); font: 500 12px var(--f-ui);
  padding: 5px 14px; cursor: pointer;
}
.pc-ability-form button:hover { color: var(--fg); }

/* Party tab */
.party-page {}
.party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 780px) { .party-grid { grid-template-columns: 1fr; } }
.party-roster { display: flex; flex-direction: column; gap: 8px; }
.party-member-card {
  background: var(--panel-2);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background .15s;
}
.party-member-card:hover { background: var(--plate); }
.party-member-card.is-player { border-color: var(--brass-dim); }
.party-member-head { display: flex; align-items: center; gap: 12px; }
.party-member-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--plate); color: var(--brass);
  font: 600 14px var(--f-display);
  display: grid; place-items: center; flex-shrink: 0;
}
.party-member-card.is-player .party-member-avatar { background: var(--brass-dim); color: var(--void); }
.party-member-info { flex: 1; min-width: 0; }
.party-member-info strong { font-size: 14px; color: var(--fg-1); display: block; }
.party-member-info span { font-size: 12px; color: var(--fg-3); }
.party-you-badge {
  background: var(--brass-dim); color: var(--void);
  font-size: 10px; font-weight: 700; letter-spacing: .05em;
  padding: 1px 5px; border-radius: 4px; margin-left: 6px;
  text-transform: uppercase;
}
.party-member-hp { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
.party-hp-bar-wrap { width: 64px; height: 5px; background: var(--panel); border-radius: 3px; overflow: hidden; }
.party-hp-bar { height: 100%; border-radius: 3px; transition: width .3s; }
.party-hp-label { font: 11px var(--f-mono); color: var(--fg-4); }
.party-member-detail {
  margin-top: 10px; padding-top: 10px;
  border-top: 1px solid var(--hairline); display: flex; flex-direction: column; gap: 6px;
}
.party-member-row { display: flex; gap: 8px; font-size: 13px; }
.party-member-row .smallcaps { color: var(--fg-4); flex-shrink: 0; }
.party-member-row span:last-child { color: var(--fg-2); }

/* Theme Picker */
.theme-picker-backdrop {
  position: fixed; inset: 0; z-index: 400;
  background: oklch(0 0 0 / 0.50);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.theme-picker-panel {
  background: var(--card-bg);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  max-width: 640px; width: 100%;
  max-height: 80vh; overflow-y: auto;
  box-shadow: 0 20px 60px oklch(0 0 0 / 0.5);
}
.theme-picker-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--hairline);
  font: 600 14px var(--f-ui); color: var(--fg);
}
.theme-picker-head button {
  background: var(--panel-2); border: none; border-radius: 6px;
  color: var(--fg-3); cursor: pointer; width: 26px; height: 26px;
  font-size: 12px; display: grid; place-items: center;
}
.theme-picker-head button:hover { color: var(--fg); background: var(--plate); }
.theme-picker-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px; padding: 16px;
}
.theme-swatch-btn {
  background: var(--panel-2); border: 1px solid var(--hairline);
  border-radius: 8px; cursor: pointer;
  padding: 10px; display: flex; flex-direction: column; gap: 6px;
  transition: border-color .15s, background .15s;
  text-align: left; position: relative;
}
.theme-swatch-btn:hover { background: var(--plate); border-color: var(--hairline); }
.theme-swatch-btn.active { border-color: var(--brass); }
.theme-swatch-colors { display: flex; gap: 3px; height: 20px; border-radius: 4px; overflow: hidden; }
.theme-swatch-colors span { flex: 1; }
.theme-swatch-name { font: 500 12px var(--f-ui); color: var(--fg-2); }
.theme-swatch-dm {
  position: absolute; top: 6px; right: 6px;
  font: 700 9px var(--f-ui); letter-spacing: .06em;
  color: var(--brass); background: var(--panel);
  padding: 1px 5px; border-radius: 3px;
}
.theme-picker-reset {
  display: block; width: calc(100% - 32px); margin: 0 16px 16px;
  background: none; border: 1px solid var(--hairline);
  border-radius: 8px; color: var(--fg-3); font: 13px var(--f-ui);
  padding: 8px; cursor: pointer; text-align: center;
}
.theme-picker-reset:hover { color: var(--fg); border-color: var(--brass-dim); }
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "feat(player): CSS for chronicle, NPC modal, character sheet, party tab, theme picker"
```

---

### Task 11: Verify in browser

- [ ] **Step 1: Open demo URL**

Open: `player.html?campaign=demo-black-bell-vaelthorne&player=samira`

- [ ] **Step 2: Check each tab**
  - Overview: works, goals visible
  - Character: HP tracker, traits, inventory, abilities all functional
  - Journal: Private sub-tab works; Chronicle sub-tab shows composer and empty feed
  - Intel: NPCs clickable → modal opens; factions show clock bar; quests richer
  - Party: roster with HP bars, click to expand member
  - Inspiration: unchanged

- [ ] **Step 3: Check Theo's player view**

Open: `player.html?campaign=demo-black-bell-vaelthorne&player=theo`

Verify different character name, different default goal, same features work.

- [ ] **Step 4: Check theme picker**

Click "◐ Mood" in topbar → swatch panel opens → select a different theme → app recolors → close → theme persists on reload.

- [ ] **Step 5: Final commit if any fixes**

```bash
git add player.jsx styles.css
git commit -m "fix(player): post-verification polish"
```
