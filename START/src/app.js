const questionGroups = [
  {
    name: "occupations",
    multiple: true,
    required: true,
    exclusiveOptions: ["none"],
  },
  {
    name: "activities",
    multiple: true,
    required: true,
    exclusiveOptions: ["none"],
  },
  {
    name: "technologyTools",
    multiple: true,
    required: true,
    exclusiveOptions: ["none", "unsure"],
  },
  { name: "technologyComfort", multiple: false, required: true },
  { name: "education", multiple: false, required: true },
  { name: "englishSupport", multiple: false, required: false },
  { name: "trainingInterest", multiple: false, required: true },
  {
    name: "environment",
    multiple: true,
    required: true,
    exclusiveOptions: ["unsure"],
  },
  {
    name: "priorities",
    multiple: true,
    required: true,
    maxSelections: 3,
    exclusiveOptions: ["unsure"],
  },
];

const questionSteps = [
  ["occupations"],
  ["activities"],
  ["technologyTools", "technologyComfort"],
  ["education"],
  ["englishSupport"],
  ["trainingInterest"],
  ["environment"],
  ["priorities"],
];

const careerData =
  typeof module !== "undefined"
    ? require("./data/careers")
    : {
        careerRecords: globalThis.careerOptions,
        careerMatchingData: globalThis.careerMatchingData,
      };
const careerProfiles = careerData.careerRecords;
const matchingRules = careerData.careerMatchingData;
const connectionGroupByFamily = new Map(
  Object.entries(matchingRules.connectionGroups).flatMap(
    ([groupId, group]) => group.families.map((family) => [family, groupId]),
  ),
);

const technologyToolLabels = {
  smartphone: "a smartphone or tablet",
  "payment-terminal": "a cash register or payment terminal",
  email: "email",
  documents: "typed documents",
  spreadsheets: "spreadsheets",
  "online-records": "online forms or records",
  calendar: "calendar or scheduling tools",
  "inventory-system": "an inventory or order system",
};

const answerLabels = {
  technologyComfort: {
    little: "I have little or no experience using a computer for work",
    guided: "I can do basic computer tasks with help",
    independent: "I can do common computer tasks on my own",
    learning: "I feel comfortable learning new technology for work",
  },
  education: {
    "no-credential": "No formal credential yet",
    "some-high-school": "Some high school",
    "high-school": "High school diploma or equivalent",
    "some-college": "Some college/university",
    certificate: "Certificate, license, or technical/vocational training",
    apprenticeship: "Apprenticeship or workplace training",
    associate: "Associate degree",
    bachelor: "Bachelor’s degree or higher",
    unsure: "Not sure / prefer not to answer",
  },
  englishSupport: {
    beginning: "Beginning",
    basic: "Basic",
    intermediate: "Intermediate",
    advanced: "Advanced",
    "no-support": "I don't need English-language support",
    "prefer-not": "Prefer not to answer",
  },
  trainingInterest: {
    "short-practice": "Open to short lessons or free practice",
    "structured-course": "Would consider a certificate or structured course",
    "extended-training": "Could spend more time training if the career seems right",
    "learn-on-job": "Prefer to start with current skills and learn on the job",
    unsure: "Not sure yet",
    "not-now": "Not looking for additional training now",
  },
};

const environmentLabels = {
  indoors: "mostly indoors",
  "less-physical": "less lifting or heavy physical work",
  desk: "mostly desk/computer work",
  movement: "some standing or moving",
  people: "regular contact with people",
  independent: "more independent or quieter work",
  team: "working with a team",
  onsite: "on-site work",
};

const englishSupportLevels = new Set([
  "beginning",
  "basic",
  "intermediate",
  "advanced",
]);

const priorityLabels = {
  pay: "better pay potential",
  "predictable-hours": "more predictable hours",
  "less-physical": "less physically demanding work",
  learning: "a chance to learn",
  advancement: "an opportunity to advance over time",
  service: "helping or serving people",
};

function getCheckedAnswers(form, groupName) {
  return Array.from(
    form.querySelectorAll(`[name="${groupName}"]:checked`),
    (input) => input.value,
  );
}

function getAnswersByGroup(form) {
  return Object.fromEntries(
    questionGroups.map((group) => [
      group.name,
      getCheckedAnswers(form, group.name),
    ]),
  );
}

function getUnansweredQuestions(form) {
  const answersByGroup = getAnswersByGroup(form);
  return questionGroups
    .filter(
      (group) => group.required && answersByGroup[group.name].length === 0,
    )
    .map((group) => group.name);
}

function getAllowedAnswers(groupName) {
  const answerSets = {
    occupations: [
      ...Object.keys(matchingRules.occupations),
      "other",
      "none",
    ],
    activities: [...Object.keys(matchingRules.activities), "none"],
    technologyTools: [...Object.keys(technologyToolLabels), "none", "unsure"],
    technologyComfort: Object.keys(answerLabels.technologyComfort),
    education: Object.keys(answerLabels.education),
    englishSupport: Object.keys(answerLabels.englishSupport),
    trainingInterest: Object.keys(answerLabels.trainingInterest),
    environment: [...Object.keys(environmentLabels), "unsure"],
    priorities: [...Object.keys(priorityLabels), "unsure"],
  };
  return new Set(answerSets[groupName] || []);
}

