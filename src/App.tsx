import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navbar from "./Navbar"
import Hero from "./Hero"
import FloorplanViewer from "./floorPlan"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-paper text-text">
        <Navbar />
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/floorplan" element={<FloorplanViewer />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
