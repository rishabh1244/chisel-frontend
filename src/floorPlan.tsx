import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import {
  Upload, RotateCcw, Move3d, FileJson, AlertCircle, Circle, CheckCircle2,
  Layers, Settings, Share2, Edit3, Ruler, Grid3x3, Plus, Filter,
  ChevronRight, ChevronDown, Clock, MessageSquare, User, Pin,
} from "lucide-react";

// ---------- Types ----------

interface FloorplanData {
  walls: { start: number[]; end: number[] }[];
  doors: { position: number[]; width: number }[];
  windows: { wall: number; position: number }[];
  rooms: { name: string; polygon: number[][] }[];
}

interface IssueData {
  _id: string;
  name: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  openedBy: { _id: string; username: string };
  assignedTo?: { _id: string; username: string };
  position?: { x: number; z: number };
  comments: { author: { _id: string; username: string }; content: string; createdAt: string }[];
  createdAt: string;
}

interface ProjectData {
  _id: string;
  projectName: string;
  headOfConstruction: { _id: string; username: string };
  workers: { worker: { _id: string; username: string }; role: string }[];
  issues: IssueData[];
  map_3d: FloorplanData;
}

interface WorkerData {
  worker: { _id: string; username: string };
  role: string;
}

// ---------- Constants ----------

const API_BASE = import.meta.env.VITE_API_URL || "";

const WALL_HEIGHT = 2.6;
const WALL_THICKNESS = 0.15;
const WINDOW_SILL = 0.9;
const WINDOW_HEIGHT = 1.1;
const WINDOW_WIDTH = 1.0;
const DOOR_HEIGHT = 2.1;

const ROOM_COLORS = [
  0x4F8A8B, 0x718355, 0x8B6F47, 0x6B5A4E, 0x5A7A6A, 0x7A6A5A, 0x6A5A7A,
];

const PRIORITY_COLORS = {
  high: { bg: "#B55442", border: "#E87A6A" },
  medium: { bg: "#D4A04D", border: "#E8C07B" },
  low: { bg: "#4F8A8B", border: "#6AAAAA" },
};

const STATUS_ICONS = {
  open: AlertCircle,
  in_progress: Circle,
  resolved: CheckCircle2,
};

// ---------- Geometry helpers (unchanged) ----------

function wallVector(wall: { start: number[]; end: number[] }) {
  const [sx, sz] = wall.start;
  const [ex, ez] = wall.end;
  const dx = ex - sx;
  const dz = ez - sz;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  return { sx, sz, ex, ez, dx, dz, length, angle };
}

