#!/usr/bin/env python3
"""
ORBIT — tools/build_meshes.py
==============================================================================
Turns raw NASA asteroid scans (binary .stl files) into small files the website
can load. You only run this when you add or change a mesh; the website itself
never needs Python.

    python3 tools/build_meshes.py  path/to/stl_folder

WHAT IT DOES, STEP BY STEP (each step is a function below, read them in order)
  1. load_stl      Read the STL and merge duplicate corner points, so the mesh
                   is a proper connected surface (STL repeats every corner).
  2. reassemble    Some files (Eros, Itokawa) are two HALVES laid flat for 3D
                   printing. We find the flat cut face, flip one half over and
                   slide it until the two cut outlines match, then join them.
  3. align         Rotate so the longest axis is X and the shortest (the spin
                   axis for most asteroids) is Y; centre it; scale to radius 1.
  4. bake_relief   Measure how "dented" every point is compared to its
                   neighbours (craters and hollows get dark, bumps get bright).
                   This is "ambient occlusion" baked into one number per point,
                   so even a low-poly model keeps its craters and boulders.
  5. decimate      Shrink hundreds of thousands of triangles to ~40,000 using
                   "quadric vertex clustering" (keeps the shape, drops detail
                   our screens can't show anyway).
  6. write_js      Pack everything into compact binary, encode it as text
                   (base64) and save it as models/<name>.js. A .js file works
                   even when you open the site by double-clicking index.html
                   (browsers refuse to fetch() local binary files).

BINARY LAYOUT inside the base64 text (all little-endian):
    positions  n * 3 * int16   (-32767..32767  ->  -1..1 of the model's radius)
    indices    t * 3 * uint16  (which 3 points make each triangle)
    relief     n * uint8       (0 = deep hollow ... 255 = exposed bump)
==============================================================================
"""
import sys, os, base64, json
import numpy as np
from scipy import sparse
from scipy.sparse.csgraph import connected_components
from scipy.spatial import cKDTree

TARGET_VERTS = 42000          # keeps indices under 65,536 so we can use uint16


# ------------------------------------------------------------------ 1. LOAD
def load_stl(path):
    """Read a BINARY STL. Returns (V, T): V = unique points (N,3), T = triangles as indices (M,3)."""
    data = open(path, "rb").read()
    n = int(np.frombuffer(data[80:84], "<u4")[0])
    rec = np.dtype([("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")])
    tris = np.frombuffer(data[84:84 + n * 50], dtype=rec)["v"].reshape(-1, 3)
    # np.unique with axis=0 merges identical points; 'inverse' says which unique point each corner became.
    V, inv = np.unique(tris, axis=0, return_inverse=True)
    return V.astype(np.float64), inv.reshape(-1, 3)


# ------------------------------------------------------------- 2. REASSEMBLE
def components(T, n):
    """Label each point with which separate piece (connected component) it belongs to."""
    e = np.concatenate([T[:, [0, 1]], T[:, [1, 2]]])
    g = sparse.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n))
    return connected_components(g, directed=False)[1]


def find_cut_plane(P):
    """A half-shell has one perfectly flat face. Find which axis it is on, and where.
    Trick: many points share exactly the same coordinate along that axis."""
    best = None
    for axis in range(3):
        vals, counts = np.unique(np.round(P[:, axis], 3), return_counts=True)
        k = counts.argmax()
        if best is None or counts[k] > best[2]:
            best = (axis, vals[k], counts[k])
    return best[0], best[1]


