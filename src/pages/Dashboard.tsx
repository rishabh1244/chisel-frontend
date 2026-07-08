import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import bg from "../../assets/bg.png"

interface Project {
  id: string
  name: string
  description: string
}

export default function Dashboard() {
  const { user, logout } = useAuth()

  if (!user) return null

  const demoProjects: Project[] = [
    { id: "1", name: "Downtown Office Tower", description: "30-story commercial building · 2.4M sq ft" },
    { id: "2", name: "Riverside Housing Complex", description: "150-unit residential development · Phase 2" },
    { id: "3", name: "Highway Bridge Renovation", description: "Structural upgrade of existing bridge · I-95" },
  ]

  return (
    <section className="relative min-h-screen bg-[#1A1714]">
      {/* Background */}
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-[#1A1714]" />

      {/* Navbar area handled by parent */}

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
            <button className="rounded-lg bg-[#C2884A] px-4 py-2 text-sm font-semibold text-[#2A1B0C] transition hover:bg-[#D09555]">
              New Project
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {demoProjects.map((p) => (
              <article
                key={p.id}
                className="rounded-xl border border-[#2C2620] bg-[#1A1714] p-6 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <h3 className="mb-2 text-lg font-semibold text-[#F4EFE7]">{p.name}</h3>
                <p className="mb-4 text-sm text-[#A39A8C]">{p.description}</p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="rounded-full bg-[#C2884A]/15 px-2 py-1 text-[11px] font-medium text-[#C2884A]">
                    Active
                  </span>
                  <span className="text-xs text-[#5C5347]">Last updated 2h ago</span>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <div className="flex">
                    {["SP", "MJ", "RK"].map((person, index) => (
                      <div
                        key={person}
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
                      >
                        {person}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-[#A39A8C]">3 crew members</span>
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
            <button className="rounded-lg bg-[#C2884A] px-6 py-3 font-semibold text-[#2A1B0C] transition hover:bg-[#D09555]">
              Create Project
            </button>
            <button className="rounded-lg border border-[#3A332B] px-6 py-3 font-semibold text-[#A39A8C] transition hover:bg-[#2C2620]">
              Import Blueprints
            </button>
            <button className="rounded-lg border border-[#3A332B] px-6 py-3 font-semibold text-[#A39A8C] transition hover:bg-[#2C2620]">
              Invite Team
            </button>
            <button className="rounded-lg border border-[#3A332B] px-6 py-3 font-semibold text-[#A39A8C] transition hover:bg-[#2C2620]">
              View Reports
            </button>
          </div>
        </section>
      </main>
    </section>
  )
}