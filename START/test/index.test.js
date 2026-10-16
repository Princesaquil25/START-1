const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { main } = require("../src/index");
const {
  getCareerMatches,
  getMatchExplanation,
  getPreferenceExplanation,
  getPreparationNotes,
  getUnansweredQuestions,
  questionGroups,
  questionSteps,
  validateAnswers,
} = require("../src/app");
const {
  careerRecords: careerOptions,
  careerMatchingData,
} = require("../src/data/careers");

function createForm(answers) {
  return {
    querySelectorAll(selector) {
      const group = selector.match(/\[name="([^"]+)"\]/)[1];
      return (answers[group] || []).map((value) => ({ value }));
    },
  };
}

function makeAnswers(overrides = {}) {
  return {
    occupations: ["janitorial"],
    activities: ["none"],
    technologyTools: ["none"],
    technologyComfort: ["little"],
    education: ["no-credential"],
    trainingInterest: ["short-practice"],
    environment: ["unsure"],
    priorities: ["unsure"],
    ...overrides,
  };
}

test("main is exported as a function", () => {
  assert.equal(typeof main, "function");
});

test("the questionnaire has seven steps and validates all answer groups", () => {
  assert.equal(questionSteps.length, 7);
  assert.equal(questionGroups.length, 8);

  const answers = makeAnswers({ occupations: [] });
  assert.deepEqual(getUnansweredQuestions(createForm(answers)), ["occupations"]);
  assert.deepEqual(validateAnswers(answers), [
    { group: "occupations", reason: "required" },
  ]);
});

test("occupation selections contribute potential evidence even with no confirmed activities", () => {
  const withOccupation = getCareerMatches(
    createForm(makeAnswers({ activities: ["none"] })),
  );
  const withoutOccupation = getCareerMatches(
    createForm(makeAnswers({ occupations: ["none"], activities: ["none"] })),
  );

  assert.ok(withOccupation.length > 0);
  assert.ok(withOccupation.length <= 3);
  assert.ok(
    withOccupation.every(({ potentialSkillCount }) => potentialSkillCount > 0),
  );
  assert.deepEqual(withoutOccupation, []);
  assert.ok(
    withOccupation.some(({ career }) =>
      ["administrative-assistant", "records-clerk", "general-office-clerk"].includes(
        career.id,
      ),
    ),
  );
});

test("other or homemaking experience is not assigned inferred skills, while confirmed supply tracking is used", () => {
  const noConfirmedTasks = getCareerMatches(
    createForm(
      makeAnswers({ occupations: ["other"], activities: ["none"] }),
    ),
  );
  const confirmedSupplyTracking = getCareerMatches(
    createForm(
      makeAnswers({
        occupations: ["other"],
        activities: ["track-supplies"],
      }),
    ),
  );
  const inventoryMatch = confirmedSupplyTracking.find(({ career }) =>
    career.skillFamilies.includes("inventory-tracking"),
  );

  assert.deepEqual(noConfirmedTasks, []);
  assert.ok(inventoryMatch);
  assert.ok(
    inventoryMatch.skillEvidence.some(
      ({ family, confirmedSources }) =>
        family === "inventory-tracking" &&
        confirmedSources.some(({ value }) => value === "track-supplies"),
    ),
  );
  assert.equal(inventoryMatch.potentialSkillCount, 0);
});

test("multiple occupations and activity evidence combine without double-counting skill families", () => {
  const matches = getCareerMatches(
    createForm(
      makeAnswers({
        occupations: ["retail", "cashier", "warehouse"],
        activities: ["payments", "organize-documents"],
      }),
    ),
  );
  const billing = matches.find(
    ({ career }) => career.id === "billing-posting-clerk",
  );

  assert.ok(billing);
  const transactionEvidence = billing.skillEvidence.filter(
    ({ family }) => family === "transaction-accuracy",
  );
  assert.equal(transactionEvidence.length, 1);
  assert.deepEqual(
    transactionEvidence[0].potentialSources.map(({ value }) => value).sort(),
    ["cashier", "retail"],
  );
  assert.deepEqual(
    transactionEvidence[0].confirmedSources.map(({ value }) => value),
    ["payments"],
  );
  assert.equal(billing.confirmedSkillCount, 5);
  assert.equal(
    billing.skillEvidence.length,
    billing.confirmedSkillCount + billing.potentialSkillCount,
  );
});

