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

const comfortGuidance = {
  little: "You could start with guided practice in the office tools relevant to this role. This answer does not reduce your transferable-skill match.",
  guided: "Practice the role’s common office tasks step by step; the learning resources below are optional starting points.",
  independent: "You can build on your current comfort by practicing any employer-specific tools named in local postings.",
  learning: "Your comfort learning technology can help as you explore the tools used by a particular employer.",
};

const educationGuidance = {
  "no-credential":
    "Some entry-level office postings ask for a high school diploma or equivalent, while requirements vary. If a role you want lists one, a local library or workforce center may help you explore options.",
  "some-high-school":
    "Check whether local postings for this role require a high school diploma or equivalent. A library or workforce center may explain adult education options if helpful.",
  "high-school":
    "A high school diploma or equivalent is typical for many entry-level office roles, but each employer sets its own requirements.",
  "some-college":
    "Some college coursework may be useful background; review each employer’s stated education and experience requirements.",
  certificate:
    "Your completed certificate, license, or vocational training may be relevant background. Check whether a particular employer asks for a specific credential.",
  apprenticeship:
    "Your apprenticeship or workplace training may provide relevant experience. Employer-specific education, software, or system requirements can still vary.",
  associate:
    "Your degree may provide relevant preparation, but employers may still ask for particular software skills or experience.",
  bachelor:
    "Your degree may provide relevant preparation, but employers may still ask for particular software skills or experience.",
  unsure:
    "This result does not assess education eligibility. Review the requirements in any local postings you choose to explore.",
};

const trainingGuidance = {
  "short-practice":
    "Short lessons and the free resources below may be a practical first step; certificates are not assumed to be required.",
  "structured-course":
    "Compare any course with local employer requirements before enrolling; requirements vary and a certificate is not universal.",
  "extended-training":
    "If you decide to pursue more preparation, first compare local postings and training options for this specific role.",
  "learn-on-job":
    "Look for postings that describe employer-provided training, and check which skills they expect before starting.",
  unsure:
    "You can explore the optional resources below before deciding whether more training would be useful.",
  "not-now":
    "The learning resources below are optional. You can begin by comparing role duties and employer requirements.",
};

