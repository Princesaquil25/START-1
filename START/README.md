# START

A beginner-friendly career exploration prototype using plain HTML, CSS, and
JavaScript. After completing the questionnaire, users see three possible
career titles matched to their selected preferences. The suggestions are
exploration starting points, not predictions or guarantees.

## Requirements

- Node.js 20 or newer

## Setup

```bash
npm install
```

## Preview the website

Open `src/index.html` directly in a web browser. The prototype does not use a
database, account system, or web server.

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
├── LICENSE
├── package.json
└── README.md
```

### File roles

- `src/index.html` contains the welcome message, five intake questions, and
  recommendation results area.
- `src/data/careers.js` contains the five career titles and their answer-match
  signals.
- `src/styles.css` controls the layout, colors, spacing, and focus styles.
- `src/app.js` checks the answers, ranks career matches, and displays reasons
  based on matching answers.
- `test/index.test.js` contains the Node.js tests.
