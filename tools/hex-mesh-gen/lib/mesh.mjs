import { hexVertices, isQuadConvex, jitterPoint, jitterBoundaryPoint, isInsideHex } from './geometry.mjs';

export function createMesh() {
  const points = [];
  const quads = [];
  const boundaryEdges = new Map();

  function addPoint(x, y) {
    const idx = points.length / 2;
    points.push(x, y);
    return idx;
  }

  function addQuad(a, b, c, d) {
    quads.push([a, b, c, d]);
  }

  function edgeKey(a, b) {
    return a < b ? `${a},${b}` : `${b},${a}`;
  }

  function markBoundaryEdge(a, b, sx, sy, ex, ey) {
    boundaryEdges.set(edgeKey(a, b), { sx, sy, ex, ey });
  }

  function isBoundaryEdge(a, b) {
    return boundaryEdges.get(edgeKey(a, b));
  }

  return { points, quads, boundaryEdges, addPoint, addQuad, edgeKey, markBoundaryEdge, isBoundaryEdge };
}

export function initialSplit(radius, rng) {
  const mesh = createMesh();
  const verts = hexVertices(radius);
  const vi = verts.map(([x, y]) => mesh.addPoint(x, y));

  const maxOffset = radius * 0.1;
  const cx = rng.nextInRange(-maxOffset, maxOffset);
  const cy = rng.nextInRange(-maxOffset, maxOffset);
  const center = mesh.addPoint(cx, cy);

  const s = rng.nextInt(6);

  for (let i = 0; i < 3; i++) {
    const ai = (s + i * 2) % 6;
    const bi = (s + i * 2 + 1) % 6;
    const ci = (s + i * 2 + 2) % 6;
    mesh.addQuad(vi[ai], vi[bi], vi[ci], center);
    mesh.markBoundaryEdge(vi[ai], vi[bi], verts[ai][0], verts[ai][1], verts[bi][0], verts[bi][1]);
    mesh.markBoundaryEdge(vi[bi], vi[ci], verts[bi][0], verts[bi][1], verts[ci][0], verts[ci][1]);
  }

  return mesh;
}

/**
 * Alternative initial split: connect center to midpoints of hex edges.
 * Creates 6 quads (vertex, midpoint, center, prev-midpoint).
 * More uniform starting topology than initialSplit's 3-quad layout.
 */
export function initialSplitMid(radius, rng) {
  const mesh = createMesh();
  const verts = hexVertices(radius);
  const vi = verts.map(([x, y]) => mesh.addPoint(x, y));

  // Edge midpoints
  const mids = [];
  const mi = [];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const mx = (verts[i][0] + verts[j][0]) / 2;
    const my = (verts[i][1] + verts[j][1]) / 2;
    mids.push([mx, my]);
    mi.push(mesh.addPoint(mx, my));
  }

  // Jittered center
  const maxOffset = radius * 0.1;
  const cx = rng.nextInRange(-maxOffset, maxOffset);
  const cy = rng.nextInRange(-maxOffset, maxOffset);
  const center = mesh.addPoint(cx, cy);

  // 6 quads: (vertex[i], midpoint[i], center, midpoint[i-1])
  for (let i = 0; i < 6; i++) {
    const prev = (i + 5) % 6;
    mesh.addQuad(vi[i], mi[i], center, mi[prev]);
    // Boundary: vertex[i] → midpoint[i] (first half of hex edge i→i+1)
    mesh.markBoundaryEdge(vi[i], mi[i], verts[i][0], verts[i][1], mids[i][0], mids[i][1]);
    // Boundary: midpoint[prev] → vertex[i] (second half of hex edge prev→i)
    mesh.markBoundaryEdge(mi[prev], vi[i], mids[prev][0], mids[prev][1], verts[i][0], verts[i][1]);
  }

  return mesh;
}

/**
 * Alternative initial split: diagonal across the hex.
 * Connects two opposite vertices, creating 2 quads (half-hexes).
 * Produces bilateral flow instead of radial.
 * Random orientation picks which pair of opposite vertices to use.
 */
export function initialSplitDiag(radius, rng) {
  const mesh = createMesh();
  const verts = hexVertices(radius);
  const vi = verts.map(([x, y]) => mesh.addPoint(x, y));

  // Pick a random pair of opposite vertices (3 choices: 0-3, 1-4, 2-5)
  const s = rng.nextInt(3);
  const a = s;       // 0, 1, or 2
  const b = s + 3;   // 3, 4, or 5

  // Quad 1: a → a+1 → a+2 → b  (3 edges + diagonal)
  mesh.addQuad(vi[a], vi[a + 1], vi[a + 2], vi[b]);
  // Quad 2: b → b+1 → (b+2)%6 → a  (3 edges + diagonal)
  mesh.addQuad(vi[b], vi[(b + 1) % 6], vi[(b + 2) % 6], vi[a]);

  // Mark all 6 hex edges as boundary
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    mesh.markBoundaryEdge(vi[i], vi[j], verts[i][0], verts[i][1], verts[j][0], verts[j][1]);
  }

  return mesh;
}

