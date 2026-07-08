import { Link } from "react-router-dom"
import bg from "../assets/bg.png";

export default function Hero() {
  return (
    <section className="relative mb-1 flex min-h-screen items-center justify-center overflow-hidden px-6">

      {/* Background Image */}
      <img
        src={bg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-background/50" />

      {/* Hero Content */}
      <div className="relative z-9 -translate-y-10  animate-fade-up mx-auto max-w-7xl text-center">
        <div className="mx-auto max-w-6xl">
          <p className="mb-1 font-mono text-lg uppercase tracking-[0.35em] text-gold">
            Open Source • Construction Tech
          </p>

          <h1 className="mb-8 font-bold leading-tight text-ink">
            <span className="text-[7.5rem] md:text-[9rem]">
              Chisel
            </span>

            <br />

            <span className="text-[2.25rem] text-amber md:text-[2.75rem]">
              Version control for physical infrastructure.
            </span>
          </h1>

          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-muted">
            Track construction progress like software. Raise issues, verify
            work, manage teams, and build a complete history of every change
            made on-site.
          </p>

          <div className="mt-10 flex justify-center">
            <Link to="/signin">
              <button className="
                bg-amber
                px-10 py-4
                font-body
                text-lg
                font-semibold
                text-paper
                transition-all
                duration-200
                hover:bg-copper
                hover:scale-105
              ">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </div>

    </section>
  );
}
