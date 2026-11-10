# ORBIT v0.5

A vanilla HTML/CSS/JavaScript astronomy site. The only outside dependency is
Three.js (loaded from a CDN). Everything else is hand-written and commented.

## Run
Extract the ZIP and open `index.html` (VS Code + Live Server also works). The 3D pages
need an internet connection the first time to fetch Three.js.

## What's here
- **Home hub** (`index.html`): a Solar System strip and cards for every world, 13 asteroids, 3 stars and the sky map.
- **One world per page.** Planets, the Moon, the asteroid belt, 13 individual asteroids and 3 stars each have their own page
  (`earth.html`, `bennu.html`, `sun.html`, ...). Drag to rotate, scroll to zoom, or use the on-screen buttons and keyboard.
- **Cross-section** on every planet and star, plus Ceres: clipping planes slice a wedge and coloured cut faces fill it in.
- **Real NASA asteroid shapes**: Vesta, Eros, Itokawa, Bennu, Toutatis, Kleopatra, Geographos, Golevka, Mithra and 1996 HW1.
  (Ceres is a sphere with painted terrain; Ida and Ryugu use shapes approximated from published dimensions.)
- **The night sky** (`sky.html`): 79 real stars at their true positions, 12 constellation figures, the Milky Way, and the
  celestial equator and ecliptic. Pick a constellation to fly there, then pick a star for its story.

## Files (read in this order to learn)
| File | What it does |
|---|---|
| `worlds.js` | **Data only**: every body's stats, facts, missions, layers and 3D settings. Edit this to change content. |
| `textures.js` | Paints planet, asteroid and star skins with noise (no image files). |
| `explorer.js` | The Three.js engine for body pages: lights, atmosphere shader, cutaway, moons, asteroid shapes, belt. |
| `sky-data.js` / `sky.js` | Real star data and the planetarium engine. |
| `models/*.js` | Compact NASA shape models (generated). `models/*.png` are the home-page thumbnails. |
| `tools/build_meshes.py` | Converts raw NASA `.stl` scans into `models/`. See its header for how it works. |
| `index.html`, `styles.css`, `explorer.css`, `script.js` | Home page, shared styles, lab layout, page starfield. |
| `earth.html` ... `hw1.html` | Tiny page shells. Only `<body data-world="...">` differs. |

## Adding a mesh
1. Put the binary `.stl` in a folder and add a line to `JOBS` in `tools/build_meshes.py`.
2. Run `python3 tools/build_meshes.py path/to/stl_folder yourname` (needs `numpy`, `scipy`, `pillow`).
3. Add `mesh: { id: "yourname", color: 0xaabbcc }` to the body's `model` in `worlds.js` and a `<script src="models/yourname.js" defer></script>` to its page.
Split files (two halves laid flat for 3D printing) are reassembled automatically.

## Notes
- Models are illustrative: bodies are not drawn to scale relative to each other.
- If a model file is missing, the page falls back to a procedural shape instead of breaking.
- `USE_ONLINE_TEXTURES` in `explorer.js` lets Earth and the Moon upgrade to photo textures when online.