export function subdivide(mesh, rng, radius, depth, { edgeOnly = false, edgeOnlyAfter = -1 } = {}) {
  const effectiveEdgeOnly = edgeOnly || depth > edgeOnlyAfter && edgeOnlyAfter >= 0;
  const maxJitter = radius * 0.15 / Math.pow(2, depth);
  const edgePointMap = new Map();
  const oldQuads = [...mesh.quads];
  mesh.quads.length = 0;

  const newBoundaryEdges = new Map();

  for (const quad of oldQuads) {
    const [c0, c1, c2, c3] = quad;

    // Face point: centroid + jitter
    let fx = 0, fy = 0;
    for (const pi of quad) {
      fx += mesh.points[pi * 2];
      fy += mesh.points[pi * 2 + 1];
    }
    fx /= 4;
    fy /= 4;
    const [jfx, jfy] = effectiveEdgeOnly ? [fx, fy] : jitterPoint(fx, fy, rng, maxJitter);
    const faceIdx = mesh.addPoint(jfx, jfy);

    // Edge points
    const edges = [[c0, c1], [c1, c2], [c2, c3], [c3, c0]];
    const edgeIndices = [];

    for (const [a, b] of edges) {
      const key = mesh.edgeKey(a, b);
      if (edgePointMap.has(key)) {
        const idx = edgePointMap.get(key);
        edgeIndices.push(idx);
        // Propagate boundary edges even on second encounter
        const boundary = mesh.isBoundaryEdge(a, b);
        if (boundary) {
          newBoundaryEdges.set(mesh.edgeKey(a, idx), { sx: boundary.sx, sy: boundary.sy, ex: boundary.ex, ey: boundary.ey });
          newBoundaryEdges.set(mesh.edgeKey(idx, b), { sx: boundary.sx, sy: boundary.sy, ex: boundary.ex, ey: boundary.ey });
        }
      } else {
        let mx = (mesh.points[a * 2] + mesh.points[b * 2]) / 2;
        let my = (mesh.points[a * 2 + 1] + mesh.points[b * 2 + 1]) / 2;

        const boundary = mesh.isBoundaryEdge(a, b);
        if (boundary) {
          [mx, my] = jitterBoundaryPoint(mx, my, boundary.sx, boundary.sy, boundary.ex, boundary.ey, rng, maxJitter);
        } else if (effectiveEdgeOnly) {
          const esx = mesh.points[a * 2], esy = mesh.points[a * 2 + 1];
          const eex = mesh.points[b * 2], eey = mesh.points[b * 2 + 1];
          [mx, my] = jitterBoundaryPoint(mx, my, esx, esy, eex, eey, rng, maxJitter);
        } else {
          [mx, my] = jitterPoint(mx, my, rng, maxJitter);
        }

        const idx = mesh.addPoint(mx, my);
        edgePointMap.set(key, idx);

        if (boundary) {
          newBoundaryEdges.set(mesh.edgeKey(a, idx), { sx: boundary.sx, sy: boundary.sy, ex: boundary.ex, ey: boundary.ey });
          newBoundaryEdges.set(mesh.edgeKey(idx, b), { sx: boundary.sx, sy: boundary.sy, ex: boundary.ex, ey: boundary.ey });
        }

        edgeIndices.push(idx);
      }
    }

    const [e01, e12, e23, e30] = edgeIndices;

    const childQuads = [
      [c0, e01, faceIdx, e30],
      [c1, e12, faceIdx, e01],
      [c2, e23, faceIdx, e12],
      [c3, e30, faceIdx, e23],
    ];

    // Convexity enforcement for face point: halve jitter up to 3 times
    let allConvex = childQuads.every(q => isQuadConvex(mesh.points, q));
    if (!allConvex) {
      let dx = jfx - fx, dy = jfy - fy;
      for (let attempt = 0; attempt < 3 && !allConvex; attempt++) {
        dx /= 2;
        dy /= 2;
        mesh.points[faceIdx * 2] = fx + dx;
        mesh.points[faceIdx * 2 + 1] = fy + dy;
        allConvex = childQuads.every(q => isQuadConvex(mesh.points, q));
      }
      if (!allConvex) {
        mesh.points[faceIdx * 2] = fx;
        mesh.points[faceIdx * 2 + 1] = fy;
      }
    }

    for (const q of childQuads) {
      mesh.addQuad(...q);
    }
  }

  // Post-pass convexity enforcement for shared edge points.
  // Edge points affect quads from two parent quads, so convexity can't be
  // fully checked at creation time. For non-convex quads, iteratively move
  // interior (non-boundary) vertices toward the average of their neighbors.
  const boundaryVertexSet = new Set();
  for (const key of newBoundaryEdges.keys()) {
    const [a, b] = key.split(',').map(Number);
    boundaryVertexSet.add(a);
    boundaryVertexSet.add(b);
  }

  // Build neighbor map once
  const neighbors = new Map();
  for (const quad of mesh.quads) {
    for (let i = 0; i < 4; i++) {
      const pi = quad[i];
      if (!neighbors.has(pi)) neighbors.set(pi, new Set());
      neighbors.get(pi).add(quad[(i + 1) % 4]);
      neighbors.get(pi).add(quad[(i + 3) % 4]);
    }
  }

  for (let pass = 0; pass < 20; pass++) {
    const badVertices = new Set();
    let anyBad = false;
    for (const quad of mesh.quads) {
      if (!isQuadConvex(mesh.points, quad)) {
        anyBad = true;
        for (const pi of quad) {
          if (!boundaryVertexSet.has(pi)) badVertices.add(pi);
        }
      }
    }
    if (!anyBad) break;

    for (const pi of badVertices) {
      const nbrs = neighbors.get(pi);
      let ax = 0, ay = 0;
      for (const ni of nbrs) {
        ax += mesh.points[ni * 2];
        ay += mesh.points[ni * 2 + 1];
      }
      ax /= nbrs.size;
      ay /= nbrs.size;
      mesh.points[pi * 2] = mesh.points[pi * 2] * 0.7 + ax * 0.3;
      mesh.points[pi * 2 + 1] = mesh.points[pi * 2 + 1] * 0.7 + ay * 0.3;
    }
  }

  mesh.boundaryEdges.clear();
  for (const [key, val] of newBoundaryEdges) {
    mesh.boundaryEdges.set(key, val);
  }
}

