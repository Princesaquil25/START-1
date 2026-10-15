# Career Pathway Explorer

A static, beginner-friendly website that helps adults explore five
administrative and office-based career options. The questionnaire compares
experience and work preferences with project-defined career signals and shows
three options to research. Suggestions are exploratory, not predictions,
qualification checks, or guarantees of employment.

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

- `src/index.html` contains the welcome section, five-question questionnaire,
  How It Works explanation, results area, and privacy information.
- `src/data/careers.js` holds the five researched career profiles, learning
  resources, occupational sources, and project-defined matching signals.
- `src/styles.css` controls the blue-and-white responsive design, selected
  answer states, visible keyboard focus, and expandable detail cards.
- `src/app.js` guides people through one question at a time, validates answers,
  ranks career matches, and renders personalized explanations and career
  details.
- `test/index.test.js` tests required answers, scoring, tie handling, career
  profile completeness, and visitor-facing explanations.

## Understanding recommendations

Each of the five question groups can contribute at most one point to a career.
The app shows the top three by score; ties use the fixed order in
`src/data/careers.js`. The score counts matched question groups. It is not a
probability, qualification rating, or measure of job readiness.

Career descriptions and common requirements link to the U.S. Bureau of Labor
Statistics and O*NET where available. Learning resources are optional, and
employer requirements vary. The project-specific match rules are not an
occupational assessment.
