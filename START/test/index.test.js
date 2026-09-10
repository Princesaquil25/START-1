const test = require("node:test");
const assert = require("node:assert/strict");
const { main } = require("../src/index");

test("main is exported as a function", () => {
  assert.equal(typeof main, "function");
});
