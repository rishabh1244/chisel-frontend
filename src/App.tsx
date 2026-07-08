import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom"
import Navbar from "./Navbar"
import Hero from "./Hero"
import FloorplanViewer from "./floorPlan"
import SignIn from "./pages/SignIn"
import Dashboard from "./pages/Dashboard"
import ProjectDetail from "./pages/ProjectDetail"
import { AuthProvider, useAuth } from "./context/AuthContext"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/signin" replace />
}

function AppLayout() {
  const location = useLocation()
  const hideNav = ["/floorplan", "/project/", "/projects/"].some((p) =>
    location.pathname.startsWith(p),
  )

  return (
    <div className="min-h-screen bg-[#1A1714] text-[#F4EFE7]">
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/signin" element={<SignIn />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/floorplan" element={<FloorplanViewer />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
