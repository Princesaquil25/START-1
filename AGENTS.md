# AGENTS.md

## Purpose

This repository contains a career pathway web app that helps users explore
career options, understand the skills and education each pathway requires, and
identify practical next steps.

Keep the experience clear, encouraging, inclusive, and useful to people with
different backgrounds and levels of career experience. The app should provide
grounded pathway information without presenting predictions or recommendations
as guarantees.

---

## 1. Core Workflow (Spec-Driven Development)

- **Plan first:** Use PLAN mode or design thinking before making code changes.
- **Review requirements:** Read `requirements.md`, local documentation, and
  existing source files before implementation when they are available.
- **Propose changes:** Present the files and behavior that will change and get
  confirmation before writing code when the change is substantial.
- **Preserve user trust:** Clearly distinguish verified information, estimates,
  and user-provided preferences. Do not invent employers, salaries,
  credentials, job openings, or labor-market statistics.
- **Use grounded content:** Career descriptions, qualifications, and pathway
  steps must come from an approved source or content supplied by the project
  owner. Do not add placeholder career facts or fabricated testimonials.
- **Protect personal data:** Collect only the information needed for the
  feature. Never log passwords, private profile details, or other sensitive
  user data.

## 2. Technical Environment and Commands

- **Language and stack:** Plain HTML5, CSS3, and vanilla JavaScript unless a
  requirement explicitly approves another dependency or framework.
- **Runtime:** Node.js 20 or newer for the existing scripts and test runner.
- **Install dependencies:** `npm install`
- **Start the app:** `npm start`
- **Development mode:** `npm run dev`
- **Run tests:** `npm test`
- **Static-site fallback:** If the app is converted to a static site, it must
  remain runnable by opening `index.html` directly or through a simple local
  live server.
- **No unnecessary dependencies:** Prefer browser and Node.js platform APIs.
  Add a dependency only when it materially improves the user experience or
  reliability and document why it is needed.

## 3. Product and Design Requirements

- Build a responsive experience for mobile, tablet, and desktop.
- Use semantic HTML, visible focus states, keyboard-friendly controls, and
  sufficient color contrast. Target WCAG 2.2 AA accessibility practices.
- Use a calm, professional visual system that supports exploration rather than
  pressure. Prefer a readable type scale, clear hierarchy, and consistent
  spacing.
- Present pathway information in scannable sections such as interests,
  transferable skills, recommended next steps, education or training,
  experience-building options, and related careers.
- Explain why a pathway is suggested and allow users to revise their answers or
  explore alternatives.
- Avoid discriminatory assumptions or language based on age, gender, race,
  disability, nationality, income, or educational background.
- Show uncertainty and context for changing information such as salaries,
  demand, costs, and time-to-completion. Include source dates when applicable.

## 4. Code Organization and Quality Constraints

- Keep the project modular and lightweight. Separate structure, presentation,
  data, and behavior into clear files or modules.
- Use descriptive names and small functions with one responsibility.
- Keep career pathway data separate from rendering and interaction logic so
  content can be reviewed or replaced without rewriting the UI.
- Prefer progressive enhancement: core pathway content should remain useful
  when JavaScript is unavailable or a nonessential enhancement fails.
- Validate user input at the boundary, handle empty and unexpected values
  explicitly, and display actionable error messages.
- Do not use broad error handlers, silent fallbacks, or `console.log` calls for
  sensitive data.
- Add or update tests for pathway matching, filtering, validation, and other
  meaningful behavior changes. Keep tests deterministic and independent of
  external services.
- Before completing a change, run the smallest relevant checks, then run
  `npm test` for changes that affect application behavior.
- Update `README.md` or other directly related documentation when setup,
  behavior, or project structure changes.

## 5. Expected Project Structure

Use the existing structure where possible:

```text
START/
├── src/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── data/
│       └── pathways.js
├── test/
├── .editorconfig
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

Do not create a file solely to match this example. Follow the structure that
best fits the implemented features and keep the README accurate.
