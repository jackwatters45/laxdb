'use client';

import { RiCloseFill, RiMenuFill } from '@remixicon/react';
import Link from 'next/link';
import React from 'react';
import { siteConfig } from '@/app/site-config';
import useScroll from '@/lib/use-scroll';
import { cn } from '@/lib/utils';
import { SolarLogo } from '../../../public/solar-logo';
import { Button } from '../button';

export function NavBar() {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(15);

  return (
    <header
      className={cn(
        'fixed inset-x-4 top-4 z-50 mx-auto flex max-w-6xl justify-center rounded-lg border border-transparent px-3 py-3 transition duration-300',
        scrolled || open
          ? 'border-gray-200/50 bg-white/80 shadow-2xl shadow-black/5 backdrop-blur-sm'
          : 'bg-white/0'
      )}
    >
      <div className="w-full md:my-auto">
        <div className="relative flex items-center justify-between">
          <Link aria-label="Home" href={siteConfig.baseLinks.home}>
            <span className="sr-only">Solar Tech Logo</span>
            <SolarLogo className="w-22" />
          </Link>
          <nav className="hidden sm:block md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:transform">
            <div className="flex items-center gap-10 font-medium">
              <Link className="px-2 py-1 text-gray-900" href="#solutions">
                Solutions
              </Link>
              <Link className="px-2 py-1 text-gray-900" href="#farm-management">
                Farm Management
              </Link>
              <Link className="px-2 py-1 text-gray-900" href="#solar-analytics">
                Analytics
              </Link>
            </div>
          </nav>
          <Button
            className="hidden h-10 font-semibold sm:block"
            variant="secondary"
          >
            Get a quote
          </Button>
          <Button
            aria-label={open ? 'CloseNavigation Menu' : 'Open Navigation Menu'}
            className="p-1.5 sm:hidden"
            onClick={() => setOpen(!open)}
            variant="secondary"
          >
            {open ? (
              <RiCloseFill
                aria-hidden
                className="size-6 shrink-0 text-gray-900"
              />
            ) : (
              <RiMenuFill
                aria-hidden
                className="size-6 shrink-0 text-gray-900"
              />
            )}
          </Button>
        </div>
        <nav
          className={cn(
            'mt-6 flex flex-col gap-6 text-lg ease-in-out will-change-transform sm:hidden',
            open ? '' : 'hidden'
          )}
        >
          <ul className="space-y-4 font-medium">
            <li
              onClick={() => setOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setOpen(false);
                }
              }}
            >
              <Link href="#solutions">Solutions</Link>
            </li>
            <li
              onClick={() => setOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setOpen(false);
                }
              }}
            >
              <Link href="#farm-management">Farm Management</Link>
            </li>
            <li
              onClick={() => setOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setOpen(false);
                }
              }}
            >
              <Link href="#solar-analytics">Analytics</Link>
            </li>
          </ul>
          <Button className="text-lg" variant="secondary">
            Get a quote
          </Button>
        </nav>
      </div>
    </header>
  );
}
