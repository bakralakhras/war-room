// Embers of Vaelthorne — fictional campaign data.
// Sets window globals consumed by WikiLink and the demo app.

window.CAMPAIGN = {
  name: "Embers of Vaelthorne",
  subtitle: "A kingdom mourns. An ember waits.",
  session: 14,
  sessionsTotal: 28,
  nextSession: "Sat, 27 Vael · 19:00",
  party: [
    { name: "Aelric Vorn",       role: "Half-elf Warlock",   patron: "The Hollow Sovereign", hp: "38/52", note: "owes a debt to the Veiled Hand" },
    { name: "Marda Stonebrew",   role: "Dwarven Cleric",     patron: "Order of the Pale Moon", hp: "61/61", note: "carries her brother's signet" },
    { name: "Sable",             role: "Tiefling Rogue",     patron: "—",                     hp: "34/41", note: "knows about the ledger" },
    { name: "Yew of the Quiet",  role: "Wood-elf Ranger",    patron: "—",                     hp: "47/47", note: "tracking the white stag" },
  ],
  location: { name: "Ashen Hollow", region: "The Margreave", note: "A flooded mining village, lantern-lit at noon. Smell of wet iron." },
  lastSession: {
    title: "Session XIII · The Drowned Lantern",
    bullets: [
      "Party recovered the half-burned ledger from Ferren's study.",
      "Lady Halsane recognised Marda's signet — refused to speak further.",
      "Sable lifted a wax-sealed letter bearing the Crown of Asters.",
      "A child in the market sang the regicide rhyme; no one stopped her.",
      "Yew saw the white stag west of the Hollow. It bled silver.",
    ],
  },
  prep: [
    { kind: "scene", title: "Cold open: the funeral procession", note: "Bells out of tune. The widow does not weep." },
    { kind: "scene", title: "The Veiled Hand makes contact", note: "Through Aelric's dreams or the innkeep — DM's choice." },
    { kind: "beat",  title: "Reveal: the ledger names a Pale Moon abbot", note: "Land this if the party reads page 6." },
    { kind: "beat",  title: "Faction tick: Iron Concord moves on Greymarch", note: "If session runs long, defer to next." },
  ],
};

window.FACTIONS = [
  { id: "iron-concord", name: "The Iron Concord",    sigil: "concord", ideology: "Order through steel. The crown is a contract.", leader: "High Marshal Caedren Vask", seat: "Greymarch Citadel", disposition: "hostile",   clock: { segments: 8, filled: 5, label: "March on Greymarch" },      color: "iron",    summary: "Standing army loyal first to the office of the crown. They have not yet decided whether Vaelthorne still has a crown." },
  { id: "veiled-hand",  name: "The Veiled Hand",     sigil: "hand",    ideology: "What is hidden is sovereign.",                  leader: "Unknown · the Quiet Chair", seat: "The Sable Library, beneath Ashen Hollow", disposition: "ambiguous", clock: { segments: 6, filled: 4, label: "Recover the Ledger" },         color: "oxblood", summary: "A library of secrets older than the kingdom. They sold the regicide. They will sell the next one." },
  { id: "pale-moon",    name: "Order of the Pale Moon", sigil: "moon", ideology: "Mercy is a discipline. Forgiveness is a vow.", leader: "Abbess Halsane Mire",       seat: "Cloister of the Drowned Lantern", disposition: "ally",      clock: { segments: 6, filled: 2, label: "Sanctuary for the Heir" },      color: "moon",    summary: "Healers and chroniclers. Their abbey hides the only living witness to the king's death." },
  { id: "ashen-court",  name: "The Ashen Court",     sigil: "crown",   ideology: "The throne is a flame. Tend it or be consumed.", leader: "Regent Theron Vael",       seat: "Cinderhold",              disposition: "neutral",   clock: { segments: 4, filled: 1, label: "Coronation of a Pretender" },   color: "ember",   summary: "What remains of the royal house. A regent who governs an empty chair, and a court that performs grief for an audience that has stopped watching." },
  { id: "saltbrothers", name: "The Saltbrothers",    sigil: "anchor",  ideology: "Salt forgives. Salt remembers.",                 leader: "Anchor-Captain Ren Holloway", seat: "Tidefast",              disposition: "neutral",   clock: { segments: 6, filled: 3, label: "Blockade of the Margreave" },   color: "forest",  summary: "A guild of smugglers and salt-priests. The fastest road north runs through their hulls and their loyalties." },
];

