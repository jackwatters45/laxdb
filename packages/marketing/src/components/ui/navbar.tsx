"use client";

import { Logo } from "@laxdb/ui/components/logo";
import { RiCloseFill, RiMenuFill } from "@remixicon/react";
import { Link } from "@tanstack/react-router";
import React from "react";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/site";

export function NavBar() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-4 py-3">
        <div className="relative flex items-center justify-between">
          <Link
            aria-label="Home"
            to={siteConfig.baseLinks.home}
            className="flex items-center gap-2 text-lg font-medium text-foreground"
          >
            <Logo />
            LaxDB
          </Link>
          <nav className="hidden items-center gap-6 text-sm sm:flex">
            <Link className="text-foreground hover:underline" to="/about">
              About
            </Link>
            <Link className="text-foreground hover:underline" to="/blog">
              Blog
            </Link>
            <Link className="text-foreground hover:underline" to="/wiki">
              Wiki
            </Link>
            <Link className="text-foreground hover:underline" to="/graph">
              Graph
            </Link>
          </nav>
          <button
            aria-label={open ? "Close Navigation Menu" : "Open Navigation Menu"}
            className="p-1.5 sm:hidden"
            onClick={() => {
              setOpen(!open);
            }}
            type="button"
          >
            {open ? (
              <RiCloseFill aria-hidden className="size-6 shrink-0 text-foreground" />
            ) : (
              <RiMenuFill aria-hidden className="size-6 shrink-0 text-foreground" />
            )}
          </button>
        </div>
        <nav
          className={cn(
            "mt-6 flex flex-col gap-6 text-lg ease-in-out will-change-transform sm:hidden",
            open ? "" : "hidden",
          )}
        >
          <ul className="space-y-4">
            <li
              onClick={() => {
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setOpen(false);
                }
              }}
            >
              <Link className="hover:underline" to="/about">
                About
              </Link>
            </li>
            <li
              onClick={() => {
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setOpen(false);
                }
              }}
            >
              <Link className="hover:underline" to="/blog">
                Blog
              </Link>
            </li>
            <li
              onClick={() => {
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setOpen(false);
                }
              }}
            >
              <Link className="hover:underline" to="/wiki">
                Wiki
              </Link>
            </li>
            <li
              onClick={() => {
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setOpen(false);
                }
              }}
            >
              <Link className="hover:underline" to="/graph">
                Graph
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
