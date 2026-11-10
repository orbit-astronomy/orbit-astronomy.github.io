/* ==========================================================================
   ORBIT — worlds.js  (DATA ONLY, no behavior)
   --------------------------------------------------------------------------
   Every celestial body lives here as one JavaScript object. explorer.js reads
   the object that matches <body data-world="..."> and builds the whole page
   from it: text, stats, facts, the 3D model and the cross-section.

   WHY A DATA FILE?
   Before, each page was a copy of the same HTML. Now the pages are tiny shells
   and the *content* lives in one place, so adding a fact or tweaking a colour
   is a one-line edit here instead of ten edits across ten files.

   HOW TO READ A "model" BLOCK
     surface   – recipe handed to textures.js to paint the planet's skin
     tilt      – axis tilt in degrees (Uranus ≈ 98°, Venus ≈ 177° = upside down)
     spin      – how fast the model turns (radians per second; stylised)
     camera    – how far away the camera starts (planet radius is always 1)
     atmosphere / clouds / ring / moons – optional extras (see explorer.js)

   Colours in "surface" are [red, green, blue] arrays, each 0–255.
   Sizes of moons are exaggerated so you can actually see them; the page
   says "not to scale" for the same reason.
   ========================================================================== */
"use strict";

const WORLDS = {

  /* ------------------------------------------------------------------ EARTH */
  earth: {
    order: 1, name: "Earth", accent: "#4aa8ff", gravity: 9.81,
    tagline: "The only world we know that is alive.",
    type: "Terrestrial planet",
    description: "Our home: a rocky planet with liquid oceans, a protective magnetic field and an atmosphere that lets life thrive.",
    stats: [
      ["Diameter", "12,742 km"], ["Mass", "5.97 × 10²⁴ kg"], ["Gravity", "9.81 m/s²"],
      ["Day length", "24 hours"], ["Year length", "365.25 days"], ["Distance from Sun", "149.6 million km"],
      ["Average temperature", "15 °C"], ["Moons", "1"], ["Atmosphere", "78% nitrogen, 21% oxygen"]
    ],
    facts: [
      { h: "A water world", t: "About 71% of Earth's surface is covered by ocean, which holds roughly 97% of all its water." },
      { h: "Not quite a sphere", t: "Earth's spin makes it bulge: it is about 43 km wider across the equator than from pole to pole." },
      { h: "A planet-sized dynamo", t: "Swirling liquid iron in the outer core generates the magnetic field that deflects the solar wind." },
      { h: "A moving surface", t: "The crust is cracked into tectonic plates that creep along at about the speed your fingernails grow." },
      { h: "Slowing down", t: "Tides drag on Earth's rotation, lengthening the day by roughly 1.7 milliseconds per century." }
    ],
    missions: [
      ["1968", "Apollo 8", "Astronauts photographed “Earthrise” from lunar orbit, changing how we see our planet."],
      ["1972", "Landsat 1", "The first of a long series of satellites that have mapped Earth's land continuously."],
      ["2000", "International Space Station", "Humans have lived in orbit around Earth without a break since November 2000."]
    ],
    anatomy: {
      eyebrow: "EARTH / INTERNAL STRUCTURE", cutaway: true,
      heading: "A planet with", em: "layers.",
      lead: "Earth is built like a peach with a metal stone. Switch on the cross-section, or pick a layer, to see it. The crust is drawn thicker than real life so you can spot it.",
      items: [
        { name: "Crust",      to: 0.95,  color: "#9a6f47", depth: "0–70 km",        text: "A thin shell of solid rock. It is thinnest under the oceans (about 5 km) and thickest under mountain ranges (up to 70 km)." },
        { name: "Mantle",     to: 0.546, color: "#e0482a", depth: "70–2,900 km",    text: "Hot, slowly flowing silicate rock making up about 84% of Earth's volume. Its creeping currents drive plate tectonics." },
        { name: "Outer core", to: 0.192, color: "#ffb02e", depth: "2,900–5,150 km", text: "A churning ocean of liquid iron and nickel at 4,000–5,000 °C. Its motion generates Earth's magnetic field." },
        { name: "Inner core", to: 0,     color: "#fff1a8", depth: "5,150–6,371 km", text: "A solid iron–nickel ball about as hot as the Sun's surface. Immense pressure keeps it solid even at that temperature." }
      ]
    },
    model: {
      surface: { kind: "earth", seed: 7 }, tilt: 23.4, spin: 0.14, camera: 4.2, bumpScale: 0, roughness: 0.75,
      onlineMap: "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
      clouds: { seed: 21, coverage: 0.5 },
      atmosphere: { color: 0x4aa3ff, halo: 1.13, haloPower: 2.4, haloGain: 1.5, rimGain: 0.9 },
      moonFrame: "ecliptic",
      moons: [{ name: "Moon", size: 0.27, distance: 3.1, period: 40, inclination: 5, surface: { kind: "cratered", preset: "moon", seed: 3 } }]
    }
  },

  /* ------------------------------------------------------------------- MOON */
  moon: {
    order: 2, name: "Moon", accent: "#c8ccd6", gravity: 1.62,
    tagline: "Earth's silent companion.",
    type: "Natural satellite",
    description: "A cratered, airless world locked in a slow dance with Earth. Its gravity raises our tides and its surface preserves billions of years of impacts.",
    stats: [
      ["Diameter", "3,474 km"], ["Mass", "7.35 × 10²² kg"], ["Gravity", "1.62 m/s²"],
      ["Day length", "29.5 Earth days"], ["Orbit period", "27.3 Earth days"], ["Distance from Earth", "384,400 km"],
      ["Temperature", "−173 to 127 °C"], ["Moons", "0"], ["Atmosphere", "Almost none (a trace exosphere)"]
    ],
    facts: [
      { h: "Always the same face", t: "The Moon is tidally locked: it spins exactly once per orbit, so we only ever see its near side." },
      { h: "There is no “dark side”", t: "The far side gets just as much sunlight as the near side. It is simply hidden from Earth." },
      { h: "Drifting away", t: "The Moon recedes from Earth by about 3.8 cm every year, roughly the speed fingernails grow." },
      { h: "Born in a crash", t: "Most scientists think it formed when a Mars-sized body struck the young Earth about 4.5 billion years ago." },
      { h: "Ice in the shadows", t: "Some polar craters never see sunlight and hold water ice, a valuable resource for future explorers." }
    ],
    missions: [
      ["1969", "Apollo 11", "Neil Armstrong and Buzz Aldrin made the first crewed landing. Twelve people walked on the Moon by 1972."],
      ["2019", "Chang'e 4", "The first spacecraft to soft-land on the far side of the Moon."],
      ["2023", "Chandrayaan-3", "India became the first nation to land near the Moon's south pole."]
    ],
    anatomy: {
      eyebrow: "MOON / INTERNAL STRUCTURE", cutaway: true, heading: "A small", em: "iron heart.",
      lead: "Seismometers left by Apollo astronauts revealed the Moon's interior. Its core is tiny compared with Earth's. Layer sizes here are simplified.",
      items: [
        { name: "Crust",      to: 0.95, color: "#b9b4aa", depth: "0–~40 km",       text: "A thick, battered shell of light rock. Impacts have churned the top layer into fine dust called regolith." },
        { name: "Mantle",     to: 0.22, color: "#8a7f99", depth: "~40–1,350 km",   text: "Solid rock that once melted to feed the dark lava plains (maria) you can see from Earth." },
        { name: "Outer core", to: 0.14, color: "#ff9d4a", depth: "~1,350–1,480 km", text: "A thin layer of liquid iron-rich metal wrapped around the centre." },
        { name: "Inner core", to: 0,    color: "#fff1a8", depth: "Centre",          text: "A small, solid, iron-rich ball roughly 240 km in radius." }
      ]
    },
    model: {
      surface: { kind: "cratered", preset: "moon", seed: 3 }, tilt: 6.7, spin: 0.03, camera: 4.2, bumpScale: 0.035, roughness: 1,
      onlineMap: "https://threejs.org/examples/textures/planets/moon_1024.jpg"
    }
  },

  /* ---------------------------------------------------------------- MERCURY */
  mercury: {
    order: 3, name: "Mercury", accent: "#b9a897", gravity: 3.70,
    tagline: "Small, scorched and wrapped around a giant iron core.",
    type: "Terrestrial planet",
    description: "The smallest planet and the closest to the Sun. Its surface looks like the Moon's, but its enormous metal core makes it one of the densest worlds in the Solar System.",
    stats: [
      ["Diameter", "4,879 km"], ["Mass", "3.30 × 10²³ kg"], ["Gravity", "3.70 m/s²"],
      ["Day length", "176 Earth days (sunrise to sunrise)"], ["Year length", "88 Earth days"], ["Distance from Sun", "57.9 million km"],
      ["Temperature", "−180 to 430 °C"], ["Moons", "0"], ["Atmosphere", "Almost none (a trace exosphere)"]
    ],
    facts: [
      { h: "A day longer than a year", t: "Mercury spins so slowly that one sunrise-to-sunrise day lasts 176 Earth days, twice as long as its 88-day year." },
      { h: "Ice on the hottest planet's neighbour", t: "Permanently shadowed craters near the poles hold water ice, even though the planet is next to the Sun." },
      { h: "A giant metal core", t: "Its iron core fills roughly 85% of the planet's radius, a much bigger share than Earth's core." },
      { h: "Shrinking", t: "As its interior cooled, Mercury shrank by several kilometres, wrinkling its crust into long cliffs." },
      { h: "Extreme swings", t: "With almost no atmosphere to hold heat, temperatures swing by over 600 °C between day and night." }
    ],
    missions: [
      ["1974", "Mariner 10", "The first spacecraft to visit Mercury, flying past three times."],
      ["2011", "MESSENGER", "The first orbiter. It mapped the whole planet before ending its mission in 2015."],
      ["2018", "BepiColombo", "A joint European–Japanese mission launched in 2018 and due to enter orbit around Mercury in late 2026."]
    ],
    anatomy: {
      eyebrow: "MERCURY / INTERNAL STRUCTURE", cutaway: true, heading: "Mostly", em: "metal.",
      lead: "The core is thought to take up most of Mercury. Layer sizes are estimates and the crust is drawn thicker than reality.",
      items: [
        { name: "Crust",      to: 0.95, color: "#a08f80", depth: "0–~35 km",      text: "A thin rocky shell scarred by craters and long cliffs formed as the planet shrank." },
        { name: "Mantle",     to: 0.83, color: "#d9663a", depth: "~35–420 km",    text: "A surprisingly thin rocky layer, only about 400 km thick." },
        { name: "Outer core", to: 0.45, color: "#ffb02e", depth: "~420–1,300 km",  text: "Liquid iron. Its motion helps maintain Mercury's weak magnetic field." },
        { name: "Inner core", to: 0,    color: "#fff1a8", depth: "Centre",         text: "A solid iron ball. Its exact size is still uncertain." }
      ]
    },
    model: {
      surface: { kind: "cratered", preset: "mercury", seed: 12 }, tilt: 0.03, spin: 0.03, camera: 4.2, bumpScale: 0.035, roughness: 1
    }
  },

  /* ------------------------------------------------------------------ VENUS */
  venus: {
    order: 4, name: "Venus", accent: "#f0c27a", gravity: 8.87,
    tagline: "A cloud-wrapped furnace spinning the wrong way.",
    type: "Terrestrial planet",
    description: "Earth's rocky twin in size, but a runaway greenhouse effect has turned it into the hottest planet, hidden beneath thick clouds of sulfuric acid.",
    stats: [
      ["Diameter", "12,104 km"], ["Mass", "4.87 × 10²⁴ kg"], ["Gravity", "8.87 m/s²"],
      ["Day length", "243 Earth days (backwards)"], ["Year length", "224.7 Earth days"], ["Distance from Sun", "108.2 million km"],
      ["Surface temperature", "465 °C"], ["Moons", "0"], ["Atmosphere", "96% carbon dioxide"]
    ],
    facts: [
      { h: "Hotter than Mercury", t: "At about 465 °C the surface of Venus is hot enough to melt lead, even though Mercury is closer to the Sun." },
      { h: "Spinning backwards", t: "Venus rotates in the opposite direction to most planets, so the Sun rises in the west." },
      { h: "Crushing pressure", t: "The air at the surface is about 92 times heavier than Earth's, like being 900 m under the sea." },
      { h: "A volcanic world", t: "Venus has more than 1,600 major volcanoes, and some may still be active." },
      { h: "Short-lived visitors", t: "In 1982 the Soviet lander Venera 13 survived 127 minutes on the surface, a record for the time." }
    ],
    missions: [
      ["1970", "Venera 7", "The first spacecraft to land on another planet and transmit data from its surface."],
      ["1990", "Magellan", "Used radar to map almost the entire surface through the clouds."],
      ["2030s", "VERITAS, DAVINCI & EnVision", "NASA and ESA missions planned to study the surface, atmosphere and geology."]
    ],
    anatomy: {
      eyebrow: "VENUS / INTERNAL STRUCTURE", cutaway: true, heading: "Earth's", em: "twin inside.",
      lead: "Venus is probably built much like Earth, but we have almost no direct measurements. This layout is an educated model.",
      items: [
        { name: "Crust",  to: 0.95, color: "#a8794c", depth: "0–~50 km",     text: "Basalt rock, covered with volcanoes, lava plains and crumpled highlands." },
        { name: "Mantle", to: 0.55, color: "#e0482a", depth: "~50–2,900 km", text: "Hot rock that may still feed volcanoes at the surface." },
        { name: "Core",   to: 0,    color: "#ffc04a", depth: "~2,900–6,052 km", text: "Iron and nickel. It is probably at least partly liquid, but Venus has no global magnetic field." }
      ]
    },
    model: {
      surface: { kind: "venus", seed: 31 }, tilt: 177, spin: 0.02, camera: 4.2, bumpScale: 0, roughness: 1,
      atmosphere: { color: 0xffd38a, halo: 1.14, haloPower: 2.0, haloGain: 1.4, rimGain: 1.0 }
    }
  },

  /* ------------------------------------------------------------------- MARS */
  mars: {
    order: 5, name: "Mars", accent: "#e3714a", gravity: 3.71,
    tagline: "A frozen desert with the Solar System's biggest volcano.",
    type: "Terrestrial planet",
    description: "A cold, dusty world with ancient river valleys, towering volcanoes and polar ice caps. Rovers there are searching for signs that it once supported life.",
    stats: [
      ["Diameter", "6,779 km"], ["Mass", "6.42 × 10²³ kg"], ["Gravity", "3.71 m/s²"],
      ["Day length", "24 h 37 min"], ["Year length", "687 Earth days"], ["Distance from Sun", "227.9 million km"],
      ["Average temperature", "−63 °C"], ["Moons", "2 (Phobos, Deimos)"], ["Atmosphere", "95% carbon dioxide, very thin"]
    ],
    facts: [
      { h: "Giant volcano", t: "Olympus Mons is about 22 km high, roughly two and a half times the height of Mount Everest." },
      { h: "A scar across the planet", t: "Valles Marineris stretches about 4,000 km, long enough to span the continental United States." },
      { h: "Rusty red", t: "Iron oxide, the same stuff as rust, in the dust gives Mars its colour." },
      { h: "Blue sunsets", t: "Fine dust scatters light differently than on Earth, so Martian sunsets glow blue around the Sun." },
      { h: "A doomed moon", t: "Phobos is spiralling inward and will break apart or crash into Mars in roughly 50 million years." }
    ],
    missions: [
      ["1976", "Viking 1 & 2", "The first successful Mars landers, which also searched the soil for life."],
      ["2012", "Curiosity", "A car-sized rover exploring Gale Crater and its ancient lake-bed rocks."],
      ["2021", "Perseverance & Ingenuity", "Perseverance collects samples, and Ingenuity made the first powered flight on another world."]
    ],
    anatomy: {
      eyebrow: "MARS / INTERNAL STRUCTURE", cutaway: true, heading: "A cooled", em: "inner world.",
      lead: "NASA's InSight lander listened to marsquakes and revealed a large liquid core. Crust thickness is exaggerated here.",
      items: [
        { name: "Crust",  to: 0.95, color: "#b5603c", depth: "0–~50 km",       text: "Basalt rock, thicker in the southern highlands than in the northern plains." },
        { name: "Mantle", to: 0.54, color: "#e0482a", depth: "~50–1,560 km",   text: "Rocky and much cooler than Earth's, so Mars has little volcanic activity today." },
        { name: "Core",   to: 0,    color: "#ffd35a", depth: "~1,560–3,390 km", text: "Liquid iron, nickel and sulfur about 1,830 km in radius. It no longer drives a global magnetic field." }
      ]
    },
    model: {
      surface: { kind: "mars", seed: 5 }, tilt: 25.2, spin: 0.135, camera: 4.2, bumpScale: 0.03, roughness: 1,
      atmosphere: { color: 0xe89a6a, halo: 1.07, haloPower: 2.6, haloGain: 0.7, rimGain: 0.45 },
      moonFrame: "equator",
      moons: [
        { name: "Phobos", size: 0.09, distance: 1.7, period: 7, color: 0x8a7c70 },
        { name: "Deimos", size: 0.06, distance: 2.3, period: 16, color: 0x9a8c7e }
      ]
    }
  },

  /* ---------------------------------------------------------------- JUPITER */
  jupiter: {
    order: 7, name: "Jupiter", accent: "#e0a878", gravity: 24.79,
    tagline: "A planet so big it nearly became a star.",
    type: "Gas giant",
    description: "The largest planet, a swirling ball of hydrogen and helium with banded clouds, colossal storms and dozens of moons, four of them world-sized.",
    stats: [
      ["Diameter", "139,820 km"], ["Mass", "1.90 × 10²⁷ kg"], ["Gravity", "24.8 m/s² (cloud tops)"],
      ["Day length", "9 h 56 min"], ["Year length", "11.9 Earth years"], ["Distance from Sun", "778.5 million km"],
      ["Cloud-top temperature", "−110 °C"], ["Moons", "95+ known"], ["Atmosphere", "Hydrogen and helium"]
    ],
    facts: [
      { h: "A heavyweight", t: "Jupiter holds about two and a half times the mass of all the other planets combined." },
      { h: "The Great Red Spot", t: "A storm wider than Earth that has been observed for at least 150 years, though it is slowly shrinking." },
      { h: "The fastest day", t: "It spins once in under 10 hours, which flattens the planet and stretches its clouds into bands." },
      { h: "Oceans under ice", t: "Europa hides a salty ocean beneath its ice shell, one of the best places to look for life." },
      { h: "Volcano moon", t: "Io is the most volcanically active body in the Solar System, squeezed by Jupiter's tides." }
    ],
    missions: [
      ["1995", "Galileo", "The first Jupiter orbiter. It also dropped a probe into the atmosphere."],
      ["2016", "Juno", "Orbits over the poles to study Jupiter's interior, magnetic field and auroras."],
      ["2024", "Europa Clipper", "Launched to study Europa's ice shell and ocean, arriving around 2030."]
    ],
    anatomy: {
      eyebrow: "JUPITER / INTERNAL STRUCTURE", cutaway: true, heading: "No surface, just", em: "deeper gas.",
      lead: "Jupiter has no solid ground. Gas thickens into liquid with depth. Models differ, and Juno's data suggests the core is fuzzy and spread out.",
      items: [
        { name: "Cloud tops",         to: 0.96, color: "#e8c9a0", depth: "0–~3,000 km",     text: "Bands of ammonia and water clouds. The weather you see happens in a thin layer." },
        { name: "Molecular hydrogen", to: 0.82, color: "#d4793a", depth: "~3,000–12,000 km", text: "Hydrogen gas gets denser and hotter, gradually turning into liquid." },
        { name: "Metallic hydrogen",  to: 0.25, color: "#8a7dff", depth: "~12,000–52,000 km", text: "Under huge pressure hydrogen conducts electricity like a metal. Its motion creates the strongest magnetic field of any planet." },
        { name: "Dilute core",        to: 0,    color: "#fff1b0", depth: "Centre",            text: "A hot, dense mix of rock, ice and hydrogen, possibly blended into the layer above." }
      ]
    },
    model: {
      surface: { kind: "gas", preset: "jupiter", seed: 8 }, tilt: 3.1, spin: 0.3, camera: 7.4, bumpScale: 0, roughness: 0.95,
      atmosphere: { color: 0xe6c7a0, halo: 1.06, haloPower: 2.8, haloGain: 0.6, rimGain: 0.5 },
      moonFrame: "equator",
      moons: [
        { name: "Io",       size: 0.085, distance: 1.9, period: 6,  color: 0xe8d36a },
        { name: "Europa",   size: 0.075, distance: 2.4, period: 12, color: 0xd9d2c0 },
        { name: "Ganymede", size: 0.115, distance: 3.0, period: 24, color: 0x9d8f80 },
        { name: "Callisto", size: 0.105, distance: 3.7, period: 52, color: 0x5d5650 }
      ]
    }
  },

  /* ----------------------------------------------------------------- SATURN */
  saturn: {
    order: 8, name: "Saturn", accent: "#ecd49a", gravity: 10.44,
    tagline: "The jewel of the Solar System.",
    type: "Gas giant",
    description: "A pale gold giant circled by the most spectacular ring system we know, made of countless chunks of ice from dust specks to house-sized boulders.",
    stats: [
      ["Diameter", "116,460 km"], ["Mass", "5.68 × 10²⁶ kg"], ["Gravity", "10.4 m/s² (cloud tops)"],
      ["Day length", "10 h 34 min"], ["Year length", "29.4 Earth years"], ["Distance from Sun", "1.43 billion km"],
      ["Cloud-top temperature", "−140 °C"], ["Moons", "270+ known"], ["Atmosphere", "Hydrogen and helium"]
    ],
    facts: [
      { h: "It would float", t: "Saturn's average density is lower than water's. A big enough bathtub would let it float." },
      { h: "Wide but wafer-thin", t: "The rings span about 280,000 km, yet they are usually only about 10 metres thick." },
      { h: "A hexagon on top", t: "A six-sided jet stream about 30,000 km across circles Saturn's north pole." },
      { h: "Young rings?", t: "The rings may be only hundreds of millions of years old. Scientists still debate this." },
      { h: "Moons with surprises", t: "Titan has methane lakes and a thick atmosphere, and Enceladus shoots geysers of water into space." }
    ],
    missions: [
      ["1979", "Pioneer 11", "The first spacecraft to fly past Saturn."],
      ["2004", "Cassini–Huygens", "Orbited Saturn for 13 years, and its Huygens probe landed on Titan in 2005."],
      ["2028", "Dragonfly", "A planned NASA rotorcraft that will fly between sites on Titan."]
    ],
    anatomy: {
      eyebrow: "SATURN / INTERNAL STRUCTURE", cutaway: true, heading: "Light, deep and", em: "layered.",
      lead: "Like Jupiter, Saturn is a gas giant with no solid surface. Layer boundaries are approximate.",
      items: [
        { name: "Cloud tops",         to: 0.97, color: "#f0dca8", depth: "0–~2,000 km",   text: "Hazy bands of ammonia ice crystals, calmer-looking than Jupiter's but with fierce winds." },
        { name: "Molecular hydrogen", to: 0.6,  color: "#e0a060", depth: "~2,000–23,000 km", text: "Hydrogen turns from gas to liquid as the pressure builds." },
        { name: "Metallic hydrogen",  to: 0.2,  color: "#8a7dff", depth: "~23,000–47,000 km", text: "Electrically conducting liquid hydrogen that powers Saturn's magnetic field." },
        { name: "Dense core",         to: 0,    color: "#fff1b0", depth: "Centre",          text: "A hot, dense mix of rock and ice, perhaps 10–20 times Earth's mass." }
      ]
    },
    model: {
      surface: { kind: "gas", preset: "saturn", seed: 14 }, tilt: 26.7, spin: 0.27, camera: 8.2, elevation: 0.4, bumpScale: 0, roughness: 0.95,
      atmosphere: { color: 0xf0dca8, halo: 1.06, haloPower: 2.8, haloGain: 0.55, rimGain: 0.45 },
      // Ring edges are measured in planet radii; bands are [start, end, opacity, colour] across that span.
      ring: { inner: 1.24, outer: 2.27, seed: 4, bands: [
        [0.00, 0.28, 0.25, [120, 105, 90]],   // faint C ring
        [0.28, 0.69, 0.92, [214, 192, 150]],  // bright B ring
        [0.69, 0.77, 0.06, [90, 80, 70]],     // Cassini Division (a gap)
        [0.77, 0.94, 0.72, [200, 180, 140]],  // A ring
        [0.94, 0.955, 0.05, [90, 80, 70]],    // Encke gap
        [0.955, 1.0, 0.6, [190, 170, 135]]    // outer A ring
      ] },
      moonFrame: "equator",
      moons: [
        { name: "Enceladus", size: 0.06, distance: 2.6, period: 10, color: 0xf2f6fa },
        { name: "Rhea",      size: 0.075, distance: 3.2, period: 20, color: 0xcfcac2 },
        { name: "Titan",     size: 0.13, distance: 3.9, period: 38, color: 0xd9953a }
      ]
    }
  },

  /* ----------------------------------------------------------------- URANUS */
  uranus: {
    order: 9, name: "Uranus", accent: "#8fe6ea", gravity: 8.69,
    tagline: "The ice giant that rolls on its side.",
    type: "Ice giant",
    description: "A pale cyan giant knocked over so far that it orbits the Sun tilted on its side, with faint dark rings and a lopsided magnetic field.",
    stats: [
      ["Diameter", "50,724 km"], ["Mass", "8.68 × 10²⁵ kg"], ["Gravity", "8.69 m/s²"],
      ["Day length", "17 h 14 min (backwards)"], ["Year length", "84 Earth years"], ["Distance from Sun", "2.87 billion km"],
      ["Cloud-top temperature", "−195 °C"], ["Moons", "29 known"], ["Atmosphere", "Hydrogen, helium, methane"]
    ],
    facts: [
      { h: "Rolling around the Sun", t: "Uranus is tilted about 98°, so its poles take turns pointing almost straight at the Sun." },
      { h: "Seasons of 21 years", t: "Because of that tilt, each pole gets about 42 years of sunlight followed by 42 of darkness." },
      { h: "The coldest atmosphere", t: "A record low of about −224 °C was measured, colder than even more distant Neptune." },
      { h: "Why cyan?", t: "Methane in the upper atmosphere absorbs red light and lets blue-green light bounce back." },
      { h: "One visitor", t: "Voyager 2 flew past in January 1986 and remains the only spacecraft to have visited." }
    ],
    missions: [
      ["1781", "Discovery", "William Herschel spotted Uranus and first thought it was a comet. It was the first planet found with a telescope."],
      ["1986", "Voyager 2", "Discovered 10 new moons and a ring system on its brief flyby."],
      ["2030s", "Uranus Orbiter and Probe", "The top-priority flagship mission recommended by US planetary scientists."]
    ],
    anatomy: {
      eyebrow: "URANUS / INTERNAL STRUCTURE", cutaway: true, heading: "An icy", em: "interior.",
      lead: "“Ice giant” refers to the hot, dense fluid of water, ammonia and methane inside. Layer sizes are modelled.",
      items: [
        { name: "Atmosphere",       to: 0.8,  color: "#aef3f3", depth: "0–~5,000 km",    text: "Hydrogen, helium and methane, with only faint banding." },
        { name: "Icy mantle",       to: 0.2,  color: "#4a8fe8", depth: "~5,000–20,000 km", text: "A hot, dense fluid of water, ammonia and methane that may hold swirling electric currents." },
        { name: "Rocky core",       to: 0,    color: "#e6dccb", depth: "Centre",          text: "A small core of rock and metal, about the size of Earth." }
      ]
    },
    model: {
      surface: { kind: "gas", preset: "uranus", seed: 2 }, tilt: 97.8, spin: 0.2, camera: 6.2, elevation: 0.22, bumpScale: 0, roughness: 0.95,
      atmosphere: { color: 0x8fe8f0, halo: 1.1, haloPower: 2.4, haloGain: 1.0, rimGain: 0.8 },
      ring: { inner: 1.64, outer: 2.05, seed: 9, bands: [
        [0.00, 0.05, 0.30, [140, 160, 170]], [0.18, 0.2, 0.22, [140, 160, 170]],
        [0.34, 0.37, 0.28, [140, 160, 170]], [0.55, 0.58, 0.24, [140, 160, 170]],
        [0.8, 0.83, 0.3, [140, 160, 170]], [0.96, 1.0, 0.65, [170, 185, 195]]
      ] },
      moonFrame: "equator",
      moons: [
        { name: "Miranda", size: 0.05, distance: 2.4, period: 14, color: 0xb9b7b2 },
        { name: "Ariel",   size: 0.07, distance: 2.9, period: 22, color: 0xc9c6c0 },
        { name: "Titania", size: 0.09, distance: 3.5, period: 40, color: 0xa8a29a }
      ]
    }
  },

  /* ---------------------------------------------------------------- NEPTUNE */
  neptune: {
    order: 10, name: "Neptune", accent: "#5a82ff", gravity: 11.15,
    tagline: "A dark, windswept blue world at the edge.",
    type: "Ice giant",
    description: "The most distant planet, found by mathematics before telescopes. It has the fastest winds in the Solar System and a backwards-orbiting moon, Triton.",
    stats: [
      ["Diameter", "49,244 km"], ["Mass", "1.02 × 10²⁶ kg"], ["Gravity", "11.15 m/s²"],
      ["Day length", "16 h 6 min"], ["Year length", "164.8 Earth years"], ["Distance from Sun", "4.50 billion km"],
      ["Cloud-top temperature", "−200 °C"], ["Moons", "16 known"], ["Atmosphere", "Hydrogen, helium, methane"]
    ],
    facts: [
      { h: "Supersonic winds", t: "Winds reach about 2,100 km/h, the fastest measured on any planet." },
      { h: "Found with maths", t: "In 1846 astronomers predicted where Neptune must be from irregularities in Uranus's orbit, then found it right there." },
      { h: "One lap", t: "Neptune completed its first orbit since discovery in 2011, after 164.8 Earth years." },
      { h: "A captured moon", t: "Triton orbits backwards, which suggests it is a Kuiper Belt object Neptune captured. It has nitrogen geysers." },
      { h: "Its own heat", t: "Neptune radiates about 2.6 times more energy than it receives from the distant Sun." }
    ],
    missions: [
      ["1846", "Discovery", "Observed by Johann Galle after calculations by Urbain Le Verrier and John Couch Adams."],
      ["1989", "Voyager 2", "The only spacecraft to visit. It found the Great Dark Spot and Triton's geysers."],
      ["Today", "Hubble & JWST", "Space telescopes watch Neptune's changing storms and faint rings."]
    ],
    anatomy: {
      eyebrow: "NEPTUNE / INTERNAL STRUCTURE", cutaway: true, heading: "Deep, hot and", em: "dense.",
      lead: "Neptune's interior is much like Uranus's, though Neptune is warmer inside. Layer sizes are modelled.",
      items: [
        { name: "Atmosphere", to: 0.8, color: "#7f9bff", depth: "0–~5,000 km",     text: "Hydrogen, helium and a little methane, which gives the blue colour." },
        { name: "Icy mantle", to: 0.2, color: "#2f4fd6", depth: "~5,000–20,000 km", text: "A hot, dense liquid of water, ammonia and methane." },
        { name: "Rocky core", to: 0,   color: "#e6dccb", depth: "Centre",           text: "A small rock and metal core around the mass of Earth." }
      ]
    },
    model: {
      surface: { kind: "gas", preset: "neptune", seed: 6 }, tilt: 28.3, spin: 0.22, camera: 6.0, bumpScale: 0, roughness: 0.95,
      atmosphere: { color: 0x4a7bff, halo: 1.1, haloPower: 2.4, haloGain: 1.1, rimGain: 0.9 },
      moonFrame: "equator",
      moons: [{ name: "Triton", size: 0.13, distance: 3.1, period: 30, retrograde: true, inclination: 25, color: 0xe5d3cf }]
    }
  },

  /* -------------------------------------------------------------- ASTEROIDS */
  asteroids: {
    order: 6, name: "Asteroid Belt", accent: "#b5a08c", gravity: 0.28, gravityNote: "on Ceres",
    tagline: "A ring of leftover worlds that never became a planet.",
    type: "Small-body region",
    description: "Between Mars and Jupiter orbit millions of rocky and metallic bodies, the leftovers of planet-building. Jupiter's gravity kept them from ever merging into a planet.",
    stats: [
      ["Region", "2.2 – 3.2 AU from the Sun"], ["Total mass", "About 3% of the Moon's"], ["Largest body", "Ceres (940 km)"],
      ["Asteroids over 1 km", "About 1 million"], ["Orbital period", "3.5 – 6 Earth years"], ["Average spacing", "Hundreds of thousands of km"],
      ["Main types", "C (dark), S (stony), M (metal)"], ["Gravity", "0.28 m/s² on Ceres"], ["Atmosphere", "None"]
    ],
    facts: [
      { h: "Mostly empty space", t: "Spacecraft cross the belt without special precautions, because asteroids are typically hundreds of thousands of km apart." },
      { h: "Half-pint planet", t: "All the asteroids put together weigh only about 3% as much as the Moon. Ceres alone holds roughly a third of that." },
      { h: "Gaps made by Jupiter", t: "Jupiter's gravity clears out certain orbits, called Kirkwood gaps, and you can see them as thin dark lanes in this model." },
      { h: "Three families", t: "Dark carbon-rich C-types are the most common, followed by stony S-types and metallic M-types." },
      { h: "Ceres has bright spots", t: "Shiny patches of salt in Ceres's Occator Crater are thought to be left over from a briny underground reservoir." }
    ],
    missions: [
      ["2011", "Dawn", "The first spacecraft to orbit two bodies beyond Earth: Vesta (2011) and then the dwarf planet Ceres (2015)."],
      ["2021", "Lucy", "Launched to visit a main-belt asteroid and then several Trojan asteroids near Jupiter."],
      ["2023", "Psyche", "Launched to explore a metal-rich asteroid, arriving in 2029."]
    ],
    anatomy: {
      eyebrow: "ASTEROID BELT / VARIETY", cutaway: false, heading: "Three kinds of", em: "rock.",
      lead: "Not all asteroids are alike. Pick a type to make it glow in the model.",
      items: [
        { name: "C-type", share: "About 75%", color: "#8b7d6e", text: "Dark, carbon-rich and very primitive. They dominate the outer belt and may hold water-bearing minerals." },
        { name: "S-type", share: "About 17%", color: "#d8aa78", text: "Stony and silicate-rich, a bit brighter. They are common in the inner belt." },
        { name: "M-type", share: "About 8%",  color: "#c4d2f0", text: "Metal-rich, possibly the exposed cores of shattered worlds. Psyche is the best-known example." }
      ]
    },
    model: { kind: "belt", camera: 8.5, spin: 0.05 }
  },

  /* =====================================================================
     VISITED ASTEROIDS (v0.5)
     --------------------------------------------------------------------
     Each of these has been visited by a spacecraft. We cannot ship the real
     scan meshes, so each shape is built in explorer.js from its published
     dimensions plus its signature feature (Bennu's spinning-top ridge,
     Eros's saddle, Vesta's giant basin...). "shape" fields:
       radii  – relative length of the x/y/z axes (y is the spin axis)
       waist  – pinches the middle (contact binaries)   neck – where along x
       asym   – makes one end bigger    ridge – equatorial bulge (spinning top)
       bend   – banana curve            rough – lumpiness   basin – giant crater
     ===================================================================== */
  ceres: {
    order: 1, group: "asteroid", eyebrow: "ASTEROID / 01 OF 13", kicker: "CERES / DWARF PLANET",
    name: "Ceres", accent: "#c9c3b8", gravity: 0.28, gravityNote: "on Ceres",
    tagline: "The belt's only dwarf planet, with mysterious bright spots.",
    type: "Dwarf planet (largest asteroid)",
    description: "By far the biggest object in the asteroid belt, round like a planet and rich in water ice. NASA's Dawn spacecraft orbited it from 2015.",
    stats: [
      ["Diameter", "940 km"], ["Mass", "9.4 × 10²⁰ kg"], ["Gravity", "0.28 m/s²"],
      ["Day length", "9 h 4 min"], ["Year length", "4.6 Earth years"], ["Distance from Sun", "414 million km (2.77 AU)"],
      ["Temperature", "About −105 °C"], ["Moons", "0"], ["Type", "Dwarf planet, C-type"]
    ],
    facts: [
      { h: "Found in 1801", t: "Giuseppe Piazzi discovered Ceres on the first day of the 19th century. It was called a planet for about 50 years." },
      { h: "A third of the belt", t: "Ceres alone holds roughly a third of the entire asteroid belt's mass." },
      { h: "Bright salt spots", t: "Shiny patches in Occator Crater are sodium carbonate, left behind when briny water seeped out and froze." },
      { h: "An ice volcano", t: "Ahuna Mons is a 4 km-high mountain that erupted slushy brine instead of lava." },
      { h: "Watery world", t: "Perhaps a quarter of Ceres by mass is water ice, and there may still be brine underground." }
    ],
    missions: [
      ["1801", "Discovery", "Giuseppe Piazzi spotted it from Palermo, Sicily."],
      ["2015", "Dawn", "Became the first spacecraft to orbit a dwarf planet, mapping it until 2018."],
      ["2006", "Reclassified", "The IAU named Ceres a dwarf planet, alongside Pluto."]
    ],
    anatomy: {
      eyebrow: "CERES / INTERNAL STRUCTURE", cutaway: true, heading: "Mud, ice and", em: "rock.",
      lead: "Dawn's gravity measurements show Ceres is partly sorted into layers. Boundaries here are modelled and uncertain.",
      items: [
        { name: "Icy crust",   to: 0.9,  color: "#d8d2c4", depth: "0–~40 km",     text: "A mix of water ice, salts and rock that records past impacts and brine leaks." },
        { name: "Muddy mantle", to: 0.45, color: "#8a6a58", depth: "~40–260 km",  text: "Rock mixed with ice and salty water, possibly still holding pockets of brine." },
        { name: "Rocky core",  to: 0,    color: "#e8b05a", depth: "Centre",        text: "A denser rocky region. Its size and exact makeup are still uncertain." }
      ]
    },
    model: { surface: { kind: "cratered", preset: "ceres", seed: 9 }, tilt: 4, spin: 0.3, camera: 3.8, bumpScale: 0.035, roughness: 1 }
  },

  vesta: {
    order: 2, group: "asteroid", eyebrow: "ASTEROID / 02 OF 13", kicker: "VESTA / ASTEROID",
    name: "Vesta", accent: "#d6d1c8", gravity: 0.25, gravityNote: "on Vesta",
    tagline: "A battered, almost-planet with a mountain taller than Everest.",
    type: "Large main-belt asteroid",
    description: "The second most massive object in the belt and the brightest asteroid in our sky. It formed layers like a small planet before a huge impact gouged out its south pole.",
    stats: [
      ["Size", "573 × 557 × 446 km"], ["Mass", "2.6 × 10²⁰ kg"], ["Gravity", "0.25 m/s²"],
      ["Day length", "5 h 20 min"], ["Year length", "3.6 Earth years"], ["Distance from Sun", "353 million km (2.36 AU)"],
      ["Temperature", "−188 to −18 °C"], ["Moons", "0"], ["Type", "V-type (basaltic)"]
    ],
    facts: [
      { h: "A giant dent", t: "The Rheasilvia basin at the south pole is about 500 km wide, nearly the width of Vesta itself." },
      { h: "A mountain taller than Everest", t: "Rheasilvia's central peak rises around 20 km, among the tallest known mountains." },
      { h: "Visible to the naked eye", t: "Vesta is the brightest asteroid and can be seen without a telescope under dark skies." },
      { h: "Meteorites from Vesta", t: "Pieces blasted off by impacts have fallen to Earth, giving us free samples of Vesta's crust." },
      { h: "Almost a planet", t: "It melted and separated into a metal core, rocky mantle and crust, like the rocky planets did." }
    ],
    missions: [
      ["1807", "Discovery", "Heinrich Olbers found Vesta, the fourth asteroid discovered."],
      ["2011", "Dawn", "Orbited Vesta for 14 months and mapped its surface and gravity in detail."],
      ["Ongoing", "Meteorite studies", "Vesta-family meteorites on Earth help date the formation of the Solar System."]
    ],
    anatomy: {
      eyebrow: "VESTA / SURFACE FEATURES", cutaway: false, hint: "Select a feature to read about it.",
      heading: "Scars of an", em: "ancient crash.",
      lead: "Vesta's southern basin is the most dramatic thing on it. The model reproduces it with a dent and central peak.",
      items: [
        { name: "Rheasilvia basin", color: "#e8d9a8", depth: "~500 km wide, 19 km deep", text: "Carved out by an impact roughly a billion years ago, which threw off about 1% of Vesta's volume." },
        { name: "Central peak",     color: "#ffb02e", depth: "~20 km high",              text: "The mountain in the middle of Rheasilvia, one of the tallest in the Solar System." },
        { name: "Equatorial troughs", color: "#9fb4e8", depth: "Hundreds of km long",   text: "Huge grooves wrapped around the equator, probably fractures from the giant impact." }
      ]
    },
    model: { mesh: { id: "vesta", color: 0xb4aea4 }, surface: { kind: "cratered", preset: "vesta", seed: 15 }, shape: { radii: [1, 0.972, 0.778], rough: 0.025, basin: { depth: 0.2, size: 0.62 }, seed: 15 },
             tilt: 27, spin: 0.35, camera: 3.6, bumpScale: 0.035, roughness: 1 }
  },

  eros: {
    order: 3, group: "asteroid", eyebrow: "ASTEROID / 03 OF 13", kicker: "EROS / NEAR-EARTH ASTEROID",
    name: "Eros", accent: "#d9c6a2", gravity: 0.005, gravityNote: "on average (it varies across the surface)",
    tagline: "A tumbling, peanut-shaped rock that a spacecraft landed on.",
    type: "Near-Earth asteroid",
    description: "A long, saddle-shaped, stony asteroid that crosses Mars's orbit. It was the first near-Earth asteroid ever found, and the first one a spacecraft orbited and landed on.",
    stats: [
      ["Size", "34 × 11 × 11 km"], ["Mass", "6.7 × 10¹⁵ kg"], ["Gravity", "0.002–0.006 m/s²"],
      ["Day length", "5 h 16 min"], ["Year length", "1.76 Earth years"], ["Distance from Sun", "1.13–1.78 AU"],
      ["Temperature", "About −150 to 100 °C"], ["Moons", "0"], ["Type", "S-type (stony)"]
    ],
    facts: [
      { h: "A landing nobody planned", t: "In 2001 NEAR Shoemaker, not built as a lander, touched down on Eros and kept transmitting for two weeks." },
      { h: "Crosses Mars's orbit", t: "Eros wanders from near Earth's orbit out beyond Mars's, which is why it is called a near-Earth asteroid." },
      { h: "Found in 1898", t: "It was the first near-Earth asteroid ever discovered." },
      { h: "Boulders everywhere", t: "Eros has a deep layer of dust and rubble. Many boulders are the size of houses." },
      { h: "Lumpy gravity", t: "Because of its elongated shape, gravity is stronger at the ends than in the narrow middle." }
    ],
    missions: [
      ["1898", "Discovery", "Found by Gustav Witt and Auguste Charlois on the same night."],
      ["2000", "NEAR Shoemaker", "The first spacecraft to orbit an asteroid."],
      ["2001", "Landing", "NEAR Shoemaker touched down on Eros on 12 February 2001."]
    ],
    anatomy: {
      eyebrow: "EROS / SURFACE FEATURES", cutaway: false, hint: "Select a feature to read about it.",
      heading: "A rocky", em: "peanut.",
      lead: "The model shows Eros's long body with a saddle in the middle.",
      items: [
        { name: "Saddle (Himeros)", color: "#e8d9a8", depth: "Middle of the body", text: "A broad dip between the two ends where regolith has collected." },
        { name: "Psyche crater",    color: "#ffb02e", depth: "~5 km wide",         text: "One of the largest craters on Eros, nearly half the width of the asteroid's narrow side." },
        { name: "Regolith blanket", color: "#9fb4e8", depth: "Tens of metres thick", text: "Loose dust and rubble covering most of the surface, thrown about by impacts over billions of years." }
      ]
    },
    model: { mesh: { id: "eros", color: 0xb0a08a }, surface: { kind: "cratered", preset: "eros", seed: 23 }, shape: { radii: [1, 0.33, 0.33], waist: 0.18, bend: 0.1, rough: 0.05, seed: 23 },
             tilt: 60, spin: 0.55, camera: 3.6, bumpScale: 0.035, roughness: 1 }
  },

  ida: {
    order: 4, group: "asteroid", eyebrow: "ASTEROID / 04 OF 13", kicker: "IDA & DACTYL / ASTEROID",
    name: "Ida", accent: "#d8c8ae", gravity: 0.012, gravityNote: "on average (it varies across the surface)",
    tagline: "The first asteroid found to have its own moon.",
    type: "Main-belt asteroid",
    description: "A heavily cratered, elongated asteroid in the Koronis family. Galileo's flyby revealed a tiny companion moon, Dactyl, which is shown orbiting here.",
    stats: [
      ["Size", "54 × 24 × 15 km"], ["Mass", "4.2 × 10¹⁶ kg"], ["Gravity", "About 0.01 m/s²"],
      ["Day length", "4 h 38 min"], ["Year length", "4.8 Earth years"], ["Distance from Sun", "2.86 AU"],
      ["Temperature", "About −100 °C"], ["Moons", "1 (Dactyl, ~1.4 km)"], ["Type", "S-type (stony)"]
    ],
    facts: [
      { h: "A moon for an asteroid", t: "Dactyl was spotted in Galileo's images in 1994, proving that asteroids can have moons." },
      { h: "Very old and very scarred", t: "Ida is covered in craters of every size, so its surface is billions of years old." },
      { h: "A family broken apart", t: "Ida belongs to the Koronis family, fragments of a larger asteroid that was shattered long ago." },
      { h: "Quick spinner", t: "It rotates in under five hours, so a 'day' on Ida is very short." },
      { h: "Second asteroid visited", t: "Galileo flew past Gaspra in 1991 and Ida in 1993 on its way to Jupiter." }
    ],
    missions: [
      ["1884", "Discovery", "Found by the Austrian astronomer Johann Palisa."],
      ["1993", "Galileo flyby", "Passed within 2,400 km on 28 August 1993."],
      ["1994", "Dactyl found", "Scientists noticed the moon while studying the downloaded images."]
    ],
    anatomy: {
      eyebrow: "IDA / SURFACE FEATURES", cutaway: false, hint: "Select a feature to read about it.",
      heading: "An old,", em: "cratered veteran.",
      lead: "Ida's moon Dactyl orbits in the model. Use the Moons toggle to hide it.",
      items: [
        { name: "Heavy cratering", color: "#e8d9a8", depth: "Everywhere", text: "Almost every part of Ida is saturated with craters." },
        { name: "Dactyl", color: "#9fb4e8", depth: "~1.4 km across", text: "A tiny moon, probably a fragment knocked off Ida or its parent body." },
        { name: "Regolith", color: "#ffb02e", depth: "Dozens of metres", text: "A thick layer of dust and rubble, evidence that Ida is very old." }
      ]
    },
    model: { surface: { kind: "cratered", preset: "ida", seed: 31 }, shape: { radii: [1, 0.43, 0.28], waist: 0.2, rough: 0.07, seed: 31 },
             tilt: 70, spin: 0.5, camera: 4.2, bumpScale: 0.035, roughness: 1, moonFrame: "equator",
             moons: [{ name: "Dactyl", size: 0.07, distance: 2.4, period: 18, color: 0xb3a490 }] }
  },

  itokawa: {
    order: 5, group: "asteroid", eyebrow: "ASTEROID / 05 OF 13", kicker: "ITOKAWA / NEAR-EARTH ASTEROID",
    name: "Itokawa", accent: "#d9a878", gravity: 0.0001, gravityNote: "on average (about 1/100,000 of Earth's)",
    tagline: "A sea-otter-shaped rubble pile that came home in a capsule.",
    type: "Near-Earth asteroid",
    description: "A small, reddish asteroid made of two lumps stuck together. Japan's Hayabusa brought back thousands of grains of it, the first asteroid samples ever returned.",
    stats: [
      ["Size", "535 × 294 × 209 m"], ["Mass", "3.5 × 10¹⁰ kg"], ["Gravity", "About 0.0001 m/s²"],
      ["Day length", "12 h 8 min"], ["Year length", "1.5 Earth years"], ["Distance from Sun", "0.95–1.70 AU"],
      ["Density", "About 1.9 g/cm³ (porous)"], ["Moons", "0"], ["Type", "S-type (stony)"]
    ],
    facts: [
      { h: "A rubble pile", t: "Itokawa is not solid rock. It is a loose heap of boulders and gravel held together by faint gravity." },
      { h: "Shaped like an otter", t: "Scientists call its two lobes the 'head' and 'body'. It is probably two rubble piles that merged gently." },
      { h: "Sample return, first of its kind", t: "Hayabusa returned in 2010 with over 1,500 grains, the first samples ever brought back from an asteroid." },
      { h: "Named for a rocket pioneer", t: "It honours Hideo Itokawa, the father of Japanese rocketry." },
      { h: "Solved a meteorite mystery", t: "The grains showed that S-type asteroids are the source of most meteorites that land on Earth." }
    ],
    missions: [
      ["1998", "Discovery", "Found by the LINEAR survey as 25143 Itokawa."],
      ["2005", "Hayabusa", "Arrived in September and briefly touched the surface in November, collecting dust."],
      ["2010", "Sample return", "The capsule landed in the Australian outback in June 2010."]
    ],
    anatomy: {
      eyebrow: "ITOKAWA / SURFACE FEATURES", cutaway: false, hint: "Select a feature to read about it.",
      heading: "Two lumps,", em: "one world.",
      lead: "The thin neck between the head and body is clearly visible in the model.",
      items: [
        { name: "Muses Sea", color: "#e8d9a8", depth: "A smooth plain", text: "A flat, boulder-free area where fine gravel has collected. Hayabusa touched down here." },
        { name: "The neck", color: "#ffb02e", depth: "Between the lobes", text: "The narrow join between the two halves, evidence of a gentle merger." },
        { name: "Boulder fields", color: "#9fb4e8", depth: "Across the body", text: "Giant rocks, some house-sized, sitting loose on the surface." }
      ]
    },
    model: { mesh: { id: "itokawa", color: 0xb08a66 }, surface: { kind: "cratered", preset: "itokawa", seed: 41 }, shape: { radii: [1, 0.55, 0.39], waist: 0.38, neck: 0.18, asym: 0.2, rough: 0.07, seed: 41 },
             tilt: 178, spin: 0.45, camera: 3.6, bumpScale: 0.04, roughness: 1 }
  },

  bennu: {
    order: 6, group: "asteroid", eyebrow: "ASTEROID / 06 OF 13", kicker: "BENNU / NEAR-EARTH ASTEROID",
    name: "Bennu", accent: "#a8a09a", gravity: 0.00008, gravityNote: "on average (about 1/100,000 of Earth's)",
    tagline: "A spinning-top pile of ancient carbon-rich rubble.",
    type: "Near-Earth asteroid",
    description: "A very dark, spinning-top-shaped asteroid about as tall as the Empire State Building. NASA's OSIRIS-REx collected a sample and delivered it to Earth in 2023.",
    stats: [
      ["Diameter", "About 490 m"], ["Mass", "7.3 × 10¹⁰ kg"], ["Gravity", "About 0.00008 m/s²"],
      ["Day length", "4 h 18 min"], ["Year length", "1.2 Earth years"], ["Distance from Sun", "0.9–1.4 AU"],
      ["Reflectivity", "Only ~4% of light"], ["Moons", "0"], ["Type", "B-type (carbon-rich)"]
    ],
    facts: [
      { h: "A rubble pile", t: "Bennu is a loose heap of rocks held together by gravity, with lots of empty space inside." },
      { h: "It throws pebbles", t: "OSIRIS-REx saw Bennu occasionally eject small particles into space. This is rare for an asteroid." },
      { h: "Sample delivered", t: "In September 2023 the capsule dropped over 120 g of Bennu into the Utah desert." },
      { h: "Ingredients of life", t: "The sample contains water-bearing clays, carbon compounds and amino acids, the sorts of ingredients life uses." },
      { h: "A small chance of impact", t: "Bennu has about a 1-in-2,700 chance of hitting Earth, in the year 2182. It is one of the best-tracked asteroids." }
    ],
    missions: [
      ["2016", "OSIRIS-REx launches", "NASA's sample-return spacecraft left Earth in September 2016."],
      ["2020", "Touch-and-go", "On 20 October it briefly touched the surface and grabbed a sample."],
      ["2023", "Sample returns", "The capsule landed in Utah. The spacecraft continues as OSIRIS-APEX, heading for the asteroid Apophis."]
    ],
    anatomy: {
      eyebrow: "BENNU / SURFACE FEATURES", cutaway: false, hint: "Select a feature to read about it.",
      heading: "Shaped like a", em: "spinning top.",
      lead: "Bennu's ridge around the equator formed as the asteroid sped up, flinging material outward.",
      items: [
        { name: "Equatorial ridge", color: "#e8d9a8", depth: "Around the middle", text: "A raised band formed as Bennu once spun faster and its loose material migrated outward." },
        { name: "Boulders", color: "#ffb02e", depth: "Everywhere", text: "Far more boulders than expected, with the largest, Roc Saxum, being about 50 m wide." },
        { name: "Nightingale site", color: "#9fb4e8", depth: "A crater in the north", text: "The small crater OSIRIS-REx reached to collect its sample." }
      ]
    },
    model: { mesh: { id: "bennu", color: 0x7a736c }, surface: { kind: "cratered", preset: "bennu", seed: 51 }, shape: { radii: [1, 0.95, 1], ridge: 0.11, rough: 0.05, seed: 51 },
             tilt: 177, spin: 0.6, camera: 3.4, bumpScale: 0.045, roughness: 1 }
  },

  ryugu: {
    order: 7, group: "asteroid", eyebrow: "ASTEROID / 07 OF 13", kicker: "RYUGU / NEAR-EARTH ASTEROID",
    name: "Ryugu", accent: "#9c9a9a", gravity: 0.00015, gravityNote: "on average (about 1/70,000 of Earth's)",
    tagline: "A dark diamond-shaped rock that Japan blasted a crater into.",
    type: "Near-Earth asteroid",
    description: "A black, top-shaped asteroid roughly a kilometre across. Japan's Hayabusa2 landed rovers on it, fired a copper bullet to dig a crater and brought samples home in 2020.",
    stats: [
      ["Diameter", "About 1 km"], ["Mass", "4.5 × 10¹¹ kg"], ["Gravity", "About 0.00015 m/s²"],
      ["Day length", "7 h 38 min"], ["Year length", "1.3 Earth years"], ["Distance from Sun", "0.96–1.41 AU"],
      ["Reflectivity", "Only ~4% of light"], ["Moons", "0"], ["Type", "C-type (carbon-rich)"]
    ],
    facts: [
      { h: "Named after a palace", t: "Ryugu is the undersea dragon palace in a Japanese folk tale, in which a fisherman returns with a mysterious box." },
      { h: "Hopping robots", t: "Small MINERVA-II rovers and the German-French MASCOT lander hopped across Ryugu's surface in very low gravity." },
      { h: "A man-made crater", t: "Hayabusa2 fired a copper projectile at 2 km/s to create a crater, exposing fresh material to sample." },
      { h: "Samples home", t: "About 5.4 g of rock and dust returned to Australia in December 2020." },
      { h: "Building blocks of life", t: "The sample has revealed over 20 kinds of amino acids and uracil, a building block of RNA." }
    ],
    missions: [
      ["2014", "Hayabusa2 launches", "JAXA's follow-up to the Itokawa mission left in December 2014."],
      ["2018", "Arrival", "Reached Ryugu in June 2018, and made two touchdowns in 2019."],
      ["2020", "Sample return", "The capsule landed in Woomera, Australia on 6 December 2020."]
    ],
    anatomy: {
      eyebrow: "RYUGU / SURFACE FEATURES", cutaway: false, hint: "Select a feature to read about it.",
      heading: "A diamond of", em: "dark rock.",
      lead: "Ryugu's shape and boulder-strewn surface make it look quite different from Itokawa's smooth patches.",
      items: [
        { name: "Equatorial ridge", color: "#e8d9a8", depth: "Around the middle", text: "A raised belt like Bennu's, probably built when Ryugu once spun faster." },
        { name: "Urashima crater", color: "#ffb02e", depth: "~290 m wide", text: "The biggest named crater on Ryugu, named for the fisherman of the folk tale." },
        { name: "Artificial crater", color: "#9fb4e8", depth: "~14 m wide", text: "Made by Hayabusa2's impactor in April 2019. It revealed unweathered rock beneath." }
      ]
    },
    model: { surface: { kind: "cratered", preset: "ryugu", seed: 61 }, shape: { radii: [1, 0.95, 1], ridge: 0.15, rough: 0.07, seed: 61 },
             tilt: 172, spin: 0.5, camera: 3.4, bumpScale: 0.045, roughness: 1 }
  },

  /* ---- More asteroids with real NASA/JPL radar & spacecraft shape models (v0.5) ---- */
  toutatis: {
    order: 8, group: "asteroid", eyebrow: "ASTEROID / 08 OF 13", kicker: "TOUTATIS / NEAR-EARTH ASTEROID",
    name: "Toutatis", accent: "#c8b79e", gravity: null,
    tagline: "A tumbling, two-lobed rock that wobbles instead of spinning.",
    type: "Near-Earth asteroid (Apollo)",
    description: "A 4.6 km-long stony asteroid that tumbles chaotically as it orbits, passing near Earth every four years. China's Chang'e 2 probe photographed it up close.",
    stats: [
      ["Size", "4.6 × 2.3 × 1.9 km (model)"], ["Rotation", "Tumbling: ~5.4 d and ~7.3 d cycles"], ["Year length", "About 4 Earth years"],
      ["Distance from Sun", "0.9–4.1 AU"], ["Type", "S-type (stony)"], ["Discovered", "1989"], ["Moons", "0"]
    ],
    facts: [
      { h: "It tumbles", t: "Toutatis doesn't spin about one fixed axis. It wobbles and tumbles, so it has no simple 'day'. Its motion repeats only every few days." },
      { h: "A regular visitor", t: "It comes close to Earth every four years. On 12 December 2012 it passed about 7 million km away, roughly 18 times the Moon's distance." },
      { h: "Two lobes", t: "Close-ups show a larger 'body' and smaller 'head' joined by a neck, a sign that two rocks gently merged long ago." },
      { h: "Named for a god", t: "It is named for Toutatis, a Celtic god, a name many people know from the Asterix comics." },
      { h: "Tracked, not a threat", t: "Because its orbit crosses Earth's, astronomers track it carefully. There is no known impact risk." }
    ],
    missions: [
      ["1989", "Discovery", "Found by the French astronomer Christian Pollas."],
      ["1992", "Radar images", "Radar echoes revealed its odd shape and tumbling motion."],
      ["2012", "Chang'e 2", "The Chinese probe flew within about 3 km on 13 December 2012 and returned close-up images."]
    ],
    anatomy: {
      eyebrow: "TOUTATIS / FEATURES", cutaway: false, hint: "Select a feature to read about it.", heading: "Two rocks,", em: "one tumbling body.",
      lead: "This is a real shape model built from radar data. Watch how the lobes rotate around each other.",
      items: [
        { name: "The 'head'", color: "#e8d9a8", depth: "Smaller lobe", text: "The smaller of the two lobes, joined to the body by a narrow neck." },
        { name: "The neck", color: "#ffb02e", depth: "Between the lobes", text: "A narrowing where the two pieces touch. It is a sign that Toutatis is a contact binary." },
        { name: "Tumbling motion", color: "#9fb4e8", depth: "Non-principal-axis spin", text: "Two overlapping rotations make Toutatis wobble. It is one of the best-studied tumblers." }
      ]
    },
    model: { mesh: { id: "toutatis", color: 0xa89a88 }, surface: { kind: "cratered", preset: "eros", seed: 71 }, shape: { radii: [1, 0.5, 0.42], waist: 0.25, neck: -0.1, asym: 0.2, rough: 0.07, seed: 71 },
             tilt: 40, spin: 0.35, camera: 3.6, bumpScale: 0.035, roughness: 1 }
  },

  kleopatra: {
    order: 9, group: "asteroid", eyebrow: "ASTEROID / 09 OF 13", kicker: "KLEOPATRA / MAIN-BELT ASTEROID",
    name: "Kleopatra", accent: "#bfc4cf", gravity: null,
    tagline: "A metal-rich dog bone with two tiny moons.",
    type: "Main-belt asteroid (M-type)",
    description: "One of the strangest shapes in the Solar System: a dog-bone about 217 km long, likely rich in metal. Two small moons circle it.",
    stats: [
      ["Size", "About 217 × 94 × 81 km (radar model)"], ["Rotation", "5 h 23 min"], ["Year length", "4.7 Earth years"],
      ["Distance from Sun", "2.1–3.5 AU"], ["Density", "About 3.5 g/cm³"], ["Type", "M-type (metallic)"], ["Discovered", "1880"], ["Moons", "2 (AlexHelios, CleoSelene)"]
    ],
    facts: [
      { h: "A dog bone in space", t: "Radar images in 2000 showed two big lobes joined by a thin neck, one of the most unusual shapes ever seen." },
      { h: "Metal-rich", t: "Its density and radar reflection suggest a large share of metal, with plenty of empty space inside (a rubble pile)." },
      { h: "Cleopatra's children", t: "Its moons, AlexHelios and CleoSelene, are named after Cleopatra's twin children, Alexander Helios and Cleopatra Selene." },
      { h: "Spinning fast", t: "It rotates every 5.4 hours, close to the speed at which loose material at its ends would be flung off." },
      { h: "How did it form?", t: "It may be a rubble pile re-formed after a giant impact, with its moons made from debris thrown off by its fast spin." }
    ],
    missions: [
      ["1880", "Discovery", "Johann Palisa found it from the observatory in Pola, then in Austria-Hungary."],
      ["2000", "Radar images", "The Arecibo radar telescope revealed the dog-bone shape."],
      ["2008", "Moons discovered", "Astronomers found two small moons using large telescopes with adaptive optics."]
    ],
    anatomy: {
      eyebrow: "KLEOPATRA / FEATURES", cutaway: false, hint: "Select a feature to read about it.", heading: "A shape that", em: "shouldn't last.",
      lead: "The model's moons orbit in a plane around the dog bone's middle. Use the Moons toggle to hide them.",
      items: [
        { name: "The two lobes", color: "#e8d9a8", depth: "Each ~90 km wide", text: "Two large, rounded ends joined by a narrow waist." },
        { name: "The neck", color: "#ffb02e", depth: "~50 km wide", text: "The narrowest part, where the asteroid is most likely to have been squeezed together." },
        { name: "AlexHelios & CleoSelene", color: "#9fb4e8", depth: "Moons ~9 km and ~7 km", text: "Tiny moons that orbit the middle of the dog bone." }
      ]
    },
    model: { mesh: { id: "kleopatra", color: 0xa7a8ac }, surface: { kind: "cratered", preset: "mercury", seed: 81 }, shape: { radii: [1, 0.43, 0.37], waist: 0.55, rough: 0.05, seed: 81 },
             tilt: 15, spin: 0.5, camera: 7.2, bumpScale: 0.035, roughness: 0.85, moonFrame: "equator",
             moons: [{ name: "AlexHelios", size: 0.07, distance: 3.0, period: 16, color: 0xb5b7bf }, { name: "CleoSelene", size: 0.055, distance: 4.4, period: 32, color: 0xa4a7b0 }] }
  },

  geographos: {
    order: 10, group: "asteroid", eyebrow: "ASTEROID / 10 OF 13", kicker: "GEOGRAPHOS / NEAR-EARTH ASTEROID",
    name: "Geographos", accent: "#c9b99f", gravity: null,
    tagline: "One of the most elongated objects in the Solar System.",
    type: "Near-Earth asteroid (Apollo)",
    description: "A stony asteroid stretched like a cigar, more than twice as long as it is wide. Sunlight is slowly spinning it faster.",
    stats: [
      ["Size", "5.1 × 2.4 × 2.0 km (model)"], ["Rotation", "5 h 13 min"], ["Year length", "1.4 Earth years"],
      ["Distance from Sun", "0.83–1.66 AU"], ["Type", "S-type (stony)"], ["Discovered", "1951"], ["Moons", "0"]
    ],
    facts: [
      { h: "A cigar in space", t: "It is more than twice as long as it is wide, among the most elongated Solar System bodies measured." },
      { h: "Spun up by sunlight", t: "Astronomers measured its spin getting faster, driven by the YORP effect: uneven heating and re-radiation by the surface gently torques the asteroid." },
      { h: "Named for a society", t: "It honours the National Geographic Society, which funded the sky survey that found it." },
      { h: "A known neighbour", t: "Its orbit crosses Earth's, so it is classed as potentially hazardous and monitored, but there is no known impact threat." },
      { h: "Stony and common", t: "Like most near-Earth asteroids it is an S-type, made of silicate rock mixed with some metal." }
    ],
    missions: [
      ["1951", "Discovery", "Albert Wilson and Rudolph Minkowski found it at Palomar Observatory."],
      ["1994", "Clementine", "The Clementine probe was meant to fly past, but a malfunction ended the plan. Radar observed it instead."],
      ["2008", "YORP detected", "Measurements showed its spin was gradually speeding up."]
    ],
    anatomy: {
      eyebrow: "GEOGRAPHOS / FEATURES", cutaway: false, hint: "Select a feature to read about it.", heading: "Long, narrow and", em: "spinning up.",
      lead: "This radar-based model shows the long, slightly lumpy form.",
      items: [
        { name: "The long axis", color: "#e8d9a8", depth: "5.1 km end to end", text: "The body is stretched along one direction, like a cigar." },
        { name: "The 'neck' region", color: "#ffb02e", depth: "Near the middle", text: "A slight narrowing along the length, hinting at how the object may have formed." },
        { name: "YORP effect", color: "#9fb4e8", depth: "Sunlight torque", text: "Heat re-radiated unevenly from the surface gives a tiny push that speeds up the spin." }
      ]
    },
    model: { mesh: { id: "geographos", color: 0xa89c8c }, surface: { kind: "cratered", preset: "eros", seed: 91 }, shape: { radii: [1, 0.47, 0.39], waist: 0.12, rough: 0.06, seed: 91 },
             tilt: 55, spin: 0.55, camera: 3.6, bumpScale: 0.035, roughness: 1 }
  },

  golevka: {
    order: 11, group: "asteroid", eyebrow: "ASTEROID / 11 OF 13", kicker: "GOLEVKA / NEAR-EARTH ASTEROID",
    name: "Golevka", accent: "#c9b196", gravity: null,
    tagline: "The small rock whose orbit was nudged by sunlight.",
    type: "Near-Earth asteroid (Apollo)",
    description: "A lumpy asteroid about half a kilometre across. Radar tracking showed its path being pushed by sunlight, the first time this effect was measured for an asteroid.",
    stats: [
      ["Size", "About half a kilometre"], ["Rotation", "About 6 hours"], ["Year length", "About 4 Earth years"],
      ["Distance from Sun", "1.0–4.0 AU"], ["Type", "Stony"], ["Discovered", "1991"], ["Moons", "0"]
    ],
    facts: [
      { h: "A name from three radars", t: "Golevka combines the first letters of the radar stations that observed it in 1995: Goldstone (USA), Evpatoria (Ukraine) and Kashima (Japan)." },
      { h: "Pushed by sunlight", t: "Heat re-emitted by Golevka as it spins gives it a tiny thrust, called the Yarkovsky effect. Radar showed its orbit had moved about 15 km in 12 years." },
      { h: "A far-reaching orbit", t: "It swings from near Earth's orbit out beyond the main asteroid belt, to about 4 AU." },
      { h: "Radar-built shape", t: "Its irregular form was reconstructed from radar echoes collected during a close pass." }
    ],
    missions: [
      ["1991", "Discovery", "Found at Palomar Observatory."],
      ["1995", "Radar campaign", "Three radar telescopes observed it as it passed close to Earth."],
      ["2003", "Yarkovsky measured", "Scientists reported that sunlight had measurably changed its orbit."]
    ],
    anatomy: {
      eyebrow: "GOLEVKA / FEATURES", cutaway: false, hint: "Select a feature to read about it.", heading: "A small rock with", em: "big lessons.",
      lead: "Golevka is a rubble-pile-like body whose radar tracking taught us how sunlight shapes asteroid orbits.",
      items: [
        { name: "Irregular body", color: "#e8d9a8", depth: "Lumpy outline", text: "No simple geometric shape: ridges and hollows from radar-derived modelling." },
        { name: "Yarkovsky effect", color: "#ffb02e", depth: "Sunlight thrust", text: "The sunlit side warms, then radiates that heat later as the asteroid rotates, giving a faint push." },
        { name: "Radar target", color: "#9fb4e8", depth: "Observed in 1995", text: "Radio waves bounced off Golevka and back, mapping its shape and measuring its distance precisely." }
      ]
    },
    model: { mesh: { id: "golevka", color: 0xa89580 }, surface: { kind: "cratered", preset: "itokawa", seed: 101 }, shape: { radii: [1, 0.83, 0.74], rough: 0.09, seed: 101 },
             tilt: 30, spin: 0.5, camera: 3.4, bumpScale: 0.04, roughness: 1 }
  },

  mithra: {
    order: 12, group: "asteroid", eyebrow: "ASTEROID / 12 OF 13", kicker: "MITHRA / NEAR-EARTH ASTEROID",
    name: "Mithra", accent: "#c4bbae", gravity: null,
    tagline: "A bow-tie shaped asteroid mapped by radar.",
    type: "Near-Earth asteroid (Apollo)",
    description: "A lumpy two-lobed asteroid a few kilometres across whose bow-tie shape was reconstructed from radar echoes. No spacecraft has visited it.",
    stats: [
      ["Size", "About 3.4 × 2.4 × 2.0 km (model)"], ["Class", "Apollo near-Earth asteroid"], ["Discovered", "1987"], ["Moons", "0"]
    ],
    facts: [
      { h: "Bow-tie shaped", t: "Two broad lobes meet at a pinched waist, a form common among small near-Earth asteroids." },
      { h: "Seen with radio waves", t: "Radar astronomers send powerful radio signals at passing asteroids and turn the returning echoes into 3D shape models like this one." },
      { h: "Named for a god", t: "It is named for Mithra, an ancient Persian god of light and contracts." },
      { h: "An Earth-crossing orbit", t: "As an Apollo-class asteroid it crosses Earth's orbit, so it is regularly tracked by planetary-defence surveys." }
    ],
    missions: [
      ["1987", "Discovery", "Found during a survey for Earth-approaching asteroids."],
      ["Radar", "Shape from echoes", "Its shape was reconstructed from radar observations."],
      ["Today", "Tracked", "Its orbit is monitored as part of planetary-defence efforts."]
    ],
    anatomy: {
      eyebrow: "MITHRA / FEATURES", cutaway: false, hint: "Select a feature to read about it.", heading: "Two lobes and a", em: "pinched waist.",
      lead: "A classic contact-binary-like form, as built from radar data.",
      items: [
        { name: "The lobes", color: "#e8d9a8", depth: "Two broad ends", text: "Two bulging halves, possibly once separate bodies." },
        { name: "The waist", color: "#ffb02e", depth: "Middle", text: "The pinched region where the lobes meet." },
        { name: "Radar model", color: "#9fb4e8", depth: "How we know", text: "The shape comes from analysing radio echoes at many angles." }
      ]
    },
    model: { mesh: { id: "mithra", color: 0xa09a92 }, surface: { kind: "cratered", preset: "eros", seed: 111 }, shape: { radii: [1, 0.7, 0.6], waist: 0.3, rough: 0.07, seed: 111 },
             tilt: 35, spin: 0.45, camera: 3.5, bumpScale: 0.035, roughness: 1 }
  },

  hw1: {
    order: 13, group: "asteroid", eyebrow: "ASTEROID / 13 OF 13", kicker: "1996 HW1 / NEAR-EARTH ASTEROID",
    name: "1996 HW1", accent: "#b9b2a8", gravity: null,
    tagline: "A contact binary: two rocks stuck together.",
    type: "Near-Earth asteroid (Apollo)",
    description: "An elongated asteroid made of two distinct lobes touching each other. Radar observations in 2008 revealed its shape.",
    stats: [
      ["Size", "About 3.8 × 1.7 × 1.5 km (model)"], ["Rotation", "About 8 h 45 min"], ["Class", "Apollo near-Earth asteroid"], ["Shape", "Contact binary"], ["Moons", "0"]
    ],
    facts: [
      { h: "Two rocks, one asteroid", t: "A large lobe and a smaller lobe touch at a narrow neck, a form scientists call a contact binary." },
      { h: "A common design", t: "Perhaps one in six near-Earth asteroids larger than a few hundred metres are contact binaries." },
      { h: "Seen by radar", t: "Radar observations in 2008 produced the images that revealed its two lobes." },
      { h: "A name that's a date", t: "'1996 HW1' is its provisional designation: it was discovered in 1996 (the 'H' means second half of April)." }
    ],
    missions: [
      ["1996", "Discovery", "Found and given the provisional name 1996 HW1."],
      ["2008", "Radar images", "Radar telescopes revealed its two-lobed shape and spin."],
      ["Today", "Tracked", "Monitored as an Earth-crossing Apollo asteroid."]
    ],
    anatomy: {
      eyebrow: "1996 HW1 / FEATURES", cutaway: false, hint: "Select a feature to read about it.", heading: "Two bodies,", em: "gently joined.",
      lead: "Contact binaries probably formed when two pieces drifted together at low speed, or when one body split and re-merged.",
      items: [
        { name: "Large lobe", color: "#e8d9a8", depth: "The bigger end", text: "Holds most of the asteroid's mass." },
        { name: "Small lobe", color: "#ffb02e", depth: "The smaller end", text: "A rounder, smaller piece attached at the narrow neck." },
        { name: "The neck", color: "#9fb4e8", depth: "Where they touch", text: "The thin contact region holding the two together by their faint gravity." }
      ]
    },
    model: { mesh: { id: "hw1", color: 0x9a9490 }, surface: { kind: "cratered", preset: "eros", seed: 121 }, shape: { radii: [1, 0.44, 0.4], waist: 0.5, neck: -0.25, asym: -0.15, rough: 0.06, seed: 121 },
             tilt: 50, spin: 0.5, camera: 3.6, bumpScale: 0.035, roughness: 1 }
  },

  /* =====================================================================
     STARS (v0.5)  – self-lit (model.emissive), with a corona shell.
     ===================================================================== */
  sun: {
    order: 1, group: "star", eyebrow: "OUR STAR / 01 OF 03", kicker: "THE SUN / G-TYPE STAR",
    name: "The Sun", accent: "#ffb74d", gravity: 274, gravityNote: "at the Sun's visible surface (if you could stand there!)",
    tagline: "The star that powers everything.",
    type: "Yellow dwarf star (G2V)",
    description: "A ball of hydrogen and helium, so large that over a million Earths would fit inside. Fusion in its core makes the light and heat that sustain life on Earth.",
    stats: [
      ["Diameter", "1,392,700 km"], ["Mass", "1.99 × 10³⁰ kg"], ["Surface gravity", "274 m/s²"],
      ["Rotation", "~25 days (equator)"], ["Age", "4.6 billion years"], ["Distance from Earth", "149.6 million km"],
      ["Surface temperature", "5,500 °C"], ["Core temperature", "15 million °C"], ["Planets", "8"]
    ],
    facts: [
      { h: "99.86% of everything", t: "The Sun holds nearly all the mass of the Solar System. Jupiter is most of what's left." },
      { h: "Old light", t: "Sunlight takes about 8 minutes 20 seconds to reach Earth, but thousands of years to escape the Sun's interior." },
      { h: "A hydrogen furnace", t: "Every second the Sun fuses roughly 600 million tonnes of hydrogen into helium." },
      { h: "A hotter atmosphere", t: "The corona is millions of degrees, far hotter than the surface below it. Why is still being studied." },
      { h: "An 11-year cycle", t: "Sunspots and solar storms rise and fall on a cycle of about 11 years." }
    ],
    missions: [
      ["1995", "SOHO", "A joint ESA/NASA observatory that has watched the Sun almost continuously."],
      ["2018", "Parker Solar Probe", "The first spacecraft to fly through the corona, now the fastest human-made object."],
      ["2020", "Solar Orbiter", "Takes the first images of the Sun's poles from a tilted orbit."]
    ],
    anatomy: {
      eyebrow: "THE SUN / INTERNAL STRUCTURE", cutaway: true, heading: "A star in", em: "layers.",
      lead: "Energy takes a long journey from the core to the surface. The photosphere is drawn much thicker than reality (about 500 km).",
      items: [
        { name: "Photosphere",     to: 0.96, color: "#ffd24a", depth: "Visible surface, ~5,500 °C", text: "The thin layer that gives off the light we see. Sunspots and granules appear here." },
        { name: "Convection zone", to: 0.7,  color: "#ff8c2e", depth: "Outer 30% (~200,000 km)",    text: "Hot gas rises, cools and sinks like boiling water, carrying energy outward." },
        { name: "Radiative zone",  to: 0.25, color: "#d94a2a", depth: "25–70% of the radius",       text: "Energy crawls through as light, bouncing around for tens of thousands of years." },
        { name: "Core",            to: 0,    color: "#fff6c8", depth: "Inner 25%, ~15 million °C",  text: "The fusion engine, where hydrogen turns into helium." }
      ]
    },
    model: { surface: { kind: "star", seed: 5, spots: 1, hot: [255, 238, 170], mid: [255, 192, 72], cool: [232, 124, 34], cells: 15, mottle: 0.45 }, emissive: true, tilt: 7.25, spin: 0.08, camera: 4.6, roughness: 1,
             atmosphere: { color: 0xffa33a, halo: 1.55, haloPower: 1.5, haloGain: 1.5, rimGain: 0, flat: true, limbDark: true } }
  },

  sirius: {
    order: 2, group: "star", eyebrow: "BRIGHT STAR / 02 OF 03", kicker: "SIRIUS A & B / BINARY STAR",
    name: "Sirius", accent: "#a8c8ff", gravity: 193, gravityNote: "at Sirius A's visible surface (if you could stand there!)",
    tagline: "The brightest star in the night sky, with a hidden companion.",
    type: "White main-sequence star (A1V) + white dwarf",
    description: "The 'Dog Star' is only 8.6 light-years away, twice as massive as the Sun and about 25 times brighter. Orbiting it is Sirius B, a white dwarf the size of Earth.",
    stats: [
      ["Diameter (Sirius A)", "2.4 million km"], ["Mass (A)", "2.06 Suns"], ["Brightness", "25 × the Sun"],
      ["Surface temperature", "~9,600 °C"], ["Age", "~240 million years"], ["Distance", "8.6 light-years"],
      ["Apparent magnitude", "−1.46"], ["Companion", "Sirius B (white dwarf)"], ["Companion orbit", "50 years"]
    ],
    facts: [
      { h: "Brightest night star", t: "Sirius outshines every other star in our sky, thanks to being both luminous and very close." },
      { h: "A dead star next door", t: "Sirius B is a white dwarf holding about a Sun's mass in a ball only slightly bigger than Earth." },
      { h: "Dog days", t: "Ancient Romans blamed Sirius's rising alongside the Sun for the hottest days of summer." },
      { h: "Egypt's calendar star", t: "Its first dawn appearance each year signalled the Nile's flood to the ancient Egyptians." },
      { h: "Twinkling in colour", t: "Low on the horizon Sirius flashes red and blue because our atmosphere bends its light." }
    ],
    missions: [
      ["1844", "Wobble noticed", "Friedrich Bessel saw Sirius wobble and deduced an unseen companion."],
      ["1862", "Sirius B seen", "Alvan Graham Clark spotted the faint white dwarf while testing a new telescope."],
      ["Today", "Hubble", "Space telescopes separate the pair's glare to measure their orbits."]
    ],
    anatomy: {
      eyebrow: "SIRIUS A / INTERNAL STRUCTURE", cutaway: true, heading: "A hot star,", em: "inside out.",
      lead: "Unlike the Sun, a star like Sirius A has a churning core and a calm outer envelope. Layer sizes are approximate.",
      items: [
        { name: "Outer layers",    to: 0.9,  color: "#cfe0ff", depth: "Outer ~10%",      text: "A thin, hot atmosphere with a shallow convective layer." },
        { name: "Radiative zone",  to: 0.2,  color: "#6f95ff", depth: "20–90% of radius", text: "Energy streams outward as light through the middle of the star." },
        { name: "Convective core", to: 0,    color: "#ffffff", depth: "Inner ~20%",       text: "Fusion is so intense that the core boils, mixing the fuel." }
      ]
    },
    model: { surface: { kind: "star", seed: 8, hot: [255, 255, 255], mid: [214, 228, 255], cool: [160, 188, 245], cells: 16, mottle: 0.3 }, emissive: true, tilt: 20, spin: 0.2, camera: 5.6, roughness: 1,
             atmosphere: { color: 0x9cc2ff, halo: 1.6, haloPower: 1.4, haloGain: 1.7, rimGain: 0, flat: true, limbDark: true },
             moonFrame: "equator",
             moons: [{ name: "Sirius B", size: 0.1, distance: 3.4, period: 24, emissive: true, color: 0xeaf2ff }] }
  },

  betelgeuse: {
    order: 3, group: "star", eyebrow: "BRIGHT STAR / 03 OF 03", kicker: "BETELGEUSE / RED SUPERGIANT",
    name: "Betelgeuse", accent: "#ff7a45", gravity: 0.008, gravityNote: "at its fluffy visible surface (if you could stand there!)",
    tagline: "A red supergiant big enough to swallow the inner Solar System.",
    type: "Red supergiant (M1–2 Ia)",
    description: "The shoulder of Orion. If you swapped it for the Sun, its surface would reach past Mars and into the asteroid belt. It is nearing the end of its life.",
    stats: [
      ["Diameter", "~1.1 billion km"], ["Mass", "16–19 Suns"], ["Brightness", "~100,000 × the Sun"],
      ["Surface temperature", "~3,300 °C"], ["Age", "~10 million years"], ["Distance", "~550 light-years"],
      ["Apparent magnitude", "0.0 to 1.6 (variable)"], ["Pulsation", "~400 days"], ["Fate", "Supernova"]
    ],
    facts: [
      { h: "Swallows Mars", t: "Placed where the Sun is, Betelgeuse would engulf Mercury, Venus, Earth and Mars and reach the asteroid belt." },
      { h: "The Great Dimming", t: "In 2019–2020 it faded dramatically. A cloud of dust from a huge outburst was the likely cause." },
      { h: "A future supernova", t: "It will explode someday, perhaps within 100,000 years, and shine as bright as a half Moon, even in daytime." },
      { h: "Very low density", t: "Its outer layers are thinner than air, so the star is a vast, fluffy glow around a tiny core." },
      { h: "The first star imaged as a disk", t: "In the 1990s Hubble resolved Betelgeuse as a disk, the first star other than the Sun to be seen that way." }
    ],
    missions: [
      ["1995", "Hubble image", "The first direct image of a star's surface beyond the Sun."],
      ["2019", "Great Dimming", "Telescopes worldwide watched it fade by about 60% in brightness."],
      ["Today", "Watching for a blast", "Neutrino detectors and telescopes are poised in case it ever explodes."]
    ],
    anatomy: {
      eyebrow: "BETELGEUSE / INTERNAL STRUCTURE", cutaway: true, heading: "A giant shell around a", em: "tiny core.",
      lead: "The core is far smaller than drawn here, a few percent of the star at most. It is enlarged so you can see it.",
      items: [
        { name: "Convective envelope", to: 0.35, color: "#ff9b5a", depth: "Most of the star", text: "Giant bubbles of gas, each larger than the Sun, churn through this huge, thin layer." },
        { name: "Burning shells",      to: 0.12, color: "#ffd24a", depth: "Around the core", text: "Hydrogen and helium fuse in thin layers surrounding the heart of the star." },
        { name: "Core",                to: 0,    color: "#ffffff", depth: "Centre",        text: "Fusing helium and heavier elements. When it runs out of fuel, the star will collapse and explode." }
      ]
    },
    model: { surface: { kind: "star", seed: 12, hot: [255, 182, 96], mid: [232, 98, 34], cool: [120, 28, 10], cells: 3.2, mottle: 1.5 }, emissive: true, tilt: 20, spin: 0.04, camera: 5.2, roughness: 1,
             atmosphere: { color: 0xff6a2a, halo: 1.5, haloPower: 1.7, haloGain: 1.2, rimGain: 0, flat: true, limbDark: true } }
  }

};
