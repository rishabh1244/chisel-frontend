import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import bg from "../../assets/bg.png"

export default function SignIn() {
  const { loginDemo, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // existing user login could be implemented here
  }

  const handleDemoLogin = async () => {
    await loginDemo()
    navigate("/dashboard")
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6"
    >
      {/* Background */}
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#1A1714]/80" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="rounded-xl border border-[#2C2620] bg-[#1A1714] p-8 shadow-2xl">
          <h1 className="mb-2 text-center text-2xl font-bold text-[#F4EFE7]">Sign In</h1>
          <p className="mb-8 text-center text-[#A39A8C]">Enter your credentials to access Chisel.</p>

          {/* Existing Users Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium text-[#A39A8C]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[#2C2620] bg-[#14110F] px-4 py-3 text-[#F4EFE7] placeholder-[#5C5347] focus:outline-none focus:ring-2 focus:ring-[#C2884A]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block mb-1 text-sm font-medium text-[#A39A8C]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-[#2C2620] bg-[#14110F] px-4 py-3 text-[#F4EFE7] placeholder-[#5C5347] focus:outline-none focus:ring-2 focus:ring-[#C2884A]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-[#C2884A] py-3 text-center text-base font-semibold text-[#2A1B0C] transition hover:bg-[#D09555] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Separator */}
          <div className="my-6 flex items-center gap-4 text-[#5C5347]">
            <hr className="flex-1 border-t border-[#2C2620]" />
            <span className="text-xs uppercase tracking-wider">OR</span>
            <hr className="flex-1 border-t border-[#2C2620]" />
          </div>

          {/* Demo Login */}
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full rounded-lg border border-[#3A332B] py-3 text-center text-base font-semibold text-[#A39A8C] transition hover:bg-[#2C2620] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Loading…" : "Continue with Demo Account"}
          </button>

          <p className="mt-6 text-center text-sm text-[#5C5347]">
            No account? Demo logs you in instantly with sample projects.
          </p>
        </div>
      </div>
    </section>
  )
}