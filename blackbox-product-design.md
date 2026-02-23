# BlackBox — Product Design Document

**The Dashcam for AI-Assisted Work**

Accountability infrastructure for the age of AI operators.

Draft v0.1 | February 2026 | CONFIDENTIAL

---

## 1. The Problem

A structural shift is happening in knowledge work. AI agents can now perform the tasks of entire teams, which means companies are collapsing headcount: where 10 people once worked, 1 person now operates with AI assistance. The productivity gains are real. But something critical was lost in the transition.

Teams didn't just produce work. They provided structural protections that are invisible until they're gone:

- **Distributed accountability.** When a team ships bad work, the failure is shared across the people who wrote it, reviewed it, and approved it. Nobody bears the full weight alone.
- **Independent review.** The person who wrote the code isn't the person who reviewed the PR. The person who drafted the analysis isn't the person who QA'd the numbers. Multiple independent brains caught different failure modes.
- **Collective leverage.** A team of 10 can push back on unrealistic timelines. One person alone just looks like they're underperforming.
- **Blameless failure modes.** When a team fails, organizations run root cause analyses. When one person fails, organizations run performance reviews.

AI replaced the labor but none of these structural protections. The solo operator now makes dozens of high-stakes decisions per day — which AI output to trust, what to rewrite, what to skip testing on, what architecture to choose — and every one of those decisions is invisible. If things go well, nobody asks. If things go wrong, there's exactly one throat to choke.

This isn't a tooling problem. It's an accountability architecture problem. And it's the single biggest unaddressed blocker to confident AI adoption at scale.

---

## 2. Core Insight

The bottleneck to AI adoption isn't capability — it's **the fear of being the single point of blame.** People don't need better AI. They need protection when AI fails.

A surgeon can operate despite the life-or-death stakes because an entire infrastructure exists to make risk bearable: training protocols, checklists, malpractice insurance, peer review, and a professional culture that distinguishes "followed correct process and got an adverse outcome" from "was negligent."

Nothing equivalent exists for AI operators. BlackBox builds that infrastructure.

---

## 3. The Product

### 3.1 One-Line Description

**BlackBox is a passive decision log for AI-assisted work** — a dashcam that captures the context of every decision an AI operator makes, so they have evidence when things go wrong and data to prove what's realistic.

### 3.2 What It Is Not

