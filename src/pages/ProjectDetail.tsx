import { useParams } from "react-router-dom"
import FloorplanViewer from "../floorPlan"

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()

  return <FloorplanViewer projectId={projectId} />
}