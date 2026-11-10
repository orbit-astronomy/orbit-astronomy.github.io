/* ==========================================================================
   ORBIT — sky.js  (the interactive night sky)
   --------------------------------------------------------------------------
   You stand at the centre of a huge invisible sphere (the "celestial
   sphere") with stars painted on the inside. The camera never moves; it only
   TURNS, like your head. We use real star positions from sky-data.js.

   THE KEY IDEA: turning RA/DEC into a 3D direction (see skyDir below):
       x =  cos(dec) * cos(ra)       y = sin(dec)       z = -cos(dec) * sin(ra)
   The minus sign on z makes right ascension grow to the LEFT as you look at
   the sky, exactly like a real star chart (east is on the left).

   WHERE EACH THING COMES FROM
     • Named stars + constellation figures: REAL positions (sky-data.js).
     • The Milky Way band and faint background stars: RANDOM, but placed
       along the true plane of our galaxy so the band is in the right place.
   ========================================================================== */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const D2R = Math.PI / 180;
  const R = 50;                                   // radius of our sky sphere (any size works)
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loadingEl = $("loading");

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  const announce = m => { const s = $("status"); if (s) s.textContent = m; };

  /* ---------------------------------------------------------------- maths */
  // RA in hours, DEC in degrees -> a point on our sphere (as a Three.js Vector3).
  function skyDir(raHours, decDeg) {
    const a = raHours * 15 * D2R, d = decDeg * D2R;
    return new THREE.Vector3(Math.cos(d) * Math.cos(a), Math.sin(d), -Math.cos(d) * Math.sin(a));
  }
  // Same idea for the camera's look direction, using longitude/latitude in radians.
  function lookDir(lon, lat) { return new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)); }
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));            // shortest signed angle

  // Star colour from spectral class (O/B blue ... M red).
  const CLASS_COLOURS = { O: [0.62, 0.72, 1.0], B: [0.68, 0.78, 1.0], A: [0.85, 0.9, 1.0], F: [1.0, 0.98, 0.92], G: [1.0, 0.93, 0.74], K: [1.0, 0.78, 0.52], M: [1.0, 0.62, 0.42] };
  const CLASS_NAMES = { O: "blue (O-type)", B: "blue-white (B-type)", A: "white (A-type)", F: "yellow-white (F-type)", G: "yellow (G-type)", K: "orange (K-type)", M: "red (M-type)" };
  // Pixel size for a star from its magnitude: brighter (smaller magnitude) = bigger.
  const sizeFromMag = mag => 2 + 8.5 * Math.pow(10, -0.17 * mag);

  /* ----------------------------------------------------------------- state */
  const state = { lines: true, names: true, starNames: true, guides: true, twinkle: !prefersReducedMotion };
  const view = { lon: 5.6 * 15 * D2R, lat: 0.05, fov: 62 };            // where we are looking (start on Orion)
  const goal = { lon: view.lon, lat: view.lat, fov: view.fov, active: false };
  let selectedCon = null, selectedStar = null;

  /* ---------------------------------------------------------- page content */
  const toggleDefs = [
    { key: "lines", label: "Constellation lines", hint: "Join the dots" },
    { key: "names", label: "Constellation names", hint: "Label each figure" },
    { key: "starNames", label: "Star names", hint: "Bright stars and your selection" },
    { key: "guides", label: "Sky guides", hint: "Celestial equator and the Sun's path" },
    { key: "twinkle", label: "Twinkle", hint: "Gentle shimmer" }
  ];
  const toggleInputs = {};
  function buildToggles() {
    toggleDefs.forEach(t => {
      const row = el("label", "toggle-row"); row.htmlFor = "toggle-" + t.key;
      const text = el("span"); text.append(el("strong", "", t.label), el("small", "", t.hint));
      const input = el("input"); input.type = "checkbox"; input.id = "toggle-" + t.key; input.checked = state[t.key];
      input.addEventListener("change", () => { state[t.key] = input.checked; applyState(); announce(t.label + (input.checked ? " on." : " off.")); });
      row.append(text, input, el("span", "toggle-ui"));
      $("toggle-list").append(row); toggleInputs[t.key] = input;
    });
  }

  function buildConList() {
    const list = $("con-list");
    SKY.constellations.forEach(c => {
      const b = el("button", "layer-btn"); b.type = "button"; b.setAttribute("aria-pressed", "false"); b.dataset.id = c.id;
      const sw = el("i"); sw.style.background = "#72e4ff"; sw.setAttribute("aria-hidden", "true");
      const label = el("span"); label.append(el("strong", "", c.name), el("small", "", c.meaning));
      b.append(sw, label);
      b.addEventListener("click", () => selectConstellation(selectedCon && selectedCon.id === c.id ? null : c.id));
      list.append(b);
    });
  }

  function fillFacts() {
    SKY.facts.forEach((f, i) => {
      const card = el("article", "fact-card");
      card.append(el("span", "fact-num", String(i + 1).padStart(2, "0")), el("h3", "", f.h), el("p", "", f.t));
      $("fact-grid").append(card);
    });
  }

  // Detail panel for the selected constellation (+ buttons for each of its stars).
  function showConDetail() {
    const box = $("con-detail"); box.replaceChildren();
    if (!selectedCon) { box.append(el("p", "layer-hint", "Pick a constellation to fly there and read its story.")); return; }
    const c = selectedCon;
    box.append(el("h3", "", c.name), el("span", "layer-depth", c.meaning));
    box.append(el("p", "", c.story));
    const meta = el("dl", "sky-meta");
    [["Best seen", c.season], ["Where", c.where], ["Brightest star", SKY.stars[c.brightest][0]], ["How to find it", c.tip]].forEach(([k, v]) => {
      const row = el("div"); row.append(el("dt", "", k), el("dd", "", v)); meta.append(row);
    });
    box.append(meta);
    const chips = el("div", "star-chips"); chips.setAttribute("aria-label", "Stars in " + c.name);
    c.stars.slice().sort((a, b) => SKY.stars[a][3] - SKY.stars[b][3]).forEach(id => {
      const b = el("button", "chip", SKY.stars[id][0]); b.type = "button"; b.setAttribute("aria-pressed", String(selectedStar === id));
      b.addEventListener("click", () => selectStar(id)); chips.append(b);
    });
    box.append(chips);
  }

  function showStarDetail() {
    const box = $("star-detail"); box.replaceChildren();
    if (!selectedStar) { box.append(el("p", "layer-hint", "Select a star (a button above, or its label) to learn about it.")); return; }
    const s = SKY.stars[selectedStar];
    box.append(el("h3", "", s[0]));
    const meta = el("dl", "sky-meta");
    [["Colour", CLASS_NAMES[s[4]]], ["Brightness", "Magnitude " + s[3].toFixed(2) + " (lower = brighter)"],
     ["Distance", s[5] ? "About " + s[5].toLocaleString() + " light-years" : "Not listed"],
     ["Position", "RA " + s[1].toFixed(2) + " h, Dec " + (s[2] >= 0 ? "+" : "") + s[2].toFixed(1) + "°"]].forEach(([k, v]) => {
      const row = el("div"); row.append(el("dt", "", k), el("dd", "", v)); meta.append(row);
    });
    box.append(meta);
    if (SKY.notes[selectedStar]) box.append(el("p", "", SKY.notes[selectedStar]));
  }

  /* ------------------------------------------------------------- 3D scene */
  let renderer, scene, camera, starMat, conLines = [], guideObjs = [], ringSprite;
  const labelEls = [];          // { el, pos: Vector3, kind, id }

  function setup() {
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
    catch (e) { loadingEl.textContent = "3D sky unavailable: your browser could not start WebGL. The constellation guide still works."; return false; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    $("sky").appendChild(renderer.domElement);
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x02040b);
    camera = new THREE.PerspectiveCamera(view.fov, 1, 0.1, 500);        // sits at the origin and only rotates
    return true;
  }

  // All stars are drawn as soft glowing points with one tiny shader.
  // Each point has its own size (from magnitude), colour and a twinkle phase.
  function makePoints(positions, sizes, colours, phases, alphaScale) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(colours, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 1 }, uTime: { value: 0 }, uTwinkle: { value: 1 }, uAlpha: { value: alphaScale } },
      vertexShader: `
        attribute float aSize; attribute vec3 aColor; attribute float aPhase;
        uniform float uScale; uniform float uTime; uniform float uTwinkle;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          float shimmer = 1.0 + uTwinkle * 0.14 * sin(uTime * 2.3 + aPhase * 6.2831);   // each star shimmers out of step
          gl_PointSize = aSize * uScale * shimmer;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec3 vColor; uniform float uAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);            // distance from the point's centre (0..0.7)
          if (d > 0.5) discard;
          float halo = pow(1.0 - d * 2.0, 2.2);              // soft glow
          float core = smoothstep(0.16, 0.0, d);             // bright centre
          gl_FragColor = vec4(vColor * (halo + core), (halo * 0.85 + core) * uAlpha);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    return { points: new THREE.Points(g, m), material: m };
  }

  function buildStars() {
    // 1) Real, named stars.
    const ids = Object.keys(SKY.stars), n = ids.length;
    const pos = new Float32Array(n * 3), size = new Float32Array(n), col = new Float32Array(n * 3), ph = new Float32Array(n);
    ids.forEach((id, i) => {
      const s = SKY.stars[id], p = skyDir(s[1], s[2]).multiplyScalar(R), c = CLASS_COLOURS[s[4]];
      pos.set([p.x, p.y, p.z], i * 3); size[i] = sizeFromMag(s[3]); col.set(c, i * 3); ph[i] = Math.random();
    });
    const real = makePoints(pos, size, col, ph, 1.0);
    starMat = real.material; scene.add(real.points);

    // 2) Faint background stars (random positions).
    const rnd = OrbitTextures.mulberry32(2024), bgN = 1600;
    const p2 = new Float32Array(bgN * 3), s2 = new Float32Array(bgN), c2 = new Float32Array(bgN * 3), f2 = new Float32Array(bgN);
    for (let i = 0; i < bgN; i++) {
      const z = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - z * z);
      p2.set([r * Math.cos(a) * R, z * R, r * Math.sin(a) * R], i * 3);
      s2[i] = sizeFromMag(4.2 + rnd() * 2.4);
      const t = rnd(); c2.set(t < 0.2 ? CLASS_COLOURS.K : t < 0.6 ? CLASS_COLOURS.A : CLASS_COLOURS.F, i * 3); f2[i] = rnd();
    }
    scene.add(makePoints(p2, s2, c2, f2, 0.75).points);

    // 3) The Milky Way: thousands of faint stars plus soft glow, concentrated near the galactic plane.
    //    We pick a galactic longitude/latitude and rotate into equatorial coordinates with the standard matrix.
    const M = [[-0.0548755604, 0.4941094279, -0.8676661490], [-0.8734370902, -0.4448296300, -0.1980763734], [-0.4838350155, 0.7469822445, 0.4559837762]];
    const mwN = 6500, p3 = new Float32Array(mwN * 3), s3 = new Float32Array(mwN), c3 = new Float32Array(mwN * 3), f3 = new Float32Array(mwN);
    const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 1.2;
    for (let i = 0; i < mwN; i++) {
      const l = rnd() * Math.PI * 2;
      const centre = 0.5 + 0.5 * Math.cos(l);                                  // thicker, brighter toward the galactic centre (l = 0)
      const b = gauss() * (0.09 + 0.07 * centre);                              // latitude above/below the plane (radians)
      const gx = Math.cos(b) * Math.cos(l), gy = Math.cos(b) * Math.sin(l), gz = Math.sin(b);
      const ex = M[0][0] * gx + M[0][1] * gy + M[0][2] * gz, ey = M[1][0] * gx + M[1][1] * gy + M[1][2] * gz, ez = M[2][0] * gx + M[2][1] * gy + M[2][2] * gz;
      p3.set([ex * R, ez * R, -ey * R], i * 3);                                // our y is "up" (north), z is -equatorial y
      s3[i] = i % 9 === 0 ? 9 + rnd() * 10 : 1.6 + rnd() * 1.6;                // a few big dim blobs make a soft glow
      const warm = 0.75 + 0.25 * centre; c3.set([0.7 * warm, 0.76 * warm, 0.95], i * 3); f3[i] = rnd();
    }
    const mw = makePoints(p3, s3, c3, f3, 0.16); scene.add(mw.points);
  }

  // Constellation figures: one LineSegments object each, so we can highlight just one.
  function buildConstellations() {
    SKY.constellations.forEach(c => {
      if (!c.lines.length) { c.obj = null; } else {
        const arr = [];
        c.lines.forEach(([a, b]) => { [a, b].forEach(id => { const s = SKY.stars[id], p = skyDir(s[1], s[2]).multiplyScalar(R * 0.997); arr.push(p.x, p.y, p.z); }); });
        const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(arr), 3));
        const mat = new THREE.LineBasicMaterial({ color: 0x72e4ff, transparent: true, opacity: 0.32, depthWrite: false });
        c.obj = new THREE.LineSegments(g, mat); scene.add(c.obj);
      }
      // Centre of the figure (average direction) – used for the name label and for flying there.
      const sum = new THREE.Vector3(); c.stars.forEach(id => sum.add(skyDir(SKY.stars[id][1], SKY.stars[id][2])));
      c.centre = sum.normalize();
      c.lon = Math.atan2(-c.centre.z, c.centre.x); c.lat = Math.asin(c.centre.y);
      let widest = 0; c.stars.forEach(id => { widest = Math.max(widest, Math.acos(Math.min(1, c.centre.dot(skyDir(SKY.stars[id][1], SKY.stars[id][2]))))); });
      c.fov = Math.min(78, Math.max(32, widest / D2R * 2.9));
    });
  }

  // Two reference circles: the celestial equator (Earth's equator projected onto the sky)
  // and the ecliptic (the path of the Sun, Moon and planets), tilted 23.44 degrees.
  function buildGuides() {
    const eq = [], ec = [], eps = 23.44 * D2R;
    for (let i = 0; i < 200; i++) {
      const a = i / 200 * Math.PI * 2;
      eq.push(skyDir(a / (15 * D2R), 0).multiplyScalar(R * 0.995));
      const x = Math.cos(a), y = Math.sin(a) * Math.cos(eps), z = Math.sin(a) * Math.sin(eps);   // ecliptic point in equatorial coords
      ec.push(skyDir(Math.atan2(y, x) / (15 * D2R), Math.asin(z) / D2R).multiplyScalar(R * 0.995));
    }
    [[eq, 0x5f86c8, 0.4], [ec, 0xffb74d, 0.5]].forEach(([pts, color, opacity]) => {
      const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
      scene.add(l); guideObjs.push(l);
    });
    // A ring that marks the selected star.
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    g.strokeStyle = "#ffffff"; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 46, 0, Math.PI * 2); g.stroke();
    ringSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
    ringSprite.scale.set(3.4, 3.4, 1); ringSprite.visible = false; scene.add(ringSprite);
  }

  /* ---------------------------------------------------------------- labels */
  // Labels are ordinary HTML <div>s positioned over the canvas, so they stay crisp and accessible.
  function buildLabels() {
    const host = $("sky-labels");
    SKY.constellations.forEach(c => {
      if (c.id === "bright") return;
      const d = el("div", "sky-label con", c.name); host.append(d); labelEls.push({ el: d, pos: c.centre.clone().multiplyScalar(R), kind: "con", id: c.id });
    });
    Object.keys(SKY.stars).forEach(id => {
      const s = SKY.stars[id], d = el("div", "sky-label star", s[0].replace(/ \(.*\)/, "")); host.append(d);
      labelEls.push({ el: d, pos: skyDir(s[1], s[2]).multiplyScalar(R), kind: "star", id, mag: s[3] });
    });
  }
  const tmp = new THREE.Vector3();
  function updateLabels(w, h) {
    labelEls.forEach(L => {
      let show = L.kind === "con" ? state.names : state.starNames && (L.mag < 1.6 || (selectedCon && selectedCon.stars.includes(L.id)) || L.id === selectedStar);
      if (show) {
        tmp.copy(L.pos).project(camera);                                       // to screen coordinates (-1..1)
        show = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
        if (show) L.el.style.transform = "translate(" + ((tmp.x * 0.5 + 0.5) * w) + "px," + ((-tmp.y * 0.5 + 0.5) * h) + "px) translate(-50%,-50%)";
      }
      if (show !== L.shown) { L.el.style.display = show ? "" : "none"; L.shown = show; }
      if (show) L.el.classList.toggle("active", (L.kind === "con" && selectedCon && selectedCon.id === L.id) || (L.kind === "star" && L.id === selectedStar));
    });
  }

  /* -------------------------------------------------------- state -> scene */
  function applyState() {
    conLines.length = 0;
    SKY.constellations.forEach(c => { if (c.obj) { c.obj.visible = state.lines; c.obj.material.opacity = selectedCon === c ? 0.95 : (selectedCon ? 0.2 : 0.32); c.obj.material.color.set(selectedCon === c ? 0xffffff : 0x72e4ff); } });
    guideObjs.forEach(g => { g.visible = state.guides; });
    if (starMat) starMat.uniforms.uTwinkle.value = state.twinkle ? 1 : 0;
  }

  function selectConstellation(id) {
    selectedCon = id ? SKY.constellations.find(c => c.id === id) : null;
    document.querySelectorAll("#con-list .layer-btn").forEach(b => b.setAttribute("aria-pressed", String(selectedCon && b.dataset.id === selectedCon.id)));
    if (selectedCon && !selectedCon.noFly && selectedCon.lon !== undefined) { goal.lon = selectedCon.lon; goal.lat = selectedCon.lat; goal.fov = selectedCon.fov; goal.active = true; }
    if (!selectedCon || !selectedCon.stars.includes(selectedStar)) { selectedStar = null; ringSprite && (ringSprite.visible = false); showStarDetail(); }
    showConDetail(); applyState();
    announce(selectedCon ? "Showing " + selectedCon.name + "." : "Constellation cleared.");
  }
  function selectStar(id) {
    selectedStar = id; const s = SKY.stars[id];
    const p = skyDir(s[1], s[2]); ringSprite.position.copy(p.clone().multiplyScalar(R * 0.99)); ringSprite.visible = true;
    goal.lon = Math.atan2(-p.z, p.x); goal.lat = Math.asin(p.y); goal.fov = Math.min(goal.fov, 52); goal.active = true;
    showStarDetail(); showConDetail(); announce("Selected " + s[0] + ".");
  }

  /* --------------------------------------------------------- interaction */
  function nudge(dLon, dLat, zoom) {
    goal.active = false;
    view.lon = wrap(view.lon + dLon * view.fov / 60); view.lat = Math.max(-1.5, Math.min(1.5, view.lat + dLat * view.fov / 60));
    view.fov = Math.max(12, Math.min(90, view.fov * zoom)); goal.fov = view.fov;
  }
  const ACTIONS = { left: () => nudge(0.12, 0, 1), right: () => nudge(-0.12, 0, 1), up: () => nudge(0, 0.1, 1), down: () => nudge(0, -0.1, 1),
                    in: () => nudge(0, 0, 0.85), out: () => nudge(0, 0, 1.18), reset: () => { goal.lon = 5.6 * 15 * D2R; goal.lat = 0.05; goal.fov = 62; goal.active = true; announce("View reset to Orion."); } };

  function wireInteraction() {
    const host = $("sky"), pointers = new Map();
    let pinch = 0;
    host.addEventListener("pointerdown", e => { host.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); goal.active = false; });
    host.addEventListener("pointermove", e => {
      const p = pointers.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (pointers.size === 1) {                                              // one finger / mouse: look around
        const k = view.fov * D2R / host.clientHeight;                          // radians per pixel
        view.lon = wrap(view.lon + dx * k); view.lat = Math.max(-1.5, Math.min(1.5, view.lat + dy * k));   // drag right -> sky moves right
      } else if (pointers.size === 2) {                                       // two fingers: pinch to zoom
        const [a, b] = [...pointers.values()], dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) { view.fov = Math.max(12, Math.min(90, view.fov * pinch / dist)); goal.fov = view.fov; } pinch = dist;
      }
    });
    const end = e => { pointers.delete(e.pointerId); pinch = 0; };
    host.addEventListener("pointerup", end); host.addEventListener("pointercancel", end);
    host.addEventListener("wheel", e => { e.preventDefault(); nudge(0, 0, Math.exp(e.deltaY * 0.0012)); }, { passive: false });
    host.addEventListener("keydown", e => {
      const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", "+": "in", "=": "in", "-": "out", "_": "out", r: "reset", R: "reset" };
      if (map[e.key]) { e.preventDefault(); ACTIONS[map[e.key]](); }
    });
    document.querySelectorAll("[data-action]").forEach(b => b.addEventListener("click", () => ACTIONS[b.dataset.action]()));
    new ResizeObserver(resize).observe(host); resize();
  }
  function resize() {
    const h = $("sky"), w = h.clientWidth, ht = h.clientHeight; if (!w || !ht || !renderer) return;
    camera.aspect = w / ht; camera.updateProjectionMatrix(); renderer.setSize(w, ht, false);
  }

  /* ----------------------------------------------------------------- loop */
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (goal.active) {                                                         // glide toward the target view
      const k = Math.min(1, dt * 3.2);
      view.lon = wrap(view.lon + wrap(goal.lon - view.lon) * k); view.lat += (goal.lat - view.lat) * k; view.fov += (goal.fov - view.fov) * k;
      if (Math.abs(wrap(goal.lon - view.lon)) < 0.0005 && Math.abs(goal.lat - view.lat) < 0.0005 && Math.abs(goal.fov - view.fov) < 0.05) goal.active = false;
    }
    camera.fov = view.fov; camera.updateProjectionMatrix();
    const f = lookDir(view.lon, view.lat); camera.lookAt(f.x, f.y, f.z);        // turn the camera (it never moves)
    const w = $("sky").clientWidth, h = $("sky").clientHeight;
    starMat.uniforms.uTime.value += dt;
    const scale = renderer.getPixelRatio() * (h / 700) * Math.sqrt(62 / view.fov);   // stars grow a little as you zoom in
    scene.traverse(o => { if (o.isPoints) o.material.uniforms.uScale.value = scale; });
    renderer.render(scene, camera);
    updateLabels(w, h);
    // view.lon IS the right ascension (in radians), so divide by 15 degrees to get hours.
    const raH = (((view.lon / D2R) % 360) + 360) % 360 / 15, decD = view.lat / D2R;
    $("sky-readout").textContent = "Looking at RA " + raH.toFixed(1) + " h, Dec " + (decD >= 0 ? "+" : "") + decD.toFixed(0) + "°  ·  field of view " + Math.round(view.fov) + "°";
  }

  /* ---------------------------------------------------------------- start */
  function start() {
    document.documentElement.style.setProperty("--accent", "#72e4ff"); document.documentElement.style.setProperty("--accent-soft", "#72e4ff26");
    buildToggles(); buildConList(); fillFacts(); showConDetail(); showStarDetail();
    if (typeof THREE === "undefined") { loadingEl.textContent = "3D library could not load (check your internet connection). The guide below still works!"; return; }
    if (!setup()) return;
    requestAnimationFrame(() => setTimeout(() => {
      buildStars(); buildConstellations(); buildGuides(); buildLabels(); applyState(); wireInteraction();
      loadingEl.classList.add("hidden"); animate();
    }, 30));
  }
  start();
})();
