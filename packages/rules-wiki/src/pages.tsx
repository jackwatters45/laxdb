/* oxlint-disable typescript/prefer-readonly-parameter-types -- React nodes and inline tuple data include mutable library interfaces. */
import type { ReactNode } from "react";

import {
  FieldDiagram,
  FlowMark,
  FreePositionDiagram,
  HeroIllustration,
  LaneDiagram,
  PlayerMark,
  WhistleIcon,
} from "./Illustrations";
import { planningPage } from "./planning-page";

export type SectionMeta = Readonly<{ id: string; label: string }>;

export type GuidePage = Readonly<{
  path: string;
  number: string;
  navLabel: string;
  eyebrow: string;
  title: string;
  summary: string;
  sections: readonly SectionMeta[];
  content: ReactNode;
}>;

function RuleSection({
  id,
  number,
  title,
  children,
}: Readonly<{
  id: string;
  number: string;
  title: string;
  children: ReactNode;
}>) {
  return (
    <section className="guide-section" id={id}>
      <header className="section-heading">
        <span>{number}</span>
        <div>
          <h2>{title}</h2>
        </div>
      </header>
      {children}
    </section>
  );
}

function Callout({
  label,
  tone = "plain",
  children,
}: Readonly<{
  label: string;
  tone?: "plain" | "green" | "orange" | "dark";
  children: ReactNode;
}>) {
  return (
    <aside className={`callout callout-${tone}`}>
      <span>{label}</span>
      <div>{children}</div>
    </aside>
  );
}

