# Player View Redesign — "The Player's Table"
**Date:** 2026-06-07  
**Status:** Approved — implementing

## Goal
Expand the player view from a thin read-only broadcast receiver into a rich personal desk and collaborative space on par with the DM's War Room. Players should have full character ownership, a shared chronicle space, richer intel, and theme control.

## Tab Structure (6 tabs, up from 4)

| Tab | What it is |
|---|---|
| Overview | Quick-ref: tonight's focus, goals, latest journal snippet, recent reveals |
| Character *(new)* | HP tracker, traits (personality/ideals/bonds/flaws), inventory, abilities |
| Journal | Sub-tabs: Private (existing) + Party Chronicle (Supabase broadcast, shared) |
| Intel | NPCs with detail modal, factions with disposition + clocks, quests, handouts, secrets |
| Party *(new)* | Roster with HP bars, click-to-expand character cards |
| Inspiration | Keep as-is (sparks board + private notes) |

## Theme Picker
- Gear icon in topbar
- Floating swatch sheet with all 15 War Room themes
- Saves to `localStorage` as `player_theme_${campaignId}_${playerId}`
- DM broadcast theme is the default; player can override locally

## Party Chronicle (shared journal)
- Supabase broadcast channel: `chronicle:${campaignId}`
- Any player can post a dated entry (author = character name)
- All players receive and render entries in real time
- Cached in `localStorage` under `party_chronicle_${campaignId}`
- Survives DM going offline; shows cached entries when disconnected

## NPC Detail Modal
- FaceRow gets expand button
- Modal shows: avatar initial, name, title, location, description, known quotes, faction, party attitude
- All from already-published NPC object — no new DM data needed

## Character Sheet (desk additions)
```js
hp: { current: null, max: null },
traits: { personality: '', ideals: '', bonds: '', flaws: '' },
inventory: [],   // [{ id, name, qty, note }]
abilities: [],   // [{ id, name, desc }]
```
Persisted to existing `player_desk_${campaignId}_${playerId}` localStorage key via migrateDesk.

## Enhanced Intel
- Factions: disposition badge (ally/hostile/ambiguous/neutral) + filled clock bar
- Quests: arc label, stakes, next step shown more richly
- Timeline: session history shown if DM has broadcast sessions data

## Party Tab
- Full party roster with HP bar, role, patron, note
- Click member → character card detail (expand in place)
- Player can update own HP (persists locally, not broadcast to others in this phase)

## Files Changed
- `player.jsx` — full rewrite of component tree
- `styles.css` — new blocks for all new components

## Out of Scope
- Supabase DB table for chronicle (uses broadcast + cache only)
- DM seeing player journal entries
- Player editing NPC/quest/location data