function validateAnswers(answersByGroup) {
  const errors = [];

  for (const group of questionGroups) {
    const answers = answersByGroup[group.name] || [];
    if (group.required && answers.length === 0) {
      errors.push({ group: group.name, reason: "required" });
      continue;
    }
    if (answers.some((value) => !getAllowedAnswers(group.name).has(value))) {
      errors.push({ group: group.name, reason: "unsupported" });
      continue;
    }
    if (!group.multiple && answers.length > 1) {
      errors.push({ group: group.name, reason: "single-choice" });
      continue;
    }
    if (group.maxSelections && answers.length > group.maxSelections) {
      errors.push({ group: group.name, reason: "maximum" });
      continue;
    }
    if (
      group.exclusiveOptions?.some((value) => answers.includes(value)) &&
      answers.length > 1
    ) {
      errors.push({ group: group.name, reason: "exclusive" });
    }
  }

  return errors;
}

function buildSkillEvidence(answersByGroup) {
  const evidenceByFamily = new Map();
  const addEvidence = (family, evidenceType, source) => {
    if (!evidenceByFamily.has(family)) {
      evidenceByFamily.set(family, {
        family,
        confirmedSources: [],
        potentialSources: [],
      });
    }
    const sources =
      evidenceType === "confirmed"
        ? evidenceByFamily.get(family).confirmedSources
        : evidenceByFamily.get(family).potentialSources;
    if (!sources.some((existing) => existing.value === source.value)) {
      sources.push(source);
    }
  };

  for (const value of answersByGroup.occupations || []) {
    const occupation = matchingRules.occupations[value];
    if (!occupation) {
      continue;
    }
    const source = {
      value,
      label: occupation.label,
      taskBasis: occupation.taskBasis,
    };
    for (const family of occupation.skills) {
      const groupId = connectionGroupByFamily.get(family);
      addEvidence(family, "potential", {
        ...source,
        connectionText:
          occupation.connectionTexts?.[groupId] || occupation.connectionText,
      });
    }
  }

  for (const value of answersByGroup.activities || []) {
    const activity = matchingRules.activities[value];
    if (!activity) {
      continue;
    }
    const source = {
      value,
      label: activity.label,
      connectionText: activity.connectionText,
    };
    for (const family of activity.skills) {
      addEvidence(family, "confirmed", source);
    }
  }

  return evidenceByFamily;
}

