import {
  RiBarChartFill,
  RiCheckLine,
  RiCodepenLine,
  RiContrast2Line,
  RiDatabase2Fill,
  RiFullscreenFill,
  RiLoaderFill,
  RiNotification2Line,
  RiTeamFill,
} from "@remixicon/react";

import { Icons } from "../icons";
import { Orbit } from "../orbit";

import ChipViz from "./chip-viz";

export default function Features() {
  return (
    <section
      aria-label="LaxDB Platform Features"
      className="relative mx-auto max-w-6xl scroll-my-24"
      id="solutions"
    >
      {/* Vertical Lines */}
      <div className="pointer-events-none absolute inset-0 select-none">
        {/* Left */}
        <div
          className="absolute inset-y-0 my-[-5rem] w-px"
          style={{
            maskImage:
              "linear-gradient(transparent, white 5rem, white calc(100% - 5rem), transparent)",
          }}
        >
          <svg aria-hidden="true" className="h-full w-full" preserveAspectRatio="none">
            <line
              className="stroke-border"
              strokeDasharray="3 3"
              strokeWidth="2"
              x1="0"
              x2="0"
              y1="0"
              y2="100%"
            />
          </svg>
        </div>

        {/* Right */}
        <div
          className="absolute inset-y-0 right-0 my-[-5rem] w-px"
          style={{
            maskImage:
              "linear-gradient(transparent, white 5rem, white calc(100% - 5rem), transparent)",
          }}
        >
          <svg aria-hidden="true" className="h-full w-full" preserveAspectRatio="none">
            <line
              className="stroke-border"
              strokeDasharray="3 3"
              strokeWidth="2"
              x1="0"
              x2="0"
              y1="0"
              y2="100%"
            />
          </svg>
        </div>
        {/* Middle */}
        <div
          className="absolute inset-y-0 left-1/2 -z-10 my-[-5rem] w-px"
          style={{
            maskImage:
              "linear-gradient(transparent, white 5rem, white calc(100% - 5rem), transparent)",
          }}
        >
          <svg aria-hidden="true" className="h-full w-full" preserveAspectRatio="none">
            <line
              className="stroke-border"
              strokeDasharray="3 3"
              strokeWidth="2"
              x1="0"
              x2="0"
              y1="0"
              y2="100%"
            />
          </svg>
        </div>
        {/* 25% */}
        <div
          className="absolute inset-y-0 left-1/4 -z-10 my-[-5rem] hidden w-px sm:block"
          style={{
            maskImage:
              "linear-gradient(transparent, white 5rem, white calc(100% - 5rem), transparent)",
          }}
        >
          <svg aria-hidden="true" className="h-full w-full" preserveAspectRatio="none">
            <line
              className="stroke-border"
              strokeDasharray="3 3"
              strokeWidth="2"
              x1="0"
              x2="0"
              y1="0"
              y2="100%"
            />
          </svg>
        </div>
        {/* 75% */}
        <div
          className="absolute inset-y-0 left-3/4 -z-10 my-[-5rem] hidden w-px sm:block"
          style={{
            maskImage:
              "linear-gradient(transparent, white 5rem, white calc(100% - 5rem), transparent)",
          }}
        >
          <svg aria-hidden="true" className="h-full w-full" preserveAspectRatio="none">
            <line
              className="stroke-border"
              strokeDasharray="3 3"
              strokeWidth="2"
              x1="0"
              x2="0"
              y1="0"
              y2="100%"
            />
          </svg>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-0">
        {/* Content */}
        <div className="col-span-2 my-auto px-2">
          <h2 className="relative text-lg font-semibold tracking-tight text-foreground">
            Pro League Coverage
            <div className="absolute top-1 -left-[8px] h-5 w-[3px] rounded-r-sm bg-foreground" />
          </h2>
          <p className="mt-2 text-3xl font-semibold tracking-tighter text-balance text-foreground md:text-4xl">
            Complete data across PLL, NLL, MLL, MSL, and WLA
          </p>
          <p className="mt-4 text-balance text-muted-foreground">
            Access comprehensive statistics from all major professional lacrosse leagues. Player
            stats, game results, standings, and historical records unified in one platform.
          </p>
        </div>
        <div className="relative col-span-2 flex items-center justify-center overflow-hidden">
          <svg
            aria-hidden="true"
            className="absolute size-full [mask-image:linear-gradient(transparent,white_10rem)]"
          >
            <defs>
              <pattern
                height="64"
                id="diagonal-feature-pattern"
                patternUnits="userSpaceOnUse"
                width="64"
              >
                {Array.from({ length: 17 }, (_, i) => {
                  const offset = i * 8;
                  return (
                    <path
                      className="stroke-border/70"
                      d={`M${-106 + offset} 110L${22 + offset} -18`}
                      key={i}
                      strokeWidth="1"
                    />
                  );
                })}
              </pattern>
            </defs>
            <rect fill="url(#diagonal-feature-pattern)" height="100%" width="100%" />
          </svg>
          <div className="pointer-events-none h-[26rem] p-10 select-none">
            <div className="relative flex flex-col items-center justify-center">
              <Orbit
                durationSeconds={40}
                keepUpright
                orbitingObjects={[
                  <div className="relative flex items-center justify-center" key="obj1">
                    <RiTeamFill className="z-10 size-5 text-foreground" />
                    <div className="absolute size-10 rounded-full bg-background/50 shadow-lg ring-1 ring-foreground/5" />
                    <div className="absolute -top-5 left-4">
                      <div className="flex gap-1">
                        <div className="flex items-center justify-center rounded-l-full bg-emerald-500 p-1 text-xs ring-1 ring-border">
                          <RiCheckLine className="size-3 shrink-0 text-white" />
                        </div>
                        <div className="rounded-r-full bg-background/50 py-0.5 pr-1.5 pl-1 text-xs whitespace-nowrap ring-1 ring-border">
                          PLL 2024
                        </div>
                      </div>
                    </div>
                    <div
                      className="absolute size-10 animate-[ping_7s_ease_infinite] rounded-full ring-1 ring-subtle/50"
                      style={{
                        animationDelay: "1s",
                      }}
                    />
                  </div>,

                  <div className="relative flex items-center justify-center" key="obj2">
                    <RiBarChartFill className="z-10 size-5 text-foreground" />
                    <div className="absolute size-10 rounded-full bg-background/50 shadow-lg ring-1 ring-foreground/5" />
                    <div className="absolute -top-5 left-4">
                      <div className="flex gap-1">
                        <div className="flex items-center justify-center rounded-l-full bg-subtle p-1 text-xs ring-1 ring-border">
                          <RiLoaderFill className="size-3 shrink-0 animate-spin text-white" />
                        </div>
                        <div className="rounded-r-full bg-background/50 py-0.5 pr-1.5 pl-1 text-xs ring-1 ring-border">
                          Syncing
                        </div>
                      </div>
                    </div>
                    <div
                      className="absolute size-10 animate-[ping_7s_ease_infinite] rounded-full ring-1 ring-subtle/50"
                      style={{
                        animationDelay: "4s",
                      }}
                    />
                  </div>,

                  <div className="relative flex items-center justify-center" key="obj3">
                    <RiDatabase2Fill className="z-10 size-5 text-foreground" />
                    <div className="absolute size-10 rounded-full bg-background/50 shadow-lg ring-1 ring-foreground/5" />
                    <div
                      className="absolute size-10 animate-[ping_7s_ease_infinite] rounded-full ring-1 ring-subtle/50"
                      style={{
                        animationDelay: "2s",
                      }}
                    />
                  </div>,
                  <div className="relative flex items-center justify-center" key="obj4">
                    <Icons.QuadCopter className="z-10 size-5 rotate-90 text-foreground" />
                    <div className="absolute size-10 rounded-full bg-background/50 shadow-lg ring-1 ring-foreground/5" />
                    <div className="absolute -top-5 left-4">
                      <div className="flex gap-1">
                        <div className="flex items-center justify-center rounded-l-full bg-emerald-500 p-1 text-xs ring-1 ring-border">
                          <RiCheckLine className="size-3 shrink-0 text-white" />
                        </div>
                        <div className="rounded-r-full bg-background/50 py-0.5 pr-1.5 pl-1 text-xs ring-1 ring-border">
                          NLL 2024
                        </div>
                      </div>
                    </div>

                    <div
                      className="absolute size-10 animate-[ping_7s_ease_infinite] rounded-full ring-1 ring-subtle/50"
                      style={{
                        animationDelay: "6s",
                      }}
                    />
                  </div>,
                  <div className="relative flex items-center justify-center" key="obj5">
                    <RiTeamFill className="z-10 size-5 text-foreground" />
                    <div className="absolute size-10 rounded-full bg-background/50 shadow-lg ring-1 ring-foreground/5" />
                    <div
                      className="absolute size-10 animate-[ping_7s_ease_infinite] rounded-full ring-1 ring-subtle/50"
                      style={{
                        animationDelay: "3s",
                      }}
                    />
                  </div>,
                ]}
                radiusPx={140}
              >
                <div className="relative flex h-48 w-48 items-center justify-center">
                  <div className="rounded-full p-1 ring-1 ring-foreground/10">
                    <div className="relative z-10 flex size-20 items-center justify-center rounded-full bg-background shadow-[inset_0px_-15px_20px_rgba(0,0,0,0.1),0_7px_10px_0_rgba(0,0,0,0.15)] ring-1 ring-foreground/20">
                      <span className="text-lg font-semibold text-foreground">LAX</span>
                    </div>
                    <div className="absolute inset-12 animate-[spin_8s_linear_infinite] rounded-full bg-linear-to-t from-transparent via-subtle to-transparent blur-lg" />
                  </div>
                </div>
              </Orbit>
            </div>
          </div>
        </div>

        <div className="col-span-2 my-auto px-2">
          <h2 className="relative text-lg font-semibold tracking-tight text-foreground">
            Player Analytics
            <div className="absolute top-1 -left-[8px] h-5 w-[3px] rounded-r-sm bg-foreground" />
          </h2>
          <p className="mt-2 text-3xl font-semibold tracking-tighter text-balance text-foreground md:text-4xl">
            Deep insights into player performance and careers
          </p>
          <p className="mt-4 text-balance text-muted-foreground">
            Track player statistics across seasons and leagues. Goals, assists, saves, faceoff
            percentages - all normalized and comparable across different eras and competitions.
          </p>
        </div>
        <div className="relative col-span-2 flex items-center justify-center overflow-hidden">
          <svg aria-hidden="true" className="absolute size-full">
            <defs>
              <pattern
                height="64"
                id="diagonal-feature-pattern-2"
                patternUnits="userSpaceOnUse"
                width="64"
              >
                {Array.from({ length: 17 }, (_, i) => {
                  const offset = i * 8;
                  return (
                    <path
                      className="stroke-border/70"
                      d={`M${-106 + offset} 110L${22 + offset} -18`}
                      key={i}
                      strokeWidth="1"
                    />
                  );
                })}
              </pattern>
            </defs>
            <rect fill="url(#diagonal-feature-pattern-2)" height="100%" width="100%" />
          </svg>
          <div className="relative h-[432px] w-[432px]">
            <svg
              aria-hidden="true"
              className="mask absolute size-[432px]"
              fill="none"
              id="grid"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                className="stroke-border"
                d="M48 0v432M96 0v432M144 0v432M192 0v432M240 0v432M288 0v432M336 0v432M384 0v432M0 48h432M0 96h432M0 144h432M0 192h432M0 240h432M0 288h432M0 336h432M0 384h432"
              />
            </svg>

            <div className="pointer-events-none relative h-full select-none">
              <div className="absolute top-[192px] left-[191.8px]">
                <div className="flex h-12 w-12 items-center justify-center bg-background shadow-sm ring-1 ring-foreground/15">
                  <span className="text-sm font-bold text-foreground">G</span>
                </div>
              </div>
              <div className="absolute top-[144px] left-[48px]">
                <div className="relative">
                  <div className="absolute inset-0 size-12 animate-pulse bg-accent blur-[3px]" />
                  <div className="relative flex h-12 w-12 items-center justify-center bg-background shadow-sm ring-1 ring-foreground/15">
                    <span className="text-sm font-medium text-muted-foreground">34</span>
                  </div>
                </div>
              </div>

              <div className="absolute top-[48px] left-[144px]">
                <div className="relative">
                  <div className="absolute inset-0 size-12 animate-pulse bg-accent blur-[3px]" />
                  <div className="relative flex h-12 w-12 items-center justify-center bg-background shadow-sm ring-1 ring-foreground/15">
                    <span className="text-sm font-medium text-muted-foreground">52</span>
                  </div>
                </div>
              </div>

              <div className="absolute top-[96px] left-[240px]">
                <div className="relative">
                  <div className="absolute inset-0 size-12 animate-pulse bg-accent blur-[3px]" />
                  <div className="relative flex h-12 w-12 items-center justify-center bg-background shadow-sm ring-1 ring-foreground/15">
                    <span className="text-sm font-medium text-muted-foreground">18</span>
                  </div>
                </div>
              </div>

              <div className="absolute top-[240px] left-[385px]">
                <div className="relative">
                  <div className="absolute inset-0 size-12 animate-pulse bg-accent blur-[3px]" />
                  <div className="relative flex h-12 w-12 items-center justify-center bg-background shadow-sm ring-1 ring-foreground/15">
                    <span className="text-sm font-medium text-muted-foreground">67%</span>
                  </div>
                </div>
              </div>

              <div className="absolute top-[337px] left-[336px]">
                <div className="relative">
                  <div className="absolute inset-0 size-12 animate-pulse bg-accent blur-[3px]" />
                  <div className="relative flex h-12 w-12 items-center justify-center bg-background shadow-sm ring-1 ring-foreground/15">
                    <span className="text-sm font-medium text-muted-foreground">8</span>
                  </div>
                </div>
              </div>

              <div className="absolute top-[288px] left-[144px]">
                <div className="relative">
                  <div className="absolute inset-0 size-12 animate-pulse bg-accent blur-[3px]" />
                  <div className="relative flex h-12 w-12 items-center justify-center bg-background shadow-sm ring-1 ring-foreground/15">
                    <span className="text-sm font-medium text-muted-foreground">41</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-2 my-auto px-2">
          <h2 className="relative text-lg font-semibold tracking-tight text-foreground">
            Knowledge Graph
            <div className="absolute top-1 -left-[7px] h-5 w-[3px] rounded-r-sm bg-foreground" />
          </h2>
          <p className="mt-2 text-3xl font-semibold tracking-tighter text-balance text-foreground md:text-4xl">
            Explore connections between players, teams, and seasons
          </p>
          <p className="mt-4 text-balance text-muted-foreground">
            Discover relationships in lacrosse data through an interactive knowledge graph.
            Teammates, rivals, career paths, and statistical connections all visualized.
          </p>
        </div>
        <div className="relative col-span-2 flex items-center justify-center overflow-hidden">
          <svg
            aria-hidden="true"
            className="absolute size-full [mask-image:linear-gradient(white_10rem,transparent)]"
          >
            <defs>
              <pattern
                height="64"
                id="diagonal-feature-pattern-3"
                patternUnits="userSpaceOnUse"
                width="64"
              >
                {Array.from({ length: 17 }, (_, i) => {
                  const offset = i * 8;
                  return (
                    <path
                      className="stroke-border/70"
                      d={`M${-106 + offset} 110L${22 + offset} -18`}
                      key={i}
                      strokeWidth="1"
                    />
                  );
                })}
              </pattern>
            </defs>
            <rect fill="url(#diagonal-feature-pattern-3)" height="100%" width="100%" />
          </svg>
          <div className="pointer-events-none relative flex size-full h-[26rem] items-center justify-center p-10 select-none">
            <div className="relative">
              <div className="absolute top-[6rem] left-[6rem] z-20">
                <div className="relative mx-auto w-fit rounded-full bg-accent p-1 shadow-md ring-1 shadow-black/10 ring-foreground/10">
                  <div className="w-fit rounded-full bg-linear-to-b from-background to-accent p-3 shadow-[inset_0px_-2px_6px_rgba(0,0,0,0.09),0_3px_5px_0_rgba(0,0,0,0.19)] ring-1 ring-background/50 ring-inset">
                    <RiNotification2Line aria-hidden="true" className="size-5 text-foreground" />
                  </div>
                </div>
              </div>
              <div className="absolute top-[6rem] right-[6rem] z-20">
                <div className="relative mx-auto w-fit rounded-full bg-accent p-1 shadow-md ring-1 shadow-black/10 ring-foreground/10">
                  <div className="w-fit rounded-full bg-linear-to-b from-background to-accent p-3 shadow-[inset_0px_-2px_6px_rgba(0,0,0,0.05),0_7px_10px_0_rgba(0,0,0,0.10)] ring-1 ring-background/50 ring-inset">
                    <RiContrast2Line aria-hidden="true" className="size-5 text-foreground" />
                  </div>
                </div>
              </div>
              <div className="absolute right-[6rem] bottom-[6rem] z-20">
                <div className="relative mx-auto w-fit rounded-full bg-accent p-1 shadow-md ring-1 shadow-black/10 ring-foreground/10">
                  <div className="w-fit rounded-full bg-linear-to-b from-background to-accent p-3 shadow-[inset_0px_-2px_6px_rgba(0,0,0,0.05),0_7px_10px_0_rgba(0,0,0,0.10)] ring-1 ring-background/50 ring-inset">
                    <RiCodepenLine aria-hidden="true" className="size-5 text-foreground" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-[6rem] left-[6rem] z-20">
                <div className="relative mx-auto w-fit rounded-full bg-accent p-1 shadow-md ring-1 shadow-black/10 ring-foreground/10">
                  <div className="w-fit rounded-full bg-linear-to-b from-background to-accent p-3 shadow-[inset_0px_-2px_6px_rgba(0,0,0,0.05),0_7px_10px_0_rgba(0,0,0,0.10)] ring-1 ring-background/50 ring-inset">
                    <RiFullscreenFill aria-hidden="true" className="size-5 text-foreground" />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              {[0, 45, 135, 180, 225, 315, 360].map((rotation, index) => (
                <div
                  className="absolute origin-left overflow-hidden"
                  key={rotation}
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div className="relative">
                    <div className="h-0.5 w-60 bg-linear-to-r from-border to-transparent" />
                    <div
                      className="absolute top-0 left-0 h-0.5 w-28 bg-linear-to-r from-transparent via-subtle to-transparent"
                      style={{
                        animation: `gridMovingLine 5s linear infinite ${index * 1.2}s`,
                        animationFillMode: "backwards",
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="absolute -translate-x-1/2 -translate-y-1/2">
                <ChipViz />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
