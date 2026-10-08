# START

A beginner-friendly career exploration prototype using plain HTML, CSS, and
JavaScript.

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

- `src/index.html` contains the welcome message and five intake questions.
- `src/styles.css` controls the layout, colors, spacing, and focus styles.
- `src/app.js` checks the answers and displays a confirmation message.
- `test/index.test.js` contains the Node.js tests.