/**
 * Post-process: apply repulsive forces between interior vertices.
 * Each vertex pushes nearby vertices away (inverse-distance repulsion).
 * Boundary vertices are fixed. Convexity is re-enforced after each iteration.
 */
export function repulse(mesh, radius, iterations = 10, strength = 0.02) {
  const numPoints = mesh.points.length / 2;

  // Identify boundary vertices
  const boundarySet = new Set();
  for (const key of mesh.boundaryEdges.keys()) {
    const [a, b] = key.split(',').map(Number);
    boundarySet.add(a);
    boundarySet.add(b);
  }

  // Collect interior vertex indices
  const interior = [];
  for (let i = 0; i < numPoints; i++) {
    if (!boundarySet.has(i)) interior.push(i);
  }

  for (let iter = 0; iter < iterations; iter++) {
    // Compute repulsion forces on each interior vertex
    const forces = new Map();
    for (const i of interior) {
      forces.set(i, { fx: 0, fy: 0 });
    }

    for (let a = 0; a < interior.length; a++) {
      const i = interior[a];
      const ix = mesh.points[i * 2];
      const iy = mesh.points[i * 2 + 1];

      for (let b = a + 1; b < interior.length; b++) {
        const j = interior[b];
        const jx = mesh.points[j * 2];
        const jy = mesh.points[j * 2 + 1];

        const dx = ix - jx;
        const dy = iy - jy;
        const distSq = dx * dx + dy * dy;
        if (distSq < 1e-12) continue;

        const dist = Math.sqrt(distSq);
        // Inverse-distance repulsion, scaled by strength
        const force = strength / distSq;
        const nx = dx / dist;
        const ny = dy / dist;

        forces.get(i).fx += nx * force;
        forces.get(i).fy += ny * force;
        forces.get(j).fx -= nx * force;
        forces.get(j).fy -= ny * force;
      }
    }

    // Apply forces with clamping
    const maxDisp = radius * 0.05;
    const saved = new Map();
    for (const i of interior) {
      saved.set(i, [mesh.points[i * 2], mesh.points[i * 2 + 1]]);

      let { fx, fy } = forces.get(i);
      const mag = Math.sqrt(fx * fx + fy * fy);
      if (mag > maxDisp) {
        fx = (fx / mag) * maxDisp;
        fy = (fy / mag) * maxDisp;
      }
      mesh.points[i * 2] += fx;
      mesh.points[i * 2 + 1] += fy;

      // Clamp to stay inside hex
      if (!isInsideHex(mesh.points[i * 2], mesh.points[i * 2 + 1], radius)) {
        const [sx, sy] = saved.get(i);
        mesh.points[i * 2] = sx;
        mesh.points[i * 2 + 1] = sy;
      }
    }

    // Re-enforce convexity: revert vertices to saved positions
    for (const quad of mesh.quads) {
      if (isQuadConvex(mesh.points, quad)) continue;
      for (const pi of quad) {
        if (boundarySet.has(pi)) continue;
        if (!saved.has(pi)) continue;
        const [sx, sy] = saved.get(pi);
        mesh.points[pi * 2] = sx;
        mesh.points[pi * 2 + 1] = sy;
      }
    }
  }
}