function joinReadable(items) {
  if (items.length < 2) {
    return items[0] || "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function getPreferenceScore(career, answersByGroup) {
  const selectedEnvironment = answersByGroup.environment || [];
  const selectedPriorities = answersByGroup.priorities || [];
  const aligned = new Set([
    ...career.environmentPreferences.filter((value) =>
      selectedEnvironment.includes(value),
    ),
    ...career.priorityPreferences.filter((value) =>
      selectedPriorities.includes(value),
    ),
  ]);
  return aligned.size;
}

function getCareerMatches(form) {
  const answersByGroup = getAnswersByGroup(form);
  const skillEvidence = buildSkillEvidence(answersByGroup);

  return careerProfiles
    .map((career, index) => {
      const careerFamilies = new Set(career.skillFamilies);
      const relevantEvidence = [...skillEvidence.values()].filter(({ family }) =>
        careerFamilies.has(family),
      );
      const confirmedSkillCount = relevantEvidence.filter(
        ({ confirmedSources }) => confirmedSources.length > 0,
      ).length;
      const potentialSkillCount = relevantEvidence.filter(
        ({ confirmedSources, potentialSources }) =>
          confirmedSources.length === 0 && potentialSources.length > 0,
      ).length;

      return {
        career,
        confirmedSkillCount,
        potentialSkillCount,
        score: confirmedSkillCount * 3 + potentialSkillCount,
        preferenceScore: getPreferenceScore(career, answersByGroup),
        skillEvidence: relevantEvidence,
        index,
      };
    })
    .filter(
      ({ confirmedSkillCount, potentialSkillCount }) =>
        confirmedSkillCount + potentialSkillCount > 0,
    )
    .sort(
      (first, second) =>
        second.score - first.score ||
        second.confirmedSkillCount - first.confirmedSkillCount ||
        second.potentialSkillCount - first.potentialSkillCount ||
        second.preferenceScore - first.preferenceScore ||
        first.index - second.index,
    )
    .slice(0, 3);
}

function showMessage(message, type) {
  const messageElement = document.querySelector("#form-message");
  messageElement.textContent = message;
  messageElement.className = type ? `form-message ${type}` : "form-message";
}

function getAnswerLabel(form, groupName, value) {
  const input = form.querySelector(
    `[name="${groupName}"][value="${value}"]`,
  );
  const label = input?.closest("label");

  if (!label) {
    throw new Error(
      `Could not find the label for "${value}" in the "${groupName}" question.`,
    );
  }

  return label.textContent.replace(/\s+/g, " ").trim();
}

function getMatchExplanation(match) {
  const statements = [];
  const confirmedActivities = [
    ...new Map(
      match.skillEvidence
        .flatMap(({ confirmedSources }) => confirmedSources)
        .map((source) => [source.value, source]),
    ).values(),
  ];
  const potentialOccupations = [
    ...new Map(
      match.skillEvidence
        .flatMap(({ potentialSources }) => potentialSources)
        .map((source) => [source.value, source]),
    ).values(),
  ];

  if (confirmedActivities.length > 0) {
    statements.push(
      `Your confirmed experience with ${joinReadable(
        confirmedActivities
          .map(({ connectionText }) => connectionText)
          .filter(Boolean)
          .slice(0, 2),
      )} could support similar tasks in this career.`,
    );
  }
  if (potentialOccupations.length > 0) {
    const possibleTasks = [
      ...new Set(
        match.skillEvidence
          .flatMap(({ potentialSources }) => potentialSources)
          .map(({ connectionText }) => connectionText)
          .filter(Boolean),
      ),
    ].slice(0, 2);
    statements.push(
      `Work backgrounds such as ${joinReadable(
        potentialOccupations.map(({ label }) => label),
      )} may involve tasks such as ${joinReadable(
        possibleTasks,
      )}; if those tasks reflect your experience, they may also be useful here.`,
    );
  }

  return statements.join(" ");
}

function getPreferenceExplanation(answersByGroup, career) {
  const selectedEnvironment = answersByGroup.environment || [];
  const selectedPriorities = answersByGroup.priorities || [];
  const alignedPreferences = new Set([
    ...career.environmentPreferences.filter((value) =>
      selectedEnvironment.includes(value),
    ),
    ...career.priorityPreferences.filter((value) =>
      selectedPriorities.includes(value),
    ),
  ]);

  if (alignedPreferences.size === 0) {
    return "Your work preferences were considered alongside the experience suggested by your answers. Duties and working conditions vary by employer.";
  }

  const alignedLabels = [...alignedPreferences].map(
    (value) => environmentLabels[value] || priorityLabels[value],
  );
  return `Your preferences for ${joinReadable(
    alignedLabels,
  )} may fit this role. Actual duties and working conditions vary by employer.`;
}

function appendListSection(container, headingText, items) {
  const section = document.createElement("section");
  section.className = "career-detail-section";

  const heading = document.createElement("h4");
  heading.textContent = headingText;

  const list = document.createElement("ul");
  for (const itemText of items) {
    const item = document.createElement("li");
    item.textContent = itemText;
    list.append(item);
  }

  section.append(heading, list);
  container.append(section);
}

function appendParagraphSection(container, headingText, paragraphText) {
  const section = document.createElement("section");
  section.className = "career-detail-section";

  const heading = document.createElement("h4");
  heading.textContent = headingText;
  const paragraph = document.createElement("p");
  paragraph.textContent = paragraphText;

  section.append(heading, paragraph);
  container.append(section);
}

function getTransferableSkillConnections(match, career) {
  const groupedEvidence = new Map();

  for (const evidence of match.skillEvidence) {
    const groupId = connectionGroupByFamily.get(evidence.family);
    if (!groupId) {
      continue;
    }
    if (!groupedEvidence.has(groupId)) {
      groupedEvidence.set(groupId, {
        groupId,
        confirmedSources: [],
        potentialSources: [],
      });
    }
    const group = groupedEvidence.get(groupId);
    for (const source of evidence.confirmedSources) {
      if (!group.confirmedSources.some((existing) => existing.value === source.value)) {
        group.confirmedSources.push(source);
      }
    }
    for (const source of evidence.potentialSources) {
      if (!group.potentialSources.some((existing) => existing.value === source.value)) {
        group.potentialSources.push(source);
      }
    }
  }

  return [...groupedEvidence.values()]
    .map((evidence) => {
      const connectionUse = career.connectionUses[evidence.groupId];
      if (!connectionUse) {
        throw new Error(
          `Missing career connection wording for "${career.id}" and "${evidence.groupId}".`,
        );
      }

      const confirmedActions = [
        ...new Set(
          evidence.confirmedSources
            .map(({ connectionText }) => connectionText)
            .filter(Boolean),
        ),
      ].slice(0, 2);
      const potentialSources = evidence.potentialSources.slice(0, 2);
      const potentialActions = [
        ...new Set(
          potentialSources
            .map(({ connectionText }) => connectionText)
            .filter(Boolean),
        ),
      ];
      let text;

      if (confirmedActions.length > 0 && potentialSources.length > 0) {
        text = `You've confirmed ${joinReadable(
          confirmedActions,
        )}; work backgrounds such as ${joinReadable(
          potentialSources.map(({ label }) => label),
        )} may also include tasks like ${joinReadable(
          potentialActions,
        )}. These experiences may be useful for ${connectionUse}.`;
      } else if (confirmedActions.length > 0) {
        text = `You've confirmed ${joinReadable(
          confirmedActions,
        )}. That experience may be useful for ${connectionUse}.`;
      } else {
        text = `Some people with backgrounds such as ${joinReadable(
          potentialSources.map(({ label }) => label),
        )} may have done tasks like ${joinReadable(
          potentialActions,
        )}. If that reflects your experience, it may be useful for ${connectionUse}.`;
      }

      return {
        label: matchingRules.connectionGroups[evidence.groupId].label,
        text,
        confirmedCount: evidence.confirmedSources.length,
        potentialCount: evidence.potentialSources.length,
      };
    })
    .sort(
      (first, second) =>
        second.confirmedCount - first.confirmedCount ||
        second.potentialCount - first.potentialCount,
    )
    .slice(0, 4);
}

function appendEvidenceSection(container, match) {
  const section = document.createElement("section");
  section.className = "career-detail-section";
  const heading = document.createElement("h4");
  heading.textContent = "How your transferable skills connect to this career.";
  const list = document.createElement("ul");

  for (const connection of getTransferableSkillConnections(match, match.career)) {
    const item = document.createElement("li");
    const family = document.createElement("strong");
    family.textContent = `${connection.label}: `;
    item.append(family, document.createTextNode(connection.text));
    list.append(item);
  }

  section.append(heading, list);
  const context = document.createElement("p");
  context.className = "link-detail";
  context.textContent =
    "Work-background connections draw on typical job responsibilities and may not reflect every person's individual experience.";
  section.append(context);
  const occupationalSources = new Map();
  for (const evidence of match.skillEvidence) {
    for (const source of evidence.potentialSources.flatMap(
      ({ value }) => matchingRules.occupations[value]?.sources || [],
    )) {
      occupationalSources.set(source.url, source);
    }
  }
  if (occupationalSources.size > 0) {
    const sourceNote = document.createElement("p");
    sourceNote.className = "link-detail";
    const label = document.createElement("strong");
    label.textContent = "Occupational task references: ";
    sourceNote.append(label);
    [...occupationalSources.values()].forEach((source, index) => {
      if (index > 0) {
        sourceNote.append(document.createTextNode("; "));
      }
      const link = document.createElement("a");
      link.href = source.url;
      link.textContent = source.name;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      sourceNote.append(link);
    });
    section.append(sourceNote);
  }
  container.append(section);
}

const toolValuesByNeed = {
    email: "email",
    documents: "documents",
    spreadsheets: "spreadsheets",
    calendar: "calendar",
    "online-records": "online-records",
  };

function getMissingTechnologyNeeds(answersByGroup, career) {
  const selectedTools = (answersByGroup.technologyTools || []).filter(
    (value) => !["none", "unsure"].includes(value),
  );
  return career.technologyNeeds.filter(
    (need) =>
      toolValuesByNeed[need] &&
      !selectedTools.includes(toolValuesByNeed[need]),
  );
}

function getPreparationResources(answersByGroup, career) {
  const resources = [...career.resources];
  const education = answersByGroup.education?.[0];

  if (
    career.highSchoolEquivalentCommon &&
    ["no-credential", "some-high-school"].includes(education)
  ) {
    resources.push(...matchingRules.preparationResources.ged);
  }

  const englishLevel = answersByGroup.englishSupport?.[0];
  if (englishSupportLevels.has(englishLevel)) {
    const englishResources =
      matchingRules.preparationResources.english;
    const englishCourseDetails = {
      beginning:
        "Start with beginner lessons in these free online English courses.",
      basic:
        "Build everyday English with free self-paced beginner and intermediate lessons.",
      intermediate:
        "Practice with the intermediate lessons in these free online English courses.",
    };
    resources.push(
      ...(englishLevel === "advanced"
        ? englishResources.filter(({ url }) =>
            url.includes("/english-conversation-tips/"),
          )
        : englishResources).map((resource) =>
        resource.url === "https://www.usalearns.org/"
          ? { ...resource, detail: englishCourseDetails[englishLevel] }
          : resource,
      ),
    );
  }

  const missingNeeds = getMissingTechnologyNeeds(answersByGroup, career);
  if (
    missingNeeds.length > 0 ||
    ["little", "guided"].includes(answersByGroup.technologyComfort?.[0])
  ) {
    const relevantNeeds =
      missingNeeds.length > 0
        ? missingNeeds
        : career.technologyNeeds;
    for (const need of relevantNeeds) {
      const resource = matchingRules.preparationResources.computer[need];
      if (resource) {
        resources.push(resource);
      }
    }
  }

  return [...new Map(resources.map((resource) => [resource.url, resource])).values()];
}

function getPreparationNotes(answersByGroup, career, match) {
  const notes = [];
  const missingNeeds = getMissingTechnologyNeeds(answersByGroup, career);
  const comfort = answersByGroup.technologyComfort?.[0];
  const practiceNeeds =
    missingNeeds.length > 0
      ? missingNeeds
      : ["little", "guided"].includes(comfort)
        ? career.technologyNeeds.slice(0, 2)
        : [];

  if (practiceNeeds.length > 0) {
    const toolNames = practiceNeeds
      .map((need) => technologyToolLabels[toolValuesByNeed[need]])
      .filter(Boolean);
    const startingPoint =
      comfort === "little"
        ? "Start with a guided beginner lesson"
        : comfort === "guided"
          ? "Practice these tasks step by step"
          : "Try practicing these tools";
    notes.push(
      `${startingPoint}: ${joinReadable(toolNames)}. Free learning links are below.`,
    );
  }

  const education = answersByGroup.education?.[0];
  if (
    career.highSchoolEquivalentCommon &&
    ["no-credential", "some-high-school"].includes(education)
  ) {
    notes.push(
      "Some employers commonly ask for a high school diploma or equivalent. Check local postings and, if useful, explore adult-education or GED preparation options below.",
    );
  }

  const englishPreparationMessages = {
    beginning:
      "Start with the beginner English lessons and everyday conversation tips below.",
    basic:
      "Build everyday English with the self-paced lessons and conversation tips below.",
    intermediate:
      "Explore the intermediate lessons and conversation practice below.",
    advanced:
      "The available free resource focuses on everyday conversation practice; we don't list an advanced-specific English course.",
  };
  const englishMessage =
    englishPreparationMessages[answersByGroup.englishSupport?.[0]];
  if (englishMessage) {
    notes.push(englishMessage);
  }

  const trainingChoice = answersByGroup.trainingInterest?.[0];
  const trainingMessages = {
    "structured-course":
      "Before enrolling in a course, compare its content and cost with requirements in local job postings; a certificate is not universal.",
    "extended-training":
      "Before committing to longer training, compare local job postings and training options for this specific role.",
    "learn-on-job":
      "Look for postings that mention on-the-job training, and check which skills employers expect before starting.",
    unsure:
      "You can use the free resources below to explore the work before deciding whether more training would help.",
  };
  if (trainingMessages[trainingChoice]) {
    notes.push(trainingMessages[trainingChoice]);
  }

  const confirmedFamilies = new Set(
    (match?.skillEvidence || [])
      .filter(({ confirmedSources }) => confirmedSources.length > 0)
      .map(({ family }) => family),
  );
  if (!confirmedFamilies.has(career.preparationTask.family)) {
    notes.push(career.preparationTask.text);
  } else {
    const confirmedActivity = (match?.skillEvidence || [])
      .flatMap(({ confirmedSources }) => confirmedSources)
      .find(({ connectionText }) => connectionText);
    if (confirmedActivity) {
      notes.push(
        `For your resume or an interview, prepare a brief example of ${confirmedActivity.connectionText}; include only details you personally handled.`,
      );
    }
  }

  return notes;
}

function appendTransferableSkills(container, examples) {
  const section = document.createElement("section");
  section.className = "career-detail-section";
  const heading = document.createElement("h4");
  heading.textContent = "How previous experience may transfer";
  const list = document.createElement("ul");

  for (const example of examples) {
    const item = document.createElement("li");
    const background = document.createElement("strong");
    background.textContent = `${example.background}: `;
    item.append(background, document.createTextNode(example.example));
    list.append(item);
  }

  section.append(heading, list);
  container.append(section);
}

function appendCareerPathwaySection(container, pathway) {
  const section = document.createElement("section");
  section.className = "career-detail-section career-pathway-section";

  const heading = document.createElement("h4");
  heading.textContent = "Potential Career Pathways";

  const route = document.createElement("p");
  route.className = "career-pathway-route";
  route.textContent = pathway.join(" → ");

  const disclaimer = document.createElement("p");
  disclaimer.className = "career-pathway-disclaimer";
  const disclaimerText = document.createElement("em");
  disclaimerText.textContent =
    "These are examples of possible career pathways, not guaranteed or required progressions. Advancement may depend on experience, additional skills, education, or training.";
  disclaimer.append(disclaimerText);

  section.append(heading, route, disclaimer);
  container.append(section);
}

function appendLinksSection(container, headingText, links, includeCost) {
  const section = document.createElement("section");
  section.className = "career-detail-section";
  const heading = document.createElement("h4");
  heading.textContent = headingText;
  const list = document.createElement("ul");

  for (const resource of links) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = resource.url;
    link.textContent = resource.name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const detail = document.createElement("p");
    detail.className = "link-detail";
    detail.textContent = resource.detail;

    item.append(link, detail);
    if (includeCost) {
      const cost = document.createElement("p");
      cost.className = "link-detail";
      cost.textContent = resource.cost;
      item.append(cost);
    }
    list.append(item);
  }

  section.append(heading, list);
  container.append(section);
}

