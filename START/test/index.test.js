const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { main } = require("../src/index");
const {
  getCareerMatches,
  getMatchExplanation,
  getPreparationResources,
  getPreferenceExplanation,
  getPreparationNotes,
  getScopedMatches,
  getTransferableSkillConnections,
  buildShareText,
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
    englishSupport: [],
    trainingInterest: ["short-practice"],
    environment: ["unsure"],
    priorities: ["unsure"],
    ...overrides,
  };
}

test("main is exported as a function", () => {
  assert.equal(typeof main, "function");
});

test("the questionnaire has eight steps and validates its required answer groups", () => {
  assert.equal(questionSteps.length, 8);
  assert.equal(questionGroups.length, 9);

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

test("no-match guidance is welcoming, explains the result, and points back to answers", () => {
  const app = fs.readFileSync(path.join(__dirname, "../src/app.js"), "utf8");

  assert.match(app, /heading\.textContent = "No career matches yet"/);
  assert.match(
    app,
    /Your answers didn't show enough overlap with the careers in our guide to suggest a match\./,
  );
  assert.match(app, /Choose “Change my answers” to review your work backgrounds and activities/);
  assert.match(app, /we won't guess at a match/);
  assert.doesNotMatch(app, /occupation or activity evidence/);
});

test("broad other work is not assigned inferred skills, while confirmed supply tracking is used", () => {
  const noConfirmedTasks = getCareerMatches(
    createForm(
      makeAnswers({
        occupations: ["other"],
        activities: ["none"],
        technologyTools: ["payment-terminal"],
      }),
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

test("family-care and cashier backgrounds yield potential matches without inventing confirmed skills", () => {
  const familyCare = getCareerMatches(
    createForm(
      makeAnswers({
        occupations: ["family-care"],
        activities: ["none"],
        technologyTools: ["payment-terminal"],
      }),
    ),
  );
  const cashier = getCareerMatches(
    createForm(
      makeAnswers({
        occupations: ["cashier"],
        activities: ["none"],
        technologyTools: ["payment-terminal"],
      }),
    ),
  );
  const paymentTerminalOnly = getCareerMatches(
    createForm(
      makeAnswers({
        occupations: ["none"],
        activities: ["none"],
        technologyTools: ["payment-terminal"],
      }),
    ),
  );

  for (const matches of [familyCare, cashier]) {
    assert.ok(matches.length > 0);
    assert.ok(matches.every(({ confirmedSkillCount }) => confirmedSkillCount === 0));
    assert.ok(matches.every(({ potentialSkillCount }) => potentialSkillCount > 0));
    assert.ok(
      matches.every(({ skillEvidence }) =>
        skillEvidence.every(({ confirmedSources }) => confirmedSources.length === 0),
      ),
    );
  }
  assert.ok(
    familyCare[0].skillEvidence.some(({ potentialSources }) =>
      potentialSources.some(({ value }) => value === "family-care"),
    ),
  );
  assert.ok(
    cashier[0].skillEvidence.some(({ potentialSources }) =>
      potentialSources.some(({ value }) => value === "cashier"),
    ),
  );
  assert.deepEqual(paymentTerminalOnly, []);
  assert.match(
    getMatchExplanation(familyCare[0]),
    /if those tasks reflect your experience/i,
  );

  const combinedEvidence = getCareerMatches(
    createForm(
      makeAnswers({
        occupations: ["family-care"],
        activities: ["payments"],
      }),
    ),
  );
  assert.ok(
    combinedEvidence.some(
      ({ confirmedSkillCount, potentialSkillCount }) =>
        confirmedSkillCount > 0 && potentialSkillCount > 0,
    ),
  );
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

test("technology, education, English support, and training personalize preparation without changing skill ranking", () => {
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
    englishSupport: ["intermediate"],
    trainingInterest: ["structured-course"],
  });
  const entryNotes = getPreparationNotes(entryAnswers, career).join(" ");
  const experiencedNotes = getPreparationNotes(
    experiencedAnswers,
    career,
    getCareerMatches(createForm(experiencedAnswers))[0],
  ).join(" ");

  assert.match(entryNotes, /guided beginner lesson/i);
  assert.match(entryNotes, /high school diploma or equivalent/i);
  assert.match(entryNotes, /sample calendar/i);
  assert.doesNotMatch(entryNotes, /English-learning resources/i);
  assert.match(experiencedNotes, /typed documents|online forms or records/i);
  assert.match(experiencedNotes, /before enrolling/i);
  assert.match(experiencedNotes, /intermediate lessons and conversation practice/i);
  assert.match(experiencedNotes, /brief example of sorting, putting away/i);
  assert.doesNotMatch(experiencedNotes, /how you sorting/i);
  assert.doesNotMatch(experiencedNotes, /Associate degree/i);

  const entryMatches = getCareerMatches(createForm(entryAnswers));
  const experiencedMatches = getCareerMatches(
    createForm({
      ...experiencedAnswers,
      englishSupport: ["prefer-not"],
      education: ["bachelor"],
    }),
  );
  assert.deepEqual(
    entryMatches.map(({ career: result, score }) => [result.id, score]),
    experiencedMatches.map(({ career: result, score }) => [result.id, score]),
  );
});

test("English resources adapt to the selected level and remain optional", () => {
  const career = careerOptions.find(
    ({ id }) => id === "general-office-clerk",
  );
  const baseAnswers = makeAnswers({
    englishSupport: [],
    education: ["high-school"],
    technologyTools: ["email", "documents", "spreadsheets", "online-records"],
    technologyComfort: ["independent"],
  });
  const resourcesFor = (englishSupport) =>
    getPreparationResources({ ...baseAnswers, englishSupport }, career);
  const beginnerResources = resourcesFor(["beginning"]);
  const intermediateResources = resourcesFor(["intermediate"]);
  const advancedResources = resourcesFor(["advanced"]);
  const noSupportResources = [
    ...resourcesFor(["no-support"]),
    ...resourcesFor(["prefer-not"]),
    ...resourcesFor([]),
  ];
  const englishUrls = (resources) =>
    resources.map(({ url }) => url).filter((url) =>
      /usalearns\.org|english-conversation-tips/.test(url),
    );

  assert.ok(englishUrls(beginnerResources).includes("https://www.usalearns.org/"));
  assert.ok(englishUrls(intermediateResources).includes("https://www.usalearns.org/"));
  assert.ok(englishUrls(beginnerResources).some((url) => url.includes("/english-conversation-tips/")));
  assert.match(
    beginnerResources.find(({ url }) => url === "https://www.usalearns.org/").detail,
    /beginner lessons/i,
  );
  assert.match(
    intermediateResources.find(({ url }) => url === "https://www.usalearns.org/").detail,
    /intermediate lessons/i,
  );
  assert.deepEqual(
    englishUrls(advancedResources),
    ["https://usahello.org/education/learn-english-language/english-conversation-tips/"],
  );
  assert.deepEqual(englishUrls(noSupportResources), []);

  const beginnerNote = getPreparationNotes(
    { ...baseAnswers, englishSupport: ["beginning"] },
    career,
  ).join(" ");
  const advancedNote = getPreparationNotes(
    { ...baseAnswers, englishSupport: ["advanced"] },
    career,
  ).join(" ");
  assert.match(beginnerNote, /beginner English lessons/i);
  assert.match(advancedNote, /don't list an advanced-specific English course/i);
});

test("GED and computer resources are conditional and deduplicated", () => {
  const career = careerOptions.find(
    ({ id }) => id === "administrative-assistant",
  );
  const answers = makeAnswers({
    education: ["some-high-school"],
    technologyTools: ["none"],
    technologyComfort: ["little"],
  });
  const resources = getPreparationResources(answers, career);
  const urls = resources.map(({ url }) => url);
  assert.ok(urls.includes("https://classroom.usahello.org/ged/"));
  assert.ok(urls.includes("https://support.microsoft.com/en-us/word"));
  assert.ok(urls.includes("https://support.microsoft.com/en-us/excel"));
  assert.equal(new Set(urls).size, urls.length);

  const preparedAnswers = {
    ...answers,
    education: ["high-school"],
    technologyTools: ["email", "documents", "spreadsheets", "calendar"],
    technologyComfort: ["independent"],
  };
  const preparedResources = getPreparationResources(preparedAnswers, career);
  assert.equal(
    preparedResources.some(({ url }) => url.includes("usahello.org/ged")),
    false,
  );
  assert.deepEqual(preparedResources, career.resources);
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

test("English skill levels are optional and do not alter career ranking", () => {
  const base = makeAnswers({ englishSupport: [] });
  assert.deepEqual(validateAnswers(base), []);
  assert.deepEqual(getUnansweredQuestions(createForm(base)), []);

  const matchesWithoutAnswer = getCareerMatches(createForm(base));
  for (const level of [
    "beginning",
    "basic",
    "intermediate",
    "advanced",
    "no-support",
    "prefer-not",
  ]) {
    const matchesWithLevel = getCareerMatches(
      createForm({ ...base, englishSupport: [level] }),
    );
    assert.deepEqual(
      matchesWithoutAnswer.map(({ career, score }) => [career.id, score]),
      matchesWithLevel.map(({ career, score }) => [career.id, score]),
      `${level} must not affect career ranking`,
    );
  }

  const invalidMultipleChoice = validateAnswers(
    makeAnswers({ englishSupport: ["beginning", "basic"] }),
  );
  assert.ok(
    invalidMultipleChoice.some(
      ({ group, reason }) =>
        group === "englishSupport" && reason === "single-choice",
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
  const expectedActivitySkills = {
    "calls-visitors": ["communication", "customer-service", "coordination"],
    "explain-resolve": ["communication", "customer-service", "problem-solving"],
    scheduling: ["scheduling", "coordination", "accuracy"],
    "enter-check-records": ["recordkeeping", "accuracy", "digital-systems"],
    "organize-documents": [
      "document-management",
      "organization",
      "accuracy",
      "recordkeeping",
    ],
    "prepare-documents": [
      "written-communication",
      "document-management",
      "accuracy",
    ],
    "team-coordination": ["communication", "teamwork", "coordination"],
    payments: ["transaction-accuracy", "numeracy", "recordkeeping", "accuracy"],
    "track-supplies": [
      "inventory-tracking",
      "accuracy",
      "coordination",
      "recordkeeping",
      "observation-reporting",
    ],
  };

  assert.ok(occupationEntries.length >= 10);
  for (const occupation of occupationEntries) {
    assert.ok(occupation.taskBasis.length > 30);
    assert.ok(occupation.connectionText.length > 10);
    assert.ok(occupation.sources.length > 0);
    for (const family of occupation.skills) {
      assert.ok(skillLabels[family], `missing label for skill family ${family}`);
      const groupId = Object.keys(careerMatchingData.connectionGroups).find(
        (key) =>
          careerMatchingData.connectionGroups[key].families.includes(family),
      );
      assert.ok(occupation.connectionTexts[groupId]);
    }
    for (const source of occupation.sources) {
      assert.match(source.url, /^https:\/\/www\.onetonline\.org\//);
    }
  }
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(careerMatchingData.activities).map(([id, activity]) => [
        id,
        activity.skills,
      ]),
    ),
    expectedActivitySkills,
  );
  for (const activity of Object.values(careerMatchingData.activities)) {
    assert.ok(activity.connectionText.length > 10);
    for (const family of activity.skills) {
      assert.ok(skillLabels[family], `missing label for skill family ${family}`);
    }
  }
  const groupedFamilies = new Set(
    Object.values(careerMatchingData.connectionGroups).flatMap(
      ({ families }) => families,
    ),
  );
  for (const family of Object.keys(skillLabels)) {
    assert.ok(groupedFamilies.has(family), `missing connection group for ${family}`);
  }
  for (const career of careerOptions) {
    for (const family of career.skillFamilies) {
      assert.ok(skillLabels[family], `missing label for skill family ${family}`);
      const group = Object.values(careerMatchingData.connectionGroups).find(
        ({ families }) => families.includes(family),
      );
      assert.ok(group);
      const groupId = Object.keys(careerMatchingData.connectionGroups).find(
        (key) => careerMatchingData.connectionGroups[key] === group,
      );
      assert.ok(career.connectionUses[groupId], `${career.id}: ${groupId}`);
    }
    assert.ok(career.preparationTask.text.length > 20);
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

  assert.match(explanation, /your confirmed experience with/i);
  assert.match(explanation, /work backgrounds such as janitorial or custodial cleaning may involve tasks such as/i);
  assert.doesNotMatch(explanation, /skill family|potential connection from selected work/i);
  assert.equal(
    match.skillEvidence.filter(({ family }) => family === "organization").length,
    1,
  );
});

test("career-specific transferable-skill explanations combine confirmed and potential evidence", () => {
  const match = getCareerMatches(
    createForm(
      makeAnswers({
        occupations: ["janitorial", "manufacturing"],
        activities: ["enter-check-records", "organize-documents"],
      }),
    ),
  ).find(({ career }) => career.id === "general-office-clerk");
  const connections = getTransferableSkillConnections(match, match.career);
  const information = connections.find(
    ({ label }) => label === "Organization and recordkeeping",
  );

  assert.ok(information);
  assert.match(information.text, /You've confirmed .*filling out forms, checking information/i);
  assert.match(information.text, /Janitorial or custodial cleaning/i);
  assert.match(information.text, /sorting, putting away/i);
  assert.ok(connections.length <= 4);
  assert.doesNotMatch(
    connections.map(({ text }) => text).join(" "),
    /potential connection from selected work|activity you said you have done|formal skill rating/i,
  );
});

test("result scope and share text include only the requested recommendations", () => {
  const answers = makeAnswers({
    occupations: ["retail", "warehouse"],
    activities: ["calls-visitors", "payments"],
  });
  const matches = getCareerMatches(createForm(answers));
  const selectedId = matches[0].career.id;
  const selectedMatches = getScopedMatches(matches, "selected", [selectedId]);
  const completeText = buildShareText(matches, answers, "complete", []);
  const selectedText = buildShareText(matches, answers, "selected", [selectedId]);

  assert.equal(selectedMatches.length, 1);
  assert.equal(selectedMatches[0].career.id, selectedId);
  assert.deepEqual(getScopedMatches(matches, "selected", []), []);
  assert.match(completeText, /Typical responsibilities/);
  assert.match(completeText, /Occupational sources/);
  assert.match(selectedText, new RegExp(matches[0].career.title));
  const selectedCareerHeadings = Array.from(
    selectedText.matchAll(/^Career: (.+)$/gm),
    ([, title]) => title,
  );
  assert.deepEqual(selectedCareerHeadings, [matches[0].career.title]);
  assert.equal(buildShareText(matches, answers, "selected", []), "");
});

test("print and sharing use browser controls with explicit cancellation and fallback messages", () => {
  const app = fs.readFileSync(path.join(__dirname, "../src/app.js"), "utf8");
  const html = fs.readFileSync(
    path.join(__dirname, "../src/index.html"),
    "utf8",
  );

  assert.match(app, /window\.print\(\)/);
  assert.match(app, /navigator\.share\(\{/);
  assert.match(app, /error\?\.name === "AbortError"/);
  assert.match(app, /navigator\.clipboard\.writeText\(text\)/);
  assert.match(app, /Sharing could not be completed/);
  assert.match(app, /printButton\.textContent = "Print or save this career"/);
  assert.match(
    app,
    /printSelection\(\{ scope: "selected", matches \}, true\)/,
  );
  assert.match(app, /details\.open = true/);
  assert.match(
    app,
    /appendLinksSection\(\s*detailContent,\s*"Free learning resources \(optional\)"/,
  );
  assert.match(
    app,
    /appendListSection\(\s*detailContent,\s*"Practical next steps"/,
  );
  assert.match(app, /appendCareerPathwaySection\(detailContent/);
  assert.match(
    app,
    /appendLinksSection\(detailContent, "Occupational sources"/,
  );
  assert.match(html, /Save as PDF opens your browser's print dialog/);
  assert.ok(
    html.indexOf('id="result-tools"') >
      html.indexOf("</ol>", html.indexOf('id="recommendation-list"')),
  );
  assert.ok(
    html.indexOf('id="result-tools"') <
      html.indexOf("About Your Results and Privacy"),
  );
  assert.doesNotMatch(app, /navigator\.share\(\s*\{[^}]*\burl\s*:/s);
});

test("visitor pages contain the eight-step guided form, result tools, and remain mirrored", () => {
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
  const intro = html.match(/<section id="welcome"[\s\S]*?<\/section>/)?.[0];
  assert.ok(intro);
  const normalizedIntro = intro.replace(/\s+/g, " ");
  assert.match(
    normalizedIntro,
    /<h1 id="page-title"> Your experience may open doors to careers you haven't considered\. <\/h1>/,
  );
  assert.match(
    normalizedIntro,
    /Career Pathway Explorer is designed for adults looking to transition from jobs in retail, manufacturing, cleaning, food service, caregiving, and other fields into entry-level administrative and office-based careers\./,
  );
  assert.match(
    normalizedIntro,
    /Through a skills-based assessment, you'll discover how the skills you've gained through previous work may transfer to new career opportunities\. You'll explore potential career matches, understand why they may be a good fit, and receive personalized next steps and free learning resources to help you prepare\./,
  );
  assert.match(
    normalizedIntro,
    /<p class="intro-note"> <strong>No previous office experience is required to get started\.<\/strong> <\/p>/,
  );
  assert.equal((html.match(/data-question-step/g) || []).length, 8);
  assert.match(html, /Question 1 of 8/);
  assert.match(html, /max="8"/);
  assert.match(html, /What jobs have you worked in\? Select all that apply\./);
  assert.match(html, /homemaking, self-employment, or informal work/);
  assert.match(
    html,
    /name="occupations" value="family-care" \/><span>Stay-at-home parenting or unpaid family caregiving<\/span>/,
  );
  assert.match(
    html,
    /Which of these activities have you done before\? Select all that apply\./,
  );
  const expectedActivities = [
    ["calls-visitors", "Welcomed or directed people, took a message, or passed a question to someone who could help"],
    ["explain-resolve", "Helped people with questions, explained what to do, or solved problems"],
    ["scheduling", "Organized schedules, appointments, activities, or deliveries"],
    ["enter-check-records", "Filled out forms, checked information, or kept track of important details"],
    ["organize-documents", "Sorted, put away, or found papers, forms, or records when needed"],
    ["prepare-documents", "Wrote or updated notes, messages, instructions, or reports"],
    ["team-coordination", "Worked with others to organize tasks, share updates, or get things done"],
    ["payments", "Counted money, handled payments, or checked totals"],
    ["track-supplies", "Kept track of supplies, products, or things that needed replacing"],
  ];
  assert.match(
    html,
    /Think about things you've done in paid work, volunteering, or responsibilities at home/,
  );
  for (const [id, activity] of expectedActivities) {
    assert.ok(html.includes(`<span>${activity}</span>`), activity);
    assert.equal(careerMatchingData.activities[id].label, activity);
  }
  assert.match(html, /Which of these tools have you used before\? Select all that apply\./);
  assert.match(html, /How comfortable do you feel using technology for work tasks\?/);
  assert.match(html, /I have little or no experience using a computer for work/);
  assert.match(html, /I can do basic computer tasks with help/);
  assert.match(html, /I can do common computer tasks on my own/);
  assert.match(html, /I feel comfortable learning new technology for work/);
  assert.match(html, /Which best describes your education or training\?/);
  assert.match(html, /name="education" value="no-credential"/);
  assert.match(html, /name="education" value="unsure"/);
  assert.match(html, /5\. How would you describe your current English skills\?/);
  const englishQuestion = html.match(
    /<legend tabindex="-1">5\. How would you describe your current English skills\?<\/legend>[\s\S]*?<\/fieldset>/,
  )?.[0];
  assert.ok(englishQuestion);
  const englishQuestionText = englishQuestion
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ");
  assert.doesNotMatch(englishQuestion, /required/);
  assert.equal(
    (englishQuestion.match(/type="radio" name="englishSupport"/g) || []).length,
    6,
  );
  for (const level of ["beginning", "basic", "intermediate", "advanced"]) {
    assert.match(englishQuestion, new RegExp(`value="${level}"`));
  }
  assert.match(englishQuestion, /I don't need English-language support/);
  assert.match(englishQuestion, /Prefer not to answer/);
  assert.match(englishQuestion, /does not affect career matches/);
  assert.match(
    englishQuestionText,
    /Beginning: I'm just starting to learn English and understand or speak only a little/,
  );
  assert.match(
    englishQuestionText,
    /Basic: I can understand and use some everyday English, but need more practice/,
  );
  assert.match(
    englishQuestionText,
    /Intermediate: I can communicate in everyday situations but would like to improve my English for work/,
  );
  assert.match(
    englishQuestionText,
    /Advanced: I'm comfortable communicating in English but would like to strengthen my professional English/,
  );
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
  assert.match(html, /id="results-scope"/);
  assert.match(html, /value="complete"/);
  assert.match(html, /value="selected"/);
  assert.match(html, /id="career-scope-list"/);
  assert.match(html, /id="print-results"/);
  assert.match(html, /id="save-pdf"/);
  assert.match(html, /id="share-results"/);
  assert.match(html, /id="result-action-status"[^>]*aria-live="polite"/);
  assert.match(html, /About Your Results and Privacy/);
  assert.match(
    html.replace(/\s+/g, " "),
    /answers are processed locally in your browser and are not saved or transmitted to a server/,
  );
  assert.match(
    html.replace(/\s+/g, " "),
    /<svg class="hero-art"[^>]*aria-hidden="true"/,
  );
  const css = fs.readFileSync(path.join(__dirname, "../src/styles.css"), "utf8");
  assert.match(css, /@media print/);
  assert.match(css, /data-print-scope="selected"/);
  assert.match(css, /body\.printing-results \.career-print-action/);
  assert.match(
    css,
    /body\.printing-results \.career-details > :not\(summary\)/,
  );
  assert.match(css, /attr\(href\)/);
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
