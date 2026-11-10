/* ==========================================================================
   ORBIT — sky-data.js  (DATA ONLY: real stars and constellation figures)
   --------------------------------------------------------------------------
   HOW A STAR IS DESCRIBED
   Astronomers give every star a position on the "celestial sphere", the
   imaginary sphere of sky around Earth, with two numbers (like longitude and
   latitude):
     RA  (right ascension) in HOURS, 0–24. One hour = 15 degrees around the sky.
     DEC (declination) in DEGREES, −90 (south pole) to +90 (north pole).
   Positions below are J2000 coordinates, accurate to well under a degree.

   Each star row is:  id: [ name, RA hours, DEC degrees, apparent magnitude,
                            spectral class, distance in light-years (0 = unknown) ]
     • Apparent magnitude is a brightness scale where SMALLER means BRIGHTER.
       Sirius is −1.46, the faintest stars you can see unaided are about +6.
     • Spectral class is the star's colour/temperature: O B A F G K M, from
       hottest (blue) to coolest (red). The Sun is a G star.

   HOW A CONSTELLATION IS DESCRIBED
   "stars" lists star ids; "lines" lists pairs of ids to join with a line (the
   traditional stick figure). The figures are simplified. They're a way to
   learn the sky, not official boundaries.
   ========================================================================== */
"use strict";

