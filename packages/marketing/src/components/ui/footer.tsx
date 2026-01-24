import { Logo } from "@laxdb/ui/components/logo";
import { ThemeToggle } from "@laxdb/ui/components/theme-toggle";
import { Link } from "@tanstack/react-router";

const Footer = () => {
  return (
    <div className="px-4 xl:px-0">
      <footer className="relative mx-auto flex max-w-6xl flex-wrap pt-4" id="footer">
        <div className="pointer-events-none inset-0">
          <div
            className="absolute inset-y-0 my-[-5rem] w-px"
            style={{
              maskImage: "linear-gradient(transparent, white 5rem)",
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

          <div
            className="absolute inset-y-0 right-0 my-[-5rem] w-px"
            style={{
              maskImage: "linear-gradient(transparent, white 5rem)",
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
        <svg
          aria-hidden="true"
          className="mb-10 h-20 w-full border-y border-dashed border-border stroke-border"
        >
          <defs>
            <pattern
              height="64"
              id="diagonal-footer-pattern"
              patternUnits="userSpaceOnUse"
              width="64"
            >
              {Array.from({ length: 17 }, (_, i) => {
                const offset = i * 8;
                return (
                  <path
                    d={`M${-106 + offset} 110L${22 + offset} -18`}
                    key={i}
                    stroke=""
                    strokeWidth="1"
                  />
                );
              })}
            </pattern>
          </defs>
          <rect fill="url(#diagonal-footer-pattern)" height="100%" stroke="none" width="100%" />
        </svg>
        <div className="mr-auto hidden w-full flex-col justify-between pl-2 lg:flex lg:w-fit">
          <Logo className="size-8" />
          <ThemeToggle className="mt-auto" />
        </div>

        <div className="mt-10 min-w-44 pl-2 lg:mt-0 lg:pl-0">
          <h3 className="mb-4 font-medium text-foreground sm:text-sm">Data</h3>
          <ul className="space-y-4">
            <li className="text-sm">
              <Link
                className="text-muted transition-colors duration-200 hover:text-foreground"
                to="/wiki"
              >
                Wiki
              </Link>
            </li>
            <li className="text-sm">
              <Link
                className="text-muted transition-colors duration-200 hover:text-foreground"
                to="/graph"
              >
                Graph
              </Link>
            </li>
          </ul>
        </div>

        <div className="mt-10 min-w-44 pl-2 lg:mt-0 lg:pl-0">
          <h3 className="mb-4 font-medium text-foreground sm:text-sm">Resources</h3>
          <ul className="space-y-4">
            <li className="text-sm">
              <Link
                className="text-muted transition-colors duration-200 hover:text-foreground"
                to="/blog"
              >
                Blog
              </Link>
            </li>
            <li className="text-sm">
              <a
                className="text-muted transition-colors duration-200 hover:text-foreground"
                href="https://github.com/jackwatters45/laxdb"
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