def reassemble(V, T):
    """If the file holds two halves, glue them into one body. Otherwise return it unchanged."""
    lab = components(T, len(V))
    ids, sizes = np.unique(lab, return_counts=True)
    big = [i for i, s in zip(ids, sizes) if s > 100]          # ignore stray specks
    if len(big) != 2:
        return V, T, None
    A, B = (V[lab == big[0]], V[lab == big[1]])
    axis, zA = find_cut_plane(A)
    axisB, zB = find_cut_plane(B)
    if axis != axisB:
        print("   (halves have different cut axes; leaving as is)")
        return V, T, None
    u, v = [a for a in range(3) if a != axis]                   # the two in-plane axes
    extent = np.ptp(V, axis=0).max()
    tol = 1e-3 * extent
    faceA = A[np.abs(A[:, axis] - zA) < tol][:, [u, v]]         # outline of A's cut face (2D)
    faceB = B[np.abs(B[:, axis] - zB) < tol][:, [u, v]]
    sideA = np.sign((A[:, axis] - zA).mean())                   # which side of the plane the body lies on
    sideB = np.sign((B[:, axis] - zB).mean())
    flip = sideA == sideB          # both lying on the "print bed": B must be turned upside down
    cA, cB = faceA.mean(0), faceB.mean(0)
    tree = cKDTree(faceA)

    def chamfer(Q):                # how badly two outlines match (smaller = better)
        return tree.query(Q)[0].mean() + cKDTree(Q).query(faceA)[0].mean()

    best = (1e18, None, None)
    for deg in np.arange(0, 180 if flip else 360, 1.0):
        a = np.radians(deg)
        if flip:   # a flip about an in-plane line is a 2-D reflection
            M = np.array([[np.cos(2 * a), np.sin(2 * a)], [np.sin(2 * a), -np.cos(2 * a)]])
        else:      # otherwise just a 2-D rotation
            M = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
        Q = (faceB - cB) @ M.T + cA
        t = np.zeros(2)
        for _ in range(15):        # a few ICP steps: nudge Q toward A's outline
            d, idx = tree.query(Q + t)
            t += (faceA[idx] - (Q + t)).mean(0)
        c = chamfer(Q + t)
        if c < best[0]:
            best = (c, M, t)
    cost, M, t = best
    print(f"   halves matched: outline error {cost / extent * 100:.3f}% of the body size ({'flipped' if flip else 'rotated'})")

    Bt = B.copy()
    Bt[:, [u, v]] = (B[:, [u, v]] - cB) @ M.T + cA + t
    Bt[:, axis] = zA - (B[:, axis] - zB) if flip else zA + (B[:, axis] - zB)

    # Rebuild one mesh from the two halves.
    Vn = np.concatenate([A, Bt])
    remapA = -np.ones(len(V), int); remapA[lab == big[0]] = np.arange(len(A))
    remapB = -np.ones(len(V), int); remapB[lab == big[1]] = np.arange(len(B)) + len(A)
    tl = lab[T[:, 0]]
    Tn = np.concatenate([remapA[T[tl == big[0]]], remapB[T[tl == big[1]]]])
    # NOTE: no winding reversal needed. Reflecting in-plane AND flipping across the plane together make a
    # proper rotation (not a mirror), so every triangle keeps facing outward.
    # Remove the flat cap triangles (they're now buried inside the body).
    onplane = np.abs(Vn[:, axis] - zA) < tol
    Tn = Tn[~onplane[Tn].all(axis=1)]
    # Weld the two seams: points from A and B that now sit on top of each other become one point.
    idxp = np.where(onplane)[0]
    pairs = cKDTree(Vn[idxp]).query_pairs(tol * 4, output_type="ndarray")
    parent = np.arange(len(Vn))
    g = sparse.coo_matrix((np.ones(len(pairs)), (idxp[pairs[:, 0]], idxp[pairs[:, 1]])), shape=(len(Vn),) * 2)
    _, comp = connected_components(g, directed=False)
    # 'comp' gives every point a group label; points in the same group are one welded point at the average position.
    K = comp.max() + 1
    members = np.bincount(comp, minlength=K)
    Vw = np.stack([np.bincount(comp, weights=Vn[:, k], minlength=K) / members for k in range(3)], 1)
    Vn, Tn = compact(Vw, comp[Tn])
    Tn = Tn[(Tn[:, 0] != Tn[:, 1]) & (Tn[:, 1] != Tn[:, 2]) & (Tn[:, 0] != Tn[:, 2])]
    return Vn, Tn, cost / extent


