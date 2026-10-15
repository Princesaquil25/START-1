const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { main } = require("../src/index");
const {
  getCareerMatches,
  getMatchExplanation,
  getUnansweredQuestions,
  questionGroups,
} = require("../src/app");
const careerOptions = require("../src/data/careers");

function createForm(answers) {
  return {
    querySelectorAll(selector) {
      const group = selector.match(/\[name="([^"]+)"\]/)[1];
      return (answers[group] || []).map((value) => ({ value }));
    },
  };
}

function createExplanationForm(answers, labels, questions) {
  return {
    querySelector(selector) {
      const [, groupName, value] =
        selector.match(/\[name="([^"]+)"\](?:\[value="([^"]+)"\])?/);
      return {
        closest(selectorName) {
          if (selectorName === "label") {
            return { textContent: labels[groupName][value] };
          }

          return {
            querySelector() {
              return { textContent: questions[groupName] };
            },
          };
        },
      };
    },
  };
}

test("main is exported as a function", () => {
  assert.equal(typeof main, "function");
});

test("the intake form requires an answer for every question", () => {
  const form = createForm({
    activities: [],
    communication: ["phone"],
    tasks: ["organizing"],
    software: ["practice"],
    workplace: ["general-office"],
  });

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
  const form = createForm(answers);

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
  const form = createForm(answers);

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

test("ties keep the career data order and return three options", () => {
  const emptyAnswers = Object.fromEntries(
    questionGroups.map(({ name }) => [name, []]),
  );
  const matches = getCareerMatches(createForm(emptyAnswers));

  assert.deepEqual(
    matches.map(({ career, score }) => [career.id, score]),
    [
      ["administrative-assistant", 0],
      ["receptionist", 0],
      ["customer-service-representative", 0],
    ],
  );
});

test("all five careers have complete, sourced, distinct profiles and resources", () => {
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
    assert.deepEqual(
      career.careerPathway,
      expectedCareerPathways[career.id],
      `${career.id} pathway`,
    );
    for (const resource of career.resources) {
      assert.match(resource.url, /^https:\/\//, `${career.id} resource URL`);
      assert.ok(resource.detail.length > 15);
      assert.ok(resource.cost.length > 10);
    }
    for (const source of career.sources) {
      assert.match(source.url, /^https:\/\//, `${career.id} source URL`);
    }
  }

  const roleSpecificResourceUrls = careerOptions.map(
    ({ resources }) => resources[0].url,
  );
  assert.equal(new Set(roleSpecificResourceUrls).size, careerOptions.length);
});

test("match explanations name the actual matched questions and answer choices", () => {
  const form = createExplanationForm(
    {},
    {
      activities: {
        organizing: "Organizing files, information, supplies, or schedules",
      },
      tasks: {
        scheduling: "Managing calendars, appointments, or meetings",
      },
    },
    {
      activities: "Which activities have you done before?",
      tasks: "Which work tasks sound most satisfying?",
    },
  );

  const explanation = getMatchExplanation(form, {
    activities: ["organizing"],
    tasks: ["scheduling"],
  });

  assert.match(explanation, /Which activities have you done before/);
  assert.match(explanation, /Organizing files, information/);
  assert.match(explanation, /Which work tasks sound most satisfying/);
  assert.match(explanation, /Managing calendars/);
});

test("zero-match explanations do not claim the role was personalized", () => {
  const explanation = getMatchExplanation(null, {});
  assert.match(explanation, /did not directly match/);
  assert.match(explanation, /not a personalized match/);
});

test("visitor page exposes the guided controls, privacy content, and decorative hero art", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "../src/index.html"),
    "utf8",
  );
  const pagesRootHtml = fs.readFileSync(
    path.join(__dirname, "../../index.html"),
    "utf8",
  );

  for (const page of [html, pagesRootHtml]) {
    const normalizedPage = page.replace(/\s+/g, " ");
    assert.equal((page.match(/data-question-step/g) || []).length, 5);
    assert.match(normalizedPage, /id="question-progress"/);
    assert.match(normalizedPage, /id="question-back"/);
    assert.match(normalizedPage, /id="question-next"/);
    assert.match(normalizedPage, /id="change-answers"/);
    assert.match(normalizedPage, /id="start-over"/);
    assert.match(normalizedPage, /Career exploration for adults/);
    assert.ok(
      normalizedPage.includes(
        "Discover where your transferable skills could take you.",
      ),
    );
    assert.ok(
      normalizedPage.includes(
        "Your experience may open doors to careers you haven’t considered.",
      ),
    );
    assert.doesNotMatch(
      normalizedPage,
      /Through five short questions, you’ll explore how skills developed/,
    );
    assert.match(
      normalizedPage,
      /skills developed through work, education, volunteering, and everyday responsibilities/,
    );
    assert.match(
      normalizedPage,
      /Answer five short questions about your experiences and preferences\. Explore how skills developed through work, education, volunteering, and everyday responsibilities may connect to new career opportunities\./,
    );
    assert.match(
      normalizedPage,
      /What are transferable skills\?/,
    );
    assert.equal(
      (normalizedPage.match(/What are transferable skills\?/g) || []).length,
      1,
    );
    assert.match(normalizedPage, /class="career-detail-section intro-transferable-skills"/);
    assert.match(
      normalizedPage,
      /Transferable skills are abilities you’ve developed through different experiences/,
    );
    assert.match(
      normalizedPage,
      /assisting customers can develop communication and problem-solving skills/,
    );
    assert.ok(
      normalizedPage.includes(
        "Your answers help identify office-based careers that may align with your transferable skills and work preferences.",
      ),
    );
    assert.match(
      normalizedPage,
      /optional learning resources, and practical next steps/,
    );
    const homepageOrder = [
      normalizedPage.indexOf(
        "Discover where your transferable skills could take you.",
      ),
      normalizedPage.indexOf(
        "Your experience may open doors to careers you haven’t considered.",
      ),
      normalizedPage.indexOf("Career Pathway Explorer helps adults"),
      normalizedPage.indexOf("What are transferable skills?"),
      normalizedPage.indexOf(">Explore your options</a>"),
      normalizedPage.indexOf('id="how-it-works"'),
    ];
    assert.ok(homepageOrder.every((position) => position >= 0));
    assert.ok(
      homepageOrder.every(
        (position, index) =>
          index === 0 || homepageOrder[index - 1] < position,
      ),
      "homepage hero content should appear before the button and How It Works",
    );
    assert.match(normalizedPage, /About Your Results and Privacy/);
    assert.doesNotMatch(normalizedPage, /Clear and transparent/i);
    assert.match(normalizedPage, /<h3 id="privacy-details-title">Your Privacy<\/h3>/);
    assert.match(
      normalizedPage,
      /<h3 id="results-details-title">Understanding Your Results<\/h3>/,
    );
    assert.doesNotMatch(
      normalizedPage,
      /What the questions ask|How your answers are handled|How matching works/,
    );
    assert.match(
      normalizedPage,
      /answers are processed locally in your browser and are not saved or transmitted to a server/,
    );
    assert.match(
      normalizedPage,
      /External resource websites do not receive your questionnaire answers/,
    );
    assert.match(
      normalizedPage,
      /The Bureau of Labor Statistics and O\*NET links support the occupation descriptions/,
    );
    assert.equal((page.match(/class="hero-art"/g) || []).length, 1);
    assert.match(
      normalizedPage,
      /<svg class="hero-art"[^>]*aria-hidden="true"/,
    );
    assert.doesNotMatch(normalizedPage, /<img\b/i);
  }

  const styles = fs.readFileSync(path.join(__dirname, "../src/styles.css"), "utf8");
  assert.match(
    styles,
    /@media \(max-width: 44rem\)[\s\S]*?\.hero-art\s*\{\s*display:\s*none;/,
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

test("question answers are not persisted or sent by application code", () => {
  const app = fs.readFileSync(path.join(__dirname, "../src/app.js"), "utf8");
  assert.doesNotMatch(
    app,
    /\b(?:localStorage|sessionStorage|fetch|XMLHttpRequest|sendBeacon)\b/,
  );
});