/**
 * Post-process: area-equalizing pressure.
 * Computes each quad's area relative to the average. Vertices of too-small
 * quads are pushed outward from the quad centroid; too-large quads pull inward.
 * Boundary vertices are fixed.
 */
export function areaEqualize(mesh, radius, iterations = 20, strength = 0.05) {
  const numPoints = mesh.points.length / 2;

  const boundarySet = new Set();
  for (const key of mesh.boundaryEdges.keys()) {
    const [a, b] = key.split(',').map(Number);
    boundarySet.add(a);
    boundarySet.add(b);
  }

  // Count how many quads each vertex belongs to, for averaging forces
  const quadCount = new Float64Array(numPoints);
  for (const quad of mesh.quads) {
    for (const pi of quad) quadCount[pi]++;
  }

  for (let iter = 0; iter < iterations; iter++) {
    // Compute quad areas (shoelace)
    const areas = mesh.quads.map(quad => {
      let area = 0;
      for (let i = 0; i < 4; i++) {
        const a = quad[i], b = quad[(i + 1) % 4];
        area += mesh.points[a * 2] * mesh.points[b * 2 + 1];
        area -= mesh.points[b * 2] * mesh.points[a * 2 + 1];
      }
      return Math.abs(area) / 2;
    });

    const avgArea = areas.reduce((s, a) => s + a, 0) / areas.length;
    if (avgArea < 1e-12) break;

    const forces = new Float64Array(numPoints * 2);

    for (let qi = 0; qi < mesh.quads.length; qi++) {
      const quad = mesh.quads[qi];
      // Clamp ratio to avoid explosive forces on outlier quads
      const raw = (areas[qi] - avgArea) / avgArea;
      const ratio = Math.max(-1, Math.min(1, raw));

      // Centroid
      let cx = 0, cy = 0;
      for (const pi of quad) {
        cx += mesh.points[pi * 2];
        cy += mesh.points[pi * 2 + 1];
      }
      cx /= 4;
      cy /= 4;

      // Displacement proportional to distance from centroid (not unit direction)
      // so vertices farther out move more, which is correct for area scaling
      for (const pi of quad) {
        if (boundarySet.has(pi)) continue;
        const dx = cx - mesh.points[pi * 2];
        const dy = cy - mesh.points[pi * 2 + 1];
        forces[pi * 2] += strength * ratio * dx;
        forces[pi * 2 + 1] += strength * ratio * dy;
      }
    }

    // Average forces by quad count to prevent accumulation from shared vertices
    for (let i = 0; i < numPoints; i++) {
      if (quadCount[i] > 1) {
        forces[i * 2] /= quadCount[i];
        forces[i * 2 + 1] /= quadCount[i];
      }
    }

    const maxDisp = radius * 0.03;
    const saved = new Float64Array(numPoints * 2);
    for (let i = 0; i < numPoints; i++) {
      if (boundarySet.has(i)) continue;
      saved[i * 2] = mesh.points[i * 2];
      saved[i * 2 + 1] = mesh.points[i * 2 + 1];

      let fx = forces[i * 2];
      let fy = forces[i * 2 + 1];
      const mag = Math.sqrt(fx * fx + fy * fy);
      if (mag > maxDisp) {
        fx = (fx / mag) * maxDisp;
        fy = (fy / mag) * maxDisp;
      }
      mesh.points[i * 2] += fx;
      mesh.points[i * 2 + 1] += fy;

      if (!isInsideHex(mesh.points[i * 2], mesh.points[i * 2 + 1], radius)) {
        mesh.points[i * 2] = saved[i * 2];
        mesh.points[i * 2 + 1] = saved[i * 2 + 1];
      }
    }

    for (const quad of mesh.quads) {
      if (isQuadConvex(mesh.points, quad)) continue;
      for (const pi of quad) {
        if (boundarySet.has(pi)) continue;
        mesh.points[pi * 2] = saved[pi * 2];
        mesh.points[pi * 2 + 1] = saved[pi * 2 + 1];
      }
    }
  }
}

