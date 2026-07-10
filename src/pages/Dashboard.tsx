import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import {
  Plus, Upload, Users, BarChart3, X, Building2, Home,
  FileJson, CheckCircle2, Send, Trash2,
} from "lucide-react"
import { PROJECT_LIST, getAllProjects } from "../data/projectData"
import type { ProjectListItem } from "../data/projectData"
import bg from "../../assets/bg.png"

// ---------- Modal Backdrop ----------

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  )
}

// ---------- Create Project Modal ----------

function CreateProjectModal({
  onClose,
  onCreateProject,
}: {
  onClose: () => void;
  onCreateProject: (project: ProjectListItem) => void;
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("commercial")

  const typeIcons: Record<string, React.ReactNode> = {
    commercial: <Building2 size={16} />,
    residential: <Home size={16} />,
    infrastructure: <span className="text-sm">🌉</span>,
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    const newProject: ProjectListItem = {
      id: `new-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || `${type.charAt(0).toUpperCase() + type.slice(1)} project`,
      lastUpdated: "Just now",
      status: "Active",
      crew: [{ initials: "ME", name: "You" }],
    }
    onCreateProject(newProject)
    onClose()
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-[#2C2620] bg-[#1A1714] p-6 shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#F4EFE7]">Create New Project</h2>
          <button onClick={onClose} className="text-[#A39A8C] hover:text-[#F4EFE7] transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A39A8C] mb-1.5">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Central Park Tower"
              className="w-full rounded-lg border border-[#3A332B] bg-[#241F1A] px-3 py-2.5 text-sm text-[#F4EFE7] placeholder-[#5C5347] focus:outline-none focus:border-[#C2884A]/50 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A39A8C] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief project description..."
              rows={3}
              className="w-full rounded-lg border border-[#3A332B] bg-[#241F1A] px-3 py-2.5 text-sm text-[#F4EFE7] placeholder-[#5C5347] focus:outline-none focus:border-[#C2884A]/50 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A39A8C] mb-1.5">Project Type</label>
            <div className="grid grid-cols-3 gap-2">
              {["commercial", "residential", "infrastructure"].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition ${
                    type === t
                      ? "border-[#C2884A]/50 bg-[#C2884A]/10 text-[#C2884A]"
                      : "border-[#3A332B] text-[#A39A8C] hover:bg-[#2C2620]"
                  }`}
                >
                  {typeIcons[t]}
                  <span className="capitalize">{t}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#2C2620]">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#3A332B] py-2.5 text-sm font-medium text-[#A39A8C] hover:bg-[#2C2620] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 rounded-lg bg-[#C2884A] py-2.5 text-sm font-semibold text-[#2A1B0C] transition hover:bg-[#D09555] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Project
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ---------- Import Blueprints Modal ----------

function ImportBlueprintsModal({ onClose }: { onClose: () => void }) {
  const [selectedProject, setSelectedProject] = useState("1")
  const [fileName, setFileName] = useState<string | null>(null)
  const [imported, setImported] = useState(false)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    setFileName(file.name)
    setImported(false)
  }

  const handleImport = () => {
    if (!fileName) return
    setImported(true)
    setTimeout(() => onClose(), 1500)
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-[#2C2620] bg-[#1A1714] p-6 shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#F4EFE7]">Import Blueprints</h2>
          <button onClick={onClose} className="text-[#A39A8C] hover:text-[#F4EFE7] transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A39A8C] mb-1.5">Target Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full rounded-lg border border-[#3A332B] bg-[#241F1A] px-3 py-2.5 text-sm text-[#F4EFE7] focus:outline-none focus:border-[#C2884A]/50 transition"
            >
              {PROJECT_LIST.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
            }}
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition ${
              dragging
                ? "border-[#C2884A] bg-[#C2884A]/5"
                : fileName
                  ? "border-[#6D8B5A]/50 bg-[#6D8B5A]/5"
                  : "border-[#3A332B] hover:border-[#5C5347]"
            }`}
          >
            {imported ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 size={32} className="text-[#6D8B5A]" />
                <span className="text-sm font-medium text-[#6D8B5A]">Blueprint imported successfully!</span>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center gap-2">
                <FileJson size={28} className="text-[#C2884A]" />
                <span className="text-sm text-[#F4EFE7]">{fileName}</span>
                <button onClick={() => setFileName(null)} className="text-xs text-[#A39A8C] hover:text-[#F4EFE7] transition">
                  Remove
                </button>
              </div>
            ) : (
              <>
                <Upload size={28} className="mb-2 text-[#5C5347]" />
                <span className="text-sm text-[#A39A8C]">Drop your blueprint file here</span>
                <span className="text-xs text-[#5C5347] mt-1">Supports .json, .dwg, .ifc files</span>
              </>
            )}
            <input
              type="file"
              accept=".json,.dwg,.ifc"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#2C2620]">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#3A332B] py-2.5 text-sm font-medium text-[#A39A8C] hover:bg-[#2C2620] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!fileName || imported}
            className="flex-1 rounded-lg bg-[#C2884A] py-2.5 text-sm font-semibold text-[#2A1B0C] transition hover:bg-[#D09555] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {imported ? "Imported ✓" : "Import Blueprint"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ---------- Invite Team Modal ----------

function InviteTeamModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("Engineer")
  const [invitedMembers, setInvitedMembers] = useState<{ email: string; role: string }[]>([])
  const [sending, setSending] = useState(false)

  const handleInvite = () => {
    if (!email.trim() || !email.includes("@")) return
    setSending(true)
    setTimeout(() => {
      setInvitedMembers((prev) => [...prev, { email: email.trim(), role }])
      setEmail("")
      setSending(false)
    }, 600)
  }

  const handleRemove = (index: number) => {
    setInvitedMembers((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-[#2C2620] bg-[#1A1714] p-6 shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#F4EFE7]">Invite Team Members</h2>
          <button onClick={onClose} className="text-[#A39A8C] hover:text-[#F4EFE7] transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
                placeholder="colleague@company.com"
                className="w-full rounded-lg border border-[#3A332B] bg-[#241F1A] px-3 py-2.5 text-sm text-[#F4EFE7] placeholder-[#5C5347] focus:outline-none focus:border-[#C2884A]/50 transition"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-[#3A332B] bg-[#241F1A] px-2 py-2.5 text-xs text-[#F4EFE7] focus:outline-none focus:border-[#C2884A]/50 transition"
            >
              {["Engineer", "Foreman", "Architect", "Inspector", "Contractor", "Safety Officer"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              onClick={handleInvite}
              disabled={!email.trim() || sending}
              className="flex items-center gap-1.5 rounded-lg bg-[#C2884A] px-4 py-2.5 text-xs font-semibold text-[#2A1B0C] transition hover:bg-[#D09555] disabled:opacity-40 shrink-0"
            >
              {sending ? (
                <div className="w-3 h-3 border-2 border-[#2A1B0C] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={13} />
              )}
              Invite
            </button>
          </div>

          {invitedMembers.length > 0 && (
            <div className="rounded-lg border border-[#2C2620] bg-[#241F1A]/50 divide-y divide-[#2C2620]">
              <div className="px-3 py-2 text-[10px] font-semibold text-[#A39A8C] uppercase tracking-wider">
                Invited ({invitedMembers.length})
              </div>
              {invitedMembers.map((member, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#C2884A]/15 flex items-center justify-center text-[10px] font-medium text-[#C2884A] shrink-0">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-[#F4EFE7] truncate">{member.email}</div>
                      <div className="text-[10px] text-[#5C5347]">{member.role} · Pending</div>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(i)} className="text-[#5C5347] hover:text-[#B55442] transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {invitedMembers.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <Users size={28} className="mb-2 text-[#5C5347]" />
              <span className="text-sm text-[#A39A8C]">No invitations sent yet</span>
              <span className="text-xs text-[#5C5347] mt-1">Enter an email and role to invite a team member</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#2C2620]">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#3A332B] py-2.5 text-sm font-medium text-[#A39A8C] hover:bg-[#2C2620] transition"
          >
            Done
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ---------- View Reports Panel ----------

function ViewReportsModal({ onClose }: { onClose: () => void }) {
  const allProjects = getAllProjects()

  const totalIssues = allProjects.reduce((sum, p) => sum + p.issues.length, 0)
  const totalResolved = allProjects.reduce((sum, p) => sum + p.issues.filter((i) => i.status === "resolved").length, 0)
  const totalWorkers = allProjects.reduce((sum, p) => sum + p.workers.length, 0)
  const avgProgress = Math.round(allProjects.reduce((sum, p) => sum + p.progress, 0) / allProjects.length)

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-[#2C2620] bg-[#1A1714] p-6 shadow-2xl animate-fade-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#F4EFE7]">Project Reports</h2>
          <button onClick={onClose} className="text-[#A39A8C] hover:text-[#F4EFE7] transition">
            <X size={20} />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Issues", value: totalIssues, color: "text-[#D79B5B]" },
            { label: "Resolved", value: totalResolved, color: "text-[#6D8B5A]" },
            { label: "Workers", value: totalWorkers, color: "text-[#4F8A8B]" },
            { label: "Avg. Progress", value: `${avgProgress}%`, color: "text-[#C2884A]" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-[#2C2620] bg-[#241F1A] p-3 text-center">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-[#A39A8C] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Per-project breakdown */}
        <div className="space-y-4">
          {allProjects.map((project) => {
            const openCount = project.issues.filter((i) => i.status === "open").length
            const inProgressCount = project.issues.filter((i) => i.status === "in_progress").length
            const resolvedCount = project.issues.filter((i) => i.status === "resolved").length

            return (
              <div key={project._id} className="rounded-lg border border-[#2C2620] bg-[#241F1A] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#F4EFE7]">{project.projectName}</h3>
                  <span className="text-xs font-medium text-[#C2884A]">{project.progress}%</span>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-[#312922] overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#C2884A] to-[#D79B5B] transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                {/* Issue bar chart */}
                <div className="flex items-end gap-1.5 h-14 mb-2">
                  {[
                    { label: "Open", count: openCount, color: "bg-[#B55442]" },
                    { label: "In Progress", count: inProgressCount, color: "bg-[#D4A04D]" },
                    { label: "Resolved", count: resolvedCount, color: "bg-[#6D8B5A]" },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t ${color} transition-all`}
                        style={{
                          height: `${Math.max(count / Math.max(project.issues.length, 1) * 100, 8)}%`,
                          minHeight: "4px",
                        }}
                      />
                      <span className="text-[9px] text-[#5C5347]">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {[
                    { label: "Open", color: "bg-[#B55442]" },
                    { label: "In Progress", color: "bg-[#D4A04D]" },
                    { label: "Resolved", color: "bg-[#6D8B5A]" },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex-1 flex items-center justify-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                      <span className="text-[9px] text-[#5C5347]">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Workers */}
                <div className="mt-3 pt-3 border-t border-[#2C2620] flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {project.workers.slice(0, 4).map((w) => (
                      <div
                        key={w.worker._id}
                        className="w-5 h-5 rounded-full bg-[#332C24] border border-[#1A1714] flex items-center justify-center text-[8px] text-[#F4EFE7]"
                        title={w.worker.username}
                      >
                        {w.worker.username.split(" ").map((n) => n[0]).join("")}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-[#5C5347]">{project.workers.length} team members</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#2C2620]">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#3A332B] py-2.5 text-sm font-medium text-[#A39A8C] hover:bg-[#2C2620] transition"
          >
            Close
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ============================================================
// Dashboard
// ============================================================

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState<ProjectListItem[]>(PROJECT_LIST)
  const [activeModal, setActiveModal] = useState<
    null | "createProject" | "importBlueprints" | "inviteTeam" | "viewReports"
  >(null)
  const [toast, setToast] = useState<string | null>(null)

  if (!user) return null

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleCreateProject = (project: ProjectListItem) => {
    setProjects((prev) => [...prev, project])
    showToast(`"${project.name}" project created successfully!`)
  }

  return (
    <section className="relative min-h-screen bg-[#1A1714]">
      {/* Background */}
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-[#1A1714]" />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-[#241F1A] border border-[#C2884A]/30 rounded-lg px-4 py-2.5 text-sm text-[#F4EFE7] shadow-panel animate-fade-up">
          <CheckCircle2 size={16} className="text-[#6D8B5A]" />
          {toast}
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between border-b border-[#2C2620] pb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F4EFE7]">Dashboard</h1>
            <p className="mt-1 text-[#A39A8C]">Welcome back, {user.name}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-[#3A332B] px-4 py-2 text-sm font-medium text-[#A39A8C] transition hover:bg-[#2C2620]"
          >
            Logout
          </button>
        </header>

        {/* My Projects */}
        <section className="mb-12 animate-fade-up">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#F4EFE7]">My Projects</h2>
            <button
              onClick={() => setActiveModal("createProject")}
              className="rounded-lg bg-[#C2884A] px-4 py-2 text-sm font-semibold text-[#2A1B0C] transition hover:bg-[#D09555]"
            >
              New Project
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <article
                key={p.id}
                className="rounded-xl border border-[#2C2620] bg-[#1A1714] p-6 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <h3 className="mb-2 text-lg font-semibold text-[#F4EFE7]">{p.name}</h3>
                <p className="mb-4 text-sm text-[#A39A8C]">{p.description}</p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="rounded-full bg-[#C2884A]/15 px-2 py-1 text-[11px] font-medium text-[#C2884A]">
                    {p.status}
                  </span>
                  <span className="text-xs text-[#5C5347]">Last updated {p.lastUpdated}</span>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <div className="flex">
                    {p.crew.slice(0, 3).map((person, index) => (
                      <div
                        key={person.initials}
                        className={`
                          flex h-[22px] w-[22px]
                          items-center justify-center
                          rounded-full border-[1.5px]
                          border-[#1A1714]
                          bg-[#332C24]
                          text-[11px]
                          text-[#F4EFE7]
                          ${index !== 0 ? "-ml-1.5" : ""}
                        `}
                        title={person.name}
                      >
                        {person.initials}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-[#A39A8C]">{p.crew.length} crew members</span>
                </div>

                <Link
                  to={p.id === "2" ? "/floorplan" : `/project/${p.id}`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#C2884A] py-2 text-sm font-semibold text-[#2A1B0C] transition hover:bg-[#D09555]"
                >
                  Open Project
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <h2 className="mb-6 text-2xl font-bold text-[#F4EFE7]">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setActiveModal("createProject")}
              className="flex items-center gap-2 rounded-lg bg-[#C2884A] px-6 py-3 font-semibold text-[#2A1B0C] transition hover:bg-[#D09555]"
            >
              <Plus size={18} />
              Create Project
            </button>
            <button
              onClick={() => setActiveModal("importBlueprints")}
              className="flex items-center gap-2 rounded-lg border border-[#3A332B] px-6 py-3 font-semibold text-[#A39A8C] transition hover:bg-[#2C2620]"
            >
              <Upload size={18} />
              Import Blueprints
            </button>
            <button
              onClick={() => setActiveModal("inviteTeam")}
              className="flex items-center gap-2 rounded-lg border border-[#3A332B] px-6 py-3 font-semibold text-[#A39A8C] transition hover:bg-[#2C2620]"
            >
              <Users size={18} />
              Invite Team
            </button>
            <button
              onClick={() => setActiveModal("viewReports")}
              className="flex items-center gap-2 rounded-lg border border-[#3A332B] px-6 py-3 font-semibold text-[#A39A8C] transition hover:bg-[#2C2620]"
            >
              <BarChart3 size={18} />
              View Reports
            </button>
          </div>
        </section>
      </main>

      {/* Modals */}
      {activeModal === "createProject" && (
        <CreateProjectModal
          onClose={() => setActiveModal(null)}
          onCreateProject={handleCreateProject}
        />
      )}
      {activeModal === "importBlueprints" && (
        <ImportBlueprintsModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "inviteTeam" && (
        <InviteTeamModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "viewReports" && (
        <ViewReportsModal onClose={() => setActiveModal(null)} />
      )}
    </section>
  )
}