function createRecommendationCard(form, match, index) {
  const item = document.createElement("li");
  item.className = "recommendation-card";
  item.dataset.careerId = match.career.id;
  const article = document.createElement("article");

  if (index === 0) {
    const topMatch = document.createElement("p");
    topMatch.className = "top-match-label";
    const star = document.createElement("span");
    star.className = "top-match-star";
    star.setAttribute("aria-hidden", "true");
    star.textContent = "★";
    topMatch.append(star, document.createTextNode(" Closest match to your experience"));
    article.append(topMatch);
  }

  const title = document.createElement("h3");
  title.textContent = match.career.title;

  const answersByGroup = getAnswersByGroup(form);
  const explanation = document.createElement("p");
  explanation.className = "recommendation-reason";
  explanation.textContent = getMatchExplanation(match);
  const preference = document.createElement("p");
  preference.className = "recommendation-preference";
  preference.textContent = getPreferenceExplanation(answersByGroup, match.career);

  const details = document.createElement("details");
  details.className = "career-details";
  const summary = document.createElement("summary");
  summary.textContent = "Explore responsibilities, skills, and next steps";
  const detailContent = document.createElement("div");
  detailContent.className = "career-details-content";
  const printButton = document.createElement("button");
  printButton.className = "button-secondary career-print-action";
  printButton.type = "button";
  printButton.textContent = "Print or save this career";
  printButton.setAttribute(
    "aria-label",
    `Print or save details for ${match.career.title}`,
  );
  printButton.addEventListener("click", () =>
    printCareerDetails(match.career.id),
  );
  detailContent.append(printButton);
  appendEvidenceSection(detailContent, match);
  appendParagraphSection(
    detailContent,
    "What this role may involve",
    match.career.description,
  );
  appendListSection(
    detailContent,
    "Typical responsibilities",
    match.career.responsibilities,
  );
  appendListSection(detailContent, "Common skills", match.career.skills);
  appendParagraphSection(
    detailContent,
    "Typical entry-level preparation",
    match.career.qualifications,
  );
  appendListSection(
    detailContent,
    "How to prepare for this career.",
    getPreparationNotes(answersByGroup, match.career, match),
  );
  appendTransferableSkills(detailContent, match.career.transferableSkills);
  appendListSection(
    detailContent,
    "Skills you could develop",
    match.career.developSkills,
  );
  appendListSection(
    detailContent,
    "Other job titles to search",
    match.career.alternativeTitles,
  );
  appendLinksSection(
    detailContent,
    "Free learning resources (optional)",
    getPreparationResources(answersByGroup, match.career),
    true,
  );
  appendListSection(
    detailContent,
    "Practical next steps",
    match.career.nextSteps,
  );
  appendCareerPathwaySection(detailContent, match.career.careerPathway);
  appendLinksSection(detailContent, "Occupational sources", match.career.sources, false);

  details.append(summary, detailContent);
  article.append(title, explanation, preference, details);
  item.append(article);
  return item;
}

