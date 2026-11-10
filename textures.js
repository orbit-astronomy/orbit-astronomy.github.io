/* ==========================================================================
   ORBIT — textures.js  (procedural planet skins)
   --------------------------------------------------------------------------
   Instead of downloading image files, we PAINT every planet with maths.

   THE BIG IDEA
   A planet texture is a flat, wide picture (an "equirectangular map") that
   Three.js wraps around a sphere. Left–right is longitude, top–bottom is
   latitude. For every pixel we:
     1. work out which point on the sphere that pixel represents (x, y, z),
     2. ask a NOISE function "what is the terrain like at that point?",
     3. turn the answer into a colour (and a height, used for bump shading).
   Because we sample noise in 3D (x, y, z) instead of 2D, the picture has no
   seam where its left and right edges meet, and nothing is pinched at the poles.

   WHAT IS NOISE?
   "Value noise" is smooth randomness: random numbers on a 3D grid, blended
   smoothly in between. "fBm" (fractal Brownian motion) stacks several layers
   of it at growing detail, like zooming into a coastline: big continents,
   then bays, then rocks. It is the workhorse of procedural terrain.

   PUBLIC API (used by explorer.js)
     OrbitTextures.surface(spec, w, h) -> { map, bump }   canvases
     OrbitTextures.clouds(spec, w, h)  -> canvas with transparency
     OrbitTextures.ring(spec)          -> canvas for a planetary ring
     OrbitTextures.noise3D / fbm / mulberry32 -> helpers also used for asteroids
   ========================================================================== */
"use strict";

