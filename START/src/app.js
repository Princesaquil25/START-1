const questionGroups = [
  { name: "activities", multiple: true },
  { name: "communication", multiple: false },
  { name: "tasks", multiple: false },
  { name: "software", multiple: false },
  { name: "workplace", multiple: false },
];

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

function showMessage(message, type) {
  const messageElement = document.querySelector("#form-message");
  messageElement.textContent = message;
  messageElement.className = `form-message ${type}`;
}

function handleSubmit(event) {
  event.preventDefault();

  const unansweredQuestions = getUnansweredQuestions(event.currentTarget);

  if (unansweredQuestions.length > 0) {
    showMessage(
      "Please answer each question before submitting. You can choose “None of these yet” or “I am not sure yet” when those options fit.",
      "error",
    );
    return;
  }

  showMessage(
    "Thank you. Your answers were submitted for this prototype. No information was saved.",
    "success",
  );
}

if (typeof document !== "undefined") {
  const intakeForm = document.querySelector("#intake-form");

  if (intakeForm) {
    intakeForm.addEventListener("submit", handleSubmit);
  }
}

if (typeof module !== "undefined") {
  module.exports = { getUnansweredQuestions };
}
