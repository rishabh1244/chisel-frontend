import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Upload, RotateCcw, Move3d, FileJson } from "lucide-react";

/**
 * FloorplanViewer
 * ----------------
 * Reads a floorplan JSON (walls / doors / windows / rooms) and renders
 * an interactive, roofless 3D model with three.js.
 *
 * Expected JSON shape:
 * {
 *   "walls":   [{ "start": [x,z], "end": [x,z] }, ...],
 *   "doors":   [{ "position": [x,z], "width": number }, ...],
 *   "windows": [{ "wall": wallIndex, "position": distanceAlongWall }, ...],
 *   "rooms":   [{ "name": string, "polygon": [[x,z], ...] }, ...]
 * }
 *
 * Units are treated as meters. X/Z form the ground plane, Y is height.
 */

// ---------- Tunable constants ----------
const WALL_HEIGHT = 2.6;
const WALL_THICKNESS = 0.15;
const WINDOW_SILL = 0.9;
const WINDOW_HEIGHT = 1.1;
const WINDOW_WIDTH = 1.0;
const DOOR_HEIGHT = 2.1;

const ROOM_COLORS = [
  0xD79B5B, 0xB66A3C, 0x4F8A8B, 0x718355, 0xE6C07B, 0xC97BA5, 0xDFA052,
];

const SAMPLE_DATA = {
  walls: [
    { start: [0, 0], end: [10, 0] },
    { start: [10, 0], end: [10, 8] },
    { start: [10, 8], end: [0, 8] },
    { start: [0, 8], end: [0, 0] },
    { start: [4, 0], end: [4, 8] },
  ],
  doors: [
    { position: [2, 0], width: 1 },
    { position: [4, 3], width: 0.9 },
  ],
  windows: [
    { wall: 1, position: 3 },
    { wall: 2, position: 2.5 },
    { wall: 2, position: 6 },
  ],
  rooms: [
    { name: "Living Room", polygon: [[0, 0], [4, 0], [4, 8], [0, 8]] },
    { name: "Bedroom", polygon: [[4, 0], [10, 0], [10, 8], [4, 8]] },
  ],
};

// ---------- Geometry helpers ----------

function wallVector(wall) {
  const [sx, sz] = wall.start;
  const [ex, ez] = wall.end;
  const dx = ex - sx;
  const dz = ez - sz;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx); // rotation around Y
  return { sx, sz, ex, ez, dx, dz, length, angle };
}

// Distance (and parametric t) of a point projected onto a wall segment
function projectPointOnWall(point, wall) {
  const { sx, sz, dx, dz, length } = wallVector(wall);
  if (length === 0) return { t: 0, distance: Infinity };
  const [px, pz] = point;
  const wx = px - sx;
  const wz = pz - sz;
  const t = (wx * dx + wz * dz) / (length * length);
  const closestX = sx + t * dx;
  const closestZ = sz + t * dz;
  const distance = Math.hypot(px - closestX, pz - closestZ);
  return { t, distance };
}

// Build solid wall segments (as [t0, t1] intervals along the wall, 0..1)
// after cutting out door gaps that belong to this wall.
function computeWallIntervals(wall, wallIndex, doors) {
  const { length } = wallVector(wall);
  if (length === 0) return [];

  const gaps = [];
  doors.forEach((door) => {
    const { t, distance } = projectPointOnWall(door.position, wall);
    // Only treat this door as belonging to the wall if it's close to the
    // wall line and within the segment bounds.
    if (distance < 0.35 && t > -0.02 && t < 1.02) {
      const halfWidthT = (door.width || 0.9) / 2 / length;
      gaps.push([Math.max(0, t - halfWidthT), Math.min(1, t + halfWidthT)]);
    }
  });

  gaps.sort((a, b) => a[0] - b[0]);

  let intervals = [[0, 1]];
  gaps.forEach(([g0, g1]) => {
    const next = [];
    intervals.forEach(([i0, i1]) => {
      if (g1 <= i0 || g0 >= i1) {
        next.push([i0, i1]);
        return;
      }
      if (g0 > i0) next.push([i0, g0]);
      if (g1 < i1) next.push([g1, i1]);
    });
    intervals = next;
  });

  return intervals.filter(([a, b]) => b - a > 0.01);
}