const answerLabels = {
  technologyComfort: {
    little: "I have little or no experience with office computer tasks",
    guided: "I can do some common tasks with help",
    independent: "I can do common tasks on my own",
    learning: "I feel comfortable learning new technology",
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
    technologyComfort: Object.keys(comfortGuidance),
    education: Object.keys(answerLabels.education),
    trainingInterest: Object.keys(trainingGuidance),
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
    const source = { value, label: occupation.label, taskBasis: occupation.taskBasis };
    for (const family of occupation.skills) {
      addEvidence(family, "potential", source);
    }
  }

  for (const value of answersByGroup.activities || []) {
    const activity = matchingRules.activities[value];
    if (!activity) {
      continue;
    }
    const source = { value, label: activity.label };
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
  const confirmed = match.skillEvidence.filter(
    ({ confirmedSources }) => confirmedSources.length > 0,
  );
  const potential = match.skillEvidence.filter(
    ({ confirmedSources, potentialSources }) =>
      confirmedSources.length === 0 && potentialSources.length > 0,
  );
  const overlappingPotential = confirmed.some(
    ({ potentialSources }) => potentialSources.length > 0,
  );
  const statements = [];

  if (confirmed.length > 0) {
    statements.push(
      `You confirmed doing activities related to ${joinReadable(
        confirmed
          .map(({ family }) => matchingRules.skillLabels[family]),
      )}.`,
    );
  }
  if (potential.length > 0) {
    statements.push(
      `Typical tasks in selected work backgrounds may also involve ${joinReadable(
        potential
          .map(({ family }) => matchingRules.skillLabels[family]),
      )}; this is a possible connection, not a confirmed task.`,
    );
  }
  if (overlappingPotential) {
    statements.push("Overlapping skill areas are counted once.");
  }

  return `This role may be worth exploring. ${statements.join(
    " ",
  )} These connections are not a formal skills assessment or a guarantee of job readiness.`;
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
    return "Your preferences were considered after transferable-skill evidence. Actual duties and working conditions vary by employer.";
  }

  const alignedLabels = [...alignedPreferences].map(
    (value) => environmentLabels[value] || priorityLabels[value],
  );
  return `Your preferences for ${joinReadable(
    alignedLabels,
  )} may align with this path. Preferences were used to refine skill-based matches; actual duties and working conditions vary by employer.`;
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

function appendEvidenceSection(container, match) {
  const section = document.createElement("section");
  section.className = "career-detail-section";
  const heading = document.createElement("h4");
  heading.textContent = "Transferable-skill connections from your answers";
  const list = document.createElement("ul");

  for (const evidence of match.skillEvidence) {
    const item = document.createElement("li");
    const family = document.createElement("strong");
    family.textContent = `${matchingRules.skillLabels[evidence.family]}: `;
    item.append(family);

    const sources = [];
    if (evidence.confirmedSources.length > 0) {
      const confirmed = document.createElement("span");
      confirmed.textContent = `Activity you said you have done: ${evidence.confirmedSources
        .map(({ label }) => label)
        .join("; ")}. This confirms the activity, not a formal skill rating.`;
      sources.push(confirmed);
    }
    if (evidence.potentialSources.length > 0) {
      const potential = document.createElement("span");
      potential.textContent = `Potential connection from selected work: ${evidence.potentialSources
        .map(({ label, taskBasis }) => `${label} — ${taskBasis}`)
        .join("; ")} These are typical occupational tasks and may not describe your own duties.`;
      sources.push(potential);
    }

    sources.forEach((source, index) => {
      if (index > 0) {
        item.append(document.createTextNode(" "));
      }
      item.append(source);
    });
    list.append(item);
  }

  section.append(heading, list);
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

function getPreparationNotes(answersByGroup, career) {
  const notes = [];
  const comfort = answersByGroup.technologyComfort[0];
  const comfortLabel = answerLabels.technologyComfort[comfort];
  const comfortMessage =
    comfortGuidance[comfort] || comfortGuidance.little;

  notes.push(`Technology comfort: ${comfortLabel}. ${comfortMessage}`);

  const selectedTools = answersByGroup.technologyTools.filter(
    (value) => !["none", "unsure"].includes(value),
  );
  if (selectedTools.length > 0) {
    notes.push(
      `You selected experience with ${selectedTools
        .map((value) => technologyToolLabels[value])
        .join(", ")}. Employer-specific systems may differ.`,
    );
  }

  const toolValuesByNeed = {
    email: "email",
    documents: "documents",
    spreadsheets: "spreadsheets",
    calendar: "calendar",
    "online-records": "online-records",
  };
  const unselectedNeeds = career.technologyNeeds.filter(
    (need) => !selectedTools.includes(toolValuesByNeed[need]),
  );
  if (unselectedNeeds.length > 0) {
    notes.push(
      `Tools that may be useful to practice for this path include ${unselectedNeeds
        .map((need) => technologyToolLabels[toolValuesByNeed[need]])
        .join(", ")}. You did not select these as tools you have used; that is not a skills judgment.`,
    );
  }

  const educationLabel = answerLabels.education[answersByGroup.education[0]];
  notes.push(
    `Education or training you selected: ${educationLabel}. ${
      educationGuidance[answersByGroup.education[0]]
    }`,
  );

  const trainingChoice = answersByGroup.trainingInterest[0];
  const trainingLabel = answerLabels.trainingInterest[trainingChoice];
  notes.push(
    `Training preference: ${trainingLabel}. ${
      trainingGuidance[trainingChoice] || trainingGuidance.unsure
    }`,
  );

  notes.push(career.preparationNote);
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
  const article = document.createElement("article");

  if (index === 0) {
    const topMatch = document.createElement("p");
    topMatch.className = "top-match-label";
    const star = document.createElement("span");
    star.className = "top-match-star";
    star.setAttribute("aria-hidden", "true");
    star.textContent = "★";
    topMatch.append(star, document.createTextNode(" Strongest skill-evidence match"));
    article.append(topMatch);
  }

  const title = document.createElement("h3");
  title.textContent = match.career.title;

  const score = document.createElement("p");
  score.className = "recommendation-score";
  score.textContent = `${match.confirmedSkillCount} personally confirmed skill area${
    match.confirmedSkillCount === 1 ? "" : "s"
  } and ${match.potentialSkillCount} potential work-background skill area${
    match.potentialSkillCount === 1 ? "" : "s"
  }`;

  const scoreNote = document.createElement("p");
  scoreNote.className = "score-note";
  scoreNote.textContent =
    "Each skill family is counted once. Occupational task connections are potential, while Question 2 activities are experiences you confirmed; neither is a formal qualification or job-readiness rating.";

  const explanation = document.createElement("p");
  explanation.className = "recommendation-reason";
  explanation.textContent = getMatchExplanation(match);
  const preference = document.createElement("p");
  preference.className = "recommendation-preference";
  preference.textContent = getPreferenceExplanation(
    getAnswersByGroup(form),
    match.career,
  );

  const details = document.createElement("details");
  details.className = "career-details";
  const summary = document.createElement("summary");
  summary.textContent = "Explore responsibilities, skills, and next steps";
  const detailContent = document.createElement("div");
  detailContent.className = "career-details-content";

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
    "Preparation suggestions based on your answers",
    getPreparationNotes(getAnswersByGroup(form), match.career),
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
    match.career.resources,
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
  article.append(title, score, scoreNote, explanation, preference, details);
  item.append(article);
  return item;
}

function renderRecommendations(form, matches) {
  const recommendationList = document.querySelector("#recommendation-list");
  if (matches.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "recommendation-card";
    const heading = document.createElement("h3");
    heading.textContent = "No clear skill connection yet";
    const message = document.createElement("p");
    message.textContent =
      "Your current answers did not give us enough occupation or activity evidence to suggest a career responsibly. You can change your answers and select a work background or an activity you have done, if any apply. If none fit, we will not guess at a personalized recommendation.";
    emptyState.append(heading, message);
    recommendationList.replaceChildren(emptyState);
  } else {
    recommendationList.replaceChildren(
      ...matches.map((match, index) =>
        createRecommendationCard(form, match, index),
      ),
    );
  }

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
      document.querySelector("#recommendation-list").replaceChildren();
      document.querySelector("#recommendations").hidden = true;
      intakeForm.hidden = false;
      currentStep = 0;
      updateQuestionStep(intakeForm, currentStep, true);
      showMessage("", "");
    });
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    getCareerMatches,
    getMatchExplanation,
    getPreferenceExplanation,
    getPreparationNotes,
    getUnansweredQuestions,
    questionGroups,
    questionSteps,
    validateAnswers,
  };
}