def compact(V, T):
    """Drop unused points and renumber so indices are 0..N-1 (averaging merged points)."""
    used = np.unique(T)
    remap = -np.ones(V.shape[0], int); remap[used] = np.arange(len(used))
    cnt = np.bincount(remap[T].ravel(), minlength=len(used))
    Vn = np.stack([np.bincount(remap[T].ravel(), weights=V[T.ravel(), k], minlength=len(used)) / np.maximum(cnt, 1) for k in range(3)], 1)
    return Vn, remap[T]


# ------------------------------------------------------------------ 3. ALIGN
def volume_centroid(V, T):
    """Centre of mass of a closed mesh (sum of signed tetrahedra). Falls back to the bounding-box centre."""
    a, b, c = V[T[:, 0]], V[T[:, 1]], V[T[:, 2]]
    vol = np.einsum("ij,ij->i", a, np.cross(b, c)) / 6.0
    tot = vol.sum()
    if abs(tot) < 1e-9:
        return (V.max(0) + V.min(0)) / 2
    return ((a + b + c) / 4 * vol[:, None]).sum(0) / tot


def align(V, T):
    """Centre on the centre of mass, rotate to principal axes (X long, Y short, Z middle), scale to radius 1."""
    c = volume_centroid(V, T)
    if np.linalg.norm(c - (V.max(0) + V.min(0)) / 2) > 0.25 * np.ptp(V, axis=0).max():
        c = (V.max(0) + V.min(0)) / 2                      # centroid looks wrong (open mesh); use bbox centre
    P = V - c
    w, e = np.linalg.eigh(np.cov(P.T))                      # eigenvectors = principal axes, ascending variance
    R = np.stack([e[:, 2], e[:, 0], e[:, 1]], 1)            # columns: long, short, middle
    if np.linalg.det(R) < 0:
        R[:, 2] *= -1                                       # keep it a rotation (never a mirror image!)
    P = P @ R
    size = np.ptp(P, axis=0)
    return P / np.linalg.norm(P, axis=1).max(), size


# ------------------------------------------------------------- 4. BAKE RELIEF
def vertex_normals(V, T):
    fn = np.cross(V[T[:, 1]] - V[T[:, 0]], V[T[:, 2]] - V[T[:, 0]])   # length = 2 * area, so bigger faces count more
    N = np.zeros_like(V)
    for k in range(3):
        for a in range(3):
            N[:, a] += np.bincount(T[:, k], weights=fn[:, a], minlength=len(V))
    return N / (np.linalg.norm(N, axis=1, keepdims=True) + 1e-12)


def bake_relief(V, T, gain=2.2):
    """Return a 0..1 value per point. Hollows (craters) < 0.5 < bumps/ridges.
    Method: smooth the surface by averaging each point with its neighbours. A point that lies
    BELOW its smoothed position is in a dent; ABOVE it is on a bump. Done at three scales."""
    n = len(V)
    e = np.concatenate([T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]])
    A = sparse.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n)).tocsr()
    A = ((A + A.T) > 0).astype(float)
    deg = np.asarray(A.sum(1)).ravel()
    L = sparse.diags(1.0 / np.maximum(deg, 1)) @ A          # "average of my neighbours"
    nrm = vertex_normals(V, T)
    edge = np.linalg.norm(V[e[:, 0]] - V[e[:, 1]], axis=1).mean()
    S, total, count = V.copy(), np.zeros(n), 0
    for it in range(1, 41):
        S = 0.5 * S + 0.5 * (L @ S)
        if it in (3, 10, 40):
            c = ((S - V) * nrm).sum(1) / (np.sqrt(it) * edge)   # + = in a dent, - = on a bump (scale-normalised)
            total += c; count += 1
    c = total / count
    return np.clip(0.5 - 0.5 * np.tanh(c * gain * 0.35), 0, 1)


