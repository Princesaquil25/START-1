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

function getUnansweredQuestions(form) {
  return questionGroups
    .filter((group) => {
      const answers = form.querySelectorAll(
        `[name="${group.name}"]:checked`,
      );
      return answers.length === 0;
    })
    .map((group) => group.name);
}

function getCareerMatches(form) {
  const answersByGroup = Object.fromEntries(
    questionGroups.map((group) => [
      group.name,
      Array.from(
        form.querySelectorAll(`[name="${group.name}"]:checked`),
        (input) => input.value,
      ),
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

function clearRecommendations() {
  document.querySelector("#recommendation-list").replaceChildren();
  document.querySelector("#recommendations").hidden = true;
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
  const answerLabels = Object.entries(matchedAnswers).flatMap(
    ([groupName, answers]) =>
      answers.map((answer) => getAnswerLabel(form, groupName, answer)),
  );

  if (answerLabels.length === 0) {
    return "No selected answers directly matched this option's signals.";
  }

  return `Your answers matched on: ${answerLabels.join("; ")}.`;
}

function renderRecommendations(form, matches) {
  const recommendationList = document.querySelector("#recommendation-list");
  recommendationList.replaceChildren();

  for (const match of matches) {
    const item = document.createElement("li");
    item.className = "recommendation-card";

    const title = document.createElement("h3");
    title.textContent = match.career.title;

    const score = document.createElement("p");
    score.className = "recommendation-score";
    score.textContent = `Matched ${match.score} of ${questionGroups.length} answer groups`;

    const explanation = document.createElement("p");
    explanation.className = "recommendation-reason";
    explanation.textContent = getMatchExplanation(form, match.matchedAnswers);

    item.append(title, score, explanation);
    recommendationList.append(item);
  }

  document.querySelector("#recommendations").hidden = false;
}

function handleSubmit(event) {
  event.preventDefault();
  clearRecommendations();

  const unansweredQuestions = getUnansweredQuestions(event.currentTarget);

  if (unansweredQuestions.length > 0) {
    showMessage(
      "Please answer each question before submitting. You can choose “None of these yet” or “I am not sure yet” when those options fit.",
      "error",
    );
    return;
  }

  const matches = getCareerMatches(event.currentTarget);
  renderRecommendations(event.currentTarget, matches);
  showMessage(
    "Here are three options to explore. Your answers were not saved.",
    "success",
  );
}

if (typeof document !== "undefined") {
  const intakeForm = document.querySelector("#intake-form");

  if (intakeForm) {
    intakeForm.addEventListener("submit", handleSubmit);
    intakeForm.addEventListener("change", () => {
      clearRecommendations();
      showMessage("", "");
    });
  }
}

if (typeof module !== "undefined") {
  module.exports = { getCareerMatches, getUnansweredQuestions };
}
