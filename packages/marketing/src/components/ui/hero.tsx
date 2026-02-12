import { RiArrowRightUpLine } from "@remixicon/react";
import { Link } from "@tanstack/react-router";

import { FadeContainer, FadeDiv, FadeSpan } from "../fade";

import GameOfLife from "./hero-background";

export function Hero() {
  return (
    <section aria-label="hero">
      <FadeContainer className="relative flex flex-col items-center justify-center">
        <FadeDiv className="mx-auto">
          <Link aria-label="View the wiki" className="mx-auto w-full" to="/wiki">
            <div className="inline-flex max-w-full items-center gap-3 rounded-full bg-accent/50 px-2.5 py-0.5 pr-3 pl-0.5 font-medium text-foreground shadow-lg ring-1 shadow-black/10 ring-border filter backdrop-blur-[1px] transition-colors hover:bg-accent/70 focus:outline-hidden sm:text-sm">
              <span className="shrink-0 truncate rounded-full border border-border bg-background px-2.5 py-1 text-sm text-muted-foreground sm:text-xs">
                New
              </span>
              <span className="flex items-center gap-1 truncate">
                <span className="w-full truncate">Pro League Data Now Available</span>

                <RiArrowRightUpLine className="size-4 shrink-0 text-muted-foreground" />
              </span>
            </div>
          </Link>
        </FadeDiv>
        <h1 className="mt-8 text-center text-5xl font-semibold tracking-tighter text-foreground sm:text-8xl sm:leading-[5.5rem]">
          <FadeSpan>The</FadeSpan> <FadeSpan>Lacrosse</FadeSpan>
          <br />
          <FadeSpan>Data</FadeSpan> <FadeSpan>Platform</FadeSpan>
        </h1>
        <p className="mt-5 max-w-xl text-center text-base text-balance text-muted-foreground sm:mt-8 sm:text-xl">
          <FadeSpan>Comprehensive statistics and analytics</FadeSpan>{" "}
          <FadeSpan>for professional lacrosse. PLL, NLL, MLL,</FadeSpan>{" "}
          <FadeSpan>MSL, WLA - all in one place.</FadeSpan>
        </p>
        <FadeDiv>
          <Link
            className="mt-6 inline-flex cursor-pointer flex-row items-center justify-center gap-1 rounded-md border-b-[1.5px] border-foreground/20 bg-foreground px-5 py-3 leading-4 font-medium tracking-wide whitespace-nowrap text-background shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(255,255,255,0.19)] transition-all duration-200 ease-in-out hover:opacity-90"
            to="/wiki"
          >
            Explore Data
          </Link>
        </FadeDiv>
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <GameOfLife />
        </div>
      </FadeContainer>
    </section>
  );
}