window.NPCS = [
  { id: "halsane",    name: "Abbess Halsane Mire",      title: "Mother of the Drowned Lantern",  faction: "pale-moon",    disposition: "ally",      location: "Ashen Hollow · Cloister", quote: "Mercy is the slowest blade. It cuts last.",                              likely: true,  tags: ["cleric", "chronicler", "ally"] },
  { id: "caedren",    name: "High Marshal Caedren Vask", title: "Bearer of the Iron Writ",        faction: "iron-concord", disposition: "hostile",   location: "Greymarch Citadel",        quote: "The crown is a contract. I am its signature.",                          likely: true,  tags: ["soldier", "lawman", "hostile"] },
  { id: "ferren",     name: "Ferren of the Ledger",      title: "Clerk, Veiled Hand",             faction: "veiled-hand",  disposition: "ambiguous", location: "deceased — Ashen Hollow",  quote: "I write what the world is too embarrassed to remember.",                likely: false, tags: ["clerk", "deceased?", "mystery"] },
  { id: "theron",     name: "Regent Theron Vael",        title: "Regent of the Ashen Court",     faction: "ashen-court",  disposition: "ambiguous", location: "Cinderhold",               quote: "Grief is a long, public office.",                                       likely: true,  tags: ["noble", "regent", "antagonist"] },
  { id: "renholloway",name: "Anchor-Captain Ren Holloway",title: "Of the Saltbrothers",           faction: "saltbrothers", disposition: "neutral",   location: "Tidefast",                 quote: "Salt forgives. I don't.",                                               likely: false, tags: ["captain", "smuggler", "ally?"] },
  { id: "child",      name: "The Hollow Child",           title: "Witness · Cloister of the Drowned Lantern", faction: "pale-moon", disposition: "ally", location: "Ashen Hollow · Cloister, lower cells", quote: "He smiled at the roses and then they were red.", likely: false, tags: ["child", "witness", "heir"] },
];

window.SECRETS = [
  { id: "s1", title: "The Regent ordered the regicide.",      weight: "Campaign", status: "sealed",   revealsTo: "When the ledger is read in full.",            relates: ["theron", "ferren"] },
  { id: "s2", title: "The Hollow Child is the rightful heir.", weight: "Campaign", status: "sealed",   revealsTo: "When Halsane is given no other choice.",      relates: ["child", "halsane"] },
  { id: "s3", title: "Ferren is alive in Tidefast.",           weight: "Arc",      status: "sealed",   revealsTo: "When the body is found missing.",             relates: ["ferren", "renholloway"] },
  { id: "s4", title: "The Veiled Hand sold the regicide twice.",weight: "Arc",     status: "cracked",  revealsTo: "Hinted in the ledger margins.",               relates: ["veiled-hand"] },
  { id: "s5", title: "Caedren carried the body from the field.",weight: "Scene",   status: "revealed", revealsTo: "Marda's brother told her, in confidence.",    relates: ["caedren"] },
  { id: "s6", title: "Aelric's patron is the King's ghost.",   weight: "Campaign", status: "sealed",   revealsTo: "When Aelric uses the pact in the throne room.", relates: ["aelric"] },
];

window.MAP_LOCATIONS = [
  { id: "cinderhold",   label: "Cinderhold",        name: "Cinderhold",        x: 0.52, y: 0.20, kind: "capital",  note: "The empty throne. Regent in residence." },
  { id: "greymarch",    label: "Greymarch Citadel", name: "Greymarch Citadel", x: 0.80, y: 0.34, kind: "fortress", note: "Iron Concord stronghold." },
  { id: "ashen-hollow", label: "Ashen Hollow",      name: "Ashen Hollow",      x: 0.36, y: 0.52, kind: "town",     note: "Party here. Flooded mines.", party: true },
  { id: "cloister",     label: "Drowned Lantern",   name: "Drowned Lantern",   x: 0.30, y: 0.60, kind: "abbey",    note: "Pale Moon cloister. The witness sleeps below." },
  { id: "tidefast",     label: "Tidefast",           name: "Tidefast",          x: 0.72, y: 0.74, kind: "port",     note: "Saltbrothers. The original ledger." },
  { id: "garden",       label: "Garden of Asters",  name: "Garden of Asters",  x: 0.58, y: 0.10, kind: "ruin",     note: "Where the king died.", flagged: true },
];