function RuleGrid({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="rule-grid">{children}</div>;
}

function RuleCard({
  title,
  children,
  accent,
}: Readonly<{ title: string; children: ReactNode; accent?: string }>) {
  return (
    <article className="rule-card">
      {accent ? <span>{accent}</span> : null}
      <h3>{title}</h3>
      <div>{children}</div>
    </article>
  );
}

function Steps({
  items,
}: Readonly<{
  items: readonly Readonly<{ title: string; body: string }>[];
}>) {
  return (
    <ol className="procedure-list">
      {items.map((item, index) => (
        <li key={item.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function DefinitionList({
  items,
}: Readonly<{ items: readonly (readonly [string, string])[] }>) {
  return (
    <dl className="definition-grid">
      {items.map(([term, definition]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{definition}</dd>
        </div>
      ))}
    </dl>
  );
}

const overviewSections = [
  { id: "shape-of-game", label: "Shape of the game" },
  { id: "five-ideas", label: "Five ideas first" },
  { id: "whistle-decoder", label: "Read the whistle" },
  { id: "ruleset", label: "Rules covered" },
  { id: "reading-order", label: "How to use the guide" },
] as const;

const gameSections = [
  { id: "objective-scoring", label: "Objective & scoring" },
  { id: "field-markings", label: "Field & markings" },
  { id: "players-positions", label: "Players & positions" },
  { id: "goal-circle", label: "The goal circle" },
  { id: "offside", label: "Restraining lines" },
  { id: "possession", label: "Legal possession" },
] as const;

const equipmentSections = [
  { id: "field-crosse", label: "The field crosse" },
  { id: "goalkeeper-crosse", label: "Goalkeeper crosse" },
  { id: "protective-equipment", label: "Protective equipment" },
  { id: "uniform-personal", label: "Uniform & personal" },
  { id: "ball-goal-field", label: "Ball, goals & field" },
  { id: "inspection", label: "Equipment checks" },
] as const;

const procedureSections = [
  { id: "before-game", label: "Before the game" },
  { id: "timing", label: "Quarters & clock" },
  { id: "draw", label: "The draw" },
  { id: "live-play", label: "Live-ball play" },
  { id: "boundaries", label: "Out of bounds" },
  { id: "substitutions", label: "Substitutions" },
  { id: "timeouts-overtime", label: "Timeouts & overtime" },
] as const;

const foulSections = [
  { id: "foul-framework", label: "How fouls work" },
  { id: "minor-fouls", label: "Minor fouls" },
  { id: "major-fouls", label: "Major fouls" },
  { id: "shooting-space", label: "Shooting space" },
  { id: "three-seconds", label: "Three-second rules" },
  { id: "slow-whistle", label: "Slow & held whistle" },
  { id: "offensive-fouls", label: "Offensive fouls" },
] as const;

const penaltySections = [
  { id: "restart-basics", label: "Restart basics" },
  { id: "self-start", label: "Self-start" },
  { id: "penalty-geography", label: "Restart locations" },
  { id: "eight-meter", label: "8-meter position" },
  { id: "goal-circle-restarts", label: "Goal-circle restarts" },
  { id: "cards", label: "Green, yellow & red" },
  { id: "team-penalties", label: "Team fouls & delay" },
] as const;

const officialSections = [
  { id: "crew", label: "The officiating crew" },
  { id: "signals", label: "Whistles & signals" },
  { id: "table", label: "Scorer & timer" },
  { id: "responsibilities", label: "Responsibilities" },
  { id: "scenarios", label: "Game scenarios" },
] as const;

const referenceSections = [
  { id: "level-comparison", label: "Rules by level" },
  { id: "youth-pathway", label: "Youth progression" },
  { id: "common-misreads", label: "Common misreads" },
  { id: "glossary", label: "Glossary" },
  { id: "sources", label: "Primary sources" },
] as const;

export const guidePages: readonly [GuidePage, ...GuidePage[]] = [
  planningPage,
  {
    path: "/start-here",
    number: "01",
    navLabel: "Start here",
    eyebrow: "Orientation",
    title: "Understand the whole game first",
    summary:
      "A plain-language map of girls’ lacrosse: what each team is trying to do, why the whistle blows, and which concepts make every later rule easier to understand.",
    sections: overviewSections,
    content: (
      <>
        <RuleSection
          id="shape-of-game"
          number="01.1"
          title="The shape of the game"
        >
          <div className="hero-in-section">
            <div className="prose prose-lead">
              <p>
                Two teams move a ball with their crosses, trying to put it fully
                across the opponent’s goal line. The full-field high school game
                is <strong>12 against 12</strong>: eleven field players and one
                goalkeeper per team. Players may run, carry, cradle, pass,
                catch, check, and shoot within rules designed around space and
                safety.
              </p>
              <p>
                Unlike the men’s game, legal defense is not built around body
                checking. A defender wins with footwork, position, controlled
                crosse-to-crosse checking, and pressure. The most important
                rules protect the head, keep a clear path for a shot, and
                prevent players from using the stick or body dangerously.
              </p>
            </div>
            <HeroIllustration />
          </div>
          <div className="fact-strip">
            <div>
              <strong>12 v 12</strong>
              <p>Eleven field players plus one goalkeeper.</p>
            </div>
            <div>
              <strong>4 × 12</strong>
              <p>High school regulation uses twelve-minute quarters.</p>
            </div>
            <div>
              <strong>No shot clock</strong>
              <p>
                NFHS high school play does not use the NCAA possession clock.
              </p>
            </div>
            <div>
              <strong>2 timeouts</strong>
              <p>Each team has two team timeouts in regulation.</p>
            </div>
          </div>
        </RuleSection>

        <RuleSection
          id="five-ideas"
          number="01.2"
          title="Five ideas to learn first"
        >
          <RuleGrid>
            <RuleCard title="Possession" accent="01">
              <p>
                A player controls the ball when it is settled in the crosse and
                they can perform normal actions such as carry, cradle, pass, or
                shoot.
              </p>
              <p>
                A loose ball belongs to no one. Ground-ball rules protect a fair
                contest for it.
              </p>
            </RuleCard>
            <RuleCard title="Marking" accent="02">
              <p>
                A defender is marking when guarding an opponent within a stick’s
                length. Marking matters for shooting-space and three-second
                decisions.
              </p>
            </RuleCard>
            <RuleCard title="The sphere" accent="03">
              <p>
                The protected sphere surrounds a player’s head. A defender
                cannot check through it, and a ball carrier cannot hide the
                crosse illegally inside it.
              </p>
            </RuleCard>
            <RuleCard title="Critical scoring area" accent="04">
              <p>
                The area around goal has special safety, slow-whistle,
                positioning, and restart rules. The 8-meter arc and 12-meter fan
                help administer them.
              </p>
            </RuleCard>
            <RuleCard title="Advantage" accent="05">
              <p>
                Officials try not to reward the team that fouled. A whistle may
                be held when stopping immediately would erase a real scoring
                opportunity.
              </p>
            </RuleCard>
          </RuleGrid>
          <Callout label="Best shortcut" tone="green">
            <p>
              If you can identify possession, the protected sphere, who is
              marking whom, and whether the ball is in the critical scoring
              area, most whistles stop feeling random.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection
          id="whistle-decoder"
          number="01.3"
          title="Read the whistle"
        >
          <div className="whistle-layout">
            <div className="whistle-mark">
              <WhistleIcon />
            </div>
            <div className="prose">
              <h3>Whistle now</h3>
              <p>
                Play stops immediately for a foul requiring administration, a
                dangerous situation, a boundary that needs a whistle, a goal,
                timeout, injury, or another dead-ball event. Players may
                generally move after a whistle, but the fouled player and
                offender must obey the free-position setup.
              </p>
              <h3>Flag up, whistle later</h3>
              <p>
                In the critical scoring area, an official can raise a flag and
                hold the whistle when the attack is on a scoring play and keeps
                a quality opportunity. The foul is not ignored. Play ends on the
                shot, loss of possession, end of the scoring play, or an
                attacking foul, and the official then administers the result.
              </p>
              <h3>No call</h3>
              <p>
                Contact is not automatically a foul. Incidental contact can
                occur, and an established defender is not responsible merely
                because the attacker runs into legal position. Officials judge
                who created the illegal action and whether it created danger or
                disadvantage.
              </p>
            </div>
          </div>
        </RuleSection>

        <RuleSection
          id="ruleset"
          number="01.4"
          title="Which rules this teaches"
        >
          <div className="prose prose-wide">
            <p>
              The primary ruleset in this guide is the{" "}
              <strong>2026 NFHS girls’ high school game</strong>, interpreted
              with current USA Lacrosse materials. That is the most useful
              baseline for understanding full-field girls’ lacrosse in the
              United States.
            </p>
            <p>
              Youth, NCAA/WCLA, World Lacrosse field, Sixes, professional, and
              state-association rules differ. When a difference materially
              changes what a player sees—game length, checking, shot clocks,
              cards, numbers of players, or restart mechanics—the guide calls it
              out. Local league and state rules always control the actual game.
            </p>
          </div>
          <Callout label="Accuracy note" tone="orange">
            <p>
              This is an explanatory field guide, not an official replacement
              for the NFHS rulebook or a ruling from the game officials. It
              translates the rules; it does not create them.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection
          id="reading-order"
          number="01.5"
          title="How to use the guide"
        >
          <div className="reading-path">
            {[
              [
                "02",
                "The game & field",
                "/game-and-field",
                "Learn the geography, player count, offside shape, and what legal possession looks like.",
              ],
              [
                "03",
                "Equipment",
                "/equipment",
                "Understand the crosse, pocket, eyewear, mouthpiece, goalkeeper protection, and inspections.",
              ],
              [
                "04",
                "Game procedures",
                "/game-procedures",
                "Follow a game from pregame through the draw, live play, substitutions, boundaries, and overtime.",
              ],
              [
                "05",
                "Fouls & advantage",
                "/fouls-and-advantage",
                "Separate minor from major fouls and understand shooting space, three seconds, and the slow whistle.",
              ],
              [
                "06",
                "Restarts & penalties",
                "/restarts-and-penalties",
                "See where the ball goes, who moves four meters, how the 8-meter works, and what cards mean.",
              ],
              [
                "07",
                "Officials & signals",
                "/officials-and-signals",
                "Decode the crew, table, signals, and common rulings.",
              ],
              [
                "08",
                "Levels & glossary",
                "/levels-and-glossary",
                "Compare youth, high school, college, international, Sixes, and pro rules; then look up any term.",
              ],
            ].map(([number, title, href, description]) => (
              <a className="path-card" href={href} key={href}>
                <span>{number}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
                <i aria-hidden="true">↗</i>
              </a>
            ))}
          </div>
        </RuleSection>
      </>
    ),
  },
  {
    path: "/game-and-field",
    number: "02",
    navLabel: "Game & field",
    eyebrow: "The playing environment",
    title: "The game, the field, and everyone on it",
    summary:
      "What counts as a goal, how the field is organized, where twelve players fit, why restraining lines matter, and what players may do with the ball.",
    sections: gameSections,
    content: (
      <>
        <RuleSection
          id="objective-scoring"
          number="02.1"
          title="Objective & scoring"
        >
          <div className="prose prose-wide">
            <p>
              Each team attacks one goal and defends the other. A legal goal
              scores one point when the entire ball passes completely across the
              goal line, between the posts and under the crossbar, after being
              propelled from the crosse of an attacking player. The team with
              more goals at the end of regulation—or the first goal under an
              applicable sudden-victory overtime procedure—wins.
            </p>
            <p>
              A ball merely touching the line is not in. A shot that enters
              after the period horn does not count. A goal can also be
              disallowed for an attacking foul, an illegal crosse discovered on
              a permitted post-goal inspection, or another violation that
              occurred before the ball entered.
            </p>
          </div>
          <RuleGrid>
            <RuleCard title="Legal goal">
              <p>
                The whole ball crosses the plane legally before time expires.
              </p>
            </RuleCard>
            <RuleCard title="Goalkeeper save">
              <p>
                A ball stopped on or in front of the line remains live if it
                stays in bounds and no whistle sounds.
              </p>
            </RuleCard>
            <RuleCard title="Own goal">
              <p>
                If a defender causes the ball to enter their own goal during
                legal play, the goal is credited to the attacking team.
              </p>
            </RuleCard>
            <RuleCard title="After the goal">
              <p>
                The clock stops, officials confirm the score, and play normally
                returns to a center draw unless a mercy-rule procedure applies.
              </p>
            </RuleCard>
          </RuleGrid>
        </RuleSection>

        <RuleSection id="field-markings" number="02.2" title="Field & markings">
          <div className="field-layout">
            <FieldDiagram />
            <div className="field-key">
              <div>
                <strong>Overall field</strong>
                <p>
                  Regulation fields are 110–140 yards long and 60–70 yards wide;
                  120 × 65 yards is the preferred new-field size.
                </p>
              </div>
              <div>
                <strong>Goal circle</strong>
                <p>
                  A 3-meter-radius protected circle around each 6-by-6-foot
                  goal.
                </p>
              </div>
              <div>
                <strong>8-meter arc</strong>
                <p>
                  Seven hash marks identify free-position locations in front of
                  goal.
                </p>
              </div>
              <div>
                <strong>12-meter fan</strong>
                <p>
                  The outer fan helps define the critical scoring area and
                  restart locations.
                </p>
              </div>
            </div>
          </div>
          <DefinitionList
            items={[
              [
                "Center circle",
                "A 30-foot-radius circle at midfield. Only the two centers may be inside it when the draw is administered.",
              ],
              [
                "Restraining lines",
                "Solid lines 30 yards from each goal line. They limit how many players a team may send into either end.",
              ],
              [
                "Goal line extended",
                "An imaginary line continuing sideways through the goal line; many restart rules distinguish play above and below it.",
              ],
              [
                "Dots",
                "Restart locations behind and to the side of each goal, used for certain boundary, timeout, and goal-circle situations.",
              ],
              [
                "Substitution area",
                "The midfield area in front of the scorer’s table, bounded by marks five yards from the center line.",
              ],
              [
                "Critical scoring area",
                "The safety-sensitive area around goal, extending roughly 12 meters in front and to each side and to the end line.",
              ],
            ]}
          />
        </RuleSection>

        <RuleSection
          id="players-positions"
          number="02.3"
          title="Players & positions"
        >
          <p className="section-intro">
            The rules require the number and legal placement of players, not a
            fixed tactical formation. “Attack,” “midfield,” and “defense”
            describe jobs; players may move and exchange them while staying
            onside.
          </p>
          <div className="position-grid">
            {[
              [
                "Attack",
                "Creates separation, feeds cutters, protects possession, and finishes shots near goal.",
              ],
              [
                "Midfield",
                "Connects both ends, contests draws and ground balls, and drives transition.",
              ],
              [
                "Defense",
                "Marks attackers, communicates slides, protects the middle, and begins clears.",
              ],
              [
                "Goalkeeper",
                "Uses special protective equipment and goal-circle privileges to stop shots and direct the defense.",
              ],
            ].map(([name, description], index) => (
              <article key={name}>
                <PlayerMark index={index} />
                <span>0{index + 1}</span>
                <h3>{name}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <Callout label="Player count" tone="green">
            <p>
              A team may never have more than twelve players on the field. A
              team can have fewer because of substitutions, injuries, or
              time-serving cards. A team serving a card plays short in both ends
              for the full penalty time.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection id="goal-circle" number="02.4" title="The goal circle">
          <div className="prose prose-wide">
            <p>
              The goal circle protects the goalkeeper. An uncarded goalkeeper
              may enter and remain in the circle, use the goalkeeper’s crosse,
              and play the ball under special clearing rules. Field players may
              not enter the circle or step on its line. The line is part of the
              circle.
            </p>
            <p>
              A field player may reach a crosse into the circle to play a loose
              ball if no part of the player’s body or clothing touches the
              ground inside or on the line and the action does not interfere
              with the goalkeeper. A defender may not reach in, pick up the
              ball, and run away with it.
            </p>
          </div>
          <RuleGrid>
            <RuleCard title="Goalkeeper possession">
              <p>
                Once the goalkeeper controls the ball in the circle, they have
                ten seconds to clear it from the circle.
              </p>
            </RuleCard>
            <RuleCard title="Return to the circle">
              <p>
                After carrying the ball outside, the goalkeeper cannot step back
                into the circle while still possessing it.
              </p>
            </RuleCard>
            <RuleCard title="No goalkeeper">
              <p>
                If the goalkeeper leaves the field or is penalized, a properly
                equipped substitute must replace them; field players do not
                inherit goalkeeper privileges.
              </p>
            </RuleCard>
            <RuleCard title="Goal-circle foul">
              <p>
                The restart depends on which team fouled and where the ball was.
                The 2026 rule places the offender four meters away rather than
                directly behind.
              </p>
            </RuleCard>
          </RuleGrid>
        </RuleSection>

        <RuleSection
          id="offside"
          number="02.5"
          title="Restraining lines & offside"
        >
          <div className="prose prose-wide">
            <p>
              Restraining lines stop all twelve players from collapsing around
              one goal. A team must keep at least four players—including the
              goalkeeper when applicable—behind its defensive restraining line
              and at least three players behind its offensive restraining line.
              In practical terms, no more than seven field players may go into
              the attacking end.
            </p>
            <p>
              Offside is a team foul, not automatically a foul on the last
              player to cross. Officials stop time, restore the correct number
              on each side, and administer the free position according to
              whether the violation was offensive or defensive and where the
              ball was.
            </p>
          </div>
          <Callout label="When playing short" tone="orange">
            <p>
              A team serving a card still plays short below the restraining line
              in both its offensive and defensive ends for the entire penalty.
              The team cannot hide the shortage only in midfield.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection
          id="possession"
          number="02.6"
          title="Possession & legal play"
        >
          <RuleGrid>
            <RuleCard title="Carry and cradle">
              <p>
                Run with the ball settled in the pocket. Cradling helps retain
                it, but the crosse cannot be held illegally inside the protected
                sphere or tight against a body.
              </p>
            </RuleCard>
            <RuleCard title="Pass and catch">
              <p>
                The ball may be thrown and caught with the crosse. A pass
                becomes “played” when another player touches it, an opponent
                legally checks the crosse, or a foul stops play.
              </p>
            </RuleCard>
            <RuleCard title="Ground balls">
              <p>
                Players may scoop or direct a loose ball with the crosse. They
                may not cover it with the crosse or body, guard it from play, or
                use dangerous contact to win it.
              </p>
            </RuleCard>
            <RuleCard title="Legal checking">
              <p>
                A controlled crosse-to-crosse attempt may dislodge the ball. It
                must stay away from the head sphere and cannot hit the
                opponent’s body or hands.
              </p>
            </RuleCard>
            <RuleCard title="Kicking">
              <p>
                A player may legally kick a loose ball, but cannot use a hand to
                pick it up or deliberately bat it to gain an unfair advantage.
              </p>
            </RuleCard>
            <RuleCard title="Contact">
              <p>
                Incidental body contact can occur. Body checking, pushing,
                holding, cross-checking, and dangerous stick-to-body contact are
                illegal.
              </p>
            </RuleCard>
          </RuleGrid>
        </RuleSection>
      </>
    ),
  },
  {
    path: "/equipment",
    number: "03",
    navLabel: "Equipment",
    eyebrow: "What must be legal before play",
    title: "Crosses, protection, uniforms, and inspections",
    summary:
      "A practical equipment guide for field players and goalkeepers, including pocket legality, required protection, personal items, and the 2026 inspection windows.",
    sections: equipmentSections,
    content: (
      <>
        <RuleSection id="field-crosse" number="03.1" title="The field crosse">
          <div className="prose prose-wide">
            <p>
              A legal field crosse uses an approved head, legal shaft, and
              pocket that releases the ball freely. Certified heads appear on
              USA Lacrosse’s approved-equipment list. Traditional or mesh
              pockets attach directly to the head and must not create a trap,
              lip, or gap that holds the ball when the crosse turns.
            </p>
          </div>
          <RuleGrid>
            <RuleCard title="Pocket depth">
              <p>
                With a ball in a horizontally held field crosse, the top of the
                ball must remain visible above the entire sidewall.
              </p>
            </RuleCard>
            <RuleCard title="Ball movement">
              <p>
                The ball must roll freely laterally and the full length of the
                pocket and must fall out easily when the head is inverted.
              </p>
            </RuleCard>
            <RuleCard title="Shooting strings">
              <p>
                No more than two. They attach to both sidewalls within the
                permitted upper portion of the head and may not cross each
                other.
              </p>
            </RuleCard>
            <RuleCard title="Loose ends">
              <p>
                Strings or leathers hanging outside the crosse may be no longer
                than two inches.
              </p>
            </RuleCard>
            <RuleCard title="No trapping">
              <p>
                No adhesive, raised thong, wedged ball stop, oversized gap, or
                stringing arrangement may impede free movement.
              </p>
            </RuleCard>
            <RuleCard title="Overall legality">
              <p>
                The head, shaft, end cap, pocket, and strings must remain in
                their approved and safe condition.
              </p>
            </RuleCard>
          </RuleGrid>
        </RuleSection>

        <RuleSection
          id="goalkeeper-crosse"
          number="03.2"
          title="Goalkeeper crosse"
        >
          <div className="prose prose-wide">
            <p>
              A goalkeeper’s crosse has a larger head and deeper pocket to stop
              shots. Its overall length is 35½ to 52 inches, including the end
              cap. The pocket may use six or seven longitudinal thongs with
              cross-lacing or mesh, and its depth is unlimited so long as the
              ball still moves freely throughout the head and pocket.
            </p>
            <p>
              Goalkeeper crosses may use more than two shooting strings. Flat
              laces or nylon cord are permitted, and the field-crosse
              restrictions on shooting-string placement do not apply.
            </p>
          </div>
          <Callout label="Privilege follows the player" tone="green">
            <p>
              Special goal-circle privileges belong to a properly equipped
              goalkeeper, not merely to whoever holds a goalkeeper crosse.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection
          id="protective-equipment"
          number="03.3"
          title="Protective equipment"
        >
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Required</th>
                  <th>Optional / notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Field player</th>
                  <td>
                    ASTM F3077 women’s lacrosse eye protection with SEI
                    certification; professionally manufactured mouthpiece
                    covering the teeth.
                  </td>
                  <td>
                    ASTM F3137 women’s lacrosse headgear and close-fitting
                    gloves may be worn if legal and unmodified.
                  </td>
                </tr>
                <tr>
                  <th>Goalkeeper</th>
                  <td>
                    NOCSAE lacrosse helmet with face mask and secured chinstrap,
                    separate throat protector, padded gloves, mouthpiece, NOCSAE
                    chest protector, pelvic protector, shin padding, and thigh
                    padding.
                  </td>
                  <td>
                    Arm and shoulder padding is recommended. Padding may not
                    dangerously or excessively increase body size.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Callout label="Mouthpiece" tone="orange">
            <p>
              It must include adequate biting-surface and lip protection and
              cover the back teeth. A field player’s mouthpiece may not have a
              protruding tab. Clear or white mouthpieces can be restricted by
              the applicable rulebook because officials must be able to see that
              it is worn.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection
          id="uniform-personal"
          number="03.4"
          title="Uniform & personal items"
        >
          <RuleGrid>
            <RuleCard title="Uniform numbers">
              <p>
                Players must be legally and consistently numbered in the
                official scorebook and on the uniform. Goalkeeper colors must
                distinguish them from both teams.
              </p>
            </RuleCard>
            <RuleCard title="Jewelry">
              <p>
                Jewelry is not worn. A securely taped medical-alert medal may
                remain visible; qualifying religious items may be taped and
                covered under applicable rules.
              </p>
            </RuleCard>
            <RuleCard title="Braces and casts">
              <p>
                Hard, unyielding items on the upper limb require compliant
                closed-cell padding. Unaltered knee and ankle braces do not
                require added padding.
              </p>
            </RuleCard>
            <RuleCard title="Hair items">
              <p>
                Items must not endanger anyone. Barrettes may be legal when
                safe; officials can require dangerous adornments to be removed.
              </p>
            </RuleCard>
            <RuleCard title="Eye shade">
              <p>
                One solid stroke only—no words, numbers, logos, or symbols—and
                it may not extend beyond the eye socket or below the cheekbone.
              </p>
            </RuleCard>
            <RuleCard title="Electronics">
              <p>
                For 2026, an on-field player may not wear audio or video
                equipment. A state-approved medical accommodation is the narrow
                exception.
              </p>
            </RuleCard>
          </RuleGrid>
        </RuleSection>

        <RuleSection
          id="ball-goal-field"
          number="03.5"
          title="Ball, goals & field"
        >
          <DefinitionList
            items={[
              [
                "Ball",
                "High school and older youth use a current NOCSAE-standard lacrosse ball in an approved highly visible color such as yellow, lime green, or bright orange.",
              ],
              [
                "Goal",
                "A regulation goal is six feet wide by six feet high, securely anchored and fitted with a net that prevents the ball from passing through.",
              ],
              [
                "Lines",
                "Contrasting boundary and field markings must be visible and correctly placed; the goal-circle, arc, fan, center circle, and restraining lines control play.",
              ],
              [
                "Table area",
                "The scorer’s table, substitution area, penalty area, team benches, and coaching areas must be arranged so substitutions and penalties can be administered safely.",
              ],
            ]}
          />
        </RuleSection>

        <RuleSection
          id="inspection"
          number="03.6"
          title="Inspection & illegal equipment"
        >
          <div className="prose prose-wide">
            <p>
              Coaches certify before the game that players are legally equipped.
              Officials conduct required checks and may inspect a crosse when a
              legal request is made. If a crosse breaks or its head disconnects,
              it leaves play and is placed at the table; it may be re-inspected
              at a permitted interval before returning.
            </p>
            <p>
              In 2026, a coach may request a crosse inspection during a quarter
              break, halftime, a team timeout, before overtime, before a draw,
              or immediately after a goal in regulation or overtime. A request
              during live play or an unlisted stoppage is improper.
            </p>
          </div>
          <Steps
            items={[
              {
                title: "Official receives the crosse",
                body: "The player does not adjust the pocket or strings before inspection.",
              },
              {
                title: "Pocket and release are tested",
                body: "Depth, free movement, shooting strings, attachments, and overall safety are checked.",
              },
              {
                title: "Result is administered",
                body: "A legal crosse returns. An illegal crosse is removed and the applicable penalty depends on what failed and when it was found.",
              },
              {
                title: "Replacement must also be legal",
                body: "A player cannot return with another uninspected or noncompliant crosse.",
              },
            ]}
          />
        </RuleSection>
      </>
    ),
  },
  {
    path: "/game-procedures",
    number: "04",
    navLabel: "Game procedures",
    eyebrow: "From first horn to final whistle",
    title: "How an actual game starts, moves, stops, and resumes",
    summary:
      "Pregame duties, the clock, draws, live-ball mechanics, boundaries, substitutions, timeouts, and the procedures that keep a game coherent.",
    sections: procedureSections,
    content: (
      <>
        <RuleSection id="before-game" number="04.1" title="Before the game">
          <Steps
            items={[
              {
                title: "Field and goals are checked",
                body: "Officials and game administration confirm safe boundaries, markings, anchored goals, nets, table area, benches, and playing conditions.",
              },
              {
                title: "Rosters and numbers are recorded",
                body: "The scorer receives the official lineups, goalkeeper designation, captains, and correct player numbers before the deadline.",
              },
              {
                title: "Coaches certify equipment",
                body: "Each head coach confirms that players are legally and safely equipped and that team personnel understand sportsmanship expectations.",
              },
              {
                title: "Officials meet coaches and captains",
                body: "The crew identifies ground rules, confirms timing and overtime policy, reviews sportsmanship, and resolves field-specific issues.",
              },
              {
                title: "Teams take the field",
                body: "A legal starting goalkeeper and no more than twelve players per team enter; substitutes remain in the team area.",
              },
            ]}
          />
        </RuleSection>

        <RuleSection id="timing" number="04.2" title="Quarters & clock">
          <div className="prose prose-wide">
            <p>
              The 2026 NFHS high school game uses four 12-minute quarters, two
              two-minute quarter breaks, and a ten-minute halftime. State
              associations may adopt approved modifications for sub-varsity,
              weather, tournaments, or site constraints.
            </p>
            <p>
              The clock stops after every goal. During the last minute of each
              quarter, it also stops for a foul in the critical scoring area.
              When a team leads by ten or more goals, the clock continues to run
              after goals and on those late-quarter critical-area fouls under
              the running-clock rule. It still stops for required events such as
              cards, injuries, official timeouts, and team timeouts.
            </p>
          </div>
          <RuleGrid>
            <RuleCard title="Start the clock">
              <p>
                The timer starts on the official’s whistle for the opening draw,
                quarter draws, and whistle restarts after a stopped clock.
              </p>
            </RuleCard>
            <RuleCard title="Stop the clock">
              <p>
                Goals, cards, injuries, timeouts, and other official signals
                stop it; late-quarter critical-area fouls stop it when the score
                is within ten.
              </p>
            </RuleCard>
            <RuleCard title="Horn">
              <p>
                The horn ends the quarter when time expires. A goal must enter
                before the horn; an applicable free position may require special
                end-of-period administration.
              </p>
            </RuleCard>
          </RuleGrid>
        </RuleSection>

        <RuleSection id="draw" number="04.3" title="The draw">
          <div className="flow-grid">
            {[
              [
                "Set",
                "Centers toe the center line with legal crosse placement; everyone else remains outside the center circle.",
              ],
              [
                "Ready",
                "The official positions the crosses back-to-back with the ball between the upper heads and ensures both players are still.",
              ],
              [
                "Whistle",
                "On the whistle, both centers draw the crosses up and away. Moving early or using an illegal motion is a draw violation.",
              ],
              [
                "Contest",
                "The ball must clear the crosses legally. Players may enter the circle after the whistle and compete for possession.",
              ],
              [
                "Possess",
                "Normal substitution and positioning rules resume once possession, a boundary, a restraining-line crossing, or another whistle releases restrictions.",
              ],
            ].map(([title, body], index) => (
              <article key={title}>
                <span>{index + 1}</span>
                <FlowMark step={index} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <div className="prose prose-wide">
            <p>
              Draws begin the game and each quarter and normally follow every
              goal. Under youth mercy rules, the trailing team may receive
              possession instead. If a legal draw travels directly out of bounds
              untouched, the draw is retaken. If players touch it first, normal
              boundary or alternate-possession rules apply.
            </p>
            <p>
              For 2026, when one center draws illegally,{" "}
              <strong>any player</strong>
              from the nonoffending team may take the free position at the spot
              of the ball. A self-start is allowed unless the game clock is
              stopped. If both draw illegally or the official cannot identify
              the violator, time is called and the draw is retaken at center.
            </p>
          </div>
        </RuleSection>

        <RuleSection id="live-play" number="04.4" title="Live-ball play">
          <Steps
            items={[
              {
                title: "Gain possession",
                body: "Secure a draw, ground ball, pass, save, interception, or awarded restart in the crosse.",
              },
              {
                title: "Clear",
                body: "The defending team moves the ball out of its goal area by carrying or passing while remaining onside.",
              },
              {
                title: "Transition",
                body: "Players advance, retreat, substitute, and exchange marks. There is no NFHS high school shot clock.",
              },
              {
                title: "Settle or attack",
                body: "The offense creates space with cuts, passes, picks, dodges, and legal positioning while the defense marks and slides.",
              },
              {
                title: "Shoot or turn over",
                body: "A shot may score, be saved, miss, go out, or lead to a foul. Possession can also change on a check, interception, boundary, or rule violation.",
              },
            ]}
          />
          <Callout label="Free movement" tone="green">
            <p>
              Players not involved in penalty administration may generally move
              after a whistle. They must stay four meters from a free position,
              two meters from a boundary restart, and obey the draw,
              goal-circle, penalty-lane, penalty-zone, and offside restrictions.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection id="boundaries" number="04.5" title="Out of bounds">
          <div className="prose prose-wide">
            <p>
              For an ordinary boundary ball, the team that last touched the ball
              loses possession. The nearest opponent receives it and re-enters
              near the point where it went out. The player cannot run down the
              sideline to improve the restart and cannot pass while still
              outside the field.
            </p>
            <p>
              A shot is different: when a shot misses and leaves the field,
              possession is awarded to the player who was nearest the ball when
              and where it crossed the boundary, provided that player was not
              responsible for an illegal action. This “backup” rule rewards a
              teammate who follows the shot toward the end line.
            </p>
          </div>
          <RuleGrid>
            <RuleCard title="Immediate return">
              <p>
                The player may collect the ball, step onto the field near the
                exit point, and continue without pausing when the clock and
                restart rules allow.
              </p>
            </RuleCard>
            <RuleCard title="Boundary self-start">
              <p>
                The player may enter, settle within two meters of the boundary,
                pause, and self-start. Other players give at least two meters.
              </p>
            </RuleCard>
            <RuleCard title="Whistle restart">
              <p>
                The player may enter and wait. When the clock is stopped, the
                player must be on the field and wait for the whistle.
              </p>
            </RuleCard>
            <RuleCard title="Goalkeeper exception">
              <p>
                A goalkeeper awarded a boundary ball while inside the goal
                circle does not self-start; play resumes on the whistle.
              </p>
            </RuleCard>
          </RuleGrid>
        </RuleSection>

        <RuleSection id="substitutions" number="04.6" title="Substitutions">
          <div className="prose prose-wide">
            <p>
              Teams may substitute an unlimited number of players during live
              play, after goals, during legal stoppages, and between quarters.
              Live substitutions use the substitution area: the player leaving
              must clear the field before the replacement enters, and neither
              may gain an illegal advantage from the exchange.
            </p>
            <p>
              During a draw, substitutions may occur before the official places
              a hand on the crosses. Once that hand is on the crosses, no player
              may enter until possession is gained, the ball goes out, the ball
              crosses a restraining line, or another whistle stops play. During
              a free-position stoppage, the fouled player and offender generally
              may not substitute until the restart is complete.
            </p>
          </div>
          <Callout label="Too many players" tone="orange">
            <p>
              An entering substitute who creates thirteen players or enters
              early commits illegal substitution. Officials correct the count
              and award the applicable free position or card if the act is
              deliberate or repeated.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection
          id="timeouts-overtime"
          number="04.7"
          title="Timeouts & overtime"
        >
          <RuleGrid>
            <RuleCard title="Team timeout">
              <p>
                Each team has two in regulation. A legal possession timeout
                requires team possession and official recognition; dead-ball
                opportunities also apply.
              </p>
            </RuleCard>
            <RuleCard title="Goalkeeper timeout">
              <p>
                If a possession timeout is granted while the goalkeeper controls
                the ball in the circle, 2026 play resumes at the nearest dot and
                any player may take the restart.
              </p>
            </RuleCard>
            <RuleCard title="Official timeout">
              <p>
                Officials stop time for injury, equipment, cards, field
                problems, weather, table correction, or any situation requiring
                safe administration.
              </p>
            </RuleCard>
            <RuleCard title="Overtime">
              <p>
                NFHS overtime is sudden victory, but state associations control
                whether regular-season games use it and the exact approved
                procedure. Officials confirm the policy before the game.
              </p>
            </RuleCard>
          </RuleGrid>
          <Callout label="Local rule matters" tone="plain">
            <p>
              Tournament, weather, sub-varsity, and state policies may shorten
              breaks, alter overtime, or end a game under a mercy rule. Those
              administrative modifications do not change what is a foul during
              live play.
            </p>
          </Callout>
        </RuleSection>
      </>
    ),
  },
  {
    path: "/fouls-and-advantage",
    number: "05",
    navLabel: "Fouls & advantage",
    eyebrow: "Why the whistle blows",
    title: "Fouls, danger, advantage, and the scoring play",
    summary:
      "The complete mental model for minor and major fouls, shooting space, both three-second rules, the slow whistle, and offensive responsibility.",
    sections: foulSections,
    content: (
      <>
        <RuleSection id="foul-framework" number="05.1" title="How fouls work">
          <div className="prose prose-wide">
            <p>
              Understanding a call requires three questions:{" "}
              <strong>
                What class of foul occurred? Where did it happen? Who had
                possession or advantage?
              </strong>
              Classification determines whether the offender moves away or
              behind. Location determines the restart spot, whether a lane or
              zone clears, and whether a whistle is required. Possession
              determines who receives the ball and whether the official can hold
              the whistle.
            </p>
          </div>
          <div className="foul-framework-grid">
            <article className="minor-panel">
              <span>Minor</span>
              <h3>Procedure, possession, and positioning</h3>
              <p>
                The offender generally moves four meters away. The nonoffending
                team receives a free position. Inside the 12-meter fan, the
                restart uses the nearest point on the fan and may now be taken
                directly to goal under the 2025 change.
              </p>
            </article>
            <article className="major-panel">
              <span>Major</span>
              <h3>Safety, illegal contact, and unfair advantage</h3>
              <p>
                The offender generally moves four meters behind the player
                taking the free position. Special critical-area procedures can
                move the ball to a hash, fan, or dot and require a cleared lane
                or penalty zone.
              </p>
            </article>
            <article className="misconduct-panel">
              <span>Misconduct</span>
              <h3>Behavior outside acceptable play</h3>
              <p>
                Unsportsmanlike conduct, dangerous escalation, abuse, repeated
                violations, or behavior that threatens game control can produce
                cards, suspension, or ejection in addition to the free position.
              </p>
            </article>
          </div>
        </RuleSection>

        <RuleSection id="minor-fouls" number="05.2" title="Minor fouls">
          <DefinitionList
            items={[
              [
                "Covering the ball",
                "Placing the crosse or body over a loose ball so an opponent cannot play it.",
              ],
              [
                "Empty-crosse check",
                "Checking a crosse when the opponent does not possess the ball.",
              ],
              [
                "Illegal cradle",
                "Holding the crosse head inside the protected sphere or close against the player’s or teammate’s body so a legal check is prevented.",
              ],
              [
                "Goal-circle violation",
                "A field player enters or steps on the goal circle, or otherwise violates the protected-circle restrictions.",
              ],
              [
                "Illegal draw",
                "Early movement, illegal crosse position or motion, or another failure in draw procedure.",
              ],
              [
                "Illegal procedure",
                "False start, illegal substitution, extra player, improper restart, delay, or another procedural violation.",
              ],
              [
                "Playing without a crosse",
                "A field player continues to participate after losing or breaking the crosse instead of leaving or retrieving it legally.",
              ],
              [
                "Warding / guarding",
                "Using a free hand, arm, or body action to hold off an opponent or protect the crosse illegally.",
              ],
            ]}
          />
          <Callout label="Minor does not mean optional" tone="plain">
            <p>
              A minor foul can erase possession or a scoring chance. Repeated
              procedural violations can become delay-of-game or misconduct and
              may be carded.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection id="major-fouls" number="05.3" title="Major fouls">
          <DefinitionList
            items={[
              [
                "Blocking",
                "Moving into a ball carrier’s path without enough time or space to stop or change direction, causing contact.",
              ],
              [
                "Charging",
                "The ball carrier pushes, shoulders, or backs into an opponent who established legal position.",
              ],
              [
                "Cross-check",
                "Using the shaft between the hands to hit, push, or displace an opponent.",
              ],
              [
                "Dangerous check",
                "A rough, reckless, intimidating, or uncontrolled check, including one that hits the body or hands or drives the opponent’s own crosse into them.",
              ],
              [
                "Check to head / sphere",
                "Checking through the protected sphere or making crosse contact with the head or neck.",
              ],
              [
                "Illegal stick contact",
                "A horizontal crosse makes contact with an opponent’s body or crosse, or the crosse is used to push or displace.",
              ],
              [
                "Holding",
                "Restraining an opponent or the opponent’s crosse with the body or crosse beyond legal positioning.",
              ],
              [
                "Pushing or tripping",
                "Using the body or crosse to push an opponent or cause an opponent to fall illegally.",
              ],
              [
                "Illegal pick",
                "A pick outside the opponent’s visual field or without time and space, or one using a horizontal crosse or illegal stance when contact occurs.",
              ],
              [
                "Forcing through",
                "A ball carrier forces the crosse through one or more legally positioned defenders’ crosses.",
              ],
              [
                "Dangerous propelling",
                "Sending the ball in a dangerous or uncontrolled manner, including at a player who cannot safely react.",
              ],
              [
                "Dangerous follow-through",
                "A shooter’s crosse follows through into an opponent or the protected sphere in a dangerous manner.",
              ],
            ]}
          />
        </RuleSection>

        <RuleSection
          id="shooting-space"
          number="05.4"
          title="Shooting space / free space to goal"
        >
          <div className="legal-foul">
            <article className="legal-panel">
              <p>Legal defense</p>
              <LaneDiagram legal />
              <ul>
                <li>Defender is marking within a stick’s length.</li>
                <li>Defender approaches on a safe angle.</li>
                <li>
                  Defender is below goal-line extended, where this call does not
                  apply.
                </li>
                <li>
                  The path is not a genuine path to goal or the attacker is not
                  looking to shoot.
                </li>
              </ul>
            </article>
            <article className="foul-panel">
              <p>Shooting-space foul</p>
              <LaneDiagram legal={false} />
              <ul>
                <li>
                  Defender stands in the free space from the ball to the goal
                  circle.
                </li>
                <li>Defender is not legally marking an opponent.</li>
                <li>
                  The ball carrier has the opportunity and intent to shoot.
                </li>
                <li>
                  The position makes the shot dangerous, so high school uses an
                  immediate whistle.
                </li>
              </ul>
            </article>
          </div>
          <div className="prose prose-wide">
            <p>
              The rule protects both shooter and defender. It does not create an
              automatic right to a straight-line drive. A defender may legally
              mark the ball carrier, occupy legal position, or cross the lane
              while actively marking. The call develops when an unmarked
              defender remains in the defined path to goal as the attacker is
              able and looking to shoot.
            </p>
          </div>
        </RuleSection>

        <RuleSection
          id="three-seconds"
          number="05.5"
          title="Three-second rules"
        >
          <div className="two-up">
            <article>
              <span>High school defense</span>
              <h3>Three seconds in the 8-meter arc</h3>
              <p>
                A defender may not remain inside the 8-meter arc for more than
                three seconds unless actively marking an opponent within a
                stick’s length. Moving through is allowed; camping unmarked is
                not. The free position is administered on the 12-meter fan
                nearest the ball at the time of the foul.
              </p>
            </article>
            <article>
              <span>Youth offense</span>
              <h3>Three seconds closely guarded</h3>
              <p>
                At levels without full checking, a ball carrier who holds the
                ball longer than three seconds while closely guarded turns it
                over. The defender must be within a stick’s length, have both
                hands on the crosse, and be in position to check legally if
                checking were allowed. This rule does not apply to high school
                or 14U.
              </p>
            </article>
          </div>
          <Callout label="Memory aid" tone="green">
            <p>
              <strong>In the arc</strong> is a defensive high school foul.{" "}
              <strong>Closely guarded</strong> is an offensive youth foul that
              rewards good defense.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection
          id="slow-whistle"
          number="05.6"
          title="Slow whistle & held whistle"
        >
          <div className="prose prose-wide">
            <p>
              When the attack is on a scoring play inside the critical scoring
              area and the defense commits a foul, the official may raise a flag
              and hold the whistle if the attack keeps a quality opportunity.
              This preserves advantage without erasing the foul. Officials must
              still stop immediately for shooting space and other situations
              where safety requires it.
            </p>
          </div>
          <Steps
            items={[
              {
                title: "Defensive foul occurs",
                body: "The official recognizes the foul and raises the flag while evaluating whether the attack retains a scoring play.",
              },
              {
                title: "Attack continues",
                body: "The ball carrier may pass, dodge, or shoot. A second defensive foul can be recorded and administered too.",
              },
              {
                title: "Scoring play ends",
                body: "The slow whistle ends on a shot, loss of possession, the attack carrying or passing behind goal and ending its forward attempt, loss of forward momentum, or an attacking foul.",
              },
              {
                title: "Goal or free position",
                body: "A legal goal may stand with any card still administered. If no goal results, the official awards the appropriate free position for the recorded foul.",
              },
            ]}
          />
          <Callout label="Held whistle outside the CSA" tone="plain">
            <p>
              Officials may also refrain from stopping immediately when a fouled
              player maintains quality possession and an instant whistle would
              disadvantage the nonoffending team. The exact slow-whistle
              scoring-play procedure is specific to the critical scoring area.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection id="offensive-fouls" number="05.7" title="Offensive fouls">
          <RuleGrid>
            <RuleCard title="Charging">
              <p>
                A defender can be moving and still have legal position. The ball
                carrier cannot lower a shoulder, back through, or push into that
                established position.
              </p>
            </RuleCard>
            <RuleCard title="Forcing through">
              <p>
                The attacker cannot drive the crosse through legally positioned
                defenders’ crosses and ask the official to penalize the
                resulting contact.
              </p>
            </RuleCard>
            <RuleCard title="Illegal pick">
              <p>
                The picker must be visible, allow time and space, keep the body
                in a vertical plane with a shoulder-width stance, and hold the
                crosse vertically between 10 and 2.
              </p>
            </RuleCard>
            <RuleCard title="Dangerous shot or follow-through">
              <p>
                The shooter remains responsible for a dangerous release or
                crosse path even when aiming at goal.
              </p>
            </RuleCard>
            <RuleCard title="Off-ball foul">
              <p>
                Attackers cannot hold, push, block, or use an illegal pick away
                from the ball to manufacture a lane.
              </p>
            </RuleCard>
            <RuleCard title="Attack ends advantage">
              <p>
                An attacking foul during a slow whistle ends the scoring play
                and can offset the earlier defensive foul.
              </p>
            </RuleCard>
          </RuleGrid>
          <Callout label="2026 point of emphasis" tone="orange">
            <p>
              Officials are directed to identify fouls by both teams during
              scoring plays. Legal defenders should not be penalized simply
              because an attacker initiates contact.
            </p>
          </Callout>
        </RuleSection>
      </>
    ),
  },
  {
    path: "/restarts-and-penalties",
    number: "06",
    navLabel: "Restarts & penalties",
    eyebrow: "What happens after the call",
    title: "Free positions, self-starts, 8-meters, and cards",
    summary:
      "A location-by-location guide to putting the ball back in play, plus the card system, delay-of-game progression, offside correction, and team penalties.",
    sections: penaltySections,
    content: (
      <>
        <RuleSection id="restart-basics" number="06.1" title="Restart basics">
          <Steps
            items={[
              {
                title: "Who gets the ball?",
                body: "Usually the player who was fouled or the nearest appropriate teammate. Draw, offside, alternate-possession, and 2026 goal-circle situations have special rules.",
              },
              {
                title: "Where is the restart?",
                body: "The spot of the foul, spot of the ball, nearest point on the 12-meter fan, 8-meter hash, closest dot, or another prescribed safe location.",
              },
              {
                title: "Where does the offender go?",
                body: "Four meters away for a minor foul; generally four meters behind for a major foul. Goal-circle rules now use four meters away.",
              },
              {
                title: "Self-start or whistle?",
                body: "A legal outside-CSA free position may self-start while the clock runs. Critical-area, stopped-clock, card, offside, alternate-possession, and other specified restarts wait for a whistle.",
              },
            ]}
          />
          <Callout label="Four meters" tone="green">
            <p>
              Other players also clear four meters from the free position.
              Failure to move promptly is delay of game; the player with the
              ball does not always have to wait for everyone to finish moving
              before a legal self-start.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection id="self-start" number="06.2" title="Self-start">
          <div className="prose prose-wide">
            <p>
              Outside the critical scoring area, the player awarded the free
              position may come to a settled stance and resume without waiting
              for another whistle. Both feet are stationary on the ground, the
              ball is in the crosse, and the player makes at least a momentary
              pause. Play begins when the player steps or passes; rocking the
              body or moving only the crosse does not begin play.
            </p>
          </div>
          <div className="two-up">
            <article>
              <span>Self-start is available</span>
              <h3>Running clock, legal spot</h3>
              <ul>
                <li>Most fouls outside the critical scoring area.</li>
                <li>Illegal draw when the clock is running.</li>
                <li>Boundary restarts, including within the CSA.</li>
                <li>
                  The ball is at the foul or within the allowed playing
                  distance.
                </li>
              </ul>
            </article>
            <article>
              <span>Wait for a whistle</span>
              <h3>Administration controls</h3>
              <ul>
                <li>The game clock is stopped.</li>
                <li>Foul inside the critical scoring area.</li>
                <li>8-meter free position or card administration.</li>
                <li>
                  Offside, alternate possession, inadvertent whistle, overtime
                  setup, or after a goal.
                </li>
              </ul>
            </article>
          </div>
          <Callout label="Bad location" tone="orange">
            <p>
              If a player self-starts beyond the permitted distance, officials
              reset rather than automatically turn over the ball. Repeated
              improper self-starts can become delay of game.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection
          id="penalty-geography"
          number="06.3"
          title="Where restarts happen"
        >
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Minor defensive foul</th>
                  <th>Major defensive foul</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Outside critical scoring area</th>
                  <td>
                    Free position near the foul; offender four meters away;
                    self-start usually available.
                  </td>
                  <td>
                    Free position near the foul; offender four meters behind;
                    self-start usually available.
                  </td>
                </tr>
                <tr>
                  <th>Between 8-meter arc and 12-meter fan</th>
                  <td>
                    Ball moves to nearest point on 12-meter fan; offender away;
                    penalty lane clears; whistle.
                  </td>
                  <td>
                    Ball moves to nearest point on 12-meter fan; offender
                    behind; penalty lane clears; whistle.
                  </td>
                </tr>
                <tr>
                  <th>Inside 8-meter arc, above goal-line extended</th>
                  <td>
                    Nearest 12-meter fan location; offender away; lane clears;
                    whistle.
                  </td>
                  <td>
                    Nearest 8-meter hash relative to foul; offender behind;
                    entire penalty zone clears; whistle.
                  </td>
                </tr>
                <tr>
                  <th>Below goal-line extended</th>
                  <td>Closest dot; offender away; whistle.</td>
                  <td>
                    Closest dot; offender behind; whistle; the full penalty zone
                    does not clear.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Callout label="Offensive foul" tone="plain">
            <p>
              The defense receives the ball and may self-start when the clock
              and location permit. If the clock is stopped, a card is issued, or
              late-quarter stopped-clock rules apply, the restart waits for a
              whistle.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection
          id="eight-meter"
          number="06.4"
          title="8-meter free position"
        >
          <div className="free-layout">
            <FreePositionDiagram />
            <ol className="restart-list">
              <li>
                <span>01</span>
                <div>
                  <strong>Ball to the hash</strong>
                  <p>
                    The fouled attacker takes the hash nearest the location of a
                    major defensive foul inside the arc and above goal-line
                    extended.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Offender behind</strong>
                  <p>
                    The player who committed the major foul moves four meters
                    behind the free-position player.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Penalty zone clears</strong>
                  <p>
                    Players leave the entire zone from the arc back to the dots.
                    A defender may occupy each adjacent hash when entitled by
                    original position.
                  </p>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <strong>Whistle starts play</strong>
                  <p>
                    The attacker may shoot, pass, or carry. No self-start is
                    allowed on an attacking 8-meter free position.
                  </p>
                </div>
              </li>
            </ol>
          </div>
          <div className="prose prose-wide">
            <p>
              A free position is not a penalty shot with everyone frozen until
              release. On the whistle, all legal players may move. The attacker
              must still make a legal play, and defenders may close from legal
              positions.
            </p>
          </div>
        </RuleSection>

        <RuleSection
          id="goal-circle-restarts"
          number="06.5"
          title="Goal-circle restarts"
        >
          <RuleGrid>
            <RuleCard title="Defender reaches in">
              <p>
                A defender reaches into the circle and picks up the ball:
                defensive goal-circle foul. The attack receives a free position
                at the closest dot; offender moves four meters away.
              </p>
            </RuleCard>
            <RuleCard title="Attacker steps on line">
              <p>
                An attacker steps on the goal-circle line: attacking goal-circle
                foul. The goalkeeper receives the ball in the circle; attacker
                moves four meters away.
              </p>
            </RuleCard>
            <RuleCard title="Timeout with goalie possession">
              <p>
                If the goalkeeper has possession in the circle when the team
                calls a timeout, play resumes at the closest dot and any player
                may restart.
              </p>
            </RuleCard>
            <RuleCard title="Boundary to goalie">
              <p>
                A goalkeeper awarded a ball while in the circle waits for the
                whistle rather than taking a self-start.
              </p>
            </RuleCard>
          </RuleGrid>
          <Callout label="What changed" tone="green">
            <p>
              For 2026, the offender on a goal-circle foul moves four meters{" "}
              <strong>away</strong> from the free position, not four meters
              directly behind it.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection id="cards" number="06.6" title="Green, yellow & red">
          <div className="card-grid">
            <article>
              <i className="green-card" />
              <span>Team caution</span>
              <h3>Green</h3>
              <p>
                A recorded warning for delay of game. It puts the team on
                notice; the next qualifying team delay is administered as the
                prescribed green/yellow consequence to the offender.
              </p>
            </article>
            <article>
              <i className="yellow-card" />
              <span>Two-minute penalty</span>
              <h3>Yellow</h3>
              <p>
                The player serves two minutes, non-releasable, and the team
                plays short. A second yellow to the same person suspends that
                person for the rest of the game.
              </p>
            </article>
            <article>
              <i className="red-card" />
              <span>Ejection</span>
              <h3>Red</h3>
              <p>
                The person is ejected, the team serves a four-minute
                non-releasable penalty, and the ejected person is ineligible for
                the team’s next game under the governing rules.
              </p>
            </article>
          </div>
          <div className="prose prose-wide">
            <p>
              A card can accompany a free position; scoring does not erase the
              card. If one player receives an additional card during the same
              stoppage, the head coach removes another player. If a coach
              receives two cards in the same stoppage, the head coach designates
              two players to leave.
            </p>
          </div>
        </RuleSection>

        <RuleSection
          id="team-penalties"
          number="06.7"
          title="Delay, offside & team fouls"
        >
          <RuleGrid>
            <RuleCard title="Delay of game">
              <p>
                Common examples: refusing to move four meters, running downfield
                after fouling instead of clearing, slow penalty-zone clearing,
                repeated bad self-starts, or returning late after a timeout or
                quarter.
              </p>
            </RuleCard>
            <RuleCard title="Offside correction">
              <p>
                Officials stop time, move the nearest appropriate player back
                onside, place the closest player to the ball behind when
                required, and restart on the whistle from the prescribed spot.
              </p>
            </RuleCard>
            <RuleCard title="Fourth card and beyond">
              <p>
                At high school and youth levels, the fourth and each subsequent
                card creates an additional team consequence: the team plays an
                extra player short for the remainder of the game.
              </p>
            </RuleCard>
            <RuleCard title="Suspension and ejection">
              <p>
                A suspended or ejected player cannot be replaced to restore full
                strength during the penalty. The team must preserve legal
                offside numbers while short.
              </p>
            </RuleCard>
          </RuleGrid>
        </RuleSection>
      </>
    ),
  },
  {
    path: "/officials-and-signals",
    number: "07",
    navLabel: "Officials & signals",
    eyebrow: "How the game is administered",
    title: "Officials, the table, signals, and practical rulings",
    summary:
      "Who watches what, how flags and whistles communicate advantage, what the scorer and timer track, and how common situations are resolved.",
    sections: officialSections,
    content: (
      <>
        <RuleSection id="crew" number="07.1" title="The officiating crew">
          <div className="prose prose-wide">
            <p>
              Girls’ lacrosse commonly uses a two- or three-person crew.
              Officials divide the field into lead, trail, and supporting
              responsibilities, but every official can call a foul. The crew
              watches the ball, the shooter, off-ball matchups, boundaries,
              substitutions, restraining lines, the goal circle, and the clock
              together.
            </p>
            <p>
              The officials’ judgment controls facts such as possession,
              advantage, danger, and who was nearest a shot at the boundary. A
              coach may ask an appropriate rules question through the permitted
              process, but cannot use a discussion to dispute every judgment
              call or delay the game.
            </p>
          </div>
          <RuleGrid>
            <RuleCard title="Lead">
              <p>
                Works toward and around the goal, watches the goal line and
                circle, shooter, scoring play, and critical-area positioning.
              </p>
            </RuleCard>
            <RuleCard title="Trail">
              <p>
                Supports play from behind, watches off-ball action,
                substitutions, restraining lines, and the next transition.
              </p>
            </RuleCard>
            <RuleCard title="Third official">
              <p>
                Adds angles and coverage, particularly around the critical
                scoring area, transition, off-ball fouls, and benches.
              </p>
            </RuleCard>
          </RuleGrid>
        </RuleSection>

        <RuleSection
          id="signals"
          number="07.2"
          title="Whistles, flags & signals"
        >
          <DefinitionList
            items={[
              [
                "Whistle + direction",
                "Play is stopped and the official points the direction of the awarded possession or restart.",
              ],
              [
                "Raised flag",
                "A defensive foul has been recognized during an attacking scoring play; the whistle is held while advantage continues.",
              ],
              [
                "Crossed arms / time signal",
                "The clock stops for timeout, card, injury, administration, or another required event.",
              ],
              [
                "Goal signal",
                "The official confirms that the whole ball legally crossed the line and reports the scorer to the table.",
              ],
              [
                "No-goal signal",
                "The ball entered but a condition prevents the score—time expired, a foul occurred, or the shot was otherwise illegal.",
              ],
              [
                "Card displayed",
                "The official identifies the color, offender, foul, penalty time, and required player removal to the table and teams.",
              ],
              [
                "Possession / boundary direction",
                "The official points toward the goal the awarded team attacks.",
              ],
              [
                "Counting signal",
                "A visible count can track goalkeeper clearing time or another timed obligation.",
              ],
            ]}
          />
          <Callout label="Watch the second signal" tone="green">
            <p>
              The first whistle says play stopped. The direction, foul signal,
              placement, and card tell you why and what happens next.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection id="table" number="07.3" title="Scorer & timer">
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Primary responsibilities</th>
                  <th>Communicates</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Official scorer</th>
                  <td>
                    Rosters and numbers, goals, cards, suspensions/ejections,
                    timeouts, score, and alternate possession.
                  </td>
                  <td>
                    Alerts officials to discrepancies, ineligible or extra
                    players, card totals, and requested information.
                  </td>
                </tr>
                <tr>
                  <th>Official timer</th>
                  <td>
                    Game clock, quarter breaks, halftime, timeouts, card penalty
                    time, and required horns.
                  </td>
                  <td>
                    Starts and stops only on official signals and warns the crew
                    of timing problems.
                  </td>
                </tr>
                <tr>
                  <th>Spotter / table support</th>
                  <td>
                    Assists with player identification, penalty release,
                    substitutions, and bench-area order where provided.
                  </td>
                  <td>
                    Routes information through the official scorer rather than
                    interrupting live play.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Callout label="The clock is not self-correcting" tone="orange">
            <p>
              If the timer starts late or fails to stop, officials determine the
              correction when reliable information exists. Coaches and
              spectators do not independently change the displayed time.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection
          id="responsibilities"
          number="07.4"
          title="Who is responsible for what"
        >
          <RuleGrid>
            <RuleCard title="Players">
              <p>
                Play legally and with sportsmanship; wear compliant equipment;
                disclose equipment problems; obey whistle, placement, card, and
                substitution instructions.
              </p>
            </RuleCard>
            <RuleCard title="Coaches">
              <p>
                Teach safe legal play, certify equipment and roster accuracy,
                manage the bench, model sportsmanship, and use proper channels
                for rules questions.
              </p>
            </RuleCard>
            <RuleCard title="Officials">
              <p>
                Apply rules consistently, recognize advantage without
                sacrificing safety, manage pace, communicate decisions, and
                correct administrative errors.
              </p>
            </RuleCard>
            <RuleCard title="Game administration">
              <p>
                Provide a safe field, goals, table staff, clock, emergency
                procedures, weather policy, and site management.
              </p>
            </RuleCard>
            <RuleCard title="Spectators">
              <p>
                Support participants without abusing officials, players, or
                coaches. Discriminatory, threatening, or harassing behavior has
                no place at the game.
              </p>
            </RuleCard>
          </RuleGrid>
        </RuleSection>

        <RuleSection id="scenarios" number="07.5" title="Common game scenarios">
          <div className="scenario-list">
            {[
              [
                "A defender stands in the lane but is within a stick’s length and actively guarding the ball carrier.",
                "Legal marking, not automatically shooting space. The official still judges dangerous action or illegal contact.",
              ],
              [
                "A defender swings for the crosse and hits the ball carrier’s bottom hand.",
                "Major foul for a rough or dangerous check. Hands are part of the opponent’s body, not part of the crosse.",
              ],
              [
                "The attacker runs into a defender who established legal position.",
                "Potential charging foul on the attacker. Legal defenders are not required to disappear from the path.",
              ],
              [
                "A legal draw goes directly over the sideline without touching anyone.",
                "Retake the draw. If a player touched it first, use normal boundary or alternate-possession rules.",
              ],
              [
                "The goalkeeper saves the ball in the circle and the team calls timeout.",
                "Grant the legal timeout; in 2026 restart at the nearest dot, where any player may take it.",
              ],
              [
                "A player awarded an outside-CSA foul pauses, then steps before the offender reaches four meters.",
                "Legal self-start. The offender may engage after play starts; failing to attempt to clear can still be delay.",
              ],
              [
                "A shot misses and exits the end line while an attacker legally backs it up closest to the ball.",
                "Attack retains possession on the boundary restart.",
              ],
              [
                "The attack scores during a slow whistle for a cardable defensive foul.",
                "The legal goal can count. The official still administers the card and its time-serving consequence.",
              ],
              [
                "A defender remains inside the 8-meter arc unmarked for more than three seconds.",
                "Major defensive three-second foul; administer on the 12-meter fan nearest the ball.",
              ],
              [
                "An attacker steps on the goal-circle line while carrying behind goal.",
                "Attacking goal-circle violation. Award the goalkeeper the ball in the circle and move the offender four meters away.",
              ],
            ].map(([question, answer], index) => (
              <article key={question}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{question}</h3>
                <p>{answer}</p>
              </article>
            ))}
          </div>
        </RuleSection>
      </>
    ),
  },
  {
    path: "/levels-and-glossary",
    number: "08",
    navLabel: "Levels & glossary",
    eyebrow: "Know which game you are watching",
    title: "Rules by level, common misreads, and the complete vocabulary",
    summary:
      "A compact comparison of youth, high school, college, international, Sixes, and professional play, followed by the terms used throughout the guide.",
    sections: referenceSections,
    content: (
      <>
        <RuleSection id="level-comparison" number="08.1" title="Rules by level">
          <div className="comparison-table-wrap wide-table">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Format</th>
                  <th>Timing</th>
                  <th>Key differences</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>USA Lacrosse youth</th>
                  <td>Small-sided through 10U; 12v12 at 12U/14U</td>
                  <td>
                    10-minute quarters at 12U; 12-minute running-clock quarters
                    at 14U
                  </td>
                  <td>
                    No, modified, or transitional checking by age; youth mercy
                    rule; developmental equipment and field options.
                  </td>
                </tr>
                <tr>
                  <th>NFHS high school</th>
                  <td>12v12 full field</td>
                  <td>12-minute quarters</td>
                  <td>
                    No shot clock; full checking outside the sphere; immediate
                    whistle for shooting space; 2-minute yellow and 4-minute
                    red.
                  </td>
                </tr>
                <tr>
                  <th>NCAA / WCLA</th>
                  <td>12v12 full field</td>
                  <td>15-minute quarters; 90/60-second shot-clock framework</td>
                  <td>
                    More legal stick contact, different goal-circle permissions,
                    slow-whistle shooting-space administration, and different
                    card release rules.
                  </td>
                </tr>
                <tr>
                  <th>World Lacrosse field</th>
                  <td>10v10 full field</td>
                  <td>15-minute quarters</td>
                  <td>
                    International positioning, contact, card, and restart
                    procedures; do not apply NFHS assumptions automatically.
                  </td>
                </tr>
                <tr>
                  <th>Sixes</th>
                  <td>6v6 compact field</td>
                  <td>8-minute quarters; 30-second shot clock</td>
                  <td>
                    No center draw after goals, all whistle restarts, no
                    shooting-space foul, and faster card penalties.
                  </td>
                </tr>
                <tr>
                  <th>Professional</th>
                  <td>League-specific full field</td>
                  <td>Typically 12-minute quarters with league shot clocks</td>
                  <td>
                    Contact, penalty, field, scoring, and possession rules are
                    designed by the league and may change by season.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </RuleSection>

        <RuleSection id="youth-pathway" number="08.2" title="Youth progression">
          <div className="progression-grid">
            <article>
              <span>6U / 8U</span>
              <h3>Learn to move and share</h3>
              <p>
                Small-sided, no checking, simplified starts, soft-ball options,
                short running-clock quarters, and no card-based short-handed
                play.
              </p>
            </article>
            <article>
              <span>10U</span>
              <h3>Add structure</h3>
              <p>
                Up to 8v8, goalkeeper optional, no checking, modified pocket
                options, limited offside structure, and closely-guarded three
                seconds.
              </p>
            </article>
            <article>
              <span>12U</span>
              <h3>Full field, modified check</h3>
              <p>
                12v12, ten-minute running-clock quarters, modified checking
                below the shoulder and away from the body, and NFHS field
                structure.
              </p>
            </article>
            <article>
              <span>14U</span>
              <h3>Transition to high school</h3>
              <p>
                12v12, twelve-minute running-clock quarters, transitional
                checking outside a 12-inch sphere, and a deputy goalkeeper
                option unique to 14U.
              </p>
            </article>
          </div>
          <Callout label="Checking progression" tone="green">
            <p>
              <strong>
                No checking → modified checking → transitional checking → high
                school checking.
              </strong>{" "}
              The progression changes what defenders may do; it never permits
              dangerous, uncontrolled, or stick-to-body contact.
            </p>
          </Callout>
        </RuleSection>

        <RuleSection id="common-misreads" number="08.3" title="Common misreads">
          <DefinitionList
            items={[
              [
                "“Any defender in the lane is shooting space.”",
                "False. A legally marking defender may occupy the path. The call needs an unmarked defender in the free space to goal while the attacker is able and looking to shoot.",
              ],
              [
                "“Women’s lacrosse has no contact.”",
                "False. Incidental contact and legal positioning occur. Body checking, cross-checking, pushing, and dangerous crosse contact are illegal.",
              ],
              [
                "“The whistle freezes everyone.”",
                "Usually false. Free movement lets uninvolved players reposition while respecting required distances and special areas.",
              ],
              [
                "“The nearest player always wins an out-of-bounds ball.”",
                "Only a shot uses nearest-player backup. An ordinary boundary ball goes against the team that touched it last.",
              ],
              [
                "“A flag means the foul was ignored.”",
                "False. The official is preserving attacking advantage and will administer the foul when the scoring play ends.",
              ],
              [
                "“Three seconds means the defender must leave the 8.”",
                "The defender may remain while actively marking within a stick’s length. The foul is being unmarked in the arc too long.",
              ],
              [
                "“A second yellow is a red.”",
                "The second yellow suspends that person for the rest of the game. A red is a separate ejection with next-game consequences.",
              ],
              [
                "“College rules explain high school.”",
                "Not reliably. Shot clocks, contact, goal-circle play, shooting-space administration, cards, and timing differ.",
              ],
            ]}
          />
        </RuleSection>

        <RuleSection id="glossary" number="08.4" title="Glossary">
          <DefinitionList
            items={[
              [
                "Alternate possession",
                "A recorded alternating award used when the rules cannot otherwise determine possession.",
              ],
              [
                "Checking",
                "A controlled crosse-to-crosse attempt to dislodge the ball.",
              ],
              [
                "Clear",
                "An action by a goalkeeper or defending team to move the ball out of the goal area and into transition.",
              ],
              [
                "Clear space",
                "Open space between players, free of crosses and body parts.",
              ],
              [
                "Critical scoring area",
                "The safety-sensitive region around goal where special foul, slow-whistle, and restart rules apply.",
              ],
              ["Crosse", "The lacrosse stick: shaft, head, and pocket."],
              [
                "Draw",
                "The center procedure that begins games, quarters, and most play after goals.",
              ],
              [
                "Free position",
                "Possession and location awarded after a foul; the player may run, pass, or shoot unless a specific rule limits the restart.",
              ],
              [
                "Free space to goal",
                "The path from a ball carrier who is able and looking to shoot to the outside edges of the goal circle.",
              ],
              [
                "Goal circle",
                "The protected circle around the goal, commonly called the crease in other versions of lacrosse.",
              ],
              [
                "Green card",
                "A recorded team caution for delay-of-game behavior.",
              ],
              [
                "Held whistle",
                "An official delays stopping play because the fouled team maintains quality possession and an immediate whistle would disadvantage it.",
              ],
              ["Marking", "Guarding an opponent within a stick’s length."],
              [
                "Offside",
                "A team has more players across a restraining line than the rules allow.",
              ],
              [
                "Penalty lane",
                "A cleared path as wide as the goal circle for specified free positions in front of goal.",
              ],
              [
                "Penalty zone",
                "The entire area from the 8-meter arc back to the dots that clears for an 8-meter free position above goal-line extended.",
              ],
              [
                "Pick",
                "Legal off-ball positioning that forces a defender to take another route while allowing time, space, and visual awareness.",
              ],
              [
                "Played",
                "The ball leaves the crosse and another player touches it, the crosse is legally checked, or play stops for an opponent’s foul.",
              ],
              [
                "Playing distance",
                "Approximately a stick and a half; used to judge nearby restart and ball locations.",
              ],
              [
                "Possession",
                "The ball is controlled in a crosse so the player can perform normal carrying, cradling, passing, or shooting actions.",
              ],
              [
                "Scoring play",
                "A continuous attacking effort toward goal that ends on a shot, loss of possession, loss of forward momentum, termination of the attempt, or attacking foul.",
              ],
              [
                "Self-start",
                "A legal restart from a settled stance without waiting for a second whistle.",
              ],
              [
                "Slow whistle",
                "A raised-flag advantage procedure for a defensive foul during an attacking scoring play in the critical scoring area.",
              ],
              [
                "Sphere",
                "The protected area surrounding a player’s head; seven inches in the high school checking and illegal-cradle framework.",
              ],
              [
                "Substitution area",
                "The marked midfield zone in front of the scorer’s table used for live substitutions.",
              ],
              [
                "Suspended player",
                "A person who receives two yellow cards and cannot participate for the rest of that game.",
              ],
              [
                "Transitional checking",
                "14U checking outside a 12-inch sphere and away from the body, with extra restrictions when checking from behind.",
              ],
              [
                "Yellow card",
                "A two-minute non-releasable personal penalty at the high school level.",
              ],
            ]}
          />
        </RuleSection>

        <RuleSection id="sources" number="08.5" title="Primary sources">
          <div className="source-list">
            <a
              href="https://www.usalacrosse.com/girls-and-womens-rules"
              target="_blank"
              rel="noreferrer"
            >
              <span>USA Lacrosse</span>
              <strong>Girls’ and Women’s Rules resource index</strong>
              <i>↗</i>
            </a>
            <a
              href="https://www.usalacrosse.com/sites/default/files/documents/Rules/2026-Girls-HS-Rules-Interp.pdf"
              target="_blank"
              rel="noreferrer"
            >
              <span>2026 PDF</span>
              <strong>Girls’ High School Rules Interpretation</strong>
              <i>↗</i>
            </a>
            <a
              href="https://www.usalacrosse.com/sites/default/files/documents/Rules/2026-Girls-Youth-Rule-Book2.pdf"
              target="_blank"
              rel="noreferrer"
            >
              <span>2026 PDF</span>
              <strong>Girls Youth Rule Book</strong>
              <i>↗</i>
            </a>
            <a
              href="https://www.usalacrosse.com/sites/default/files/documents/Rules/Womens-Rule-Comparisons-2026.pdf"
              target="_blank"
              rel="noreferrer"
            >
              <span>2026 PDF</span>
              <strong>Women’s Rules Comparisons</strong>
              <i>↗</i>
            </a>
            <a
              href="https://nfhs.org/sports/lacrosse-girls/rules"
              target="_blank"
              rel="noreferrer"
            >
              <span>NFHS</span>
              <strong>Girls Lacrosse Rules and interpretations</strong>
              <i>↗</i>
            </a>
            <a
              href="https://www.usalacrosse.com/field-diagrams"
              target="_blank"
              rel="noreferrer"
            >
              <span>USA Lacrosse</span>
              <strong>Official field diagrams</strong>
              <i>↗</i>
            </a>
          </div>
          <Callout label="Rule question" tone="dark">
            <p>
              For a binding interpretation, use the current NFHS book, the
              applicable state association, the officials assigned to the game,
              or USA Lacrosse’s rules interpretation channel at{" "}
              <strong>girlsrules@usalacrosse.com</strong>.
            </p>
          </Callout>
        </RuleSection>
      </>
    ),
  },
];