test("confirmed activities carry more weight than potential occupational connections", () => {
  const potentialOnly = getCareerMatches(
    createForm(makeAnswers({ occupations: ["warehouse"] })),
  );
  const confirmedActivity = getCareerMatches(
    createForm(
      makeAnswers({
        occupations: ["none"],
        activities: ["organize-documents"],
      }),
    ),
  );
  const recordsMatch = confirmedActivity.find(
    ({ career }) => career.id === "records-clerk",
  );

  assert.ok(potentialOnly.length > 0);
  assert.ok(recordsMatch);
  assert.ok(recordsMatch.confirmedSkillCount > 0);
  assert.ok(recordsMatch.score >= 3);
  assert.ok(
    recordsMatch.skillEvidence.some(
      ({ confirmedSources }) => confirmedSources.length > 0,
    ),
  );
});

test("technology, education, and training personalize preparation without changing skill ranking", () => {
  const career = careerOptions.find(
    ({ id }) => id === "administrative-assistant",
  );
  const entryAnswers = makeAnswers({
    occupations: ["janitorial"],
    activities: ["organize-documents"],
  });
  const experiencedAnswers = makeAnswers({
    occupations: ["janitorial"],
    activities: ["organize-documents"],
    technologyTools: ["email", "spreadsheets"],
    technologyComfort: ["independent"],
    education: ["associate"],
    trainingInterest: ["structured-course"],
  });
  const entryNotes = getPreparationNotes(entryAnswers, career).join(" ");
  const experiencedNotes = getPreparationNotes(
    experiencedAnswers,
    career,
  ).join(" ");

  assert.match(entryNotes, /little or no experience with office computer tasks/i);
  assert.match(entryNotes, /does not reduce your transferable-skill match/);
  assert.match(entryNotes, /No formal credential yet/);
  assert.match(entryNotes, /short lessons or free practice/);
  assert.match(experiencedNotes, /email, spreadsheets/);
  assert.match(experiencedNotes, /Associate degree/);
  assert.match(experiencedNotes, /structured course/);

  const entryMatches = getCareerMatches(createForm(entryAnswers));
  const experiencedMatches = getCareerMatches(createForm(experiencedAnswers));
  assert.deepEqual(
    entryMatches.map(({ career: result, score }) => [result.id, score]),
    experiencedMatches.map(({ career: result, score }) => [result.id, score]),
  );
});

test("preferences refine results and are explained without promising conditions", () => {
  const career = careerOptions.find(({ id }) => id === "receptionist");
  const explanation = getPreferenceExplanation(
    makeAnswers({
      environment: ["people", "less-physical"],
      priorities: ["service", "predictable-hours"],
    }),
    career,
  );

  assert.match(explanation, /regular contact with people/);
  assert.match(explanation, /helping or serving people/);
  assert.match(explanation, /vary by employer/);
});

test("answer validation rejects incompatible selections, excessive priorities, and unknown values", () => {
  const invalidNone = validateAnswers(
    makeAnswers({ technologyTools: ["none", "email"] }),
  );
  assert.ok(
    invalidNone.some(
      ({ group, reason }) =>
        group === "technologyTools" && reason === "exclusive",
    ),
  );

  const invalidEducation = validateAnswers(
    makeAnswers({ education: ["no-credential", "associate"] }),
  );
  assert.ok(
    invalidEducation.some(
      ({ group, reason }) => group === "education" && reason === "single-choice",
    ),
  );

  const invalidNotSure = validateAnswers(
    makeAnswers({ education: ["unsure", "high-school"] }),
  );
  assert.ok(
    invalidNotSure.some(({ group }) => group === "education"),
  );

  const tooManyPriorities = validateAnswers(
    makeAnswers({ priorities: ["pay", "learning", "service", "advancement"] }),
  );
  assert.ok(
    tooManyPriorities.some(
      ({ group, reason }) =>
        group === "priorities" && reason === "maximum",
    ),
  );

  const unsupported = validateAnswers(
    makeAnswers({ technologyComfort: ["never-used-anything"] }),
  );
  assert.ok(
    unsupported.some(
      ({ group, reason }) =>
        group === "technologyComfort" && reason === "unsupported",
    ),
  );
});