/**
 * Post-process: Lennard-Jones-style smoothing.
 * All interior vertex pairs interact: repel at short range, attract at long range.
 * Equilibrium distance is derived from average vertex spacing.
 * Boundary vertices are fixed.
 */
export function lennardJones(mesh, radius, iterations = 15, strength = 0.02) {
  const numPoints = mesh.points.length / 2;

  const boundarySet = new Set();
  for (const key of mesh.boundaryEdges.keys()) {
    const [a, b] = key.split(',').map(Number);
    boundarySet.add(a);
    boundarySet.add(b);
  }

  const interior = [];
  for (let i = 0; i < numPoints; i++) {
    if (!boundarySet.has(i)) interior.push(i);
  }

  // Equilibrium distance: average edge length
  const edgeSet = new Set();
  let totalLen = 0, edgeCount = 0;
  for (const quad of mesh.quads) {
    for (let i = 0; i < 4; i++) {
      const a = quad[i], b = quad[(i + 1) % 4];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      const dx = mesh.points[a * 2] - mesh.points[b * 2];
      const dy = mesh.points[a * 2 + 1] - mesh.points[b * 2 + 1];
      totalLen += Math.sqrt(dx * dx + dy * dy);
      edgeCount++;
    }
  }
  const sigma = totalLen / edgeCount;
  // Only interact within 2x equilibrium distance — prevents long-range
  // attraction from collapsing distant parts of the mesh
  const cutoff = sigma * 2;
  const cutoffSq = cutoff * cutoff;

  function ljForce(dx, dy, distSq) {
    const dist = Math.sqrt(distSq);
    const r = dist / sigma;
    // Softened LJ: linear repulsion + weak attraction, zero-crossing at r=1
    // F = strength * (1/r² - 1/r) — gentler than 1/r³ - 1/r²
    const f = strength * (1 / (r * r) - 1 / r);
    return [f * dx / dist, f * dy / dist];
  }

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Float64Array(numPoints * 2);

    for (let a = 0; a < interior.length; a++) {
      const i = interior[a];
      const ix = mesh.points[i * 2];
      const iy = mesh.points[i * 2 + 1];

      // Interior-interior pairs
      for (let b = a + 1; b < interior.length; b++) {
        const j = interior[b];
        const dx = ix - mesh.points[j * 2];
        const dy = iy - mesh.points[j * 2 + 1];
        const distSq = dx * dx + dy * dy;
        if (distSq < 1e-12 || distSq > cutoffSq) continue;

        const [fx, fy] = ljForce(dx, dy, distSq);
        forces[i * 2] += fx;
        forces[i * 2 + 1] += fy;
        forces[j * 2] -= fx;
        forces[j * 2 + 1] -= fy;
      }

      // Boundary vertices push/pull but don't move
      for (let j = 0; j < numPoints; j++) {
        if (!boundarySet.has(j)) continue;
        const dx = ix - mesh.points[j * 2];
        const dy = iy - mesh.points[j * 2 + 1];
        const distSq = dx * dx + dy * dy;
        if (distSq < 1e-12 || distSq > cutoffSq) continue;

        const [fx, fy] = ljForce(dx, dy, distSq);
        forces[i * 2] += fx;
        forces[i * 2 + 1] += fy;
      }
    }

    const maxDisp = radius * 0.04;
    const saved = new Float64Array(numPoints * 2);
    for (const i of interior) {
      saved[i * 2] = mesh.points[i * 2];
      saved[i * 2 + 1] = mesh.points[i * 2 + 1];

      let fx = forces[i * 2];
      let fy = forces[i * 2 + 1];
      const mag = Math.sqrt(fx * fx + fy * fy);
      if (mag > maxDisp) {
        fx = (fx / mag) * maxDisp;
        fy = (fy / mag) * maxDisp;
      }
      mesh.points[i * 2] += fx;
      mesh.points[i * 2 + 1] += fy;

      if (!isInsideHex(mesh.points[i * 2], mesh.points[i * 2 + 1], radius)) {
        mesh.points[i * 2] = saved[i * 2];
        mesh.points[i * 2 + 1] = saved[i * 2 + 1];
      }
    }

    for (const quad of mesh.quads) {
      if (isQuadConvex(mesh.points, quad)) continue;
      for (const pi of quad) {
        if (boundarySet.has(pi)) continue;
        mesh.points[pi * 2] = saved[pi * 2];
        mesh.points[pi * 2 + 1] = saved[pi * 2 + 1];
      }
    }
  }
}

