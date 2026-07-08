import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <nav
      className="
        sticky top-0 z-50
        border-b border-border
        bg-panel/90
        backdrop-blur-md
      "
    >

      <div className="mx-auto flex h-[67px] max-w-full items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <div>
            <h1
              className="
                font-display
                text-3xl
                font-bold
                tracking-wide
                text-ink
              "
            >
              CHISEL
            </h1>
          </div>
        </div>

        <div className="hidden items-center gap-12 md:flex">
          {[
            { label: "Projects", href: "/dashboard" },
            { label: "Blueprints", href: "/floorplan" },
            { label: "Workers", href: "#" },
            { label: "Issues", href: "#" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="
                relative
                font-body
                text-base
                text-faded
                transition-all
                duration-200
                hover:text-amber
              "
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/signin">
            <button
              className="
                bg-amber
                px-7 py-2
                font-body
                text-lg
                font-semibold
                text-paper
                transition-all
                duration-200
                hover:bg-copper
                hover:scale-105
              "
            >
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
