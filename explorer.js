/* ==========================================================================
   ORBIT — explorer.js  (the 3D lab engine, shared by every planet page)
   --------------------------------------------------------------------------
   WHAT CHANGED IN v0.4 (read this first!)
   1. ONE BODY PER PAGE. The old version had a dropdown that swapped planets
      inside one scene. Now each page reads <body data-world="mars"> and builds
      ONLY that body. To see another world you go back to the home page.
   2. EARTH CROSS-SECTION REBUILT. The old cutaway made hollow, open shells, so
      you saw through them (a "clear sphere"). The new one slices the real
      planet with CLIPPING PLANES and then plugs the hole with flat "cut faces"
      coloured by layer. See section 5 — it has a long explanation.
   3. EVERYTHING IS DATA-DRIVEN. Facts, stats and layers come from worlds.js,
      and skins are painted by textures.js. This file just assembles them.
   4. NEW IMMERSION: Saturn's rings, banded gas giants, atmospheric glow,
      moons, and an asteroid belt with several rock shapes and types.

   NEW IN v0.5: REAL NASA asteroid shape models (models/*.js, made by
   tools/build_meshes.py and decoded by meshGeometry; asteroidGeometry is the
   procedural fallback used for Ida/Ryugu) and self-lit STARS (the Sun, Sirius,
   Betelgeuse) with a limb-darkened corona. Constellations live in sky.js.

   FILE MAP
     1. Setup & lookup          5. Cross-section (cutaway)
     2. Page text & controls    6. Asteroid belt
     3. Three.js scene          7. Interaction, animation loop, start-up
     4. Planet / rings / moons
   ========================================================================== */
