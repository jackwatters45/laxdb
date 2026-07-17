// Edit the paragraphs in planningPage.content to rewrite the working outline.
// The rest of the guide is registered in pages.tsx.
export const planningSections = [
  { id: "learning-sequence", label: "Learning sequence" },
] as const;

export const planningPage = {
  path: "/",
  number: "00",
  navLabel: "Plan",
  eyebrow: "Working outline",
  title: "Plan",
  summary: "Working outline for the rules guide.",
  sections: planningSections,
  content: (
    <section className="guide-section" id="learning-sequence">
      <div className="planning-copy prose prose-wide">
        <p>
          The guide starts with <strong>Start here</strong>, a simple
          explanation of the shape of the game, the ideas a new viewer needs
          first, and what a whistle means.
        </p>
        <p>
          From there, <strong>Game &amp; field</strong> introduces scoring,
          field markings, player positions, the goal circle, restraining lines,
          offside, possession, and legal play. <strong>Equipment</strong>{" "}
          follows with crosses, pockets, protective equipment, uniforms, balls,
          goals, and inspections.
        </p>
        <p>
          <strong>Game procedures</strong> follows an actual game from pregame
          through the draw, live play, boundaries, substitutions, timeouts, and
          overtime. Once that sequence is clear,{" "}
          <strong>Fouls &amp; advantage</strong> explains minor and major fouls,
          shooting space, three-second rules, offensive fouls, and the slow
          whistle.
        </p>
        <p>
          <strong>Restarts &amp; penalties</strong> covers free positions,
          self-starts, restart locations, 8-meter attempts, cards, and team
          penalties. <strong>Officials &amp; signals</strong> then connects the
          officiating crew, table, signals, and common rulings to what happens
          during play.
        </p>
        <p>
          The guide finishes with <strong>Levels &amp; glossary</strong>, which
          compares meaningful rule variations, corrects common misreads, and
          defines the vocabulary used throughout the guide.
        </p>
      </div>
    </section>
  ),
} as const;
