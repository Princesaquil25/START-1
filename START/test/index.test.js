const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { main } = require("../src/index");
const { getCareerMatches, getUnansweredQuestions } = require("../src/app");
const careerOptions = require("../src/data/careers");

test("main is exported as a function", () => {
  assert.equal(typeof main, "function");
});

test("the intake form requires an answer for every question", () => {
  const form = {
    querySelectorAll(selector) {
      if (selector.includes("activities")) {
        return [];
      }

      return selector.includes(":checked") ? [{}] : [];
    },
  };

  assert.deepEqual(getUnansweredQuestions(form), ["activities"]);
});

test("career matches return the three strongest answer-based options", () => {
  const answers = {
    activities: [
      "helping-people",
      "communication",
      "organizing",
      "scheduling",
      "documents",
    ],
    communication: ["problem-solving"],
    tasks: ["resolving"],
    software: ["practice"],
    workplace: ["service"],
  };
  const form = {
    querySelectorAll(selector) {
      const group = selector.match(/\[name="([^"]+)"\]/)[1];
      return (answers[group] || []).map((value) => ({ value }));
    },
  };

  const matches = getCareerMatches(form);

  assert.equal(matches.length, 3);
  assert.deepEqual(
    matches.map(({ career, score }) => [career.id, score]),
    [
      ["customer-service-representative", 5],
      ["administrative-assistant", 2],
      ["receptionist", 2],
    ],
  );
  assert.deepEqual(matches[0].matchedAnswers, {
    activities: ["helping-people", "communication"],
    communication: ["problem-solving"],
    tasks: ["resolving"],
    software: ["practice"],
    workplace: ["service"],
  });
});

test("multiple activity selections contribute at most one point", () => {
  const answers = {
    activities: ["helping-people", "organizing", "scheduling", "documents"],
    communication: [],
    tasks: [],
    software: [],
    workplace: [],
  };
  const form = {
    querySelectorAll(selector) {
      const group = selector.match(/\[name="([^"]+)"\]/)[1];
      return (answers[group] || []).map((value) => ({ value }));
    },
  };

  const matches = getCareerMatches(form);
  const administrativeAssistant = matches.find(
    ({ career }) => career.id === "administrative-assistant",
  );

  assert.equal(administrativeAssistant.score, 1);
  assert.deepEqual(administrativeAssistant.matchedAnswers.activities, [
    "organizing",
    "scheduling",
    "documents",
  ]);
});

test("each career has a local illustration file", () => {
  assert.equal(careerOptions.length, 5);

  for (const career of careerOptions) {
    assert.match(career.image, /^assets\/careers\/.+\.svg$/);
    assert.ok(
      fs.existsSync(path.join(__dirname, "../src", career.image)),
      `${career.title} illustration should exist`,
    );
  }
});
