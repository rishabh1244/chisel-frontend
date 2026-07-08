import { useParams } from "react-router-dom"
import FloorplanViewer from "../floorPlan"
import bg from "../../assets/bg.png"

interface ProjectData {
  id: string
  name: string
  description: string
}

const demoProjects: ProjectData[] = [
  { id: "1", name: "Downtown Office Tower", description: "30-story commercial building · 2.4M sq ft" },
  { id: "2", name: "Riverside Housing Complex", description: "150-unit residential development · Phase 2" },
  { id: "3", name: "Highway Bridge Renovation", description: "Structural upgrade of existing bridge · I-95" },
]

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const project = demoProjects.find((p) => p.id === projectId) ?? demoProjects[0]

  return (
    <section className="relative min-h-screen bg-[#1A1714]">
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-[#1A1714]" />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-[#2C2620] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#F4EFE7]">{project.name}</h1>
            <p className="mt-1 text-[#A39A8C]">{project.description}</p>
          </div>
          <span className="rounded-full bg-[#C2884A]/15 px-3 py-1 text-sm font-medium text-[#C2884A]">
            Active
          </span>
        </header>

        <FloorplanViewer projectId={project.id} projectName={project.name} />
      </main>
    </section>
  )
}