test("Q3 tool exposure and comfort are separate and can validly coexist", () => {
  const errors = validateAnswers(
    makeAnswers({
      technologyTools: ["email", "smartphone"],
      technologyComfort: ["little"],
    }),
  );
  assert.deepEqual(errors, []);
});

test("all nine careers have complete, sourced profiles and preparation content", () => {
  const expectedCareerPathways = {
    "administrative-assistant": [
      "Administrative Assistant",
      "Office Coordinator",
      "Office Manager",
    ],
    receptionist: ["Receptionist", "Administrative Assistant", "Office Manager"],
    "customer-service-representative": [
      "Customer Service Representative",
      "Customer Service Supervisor",
      "Customer Service Manager",
    ],
    "medical-administrative-assistant": [
      "Medical Administrative Assistant",
      "Medical Records Specialist",
      "Medical Records Manager",
    ],
    "records-clerk": [
      "Records Clerk",
      "Documentation Specialist",
      "Administrative Services Manager",
    ],
  };

  assert.deepEqual(
    careerOptions.map(({ id }) => id),
    [
      "administrative-assistant",
      "receptionist",
      "customer-service-representative",
      "medical-administrative-assistant",
      "records-clerk",
      "general-office-clerk",
      "billing-posting-clerk",
      "eligibility-interviewer",
      "production-planning-clerk",
    ],
  );

  for (const career of careerOptions) {
    assert.ok(career.description.length > 80, `${career.id} description`);
    assert.ok(career.responsibilities.length >= 3, `${career.id} duties`);
    assert.ok(career.skills.length >= 4, `${career.id} skills`);
    assert.ok(career.qualifications.length > 100, `${career.id} qualifications`);
    assert.ok(career.transferableSkills.length >= 3, `${career.id} transfers`);
    assert.ok(career.developSkills.length >= 3, `${career.id} develop skills`);
    assert.ok(career.alternativeTitles.length >= 3, `${career.id} job titles`);
    assert.ok(career.nextSteps.length >= 3, `${career.id} next steps`);
    assert.ok(career.resources.length >= 2, `${career.id} learning resources`);
    assert.ok(career.sources.length >= 2, `${career.id} sources`);
    assert.ok(career.skillFamilies.length >= 5, `${career.id} matching families`);
    assert.ok(career.technologyNeeds.length > 0, `${career.id} technology needs`);
    assert.ok(career.preparationNote.length > 30, `${career.id} prep note`);
    if (expectedCareerPathways[career.id]) {
      assert.deepEqual(
        career.careerPathway,
        expectedCareerPathways[career.id],
        `${career.id} existing pathway`,
      );
    }
    for (const resource of career.resources) {
      assert.match(resource.url, /^https:\/\//, `${career.id} resource URL`);
      assert.ok(resource.detail.length > 15);
      assert.ok(resource.cost.length > 10);
    }
    for (const source of career.sources) {
      assert.match(source.url, /^https:\/\//, `${career.id} source URL`);
    }
  }
});

test("every occupation-to-skill connection has an occupational source", () => {
  const skillLabels = careerMatchingData.skillLabels;
  const occupationEntries = Object.values(careerMatchingData.occupations);

  assert.ok(occupationEntries.length >= 10);
  for (const occupation of occupationEntries) {
    assert.ok(occupation.taskBasis.length > 30);
    assert.ok(occupation.sources.length > 0);
    for (const family of occupation.skills) {
      assert.ok(skillLabels[family], `missing label for skill family ${family}`);
    }
    for (const source of occupation.sources) {
      assert.match(source.url, /^https:\/\/www\.onetonline\.org\//);
    }
  }
  for (const activity of Object.values(careerMatchingData.activities)) {
    for (const family of activity.skills) {
      assert.ok(skillLabels[family], `missing label for skill family ${family}`);
    }
  }
  for (const career of careerOptions) {
    for (const family of career.skillFamilies) {
      assert.ok(skillLabels[family], `missing label for skill family ${family}`);
    }
  }
});

test("match explanations distinguish confirmed activities from potential work-background connections", () => {
  const match = getCareerMatches(
    createForm(
      makeAnswers({
        occupations: ["janitorial"],
        activities: ["organize-documents"],
      }),
    ),
  ).find(({ career }) => career.id === "records-clerk");
  const explanation = getMatchExplanation(match);

  assert.match(explanation, /you confirmed doing activities related/i);
  assert.match(explanation, /typical tasks in selected work backgrounds may also involve/i);
  assert.match(explanation, /not a formal skills assessment/i);
  assert.equal(
    match.skillEvidence.filter(({ family }) => family === "organization").length,
    1,
  );
});

test("visitor pages contain the seven-question guided form and remain mirrored", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "../src/index.html"),
    "utf8",
  );
  const pagesRootHtml = fs.readFileSync(
    path.join(__dirname, "../../index.html"),
    "utf8",
  );
  const normalizedRoot = pagesRootHtml
    .replace('href="START/src/styles.css"', 'href="styles.css"')
    .replace('src="START/src/data/careers.js"', 'src="data/careers.js"')
    .replace('src="START/src/app.js"', 'src="app.js"');

  assert.equal(normalizedRoot, html);
  assert.equal((html.match(/data-question-step/g) || []).length, 7);
  assert.match(html, /Question 1 of 7/);
  assert.match(html, /max="7"/);
  assert.match(html, /What jobs have you worked in\? Select all that apply\./);
  assert.match(html, /homemaking, self-employment, or informal work/);
  assert.match(
    html,
    /Which of these activities have you done before\? Select all that apply\./,
  );
  assert.match(html, /Tracked or counted supplies, products, or inventory/);
  assert.match(html, /Which of these tools have you used before\? Select all that apply\./);
  assert.match(html, /How comfortable do you feel using technology for work tasks\?/);
  assert.match(html, /I have little or no experience with office computer tasks/);
  assert.match(html, /I can do some common tasks with help/);
  assert.match(html, /I can do common tasks on my own/);
  assert.match(html, /I feel comfortable learning new technology/);
  assert.match(html, /Which best describes your education or training\?/);
  assert.match(html, /name="education" value="no-credential"/);
  assert.match(html, /name="education" value="unsure"/);
  const educationQuestion = html.match(
    /<legend tabindex="-1">4\. Which best describes your education or training\?<\/legend>[\s\S]*?<\/fieldset>/,
  )?.[0];
  assert.ok(educationQuestion);
  assert.doesNotMatch(educationQuestion, /type="checkbox"/);
  assert.equal(
    (educationQuestion.match(/type="radio" name="education"/g) || []).length,
    9,
  );
  assert.match(html, /Choose up to three/);
  assert.match(html, /See my suggestions/);
  assert.match(html, /id="question-progress"/);
  assert.match(html, /id="question-back"/);
  assert.match(html, /id="question-next"/);
  assert.match(html, /id="change-answers"/);
  assert.match(html, /id="start-over"/);
  assert.match(html, /What are transferable skills\?/);
  assert.match(html, /About Your Results and Privacy/);
  assert.match(
    html.replace(/\s+/g, " "),
    /answers are processed locally in your browser and are not saved or transmitted to a server/,
  );
  assert.match(
    html.replace(/\s+/g, " "),
    /<svg class="hero-art"[^>]*aria-hidden="true"/,
  );
});

test("external career and learning links open securely in a new tab", () => {
  const app = fs.readFileSync(path.join(__dirname, "../src/app.js"), "utf8");
  const html = fs.readFileSync(
    path.join(__dirname, "../src/index.html"),
    "utf8",
  );
  const pagesRootHtml = fs.readFileSync(
    path.join(__dirname, "../../index.html"),
    "utf8",
  );

  assert.match(app, /link\.target = "_blank"/);
  assert.match(app, /link\.rel = "noopener noreferrer"/);
  for (const page of [html, pagesRootHtml]) {
    const navigation = page.match(/<nav\b[\s\S]*?<\/nav>/i)?.[0];
    assert.ok(navigation, "internal navigation should exist");
    assert.doesNotMatch(navigation, /\btarget\s*=/i);
  }
});

test("question answers are not persisted or transmitted by application code", () => {
  const app = fs.readFileSync(path.join(__dirname, "../src/app.js"), "utf8");
  assert.doesNotMatch(
    app,
    /\b(?:localStorage|sessionStorage|fetch|XMLHttpRequest|sendBeacon)\b/,
  );
});