(function () {
  "use strict"; // catches some silly mistakes; the IIFE keeps our variables private

  /* ======================================================================
     1. SETUP & LOOKUP
     ====================================================================== */
  const $ = id => document.getElementById(id);              // short helper: $("scene")
  const key = document.body.dataset.world;                  // "earth", "mars", ...
  const world = (typeof WORLDS !== "undefined") ? WORLDS[key] : null;
  const loadingEl = $("loading");

  // If the data failed to load, say so politely instead of crashing.
  if (!world) { if (loadingEl) loadingEl.textContent = "Could not find data for this world."; return; }

  const model = world.model;
  const anatomy = world.anatomy;
  const isBelt = model.kind === "belt";
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Texture size: bigger = sharper but slower to paint. 2048x1024 takes ~1s.
  const TEX_W = 2048, TEX_H = 1024;
  // Earth and Moon can upgrade to real photo textures from threejs.org if the
  // network allows it. Set to false to stay 100% offline/procedural.
  const USE_ONLINE_TEXTURES = true;

  // One shared state object. Toggles change it; applyState() reads it.
  const state = { spin: !prefersReducedMotion, cutaway: false, atmosphere: true, rings: true, moons: true, orbits: true };

  // Tiny helper to create an element with a class and text (textContent is safe: no HTML injection).
  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  const announce = msg => { const s = $("status"); if (s) s.textContent = msg; }; // screen-reader message

  /* ======================================================================
     2. PAGE TEXT & CONTROLS  (no 3D here — this runs even without WebGL)
     ====================================================================== */
  function fillPage() {
    document.title = "ORBIT — " + world.name;
    // CSS custom properties let each page tint its glow with its own colour.
    document.documentElement.style.setProperty("--accent", world.accent);
    document.documentElement.style.setProperty("--accent-soft", world.accent + "33"); // "33" = 20% opacity in hex

    $("world-tagline").textContent = world.tagline;
    // Asteroids and stars supply their own labels in worlds.js; planets use the default.
    $("world-eyebrow").textContent = world.eyebrow || ("PLANETARY EXPLORATION / " + String(world.order).padStart(2, "0") + " OF 10");
    $("scene-kicker").textContent = world.kicker || (world.name.toUpperCase() + " / " + String(world.order).padStart(2, "0"));
    $("world-name").textContent = world.name;
    $("world-description").textContent = world.description;
    $("world-type").textContent = world.type;

    // Stats grid: a <dl> (description list) of label/value pairs.
    const grid = $("stat-grid");
    world.stats.forEach(([label, value]) => {
      const cell = el("div", "stat-cell");
      cell.append(el("dt", "", label), el("dd", "", value));
      grid.append(cell);
    });

    // "Did you know?" cards.
    const factGrid = $("fact-grid");
    world.facts.forEach((f, i) => {
      const card = el("article", "fact-card");
      card.append(el("span", "fact-num", String(i + 1).padStart(2, "0")), el("h3", "", f.h), el("p", "", f.t));
      factGrid.append(card);
    });

    // Mission timeline.
    const missions = $("mission-list");
    world.missions.forEach(([year, name, text]) => {
      const li = el("li", "mission-item");
      const body = el("div");
      body.append(el("strong", "", name), el("p", "", text));
      li.append(el("span", "mission-year", year), body);
      missions.append(li);
    });

    // Be honest about where a shape came from.
    const note = $("panel-note");
    if (note && model.mesh && meshEntry()) note.textContent = "Shape: real NASA 3D model, slimmed down for the web. The craters and boulders you see are baked from the scan's own relief. Not to scale with other worlds.";
    else if (note && model.shape) note.textContent = "Shape approximated from published dimensions (no scan model loaded for this body). Not to scale with other worlds.";
    fillAnatomy();
    fillWeightCalculator();
  }

  /* ---- "Anatomy" section: layers for planets, types for the asteroid belt ---- */
  let selectedLayer = -1;                                  // -1 = nothing highlighted
  function fillAnatomy() {
    $("layers-eyebrow").textContent = anatomy.eyebrow;
    $("layers-title").textContent = anatomy.heading + " ";
    $("layers-title").append(el("em", "", anatomy.em));
    $("layers-lead").textContent = anatomy.lead;

    const list = $("layer-list");
    anatomy.items.forEach((item, i) => {
      const btn = el("button", "layer-btn");
      btn.type = "button";
      btn.setAttribute("aria-pressed", "false");
      const swatch = el("i"); swatch.style.background = item.color; swatch.setAttribute("aria-hidden", "true");
      const label = el("span");
      label.append(el("strong", "", item.name), el("small", "", item.depth || item.share));
      btn.append(swatch, label);
      btn.addEventListener("click", () => selectLayer(i === selectedLayer ? -1 : i));
      list.append(btn);
    });
    showLayerDetail(-1);
  }

  function showLayerDetail(i) {
    const box = $("layer-detail");
    box.replaceChildren();                                   // empty the box
    if (i < 0) {
      box.append(el("p", "layer-hint", anatomy.hint || (anatomy.cutaway
        ? "Select a layer to highlight it inside the 3D model."
        : "Select a type to make it glow in the 3D model.")));
      return;
    }
    const item = anatomy.items[i];
    box.append(el("h3", "", item.name), el("span", "layer-depth", item.depth || item.share), el("p", "", item.text));
  }

  // Called when a layer button is clicked.
  function selectLayer(i) {
    selectedLayer = i;
    [...$("layer-list").children].forEach((b, n) => b.setAttribute("aria-pressed", String(n === i)));
    showLayerDetail(i);
    if (i >= 0 && anatomy.cutaway && !state.cutaway) setToggle("cutaway", true); // picking a layer opens the cross-section
    highlightLayer(i);
    // If the 3D view has scrolled off-screen, bring it back so the user sees the result.
    const r = $("scene").getBoundingClientRect();
    if (i >= 0 && (r.top < 0 || r.bottom > innerHeight)) $("scene").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
  }

  // Tiny gravities (asteroids!) give tiny weights, so switch to grams / ounces when under 1.
  function formatWeight(value, unit) {
    if (value >= 1) return value.toFixed(1) + " " + unit;
    const small = unit === "kg" ? value * 1000 : value * 16;      // 1 kg = 1000 g, 1 lb = 16 oz
    const label = unit === "kg" ? "g" : "oz";
    return (small < 0.01 ? "less than 0.01" : small.toFixed(small < 10 ? 2 : 1)) + " " + label;
  }

  /* ---- Weight calculator: weight scales with surface gravity ---- */
  function fillWeightCalculator() {
    const input = $("weight-input"), unit = $("weight-unit"), output = $("weight-output");
    // Some small asteroids have no reliable measured gravity, so we hide the calculator rather than invent a number.
    if (!world.gravity) { input.closest(".weight-box").hidden = true; return; }
    const gasLike = model.surface && model.surface.kind === "gas";
    const where = world.gravityNote || (gasLike ? "at the cloud tops" : "on the surface");
    function update() {
      const w = parseFloat(input.value);
      if (!(w > 0)) { output.textContent = "Enter a weight above zero."; return; }
      // Weight = mass x gravity, so it scales by (this world's gravity / Earth's gravity).
      const here = w * world.gravity / 9.81;
      output.textContent = "You would weigh " + formatWeight(here, unit.value) + " " + where + ".";
    }
    input.addEventListener("input", update);
    unit.addEventListener("change", update);
    update();
  }

  /* ---- Toggle switches, generated from this world's capabilities ---- */
  const toggleDefs = [
    { key: "spin",       label: "Auto rotation", hint: "Slowly turn the model",       show: true },
    { key: "cutaway",    label: "Cross-section", hint: "Slice open to see inside",     show: !!anatomy.cutaway },
    { key: "atmosphere", label: model.emissive ? "Corona glow" : "Atmosphere", hint: model.emissive ? "The star's bright halo" : "Glow of the gas envelope", show: !!model.atmosphere },
    { key: "rings",      label: "Rings",         hint: "Show the ring system",         show: !!model.ring },
    { key: "moons",      label: "Moons",         hint: "Show orbiting moons",          show: !!(model.moons && model.moons.length) },
    { key: "orbits",     label: "Orbit guides",  hint: "Show orbital paths",           show: isBelt || !!(model.moons && model.moons.length) }
  ];
  const toggleInputs = {};

  function buildToggles() {
    const holder = $("toggle-list");
    toggleDefs.filter(t => t.show).forEach(t => {
      // Same markup/classes as the original CSS toggle switch.
      const row = el("label", "toggle-row"); row.htmlFor = "toggle-" + t.key;
      const text = el("span"); text.append(el("strong", "", t.label), el("small", "", t.hint));
      const input = el("input"); input.type = "checkbox"; input.id = "toggle-" + t.key; input.checked = state[t.key];
      input.addEventListener("change", () => setToggle(t.key, input.checked));
      row.append(text, input, el("span", "toggle-ui"));
      holder.append(row);
      toggleInputs[t.key] = input;
    });
  }

  // Single place to change a toggle, so checkbox, state and 3D scene never disagree.
  function setToggle(k, value) {
    state[k] = value;
    if (toggleInputs[k]) toggleInputs[k].checked = value;
    applyState();
    const t = toggleDefs.find(d => d.key === k);
    announce(t.label + (value ? " on." : " off."));
  }

  /* ======================================================================
     3. THREE.JS SCENE
     ====================================================================== */
  let renderer, scene, camera, controls, sunlight, ambient;
  let tiltGroup, planetMesh, planetMaterial, cloudMesh, ringMesh, cutGroup;
  const atmosphereMeshes = [];        // halo + rim shells
  const moonRigs = [];                // { base, pivot, speed, line }
  const layerMaterials = [];          // one material per cutaway layer
  const belt = { bins: [], guides: [], typeMaterials: [], bodies: [] };
  let clipPlanes = null;              // { local: [...], world: [...] } for the cutaway
  let SUN_DIR = null;                 // where the "Sun" is (set once THREE exists)
  const cameraStart = { x: 0, y: 0, z: 0 };

  function setupScene() {
    SUN_DIR = new THREE.Vector3(-4, 2, 5).normalize();
    const host = $("scene");
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch (err) {
      // No WebGL (old browser, disabled GPU): the rest of the page still works.
      loadingEl.textContent = "3D view unavailable: your browser could not start WebGL. The facts below still work!";
      return false;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));    // crisp on retina, capped for speed
    renderer.outputEncoding = THREE.sRGBEncoding;             // correct colour curve for screens
    renderer.localClippingEnabled = true;                     // REQUIRED for the cross-section
    host.appendChild(renderer.domElement);

    scene = new THREE.Scene();                                // the "world" that holds every object
    scene.background = new THREE.Color(0x03060f);
    camera = new THREE.PerspectiveCamera(45, 1, 0.05, 1000);  // field of view, aspect, near, far

    // Lights: a soft ambient fill so the night side isn't pure black, plus the Sun.
    ambient = new THREE.AmbientLight(0x8297c8, isBelt ? 0.55 : 0.42);
    scene.add(ambient);
    sunlight = new THREE.DirectionalLight(0xffffff, 2.3);
    sunlight.position.copy(SUN_DIR).multiplyScalar(10);
    scene.add(sunlight);

    // OrbitControls = drag to rotate, scroll/pinch to zoom, right-drag to pan.
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.07; controls.rotateSpeed = 0.7;
    controls.minDistance = isBelt ? 0.8 : 1.35;
    controls.maxDistance = isBelt ? 22 : 18;

    scene.add(makeStarfield(), makeGlowSprite(0xfff1d0, 14, SUN_DIR.clone().multiplyScalar(60)));
    return true;
  }

  // A shell of ~1800 tiny coloured points far away = the starry backdrop.
  function makeStarfield() {
    const n = 1800, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const color = new THREE.Color();
    for (let i = 0; i < n; i++) {
      // Random direction on a sphere: z uniform in [-1,1], angle uniform.
      const z = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - z * z);
      const dist = 70 + Math.random() * 40;
      pos.set([r * Math.cos(a) * dist, z * dist, r * Math.sin(a) * dist], i * 3);
      // Star colour: mostly blue-white, a few warm. Hue 0.6 is blue, 0.1 is orange.
      color.setHSL(Math.random() < 0.8 ? 0.58 + Math.random() * 0.08 : 0.08 + Math.random() * 0.05, 0.5, 0.65 + Math.random() * 0.3);
      col.set([color.r, color.g, color.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.24, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
  }

  // A soft glowing blob that always faces the camera (a "sprite"). Used for the Sun.
  function makeGlowSprite(hex, size, position) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    const col = new THREE.Color(hex), rgb = [col.r, col.g, col.b].map(v => Math.round(v * 255)).join(",");
    grad.addColorStop(0, "rgba(" + rgb + ",1)"); grad.addColorStop(0.25, "rgba(" + rgb + ",0.4)"); grad.addColorStop(1, "rgba(" + rgb + ",0)");
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sprite.scale.set(size, size, 1);
    if (position) sprite.position.copy(position);
    return sprite;
  }

  // Turn a painted <canvas> into a GPU texture.
  function toTexture(canvas, isColour) {
    const t = new THREE.CanvasTexture(canvas);
    if (isColour) t.encoding = THREE.sRGBEncoding;            // colour maps are sRGB; bump maps are plain data
    t.wrapS = THREE.RepeatWrapping;                           // avoids a faint line at the left/right seam
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();  // sharper at glancing angles
    return t;
  }

  /* ======================================================================
     4. PLANET / ATMOSPHERE / RINGS / MOONS BUILDERS
     ====================================================================== */
  function buildBody() {
    // tiltGroup tilts the whole system (planet + rings + equatorial moons) by the
    // axial tilt, around the Z axis. The planet then spins around ITS OWN up axis.
    tiltGroup = new THREE.Group();
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(model.tilt || 0);
    scene.add(tiltGroup);

    // Clipping planes for the cross-section (created now so the material can use them).
    clipPlanes = makeClipPlanes();

    // Real NASA mesh available? Then we don't need a painted texture at all.
    const meshData = model.mesh ? meshEntry() : null;
    const tex = meshData ? null : OrbitTextures.surface(model.surface, TEX_W, TEX_H);
    // Clipping settings shared by every kind of body material.
    const clipping = {
      clippingPlanes: clipPlanes.world,       // the planes that cut the wedge out...
      clipIntersection: true                  // ...only where BOTH planes agree (a wedge, not a half)
    };
    if (meshData) {
      // vertexColors: true = use the per-point brightness that meshGeometry baked from the scan's relief.
      planetMaterial = new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: 1, metalness: 0 }, clipping));
    } else if (model.emissive) {
      // Stars make their own light: MeshBasicMaterial ignores lighting and shows the texture at full strength.
      planetMaterial = new THREE.MeshBasicMaterial(Object.assign({ map: toTexture(tex.map, true) }, clipping));
    } else {
      planetMaterial = new THREE.MeshStandardMaterial(Object.assign({
        map: toTexture(tex.map, true),
        bumpMap: tex.bump ? toTexture(tex.bump, false) : null,
        bumpScale: model.bumpScale || 0,      // how strongly the bump map shades craters
        roughness: model.roughness == null ? 0.9 : model.roughness,
        metalness: 0
      }, clipping));
    }
    // Asteroids get a lumpy, non-spherical mesh; everything else is a plain sphere.
    const geometry = meshData ? meshGeometry(meshData, model.mesh.color)
                   : model.shape ? asteroidGeometry(model.shape)
                   : new THREE.SphereGeometry(1, 128, 64);
    planetMesh = new THREE.Mesh(geometry, planetMaterial);
    tiltGroup.add(planetMesh);

    if (USE_ONLINE_TEXTURES && model.onlineMap) loadOnlineTexture(model.onlineMap);

    if (model.clouds) {
      cloudMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.012, 96, 48),
        new THREE.MeshStandardMaterial({ map: toTexture(OrbitTextures.clouds(model.clouds, TEX_W / 2, TEX_H / 2), true), transparent: true, depthWrite: false, roughness: 1 })
      );
      tiltGroup.add(cloudMesh);
    }
    if (model.atmosphere) buildAtmosphere(model.atmosphere);
    if (model.ring) buildRing(model.ring);
    if (model.moons) model.moons.forEach(buildMoon);
    if (anatomy.cutaway) buildCutaway();
  }

  // Optional upgrade: swap in a real photo texture when it has loaded.
  function loadOnlineTexture(url) {
    new THREE.TextureLoader().setCrossOrigin("anonymous").load(url, t => {
      t.encoding = THREE.sRGBEncoding; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      planetMaterial.map = t;
      planetMaterial.bumpMap = null;          // our procedural bumps wouldn't line up with the photo
      planetMaterial.needsUpdate = true;      // tell Three.js to rebuild the shader
    }, undefined, () => console.info("Online texture unavailable; keeping the procedural one."));
  }

  /* ---- Atmosphere: two glowing shells made with a tiny custom shader ----
     A "shader" is a small program that runs on the graphics card. Ours makes
     a FRESNEL glow: surfaces that face away from you (the planet's edge) glow
     brightest, just like the thin bright rim you see around Earth from orbit.
       • HALO  (BackSide, slightly bigger sphere) = glow fading into space
       • RIM   (FrontSide, hugging the surface)   = bright edge on the planet  */
  const ATMOS_VERT = `
    varying vec3 vNormalView; varying vec3 vNormalWorld; varying vec3 vViewDir;
    void main() {
      vNormalView  = normalize(normalMatrix * normal);        // normal in camera space
      vNormalWorld = normalize(mat3(modelMatrix) * normal);   // normal in world space
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mv.xyz);                          // direction from surface to camera
      gl_Position = projectionMatrix * mv;
    }`;
  const ATMOS_FRAG = `
    uniform vec3 uColor; uniform float uPower; uniform float uGain; uniform float uFront; uniform float uFlat; uniform vec3 uSunDir;
    varying vec3 vNormalView; varying vec3 vNormalWorld; varying vec3 vViewDir;
    void main() {
      float d = dot(normalize(vNormalView), normalize(vViewDir));       // 1 = facing us, 0 = edge-on
      // Front shell glows at the edge (1-d); back shell glows toward the planet (-d).
      float f = uFront > 0.5 ? pow(1.0 - clamp(d, 0.0, 1.0), uPower) : pow(clamp(-d, 0.0, 1.0), uPower);
      // Daylight side glows more than the night side.
      // (uFlat = 1 for stars, which glow evenly on every side because they ARE the light.)
      float sun = mix(0.3 + 0.7 * smoothstep(-0.25, 0.6, dot(normalize(vNormalWorld), uSunDir)), 1.0, uFlat);
      gl_FragColor = vec4(uColor, clamp(f * uGain * sun, 0.0, 1.0));
    }`;

  function atmosphereShell(radius, side, color, power, gain, front, flat, blending) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(radius, 96, 48),
      new THREE.ShaderMaterial({
        vertexShader: ATMOS_VERT, fragmentShader: ATMOS_FRAG,
        uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: power }, uGain: { value: gain }, uFront: { value: front }, uFlat: { value: flat ? 1 : 0 }, uSunDir: { value: SUN_DIR } },
        side: side, transparent: true, depthWrite: false, blending: blending || THREE.AdditiveBlending
      })
    );
  }
  function buildAtmosphere(a) {
    const halo = atmosphereShell(a.halo, THREE.BackSide, a.color, a.haloPower, a.haloGain, 0, a.flat);
    const rim = atmosphereShell(1.02, THREE.FrontSide, a.color, 3.2, a.rimGain, 1, a.flat);
    atmosphereMeshes.push(halo, rim);
    tiltGroup.add(halo, rim);
    // Stars get "limb darkening": their edge looks dimmer than the centre because we
    // see cooler, higher layers there. A black, edge-fading shell fakes it.
    if (a.limbDark) {
      const limb = atmosphereShell(1.004, THREE.FrontSide, 0x000000, 2.4, 0.75, 1, true, THREE.NormalBlending);
      atmosphereMeshes.push(limb);
      tiltGroup.add(limb);
    }
  }

  /* ---- Rings (Saturn, Uranus) ---- */
  function buildRing(r) {
    const geo = new THREE.RingGeometry(r.inner, r.outer, 192, 1);
    // RingGeometry's default UVs are a flat square. We want u to run from the
    // inner edge (0) to the outer edge (1) so our 1D band texture lines up.
    const pos = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - r.inner) / (r.outer - r.inner), 0.5);
    }
    ringMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      map: toTexture(OrbitTextures.ring(r), true), transparent: true, side: THREE.DoubleSide, roughness: 1, metalness: 0, depthWrite: false
    }));
    ringMesh.rotation.x = -Math.PI / 2;      // lay the ring flat in the planet's equatorial plane
    tiltGroup.add(ringMesh);
  }

  /* ---- Moons: each rides a pivot that spins, carrying the moon around it ---- */
  function buildMoon(m) {
    // base: holds the orbit's inclination. pivot: spins. mesh: sits at the orbit radius.
    const base = new THREE.Group();
    base.rotation.x = THREE.MathUtils.degToRad(m.inclination || 0);
    const pivot = new THREE.Group();

    let material;
    if (m.surface) {                           // e.g. Earth's Moon gets cratered terrain
      const t = OrbitTextures.surface(m.surface, 512, 256);
      material = new THREE.MeshStandardMaterial({ map: toTexture(t.map, true), bumpMap: t.bump ? toTexture(t.bump, false) : null, bumpScale: 0.03, roughness: 1 });
    } else if (m.emissive) {                   // e.g. Sirius B, a glowing white dwarf
      material = new THREE.MeshBasicMaterial({ color: m.color });
    } else {
      material = new THREE.MeshStandardMaterial({ color: m.color, roughness: 0.95 });
    }
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(m.size, 40, 28), material);
    mesh.position.x = m.distance;
    pivot.add(mesh);

    // A faint circle showing the orbit path.
    const pts = []; for (let i = 0; i < 128; i++) { const a = i / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * m.distance, 0, Math.sin(a) * m.distance)); }
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x72e4ff, transparent: true, opacity: 0.22 }));
    base.add(line, pivot);

    // Moons of giant planets orbit in the planet's tilted equator, so they join tiltGroup;
    // Earth's Moon is left in the untilted scene (its orbit is near the ecliptic, not Earth's equator).
    (model.moonFrame === "ecliptic" ? scene : tiltGroup).add(base);
    // period = seconds per lap in our model. Negative speed = orbiting backwards (Triton).
    moonRigs.push({ base, pivot, line, speed: (m.retrograde ? -1 : 1) * Math.PI * 2 / m.period });
  }

  /* ======================================================================
     5. CROSS-SECTION (CUTAWAY)  — the fix for the "clear sphere" bug
     ======================================================================
     HOW IT WORKS (three ideas):

     A) CLIPPING PLANES. A clipping plane is an invisible knife: everything on
        one side of it simply isn't drawn. Two planes, combined with
        clipIntersection = true, remove only the region where BOTH say
        "clip" — a wedge-shaped slice facing the camera. The planet's own
        textured surface is unchanged; it just has a wedge missing.

     B) CUT FACES. Clipping leaves the planet hollow (we'd see right through
        the hole!). So we plug it: flat half-discs lie exactly where the knife
        cut. Each half-disc is made of concentric rings, one ring per layer,
        each in that layer's colour. THAT is what you see: crust, mantle,
        outer core and inner core as clearly distinct bands.

     C) STAY GLUED. The planes live in WORLD space but the planet spins, so
        every frame updateClipping() re-aims the planes using the planet's
        current matrix. The cut faces are children of the planet mesh, so
        they turn with it automatically. While the cutaway is on we also park
        the spin and ease the wedge to face the camera.

     The wedge removes the region where z > |x| (a 90° slice centred on +Z,
     which is where the camera starts).                                      */

  function makeClipPlanes() {
    // A Plane is (normal direction, constant). Points with a NEGATIVE signed
    // distance from the plane are the ones that get clipped.
    //   plane 1 clips where z > x     plane 2 clips where z > -x
    const local = [
      new THREE.Plane(new THREE.Vector3(1, 0, -1).normalize(), 0),
      new THREE.Plane(new THREE.Vector3(-1, 0, -1).normalize(), 0)
    ];
    return { local, world: local.map(p => p.clone()) };
  }

  function buildCutaway() {
    cutGroup = new THREE.Group();
    cutGroup.visible = false;
    planetMesh.add(cutGroup);                       // child of the planet => turns with it

    // Two flat cut faces: one on each side of the wedge.
    //   face A lies on the plane z = x   (rotate a +X half-disc by -45°)
    //   face B lies on the plane z = -x  (rotate by -135°)
    const faceAngles = [-Math.PI / 4, -3 * Math.PI / 4];
    const items = anatomy.items;

    items.forEach((item, i) => {
      const outer = i === 0 ? 1 : items[i - 1].to;  // each layer starts where the one above ends
      const inner = item.to;
      const c = new THREE.Color(item.color);
      // A glowing (emissive) material so the layers stay vivid even in shadow.
      const mat = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.55, roughness: 0.7, side: THREE.DoubleSide });
      layerMaterials.push(mat);

      faceAngles.forEach(angle => {
        // RingGeometry(inner, outer, segments, rings, startAngle, sweep): a flat
        // annulus. Sweeping from -90° to +90° gives a half-ring on the +X side.
        const ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 64, 1, -Math.PI / 2, Math.PI), mat);
        ring.rotation.y = angle;
        cutGroup.add(ring);
      });
    });

    // Thin dark lines between layers make the boundaries crisp.
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x0a0f1f, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    items.slice(0, -1).forEach(item => {
      faceAngles.forEach(angle => {
        const line = new THREE.Mesh(new THREE.RingGeometry(item.to - 0.004, item.to + 0.004, 64, 1, -Math.PI / 2, Math.PI), lineMat);
        line.rotation.y = angle;
        cutGroup.add(line);
      });
    });
  }

  // Glow the chosen layer, dim the others. i = -1 clears the highlight.
  function highlightLayer(i) {
    if (isBelt) {                                              // belt: highlight an asteroid type instead
      belt.typeMaterials.forEach((m, n) => { m.emissive.set(n === i ? anatomy.items[n].color : 0x000000); m.emissiveIntensity = n === i ? 0.9 : 0; });
      return;
    }
    layerMaterials.forEach((m, n) => { m.emissiveIntensity = i < 0 ? 0.55 : (n === i ? 1.25 : 0.14); });
  }

  // Shortest signed angle (in radians) equivalent to `a`.
  const shortestAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

  // Runs every frame: re-aim (or disable) the clipping planes.
  function updateClipping(dt) {
    if (!clipPlanes) return;
    if (state.cutaway) {
      // Ease the planet's spin back to 0 so the wedge faces the camera.
      planetMesh.rotation.y += shortestAngle(-planetMesh.rotation.y) * Math.min(1, dt * 5);
      planetMesh.updateWorldMatrix(true, false);              // make sure its matrix is current
      clipPlanes.world.forEach((p, n) => p.copy(clipPlanes.local[n]).applyMatrix4(planetMesh.matrixWorld));
    } else {
      // "Disable" by pushing both planes far away: nothing is on their clip side.
      clipPlanes.world.forEach(p => { p.normal.set(0, 1, 0); p.constant = 1e6; });
    }
  }

  /* ======================================================================
     6. ASTEROIDS: individual shapes and the belt
     ====================================================================== */
  // Look up a real mesh by name (the models/<name>.js files add themselves to window.ORBIT_MESHES).
  function meshEntry() { return (window.ORBIT_MESHES && ORBIT_MESHES[model.mesh.id]) || null; }

  // Decode a model made by tools/build_meshes.py into a Three.js geometry.
  // The file stores three things (see that script's header for the layout):
  //   positions (int16, -32767..32767 = -1..1), triangle indices (uint16), and a
  //   "relief" byte per point. We turn relief into vertex colours: hollows (craters)
  //   get darker and bumps brighter, plus a little noise so the rock isn't flat grey.
  function meshGeometry(m, baseHex) {
    const text = atob(m.data);                                      // base64 text -> raw bytes
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
    const buf = bytes.buffer;
    const p16 = new Int16Array(buf, 0, m.n * 3);
    const index = new Uint16Array(buf, m.io, m.t * 3);
    const relief = new Uint8Array(buf, m.ro, m.n);

    const pos = new Float32Array(m.n * 3), col = new Float32Array(m.n * 3);
    const noise = OrbitTextures.noise3D(11), base = new THREE.Color(baseHex);
    for (let i = 0; i < m.n; i++) {
      const x = p16[i * 3] / 32767, y = p16[i * 3 + 1] / 32767, z = p16[i * 3 + 2] / 32767;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      const shade = (0.32 + 1.36 * relief[i] / 255) * (0.88 + 0.24 * OrbitTextures.fbm(noise, x * 6, y * 6, z * 6, 3));
      col[i * 3] = base.r * shade; col[i * 3 + 1] = base.g * shade; col[i * 3 + 2] = base.b * shade;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    geo.computeVertexNormals();                                      // smooth lighting from the shared points
    return geo;
  }

  // Build a visited asteroid's shape. Start with a detailed sphere, then for every
  // vertex scale its distance from the centre (r) with a few simple rules:
  //   waist/neck/asym  -> a "contact binary" of two lobes (Itokawa, Eros, Ida)
  //   ridge            -> spinning-top bulge around the equator (Bennu, Ryugu)
  //   rough            -> noise lumps          basin -> giant south-polar crater (Vesta)
  // Finally squash the x/y/z axes to the asteroid's real proportions (radii).
  function asteroidGeometry(sh) {
    const W = 192, H = 96;
    const geo = new THREE.SphereGeometry(1, W, H);
    const noise = OrbitTextures.noise3D(sh.seed || 1), clamp = OrbitTextures.clamp;
    const pos = geo.attributes.position, d = new THREE.Vector3();
    const big = Math.max(sh.radii[0], sh.radii[1], sh.radii[2]);       // longest axis becomes 1
    for (let i = 0; i < pos.count; i++) {
      d.fromBufferAttribute(pos, i).normalize();                       // unit direction of this vertex
      let r = 1;
      if (sh.waist) r *= 1 - sh.waist * Math.exp(-Math.pow((d.x - (sh.neck || 0)) / 0.25, 2));   // pinch the middle
      if (sh.asym)  r *= 1 + sh.asym * d.x;                            // one lobe bigger than the other
      if (sh.ridge) r *= 1 + sh.ridge * Math.exp(-Math.pow(d.y / 0.5, 2)) - sh.ridge * 0.5 * d.y * d.y;   // equator bulge, flatter poles
      const lump = OrbitTextures.fbm(noise, d.x * 2.2 + 3, d.y * 2.2, d.z * 2.2, 4) - 0.5;
      r *= 1 + lump * 2 * (sh.rough || 0);
      if (sh.basin) {
        const ang = Math.acos(clamp(-d.y, -1, 1)), size = sh.basin.size;   // angle away from the south pole
        if (ang < size) { const t = ang / size; r *= 1 - sh.basin.depth * (1 - t * t); }                  // the bowl
        r *= 1 + 0.05 * Math.exp(-Math.pow((ang / size - 1) / 0.1, 2));                                   // raised rim
        r *= 1 + 0.1 * Math.exp(-Math.pow(ang / (size * 0.16), 2));                                       // central peak
      }
      pos.setXYZ(i, d.x * r * sh.radii[0] / big, d.y * r * sh.radii[1] / big + (sh.bend || 0) * (1 - d.x * d.x), d.z * r * sh.radii[2] / big);
    }
    geo.computeVertexNormals();
    // The texture seam duplicates vertices, which can leave a faint lighting line. Average the seam normals.
    const nor = geo.attributes.normal, a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let row = 0; row <= H; row++) {
      const first = row * (W + 1), last = first + W;
      a.fromBufferAttribute(nor, first).add(b.fromBufferAttribute(nor, last)).normalize();
      nor.setXYZ(first, a.x, a.y, a.z); nor.setXYZ(last, a.x, a.y, a.z);
    }
    return geo;
  }

  /* ---- The asteroid belt (the "Asteroid Belt" page) ---- */
  // Build one lumpy rock: start with a low-poly sphere, push each vertex in/out
  // using noise, then stretch it. Because the shape is "non-indexed" each face
  // gets its own normal, giving a faceted, rocky look.
  function rockGeometry(seed, roughness, stretch) {
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const noise = OrbitTextures.noise3D(seed), pos = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // Noise depends only on position, so duplicated corner vertices move identically (no cracks).
      const n = OrbitTextures.fbm(noise, v.x * 1.6 + seed, v.y * 1.6, v.z * 1.6, 3);
      v.multiplyScalar(1 + (n - 0.5) * roughness * 2);
      pos.setXYZ(i, v.x * stretch[0], v.y * stretch[1], v.z * stretch[2]);
    }
    geo.computeVertexNormals();
    return geo;
  }

  function buildBelt() {
    // In the belt the Sun is in the middle, so light everything from the centre.
    sunlight.visible = false;
    scene.add(new THREE.PointLight(0xfff1d6, 2.6, 0, 0));      // (colour, intensity, distance 0 = infinite, decay 0 = no falloff)
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), new THREE.MeshBasicMaterial({ color: 0xffc15a })));
    scene.add(makeGlowSprite(0xffb347, 2.4));

    const rand = OrbitTextures.mulberry32(77);
    const dummy = new THREE.Object3D(), tint = new THREE.Color();

    // Orbit guides for context: Mars's orbit (1.5 AU) inside and Jupiter's (5.2 AU) outside.
    [[1.52, 0xd9603b, 0.05], [5.2, 0xd5a47b, 0.16]].forEach(([radius, color, size]) => {
      const pts = []; for (let i = 0; i < 160; i++) { const a = i / 160 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)); }
      const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 }));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.8, emissive: color, emissiveIntensity: 0.25 }));
      const pivot = new THREE.Group(); dot.position.x = radius; pivot.add(dot);
      scene.add(line, pivot);
      belt.guides.push(line);
      belt.bodies.push({ pivot, speed: 0.05 * Math.pow(radius / 2.7, -1.5) });   // Kepler: far = slow
    });

    // Three rock shapes and three material "types" (C dark, S stony, M metallic).
    const shapes = [rockGeometry(1, 0.35, [1, 0.8, 0.9]), rockGeometry(2, 0.3, [1.7, 0.7, 0.8]), rockGeometry(3, 0.55, [1, 1, 1])];
    const typeColours = anatomy.items.map(i => new THREE.Color(i.color));
    const baseTone = [0.55, 0.85, 0.9];                                            // darker C, brighter S/M
    belt.typeMaterials = [
      new THREE.MeshStandardMaterial({ roughness: 1 }),                            // C
      new THREE.MeshStandardMaterial({ roughness: 0.9 }),                          // S
      new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.35 })         // M (shiny-ish)
    ];

    // Sample 4,200 asteroids. Density peaks mid-belt and dips at Jupiter's "Kirkwood gaps".
    const gaps = [2.5, 2.82, 2.95, 3.27];
    const buckets = {};
    let made = 0;
    while (made < 4200) {
      const a = 2.1 + rand() * 1.2;                                                // distance from Sun (AU)
      let density = 0.25 + 0.75 * Math.exp(-Math.pow((a - 2.7) / 0.5, 2));
      gaps.forEach(g => { density *= 1 - 0.92 * Math.exp(-Math.pow((a - g) / 0.02, 2)); });
      if (rand() > density) continue;                                              // rejection sampling
      made++;
      const angle = rand() * Math.PI * 2;
      const type = rand() < 0.75 ? 0 : (rand() < 0.68 ? 1 : 2);                    // ~75% C, ~17% S, ~8% M
      const shape = Math.floor(rand() * 3);
      const bin = Math.min(3, Math.floor((a - 2.1) / 0.3));                        // 4 radial bins
      const k = bin + "|" + type + "|" + shape;
      (buckets[k] = buckets[k] || { bin, type, shape, items: [] }).items.push({
        x: Math.cos(angle) * a, z: Math.sin(angle) * a,
        y: (rand() + rand() + rand() - 1.5) * 0.09,                                 // thin disc, bell-shaped thickness
        size: 0.011 + Math.pow(rand(), 3.2) * 0.05,                                 // many small, few big
        tone: 0.75 + rand() * 0.4, rot: [rand() * 6.28, rand() * 6.28, rand() * 6.28],
        squash: [0.75 + rand() * 0.5, 0.75 + rand() * 0.5, 0.75 + rand() * 0.5]
      });
    }

    // Each radial bin is a group that rotates at its own Kepler speed (inner = faster).
    for (let b = 0; b < 4; b++) {
      const g = new THREE.Group(); scene.add(g);
      belt.bins.push({ group: g, speed: 0.05 * Math.pow((2.25 + b * 0.3) / 2.7, -1.5) });
    }
    Object.values(buckets).forEach(bk => {
      // InstancedMesh draws thousands of copies of one shape in a single GPU call.
      const mesh = new THREE.InstancedMesh(shapes[bk.shape], belt.typeMaterials[bk.type], bk.items.length);
      bk.items.forEach((it, i) => {
        dummy.position.set(it.x, it.y, it.z);
        dummy.rotation.set(it.rot[0], it.rot[1], it.rot[2]);
        dummy.scale.set(it.size * it.squash[0], it.size * it.squash[1], it.size * it.squash[2]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        tint.copy(typeColours[bk.type]).multiplyScalar(it.tone * baseTone[bk.type] / 0.85);
        mesh.setColorAt(i, tint);                                                   // per-rock colour variation
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
      belt.bins[bk.bin].group.add(mesh);
    });

    // Two famous residents, much bigger than the rest: Ceres (dwarf planet) and Vesta.
    const ceresTex = OrbitTextures.surface({ kind: "cratered", preset: "ceres", seed: 9 }, 512, 256);
    const ceres = new THREE.Mesh(new THREE.SphereGeometry(0.085, 48, 32), new THREE.MeshStandardMaterial({ map: toTexture(ceresTex.map, true), bumpMap: toTexture(ceresTex.bump, false), bumpScale: 0.03, roughness: 1 }));
    const vesta = new THREE.Mesh(rockGeometry(5, 0.22, [1, 0.85, 0.95]), new THREE.MeshStandardMaterial({ color: 0xb8a58f, roughness: 1 }));
    vesta.scale.setScalar(0.06);
    [[ceres, 2.77, 0.8], [vesta, 2.36, 3.6]].forEach(([mesh, a, start]) => {
      const pivot = new THREE.Group(); mesh.position.x = a; pivot.add(mesh); pivot.rotation.y = start;
      scene.add(pivot);
      belt.bodies.push({ pivot, speed: 0.05 * Math.pow(a / 2.7, -1.5), spinMesh: mesh });
    });
  }

  /* ======================================================================
     7. INTERACTION, ANIMATION LOOP, START-UP
     ====================================================================== */
  // Show/hide parts of the scene according to the toggle state.
  function applyState() {
    if (!scene) return;
    const cut = !!(state.cutaway && cutGroup);
    if (cutGroup) cutGroup.visible = cut;
    // Gas shells would hide the cut faces, so the atmosphere steps aside during a cross-section.
    atmosphereMeshes.forEach(m => { m.visible = state.atmosphere && !cut; });
    if (cloudMesh) cloudMesh.visible = state.atmosphere && !cut;
    if (ringMesh) ringMesh.visible = state.rings;
    moonRigs.forEach(r => { r.base.visible = state.moons; r.line.visible = state.orbits; });
    belt.guides.forEach(g => { g.visible = state.orbits; });
    belt.bodies.forEach(b => { b.pivot.visible = state.orbits || !!b.spinMesh; });
  }

  // Move the camera around the target by rotating/zooming. Used by buttons and keys.
  function orbitBy(dTheta, dPhi, zoom) {
    const offset = camera.position.clone().sub(controls.target);
    const s = new THREE.Spherical().setFromVector3(offset);       // (radius, polar angle phi, azimuth theta)
    s.theta += dTheta;
    s.phi = Math.min(Math.PI - 0.1, Math.max(0.1, s.phi + dPhi));
    s.radius = Math.min(controls.maxDistance, Math.max(controls.minDistance, s.radius * zoom));
    offset.setFromSpherical(s);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }
  function resetView() {
    camera.position.set(cameraStart.x, cameraStart.y, cameraStart.z);
    controls.target.set(0, 0, 0);
    controls.update();
    announce("View reset.");
  }

  const ACTIONS = {
    left: () => orbitBy(-0.25, 0, 1), right: () => orbitBy(0.25, 0, 1),
    up: () => orbitBy(0, -0.18, 1), down: () => orbitBy(0, 0.18, 1),
    in: () => orbitBy(0, 0, 0.85), out: () => orbitBy(0, 0, 1.18), reset: resetView
  };

  function wireInteraction() {
    // On-screen buttons (great for touch, and for people who can't drag a mouse).
    document.querySelectorAll("[data-action]").forEach(b => b.addEventListener("click", () => ACTIONS[b.dataset.action]()));
    // Keyboard: the 3D area is focusable; arrows rotate, +/- zoom, R resets.
    $("scene").addEventListener("keydown", e => {
      const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", "+": "in", "=": "in", "-": "out", "_": "out", r: "reset", R: "reset" };
      if (map[e.key]) { e.preventDefault(); ACTIONS[map[e.key]](); }
    });
    // Keep the canvas matched to its container whenever the layout changes size.
    new ResizeObserver(resize).observe($("scene"));
    resize();
  }
  function resize() {
    const host = $("scene"), w = host.clientWidth, h = host.clientHeight;
    if (!w || !h || !renderer) return;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);                    // false: don't override the CSS size
  }

  // The animation loop: runs ~60 times per second.
  let clock = null;
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);      // seconds since last frame (capped after tab switches)
    if (state.spin) {
      // Planet spin (paused during the cutaway so the wedge keeps facing us).
      if (planetMesh && !state.cutaway) planetMesh.rotation.y += model.spin * dt;
      if (cloudMesh) cloudMesh.rotation.y += model.spin * 1.25 * dt;       // clouds drift a little faster
      moonRigs.forEach(r => { r.pivot.rotation.y += r.speed * dt; });
      belt.bins.forEach(b => { b.group.rotation.y += b.speed * dt; });
      belt.bodies.forEach(b => { b.pivot.rotation.y += b.speed * dt; if (b.spinMesh) b.spinMesh.rotation.y += 0.4 * dt; });
    }
    updateClipping(dt);
    controls.update();                                // applies damping/inertia
    renderer.render(scene, camera);
  }

  function start() {
    fillPage();
    buildToggles();
    if (typeof THREE === "undefined") { loadingEl.textContent = "3D library could not load (check your internet connection). The facts below still work!"; return; }
    if (!setupScene()) return;
    clock = new THREE.Clock();
    // Let the browser paint the "Building your world…" message BEFORE the heavy texture work starts.
    requestAnimationFrame(() => setTimeout(() => {
      if (isBelt) buildBelt(); else buildBody();
      const d = model.camera, elevation = model.elevation || (isBelt ? 0.32 : 0.14);
      cameraStart.x = 0; cameraStart.y = d * elevation; cameraStart.z = d;
      camera.position.set(cameraStart.x, cameraStart.y, cameraStart.z);
      controls.target.set(0, 0, 0);
      wireInteraction();
      applyState();
      loadingEl.classList.add("hidden");
      animate();
    }, 30));
  }
  start();
})();
