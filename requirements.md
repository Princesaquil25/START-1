# Career Pathway App Requirements

## Product goal

Create a clear, inclusive web app that helps people explore career pathways,
understand relevant skills and education or training options, and identify
practical next steps.

## Functional requirements

- Users can browse available career pathways.
- Each pathway presents interests, transferable skills, education or training,
  experience-building options, related careers, and next steps when the
  information is available from an approved source.
- The app explains why a pathway may be relevant without describing a result
  as a prediction, guarantee, or promise of employment.
- Users can revise their inputs and explore alternatives.
- Empty, invalid, or unexpected input receives a clear, actionable message.
- Changing information such as salary, demand, cost, and completion time
  includes context and a source date when applicable.

## Accessibility and privacy requirements

- Use semantic HTML, keyboard-friendly controls, visible focus states, and
  sufficient color contrast.
- Support mobile, tablet, and desktop layouts.
- Collect only information needed for the requested feature.
- Never log passwords, private profile details, or other sensitive user data.

## GIVEN / WHEN / THEN acceptance criteria

### Pathway exploration

- **GIVEN** a user opens the app
- **WHEN** pathway content is available
- **THEN** the user can scan pathway descriptions and access relevant skills,
  preparation, and next-step information.

### Input validation

- **GIVEN** a user submits an empty or unsupported value
- **WHEN** the app validates the input
- **THEN** it keeps the user informed with an actionable error and does not
  produce a misleading pathway result.

### Alternative exploration

- **GIVEN** a pathway has been displayed
- **WHEN** the user changes their answers or requests another option
- **THEN** the app allows them to revise the input and explore alternatives.

### Grounded content

- **GIVEN** a pathway fact is shown
- **WHEN** a user reviews the information
- **THEN** the app identifies the relevant source or clearly labels the
  information as an estimate or user-provided preference.

### Accessibility

- **GIVEN** a user navigates with a keyboard or assistive technology
- **WHEN** they move through the app
- **THEN** controls are discoverable, focus is visible, and content has a
  meaningful semantic order.

## Technical constraints

- Use plain HTML5, CSS3, and vanilla JavaScript unless a requirement explicitly
  approves another approach.
- Keep pathway data separate from rendering and interaction logic.
- Keep tests deterministic and independent of external services.
- Run the smallest relevant checks, followed by `npm test` for application
  behavior changes.