/**
 * Post-process: spring smoothing along mesh edges.
 * Each edge acts as a spring pulling its two vertices toward a rest length.
 * Rest length is the average edge length across the whole mesh.
 * Boundary vertices are fixed.
 */
export function springSmooth(mesh, radius, iterations = 15, stiffness = 0.3) {
  const numPoints = mesh.points.length / 2;

  // Identify boundary vertices
  const boundarySet = new Set();
  for (const key of mesh.boundaryEdges.keys()) {
    const [a, b] = key.split(',').map(Number);
    boundarySet.add(a);
    boundarySet.add(b);
  }

  // Collect unique edges from quads
  const edgeSet = new Set();
  const edges = [];
  for (const quad of mesh.quads) {
    for (let i = 0; i < 4; i++) {
      const a = quad[i];
      const b = quad[(i + 1) % 4];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([a, b]);
      }
    }
  }

  // Compute average edge length as rest length
  let totalLen = 0;
  for (const [a, b] of edges) {
    const dx = mesh.points[a * 2] - mesh.points[b * 2];
    const dy = mesh.points[a * 2 + 1] - mesh.points[b * 2 + 1];
    totalLen += Math.sqrt(dx * dx + dy * dy);
  }
  const restLength = totalLen / edges.length;

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Float64Array(numPoints * 2);

    for (const [a, b] of edges) {
      const ax = mesh.points[a * 2], ay = mesh.points[a * 2 + 1];
      const bx = mesh.points[b * 2], by = mesh.points[b * 2 + 1];
      const dx = bx - ax;
      const dy = by - ay;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1e-12) continue;

      const displacement = dist - restLength;
      const fx = stiffness * displacement * (dx / dist);
      const fy = stiffness * displacement * (dy / dist);

      // a is pulled toward b, b is pulled toward a
      if (!boundarySet.has(a)) {
        forces[a * 2] += fx;
        forces[a * 2 + 1] += fy;
      }
      if (!boundarySet.has(b)) {
        forces[b * 2] -= fx;
        forces[b * 2 + 1] -= fy;
      }
    }

    // Apply forces with clamping
    const maxDisp = radius * 0.05;
    const saved = new Float64Array(numPoints * 2);
    for (let i = 0; i < numPoints; i++) {
      if (boundarySet.has(i)) continue;
      saved[i * 2] = mesh.points[i * 2];
      saved[i * 2 + 1] = mesh.points[i * 2 + 1];

      let fx = forces[i * 2];
      let fy = forces[i * 2 + 1];
      const mag = Math.sqrt(fx * fx + fy * fy);
      if (mag > maxDisp) {
        fx = (fx / mag) * maxDisp;
        fy = (fy / mag) * maxDisp;
      }
      mesh.points[i * 2] += fx;
      mesh.points[i * 2 + 1] += fy;

      if (!isInsideHex(mesh.points[i * 2], mesh.points[i * 2 + 1], radius)) {
        mesh.points[i * 2] = saved[i * 2];
        mesh.points[i * 2 + 1] = saved[i * 2 + 1];
      }
    }

    // Re-enforce convexity
    for (const quad of mesh.quads) {
      if (isQuadConvex(mesh.points, quad)) continue;
      for (const pi of quad) {
        if (boundarySet.has(pi)) continue;
        mesh.points[pi * 2] = saved[pi * 2];
        mesh.points[pi * 2 + 1] = saved[pi * 2 + 1];
      }
    }
  }
}

/**
 * Post-process: repulsion with boundary awareness.
 * Like repulse(), but boundary vertices also repel interior vertices,
 * preventing quads near the hex edge from collapsing.
 */