- It is NOT an AI output verifier (LLMs checking LLMs have correlated failure modes).
- It is NOT an observability dashboard for engineering teams (we're not competing with Datadog).
- It is NOT a project management or documentation tool (we're not competing with Notion).
- It is NOT a compliance checkbox product sold top-down to enterprises.

### 3.3 How It Works

The product has two modes: passive capture and active annotation.

#### Passive Capture

BlackBox integrates with the tools the operator already uses and silently records the context of their AI-assisted work. No manual logging required. Specifically:

- **Browser extension** — detects when the user is interacting with ChatGPT, Claude, Gemini, or other AI interfaces. Captures the prompt, the response, and what the user did with the output (copied, modified, discarded). One click to install, zero configuration.
- **CLI Agent Monitor** — a wrapper or shell integration that captures activity from terminal-based AI agents — Claude Code, Codex CLI, Aider, and similar tools. These agents are increasingly where the highest-stakes AI-assisted work happens: they read entire codebases, make multi-file changes, run commands, and deploy code. The CLI monitor captures the agent's session log (commands issued, files modified, terminal output) without requiring access to the agent's internal reasoning. Implementation is a lightweight shell wrapper (e.g., `blackbox exec claude-code`) or a background daemon that watches for known agent processes and captures their filesystem and terminal activity. For agents that produce their own session logs (Claude Code's markdown logs, for instance), BlackBox can ingest those directly.
- **IDE plugin (VS Code, JetBrains)** — hooks into editor events to detect AI code generation (Copilot, Cursor, Claude Code, etc.). Records accepted vs. rejected suggestions. Links to git commits for traceability.
- **Git hook** — a lightweight pre-commit hook that tags commits with metadata about AI-assisted content. Can be installed globally or per-repository. When paired with the CLI monitor, this creates a complete chain: which agent session produced which file changes, which ended up in which commit.
- **Communication integration (Slack, email)** — captures when the operator flags a risk, raises a concern about timeline, or requests additional review. This is critical for the "I told you so" use case.

#### Active Annotation

At any point, the operator can add a manual annotation to the log:

- **Risk flag** — "I'm shipping this module but I'm not confident in the error handling. Flagging for future review."
- **Decision note** — "Chose architecture A over B because of time constraints. B would have been more robust."
- **Override record** — "Manager requested we ship without load testing. Documenting this decision."
- **Constraint note** — "Deadline moved up by 2 weeks. Cutting scope on X and Y to accommodate."

These annotations are timestamped, immutable, and linked to the relevant work artifacts. They're the operator's insurance policy.

### 3.4 The Output: Decision Timeline

All captured data is organized into a chronological Decision Timeline — a complete, searchable history of what the operator did, why they did it, what AI produced, and what context they were operating under.

When something goes wrong, the operator opens BlackBox and has a clear, evidence-backed narrative:

- "The AI generated this code on Tuesday. Here's the prompt I used."
- "I modified lines 42–67 manually. The rest was AI-generated."
- "I flagged this as risky on Wednesday. Here's the annotation."
- "The decision to ship on Friday was made in this Slack thread by [manager]."
- "The timeline was set at X, industry benchmark for this type of work is Y."

This fundamentally changes the post-failure conversation from "why didn't you catch this?" to "let's look at the decision log and understand what happened."

### 3.5 The Verification Receipt

For high-stakes deliverables, BlackBox generates a Verification Receipt — a timestamped, signed summary of the decision trail for a specific piece of work. This includes what AI tools were used, what the operator reviewed, what risks were flagged, and what was approved.

The receipt serves multiple purposes:

- **Personal protection** — evidence that the operator followed a reasonable process.
- **Client-facing transparency** — agencies and freelancers can share it with clients to demonstrate their AI-assisted workflow is rigorous.
- **Compliance artifact** — in regulated industries, proof that a human was in the loop at defined checkpoints.

---

## 4. Target Audience

### 4.1 Primary: The Solo AI Operator

This is the person our entire product exists for. They are a knowledge worker — developer, consultant, analyst, designer, marketer, writer — who now does the work that used to require a team, with AI assistance. They are:

- Personally accountable for AI-generated output they can't fully verify.
- Making dozens of judgment calls per day with no second opinion.
- Anxious about the asymmetry: the upside of AI accrues to the company, the downside accrues to them.
- Unable to articulate why they feel overwhelmed — they just know the weight is heavier than it should be.

This person adopts BlackBox for self-interest. It's their personal protection layer. They would install it even if their company didn't ask them to.

### 4.2 Secondary: Agencies and Freelancers

These are people who deliver AI-assisted work to clients and need a way to demonstrate quality and process. The verification receipt is their proof that "we use AI responsibly." This segment monetizes faster because the value proposition directly supports revenue (winning and retaining clients).

### 4.3 Tertiary: Companies Managing AI-Augmented Teams

This is the enterprise play that emerges after bottom-up adoption. When 20 employees at the same company are using BlackBox individually, the company has a choice: formalize it or ignore it. Smart companies formalize it because the aggregated data shows them things they can't see otherwise — where AI-assisted work is failing, which teams are under the most pressure, and whether their expectations are realistic.

---

## 5. User Journey

### 5.1 Minute 1: Installation and Instant Context

The user installs the browser extension or the CLI tool. Setup takes under 60 seconds. No account creation required for the free tier.

For CLI users: they run `blackbox exec claude-code` instead of `claude-code` and their session is captured automatically. For browser users: the extension detects AI chat interfaces and begins capturing immediately.

### 5.2 Minute 10: The First Mirror

This is the most critical design decision in the product. The user must experience value in their very first session — not a week later, not when something breaks, but right now.

After the user completes their first AI interaction with BlackBox running, they see a subtle, non-intrusive notification — a small floating badge or sidebar that shows a real-time session summary:

- **Session pulse:** "This session: 6 AI interactions, 3 accepted as-is, 2 modified, 1 discarded. You touched 4 files. Estimated decisions made: 11."

This is the mirror. Most operators have never seen their AI-assisted work quantified in real time. The number alone is a revelation — "I made 11 decisions in the last 20 minutes and I wasn't even thinking about it." It makes the invisible burden tangible immediately, before anything has gone wrong.

The session summary also serves as a subtle prompt: at the end of each session, it asks one optional question: "Anything you'd flag about this session?" with one-tap options like "Shipped under time pressure," "Wasn't confident in the output," "Manager asked me to skip review." These micro-annotations take 2 seconds and build the habit of documenting without feeling like documentation.

### 5.3 Day 2–7: The Pattern Emerges

By the end of the first week, the user has a personal dashboard showing patterns they've never seen before. Not a weekly digest delivered passively — a living view they can check anytime:

- Daily decision volume over time (trending up? that's a workload signal).
- AI acceptance rate (are they rubber-stamping AI output, or actually reviewing it?).
- Risk flags they've placed (a growing list that makes the invisible visible).
- Busiest hours (when are they most reliant on AI and potentially most fatigued?).

This is when the product shifts from "curious novelty" to "personal intelligence about my work." The operator starts to understand their own patterns.

### 5.4 Week 2–4: First Real Use

Something goes slightly wrong. A bug in production, a client questions a number, a deliverable has an issue. The user opens BlackBox and, for the first time, pulls up the decision timeline for that piece of work. They see exactly what happened: the AI generated X, they modified Y, they shipped Z. They can show their manager the full context.

This is the hook moment. The relief of having evidence changes their relationship with the tool from "passive background thing" to "my safety net."

### 5.5 Month 2+: Active Integration

The user starts annotating proactively. When they're unsure about a decision, they flag it. When a manager pushes an unrealistic timeline, they log the constraint. When they skip testing due to time pressure, they note it. BlackBox becomes their professional journal — a running record that protects them and helps them reflect on their work patterns.

### 5.6 Month 6+: Team Adoption

The user tells a colleague about BlackBox. Their manager notices and asks about it. The company considers formalizing it. The enterprise sales motion begins.

---

## 6. Technical Architecture

### 6.1 Architecture Principles

- **Privacy-first.** All data is stored locally by default. Cloud sync is opt-in and end-to-end encrypted. The user's AI interactions are their data, not ours.
- **Zero-effort capture.** The product must work without the user changing their workflow. No manual logging, no copy-pasting, no switching contexts.
- **Model-agnostic and platform-agnostic.** Works regardless of which AI tools the user employs. No dependency on any specific provider's API or chain-of-thought access.
- **Tamper-evident.** Decision logs and annotations must be timestamped and immutable once created. This is essential for the "receipts" use case.

### 6.2 System Components

#### Capture Layer

The capture layer consists of lightweight integrations that observe the boundary between the user and their tools:

- **Browser Extension (Chrome, Firefox, Edge):** Content script detects AI chat interfaces by URL pattern and DOM structure. Captures prompt/response pairs via DOM observation. Detects user actions (copy, edit, discard). Runs entirely client-side — no data leaves the browser unless the user opts into cloud sync.
- **CLI Agent Monitor:** A shell wrapper (`blackbox exec <agent>`) or background daemon that captures terminal-based AI agent sessions. Watches for known agent processes (Claude Code, Codex CLI, Aider), captures session logs, commands issued, files read/modified, and terminal output. Can also ingest agent-native session logs (e.g., Claude Code's markdown logs). Captures filesystem diffs (before/after snapshots of modified files) to create a complete record of what the agent changed.
- **IDE Plugin (VS Code, JetBrains):** Hooks into editor events to detect AI code generation (completions, inline suggestions, chat-based generation). Records accepted vs. rejected suggestions. Links to git commits for traceability.
- **Git Hook:** A lightweight pre-commit hook that tags commits with metadata about AI-assisted content. Links back to the originating CLI session or IDE session that produced the changes.
- **API Proxy (optional, for teams):** For organizations routing AI API calls through a centralized gateway, BlackBox can sit as a transparent proxy that logs all requests and responses without modifying them.

#### Storage Layer

Local-first architecture using an embedded database (SQLite or IndexedDB depending on the client):

- All capture data stored on the user's device by default.
- Structured as an append-only log (no edits, no deletions — this is important for credibility).
- Each entry is cryptographically hashed and chained to the previous entry, creating a tamper-evident log similar to a lightweight blockchain. If someone accuses the operator of fabricating evidence, the hash chain proves integrity.
- Optional cloud sync via end-to-end encrypted storage for backup and cross-device access.

#### Analysis Layer

Lightweight, local-first analysis that runs on the captured data:

- Decision frequency metrics: how many AI-dependent decisions per day, per category.
- Risk surface estimation: what percentage of shipped work was AI-generated and unreviewed.
- Pattern detection: recurring risk categories, time-of-day effects, deadline pressure correlations.
- No LLM-based analysis of content quality — this is intentional. We don't judge the work; we document the process.

#### Presentation Layer

- **Decision Timeline UI:** A chronological, filterable view of all captured decisions and annotations. Searchable by date, project, tool, risk level.
- **Real-time Session Summary:** Floating badge/sidebar showing live decision count, acceptance rate, and files touched during the current work session. This is the instant-value hook on first use.
- **End-of-Session Micro-Annotation Prompt:** One-tap options ("Shipped under time pressure," "Wasn't confident in output," "Manager asked me to skip review") for frictionless habit-building.
- **Verification Receipt Generator:** Produces a signed PDF/document summarizing the decision trail for a specific deliverable.
- **Personal Dashboard:** Living view of decision patterns, AI acceptance rates, risk flags, and workload trends over time.
- **Weekly Digest:** Automated summary of the operator's AI-assisted work patterns.

---

## 7. Business Model

### 7.1 Pricing Tiers

| | Free | Pro ($15/mo) | Team ($25/seat/mo) |
|---|---|---|---|
| **Capture** | Browser extension + CLI | All integrations | All + API proxy |
| **Storage** | Local only, 30-day retention | Local + encrypted cloud, unlimited retention | Centralized + per-user, unlimited |
| **Annotations** | 5 per week | Unlimited | Unlimited + shared |
| **Receipts** | — | Unlimited | Unlimited + branded |
| **Analytics** | Real-time session summary + weekly digest | Full personal dashboard | Team + individual dashboards |
| **Benchmarks** | Public reports only | Personalized: your metrics vs. industry | Team benchmarks + industry comparison |

### 7.2 Revenue Logic

The free tier is the growth engine. It must be genuinely useful on its own — the browser extension plus CLI wrapper plus local storage plus real-time session summary gives the operator real protection value at zero cost. This drives adoption.

Pro conversion happens when the operator experiences their first "I wish I had the full log" moment — something breaks and the 30-day retention wasn't enough, or they need a verification receipt for a client. The $15/month price point is low enough for an individual to expense or pay personally.

Team conversion happens organically when multiple individuals at the same company are using Pro. The team tier adds shared visibility, aggregated analytics, and the API proxy for centralized capture.

### 7.3 Long-Term Revenue: Benchmark Data

The most valuable long-term asset is the anonymized, aggregated dataset of how AI-assisted work actually happens across industries. This funds two revenue streams:

- **Annual benchmark reports** ("The State of AI-Assisted Work 2027") sold to enterprises, consulting firms, and industry bodies. Pricing: $5K–$50K depending on depth and customization.
- **Advisory services** for companies designing AI-augmented team structures, informed by real data on failure rates, decision volumes, and risk patterns.

---

## 8. The Data Flywheel and Moat

Every decision captured by BlackBox contributes to an aggregated, anonymized dataset about how AI-assisted work happens in practice. Over time, this dataset becomes uniquely valuable because it answers questions nobody else can answer:

- What is the realistic daily decision volume for a solo AI operator in software engineering? In consulting? In marketing?
- What percentage of AI-generated code ships to production without human modification?
- When operators flag risks and get overruled, how often does the risk materialize?
- What's the correlation between deadline pressure and AI-assisted work failures?
- How do error rates change as a function of how many AI tools an operator uses simultaneously?

This data has three strategic effects:

**1. It gives individual operators leverage.** When a developer can say "industry benchmark for this workload is X and you're asking for 2X," they have structural power that no individual could have alone. This is analogous to what DORA metrics did for DevOps teams or what salary transparency platforms did for compensation negotiations.

**2. It makes the invisible burden visible.** Right now, the strain on solo AI operators is invisible to management because there's no data. BlackBox creates the data. When the benchmark report shows that solo operators are making 150+ high-stakes decisions per day with zero review, that's a headline that changes how companies think about staffing.

**3. It creates an unreplicable moat.** No competitor can generate this dataset without the user base. The more operators use BlackBox, the more accurate the benchmarks become, which makes BlackBox more valuable, which attracts more operators. This is a classic data network effect.

---

## 9. Go-to-Market Strategy

### 9.1 Phase 1: Individual Adoption (Months 1–6)

**Channel:** Developer and knowledge worker communities — Twitter/X, Reddit (r/programming, r/consulting, r/freelance), Hacker News, LinkedIn, YouTube.

**Message:** "You're using AI to do the work of 5 people. When something breaks, who gets the blame? BlackBox gives you receipts."

**Distribution:** Chrome Web Store (browser extension), VS Code Marketplace (IDE plugin), npm/Homebrew (CLI tool). All free. Zero-friction installation.

**Content strategy:** Publish weekly anonymized "failure pattern" reports from early users (with permission). These serve dual purpose: they establish credibility and they create mild productive anxiety that drives adoption. Example headline: "78% of AI-generated code we tracked this month shipped without any manual review."

### 9.2 Phase 2: Community and Benchmarks (Months 6–12)

**Milestone:** 10,000+ active users contributing anonymized data.

**Action:** Publish the first "State of AI-Assisted Work" report. Get press coverage. Establish BlackBox as the authoritative source for how AI is actually changing work.

**Expansion:** Move beyond developers into consulting, legal, finance, and marketing verticals. Each vertical gets a tailored version of the browser extension that understands domain-specific workflows.

### 9.3 Phase 3: Team and Enterprise (Months 12–24)

**Trigger:** Multiple individuals at the same company using BlackBox → outbound to the company offering team plans.

**Enterprise pitch:** "34 of your employees are already using BlackBox to protect themselves. That's a signal. Let's make this official so you can see the aggregated picture and set realistic expectations for your AI-augmented teams."

### 9.4 Phase 4: The Standard (Months 24+)

If adoption reaches critical mass, BlackBox becomes the de facto framework for responsible AI-assisted work. Clients start asking agencies: "Do you use BlackBox?" Companies include it in their AI governance policies. Insurance companies reference it when pricing coverage for AI-related errors.

This is aspirational, not planned. It's the emergent outcome of getting Phases 1–3 right.

---

## 10. Key Risks and Mitigations

### 10.1 "People won't bother logging anything"

This is why passive capture is essential and active annotation is optional. The product must deliver value at zero effort. The real-time session summary alone — showing operators how many AI-dependent decisions they're making right now — is valuable even if they never annotate anything. Annotations are the power-user feature, not the core.

### 10.2 "Companies will see this as adversarial"

Initially, yes — some managers will dislike employees having "receipts." But the reframe is important: BlackBox protects the company too. A clear decision log means faster root cause analysis, better process improvement, and reduced legal risk. The team tier is explicitly designed to make the tool collaborative rather than adversarial.

### 10.3 "OpenAI/Anthropic/Google builds this in"

They might build activity logging for their own tools. But BlackBox's value is cross-platform and model-agnostic — it captures the full picture across all AI tools, not just one. It's also independent, which matters for credibility. You wouldn't trust a company to audit itself. The benchmark data moat is also unreplicable by any single AI provider.

### 10.4 "Privacy concerns prevent adoption"

Local-first architecture mitigates this. All data stays on the user's device by default. Cloud sync is opt-in and E2E encrypted. Anonymized benchmark contributions are opt-in with granular controls. The product must be the most privacy-respecting tool in the operator's stack.

### 10.5 "The benchmark data isn't representative"

Early data will be skewed toward developers and tech workers. The mitigation is deliberate vertical expansion in Phase 2, and transparent methodology in benchmark reports. Partial data is still more useful than no data, which is what exists today.

---

## 11. Success Metrics

### 11.1 Phase 1 (Months 1–6)

- 10,000 browser extension + CLI installs
- 2,000 weekly active users (opened BlackBox at least once)
- 500 users who have made at least one manual annotation (leading indicator of stickiness)
- 30% Day-30 retention on the extension (stays installed)

### 11.2 Phase 2 (Months 6–12)

- 50,000 active users across all platforms
- 1,000 Pro subscribers ($15K MRR)
- First benchmark report published, 10,000+ downloads
- Coverage in at least 3 major tech publications

### 11.3 Phase 3 (Months 12–24)

- 5,000 Pro subscribers + 200 Team accounts ($175K+ MRR)
- Benchmark data from 3+ industry verticals
- First enterprise contracts signed
- At least one instance of a BlackBox decision log being used in a formal dispute resolution (proof of concept for the core value proposition)

---

## 12. What We Build First

The MVP is ruthlessly scoped to two things: the Chrome browser extension and the CLI wrapper, both with local storage and the decision timeline.

### MVP Scope (8–12 weeks)

- Chrome extension that detects ChatGPT, Claude, and Gemini interfaces.
- CLI wrapper for terminal-based AI agents (Claude Code, Codex CLI, Aider) — captures session activity, file changes, and terminal output via a simple `blackbox exec [agent]` command.
- Automatic capture of prompt/response pairs via DOM observation (browser) and session log ingestion (CLI).
- Local storage in IndexedDB (browser) / SQLite (CLI) with append-only, hash-chained log.
- Simple timeline UI accessible from the extension popup.
- Real-time session summary — floating badge showing live decision count, acceptance rate, and files touched during the current session. This is the instant-value hook.
- End-of-session micro-annotation prompt — one-tap options like "Shipped under time pressure" or "Wasn't confident in output" for frictionless habit-building.
- Manual annotation feature (risk flag, decision note, override record).
- Weekly digest email/notification summarizing decision volume.

### Explicitly Not in MVP

- IDE plugin (Phase 2).
- Git integration (Phase 2).
- Cloud sync (Phase 2).
- Verification receipts (Phase 2).
- Team features (Phase 3).
- Benchmark analytics (Phase 3).
- API proxy (Phase 3).

The MVP succeeds if a single developer installs the extension, uses it for a session, sees their decision count in real time, and thinks "I had no idea I was making this many calls." Then two weeks later, when something goes wrong, they pull up the timeline and think "thank god I have this." Everything else follows from those two moments.

---

## 13. The Endgame

The long-term vision is not a product — it's a shift in how the world thinks about AI-assisted work accountability.

Today, when a company lays off 9 people and tells the remaining person to "use AI," they're transferring the economic risk of 9 roles onto one person without any structural support. BlackBox makes that transfer visible, measurable, and ultimately, manageable.

If we succeed, "Do you use BlackBox?" becomes the AI-era equivalent of "Do you have CI/CD?" — a basic hygiene question that every serious organization answers yes to. Not because someone mandated it, but because the alternative is asking people to bear impossible risk, and the data proved that doesn't work.
