const test = require("node:test");
const assert = require("node:assert/strict");
const { main } = require("../src/index");
const { getUnansweredQuestions } = require("../src/app");

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
