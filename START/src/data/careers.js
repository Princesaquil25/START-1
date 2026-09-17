(function (root, factory) {
  const profiles = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = profiles;
  }
  root.CAREER_PROFILES = profiles;
})(typeof self !== "undefined" ? self : this, function () {
  return [
    {
      id: "customer-support",
      title: "Customer Support Specialist",
      skills: ["active listening", "clear communication", "problem solving", "documentation"],
      nextSteps: ["Practice writing concise help articles.", "Learn a ticketing or customer relationship platform.", "Shadow a support team and ask for feedback on difficult scenarios."]
    },
    {
      id: "project-coordinator",
      title: "Project Coordinator",
      skills: ["organization", "clear communication", "problem solving", "time management", "documentation"],
      nextSteps: ["Build a simple project plan for a volunteer or personal project.", "Practice tracking tasks, owners, and deadlines.", "Learn the basics of a project management tool."]
    },
    {
      id: "marketing-specialist",
      title: "Marketing Specialist",
      skills: ["clear communication", "creativity", "research", "organization", "data analysis"],
      nextSteps: ["Create a small campaign brief for a community project.", "Practice reading basic engagement metrics.", "Build a portfolio piece that explains your audience and message."]
    },
    {
      id: "software-developer",
      title: "Software Developer",
      skills: ["problem solving", "attention to detail", "collaboration", "data analysis"],
      nextSteps: ["Complete an introductory programming project.", "Practice breaking a large problem into small tasks.", "Share a small project publicly and request code review."]
    },
    {
      id: "healthcare-administrator",
      title: "Healthcare Administrator",
      skills: ["organization", "clear communication", "documentation", "attention to detail", "time management"],
      nextSteps: ["Learn about privacy-aware record handling.", "Practice coordinating schedules and communicating changes.", "Explore an entry-level healthcare administration course."]
    }
  ];
});