export function repulse2(mesh, radius, iterations = 10, strength = 0.02) {
  const numPoints = mesh.points.length / 2;

  const boundarySet = new Set();
  for (const key of mesh.boundaryEdges.keys()) {
    const [a, b] = key.split(',').map(Number);
    boundarySet.add(a);
    boundarySet.add(b);
  }

  const interior = [];
  for (let i = 0; i < numPoints; i++) {
    if (!boundarySet.has(i)) interior.push(i);
  }

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map();
    for (const i of interior) {
      forces.set(i, { fx: 0, fy: 0 });
    }

    for (let a = 0; a < interior.length; a++) {
      const i = interior[a];
      const ix = mesh.points[i * 2];
      const iy = mesh.points[i * 2 + 1];

      // Interior-interior repulsion
      for (let b = a + 1; b < interior.length; b++) {
        const j = interior[b];
        const dx = ix - mesh.points[j * 2];
        const dy = iy - mesh.points[j * 2 + 1];
        const distSq = dx * dx + dy * dy;
        if (distSq < 1e-12) continue;

        const dist = Math.sqrt(distSq);
        const force = strength / distSq;
        const nx = dx / dist;
        const ny = dy / dist;

        forces.get(i).fx += nx * force;
        forces.get(i).fy += ny * force;
        forces.get(j).fx -= nx * force;
        forces.get(j).fy -= ny * force;
      }

      // Boundary vertices repel interior vertices (fixed, don't move)
      for (let j = 0; j < numPoints; j++) {
        if (!boundarySet.has(j)) continue;
        const dx = ix - mesh.points[j * 2];
        const dy = iy - mesh.points[j * 2 + 1];
        const distSq = dx * dx + dy * dy;
        if (distSq < 1e-12) continue;

        const dist = Math.sqrt(distSq);
        const force = strength / distSq;
        forces.get(i).fx += (dx / dist) * force;
        forces.get(i).fy += (dy / dist) * force;
      }
    }

    const maxDisp = radius * 0.05;
    const saved = new Map();
    for (const i of interior) {
      saved.set(i, [mesh.points[i * 2], mesh.points[i * 2 + 1]]);

      let { fx, fy } = forces.get(i);
      const mag = Math.sqrt(fx * fx + fy * fy);
      if (mag > maxDisp) {
        fx = (fx / mag) * maxDisp;
        fy = (fy / mag) * maxDisp;
      }
      mesh.points[i * 2] += fx;
      mesh.points[i * 2 + 1] += fy;

      if (!isInsideHex(mesh.points[i * 2], mesh.points[i * 2 + 1], radius)) {
        const [sx, sy] = saved.get(i);
        mesh.points[i * 2] = sx;
        mesh.points[i * 2 + 1] = sy;
      }
    }

    for (const quad of mesh.quads) {
      if (isQuadConvex(mesh.points, quad)) continue;
      for (const pi of quad) {
        if (boundarySet.has(pi)) continue;
        if (!saved.has(pi)) continue;
        const [sx, sy] = saved.get(pi);
        mesh.points[pi * 2] = sx;
        mesh.points[pi * 2 + 1] = sy;
      }
    }
  }
}

/**
 * Post-process: interior-only spring smoothing.
 * Like springSmooth(), but only operates on edges between two interior vertices.
 * Rest length is computed from interior edges only.
 * Prevents boundary-adjacent edges from distorting the mesh.
 */
export function springSmooth2(mesh, radius, iterations = 15, stiffness = 0.3) {
  const numPoints = mesh.points.length / 2;

  const boundarySet = new Set();
  for (const key of mesh.boundaryEdges.keys()) {
    const [a, b] = key.split(',').map(Number);
    boundarySet.add(a);
    boundarySet.add(b);
  }

  // Only collect edges where neither vertex is on the boundary
  const edgeSet = new Set();
  const edges = [];
  for (const quad of mesh.quads) {
    for (let i = 0; i < 4; i++) {
      const a = quad[i];
      const b = quad[(i + 1) % 4];
      if (boundarySet.has(a) || boundarySet.has(b)) continue;
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([a, b]);
      }
    }
  }

  if (edges.length === 0) return;

  let totalLen = 0;
  for (const [a, b] of edges) {
    const dx = mesh.points[a * 2] - mesh.points[b * 2];
    const dy = mesh.points[a * 2 + 1] - mesh.points[b * 2 + 1];
    totalLen += Math.sqrt(dx * dx + dy * dy);
  }
  const restLength = totalLen / edges.length;

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Float64Array(numPoints * 2);

    for (const [a, b] of edges) {
      const ax = mesh.points[a * 2], ay = mesh.points[a * 2 + 1];
      const bx = mesh.points[b * 2], by = mesh.points[b * 2 + 1];
      const dx = bx - ax;
      const dy = by - ay;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1e-12) continue;

      const displacement = dist - restLength;
      const fx = stiffness * displacement * (dx / dist);
      const fy = stiffness * displacement * (dy / dist);

      forces[a * 2] += fx;
      forces[a * 2 + 1] += fy;
      forces[b * 2] -= fx;
      forces[b * 2 + 1] -= fy;
    }

    const maxDisp = radius * 0.05;
    const saved = new Float64Array(numPoints * 2);
    for (let i = 0; i < numPoints; i++) {
      if (boundarySet.has(i)) continue;
      saved[i * 2] = mesh.points[i * 2];
      saved[i * 2 + 1] = mesh.points[i * 2 + 1];

      let fx = forces[i * 2];
      let fy = forces[i * 2 + 1];
      const mag = Math.sqrt(fx * fx + fy * fy);
      if (mag > maxDisp) {
        fx = (fx / mag) * maxDisp;
        fy = (fy / mag) * maxDisp;
      }
      mesh.points[i * 2] += fx;
      mesh.points[i * 2 + 1] += fy;

      if (!isInsideHex(mesh.points[i * 2], mesh.points[i * 2 + 1], radius)) {
        mesh.points[i * 2] = saved[i * 2];
        mesh.points[i * 2 + 1] = saved[i * 2 + 1];
      }
    }

    for (const quad of mesh.quads) {
      if (isQuadConvex(mesh.points, quad)) continue;
      for (const pi of quad) {
        if (boundarySet.has(pi)) continue;
        mesh.points[pi * 2] = saved[pi * 2];
        mesh.points[pi * 2 + 1] = saved[pi * 2 + 1];
      }
    }
  }
}