function getScopedMatches(matches, scope, selectedCareerIds) {
  if (scope === "complete") {
    return matches;
  }
  if (scope !== "selected") {
    throw new RangeError(`Unsupported result scope "${scope}".`);
  }
  const selected = new Set(selectedCareerIds);
  return matches.filter(({ career }) => selected.has(career.id));
}

function buildShareText(matches, answersByGroup, scope, selectedCareerIds) {
  const includedMatches = getScopedMatches(
    matches,
    scope,
    selectedCareerIds,
  );
  if (includedMatches.length === 0) {
    return "";
  }

  const formatSection = (heading, items) =>
    `${heading}\n${items.map((item) => `- ${item}`).join("\n")}`;
  const careerSections = includedMatches.map(({ career, ...match }) => {
    const fullMatch = { ...match, career };
    const sections = [
      career.description,
      formatSection("Typical responsibilities", career.responsibilities),
      formatSection("Common skills", career.skills),
      `Typical entry-level preparation\n${career.qualifications}`,
      formatSection(
        "How your transferable skills connect to this career",
        getTransferableSkillConnections(fullMatch, career).map(
          ({ label, text }) => `${label}: ${text}`,
        ),
      ),
      formatSection(
        "How to prepare for this career",
        getPreparationNotes(answersByGroup, career, fullMatch),
      ),
      formatSection(
        "Examples of related experience",
        career.transferableSkills.map(
          ({ background, example }) => `${background}: ${example}`,
        ),
      ),
      formatSection("Skills you could develop", career.developSkills),
      formatSection("Other job titles to search", career.alternativeTitles),
      formatSection(
        "Free learning resources (optional)",
        getPreparationResources(answersByGroup, career).map(
          ({ name, detail, url }) => `${name}: ${detail} (${url})`,
        ),
      ),
      formatSection("Practical next steps", career.nextSteps),
      `Potential career pathway\n${career.careerPathway.join(" > ")}`,
      formatSection(
        "Occupational sources",
        career.sources.map(({ name, url }) => `${name}: ${url}`),
      ),
    ];
    return `Career: ${career.title}\n${getMatchExplanation(fullMatch)}\n${getPreferenceExplanation(
      answersByGroup,
      career,
    )}\n\n${sections.join("\n\n")}`;
  });

  return [
    "Career Pathway Explorer results",
    "These suggestions are for exploration and do not guarantee employment, salary improvement, or advancement.",
    careerSections.join("\n\n---\n\n"),
  ].join("\n\n");
}