function buildWallMesh(wall, t0, t1, material) {
  const { sx, sz, dx, dz, length, angle } = wallVector(wall);
  const segLength = (t1 - t0) * length;
  if (segLength <= 0) return null;

  const geometry = new THREE.BoxGeometry(segLength, WALL_HEIGHT, WALL_THICKNESS);
  const mesh = new THREE.Mesh(geometry, material);

  const midT = (t0 + t1) / 2;
  const midX = sx + midT * dx;
  const midZ = sz + midT * dz;

  mesh.position.set(midX, WALL_HEIGHT / 2, midZ);
  mesh.rotation.y = -angle;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildDoorMesh(door) {
  const geometry = new THREE.BoxGeometry(door.width || 0.9, DOOR_HEIGHT, 0.05);
  const material = new THREE.MeshStandardMaterial({
    color: 0x8a5a3a,
    transparent: true,
    opacity: 0.85,
  });
  const mesh = new THREE.Mesh(geometry, material);
  const [x, z] = door.position;
  mesh.position.set(x, DOOR_HEIGHT / 2, z);
  return mesh;
}

function buildWindowMesh(windowDef, walls) {
  const wall = walls[windowDef.wall];
  if (!wall) return null;
  const { sx, sz, dx, dz, length, angle } = wallVector(wall);
  if (length === 0) return null;

  const t = windowDef.position / length;
  const x = sx + t * dx;
  const z = sz + t * dz;

  const geometry = new THREE.BoxGeometry(WINDOW_WIDTH, WINDOW_HEIGHT, WALL_THICKNESS + 0.02);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x4F8A8B,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, WINDOW_SILL + WINDOW_HEIGHT / 2, z);
  mesh.rotation.y = -angle;
  return mesh;
}