const SKY = {

  stars: {
    // ---- Orion
    betelgeuse: ["Betelgeuse", 5.919, 7.407, 0.42, "M", 550],
    rigel:      ["Rigel", 5.242, -8.202, 0.13, "B", 860],
    bellatrix:  ["Bellatrix", 5.419, 6.350, 1.64, "B", 250],
    saiph:      ["Saiph", 5.796, -9.670, 2.09, "B", 650],
    alnitak:    ["Alnitak", 5.679, -1.943, 1.77, "O", 1260],
    alnilam:    ["Alnilam", 5.603, -1.202, 1.69, "B", 2000],
    mintaka:    ["Mintaka", 5.533, -0.299, 2.23, "O", 1200],
    meissa:     ["Meissa", 5.585, 9.934, 3.54, "O", 1100],
    // ---- Ursa Major (the Big Dipper is its brightest part)
    dubhe:  ["Dubhe", 11.062, 61.751, 1.79, "K", 123],
    merak:  ["Merak", 11.031, 56.382, 2.37, "A", 79],
    phecda: ["Phecda", 11.897, 53.695, 2.44, "A", 84],
    megrez: ["Megrez", 12.257, 57.033, 3.31, "A", 81],
    alioth: ["Alioth", 12.900, 55.960, 1.77, "A", 83],
    mizar:  ["Mizar", 13.399, 54.925, 2.04, "A", 83],
    alkaid: ["Alkaid", 13.792, 49.313, 1.86, "B", 104],
    // ---- Ursa Minor (the Little Bear, home of the North Star)
    polaris:  ["Polaris", 2.530, 89.264, 1.98, "F", 430],
    kochab:   ["Kochab", 14.845, 74.156, 2.08, "K", 130],
    pherkad:  ["Pherkad", 15.345, 71.834, 3.00, "A", 480],
    yildun:   ["Yildun", 17.537, 86.586, 4.36, "A", 183],
    eps_umi:  ["Epsilon Ursae Minoris", 16.766, 82.037, 4.20, "G", 347],
    zeta_umi: ["Zeta Ursae Minoris", 15.734, 77.795, 4.30, "A", 380],
    eta_umi:  ["Eta Ursae Minoris", 16.292, 75.755, 4.95, "F", 97],
    // ---- Cassiopeia
    schedar: ["Schedar", 0.675, 56.537, 2.24, "K", 228],
    caph:    ["Caph", 0.153, 59.150, 2.28, "F", 54],
    navi:    ["Navi (Gamma Cassiopeiae)", 0.945, 60.717, 2.47, "B", 550],
    ruchbah: ["Ruchbah", 1.430, 60.235, 2.68, "A", 99],
    segin:   ["Segin", 1.907, 63.670, 3.38, "B", 440],
    // ---- Cygnus
    deneb:   ["Deneb", 20.690, 45.280, 1.25, "A", 2600],
    sadr:    ["Sadr", 20.370, 40.257, 2.23, "F", 1800],
    albireo: ["Albireo", 19.512, 27.960, 3.18, "K", 430],
    gienah:  ["Gienah", 20.770, 33.970, 2.46, "K", 72],
    fawaris: ["Fawaris", 19.750, 45.131, 2.87, "B", 165],
    // ---- Lyra
    vega:      ["Vega", 18.615, 38.784, 0.03, "A", 25],
    sheliak:   ["Sheliak", 18.835, 33.363, 3.52, "B", 960],
    sulafat:   ["Sulafat", 18.982, 32.690, 3.25, "B", 620],
    delta2_lyr:["Delta² Lyrae", 18.908, 36.899, 4.22, "M", 900],
    zeta1_lyr: ["Zeta¹ Lyrae", 18.746, 37.605, 4.36, "A", 150],
    // ---- Scorpius
    antares:   ["Antares", 16.490, -26.432, 1.06, "M", 550],
    graffias:  ["Graffias", 16.090, -19.805, 2.62, "B", 550],
    dschubba:  ["Dschubba", 16.005, -22.622, 2.32, "B", 400],
    pi_sco:    ["Pi Scorpii", 15.981, -26.114, 2.89, "B", 460],
    sigma_sco: ["Sigma Scorpii", 16.353, -25.593, 2.90, "B", 570],
    tau_sco:   ["Tau Scorpii", 16.598, -28.216, 2.82, "B", 470],
    eps_sco:   ["Epsilon Scorpii", 16.836, -34.293, 2.29, "K", 65],
    mu1_sco:   ["Mu¹ Scorpii", 16.865, -38.047, 3.00, "B", 500],
    shaula:    ["Shaula", 17.560, -37.104, 1.63, "B", 570],
    sargas:    ["Sargas", 17.622, -42.998, 1.87, "F", 270],
    iota1_sco: ["Iota¹ Scorpii", 17.793, -40.127, 3.03, "F", 1900],
    kappa_sco: ["Kappa Scorpii", 17.708, -39.030, 2.41, "B", 480],
    // ---- Leo
    regulus:  ["Regulus", 10.140, 11.967, 1.35, "B", 79],
    denebola: ["Denebola", 11.818, 14.572, 2.14, "A", 36],
    algieba:  ["Algieba", 10.333, 19.842, 2.08, "K", 130],
    zosma:    ["Zosma", 11.235, 20.524, 2.56, "A", 58],
    adhafera: ["Adhafera", 10.278, 23.417, 3.44, "F", 274],
    rasalas:  ["Rasalas", 9.879, 26.007, 3.88, "K", 133],
    algenubi: ["Algenubi", 9.764, 23.774, 2.98, "G", 247],
    chertan:  ["Chertan", 11.237, 15.430, 3.33, "A", 165],
    // ---- Crux (the Southern Cross)
    acrux:  ["Acrux", 12.443, -63.099, 0.76, "B", 320],
    mimosa: ["Mimosa", 12.795, -59.689, 1.25, "B", 280],
    gacrux: ["Gacrux", 12.519, -57.113, 1.64, "M", 88],
    imai:   ["Imai", 12.252, -58.749, 2.79, "B", 345],
    // ---- Taurus
    aldebaran: ["Aldebaran", 4.599, 16.509, 0.86, "K", 65],
    elnath:    ["Elnath", 5.438, 28.608, 1.65, "B", 130],
    tianguan:  ["Tianguan", 5.627, 21.143, 3.00, "B", 440],
    alcyone:   ["Alcyone (Pleiades)", 3.791, 24.105, 2.87, "B", 440],
    gamma_tau: ["Gamma Tauri", 4.330, 15.628, 3.65, "G", 154],
    theta2_tau:["Theta² Tauri", 4.478, 15.871, 3.40, "A", 150],
    lambda_tau:["Lambda Tauri", 4.011, 12.490, 3.47, "B", 370],
    // ---- Other famous bright stars (no stick figure here)
    sirius:    ["Sirius", 6.752, -16.716, -1.46, "A", 8.6],
    canopus:   ["Canopus", 6.399, -52.696, -0.74, "F", 310],
    arcturus:  ["Arcturus", 14.261, 19.182, -0.05, "K", 37],
    rigil_kent:["Rigil Kentaurus (Alpha Centauri)", 14.660, -60.834, -0.27, "G", 4.37],
    capella:   ["Capella", 5.278, 45.998, 0.08, "G", 43],
    procyon:   ["Procyon", 7.655, 5.225, 0.34, "F", 11.5],
    altair:    ["Altair", 19.846, 8.868, 0.76, "A", 16.7],
    spica:     ["Spica", 13.420, -11.161, 0.97, "B", 250],
    pollux:    ["Pollux", 7.755, 28.026, 1.14, "K", 34],
    castor:    ["Castor", 7.577, 31.888, 1.58, "A", 51],
    fomalhaut: ["Fomalhaut", 22.961, -29.622, 1.16, "A", 25]
  },

  // One short fact for the stars worth a story. (Shown when you select the star.)
  notes: {
    betelgeuse: "A red supergiant hundreds of times wider than the Sun. It pulses, so its brightness changes, and it will end its life as a supernova someday.",
    rigel: "A blue-white supergiant about 120,000 times more luminous than the Sun.",
    bellatrix: "A hot blue giant marking one of Orion's shoulders. Its name means 'female warrior'.",
    alnilam: "The middle star of Orion's Belt: a blue supergiant shining hundreds of thousands of times brighter than the Sun.",
    alnitak: "The left-hand star of Orion's Belt, next to the Flame and Horsehead nebulae.",
    meissa: "Marks Orion's head.",
    dubhe: "One of the 'Pointer' stars. A line from Merak through Dubhe points towards Polaris.",
    mizar: "Looks like one star, but a sharp-eyed person can see its companion Alcor. It was the first double star found with a telescope.",
    alkaid: "The end of the Big Dipper's handle, a hot blue star.",
    polaris: "The North Star sits almost exactly above Earth's north pole, so it hardly moves as the sky turns. It pulses in brightness, a type called a Cepheid variable.",
    kochab: "An orange giant, one of the two 'Guardians of the Pole'.",
    schedar: "An orange giant and the brightest star in Cassiopeia.",
    caph: "Marks one tip of Cassiopeia's W shape.",
    navi: "A variable star that has flared in brightness several times in history.",
    deneb: "One of the most luminous stars known, roughly 200,000 times brighter than the Sun, yet so far away that it looks only moderately bright.",
    sadr: "The centre of the Northern Cross, a yellow-white supergiant.",
    albireo: "A beautiful double star: through a small telescope it splits into one golden and one blue star.",
    vega: "The fifth-brightest star in the sky, 25 light-years away. It spins so fast it bulges, and it's ringed by a disk of dust.",
    antares: "A red supergiant so big it would reach beyond the orbit of Mars. Its name means 'rival of Mars' because of its red colour.",
    shaula: "The scorpion's stinger, a hot multiple-star system.",
    regulus: "Spins so fast, about once every 16 hours, that it is flattened. Its name means 'little king'.",
    denebola: "Marks the lion's tail.",
    acrux: "The brightest star of the Southern Cross and a multiple star system.",
    gacrux: "The nearest red giant to us, at about 88 light-years.",
    mimosa: "The second-brightest star of the Southern Cross.",
    aldebaran: "The 'eye of the bull'. It looks like part of the Hyades star cluster but is really much closer, a foreground star.",
    alcyone: "The brightest star of the Pleiades, the Seven Sisters, a young cluster of hot blue stars about 440 light-years away.",
    elnath: "The tip of the bull's northern horn.",
    sirius: "The brightest star in the night sky, only 8.6 light-years away. It has a faint white dwarf companion, Sirius B.",
    canopus: "The second-brightest star in the sky. Spacecraft often use it as a navigation reference.",
    arcturus: "The brightest star in the northern sky, an orange giant 37 light-years away that is moving fast through the galaxy.",
    rigil_kent: "Part of Alpha Centauri, the closest star system to the Sun at 4.37 light-years. Its faint member Proxima is the nearest single star.",
    capella: "Looks like one bright yellow star, but it is really two pairs of stars.",
    procyon: "The 'Little Dog Star', 11.5 light-years away, with a white dwarf companion.",
    altair: "Spins once in under 9 hours, so it bulges at its equator.",
    spica: "Two hot blue stars so close they orbit each other every four days, stretched into egg shapes by gravity.",
    pollux: "An orange giant that has a confirmed planet.",
    castor: "A system of six stars, though it looks like one.",
    fomalhaut: "Surrounded by a huge ring of dust and debris."
  },

  constellations: [
    { id: "orion", name: "Orion", meaning: "The Hunter", season: "Winter (northern sky)", where: "Visible from nearly everywhere on Earth",
      brightest: "rigel", tip: "Find the three stars of the Belt in a row, then look for red Betelgeuse above and blue-white Rigel below.",
      story: "In Greek myth Orion was a boastful hunter. His Belt points to Sirius in one direction and Aldebaran in the other. Below the Belt, his 'sword' contains the Orion Nebula, a nursery where new stars are being born.",
      stars: ["betelgeuse", "rigel", "bellatrix", "saiph", "alnitak", "alnilam", "mintaka", "meissa"],
      lines: [["meissa", "betelgeuse"], ["meissa", "bellatrix"], ["betelgeuse", "alnitak"], ["bellatrix", "mintaka"], ["alnitak", "alnilam"], ["alnilam", "mintaka"], ["alnitak", "saiph"], ["mintaka", "rigel"]] },

    { id: "ursa-major", name: "Ursa Major", meaning: "The Great Bear", season: "Spring (northern sky)", where: "Circles the north pole, so it never sets from the northern US, Europe and most of Asia",
      brightest: "alioth", tip: "Look for the Big Dipper, a bowl with a long handle. The two stars at the end of the bowl, Dubhe and Merak, point to Polaris.",
      story: "The Big Dipper is the best-known part of the Great Bear. Many cultures saw a bear, a wagon or a plough. The bend in the handle is Mizar, which has a faint companion called Alcor.",
      stars: ["dubhe", "merak", "phecda", "megrez", "alioth", "mizar", "alkaid"],
      lines: [["dubhe", "merak"], ["merak", "phecda"], ["phecda", "megrez"], ["megrez", "dubhe"], ["megrez", "alioth"], ["alioth", "mizar"], ["mizar", "alkaid"]] },

    { id: "ursa-minor", name: "Ursa Minor", meaning: "The Little Bear", season: "All year (northern sky)", where: "Northern hemisphere; centred on the north celestial pole",
      brightest: "polaris", tip: "Polaris is the end of the Little Dipper's handle. Find it by following the Pointers of the Big Dipper.",
      story: "The Little Bear holds Polaris, the North Star. Because Earth's axis slowly wobbles over about 26,000 years, the pole star changes: the Egyptians' pole star was Thuban, and in about 12,000 years it will be Vega.",
      stars: ["polaris", "yildun", "eps_umi", "zeta_umi", "eta_umi", "pherkad", "kochab"],
      lines: [["polaris", "yildun"], ["yildun", "eps_umi"], ["eps_umi", "zeta_umi"], ["zeta_umi", "eta_umi"], ["eta_umi", "pherkad"], ["pherkad", "kochab"], ["kochab", "zeta_umi"]] },

    { id: "cassiopeia", name: "Cassiopeia", meaning: "The Queen", season: "Autumn (northern sky)", where: "Circumpolar from northern latitudes",
      brightest: "schedar", tip: "Look for a W or M shape on the opposite side of Polaris from the Big Dipper.",
      story: "Cassiopeia was a vain queen of Ethiopia in Greek myth, condemned to circle the pole in her chair. A star in this constellation exploded in 1572 and was bright enough to see in daylight, a supernova studied by Tycho Brahe.",
      stars: ["caph", "schedar", "navi", "ruchbah", "segin"],
      lines: [["caph", "schedar"], ["schedar", "navi"], ["navi", "ruchbah"], ["ruchbah", "segin"]] },

    { id: "cygnus", name: "Cygnus", meaning: "The Swan", season: "Summer (northern sky)", where: "Best seen from the northern hemisphere",
      brightest: "deneb", tip: "Look for the Northern Cross flying along the Milky Way. Deneb is the tail and Albireo is the beak.",
      story: "Cygnus flies down the Milky Way, whose glow marks the plane of our galaxy. Cygnus X-1, near Sadr, was one of the first objects accepted as a black hole.",
      stars: ["deneb", "sadr", "albireo", "gienah", "fawaris"],
      lines: [["deneb", "sadr"], ["sadr", "albireo"], ["fawaris", "sadr"], ["sadr", "gienah"]] },

    { id: "lyra", name: "Lyra", meaning: "The Lyre", season: "Summer (northern sky)", where: "Northern hemisphere",
      brightest: "vega", tip: "Vega is one of the brightest stars in the summer sky. A small parallelogram hangs below it.",
      story: "Lyra is the harp of Orpheus, the musician of Greek myth. Between Sheliak and Sulafat lies the Ring Nebula, a dying star's glowing shell. Vega was the first star other than the Sun to be photographed, in 1850.",
      stars: ["vega", "zeta1_lyr", "delta2_lyr", "sulafat", "sheliak"],
      lines: [["vega", "zeta1_lyr"], ["zeta1_lyr", "delta2_lyr"], ["delta2_lyr", "sulafat"], ["sulafat", "sheliak"], ["sheliak", "zeta1_lyr"]] },

    { id: "scorpius", name: "Scorpius", meaning: "The Scorpion", season: "Summer (northern sky)", where: "Best from the southern hemisphere and low northern latitudes",
      brightest: "antares", tip: "Find red Antares, the scorpion's heart, then follow the long curved tail to the stinger.",
      story: "In myth the scorpion killed Orion, which is why the two constellations are on opposite sides of the sky and never up together. The centre of our Milky Way lies just beyond the scorpion's tail.",
      stars: ["antares", "graffias", "dschubba", "pi_sco", "sigma_sco", "tau_sco", "eps_sco", "mu1_sco", "sargas", "iota1_sco", "kappa_sco", "shaula"],
      lines: [["graffias", "dschubba"], ["dschubba", "pi_sco"], ["dschubba", "sigma_sco"], ["sigma_sco", "antares"], ["antares", "tau_sco"], ["tau_sco", "eps_sco"], ["eps_sco", "mu1_sco"], ["mu1_sco", "sargas"], ["sargas", "iota1_sco"], ["iota1_sco", "kappa_sco"], ["kappa_sco", "shaula"]] },

    { id: "leo", name: "Leo", meaning: "The Lion", season: "Spring (northern sky)", where: "Visible from both hemispheres",
      brightest: "regulus", tip: "Look for a backwards question mark, the Sickle, with Regulus as the dot at the bottom, and a triangle of stars for the hindquarters.",
      story: "Leo is the Nemean Lion that the hero Heracles defeated. The Leonid meteor shower in November appears to stream out of the lion's mane.",
      stars: ["regulus", "algieba", "adhafera", "rasalas", "algenubi", "zosma", "chertan", "denebola"],
      lines: [["regulus", "algieba"], ["algieba", "adhafera"], ["adhafera", "rasalas"], ["rasalas", "algenubi"], ["algieba", "zosma"], ["zosma", "denebola"], ["denebola", "chertan"], ["chertan", "regulus"], ["zosma", "chertan"]] },

    { id: "crux", name: "Crux", meaning: "The Southern Cross", season: "Autumn (southern sky)", where: "Southern hemisphere, and as far north as about 25°N",
      brightest: "acrux", tip: "A small, kite-shaped cross. Extend its long axis about four and a half times to find the south celestial pole.",
      story: "Crux is the smallest of the 88 constellations but one of the most famous. It appears on the flags of Australia, New Zealand, Brazil, Papua New Guinea and Samoa, and has guided sailors in the south for centuries.",
      stars: ["acrux", "mimosa", "gacrux", "imai"],
      lines: [["acrux", "gacrux"], ["mimosa", "imai"]] },

    { id: "taurus", name: "Taurus", meaning: "The Bull", season: "Winter (northern sky)", where: "Visible from both hemispheres",
      brightest: "aldebaran", tip: "Follow Orion's Belt up and to the right to reach orange Aldebaran, then look for the V-shaped Hyades cluster and the tiny, tight Pleiades.",
      story: "Taurus contains two famous star clusters: the Hyades and the Pleiades or Seven Sisters. The Crab Nebula, the wreckage of a supernova that Chinese astronomers recorded in 1054, lies near the bull's southern horn.",
      stars: ["aldebaran", "elnath", "tianguan", "alcyone", "gamma_tau", "theta2_tau", "lambda_tau"],
      lines: [["gamma_tau", "theta2_tau"], ["theta2_tau", "aldebaran"], ["aldebaran", "tianguan"], ["aldebaran", "elnath"], ["gamma_tau", "lambda_tau"]] },

    { id: "summer-triangle", name: "Summer Triangle", meaning: "An asterism (not an official constellation)", season: "Summer and autumn (northern sky)", where: "Northern hemisphere",
      brightest: "vega", tip: "Look overhead on a summer evening for three bright stars forming a huge triangle: Vega, Deneb and Altair.",
      story: "An asterism is a pattern of stars that is not itself a constellation. The Summer Triangle links Vega in Lyra, Deneb in Cygnus and Altair in Aquila. The Milky Way runs right through it.",
      stars: ["vega", "deneb", "altair"],
      lines: [["vega", "deneb"], ["deneb", "altair"], ["altair", "vega"]] },

    { id: "bright", name: "Brightest stars", meaning: "Famous stars outside the figures above", season: "Varies", where: "Varies",
      brightest: "sirius", noFly: true, tip: "These stars are shown on the sky for you to explore. Use the buttons below to jump to each one.",
      story: "These stars are among the brightest in the sky. Sirius, Canopus and Arcturus are the three brightest of all.",
      stars: ["sirius", "canopus", "arcturus", "rigil_kent", "capella", "procyon", "altair", "spica", "pollux", "castor", "fomalhaut"],
      lines: [] }
  ],

  facts: [
    { h: "Constellations aren't real groups", t: "The stars in a constellation are at wildly different distances. Orion's Belt stars range from about 1,200 to 2,000 light-years away. Seen from another part of the galaxy, the pattern would vanish." },
    { h: "88 official constellations", t: "In the 1920s astronomers divided the whole sky into 88 official regions, like countries on a map. Every star belongs to exactly one." },
    { h: "Smaller means brighter", t: "The magnitude scale dates back to ancient Greece. Five magnitudes equal a factor of 100 in brightness, so a magnitude 1 star is 100 times brighter than a magnitude 6 star." },
    { h: "You're looking into the past", t: "The light you see from Betelgeuse left about 550 years ago. Look at Deneb and you see light that set out around 2,600 years ago." },
    { h: "The pole star changes", t: "Earth wobbles like a slowing spinning top, so the north celestial pole drifts. Polaris is only the pole star for now, and Vega takes over around the year 13,700." }
  ]
};
