# Career Pathway Explorer

A static, beginner-friendly website that helps adults explore nine
administrative and office-based career options. Its eight-step questionnaire
connects selected work backgrounds and personally confirmed
activities to potential transferable-skill matches, then uses technology,
education, optional English-learning level, training, and work preferences
to personalize preparation and refine fit. It shows up to three
evidence-supported options. Suggestions are exploratory, not predictions,
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

- `src/index.html` contains the welcome section, eight-step questionnaire,
  How It Works explanation, results area, and privacy information.
- `src/data/careers.js` holds nine researched career profiles, learning
  resources, occupational sources, and occupation/activity-to-skill mappings.
- `src/styles.css` controls the blue-and-white responsive design, selected
  answer states, visible keyboard focus, and expandable detail cards.
- `src/app.js` guides people through one question at a time, validates answers,
  ranks career matches, and renders personalized explanations, preparation,
  optional resources, and career details. It also provides print, PDF, and
  user-initiated sharing controls for complete or selected results, plus
  individual print/save controls inside expanded career details.
- `test/index.test.js` tests question validation, skill evidence and
  deduplication, career ranking, preparation and resource personalization,
  result selection, share text, profile completeness, source links, and
  mirrored visitor pages.

## Understanding recommendations

The matcher compares skill families suggested by selected occupations with
the career profile, and gives stronger weight to activities a user confirms
having done. Each skill family is counted once, even when multiple answers
support it. Occupation-based connections are potential examples based on
typical occupational tasks; they do not confirm that a particular person did
those tasks. The app does not fill recommendation slots when it finds no
relevant skill evidence.

Selecting stay-at-home parenting or unpaid family caregiving can surface
potential connections based on related caregiving tasks, but does not confirm
that a visitor performed them. The broad “other work or unpaid
responsibilities” option does not trigger assumed skills; visitors can
confirm specific activities from paid work, volunteering, or responsibilities
at home.

Technology comfort, education/training, and training interest personalize
preparation suggestions. The optional self-described English level guides
which English resources are offered; it does not affect career ranking.
Selecting “I don't need English-language support,” preferring not to answer,
or skipping the question does not add English-learning suggestions. English
resources remain optional and are not a formal proficiency assessment.
Work-setting preferences and priorities refine career fit after
transferable-skill evidence. None of these answers establish aptitude,
qualifications, or eligibility.

Career descriptions and common requirements link to the U.S. Bureau of Labor
Statistics and O*NET where available. Learning resources are optional, and
employer requirements vary. GED, English-learning, and computer resources are
shown when the corresponding preparation may be useful; career-specific
resources remain available. The project-specific match rules are not an
occupational assessment.

## Printing, PDF, and sharing

The shared print, save, or share controls appear below the career
recommendations. Choose complete results or selected recommended careers
before using those controls. Each expanded career also has one action to print
or save only that career, including its preparation, resources, pathways, and
occupational sources. Print and PDF use the browser's print dialog; select
“Save as PDF” there to create a PDF. Sharing is started only after a visitor
selects Share Results and uses the browser's native share sheet or clipboard
when available. The app does not create a result URL or account, and does not
send questionnaire answers to a server. Sharing passes result text only after
the visitor's click.