function buildRoomFloor(room, colorHex) {
  const shape = new THREE.Shape();
  room.polygon.forEach(([x, z], i) => {
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshStandardMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    roughness: 0.9,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2; // lay flat on XZ plane
  mesh.position.y = 0.01; // avoid z-fighting with a base grid
  mesh.receiveShadow = true;
  return mesh;
}

function computeBounds(data) {
  const pts = [];
  (data.walls || []).forEach((w) => {
    pts.push(w.start, w.end);
  });
  (data.rooms || []).forEach((r) => r.polygon.forEach((p) => pts.push(p)));
  if (pts.length === 0) return { cx: 0, cz: 0, radius: 10 };
  const xs = pts.map((p) => p[0]);
  const zs = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const radius = Math.max(maxX - minX, maxZ - minZ, 4);
  return { cx, cz, radius };
}

// ---------- Main component ----------

export default function FloorplanViewer() {
  const mountRef = useRef(null);
  const labelLayerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [floorplan, setFloorplan] = useState(SAMPLE_DATA);
  const [fileName, setFileName] = useState("sample-floorplan.json");
  const [error, setError] = useState(null);

  // Persistent three.js refs so we don't rebuild the renderer every render
  const three = useRef({});

  const handleFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.walls) throw new Error("JSON must include a 'walls' array");
        setFloorplan(parsed);
        setFileName(file.name);
        setError(null);
      } catch (err) {
        setError("Couldn't parse that file: " + err.message);
      }
    };
    reader.readAsText(file);
  }, []);

  // Set up the three.js scene once
  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x191613);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff2e0, 0.9);
    sun.position.set(15, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const grid = new THREE.GridHelper(200, 200, 0x4B4036, 0x312922);
    scene.add(grid);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // --- Minimal orbit-style camera controller (no external deps) ---
    const controls = {
      target: new THREE.Vector3(0, 0, 0),
      radius: 20,
      azimuth: Math.PI / 4,
      polar: Math.PI / 3.2,
      dragging: false,
      lastX: 0,
      lastY: 0,
    };

    function updateCamera() {
      const { target, radius, azimuth, polar } = controls;
      const x = target.x + radius * Math.sin(polar) * Math.sin(azimuth);
      const y = target.y + radius * Math.cos(polar);
      const z = target.z + radius * Math.sin(polar) * Math.cos(azimuth);
      camera.position.set(x, y, z);
      camera.lookAt(target);
    }
    updateCamera();

    const dom = renderer.domElement;

    const onPointerDown = (e) => {
      controls.dragging = true;
      controls.lastX = e.clientX;
      controls.lastY = e.clientY;
    };
    const onPointerUp = () => {
      controls.dragging = false;
    };
    const onPointerMove = (e) => {
      if (!controls.dragging) return;
      const dx = e.clientX - controls.lastX;
      const dy = e.clientY - controls.lastY;
      controls.lastX = e.clientX;
      controls.lastY = e.clientY;
      controls.azimuth -= dx * 0.006;
      controls.polar = Math.min(
        Math.max(controls.polar - dy * 0.006, 0.15),
        Math.PI / 2 - 0.02
      );
      updateCamera();
    };
    const onWheel = (e) => {
      e.preventDefault();
      controls.radius = Math.min(
        Math.max(controls.radius + e.deltaY * 0.02, 3),
        120
      );
      updateCamera();
    };

    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let rafId;
    const labelData = { current: [] }; // filled in by rebuildModel

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      renderer.render(scene, camera);

      // Move HTML room-name labels to match projected 3D positions
      const layer = labelLayerRef.current;
      if (layer) {
        labelData.current.forEach(({ el, position }) => {
          const proj = position.clone().project(camera);
          const x = (proj.x * 0.5 + 0.5) * mount.clientWidth;
          const y = (-proj.y * 0.5 + 0.5) * mount.clientHeight;
          const visible = proj.z < 1;
          el.style.display = visible ? "block" : "none";
          el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        });
      }
    };
    animate();

    three.current = {
      scene,
      camera,
      renderer,
      modelGroup,
      controls,
      updateCamera,
      labelData,
    };

    return () => {
      cancelAnimationFrame(rafId);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(dom)) mount.removeChild(dom);
    };
  }, []);

  // Rebuild the 3D model whenever the floorplan data changes
  useEffect(() => {
    const ctx = three.current;
    if (!ctx.modelGroup) return;

    const { modelGroup, controls, updateCamera, labelData } = ctx;

    // Clear previous geometry
    while (modelGroup.children.length) {
      const child = modelGroup.children.pop();
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    }

    const layer = labelLayerRef.current;
    if (layer) layer.innerHTML = "";
    labelData.current = [];

    const walls = floorplan.walls || [];
    const doors = floorplan.doors || [];
    const windows = floorplan.windows || [];
    const rooms = floorplan.rooms || [];

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e2d6,
      roughness: 0.85,
    });

    // Rooms (floors) first so walls sit visually on top
    rooms.forEach((room, i) => {
      const floor = buildRoomFloor(room, ROOM_COLORS[i % ROOM_COLORS.length]);
      modelGroup.add(floor);

      // Room label as an HTML overlay, positioned each frame in the render loop
      if (layer) {
        const cx = room.polygon.reduce((s, p) => s + p[0], 0) / room.polygon.length;
        const cz = room.polygon.reduce((s, p) => s + p[1], 0) / room.polygon.length;
        const el = document.createElement("div");
        el.textContent = room.name;
        el.style.position = "absolute";
        el.style.padding = "2px 8px";
        el.style.borderRadius = "999px";
        el.style.background = "rgba(36,31,26,0.85)";
        el.style.color = "#F6E8D5";
        el.style.fontSize = "13px";
        el.style.fontFamily = "'IBM Plex Sans', sans-serif";
        el.style.whiteSpace = "nowrap";
        el.style.pointerEvents = "none";
        layer.appendChild(el);
        labelData.current.push({ el, position: new THREE.Vector3(cx, 0.05, cz) });
      }
    });

    // Walls, with door gaps cut out
    walls.forEach((wall, i) => {
      const intervals = computeWallIntervals(wall, i, doors);
      intervals.forEach(([t0, t1]) => {
        const mesh = buildWallMesh(wall, t0, t1, wallMaterial);
        if (mesh) modelGroup.add(mesh);
      });
    });

    // Doors (as thin open panels marking the opening)
    doors.forEach((door) => {
      const mesh = buildDoorMesh(door);
      modelGroup.add(mesh);
    });

    // Windows
    windows.forEach((w) => {
      const mesh = buildWindowMesh(w, walls);
      if (mesh) modelGroup.add(mesh);
    });

    // Frame the camera around the new model
    const { cx, cz, radius } = computeBounds(floorplan);
    controls.target.set(cx, 0, cz);
    controls.radius = radius * 1.6;
    controls.polar = Math.PI / 3.2;
    controls.azimuth = Math.PI / 4;
    updateCamera();
  }, [floorplan]);

  return (
    <div className="w-full h-[calc(100vh-67px)] flex flex-col bg-paper text-ink overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-panel">
        <div className="flex items-center gap-2 min-w-0">
          <Move3d size={18} className="text-amber shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate text-ink">{fileName}</div>
            <div className="text-xs text-faded">
              Drag to orbit &middot; scroll to zoom
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md bg-amber text-paper hover:opacity-90 transition"
          >
            <Upload size={14} />
            Upload floorplan JSON
          </button>
          <button
            onClick={() => {
              setFloorplan(SAMPLE_DATA);
              setFileName("sample-floorplan.json");
              setError(null);
            }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md border border-border text-faded hover:bg-elevated transition"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs bg-error/20 text-error flex items-center gap-2">
          <FileJson size={14} />
          {error}
        </div>
      )}

      {/* 3D viewport */}
      <div className="relative flex-1">
        <div ref={mountRef} className="absolute inset-0" />
        <div ref={labelLayerRef} className="absolute inset-0 pointer-events-none" />
      </div>
    </div>
  );
}
