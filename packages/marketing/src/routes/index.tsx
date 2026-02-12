import { createFileRoute } from "@tanstack/react-router";

import Features from "@/components/ui/features";
import { Hero } from "@/components/ui/hero";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="relative mx-auto flex flex-col">
      <div className="pt-56">
        <Hero />
      </div>
      <div className="mt-52 mb-40 px-4 xl:px-0">
        <Features />
      </div>
    </main>
  );
}