function getSelectedCareerIds() {
  return Array.from(
    document.querySelectorAll('[name="result-careers"]:checked'),
    (input) => input.value,
  );
}

function getCurrentScopedMatches(matches) {
  const scope = document.querySelector("#results-scope").value;
  const includedMatches = getScopedMatches(
    matches,
    scope,
    getSelectedCareerIds(),
  );
  if (includedMatches.length === 0) {
    document.querySelector("#result-action-status").textContent =
      "Select at least one recommended career to continue.";
    return null;
  }
  return { scope, matches: includedMatches };
}

function renderResultTools(matches) {
  const tools = document.querySelector("#result-tools");
  const selectionList = document.querySelector("#career-scope-list");
  const selectionFieldset = document.querySelector("#career-scope-options");
  const scopeSelect = document.querySelector("#results-scope");
  const status = document.querySelector("#result-action-status");

  tools.hidden = matches.length === 0;
  status.textContent = "";
  if (matches.length === 0) {
    selectionList.replaceChildren();
    return;
  }

  selectionList.replaceChildren(
    ...matches.map(({ career }) => {
      const label = document.createElement("label");
      label.className = "career-scope-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "result-careers";
      input.value = career.id;
      input.checked = true;
      const text = document.createElement("span");
      text.textContent = career.title;
      label.append(input, text);
      return label;
    }),
  );
  scopeSelect.value = "complete";
  selectionFieldset.hidden = true;
}

function updateResultScopeOptions() {
  const scope = document.querySelector("#results-scope").value;
  document.querySelector("#career-scope-options").hidden =
    scope !== "selected";
  document.querySelector("#result-action-status").textContent = "";
}

