// ---------- Types ----------

export interface FloorplanData {
  walls: { start: number[]; end: number[] }[];
  doors: { position: number[]; width: number }[];
  windows: { wall: number; position: number }[];
  rooms: { name: string; polygon: number[][] }[];
}

export interface IssueData {
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

export interface WorkerData {
  worker: { _id: string; username: string };
  role: string;
}

export interface ProjectData {
  _id: string;
  projectName: string;
  headOfConstruction: { _id: string; username: string };
  workers: WorkerData[];
  issues: IssueData[];
  map_3d: FloorplanData;
  progress: number;
  stages: { label: string; pct: number; status: string }[];
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  status: string;
  crew: { initials: string; name: string }[];
}

// ---------- Project List (for Dashboard) ----------

export const PROJECT_LIST: ProjectListItem[] = [
  {
    id: "1",
    name: "Downtown Office Tower",
    description: "30-story commercial building · 2.4M sq ft",
    lastUpdated: "3h ago",
    status: "Active",
    crew: [
      { initials: "JW", name: "James Walker" },
      { initials: "AN", name: "Anna Novak" },
      { initials: "DL", name: "David Lee" },
      { initials: "KP", name: "Karen Price" },
    ],
  },
  {
    id: "2",
    name: "Riverside Housing Complex",
    description: "150-unit residential development · Phase 2",
    lastUpdated: "1d ago",
    status: "Active",
    crew: [
      { initials: "SP", name: "Sarah Parker" },
      { initials: "MJ", name: "Mike Johnson" },
      { initials: "RK", name: "Raj Kumar" },
    ],
  },
  {
    id: "3",
    name: "Highway Bridge Renovation",
    description: "Structural upgrade of existing bridge · I-95",
    lastUpdated: "5h ago",
    status: "Active",
    crew: [
      { initials: "CR", name: "Carlos Reyes" },
      { initials: "EM", name: "Elena Martinez" },
      { initials: "BT", name: "Brian Thompson" },
      { initials: "YK", name: "Yuki Kobayashi" },
      { initials: "PD", name: "Priya Das" },
    ],
  },
];

// ============================================================
// PROJECT 1 — Downtown Office Tower
// ============================================================

const OFFICE_TOWER_DATA: ProjectData = {
  _id: "demo-office-tower",
  projectName: "Downtown Office Tower",
  headOfConstruction: { _id: "ot1", username: "James Walker" },
  workers: [
    { worker: { _id: "ot1", username: "James Walker" }, role: "Project Manager" },
    { worker: { _id: "ot2", username: "Anna Novak" }, role: "Structural Engineer" },
    { worker: { _id: "ot3", username: "David Lee" }, role: "MEP Coordinator" },
    { worker: { _id: "ot4", username: "Karen Price" }, role: "Architect" },
    { worker: { _id: "ot5", username: "Marcus Hall" }, role: "Safety Officer" },
  ],
  progress: 45,
  stages: [
    { label: "Foundation", pct: 100, status: "Done" },
    { label: "Structure", pct: 80, status: "In Progress" },
    { label: "Façade", pct: 30, status: "In Progress" },
    { label: "MEP", pct: 15, status: "Pending" },
    { label: "Interiors", pct: 0, status: "Pending" },
  ],
  issues: [
    {
      _id: "ot-i1",
      name: "Elevator shaft misalignment – Floor 12",
      description: "Elevator guide rails on floors 12-14 are off by 8mm from design specs. Needs realignment before cab installation.",
      status: "open",
      priority: "high",
      openedBy: { _id: "ot2", username: "Anna Novak" },
      assignedTo: { _id: "ot2", username: "Anna Novak" },
      position: { x: 10, z: 3 },
      comments: [
        { author: { _id: "ot2", username: "Anna Novak" }, content: "Survey confirms 8mm deviation. Recommending shim correction.", createdAt: new Date(Date.now() - 7200000).toISOString() },
        { author: { _id: "ot1", username: "James Walker" }, content: "Let's get the elevator subcontractor on site ASAP.", createdAt: new Date(Date.now() - 3600000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      _id: "ot-i2",
      name: "Fire suppression system inspection",
      description: "Sprinkler system on floors 1-5 needs final inspection before drywall can proceed.",
      status: "in_progress",
      priority: "high",
      openedBy: { _id: "ot3", username: "David Lee" },
      assignedTo: { _id: "ot3", username: "David Lee" },
      position: { x: -2, z: 7 },
      comments: [
        { author: { _id: "ot3", username: "David Lee" }, content: "Inspector scheduled for Thursday. Pre-check completed on floors 1-3.", createdAt: new Date(Date.now() - 14400000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      _id: "ot-i3",
      name: "Steel beam corrosion – Parking Level B2",
      description: "Surface corrosion found on 4 steel beams in the underground parking level. Likely from water ingress.",
      status: "open",
      priority: "medium",
      openedBy: { _id: "ot5", username: "Marcus Hall" },
      assignedTo: { _id: "ot2", username: "Anna Novak" },
      position: { x: 5, z: -3 },
      comments: [
        { author: { _id: "ot5", username: "Marcus Hall" }, content: "Documented all 4 affected beams with photos. Waterproofing membrane needs review.", createdAt: new Date(Date.now() - 86400000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      _id: "ot-i4",
      name: "HVAC zoning conflict – Floor 8",
      description: "Mechanical plans show conflicting duct routes for zones A and C. Needs MEP coordination meeting.",
      status: "open",
      priority: "medium",
      openedBy: { _id: "ot3", username: "David Lee" },
      position: { x: -4, z: 0 },
      comments: [],
      createdAt: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      _id: "ot-i5",
      name: "Curtain wall seal failure – West face",
      description: "Water leak detected at curtain wall joints on the west elevation between floors 6-8.",
      status: "resolved",
      priority: "high",
      openedBy: { _id: "ot4", username: "Karen Price" },
      assignedTo: { _id: "ot4", username: "Karen Price" },
      position: { x: -7, z: 4 },
      comments: [
        { author: { _id: "ot4", username: "Karen Price" }, content: "Sealant replaced and pressure tested. No further leaks detected after 48-hour monitoring.", createdAt: new Date(Date.now() - 604800000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 1209600000).toISOString(),
    },
  ],
  map_3d: {
    walls: [
      // Outer walls — large office floor plate
      { start: [-8, -5], end: [12, -5] },   // south wall
      { start: [12, -5], end: [12, 10] },    // east wall
      { start: [12, 10], end: [-8, 10] },    // north wall
      { start: [-8, 10], end: [-8, -5] },    // west wall
      // Core (elevator/stairs)
      { start: [8, -1], end: [12, -1] },
      { start: [8, -1], end: [8, 5] },
      { start: [8, 5], end: [12, 5] },
      // Conference wing divider
      { start: [-8, 3], end: [-2, 3] },
      // Break room divider
      { start: [-2, 3], end: [-2, 10] },
      // Executive suite wall
      { start: [-8, 7], end: [-2, 7] },
      // Open office / server room divider
      { start: [4, -5], end: [4, -1] },
    ],
    doors: [
      { position: [10, -1], width: 1.4 },   // core entry south
      { position: [10, 5], width: 1.4 },    // core entry north
      { position: [-5, 3], width: 1.0 },    // conference room door
      { position: [-2, 6], width: 0.9 },    // break room door
      { position: [-5, 7], width: 0.9 },    // executive suite door
      { position: [4, -3], width: 0.9 },    // server room door
    ],
    windows: [
      { wall: 0, position: 4 },
      { wall: 0, position: 10 },
      { wall: 0, position: 16 },
      { wall: 1, position: 3 },
      { wall: 1, position: 8 },
      { wall: 1, position: 12 },
      { wall: 2, position: 4 },
      { wall: 2, position: 10 },
      { wall: 2, position: 16 },
      { wall: 3, position: 3 },
      { wall: 3, position: 8 },
      { wall: 3, position: 12 },
    ],
    rooms: [
      { name: "Lobby", polygon: [[-8, -5], [4, -5], [4, -1], [8, -1], [8, 3], [-2, 3], [-8, 3]] },
      { name: "Open Office", polygon: [[-2, 3], [8, 3], [8, -1], [4, -1], [4, -5], [12, -5], [12, -1], [12, 5], [8, 5], [8, 3]] },
      { name: "Server Room", polygon: [[4, -5], [4, -1], [8, -1], [12, -1], [12, -5]] },
      { name: "Elevator Core", polygon: [[8, -1], [12, -1], [12, 5], [8, 5]] },
      { name: "Conference Room", polygon: [[-8, 3], [-2, 3], [-2, 7], [-8, 7]] },
      { name: "Executive Suite", polygon: [[-8, 7], [-2, 7], [-2, 10], [-8, 10]] },
      { name: "Break Room", polygon: [[-2, 3], [8, 3], [8, 5], [12, 5], [12, 10], [-2, 10]] },
    ],
  },
};

// ============================================================
// PROJECT 2 — Riverside Housing Complex (existing, unchanged)
// ============================================================

const RIVERSIDE_DATA: ProjectData = {
  _id: "demo-riverside",
  projectName: "Riverside Housing Complex",
  headOfConstruction: { _id: "u1", username: "Sarah Parker" },
  workers: [
    { worker: { _id: "u1", username: "Sarah Parker" }, role: "Head of Construction" },
    { worker: { _id: "u2", username: "Mike Johnson" }, role: "Structural Engineer" },
    { worker: { _id: "u3", username: "Raj Kumar" }, role: "Site Foreman" },
    { worker: { _id: "u4", username: "Lisa Chen" }, role: "Electrical Lead" },
    { worker: { _id: "u5", username: "Tom Rivera" }, role: "Plumbing Contractor" },
  ],
  progress: 62,
  stages: [
    { label: "Foundation", pct: 100, status: "Done" },
    { label: "Structure", pct: 65, status: "In Progress" },
    { label: "MEP", pct: 20, status: "Pending" },
    { label: "Finishing", pct: 0, status: "Pending" },
  ],
  issues: [
    {
      _id: "i1",
      name: "Foundation crack in Unit B3",
      description: "Hairline crack observed along the north wall foundation. Needs structural assessment before proceeding with framing.",
      status: "open",
      priority: "high",
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
      _id: "i2",
      name: "Electrical conduit misalignment - Floor 2",
      description: "Conduit routing doesn't match the updated MEP drawings. Needs rerouting before drywall.",
      status: "in_progress",
      priority: "medium",
      openedBy: { _id: "u4", username: "Lisa Chen" },
      assignedTo: { _id: "u4", username: "Lisa Chen" },
      position: { x: 6, z: 1 },
      comments: [
        { author: { _id: "u4", username: "Lisa Chen" }, content: "Rerouting in progress. ETA 2 days.", createdAt: new Date(Date.now() - 7200000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      _id: "i3",
      name: "Window frame delivery delay",
      description: "Supplier confirmed 1-week delay on custom window frames for Units A1–A4.",
      status: "open",
      priority: "medium",
      openedBy: { _id: "u1", username: "Sarah Parker" },
      position: { x: 0, z: 5 },
      comments: [],
      createdAt: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      _id: "i4",
      name: "Plumbing inspection passed - Block A",
      description: "City inspector approved all rough-in plumbing for Block A.",
      status: "resolved",
      priority: "low",
      openedBy: { _id: "u5", username: "Tom Rivera" },
      assignedTo: { _id: "u5", username: "Tom Rivera" },
      position: { x: -2, z: 2 },
      comments: [
        { author: { _id: "u5", username: "Tom Rivera" }, content: "All clear. Certificate filed.", createdAt: new Date(Date.now() - 259200000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 604800000).toISOString(),
    },
    {
      _id: "i5",
      name: "HVAC ductwork noise in Unit C1",
      description: "Residents reporting rattling noise from HVAC ductwork. Possibly loose mounting brackets.",
      status: "open",
      priority: "high",
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
      { start: [3, -2], end: [3, 8] },
      { start: [-4, 3], end: [3, 3] },
      { start: [3, 5], end: [10, 5] },
      { start: [6, -2], end: [6, 5] },
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

// ============================================================
// PROJECT 3 — Highway Bridge Renovation
// ============================================================

const BRIDGE_DATA: ProjectData = {
  _id: "demo-bridge",
  projectName: "Highway Bridge Renovation",
  headOfConstruction: { _id: "br1", username: "Carlos Reyes" },
  workers: [
    { worker: { _id: "br1", username: "Carlos Reyes" }, role: "Bridge Inspector" },
    { worker: { _id: "br2", username: "Elena Martinez" }, role: "Traffic Engineer" },
    { worker: { _id: "br3", username: "Brian Thompson" }, role: "Structural Analyst" },
    { worker: { _id: "br4", username: "Yuki Kobayashi" }, role: "Material Specialist" },
    { worker: { _id: "br5", username: "Priya Das" }, role: "Safety Coordinator" },
  ],
  progress: 28,
  stages: [
    { label: "Assessment", pct: 100, status: "Done" },
    { label: "Demolition", pct: 60, status: "In Progress" },
    { label: "Structural", pct: 15, status: "In Progress" },
    { label: "Surfacing", pct: 0, status: "Pending" },
    { label: "Finishing", pct: 0, status: "Pending" },
  ],
  issues: [
    {
      _id: "br-i1",
      name: "Deck surface cracking – Span 3",
      description: "Multiple transverse cracks found on the deck surface in span 3. Width ranges from 1-4mm. Core samples being taken.",
      status: "open",
      priority: "high",
      openedBy: { _id: "br1", username: "Carlos Reyes" },
      assignedTo: { _id: "br3", username: "Brian Thompson" },
      position: { x: 5, z: 0 },
      comments: [
        { author: { _id: "br3", username: "Brian Thompson" }, content: "Core samples sent to lab. Preliminary assessment: chloride-induced corrosion of rebar.", createdAt: new Date(Date.now() - 10800000).toISOString() },
        { author: { _id: "br1", username: "Carlos Reyes" }, content: "Need lab results before we decide on partial vs full deck replacement.", createdAt: new Date(Date.now() - 5400000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 432000000).toISOString(),
    },
    {
      _id: "br-i2",
      name: "Bearing pad replacement – Pier 4",
      description: "Elastomeric bearing pads on pier 4 show excessive deformation. Full replacement needed before deck overlay.",
      status: "in_progress",
      priority: "high",
      openedBy: { _id: "br3", username: "Brian Thompson" },
      assignedTo: { _id: "br4", username: "Yuki Kobayashi" },
      position: { x: -6, z: 5 },
      comments: [
        { author: { _id: "br4", username: "Yuki Kobayashi" }, content: "New bearing pads ordered. Jacking plan prepared for lifting the superstructure.", createdAt: new Date(Date.now() - 86400000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 604800000).toISOString(),
    },
    {
      _id: "br-i3",
      name: "Drainage grate blockage – South approach",
      description: "Three drainage grates on the south approach are blocked with debris. Water pooling on the deck.",
      status: "resolved",
      priority: "medium",
      openedBy: { _id: "br5", username: "Priya Das" },
      assignedTo: { _id: "br5", username: "Priya Das" },
      position: { x: 12, z: -2 },
      comments: [
        { author: { _id: "br5", username: "Priya Das" }, content: "Grates cleaned and flow tested. Added temporary debris screens.", createdAt: new Date(Date.now() - 172800000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 864000000).toISOString(),
    },
    {
      _id: "br-i4",
      name: "Cable tension inspection – Stay cables 7-12",
      description: "Vibration-based tension testing needed on stay cables 7 through 12 to verify design loads.",
      status: "open",
      priority: "medium",
      openedBy: { _id: "br3", username: "Brian Thompson" },
      position: { x: 0, z: 3 },
      comments: [],
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      _id: "br-i5",
      name: "Guardrail damage – Northbound lane",
      description: "Impact damage on guardrail sections 14-16. Deformation exceeds acceptable limits per AASHTO standards.",
      status: "open",
      priority: "low",
      openedBy: { _id: "br2", username: "Elena Martinez" },
      assignedTo: { _id: "br2", username: "Elena Martinez" },
      position: { x: -3, z: -3 },
      comments: [],
      createdAt: new Date(Date.now() - 129600000).toISOString(),
    },
  ],
  map_3d: {
    walls: [
      // Bridge deck outer edges — long span
      { start: [-12, -3], end: [16, -3] },     // south edge / guardrail
      { start: [16, -3], end: [16, 7] },        // east abutment
      { start: [16, 7], end: [-12, 7] },         // north edge / guardrail
      { start: [-12, 7], end: [-12, -3] },       // west abutment
      // Lane divider (median barrier)
      { start: [-12, 2], end: [16, 2] },
      // Pedestrian walkway divider (north side)
      { start: [-12, 5], end: [16, 5] },
      // Pier / support pylon walls (short cross-walls)
      { start: [-6, -3], end: [-6, 2] },        // pier 1
      { start: [0, -3], end: [0, 2] },          // pier 2
      { start: [6, -3], end: [6, 2] },          // pier 3
      { start: [10, -3], end: [10, 2] },         // pier 4
      // Toll booth area
      { start: [13, -3], end: [13, 2] },
      { start: [13, -1], end: [16, -1] },
      { start: [13, 0.5], end: [16, 0.5] },
    ],
    doors: [
      { position: [-6, -0.5], width: 2.0 },   // lane opening at pier 1
      { position: [0, -0.5], width: 2.0 },    // lane opening at pier 2
      { position: [6, -0.5], width: 2.0 },    // lane opening at pier 3
      { position: [10, -0.5], width: 2.0 },    // lane opening at pier 4
      { position: [14.5, -1], width: 1.2 },   // toll booth entrance
      { position: [14.5, 0.5], width: 1.2 },  // toll booth exit
    ],
    windows: [
      // Observation / inspection windows along guardrails
      { wall: 0, position: 6 },
      { wall: 0, position: 14 },
      { wall: 0, position: 22 },
      { wall: 2, position: 6 },
      { wall: 2, position: 14 },
      { wall: 2, position: 22 },
    ],
    rooms: [
      { name: "Southbound Lanes", polygon: [[-12, -3], [13, -3], [13, 2], [-12, 2]] },
      { name: "Northbound Lanes", polygon: [[-12, 2], [16, 2], [16, 5], [-12, 5]] },
      { name: "Pedestrian Walkway", polygon: [[-12, 5], [16, 5], [16, 7], [-12, 7]] },
      { name: "Toll Booth A", polygon: [[13, -3], [16, -3], [16, -1], [13, -1]] },
      { name: "Toll Booth B", polygon: [[13, -1], [16, -1], [16, 0.5], [13, 0.5]] },
      { name: "Inspection Zone", polygon: [[13, 0.5], [16, 0.5], [16, 2], [13, 2]] },
    ],
  },
};

// ---------- Lookup ----------

const PROJECTS_MAP: Record<string, ProjectData> = {
  "1": OFFICE_TOWER_DATA,
  "2": RIVERSIDE_DATA,
  "3": BRIDGE_DATA,
};

export function getProjectData(projectId: string): ProjectData | null {
  return PROJECTS_MAP[projectId] ?? null;
}

export function getAllProjects(): ProjectData[] {
  return [OFFICE_TOWER_DATA, RIVERSIDE_DATA, BRIDGE_DATA];
}