function projectPointOnWall(point: number[], wall: { start: number[]; end: number[] }) {
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

function computeWallIntervals(wall: { start: number[]; end: number[] }, _wallIndex: number, doors: { position: number[]; width: number }[]) {
  const { length } = wallVector(wall);
  if (length === 0) return [];
  const gaps: number[][] = [];
  doors.forEach((door) => {
    const { t, distance } = projectPointOnWall(door.position, wall);
    if (distance < 0.35 && t > -0.02 && t < 1.02) {
      const halfWidthT = (door.width || 0.9) / 2 / length;
      gaps.push([Math.max(0, t - halfWidthT), Math.min(1, t + halfWidthT)]);
    }
  });
  gaps.sort((a, b) => a[0] - b[0]);
  let intervals: number[][] = [[0, 1]];
  gaps.forEach(([g0, g1]) => {
    const next: number[][] = [];
    intervals.forEach(([i0, i1]) => {
      if (g1 <= i0 || g0 >= i1) { next.push([i0, i1]); return; }
      if (g0 > i0) next.push([i0, g0]);
      if (g1 < i1) next.push([g1, i1]);
    });
    intervals = next;
  });
  return intervals.filter(([a, b]) => b - a > 0.01);
}

function buildWallMesh(wall: { start: number[]; end: number[] }, t0: number, t1: number, material: THREE.MeshStandardMaterial) {
  const { sx, sz, dx, dz, length, angle } = wallVector(wall);
  const segLength = (t1 - t0) * length;
  if (segLength <= 0) return null;
  const geometry = new THREE.BoxGeometry(segLength, WALL_HEIGHT, WALL_THICKNESS);
  const mesh = new THREE.Mesh(geometry, material);
  const midT = (t0 + t1) / 2;
  mesh.position.set(sx + midT * dx, WALL_HEIGHT / 2, sz + midT * dz);
  mesh.rotation.y = -angle;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildDoorMesh(door: { position: number[]; width: number }) {
  const geometry = new THREE.BoxGeometry(door.width || 0.9, DOOR_HEIGHT, 0.05);
  const material = new THREE.MeshStandardMaterial({ color: 0x8a5a3a, transparent: true, opacity: 0.85 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(door.position[0], DOOR_HEIGHT / 2, door.position[1]);
  return mesh;
}

function buildWindowMesh(windowDef: { wall: number; position: number }, walls: { start: number[]; end: number[] }[]) {
  const wall = walls[windowDef.wall];
  if (!wall) return null;
  const { sx, sz, dx, dz, length, angle } = wallVector(wall);
  if (length === 0) return null;
  const t = windowDef.position / length;
  const geometry = new THREE.BoxGeometry(WINDOW_WIDTH, WINDOW_HEIGHT, WALL_THICKNESS + 0.02);
  const material = new THREE.MeshPhysicalMaterial({ color: 0x4F8A8B, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.1 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(sx + t * dx, WINDOW_SILL + WINDOW_HEIGHT / 2, sz + t * dz);
  mesh.rotation.y = -angle;
  return mesh;
}

function buildRoomFloor(room: { polygon: number[][] }, colorHex: number) {
  const shape = new THREE.Shape();
  room.polygon.forEach(([x, z], i) => {
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshStandardMaterial({ color: colorHex, side: THREE.DoubleSide, roughness: 0.9 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.01;
  mesh.receiveShadow = true;
  return mesh;
}

function computeBounds(data: FloorplanData) {
  const pts: number[][] = [];
  (data.walls || []).forEach((w) => { pts.push(w.start, w.end); });
  (data.rooms || []).forEach((r) => r.polygon.forEach((p) => pts.push(p)));
  if (pts.length === 0) return { cx: 0, cz: 0, radius: 10 };
  const xs = pts.map((p) => p[0]);
  const zs = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  return { cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, radius: Math.max(maxX - minX, maxZ - minZ, 4) };
}

// ---------- Helper components ----------

function IssueCard({ issue, selected, onClick }: { issue: IssueData; selected: boolean; onClick: () => void }) {
  const StatusIcon = STATUS_ICONS[issue.status];
  const priorityColor = PRIORITY_COLORS[issue.priority];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition flex items-start gap-2.5 ${
        selected ? "bg-elevated border border-amber/30" : "hover:bg-elevated/60 border border-transparent"
      }`}
    >
      <StatusIcon size={16} className="mt-0.5 shrink-0 text-faded" />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-ink truncate">{issue.name}</div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: priorityColor.bg + "30", color: priorityColor.border }}
          >
            {issue.priority}
          </span>
          {issue.assignedTo && (
            <span className="text-[10px] text-faded truncate">{issue.assignedTo.username}</span>
          )}
        </div>
      </div>
      <ChevronRight size={14} className="shrink-0 mt-1 text-faded" />
    </button>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// ---------- Main component ----------

export default function FloorplanViewer({ projectId, projectName }: { projectId?: string; projectName?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelLayerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const three = useRef<any>({});

  const [project, setProject] = useState<ProjectData | null>(null);
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIssue, setSelectedIssue] = useState<IssueData | null>(null);
  const [rightPanel, setRightPanel] = useState<"dashboard" | "issue">("dashboard");
  const [issueFilter, setIssueFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");

  // ---------- Demo fallback data ----------

  const DEMO_PROJECT: ProjectData = {
    _id: "demo-riverside",
    projectName: projectName || "Riverside Housing Complex",
    headOfConstruction: { _id: "u1", username: "Sarah Parker" },
    workers: [
      { worker: { _id: "u1", username: "Sarah Parker" }, role: "Head of Construction" },
      { worker: { _id: "u2", username: "Mike Johnson" }, role: "Structural Engineer" },
      { worker: { _id: "u3", username: "Raj Kumar" }, role: "Site Foreman" },
      { worker: { _id: "u4", username: "Lisa Chen" }, role: "Electrical Lead" },
      { worker: { _id: "u5", username: "Tom Rivera" }, role: "Plumbing Contractor" },
    ],
    issues: [
      {
        _id: "i1", name: "Foundation crack in Unit B3", description: "Hairline crack observed along the north wall foundation. Needs structural assessment before proceeding with framing.",
        status: "open", priority: "high",
        openedBy: { _id: "u3", username: "Raj Kumar" },
        assignedTo: { _id: "u2", username: "Mike Johnson" },
        position: { x: 2, z: 3 },
        comments: [
          { author: { _id: "u2", username: "Mike Johnson" }, content: "Inspected the crack. It's approximately 2mm wide. Recommending epoxy injection.", createdAt: new Date(Date.now() - 3600000).toISOString() },
          { author: { _id: "u1", username: "Sarah Parker" }, content: "Let's get a third-party assessment as well before proceeding.", createdAt: new Date(Date.now() - 1800000).toISOString() },
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        _id: "i2", name: "Electrical conduit misalignment - Floor 2", description: "Conduit routing doesn't match the updated MEP drawings. Needs rerouting before drywall.",
        status: "in_progress", priority: "medium",
        openedBy: { _id: "u4", username: "Lisa Chen" },
        assignedTo: { _id: "u4", username: "Lisa Chen" },
        position: { x: 6, z: 1 },
        comments: [
          { author: { _id: "u4", username: "Lisa Chen" }, content: "Rerouting in progress. ETA 2 days.", createdAt: new Date(Date.now() - 7200000).toISOString() },
        ],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        _id: "i3", name: "Window frame delivery delay", description: "Supplier confirmed 1-week delay on custom window frames for Units A1–A4.",
        status: "open", priority: "medium",
        openedBy: { _id: "u1", username: "Sarah Parker" },
        position: { x: 0, z: 5 },
        comments: [],
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        _id: "i4", name: "Plumbing inspection passed - Block A", description: "City inspector approved all rough-in plumbing for Block A.",
        status: "resolved", priority: "low",
        openedBy: { _id: "u5", username: "Tom Rivera" },
        assignedTo: { _id: "u5", username: "Tom Rivera" },
        position: { x: -2, z: 2 },
        comments: [
          { author: { _id: "u5", username: "Tom Rivera" }, content: "All clear. Certificate filed.", createdAt: new Date(Date.now() - 259200000).toISOString() },
        ],
        createdAt: new Date(Date.now() - 604800000).toISOString(),
      },
      {
        _id: "i5", name: "HVAC ductwork noise in Unit C1", description: "Residents reporting rattling noise from HVAC ductwork. Possibly loose mounting brackets.",
        status: "open", priority: "high",
        openedBy: { _id: "u3", username: "Raj Kumar" },
        position: { x: 8, z: 4 },
        comments: [],
        createdAt: new Date(Date.now() - 21600000).toISOString(),
      },
    ],
    map_3d: {
      walls: [
        // Outer walls - main building
        { start: [-4, -2], end: [10, -2] },
        { start: [10, -2], end: [10, 8] },
        { start: [10, 8], end: [-4, 8] },
        { start: [-4, 8], end: [-4, -2] },
        // Interior walls
        { start: [3, -2], end: [3, 8] },    // vertical divider
        { start: [-4, 3], end: [3, 3] },     // horizontal left section
        { start: [3, 5], end: [10, 5] },      // horizontal right section
        { start: [6, -2], end: [6, 5] },      // right vertical divider
      ],
      doors: [
        { position: [3, 1], width: 0.9 },
        { position: [3, 6], width: 0.9 },
        { position: [6, 2], width: 0.9 },
        { position: [5, 5], width: 0.9 },
        { position: [-0.5, 3], width: 0.9 },
        { position: [8, 5], width: 1.2 },
      ],
      windows: [
        { wall: 0, position: 3 },
        { wall: 0, position: 8 },
        { wall: 1, position: 3 },
        { wall: 1, position: 7 },
        { wall: 2, position: 4 },
        { wall: 2, position: 10 },
        { wall: 3, position: 3 },
        { wall: 3, position: 7 },
      ],
      rooms: [
        { name: "Living Room", polygon: [[-4, -2], [3, -2], [3, 3], [-4, 3]] },
        { name: "Kitchen", polygon: [[-4, 3], [3, 3], [3, 8], [-4, 8]] },
        { name: "Bedroom 1", polygon: [[3, -2], [6, -2], [6, 5], [3, 5]] },
        { name: "Bedroom 2", polygon: [[6, -2], [10, -2], [10, 5], [6, 5]] },
        { name: "Bathroom", polygon: [[3, 5], [10, 5], [10, 8], [3, 8]] },
      ],
    },
  };

  // ---------- API fetch ----------

  useEffect(() => {
    (async () => {
      try {
        if (projectId) {
          const res = await fetch(`${API_BASE}/projects/${projectId}`);
          const data: ProjectData = await res.json();
          setProject(data);
          setIssues(data.issues || []);
          setWorkers(data.workers || []);
        } else {
          const listRes = await fetch(`${API_BASE}/projects`);
          console.log(`${API_BASE}/projects`)
          const projects = await listRes.json();
          if (!projects.length) { setLoading(false); return; }
          const res = await fetch(`${API_BASE}/projects/${projects[0]._id}`);
          const data: ProjectData = await res.json();
          setProject(data);
          setIssues(data.issues || []);
          setWorkers(data.workers || []);
        }
      } catch (err: any) {
        // Fallback to demo data when API is unavailable
        console.warn("API unavailable, using demo data:", err.message);
        setProject(DEMO_PROJECT);
        setIssues(DEMO_PROJECT.issues);
        setWorkers(DEMO_PROJECT.workers);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const floorplanData = project?.map_3d;

  // ---------- Three.js setup ----------

  useEffect(() => {
    if (loading) return;
    const mount = mountRef.current;
    if (!mount) return;
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const sun = new THREE.DirectionalLight(0xfff2e0, 0.9);
    sun.position.set(15, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const grid = new THREE.GridHelper(200, 200, 0x4B4036, 0x312922);
    scene.add(grid);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

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
      camera.position.set(
        target.x + radius * Math.sin(polar) * Math.sin(azimuth),
        target.y + radius * Math.cos(polar),
        target.z + radius * Math.sin(polar) * Math.cos(azimuth),
      );
      camera.lookAt(target);
    }
    updateCamera();

    const dom = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => { controls.dragging = true; controls.lastX = e.clientX; controls.lastY = e.clientY; };
    const onPointerUp = () => { controls.dragging = false; };
    const onPointerMove = (e: PointerEvent) => {
      if (!controls.dragging) return;
      controls.azimuth -= (e.clientX - controls.lastX) * 0.006;
      controls.polar = Math.min(Math.max(controls.polar - (e.clientY - controls.lastY) * 0.006, 0.15), Math.PI / 2 - 0.02);
      controls.lastX = e.clientX;
      controls.lastY = e.clientY;
      updateCamera();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      controls.radius = Math.min(Math.max(controls.radius + e.deltaY * 0.02, 3), 120);
      updateCamera();
    };

    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let rafId: number;
    const labelData: { current: { el: HTMLElement; position: THREE.Vector3 }[] } = { current: [] };

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
      const layer = labelLayerRef.current;
      if (layer) {
        labelData.current.forEach(({ el, position }) => {
          const proj = position.clone().project(camera);
          const x = (proj.x * 0.5 + 0.5) * mount.clientWidth;
          const y = (-proj.y * 0.5 + 0.5) * mount.clientHeight;
          el.style.display = proj.z < 1 ? "block" : "none";
          el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        });
      }
    };
    animate();

    three.current = { scene, camera, renderer, modelGroup, controls, updateCamera, labelData };

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
  }, [loading]);

  // ---------- Rebuild model when data changes ----------

  useEffect(() => {
    const ctx = three.current;
    if (!ctx.modelGroup || !floorplanData) return;

    const { modelGroup, controls, updateCamera, labelData } = ctx;

    while (modelGroup.children.length) {
      const child = modelGroup.children.pop();
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    }

    const layer = labelLayerRef.current;
    if (layer) layer.innerHTML = "";
    labelData.current = [];

    const data = floorplanData;
    const walls = data.walls || [];
    const doors = data.doors || [];
    const windows = data.windows || [];
    const rooms = data.rooms || [];

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.85 });

    rooms.forEach((room, i) => {
      const floor = buildRoomFloor(room, ROOM_COLORS[i % ROOM_COLORS.length]);
      modelGroup.add(floor);
      if (layer) {
        const cx = room.polygon.reduce((s: number, p: number[]) => s + p[0], 0) / room.polygon.length;
        const cz = room.polygon.reduce((s: number, p: number[]) => s + p[1], 0) / room.polygon.length;
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

    walls.forEach((wall, i) => {
      computeWallIntervals(wall, i, doors).forEach(([t0, t1]) => {
        const mesh = buildWallMesh(wall, t0, t1, wallMaterial);
        if (mesh) modelGroup.add(mesh);
      });
    });

    doors.forEach((door) => {
      const mesh = buildDoorMesh(door);
      if (mesh) modelGroup.add(mesh);
    });

    windows.forEach((w) => {
      const mesh = buildWindowMesh(w, walls);
      if (mesh) modelGroup.add(mesh);
    });

    // Issue pins as 3D sprites
    const pinCanvas = document.createElement("canvas");
    pinCanvas.width = 48;
    pinCanvas.height = 48;

    issues.forEach((issue) => {
      if (!issue.position) return;
      const pinCtx = pinCanvas.getContext("2d")!;
      pinCtx.clearRect(0, 0, 48, 48);
      const color = PRIORITY_COLORS[issue.priority].bg;
      const isSelected = selectedIssue?._id === issue._id;
      pinCtx.beginPath();
      pinCtx.arc(24, 24, isSelected ? 20 : 16, 0, Math.PI * 2);
      pinCtx.fillStyle = color;
      pinCtx.fill();
      pinCtx.strokeStyle = "#F6E8D5";
      pinCtx.lineWidth = isSelected ? 3 : 2;
      pinCtx.stroke();
      const texture = new THREE.CanvasTexture(pinCanvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(issue.position.x, 0.5, issue.position.z);
      sprite.scale.set(0.8, 0.8, 1);
      modelGroup.add(sprite);
    });

    const { cx, cz, radius } = computeBounds(data);
    controls.target.set(cx, 0, cz);
    controls.radius = radius * 1.6;
    controls.polar = Math.PI / 3.2;
    controls.azimuth = Math.PI / 4;
    updateCamera();
  }, [floorplanData, issues, selectedIssue]);

  // ---------- Computed values ----------

  const openIssues = issues.filter((i) => i.status === "open");
  const inProgressIssues = issues.filter((i) => i.status === "in_progress");
  const resolvedIssues = issues.filter((i) => i.status === "resolved");

  const filteredIssues = issueFilter === "all"
    ? issues
    : issues.filter((i) => i.status === issueFilter);

  const recentActivity = issues
    .flatMap((i) => i.comments.map((c) => ({ ...c, issueName: i.name, issueId: i._id })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // ---------- Handlers ----------

  const handleSelectIssue = (issue: IssueData) => {
    setSelectedIssue(issue);
    setRightPanel("issue");
  };

  const handleCloseIssue = () => {
    setSelectedIssue(null);
    setRightPanel("dashboard");
  };

  // ---------- Loading / Error ----------

  return (
    <div className="h-screen flex flex-col bg-paper text-ink overflow-hidden select-none relative">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-paper">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-amber border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-faded">Loading project...</span>
          </div>
        </div>
      )}
      {/* Error overlay */}
      {error && !project && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-paper">
          <div className="text-center">
            <FileJson size={32} className="mx-auto mb-2 opacity-50 text-error" />
            <p className="text-sm text-error">{error}</p>
          </div>
        </div>
      )}
      {/* ===== Top Toolbar ===== */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-panel shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold tracking-wide text-amber">CHISEL</span>
            <span className="text-border">/</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{project?.projectName || projectName}</span>
              <span className="text-[10px] text-faded border border-border rounded px-1.5 py-0.5">Blueprint v4</span>
            </div>
            <div className="text-[11px] text-faded">
              Last updated {project ? formatDate(project.issues[0]?.createdAt || new Date().toISOString()) : "-"}
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-paper rounded-lg p-0.5 border border-border">
          {["Plan", "3D", "Section", "BIM"].map((mode) => (
            <button
              key={mode}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition ${
                mode === "3D" ? "bg-amber text-paper" : "text-faded hover:text-ink"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { icon: Edit3, label: "Edit" },
            { icon: Ruler, label: "Measure" },
            { icon: Layers, label: "Layers" },
            { icon: Settings, label: "Settings" },
            { icon: Share2, label: "Share" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex items-center gap-1.5 text-xs text-faded hover:text-ink px-2 py-1.5 rounded-md hover:bg-elevated transition"
            >
              <Icon size={14} />
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ===== Main area ===== */}
      <div className="flex flex-1 overflow-hidden">

        {/* ===== Left Sidebar - Issues ===== */}
        <aside className="w-72 shrink-0 border-r border-border bg-panel flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink">Issues ({issues.length})</h2>
              <button className="flex items-center gap-1 text-xs font-medium text-amber hover:opacity-80 transition">
                <Plus size={14} />
                New
              </button>
            </div>
            <div className="flex gap-1">
              {[
                { key: "all", label: "All", count: issues.length },
                { key: "open", label: "Open", count: openIssues.length },
                { key: "in_progress", label: "In Progress", count: inProgressIssues.length },
                { key: "resolved", label: "Resolved", count: resolvedIssues.length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setIssueFilter(key as any)}
                  className={`flex-1 text-[11px] font-medium py-1.5 rounded-md transition ${
                    issueFilter === key
                      ? "bg-amber/20 text-amber"
                      : "text-faded hover:text-ink hover:bg-elevated"
                  }`}
                >
                  {label}
                  <span className="ml-1 opacity-60">{count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredIssues.length === 0 && (
              <div className="text-center py-8 text-faded text-xs">No issues match this filter.</div>
            )}
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                selected={selectedIssue?._id === issue._id}
                onClick={() => handleSelectIssue(issue)}
              />
            ))}
          </div>

          <div className="p-2 border-t border-border">
            <button className="flex items-center gap-2 w-full text-xs text-faded hover:text-ink px-2 py-1.5 rounded-md hover:bg-elevated transition">
              <Filter size={14} />
              Filters — Discipline, Priority, Assigned, Status
            </button>
          </div>
        </aside>

        {/* ===== 3D Viewport ===== */}
        <main className="flex-1 relative">
          <div ref={mountRef} className="absolute inset-0" />
          <div ref={labelLayerRef} className="absolute inset-0 pointer-events-none z-10" />

          {/* Floating controls */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
            {[
              { icon: Edit3, label: "Annotate" },
              { icon: Ruler, label: "Measure" },
              { icon: Grid3x3, label: "Explode" },
              { icon: Layers, label: "Layers" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                title={label}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-panel/80 backdrop-blur border border-border text-faded hover:text-ink hover:bg-elevated transition text-xs"
              >
                <Icon size={15} />
              </button>
            ))}
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-panel/80 backdrop-blur rounded-lg px-2 py-1 border border-border">
            {["Orbit", "Walk", "Top", "Perspective"].map((mode) => (
              <button
                key={mode}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition ${
                  mode === "Orbit" ? "bg-amber/20 text-amber" : "text-faded hover:text-ink"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1 bg-panel/80 backdrop-blur rounded-lg p-2 border border-border">
            <label className="flex items-center gap-2 text-[11px] text-faded cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-amber" /> Walls
            </label>
            <label className="flex items-center gap-2 text-[11px] text-faded cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-amber" /> Doors
            </label>
            <label className="flex items-center gap-2 text-[11px] text-faded cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-amber" /> Windows
            </label>
          </div>
        </main>

        {/* ===== Right Panel ===== */}
        <aside className="w-80 shrink-0 border-l border-border bg-panel flex flex-col overflow-hidden">
          {rightPanel === "dashboard" && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b border-border">
                <h2 className="text-sm font-semibold text-ink mb-3">Project Progress</h2>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-2 rounded-full bg-elevated overflow-hidden">
                    <div className="h-full rounded-full bg-amber" style={{ width: "62%" }} />
                  </div>
                  <span className="text-sm font-semibold text-amber">62%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-border">
                {[
                  { label: "Issues", value: issues.length, color: "text-amber" },
                  { label: "Open", value: openIssues.length, color: "text-error" },
                  { label: "Workers", value: workers.length, color: "text-teal" },
                  { label: "Resolved", value: resolvedIssues.length, color: "text-success" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-panel p-3">
                    <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-[11px] text-faded">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="p-4">
                <h3 className="text-xs font-semibold text-ink mb-3 flex items-center gap-1.5">
                  <Clock size={13} />
                  Recent Activity
                </h3>
                <div className="space-y-2.5">
                  {recentActivity.length === 0 && (
                    <p className="text-xs text-faded">No recent activity.</p>
                  )}
                  {recentActivity.map((comment, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-elevated flex items-center justify-center shrink-0 mt-0.5">
                        <User size={10} className="text-faded" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-ink leading-tight">
                          <span className="font-medium">{comment.author.username}</span>
                          {" commented on "}
                          <span className="text-faded">{comment.issueName}</span>
                        </p>
                        <p className="text-[10px] text-faded mt-0.5">{formatDate(comment.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {rightPanel === "issue" && selectedIssue && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-faded">#{selectedIssue._id.slice(-6).toUpperCase()}</span>
                  <button onClick={handleCloseIssue} className="text-faded hover:text-ink text-xs">Close</button>
                </div>
                <h3 className="text-sm font-semibold text-ink mb-2">{selectedIssue.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: PRIORITY_COLORS[selectedIssue.priority].bg + "30", color: PRIORITY_COLORS[selectedIssue.priority].border }}
                  >
                    {selectedIssue.priority}
                  </span>
                  <span className="text-[10px] text-faded capitalize">{selectedIssue.status.replace("_", " ")}</span>
                </div>
                <p className="text-xs text-faded leading-relaxed">{selectedIssue.description}</p>
                <div className="flex items-center gap-3 mt-3 text-[11px] text-faded">
                  <span>Opened by <span className="text-ink">{selectedIssue.openedBy.username}</span></span>
                  {selectedIssue.assignedTo && (
                    <span>Assigned to <span className="text-ink">{selectedIssue.assignedTo.username}</span></span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h4 className="text-xs font-semibold text-ink mb-3 flex items-center gap-1.5">
                  <MessageSquare size={13} />
                  Comments ({selectedIssue.comments.length})
                </h4>
                <div className="space-y-3">
                  {selectedIssue.comments.map((comment, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-elevated flex items-center justify-center shrink-0 mt-0.5">
                        <User size={11} className="text-faded" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-ink">{comment.author.username}</span>
                          <span className="text-[10px] text-faded">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-xs text-faded mt-0.5">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ===== Bottom Bar ===== */}
      <footer className="border-t border-border bg-panel shrink-0">
        <div className="flex items-center px-4 py-2 gap-6">
          <div className="flex items-center gap-3 flex-1">
            {[
              { label: "Foundation", pct: 100, status: "Done" },
              { label: "Structure", pct: 65, status: "In Progress" },
              { label: "MEP", pct: 20, status: "Pending" },
              { label: "Finishing", pct: 0, status: "Pending" },
            ].map((stage) => (
              <div key={stage.label} className="flex items-center gap-2 min-w-0">
                <div className="w-16 h-1.5 rounded-full bg-elevated overflow-hidden shrink-0">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stage.pct === 100 ? "bg-success" : stage.pct > 0 ? "bg-amber" : "bg-border"
                    }`}
                    style={{ width: `${stage.pct}%` }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-ink truncate">{stage.label}</div>
                  <div className="text-[10px] text-faded">{stage.status}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-4">
            <span className="text-[11px] text-faded mr-1">Version</span>
            {["v1", "v2", "v3", "v4"].map((v) => (
              <button
                key={v}
                className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                  v === "v4" ? "bg-amber/20 text-amber" : "text-faded hover:text-ink"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
