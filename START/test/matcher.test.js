const test = require("node:test");
const assert = require("node:assert/strict");
const profiles = require("../src/data/careers");
const { compareCareers, normalizeTitle, validateInputs } = require("../src/app");

test("normalizes whitespace and capitalization", () => {
  assert.equal(normalizeTitle("  PROJECT   COORDINATOR "), "project coordinator");
});

test("compares shared and missing target skills", () => {
  const comparison = compareCareers("Customer Support Specialist", "Project Coordinator");
  assert.deepEqual(comparison.transferableSkills, ["clear communication", "problem solving", "documentation"]);
  assert.deepEqual(comparison.developmentSkills, ["organization", "time management"]);
  assert.equal(comparison.nextSteps.length, 3);
});

test("accepts normalized known titles", () => {
  const comparison = compareCareers("customer support specialist", profiles[1].title);
  assert.equal(comparison.current.title, profiles[0].title);
  assert.equal(comparison.target.title, profiles[1].title);
});

test("reports actionable validation errors", () => {
  assert.deepEqual(validateInputs("", ""), {
    currentTitle: "Enter your current job title.",
    targetTitle: "Choose a career you are interested in."
  });
  assert.deepEqual(validateInputs("Chef", "Project Coordinator"), {
    currentTitle: "Choose a current job title from the list."
  });
});