window.RELIGIONS = [
  { id: "rel-pale-moon", name: "The Pale Moon",        kind: "monastic order",   sigil: "moon",    tenets: "Mercy is a discipline. Memory is a sacrament. Forgiveness is the slowest vow." },
  { id: "rel-asters",    name: "The Five Asters",      kind: "civic cult",       sigil: "crown",   tenets: "One bloom for each founding house. They wilt in lockstep." },
  { id: "rel-hollow",    name: "The Hollow Sovereign", kind: "forbidden patron", sigil: "concord", tenets: "The throne dreams. The dreamer is the throne. The throne is empty." },
  { id: "rel-salt",      name: "The Salt Brotherhood", kind: "guild-faith",      sigil: "anchor",  tenets: "Salt forgives. Salt remembers. Salt does not lie about the sea." },
];

window.RELICS = [
  { id: "rel-ledger",  name: "The Half-Burned Ledger",   kind: "tome",         desc: "Names every secret the Veiled Hand sold this century. Burned at one corner. Cold to the touch." },
  { id: "rel-signet",  name: "Marda's Brother's Signet", kind: "ring",         desc: "Iron and salt. Cannot be removed once worn. Recognizes its kin." },
  { id: "rel-aster",   name: "Aster of the Garden",      kind: "flower",       desc: "Plucked the night Edrick died. Still bleeds silver in moonlight." },
  { id: "rel-lantern", name: "The Drowned Lantern",      kind: "relic, abbey", desc: "A lantern that burns underwater. Lit only when the Abbess has a witness to keep." },
  { id: "rel-writ",    name: "The Iron Writ",             kind: "document",     desc: "The Iron Concord's standing order to march. Sealed with three brass clasps. Two remain." },
  { id: "rel-key",     name: "Ferren's Key",              kind: "key, plain",   desc: "Opens nothing in Ashen Hollow. Opens a door at the bottom of Tidefast harbour." },
];

window.LORE = [
  { id: "lore-concordat", name: "The Concordat of Asters", kind: "history",  desc: "The five-house treaty that founded Vaelthorne, signed in the Garden two centuries ago. Two of its signatory houses are now extinct." },
  { id: "lore-plague",    name: "The Pale Plague",          kind: "history",  desc: "The fever that took the second and fourth houses. The Pale Moon raised their orphans, including the Abbess and the High Marshal." },
  { id: "lore-rhyme",     name: "The Regicide Rhyme",       kind: "song",     desc: "A children's rhyme: two roses, a vow, the third one knew. No author. Spreads like a fever. Sung in markets within a day of the king's death." },
  { id: "lore-stag",      name: "The Bleeding Stag",        kind: "myth",     desc: "The Margreave's omen. Bleeds silver where a crowned head has lied. Last seen the week the regency was declared." },
  { id: "lore-veil",      name: "On the Veiled Hand",       kind: "treatise", desc: "A clerk's library that sells what is hidden. Older than the kingdom. Their ledgers are the second draft of the chronicle." },
];

window.RUMORS = [
  { id: "r1", text: "A bell tolled at Cinderhold at the wrong hour. The bellmaster has not been seen since.",              source: "innkeep at the Drowned Lantern",  weight: "common"  },
  { id: "r2", text: "Iron Concord scouts ride the Margreave road in pairs now, never alone. They count the wagons.",       source: "salt-pedlar from Tidefast",       weight: "tactical" },
  { id: "r3", text: "A child sings the regicide rhyme in three markets. No one remembers teaching it.",                    source: "Yew, second watch",               weight: "ominous"  },
  { id: "r4", text: "The white stag was seen drinking from the Aster fountain. It bled silver into the water.",            source: "a Pale Moon novice",              weight: "lore"     },
  { id: "r5", text: "A man in Ferren's coat bought passage at Tidefast. The captain refused him twice and accepted on the third.", source: "Saltbrother gossip",       weight: "secret"   },
  { id: "r6", text: "Halsane has not lit the Lantern these three nights. The cloister says she is in prayer.",             source: "a smith's apprentice",            weight: "ominous"  },
];