const OrbitTextures = (function () {

  const TAU = Math.PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  // smoothstep: 0 below e0, 1 above e1, a smooth S-curve in between. Works
  // "backwards" too if e0 > e1. Great for soft thresholds (coastlines etc.).
  const smoothstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------------------------------------------------------- RANDOMNESS */
  // A tiny seeded random generator. Same seed -> same numbers every time, so
  // Earth always looks like Earth. (Math.random can't be seeded.)
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------------------------------------------------------- VALUE NOISE */
  // Returns a function noise(x, y, z) -> number between 0 and 1.
  function noise3D(seed) {
    const rand = mulberry32(seed);
    const perm = new Uint8Array(512);            // shuffled lookup table
    const table = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {              // Fisher–Yates shuffle
      const j = Math.floor(rand() * (i + 1));
      [table[i], table[j]] = [table[j], table[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = table[i & 255];
    const values = new Float32Array(256);        // one random value per grid corner
    for (let i = 0; i < 256; i++) values[i] = rand();

    const fade = t => t * t * (3 - 2 * t);       // smooth blending curve

    return function noise(x, y, z) {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      const X = xi & 255, Y = yi & 255, Z = zi & 255;   // which grid cell
      const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi); // position inside it
      // Look up the random value at a cell corner using the shuffled table.
      const c = (a, b, d) => values[perm[perm[perm[X + a] + Y + b] + Z + d]];
      // Blend the 8 corners of the cube: first along x, then y, then z.
      const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
      const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
      return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
    };
  }

  // fBm: add `octaves` layers of noise. Each layer has ~2x the detail
  // (frequency) and half the strength (amplitude). Result stays in 0..1.
  function fbm(noise, x, y, z, octaves) {
    let sum = 0, amp = 0.5, freq = 1, norm = 0;
    for (let i = 0; i < octaves; i++) {
      // The odd offsets stop every layer lining up at the origin.
      sum += amp * noise(x * freq + i * 17.3, y * freq + i * 9.1, z * freq + i * 5.7);
      norm += amp; amp *= 0.5; freq *= 2.03;
    }
    return sum / norm;
  }

  /* ---------------------------------------------------------- PIXEL BAKER */
  // Walks over every pixel, converts it to a point on the unit sphere, then
  // calls shade(p, lat, lon, out, index). The shader fills `out` with
  // [r, g, b, height] (r/g/b 0–255, height 0–1).
  //   opts.alpha = true  -> use out[3] as transparency (for clouds), no bump.
  function bake(width, height, shade, opts) {
    opts = opts || {};
    const make = () => { const c = document.createElement("canvas"); c.width = width; c.height = height; return c; };
    const color = make(), colorCtx = color.getContext("2d");
    const colorData = colorCtx.createImageData(width, height);
    let bump = null, bumpCtx = null, bumpData = null;
    if (!opts.alpha) { bump = make(); bumpCtx = bump.getContext("2d"); bumpData = bumpCtx.createImageData(width, height); }

    // Pre-compute cos/sin of each column's longitude once (saves millions of calls).
    const cosLon = new Float32Array(width), sinLon = new Float32Array(width);
    for (let px = 0; px < width; px++) { const lon = (px + 0.5) / width * TAU; cosLon[px] = Math.cos(lon); sinLon[px] = Math.sin(lon); }

    const p = { x: 0, y: 0, z: 0 };
    const out = [0, 0, 0, 0.5];
    for (let py = 0; py < height; py++) {
      const lat = (0.5 - (py + 0.5) / height) * Math.PI;   // +90° at the top row
      const cl = Math.cos(lat), sl = Math.sin(lat);
      for (let px = 0; px < width; px++) {
        p.x = cl * cosLon[px]; p.y = sl; p.z = cl * sinLon[px];  // point on the sphere
        out[3] = opts.alpha ? 0 : 0.5;
        shade(p, lat, (px + 0.5) / width * TAU, out, py * width + px);
        const i = (py * width + px) * 4;
        colorData.data[i] = out[0]; colorData.data[i + 1] = out[1]; colorData.data[i + 2] = out[2];
        colorData.data[i + 3] = opts.alpha ? out[3] * 255 : 255;
        if (bumpData) { const g = out[3] * 255; bumpData.data[i] = g; bumpData.data[i + 1] = g; bumpData.data[i + 2] = g; bumpData.data[i + 3] = 255; }
      }
    }
    colorCtx.putImageData(colorData, 0, 0);
    if (bumpCtx) bumpCtx.putImageData(bumpData, 0, 0);
    return { color, bump };
  }

  // Blend colour a toward colour b by amount t (0..1), writing into out.
  function mixInto(out, a, b, t) { out[0] = lerp(a[0], b[0], t); out[1] = lerp(a[1], b[1], t); out[2] = lerp(a[2], b[2], t); }

  /* ---------------------------------------------------------------- CRATERS */
  // Stamps one crater into a height array. d = distance from the crater's
  // centre measured in crater radii: inside (d<1) is a bowl, around d=1 is
  // a raised rim, just outside is a gentle ejecta blanket.
  function stampCrater(heights, w, h, lat0, lon0, r, depth) {
    const reach = r * 1.7;                                   // how far the effect extends
    const rowsPerRad = h / Math.PI;
    const rowMin = Math.max(0, Math.floor((Math.PI / 2 - (lat0 + reach)) * rowsPerRad));
    const rowMax = Math.min(h - 1, Math.ceil((Math.PI / 2 - (lat0 - reach)) * rowsPerRad));
    const cl0 = Math.cos(lat0), sl0 = Math.sin(lat0);
    // Near the poles a crater spans many columns, so widen the search there.
    const colSpan = Math.min(w >> 1, Math.ceil(reach / Math.max(cl0, 0.05) / TAU * w));
    const colCenter = Math.round(lon0 / TAU * w);
    for (let row = rowMin; row <= rowMax; row++) {
      const lat = (0.5 - (row + 0.5) / h) * Math.PI;
      const cl = Math.cos(lat), sl = Math.sin(lat);
      for (let c = colCenter - colSpan; c <= colCenter + colSpan; c++) {
        const col = ((c % w) + w) % w;                      // wrap around the left/right edge
        const lon = (col + 0.5) / w * TAU;
        // Spherical law of cosines gives the true angle between the two points.
        const d = Math.acos(Math.min(1, sl0 * sl + cl0 * cl * Math.cos(lon - lon0))) / r;
        if (d > 1.7) continue;
        let v = d < 1 ? -depth * (1 - d * d) : 0;                    // the bowl
        v += depth * 0.35 * Math.exp(-((d - 1.05) * (d - 1.05)) / 0.025); // the rim
        heights[row * w + col] += v;
      }
    }
  }

  // Scatter many craters. Sizes follow a power law: lots of small, few huge.
  function makeCraters(w, h, rand, count, minR, maxR) {
    const heights = new Float32Array(w * h);
    for (let n = 0; n < count; n++) {
      const r = minR * Math.pow(maxR / minR, Math.pow(rand(), 2.5));
      const lat0 = Math.asin(2 * rand() - 1);               // uniform over a sphere's surface
      const lon0 = rand() * TAU;
      stampCrater(heights, w, h, lat0, lon0, r, 0.16 + 0.7 * r);
    }
    return heights;
  }

  /* -------------------------------------------------------- SURFACE RECIPES */
  // Each recipe returns a shade(p, lat, lon, out, idx) function for bake().

  // Cratered rock: Moon, Mercury, Ceres-like worlds. `preset` picks the palette.
  function crateredShader(spec, w, h, noise) {
    const rand = mulberry32(spec.seed * 101 + 7);
    const presets = {
      moon:    { high: [176, 173, 168], low: [84, 86, 94],  maria: 0.8, craters: 650, minR: 0.012, maxR: 0.2,  grain: 0.12 },
      mercury: { high: [138, 128, 118], low: [104, 96, 90], maria: 0.35, craters: 900, minR: 0.01, maxR: 0.18, grain: 0.16 },
      ceres:   { high: [128, 122, 116], low: [96, 92, 88],  maria: 0.2, craters: 600, minR: 0.012, maxR: 0.15, grain: 0.14,
                 // Occator Crater's bright salt deposits (lat/lon in degrees, r in radians).
                 spots: [{ lat: 19.8, lon: 239.3, r: 0.05, strength: 0.85 }, { lat: 19.8, lon: 239.3, r: 0.02, strength: 1 }] },
      // --- visited asteroids (v0.5): palette + crater density tuned to each body ---
      bennu:   { high: [96, 90, 86],   low: [70, 66, 63],  maria: 0.5,  craters: 1300, minR: 0.008, maxR: 0.1,  grain: 0.3 },   // dark, boulder-strewn
      ryugu:   { high: [88, 86, 86],   low: [66, 65, 66],  maria: 0.4,  craters: 800,  minR: 0.01,  maxR: 0.2,  grain: 0.24 },
      itokawa: { high: [158, 124, 96], low: [118, 96, 78], maria: 0.55, craters: 110,  minR: 0.02,  maxR: 0.16, grain: 0.34 },  // reddish, few craters
      eros:    { high: [160, 146, 128], low: [120, 110, 98], maria: 0.4, craters: 520,  minR: 0.01,  maxR: 0.22, grain: 0.16 },
      ida:     { high: [160, 144, 126], low: [122, 110, 98], maria: 0.35, craters: 700, minR: 0.01,  maxR: 0.2,  grain: 0.18 },
      vesta:   { high: [180, 176, 170], low: [112, 108, 104], maria: 0.65, craters: 420, minR: 0.012, maxR: 0.16, grain: 0.12 }
    };
    const s = Object.assign({}, presets[spec.preset] || presets.moon, spec);
    const heights = makeCraters(w, h, rand, s.craters, s.minR, s.maxR);
    return function (p, lat, lon, out, idx) {
      // Big smooth blotches: dark lava plains ("maria") vs bright highlands.
      const mare = smoothstep(0.5, 0.58, fbm(noise, p.x * 1.3 + 4, p.y * 1.3, p.z * 1.3, 4)) * s.maria;
      const grain = 1 + (fbm(noise, p.x * 14, p.y * 14, p.z * 14, 3) - 0.5) * s.grain * 2;
      mixInto(out, s.high, s.low, mare);
      const ht = heights[idx];                       // crater relief at this pixel
      const shade = grain * (1 + clamp(ht, -0.35, 0.35) * 0.55);  // floors slightly darker, rims slightly brighter
      out[0] *= shade; out[1] *= shade; out[2] *= shade;
      // Optional bright patches (e.g. Ceres's salt-rich spots): blend toward white near each spot.
      for (const sp of (s.spots || [])) {
        const la = sp.lat * Math.PI / 180, lo = sp.lon * Math.PI / 180;
        const d = Math.acos(Math.min(1, Math.sin(la) * Math.sin(lat) + Math.cos(la) * Math.cos(lat) * Math.cos(lon - lo)));
        if (d < sp.r) mixInto(out, out, [236, 236, 230], sp.strength * smoothstep(sp.r, sp.r * 0.35, d));
      }
      out[3] = clamp(0.5 + ht * 0.6, 0, 1);           // height -> bump map
    };
  }

  function marsShader(spec, w, h, noise) {
    const rand = mulberry32(spec.seed * 53 + 3);
    const heights = makeCraters(w, h, rand, 280, 0.012, 0.12);
    return function (p, lat, lon, out, idx) {
      const base = fbm(noise, p.x * 2.2, p.y * 2.2, p.z * 2.2, 5);
      const dark = smoothstep(0.5, 0.62, fbm(noise, p.x * 1.4 + 9, p.y * 1.4, p.z * 1.4 + 2, 4)); // dark basalt regions
      mixInto(out, [200, 106, 60], [226, 152, 98], smoothstep(0.35, 0.7, base));            // rusty plains
      const tmp = [0, 0, 0]; mixInto(tmp, out, [96, 58, 44], dark * 0.75);                  // darker areas
      out[0] = tmp[0]; out[1] = tmp[1]; out[2] = tmp[2];
      let ht = heights[idx];
      // Valles Marineris: a long dark canyon just south of the equator.
      const lonDeg = lon * 180 / Math.PI, latDeg = lat * 180 / Math.PI;
      const canyonLat = -8 + 1.2 * Math.sin(lonDeg * 0.12);
      const inCanyon = smoothstep(4.2, 1.2, Math.abs(latDeg - canyonLat)) * smoothstep(250, 265, lonDeg) * smoothstep(322, 306, lonDeg);
      mixInto(out, out, [112, 62, 46], inCanyon * 0.8); ht -= inCanyon * 0.2;
      // Olympus Mons: a huge, slightly lighter volcano.
      const dl = Math.atan2(Math.sin(lon - 3.9), Math.cos(lon - 3.9)) * Math.cos(0.33), dy = lat - 0.33;
      const volc = smoothstep(0.1, 0.0, Math.sqrt(dl * dl + dy * dy));
      mixInto(out, out, [224, 170, 130], volc * 0.6); ht += volc * 0.3;
      // Polar ice caps, with a ragged noisy edge.
      const cap = smoothstep(1.28, 1.36, Math.abs(lat) + (base - 0.5) * 0.18);
      mixInto(out, out, [244, 246, 250], cap);
      const shade = 1 + clamp(ht, -0.35, 0.35) * 0.7;
      out[0] *= shade; out[1] *= shade; out[2] *= shade;
      out[3] = clamp(0.5 + ht * 0.55, 0, 1);
    };
  }

  function venusShader(spec, w, h, noise) {
    return function (p, lat, lon, out) {
      // Warp the noise by itself ("domain warping") to get swirling cloud streaks.
      const a = fbm(noise, p.x * 1.6, p.y * 3.4, p.z * 1.6, 5);
      const b = fbm(noise, p.x * 3 + a * 2.2, p.y * 6 + a * 1.6, p.z * 3 + a * 2.2, 5);
      mixInto(out, [200, 150, 82], [248, 230, 178], smoothstep(0.3, 0.72, b));
      const polar = smoothstep(0.7, 1.3, Math.abs(lat)) * 0.18;     // brighter polar collars
      mixInto(out, out, [255, 244, 210], polar);
    };
  }

  function earthShader(spec, w, h, noise) {
    return function (p, lat, lon, out) {
      const e = fbm(noise, p.x * 1.5 + 3, p.y * 1.5, p.z * 1.5 + 3, 6);        // continent shape
      const detail = fbm(noise, p.x * 7, p.y * 7, p.z * 7, 4);                  // coastline wiggle
      const land = e + (detail - 0.5) * 0.14 - 0.505;                             // > 0 means land
      const a = Math.abs(lat) / (Math.PI / 2);                                   // 0 equator … 1 pole
      if (land <= 0) {
        const depth = clamp(-land * 7, 0, 1);                                    // deeper = darker
        mixInto(out, [58, 150, 196], [14, 58, 132], depth);
        mixInto(out, out, [235, 244, 252], smoothstep(0.84, 0.93, a + (detail - 0.5) * 0.14)); // sea ice
        out[3] = 0.42;
      } else {
        const moist = fbm(noise, p.x * 3 + 11, p.y * 3, p.z * 3 + 5, 4);
        mixInto(out, [86, 130, 58], [34, 92, 48], smoothstep(0.4, 0.62, moist)); // grassland -> forest
        const desert = smoothstep(0.14, 0.28, a) * smoothstep(0.55, 0.4, a) * smoothstep(0.56, 0.4, moist);
        mixInto(out, out, [204, 176, 116], desert);                                 // subtropical deserts
        mixInto(out, out, [138, 150, 124], smoothstep(0.6, 0.78, a));               // cold tundra
        const high = smoothstep(0.1, 0.24, land);
        mixInto(out, out, [122, 108, 96], high);                                    // bare rock
        mixInto(out, out, [246, 248, 252], Math.max(smoothstep(0.8, 0.88, a), smoothstep(0.24, 0.34, land))); // snow & ice
        mixInto(out, out, [214, 196, 150], smoothstep(0.03, 0.0, land) * 0.7);       // beaches
        out[3] = clamp(0.45 + land * 0.8, 0, 1);
      }
    };
  }

  // Colour stops for the banded gas / ice giants. Each stop is
  // [latitude from -1 (south pole) to +1 (north pole), r, g, b].
  const GAS = {
    jupiter: {
      stops: [[-1, 150, 130, 112], [-0.86, 186, 160, 132], [-0.7, 148, 104, 78], [-0.58, 226, 204, 172], [-0.44, 168, 112, 84],
              [-0.33, 236, 220, 192], [-0.22, 172, 108, 78], [-0.1, 232, 206, 168], [0, 240, 226, 190], [0.1, 208, 152, 112],
              [0.2, 158, 98, 72], [0.31, 236, 216, 186], [0.43, 184, 128, 98], [0.56, 226, 206, 180], [0.7, 164, 124, 98],
              [0.86, 188, 166, 146], [1, 150, 132, 118]],
      warp: 0.035, streak: 0.1, blobs: 0.12,
      spots: [{ lat: -22, lon: 215, a: 0.26, b: 0.14, color: [196, 82, 52], strength: 0.9, rim: 22 }]   // Great Red Spot
    },
    saturn: {
      stops: [[-1, 150, 150, 140], [-0.8, 196, 180, 140], [-0.6, 216, 196, 150], [-0.4, 206, 184, 140], [-0.2, 226, 206, 160],
              [0, 236, 216, 170], [0.2, 222, 200, 154], [0.4, 210, 188, 144], [0.6, 218, 198, 152], [0.8, 196, 178, 138], [1, 140, 150, 150]],
      warp: 0.02, streak: 0.05, blobs: 0.06, spots: []
    },
    uranus: {
      stops: [[-1, 150, 220, 226], [-0.5, 160, 222, 228], [0, 170, 228, 232], [0.5, 164, 224, 230], [1, 190, 238, 240]],
      warp: 0.01, streak: 0.025, blobs: 0.03, spots: []
    },
    neptune: {
      stops: [[-1, 40, 70, 170], [-0.7, 52, 88, 205], [-0.45, 38, 66, 176], [-0.2, 60, 100, 220], [0, 46, 80, 190],
              [0.25, 64, 106, 224], [0.5, 40, 70, 180], [0.8, 54, 92, 208], [1, 40, 68, 172]],
      warp: 0.03, streak: 0.07, blobs: 0.1,
      spots: [{ lat: -22, lon: 120, a: 0.17, b: 0.095, color: [18, 30, 100], strength: 0.85, rim: 0 },           // Great Dark Spot
              { lat: -34, lon: 132, a: 0.12, b: 0.02, color: [210, 225, 255], strength: 0.8, rim: 0 }]           // white cirrus streak
    }
  };

  function gasShader(spec, w, h, noise) {
    const cfg = GAS[spec.preset] || GAS.jupiter;
    const stops = cfg.stops;
    return function (p, lat, lon, out) {
      // Warp the latitude with noise so the band edges ripple like real clouds.
      const turbulence = fbm(noise, p.x * 2.6, p.y * 9, p.z * 2.6, 4) - 0.5;
      const t = clamp(lat / (Math.PI / 2) + turbulence * cfg.warp * 2, -1, 1);
      // Find the two colour stops either side of t and blend between them.
      let i = 0; while (i < stops.length - 2 && stops[i + 1][0] < t) i++;
      const a = stops[i], b = stops[i + 1], f = smoothstep(a[0], b[0], t);
      out[0] = lerp(a[1], b[1], f); out[1] = lerp(a[2], b[2], f); out[2] = lerp(a[3], b[3], f);
      // Fine horizontal streaks (noise stretched along latitude) + soft cloud blobs.
      const streak = fbm(noise, p.x * 3, p.y * 34, p.z * 3, 3) - 0.5;
      const blob = fbm(noise, p.x * 5 + 2, p.y * 7, p.z * 5, 4) - 0.5;
      const shade = 1 + streak * cfg.streak * 2 + blob * cfg.blobs * 2;
      out[0] *= shade; out[1] *= shade; out[2] *= shade;
      // Storms: oval spots. Longitude difference is wrapped to the shortest way round.
      for (const s of cfg.spots) {
        const la = s.lat * Math.PI / 180, lo = s.lon * Math.PI / 180;
        const dx = Math.atan2(Math.sin(lon - lo), Math.cos(lon - lo)) * Math.cos(la), dy = lat - la;
        const q = (dx / s.a) * (dx / s.a) + (dy / s.b) * (dy / s.b);          // <1 means inside the oval
        if (q < 2.2) {
          const swirl = 0.88 + 0.12 * Math.sin(Math.sqrt(q) * 9 + Math.atan2(dy, dx) * 2);
          const inside = smoothstep(1.25, 0.3, q) * s.strength;
          mixInto(out, out, [s.color[0] * swirl, s.color[1] * swirl, s.color[2] * swirl], inside);
          const rim = s.rim * Math.exp(-((q - 1.1) * (q - 1.1)) / 0.08);        // bright collar around the storm
          out[0] += rim; out[1] += rim; out[2] += rim;
        }
      }
    };
  }

  // A star's surface: boiling convection cells (bright centres, dark lanes), big
  // mottled patches, and optional dark spots. Colours run cool -> mid -> hot.
  function starShader(spec, w, h, noise) {
    const s = Object.assign({ hot: [255, 246, 214], mid: [255, 176, 70], cool: [214, 84, 24], cells: 9, mottle: 0.9, spots: 0 }, spec);
    return function (p, lat, lon, out) {
      const gran = smoothstep(0.34, 0.66, fbm(noise, p.x * s.cells, p.y * s.cells, p.z * s.cells, 3));   // 0 = dark lane, 1 = bright cell
      const big = fbm(noise, p.x * 1.7 + 5, p.y * 1.7, p.z * 1.7, 3) - 0.5;                             // large-scale patches
      const t = clamp(0.25 + gran * 0.6 + big * s.mottle, 0, 1);
      if (t < 0.5) mixInto(out, s.cool, s.mid, t * 2); else mixInto(out, s.mid, s.hot, (t - 0.5) * 2);
      if (s.spots) {                                                      // sunspots live in bands near the equator
        const band = smoothstep(0.55, 0.2, Math.abs(lat) / (Math.PI / 2));
        const sn = fbm(noise, p.x * 3.4 + 20, p.y * 3.4, p.z * 3.4, 3);
        mixInto(out, out, [150, 70, 22], smoothstep(0.6, 0.68, sn) * band * s.spots * 0.8);   // lighter penumbra
        mixInto(out, out, [52, 20, 8], smoothstep(0.7, 0.76, sn) * band * s.spots);          // dark core (umbra)
      }
    };
  }

  const SHADERS = { star: starShader, cratered: crateredShader, mars: marsShader, venus: venusShader, earth: earthShader, gas: gasShader };

  /* -------------------------------------------------------------- PUBLIC API */
  function surface(spec, w, h) {
    w = w || 1024; h = h || 512;
    const noise = noise3D(spec.seed || 1);
    const make = SHADERS[spec.kind] || SHADERS.cratered;
    const baked = bake(w, h, make(spec, w, h, noise));
    // Only rocky worlds need a bump map; for the rest it would just add noise.
    return { map: baked.color, bump: (spec.kind === "cratered" || spec.kind === "mars") ? baked.bump : null };
  }

  // White clouds with transparency. coverage: 0 (clear) … 1 (overcast).
  function clouds(spec, w, h) {
    w = w || 1024; h = h || 512;
    const noise = noise3D((spec.seed || 1) + 500);
    const lo = 0.62 - (spec.coverage || 0.5) * 0.3;                 // threshold falls as coverage rises
    return bake(w, h, function (p, lat, lon, out) {
      const warp = fbm(noise, p.x * 2, p.y * 2, p.z * 2, 3);
      const c = fbm(noise, p.x * 2.4 + warp, p.y * 4 + warp * 1.5, p.z * 2.4 + warp, 6);
      out[0] = 255; out[1] = 255; out[2] = 255;
      out[3] = smoothstep(lo, lo + 0.18, c) * 0.92;
    }, { alpha: true }).color;
  }

  // A 1D strip describing a ring from its inner edge (left) to outer edge (right).
  // spec.bands are [start, end, opacity, [r,g,b]] with start/end from 0 to 1.
  function ring(spec) {
    const W = 1024, H = 8;
    const noise = noise3D((spec.seed || 1) + 900);
    const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d"), img = ctx.createImageData(W, H);
    for (let x = 0; x < W; x++) {
      const s = (x + 0.5) / W;
      let alpha = 0, col = [200, 190, 170];
      for (const [start, end, opacity, rgb] of spec.bands) if (s >= start && s < end) { alpha = opacity; col = rgb; }
      // Thousands of tiny ringlets: fast-changing noise along the ring's width.
      const ringlets = 0.72 + 0.28 * noise(s * 160, 3.1, 7.7) + 0.12 * (noise(s * 600, 1.3, 2.9) - 0.5);
      alpha = clamp(alpha * ringlets, 0, 1);
      for (let y = 0; y < H; y++) {
        const i = (y * W + x) * 4;
        img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = alpha * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  return { surface, clouds, ring, noise3D, fbm, mulberry32, smoothstep, clamp };
})();
