import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/logo")({
  component: LogoExploration,
});

function LogoExploration() {
  return (
    <div className="min-h-screen bg-neutral-950 p-12 text-white">
      <h1 className="mb-2 text-3xl font-bold">LaxDB Logo Exploration</h1>
      <p className="mb-12 text-neutral-400">Circle outline (2px) + rotated 45° net pattern</p>

      <h2 className="mb-8 text-2xl font-bold">Draft 1</h2>
      <div className="grid grid-cols-2 gap-12 md:grid-cols-3 lg:grid-cols-4">
        {/* Option 1: 5x5 - circle 2px, net 1.5px */}
        <LogoCard title="1. 5x5 · 2px/1.5px">
          <svg viewBox="0 0 100 100" className="h-24 w-24">
            <defs>
              <clipPath id="clip1">
                <circle cx="50" cy="50" r="40" />
              </clipPath>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
            <g clipPath="url(#clip1)" transform="rotate(45 50 50)">
              {[20, 35, 50, 65, 80].map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              ))}
              {[20, 35, 50, 65, 80].map((y) => (
                <line
                  key={`h${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          </svg>
        </LogoCard>

        {/* Option 2: 5x5 - circle 2px, net 1px (lighter net) */}
        <LogoCard title="2. 5x5 · 2px/1px">
          <svg viewBox="0 0 100 100" className="h-24 w-24">
            <defs>
              <clipPath id="clip2">
                <circle cx="50" cy="50" r="40" />
              </clipPath>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
            <g clipPath="url(#clip2)" transform="rotate(45 50 50)">
              {[20, 35, 50, 65, 80].map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              ))}
              {[20, 35, 50, 65, 80].map((y) => (
                <line
                  key={`h${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              ))}
            </g>
          </svg>
        </LogoCard>

        {/* Option 3: 6x6 - circle 2px, net 1px */}
        <LogoCard title="3. 6x6 · 2px/1px">
          <svg viewBox="0 0 100 100" className="h-24 w-24">
            <defs>
              <clipPath id="clip3">
                <circle cx="50" cy="50" r="40" />
              </clipPath>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
            <g clipPath="url(#clip3)" transform="rotate(45 50 50)">
              {[17, 30, 43, 57, 70, 83].map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              ))}
              {[17, 30, 43, 57, 70, 83].map((y) => (
                <line
                  key={`h${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              ))}
            </g>
          </svg>
        </LogoCard>

        {/* Option 4: 5x5 - uniform 1.5px */}
        <LogoCard title="4. 5x5 · 1.5px/1.5px">
          <svg viewBox="0 0 100 100" className="h-24 w-24">
            <defs>
              <clipPath id="clip4">
                <circle cx="50" cy="50" r="40" />
              </clipPath>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <g clipPath="url(#clip4)" transform="rotate(45 50 50)">
              {[20, 35, 50, 65, 80].map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              ))}
              {[20, 35, 50, 65, 80].map((y) => (
                <line
                  key={`h${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          </svg>
        </LogoCard>

        {/* Option 5: 6x6 - uniform 1.5px */}
        <LogoCard title="5. 6x6 · 1.5px/1.5px">
          <svg viewBox="0 0 100 100" className="h-24 w-24">
            <defs>
              <clipPath id="clip5">
                <circle cx="50" cy="50" r="40" />
              </clipPath>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <g clipPath="url(#clip5)" transform="rotate(45 50 50)">
              {[17, 30, 43, 57, 70, 83].map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              ))}
              {[17, 30, 43, 57, 70, 83].map((y) => (
                <line
                  key={`h${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          </svg>
        </LogoCard>
      </div>

      {/* Larger previews section */}
      <h2 className="mt-20 mb-8 text-2xl font-bold">At Scale</h2>
      <div className="flex flex-wrap items-end gap-16">
        {/* Large version */}
        <div className="flex flex-col items-center gap-4">
          <svg viewBox="0 0 100 100" className="h-48 w-48">
            <defs>
              <clipPath id="clipLarge">
                <circle cx="50" cy="50" r="38" />
              </clipPath>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
            <g clipPath="url(#clipLarge)" transform="rotate(45 50 50)">
              {[17, 30, 43, 57, 70, 83].map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              ))}
              {[17, 30, 43, 57, 70, 83].map((y) => (
                <line
                  key={`h${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          </svg>
          <span className="text-sm text-neutral-500">6x6 Small Gap</span>
        </div>

        {/* With text */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 100 100" className="h-10 w-10">
              <defs>
                <clipPath id="clipWord">
                  <circle cx="50" cy="50" r="36" />
                </clipPath>
              </defs>
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <g clipPath="url(#clipWord)" transform="rotate(45 50 50)">
                {[20, 35, 50, 65, 80].map((x) => (
                  <line
                    key={`v${x}`}
                    x1={x}
                    y1="0"
                    x2={x}
                    y2="100"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                ))}
                {[20, 35, 50, 65, 80].map((y) => (
                  <line
                    key={`h${y}`}
                    x1="0"
                    y1={y}
                    x2="100"
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                ))}
              </g>
            </svg>
            <span className="text-2xl font-semibold tracking-tight">LaxDB</span>
          </div>
          <span className="text-sm text-neutral-500">With wordmark</span>
        </div>

        {/* Small favicon size */}
        <div className="flex flex-col items-center gap-4">
          <svg viewBox="0 0 100 100" className="h-8 w-8">
            <defs>
              <clipPath id="clipFav">
                <circle cx="50" cy="50" r="34" />
              </clipPath>
            </defs>
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="4" />
            <g clipPath="url(#clipFav)" transform="rotate(45 50 50)">
              {[25, 50, 75].map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              ))}
              {[25, 50, 75].map((y) => (
                <line
                  key={`h${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="4"
                />
              ))}
            </g>
          </svg>
          <span className="text-sm text-neutral-500">Favicon (3x3)</span>
        </div>

        {/* Tiny */}
        <div className="flex flex-col items-center gap-4">
          <svg viewBox="0 0 100 100" className="h-6 w-6">
            <defs>
              <clipPath id="clipTiny">
                <circle cx="50" cy="50" r="32" />
              </clipPath>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" />
            <g clipPath="url(#clipTiny)" transform="rotate(45 50 50)">
              {[33, 50, 67].map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="6"
                />
              ))}
              {[33, 50, 67].map((y) => (
                <line
                  key={`h${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="6"
                />
              ))}
            </g>
          </svg>
          <span className="text-sm text-neutral-500">16px (3x3)</span>
        </div>
      </div>
    </div>
  );
}

function LogoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 transition-colors hover:border-neutral-700">
      {children}
      <span className="text-sm text-neutral-400">{title}</span>
    </div>
  );
}
