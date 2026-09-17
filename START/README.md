# Career skills matcher

An accessible, dependency-free browser app that compares a user's current job
title with a career they are exploring. It highlights overlapping skills,
skills to develop, and practical next steps using a curated local dataset.

## Requirements

- Node.js 20 or newer

## Setup

```bash
npm install
npm start
```

Open <http://localhost:3000> in a browser.

## Development

```bash
npm run dev
```

## Tests

```bash
npm test
```

## How it works

Choose a supported current job title and an interested-in career. The matcher
compares the skills in both curated profiles. It is guidance for exploration,
not a prediction or guarantee, and does not send entered titles to an external
service.

## Structure

```text
START/
├── src/
│   ├── app.js
│   ├── data/careers.js
│   ├── index.html
│   ├── server.js
│   └── styles.css
├── test/
│   └── matcher.test.js
├── .editorconfig
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```
