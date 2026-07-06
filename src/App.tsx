import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./Navbar"
import Hero from "./Hero"
import FloorplanViewer from "./floorPlan"

function AppLayout() {
  const location = useLocation()
  const isFloorplan = location.pathname === "/floorplan"

  return (
    <div className="min-h-screen bg-paper text-text">
      {!isFloorplan && <Navbar />}
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/floorplan" element={<FloorplanViewer />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