# -------------------------------------------------------------- 5. DECIMATE
def decimate(V, T, relief, target):
    """Quadric vertex clustering: lay a 3D grid over the mesh, merge all points in the same cell into one,
    and place that point where it best preserves the original surface planes (quadric error)."""
    p0, p1, p2 = V[T[:, 0]], V[T[:, 1]], V[T[:, 2]]
    n = np.cross(p1 - p0, p2 - p0); area2 = np.linalg.norm(n, axis=1) + 1e-18
    n /= area2[:, None]
    plane = np.concatenate([n, -(n * p0).sum(1)[:, None]], 1)          # plane equation (a,b,c,d) of each triangle
    iu = [(i, j) for i in range(4) for j in range(i, 4)]
    Qt = {(i, j): plane[:, i] * plane[:, j] * area2 / 6 for i, j in iu}  # each triangle's "quadric", area-weighted
    area = area2.sum() / 2
    size = np.sqrt(area / target) * 0.25                                # start with a FINE grid (too many points)...
    mn = V.min(0)
    for _ in range(300):                                                # ...then coarsen it ~3% at a time until we have few enough
        cell = np.floor((V - mn) / size).astype(np.int64)
        key = (cell[:, 0] * 100003 + cell[:, 1]) * 100019 + cell[:, 2]
        uniq, cid = np.unique(key, return_inverse=True)
        if len(uniq) <= target:
            break
        size *= 1.03
    m = len(uniq)
    # Add up the quadrics of all triangles touching each cluster.
    Q = {}
    for ij in iu:
        Q[ij] = sum(np.bincount(cid[T[:, k]], weights=Qt[ij], minlength=m) for k in range(3))
    cnt = np.bincount(cid, minlength=m)
    c0 = np.stack([np.bincount(cid, weights=V[:, k], minlength=m) / cnt for k in range(3)], 1)   # cluster centroid
    A3 = np.zeros((m, 3, 3)); b = np.zeros((m, 3))
    for i in range(3):
        for j in range(3):
            A3[:, i, j] = Q[(min(i, j), max(i, j))]
        b[:, i] = Q[(i, 3)]
    lam = 0.05 * np.trace(A3, axis1=1, axis2=2) / 3 + 1e-12            # pull gently toward the centroid (keeps it stable)
    A3 += lam[:, None, None] * np.eye(3)
    x = np.linalg.solve(A3, (-b + lam[:, None] * c0)[:, :, None])[:, :, 0]
    x = np.clip(x, c0 - size, c0 + size)                               # never wander far from the cell
    rel = np.bincount(cid, weights=relief, minlength=m) / cnt          # average the baked relief too
    Tn = cid[T]
    Tn = Tn[(Tn[:, 0] != Tn[:, 1]) & (Tn[:, 1] != Tn[:, 2]) & (Tn[:, 0] != Tn[:, 2])]
    _, first = np.unique(np.sort(Tn, axis=1), axis=0, return_index=True)  # drop duplicate triangles
    Tn = Tn[np.sort(first)]
    used = np.unique(Tn); remap = -np.ones(m, int); remap[used] = np.arange(len(used))
    return x[used], remap[Tn], rel[used]


# ----------------------------------------------------------------- 6. WRITE
def write_js(name, V, T, relief, out_dir):
    n, t = len(V), len(T)
    assert n < 65535, "too many points for uint16 indices"
    pos = np.round(np.clip(V, -1, 1) * 32767).astype("<i2")
    idx = T.astype("<u2")
    rel = np.round(relief * 255).astype("<u1")
    blob = pos.tobytes() + idx.tobytes() + rel.tobytes()
    entry = {"n": n, "t": t, "io": n * 6, "ro": n * 6 + t * 6, "data": base64.b64encode(blob).decode()}
    js = ("// GENERATED by tools/build_meshes.py. Do not edit by hand.\n"
          "// A compact, decimated copy of NASA's shape model for " + name + ".\n"
          "window.ORBIT_MESHES = window.ORBIT_MESHES || {};\n"
          "ORBIT_MESHES[" + json.dumps(name) + "] = " + json.dumps(entry) + ";\n")
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, name + ".js")
    open(path, "w").write(js)
    return path, len(js)


