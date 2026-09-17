(function (root) {
  const profiles = typeof module === "object" && module.exports
    ? require("./data/careers")
    : (root.CAREER_PROFILES || []);

  function normalizeTitle(title) {
    return String(title || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function findCareer(title) {
    const normalized = normalizeTitle(title);
    return profiles.find((profile) => normalizeTitle(profile.title) === normalized);
  }

  function compareCareers(currentTitle, targetTitle) {
    const current = findCareer(currentTitle);
    const target = findCareer(targetTitle);
    if (!current || !target) {
      return { current, target, transferableSkills: [], developmentSkills: [], nextSteps: [] };
    }

    const currentSkills = new Set(current.skills);
    return {
      current,
      target,
      transferableSkills: target.skills.filter((skill) => currentSkills.has(skill)),
      developmentSkills: target.skills.filter((skill) => !currentSkills.has(skill)),
      nextSteps: target.nextSteps
    };
  }

  function validateInputs(currentTitle, targetTitle) {
    const errors = {};
    if (!normalizeTitle(currentTitle)) errors.currentTitle = "Enter your current job title.";
    else if (!findCareer(currentTitle)) errors.currentTitle = "Choose a current job title from the list.";
    if (!normalizeTitle(targetTitle)) errors.targetTitle = "Choose a career you are interested in.";
    else if (!findCareer(targetTitle)) errors.targetTitle = "Choose a career from the list.";
    return errors;
  }

  function renderList(element, items, emptyMessage) {
    element.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("li");
      empty.textContent = emptyMessage;
      empty.className = "empty-item";
      element.append(empty);
      return;
    }
    items.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      element.append(listItem);
    });
  }

  function setupMatcher() {
    const form = document.querySelector("#matcher-form");
    if (!form) return;

    const currentInput = document.querySelector("#current-title");
    const currentOptions = document.querySelector("#current-title-options");
    const targetSelect = document.querySelector("#target-career");
    const currentError = document.querySelector("#current-title-error");
    const targetError = document.querySelector("#target-career-error");
    const results = document.querySelector("#results");
    const resultSummary = document.querySelector("#result-summary");

    profiles.forEach((profile) => {
      const currentOption = document.createElement("option");
      currentOption.value = profile.title;
      currentOptions.append(currentOption);
      const option = document.createElement("option");
      option.value = profile.title;
      option.textContent = profile.title;
      targetSelect.append(option);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const errors = validateInputs(currentInput.value, targetSelect.value);
      currentError.textContent = errors.currentTitle || "";
      targetError.textContent = errors.targetTitle || "";
      currentInput.setAttribute("aria-invalid", String(Boolean(errors.currentTitle)));
      targetSelect.setAttribute("aria-invalid", String(Boolean(errors.targetTitle)));
      if (Object.keys(errors).length) {
        results.hidden = true;
        (errors.currentTitle ? currentInput : targetSelect).focus();
        return;
      }

      const comparison = compareCareers(currentInput.value, targetSelect.value);
      resultSummary.textContent = `From ${comparison.current.title} to ${comparison.target.title}`;
      renderList(document.querySelector("#transferable-skills"), comparison.transferableSkills, "Your profiles do not share a listed skill yet. That is a starting point, not a barrier.");
      renderList(document.querySelector("#development-skills"), comparison.developmentSkills, "You already have each listed skill in common.");
      renderList(document.querySelector("#next-steps"), comparison.nextSteps, "Explore the target career and choose one small action to learn more.");
      results.hidden = false;
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const api = { compareCareers, findCareer, normalizeTitle, validateInputs };
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", setupMatcher);
})(typeof self !== "undefined" ? self : this);
