export function HeroIllustration() {
  return (
    <div
      className="hero-visual"
      aria-label="Abstract lacrosse field illustration"
    >
      <div className="hero-field">
        <i />
        <i />
        <i />
        <span>8M</span>
        <b>12M</b>
      </div>
      <div className="ball-mark" />
    </div>
  );
}

export function FieldDiagram() {
  return (
    <svg
      className="field-diagram"
      viewBox="0 0 760 430"
      role="img"
      aria-labelledby="field-title field-desc"
    >
      <title id="field-title">Women’s lacrosse field</title>
      <desc id="field-desc">
        Diagram showing goals, goal circles, 8-meter arcs, 12-meter fans,
        restraining lines, and center circle.
      </desc>
      <rect x="16" y="16" width="728" height="398" rx="2" />
      <line x1="380" y1="16" x2="380" y2="414" />
      <circle cx="380" cy="215" r="52" />
      <circle cx="120" cy="215" r="30" />
      <circle cx="640" cy="215" r="30" />
      <path d="M68 118 Q214 215 68 312" />
      <path d="M692 118 Q546 215 692 312" />
      <path className="fan" d="M34 82 Q268 215 34 348" />
      <path className="fan" d="M726 82 Q492 215 726 348" />
      <line className="dash" x1="248" y1="16" x2="248" y2="414" />
      <line className="dash" x1="512" y1="16" x2="512" y2="414" />
      <rect x="107" y="199" width="8" height="32" />
      <rect x="645" y="199" width="8" height="32" />
      <text x="380" y="221">
        CENTER
      </text>
      <text x="103" y="260">
        GOAL
      </text>
      <text x="623" y="260">
        GOAL
      </text>
      <text x="74" y="110">
        8M ARC
      </text>
      <text x="619" y="110">
        8M ARC
      </text>
    </svg>
  );
}

export function PlayerMark({ index }: Readonly<{ index: number }>) {
  return (
    <svg className="player-mark" viewBox="0 0 120 140" aria-hidden="true">
      <circle cx={42 + index * 9} cy="28" r="14" />
      <path
        d={`M${42 + index * 9} 44 L${36 + index * 5} 92 L${18 + index * 5} 132 M${36 + index * 5} 92 L${66 + index * 5} 130 M${39 + index * 8} 59 L${12 + index * 7} 85 M${40 + index * 8} 60 L${82 + index * 5} 77`}
      />
      <path
        className="stick"
        d="M76 72 L112 36 M103 31 Q118 29 114 42 Q107 47 99 39"
      />
    </svg>
  );
}

export function FlowMark({ step }: Readonly<{ step: number }>) {
  return (
    <svg className="flow-mark" viewBox="0 0 110 110" aria-hidden="true">
      <circle cx="55" cy="55" r="42" />
      <circle className="dot" cx={28 + step * 12} cy={60 - step * 7} r="5" />
      <circle cx={76 - step * 5} cy={38 + step * 8} r="5" />
      <path
        className="arrow"
        d={`M${30 + step * 7} ${72 - step * 4} Q55 ${30 + step * 5} ${78 - step * 4} ${53 + step * 2}`}
      />
    </svg>
  );
}

export function WhistleIcon() {
  return (
    <svg viewBox="0 0 54 40" aria-hidden="true">
      <path d="M4 14h18l9-7h18v16H31l-9-5H4z" />
      <circle cx="14" cy="27" r="9" />
    </svg>
  );
}

export function LaneDiagram({ legal }: Readonly<{ legal: boolean }>) {
  return (
    <svg className="lane-diagram" viewBox="0 0 420 250" aria-hidden="true">
      <path d="M140 42 Q210 4 280 42" />
      <rect x="178" y="20" width="64" height="34" />
      <circle cx="210" cy="92" r="22" />
      <circle className="attacker" cx="75" cy="205" r="10" />
      <circle
        className={legal ? "defender legal" : "defender illegal"}
        cx={legal ? 112 : 172}
        cy={legal ? 150 : 134}
        r="10"
      />
      <path className="shot-line" d="M82 198 L198 104" />
      <path className="lane" d="M88 209 L210 108 L331 209" />
    </svg>
  );
}

export function FreePositionDiagram() {
  return (
    <svg
      className="free-diagram"
      viewBox="0 0 520 420"
      role="img"
      aria-label="Eight-meter free-position setup"
    >
      <path className="fan" d="M32 122 Q260 390 488 122" />
      <path d="M112 122 Q260 280 408 122" />
      <rect x="220" y="52" width="80" height="54" />
      <circle cx="260" cy="140" r="28" />
      <g className="hashes">
        {[0, 1, 2, 3, 4, 5, 6].map((index) => (
          <line
            key={index}
            x1={78 + index * 61}
            y1={188 + Math.abs(3 - index) * 34}
            x2={64 + index * 65}
            y2={207 + Math.abs(3 - index) * 38}
          />
        ))}
      </g>
      <circle className="free-dot" cx="260" cy="278" r="9" />
      <circle cx="160" cy="306" r="9" />
      <circle cx="362" cy="306" r="9" />
      <text x="273" y="283">
        FREE POSITION
      </text>
      <text x="276" y="175">
        8-METER ARC
      </text>
    </svg>
  );
}
