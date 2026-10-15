const questionGroups = [
  { name: "activities", multiple: true },
  { name: "communication", multiple: false },
  { name: "tasks", multiple: false },
  { name: "software", multiple: false },
  { name: "workplace", multiple: false },
];

const careerOptions =
  typeof module !== "undefined"
    ? require("./data/careers")
    : globalThis.careerOptions;

function getCheckedAnswers(form, groupName) {
  return Array.from(
    form.querySelectorAll(`[name="${groupName}"]:checked`),
    (input) => input.value,
  );
}

function getUnansweredQuestions(form) {
  return questionGroups
    .filter((group) => getCheckedAnswers(form, group.name).length === 0)
    .map((group) => group.name);
}

function getCareerMatches(form) {
  const answersByGroup = Object.fromEntries(
    questionGroups.map((group) => [
      group.name,
      getCheckedAnswers(form, group.name),
    ]),
  );

  return careerOptions
    .map((career, index) => {
      let score = 0;
      const matchedAnswers = {};

      for (const group of questionGroups) {
        const matches = answersByGroup[group.name].filter((answer) =>
          career.matchSignals[group.name].includes(answer),
        );

        if (matches.length > 0) {
          score += 1;
          matchedAnswers[group.name] = matches;
        }
      }

      return { career, score, matchedAnswers, index };
    })
    .sort(
      (first, second) =>
        second.score - first.score || first.index - second.index,
    )
    .slice(0, 3)
    .map(({ career, score, matchedAnswers }) => ({
      career,
      score,
      matchedAnswers,
    }));
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

function getMatchExplanation(form, matchedAnswers) {
  const matchedGroups = Object.entries(matchedAnswers).map(
    ([groupName, answers]) => {
      const input = form.querySelector(`[name="${groupName}"]`);
      const fieldset = input?.closest("fieldset");
      const legend = fieldset?.querySelector("legend");

      if (!legend) {
        throw new Error(
          `Could not find the question heading for "${groupName}".`,
        );
      }

      const question = legend.textContent.replace(/^\s*\d+\.\s*/, "").trim();
      const answerLabels = answers.map((answer) =>
        getAnswerLabel(form, groupName, answer),
      );
      return `${question}: ${answerLabels.join(", ")}`;
    },
  );

  if (matchedGroups.length === 0) {
    return "Your selected answers did not directly match this role's current matching signals. It may still be worth exploring, but it is not a personalized match from these answers.";
  }

  return `Your answers aligned with this role in these areas: ${matchedGroups.join("; ")}.`;
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
    topMatch.append(star, document.createTextNode(" Top match"));
    article.append(topMatch);
  }

  const title = document.createElement("h3");
  title.textContent = match.career.title;

  const score = document.createElement("p");
  score.className = "recommendation-score";
  score.textContent = `Matched ${match.score} of ${questionGroups.length} answer groups`;

  const scoreNote = document.createElement("p");
  scoreNote.className = "score-note";
  scoreNote.textContent =
    "This is a count of question groups with at least one matching answer, not a probability, qualification rating, or measure of job readiness.";

  const explanation = document.createElement("p");
  explanation.className = "recommendation-reason";
  explanation.textContent = getMatchExplanation(form, match.matchedAnswers);

  const details = document.createElement("details");
  details.className = "career-details";
  const summary = document.createElement("summary");
  summary.textContent = "Explore responsibilities, skills, and next steps";
  const detailContent = document.createElement("div");
  detailContent.className = "career-details-content";

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
  article.append(title, score, scoreNote, explanation, details);
  item.append(article);
  return item;
}

function renderRecommendations(form, matches) {
  const recommendationList = document.querySelector("#recommendation-list");
  recommendationList.replaceChildren(
    ...matches.map((match, index) =>
      createRecommendationCard(form, match, index),
    ),
  );

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

function validateQuestionStep(form, stepIndex) {
  const fieldset = getQuestionFieldsets(form)[stepIndex];
  const group = questionGroups[stepIndex];
  const answers = getCheckedAnswers(form, group.name);

  if (answers.length > 0) {
    showMessage("", "");
    return true;
  }

  showMessage(
    group.multiple
      ? "Choose at least one activity to continue. You can select “None of these yet” if that fits."
      : "Choose one answer to continue. You can select “I am not sure yet” when that option is available.",
    "error",
  );
  fieldset.querySelector("input").focus();
  return false;
}

function handleSubmit(event, setCurrentStep) {
  event.preventDefault();
  const form = event.currentTarget;

  const unansweredQuestions = getUnansweredQuestions(form);

  if (unansweredQuestions.length > 0) {
    const firstUnansweredIndex = questionGroups.findIndex(({ name }) =>
      unansweredQuestions.includes(name),
    );
    setCurrentStep(firstUnansweredIndex);
    updateQuestionStep(form, firstUnansweredIndex, true);
    validateQuestionStep(form, firstUnansweredIndex);
    return;
  }

  renderRecommendations(form, getCareerMatches(form));
}

if (typeof document !== "undefined") {
  const intakeForm = document.querySelector("#intake-form");

  if (intakeForm) {
    let currentStep = 0;

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
    getUnansweredQuestions,
    questionGroups,
  };
}