function printScopedResults(saveAsPdf) {
  const selection = getCurrentScopedMatches(lastMatches);
  if (!selection) {
    return;
  }
  printSelection(selection, saveAsPdf);
}

function printCareerDetails(careerId) {
  const matches = getScopedMatches(lastMatches, "selected", [careerId]);
  if (matches.length === 0) {
    document.querySelector("#result-action-status").textContent =
      "That career is no longer in your current results. Review your recommendations and try again.";
    return;
  }
  printSelection({ scope: "selected", matches }, true);
}

function printSelection(selection, saveAsPdf) {
  if (typeof window.print !== "function") {
    document.querySelector("#result-action-status").textContent =
      "Printing is not available in this browser. You can still review your results on this page.";
    return;
  }

  const selectedIds = new Set(
    selection.matches.map(({ career }) => career.id),
  );
  const cards = Array.from(
    document.querySelectorAll("#recommendation-list > .recommendation-card"),
  );
  const originalDetails = new Map();
  for (const card of cards) {
    card.dataset.printSelected = String(selectedIds.has(card.dataset.careerId));
    for (const details of card.querySelectorAll("details")) {
      originalDetails.set(details, details.open);
      details.open = true;
    }
  }

  const restoreScreen = () => {
    document.body.classList.remove("printing-results");
    delete document.body.dataset.printScope;
    for (const card of cards) {
      delete card.dataset.printSelected;
    }
    for (const [details, wasOpen] of originalDetails) {
      details.open = wasOpen;
    }
    window.removeEventListener("afterprint", restoreScreen);
  };
  window.addEventListener("afterprint", restoreScreen, { once: true });
  document.body.classList.add("printing-results");
  document.body.dataset.printScope = selection.scope;
  document.querySelector("#result-action-status").textContent = saveAsPdf
    ? "Choose “Save as PDF” to save a copy, or select a printer to print."
    : "Choose a printer or print option in your browser's dialog.";
  window.print();
}

async function shareScopedResults() {
  const selection = getCurrentScopedMatches(lastMatches);
  if (!selection) {
    return;
  }

  const text = buildShareText(
    selection.matches,
    lastAnswersByGroup,
    "complete",
    selection.matches.map(({ career }) => career.id),
  );
  const status = document.querySelector("#result-action-status");
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: "Career Pathway Explorer results",
        text,
      });
      status.textContent = "Your results were shared.";
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        status.textContent = "Sharing was canceled. Your results remain on this page.";
        return;
      }
      if (typeof navigator.clipboard?.writeText !== "function") {
        status.textContent =
          "Sharing could not be completed. You can save a PDF and attach it in the app you use.";
        return;
      }
    }
  }

  if (typeof navigator.clipboard?.writeText !== "function") {
    status.textContent =
      "Sharing is not available in this browser. You can save a PDF and attach it in the app you use.";
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    status.textContent =
      "Your results were copied to the clipboard. Paste them where you want to share.";
  } catch {
    status.textContent =
      "Your results could not be copied. You can save a PDF and attach it in the app you use.";
  }
}

let lastMatches = [];
let lastAnswersByGroup = {};

function renderRecommendations(form, matches) {
  lastMatches = matches;
  lastAnswersByGroup = getAnswersByGroup(form);
  const recommendationList = document.querySelector("#recommendation-list");
  if (matches.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "recommendation-card";
    const heading = document.createElement("h3");
    heading.textContent = "No career matches yet";
    const message = document.createElement("p");
    message.textContent =
      "Your answers didn't show enough overlap with the careers in our guide to suggest a match. Choose “Change my answers” to review your work backgrounds and activities, then try again. If none fit, that's okay—we won't guess at a match.";
    emptyState.append(heading, message);
    recommendationList.replaceChildren(emptyState);
  } else {
    recommendationList.replaceChildren(
      ...matches.map((match, index) =>
        createRecommendationCard(form, match, index),
      ),
    );
  }

  renderResultTools(matches);
  document.querySelector("#recommendations").hidden = false;
  document.querySelector("#intake-form").hidden = true;
  document.querySelector("#recommendations-title").focus();
}

function getQuestionFieldsets(form) {
  return Array.from(form.querySelectorAll("[data-question-step]"));
}

function updateQuestionStep(form, stepIndex, moveFocus) {
  const fieldsets = getQuestionFieldsets(form);
  const backButton = document.querySelector("#question-back");
  const nextButton = document.querySelector("#question-next");
  const submitButton = document.querySelector("#submit-answers");
  const progress = document.querySelector("#question-progress");
  const progressLabel = document.querySelector("#progress-label");

  fieldsets.forEach((fieldset, index) => {
    fieldset.hidden = index !== stepIndex;
    if (index === stepIndex) {
      fieldset.setAttribute("aria-current", "step");
    } else {
      fieldset.removeAttribute("aria-current");
    }
  });

  backButton.disabled = stepIndex === 0;
  nextButton.hidden = stepIndex === fieldsets.length - 1;
  submitButton.hidden = stepIndex !== fieldsets.length - 1;
  progress.max = fieldsets.length;
  progress.value = stepIndex + 1;
  progressLabel.textContent = `Question ${stepIndex + 1} of ${fieldsets.length}`;

  if (moveFocus) {
    fieldsets[stepIndex].querySelector("legend").focus();
  }
}

