# The Intent Layer - Reference Guide

> Reference material on building token-efficient context systems for AI agents.
> Source: [Intent Systems](https://www.intent-systems.com)

---

## Why Context Matters

The ceiling on AI results isn't model intelligence—it's _what the model sees before it acts_.

Your best engineers carry a mental model: what this subsystem owns, what must never happen, where the real boundaries live. That knowledge accumulated over years—bugs, outages, code reviews, hard lessons. It lives in heads and scattered docs, not in code.

**Key insight**: AI is limited by the context you give it, just like engineers are. If the model doesn't see what a great engineer would look at before touching production, it won't perform like a great engineer.

### The Dark Room Problem

Every agent starts from zero. Every request is a full onboarding—not just to your task, but to your entire system. The agent is fumbling in the dark, learning only by what it bumps into.

Even when the agent _does_ find the right files, code alone doesn't tell the whole story:
- _Why_ does this abstraction exist?
- What must never happen here?
- Where are the real boundaries?

That knowledge lives in heads and scattered docs—not in source files.

---

## Three Approaches to Context

### 1. Agentic Search (Default)
The agent uses tools to explore autonomously. Works for small codebases, but:
- Misses the "why": architectural decisions, historical context
- Coverage becomes accidental in medium/large codebases
- Code doesn't capture intent, history, or tribal knowledge

### 2. Manual Context Engineering
Engineers hand-curate exactly what the agent sees. High quality but:
- Massive skill gap between novice and expert
- Time-consuming (30-90 minutes per task)
- Not reusable—disappears into chat logs
- Doesn't scale

### 3. Systematic Context Layer (The Intent Layer)
Build a thin, token-efficient context layer over your codebase once. Every engineer and agent benefits automatically.

---

## What is the Intent Layer?

The basic unit is the **Intent Node**—a small, opinionated file (`AGENTS.md`, `CLAUDE.md`, or similar) that explains:
- What that area of the system is for
- How to use it safely
- What patterns and pitfalls agents need to know

**Key behavior**: If an Intent Node exists in a directory, it covers that directory and all subdirectories, and is automatically included in context whenever an agent works there.

The Intent Layer is the collection of these nodes across your repo—a sparse tree overlaid on your codebase. Place them at **semantic boundaries**: where responsibilities shift, contracts matter, or complexity warrants dedicated context.

### The Two Jobs

1. **Compress context**: Distill a large area of code into the minimum tokens an agent needs to operate there safely
2. **Surface hidden context**: Capture what code _can't_ express—invariants, architectural decisions, "why things are this way"

---

## What Makes a Good Intent Node

Intent Nodes should be **small** but **dense**. Think of them as the highest-signal briefing you'd hand a senior engineer before they touch that area.

### Contents

**Purpose & Scope**
What this area is responsible for. What it explicitly _doesn't_ do.

**Entry Points & Contracts**
Main APIs, jobs, CLI commands. Invariants like "All outbound calls go through this client."

**Usage Patterns**
Canonical examples: _"To add a new rule, follow this pattern…"_

**Anti-patterns**
Negative examples: _"Never call this directly from controllers; go through X."_

**Dependencies & Edges**
Which other directories or services it depends on. Downlinks to child Intent Nodes.

**Patterns & Pitfalls**
Things that repeatedly confused agents or humans.

---

## Hierarchical Loading

When an Intent Node is pulled into context, **all of its ancestor nodes are pulled in too**. The agent never starts reasoning without the high-level picture.

This creates a **T-shaped view**: Broad context at the top, specific detail where it's working.

### Downlinks

Nodes can include **downlinks** to point agents toward relevant context:

```markdown
## Related Context
- Payment validation rules: `./validators/AGENTS.md`
- Settlement engine: `./settlement/AGENTS.md`
```

**Progressive disclosure**: Don't load irrelevant context upfront. Point to related context that agents can follow _if needed_.

### Least Common Ancestor (LCA)

When a fact applies to multiple areas, place it in the shallowest Intent Node that covers all relevant paths. Not in both leaf nodes (wasteful, will drift). Not in the root (loads it even in unrelated areas).

---

## Building the Intent Layer

### The Capture Workflow

1. **Chunk the codebase semantically** (20k-64k token sweet spot)
2. **Capture leaf-first** with SME interviews
3. **Hierarchically summarize** up the tree

**Key mechanic**: When capturing a parent, summarize child Intent Nodes—not the raw code they cover. This creates **fractal compression**.

### Capture Order

- Easy areas first, hard areas last
- Children before parents
- Well-understood areas before tangled ones

Each captured node makes adjacent captures easier—clarity compounds.

### Track Open Questions

Anything that can't be answered in the current chunk:
- **Open questions**: "Is this path still used in production?"
- **Cross-references**: "This relates to billing validation"
- **Tasks**: Dead code candidates, refactors that emerge

---

## Anti-Patterns

What breaks an Intent Layer:

- **Dump everything into a single root file** that balloons to 15k+ tokens
- **Duplicate what's already in code** instead of capturing what code _can't_ express
- **Structure information for human readers**, not token-limited agents
- **Drift out of sync** with code because no one owns maintenance
- **Miss the hierarchical loading behavior** that makes context automatic

---

## Maintenance

On every merge:
1. Detect which files changed
2. Identify which Intent Nodes cover those changes
3. For each affected node (leaf-first, working up): re-summarize if behavior changed
4. Human reviews and merges

When agents use the Intent Layer, they surface what's missing:
- Contradictions between code and nodes
- Undocumented patterns
- Sharp edges humans learned to step around

Your codebase becomes a reinforcement learning environment. Build once. Agents maintain. Each cycle compounds into institutional memory.

---

## The Payoff

With a functional Intent Layer:
- Agents behave like your best engineers
- You can run longer tasks, parallelize agents, operate at a higher level
- Context compounds—every hard-won explanation is captured once, reused forever

**Cost**: 3-5 focused hours per 100k tokens (experienced), 2-3x if new to context engineering.
**Maintenance**: 5-10 minutes per PR if manual, or automate it.

---

## References

- [The Intent Layer](https://www.intent-systems.com/intent-layer)
- [Context Is Your Constraint](https://www.intent-systems.com/context-is-your-constraint)
- [AI Adoption Roadmap](https://www.intent-systems.com/ai-adoption-roadmap)
