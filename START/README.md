# Career Pathway Explorer

A static, beginner-friendly website that helps adults explore nine
administrative and office-based career options. Its seven-question
questionnaire connects selected work backgrounds and personally confirmed
activities to potential transferable-skill matches, then uses technology,
education, training, and work preferences to personalize preparation and
refine fit. It shows up to three evidence-supported options. Suggestions are
exploratory, not predictions, qualification checks, or guarantees of
employment.

## Requirements

- Node.js 20 or newer

## Setup

```bash
npm install
```

## Preview the website

Open `src/index.html` directly in a web browser, or serve the repository root
with any simple static web server and open its `index.html`. The root
`index.html` is the GitHub Pages entry point and references the same app files
under `START/src/`.

The site is static and does not use a database, account system, build step, or
server-side service. Questionnaire answers are processed in the browser and
are not saved or sent by the app.

## Tests

```bash
npm test
```

## Structure

```text
START/
├── src/
│   ├── app.js
│   ├── data/
│   │   └── careers.js
│   ├── index.html
│   └── styles.css
├── test/
│   └── index.test.js
├── .editorconfig
├── .gitignore
├── package.json
└── README.md
```

### File roles

- `src/index.html` contains the welcome section, seven-question questionnaire,
  How It Works explanation, results area, and privacy information.
- `src/data/careers.js` holds nine researched career profiles, learning
  resources, occupational sources, and occupation/activity-to-skill mappings.
- `src/styles.css` controls the blue-and-white responsive design, selected
  answer states, visible keyboard focus, and expandable detail cards.
- `src/app.js` guides people through one question at a time, validates answers,
  ranks career matches, and renders personalized explanations and career
  details.
- `test/index.test.js` tests question validation, skill evidence and
  deduplication, career ranking, preparation personalization, profile
  completeness, source links, and mirrored visitor pages.

## Understanding recommendations

The matcher compares skill families suggested by selected occupations with
the career profile, and gives stronger weight to activities a user confirms
having done. Each skill family is counted once, even when multiple answers
support it. Occupation-based connections are potential examples based on
typical occupational tasks; they do not confirm that a particular person did
those tasks. The app does not fill recommendation slots when it finds no
relevant skill evidence.

Broad “other work or unpaid responsibilities” selections, including
homemaking, do not trigger assumed skills; personally confirmed activities
still provide direct evidence. This also lets users confirm tasks such as
tracking supplies rather than having the app infer that experience from a job
title.

Technology comfort, education/training, and training interest personalize
preparation suggestions. Work-setting preferences and priorities refine
career fit after transferable-skill evidence. These answers do not establish
aptitude, qualifications, or eligibility.

Career descriptions and common requirements link to the U.S. Bureau of Labor
Statistics and O*NET where available. Learning resources are optional, and
employer requirements vary. The project-specific match rules are not an
occupational assessment.