function getGroupError(group, answers) {
  if (group.required && answers.length === 0) {
    return group.multiple
      ? "Choose at least one answer, including a “None / not sure” option if that fits."
      : "Choose one answer to continue.";
  }
  if (!group.multiple && answers.length > 1) {
    return "Choose only one answer for this question.";
  }
  if (group.maxSelections && answers.length > group.maxSelections) {
    return `Choose no more than ${group.maxSelections} answers.`;
  }
  if (answers.some((value) => !getAllowedAnswers(group.name).has(value))) {
    return "One of these answers is not supported. Please choose from the listed options.";
  }
  if (
    group.exclusiveOptions?.some((value) => answers.includes(value)) &&
    answers.length > 1
  ) {
    return group.name === "priorities"
      ? "Choose “Not sure yet” by itself, or select up to three priorities."
      : "Choose “None / not sure” by itself, or select the answers that apply.";
  }
  return "";
}

function validateQuestionStep(form, stepIndex) {
  const fieldset = getQuestionFieldsets(form)[stepIndex];
  const groupNames = questionSteps[stepIndex];
  const invalidGroup = groupNames
    .map((name) => questionGroups.find((group) => group.name === name))
    .map((group) => ({
      group,
      error: getGroupError(group, getCheckedAnswers(form, group.name)),
    }))
    .find(({ error }) => error);

  if (!invalidGroup) {
    showMessage("", "");
    return true;
  }

  showMessage(invalidGroup.error, "error");
  const input = fieldset.querySelector(
    `[name="${invalidGroup.group.name}"]`,
  );
  input?.focus();
  return false;
}

function makeExclusiveCheckboxes(form) {
  for (const group of questionGroups.filter((item) => item.multiple)) {
    const exclusive = new Set(group.exclusiveOptions || []);
    for (const input of form.querySelectorAll(
      `[name="${group.name}"][type="checkbox"]`,
    )) {
      input.addEventListener("change", () => {
        if (input.checked && exclusive.has(input.value)) {
          for (const other of form.querySelectorAll(
            `[name="${group.name}"][type="checkbox"]`,
          )) {
            if (other !== input) {
              other.checked = false;
            }
          }
        } else if (input.checked) {
          for (const other of form.querySelectorAll(
            `[name="${group.name}"][type="checkbox"]`,
          )) {
            if (exclusive.has(other.value)) {
              other.checked = false;
            }
          }
        }
        showMessage("", "");
      });
    }
  }
}

function handleSubmit(event, setCurrentStep) {
  event.preventDefault();
  const form = event.currentTarget;

  for (let stepIndex = 0; stepIndex < questionSteps.length; stepIndex += 1) {
    if (!validateQuestionStep(form, stepIndex)) {
      setCurrentStep(stepIndex);
      updateQuestionStep(form, stepIndex, true);
      return;
    }
  }

  renderRecommendations(form, getCareerMatches(form));
}

if (typeof document !== "undefined") {
  const intakeForm = document.querySelector("#intake-form");

  if (intakeForm) {
    let currentStep = 0;

    makeExclusiveCheckboxes(intakeForm);
    updateQuestionStep(intakeForm, currentStep, false);
    intakeForm.addEventListener("submit", (event) =>
      handleSubmit(event, (stepIndex) => {
        currentStep = stepIndex;
      }),
    );
    document.querySelector("#question-next").addEventListener("click", () => {
      if (!validateQuestionStep(intakeForm, currentStep)) {
        return;
      }
      currentStep += 1;
      updateQuestionStep(intakeForm, currentStep, true);
    });
    document.querySelector("#question-back").addEventListener("click", () => {
      if (currentStep === 0) {
        return;
      }
      currentStep -= 1;
      updateQuestionStep(intakeForm, currentStep, true);
      showMessage("", "");
    });
    document.querySelector("#change-answers").addEventListener("click", () => {
      document.querySelector("#recommendations").hidden = true;
      intakeForm.hidden = false;
      currentStep = 0;
      updateQuestionStep(intakeForm, currentStep, true);
      showMessage("", "");
    });
    document.querySelector("#start-over").addEventListener("click", () => {
      intakeForm.reset();
      lastMatches = [];
      lastAnswersByGroup = {};
      document.querySelector("#recommendation-list").replaceChildren();
      document.querySelector("#recommendations").hidden = true;
      intakeForm.hidden = false;
      currentStep = 0;
      updateQuestionStep(intakeForm, currentStep, true);
      showMessage("", "");
    });
    document
      .querySelector("#results-scope")
      .addEventListener("change", updateResultScopeOptions);
    document
      .querySelector("#print-results")
      .addEventListener("click", () => printScopedResults(false));
    document
      .querySelector("#save-pdf")
      .addEventListener("click", () => printScopedResults(true));
    document
      .querySelector("#share-results")
      .addEventListener("click", shareScopedResults);
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    getCareerMatches,
    getPreparationResources,
    getMatchExplanation,
    getPreferenceExplanation,
    getPreparationNotes,
    getScopedMatches,
    getTransferableSkillConnections,
    buildShareText,
    getUnansweredQuestions,
    questionGroups,
    questionSteps,
    validateAnswers,
  };
}