/**
 * Post-process: equidistant relaxation.
 * Each interior vertex tries to become equidistant from all its topological
 * neighbors. Uses per-vertex local rest length (average of its own edge lengths),
 * not a global one. Boundary vertices are fixed but included as neighbors.
 */
export function equidistant(mesh, radius, iterations = 20, stiffness = 0.25) {
  const numPoints = mesh.points.length / 2;

  const boundarySet = new Set();
  for (const key of mesh.boundaryEdges.keys()) {
    const [a, b] = key.split(',').map(Number);
    boundarySet.add(a);
    boundarySet.add(b);
  }

  // Build neighbor map from quad edges
  const neighbors = new Map();
  for (const quad of mesh.quads) {
    for (let i = 0; i < 4; i++) {
      const a = quad[i];
      const b = quad[(i + 1) % 4];
      if (!neighbors.has(a)) neighbors.set(a, new Set());
      if (!neighbors.has(b)) neighbors.set(b, new Set());
      neighbors.get(a).add(b);
      neighbors.get(b).add(a);
    }
  }

  // Compute per-vertex rest lengths once from initial positions
  const restLengths = new Float64Array(numPoints);
  for (let i = 0; i < numPoints; i++) {
    if (boundarySet.has(i)) continue;
    const nbrs = neighbors.get(i);
    if (!nbrs || nbrs.size === 0) continue;
    const ix = mesh.points[i * 2];
    const iy = mesh.points[i * 2 + 1];
    let totalDist = 0;
    for (const j of nbrs) {
      const dx = mesh.points[j * 2] - ix;
      const dy = mesh.points[j * 2 + 1] - iy;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }
    restLengths[i] = totalDist / nbrs.size;
  }

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Float64Array(numPoints * 2);

    for (let i = 0; i < numPoints; i++) {
      if (boundarySet.has(i)) continue;
      const nbrs = neighbors.get(i);
      if (!nbrs || nbrs.size === 0) continue;

      const ix = mesh.points[i * 2];
      const iy = mesh.points[i * 2 + 1];
      const rest = restLengths[i];

      // Spring toward fixed local rest length for each neighbor
      for (const j of nbrs) {
        const dx = mesh.points[j * 2] - ix;
        const dy = mesh.points[j * 2 + 1] - iy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1e-12) continue;

        const displacement = dist - rest;
        forces[i * 2] += stiffness * displacement * (dx / dist);
        forces[i * 2 + 1] += stiffness * displacement * (dy / dist);
      }
    }

    const maxDisp = radius * 0.04;
    const saved = new Float64Array(numPoints * 2);
    for (let i = 0; i < numPoints; i++) {
      if (boundarySet.has(i)) continue;
      saved[i * 2] = mesh.points[i * 2];
      saved[i * 2 + 1] = mesh.points[i * 2 + 1];

      let fx = forces[i * 2];
      let fy = forces[i * 2 + 1];
      const mag = Math.sqrt(fx * fx + fy * fy);
      if (mag > maxDisp) {
        fx = (fx / mag) * maxDisp;
        fy = (fy / mag) * maxDisp;
      }
      mesh.points[i * 2] += fx;
      mesh.points[i * 2 + 1] += fy;

      if (!isInsideHex(mesh.points[i * 2], mesh.points[i * 2 + 1], radius)) {
        mesh.points[i * 2] = saved[i * 2];
        mesh.points[i * 2 + 1] = saved[i * 2 + 1];
      }
    }

    for (const quad of mesh.quads) {
      if (isQuadConvex(mesh.points, quad)) continue;
      for (const pi of quad) {
        if (boundarySet.has(pi)) continue;
        mesh.points[pi * 2] = saved[pi * 2];
        mesh.points[pi * 2 + 1] = saved[pi * 2 + 1];
      }
    }
  }
}