# --------------------------------------------------------------- THUMBNAILS
def thumbnail(V, T, relief, path, S=200):
    """A little lit picture of the model for the home page cards (simple z-buffered point splatting)."""
    from PIL import Image
    from scipy import ndimage
    nrm = vertex_normals(V, T)
    ang = np.radians(-25); ca, sa = np.cos(ang), np.sin(ang)        # tilt a little so we see the 3D shape
    Rm = np.array([[1, 0, 0], [0, ca, -sa], [0, sa, ca]]) @ np.array([[np.cos(0.5), 0, np.sin(0.5)], [0, 1, 0], [-np.sin(0.5), 0, np.cos(0.5)]])
    P, N = V @ Rm.T, nrm @ Rm.T
    sc = S * 0.46
    px = (S / 2 + P[:, 0] * sc).astype(int); py = (S / 2 - P[:, 1] * sc).astype(int)
    light = np.clip(N @ np.array([-0.45, 0.5, 0.75]), 0, 1)
    val = np.clip((0.18 + 0.82 * light) * (0.55 + 0.7 * relief), 0, 1)
    order = np.argsort(P[:, 2])
    img = np.zeros((S, S)); mask = np.zeros((S, S), bool)
    for dx in (0, 1, 2):
        for dy in (0, 1, 2):
            x = np.clip(px[order] + dx - 1, 0, S - 1); y = np.clip(py[order] + dy - 1, 0, S - 1)
            img[y, x] = val[order]; mask[y, x] = True
    mask = ndimage.binary_closing(mask, iterations=2); mask = ndimage.binary_fill_holes(mask)
    img = ndimage.grey_closing(img, size=3); img = ndimage.gaussian_filter(img, 0.6)
    rgb = np.stack([img * 255 * 0.98, img * 255 * 0.93, img * 255 * 0.86, mask * 255], -1).astype(np.uint8)
    Image.fromarray(rgb, "RGBA").save(path, optimize=True)


# --------------------------------------------------------------------- MAIN
# Which uploaded file becomes which model name (these names match worlds.js "mesh.id").
JOBS = {
    "bennu":      "Asteroid_101955_Bennu.stl",
    "vesta":      "Asteroid_4_Vesta__A_.stl",
    "eros":       "Asteroid_433_Eros.stl",
    "itokawa":    "Asteroid_25143_Itokawa.stl",
    "toutatis":   "Asteroid_4179_Toutatis.stl",
    "kleopatra":  "Asteroid_216_Kleopatra.stl",
    "geographos": "Asteroid_1620_Geographos.stl",
    "golevka":    "Asteroid_6489_Golevka.stl",
    "mithra":     "Asteroid_4486_Mithra.stl",
    "hw1":        "Asteroid_8567_1996_HW1.stl",
}

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "."
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    out = os.path.join(root, "models")
    only = sys.argv[2:] or list(JOBS)
    for name in only:
        f = os.path.join(src, JOBS[name])
        if not os.path.exists(f):
            alt = f.replace(".stl", "_2.stl")           # tolerate the "_2" duplicate download names
            f = alt if os.path.exists(alt) else f
        print(f"{name}: {os.path.basename(f)}")
        V, T = load_stl(f)
        print(f"   {len(V):,} points, {len(T):,} triangles")
        V, T, err = reassemble(V, T)
        V, size = align(V, T)
        print(f"   relative size (long:short:middle) = {size[0] / size[1]:.2f} : 1 : {size[2] / size[1]:.2f}")
        rel = bake_relief(V, T)
        Vd, Td, reld = decimate(V, T, rel, TARGET_VERTS)
        path, nbytes = write_js(name, Vd, Td, reld, out)
        thumbnail(Vd, Td, reld, os.path.join(out, name + ".png"))
        print(f"   -> {len(Vd):,} points, {len(Td):,} triangles, {nbytes / 1024:.0f} KB")
