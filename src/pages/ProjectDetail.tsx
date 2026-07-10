import { useParams, Link } from "react-router-dom"
import FloorplanViewer from "../floorPlan"
import { getProjectData, PROJECT_LIST } from "../data/projectData"
import bg from "../../assets/bg.png"

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const projectData = getProjectData(projectId || "1")
  const listItem = PROJECT_LIST.find((p) => p.id === projectId)

  const name = projectData?.projectName || listItem?.name || "Project"
  const description = listItem?.description || ""

  return (
    <section className="relative min-h-screen bg-[#1A1714]">
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-[#1A1714]" />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-[#2C2620] pb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#3A332B] text-[#A39A8C] hover:bg-[#2C2620] transition"
            >
              ←
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-[#F4EFE7]">{name}</h1>
              <p className="mt-1 text-[#A39A8C]">{description}</p>
            </div>
          </div>
          <span className="rounded-full bg-[#C2884A]/15 px-3 py-1 text-sm font-medium text-[#C2884A]">
            Active
          </span>
        </header>

        <FloorplanViewer projectId={projectId} projectName={name} />
      </main>
    </section>
  )
}