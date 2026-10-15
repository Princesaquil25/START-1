const careerRecords = [
  {
    id: "administrative-assistant",
    title: "Administrative assistant",
    matchSignals: {
      activities: ["organizing", "scheduling", "documents"],
      communication: ["phone", "writing"],
      tasks: ["organizing", "scheduling", "variety"],
      software: ["enjoy", "practice", "experience"],
      workplace: ["general-office", "team-support"],
    },
  },
  {
    id: "receptionist",
    title: "Receptionist",
    matchSignals: {
      activities: ["helping-people", "communication"],
      communication: ["in-person", "phone"],
      tasks: ["welcoming"],
      software: ["practice", "people-first"],
      workplace: ["front-desk"],
    },
  },
  {
    id: "customer-service-representative",
    title: "Customer service representative",
    matchSignals: {
      activities: ["helping-people", "communication"],
      communication: ["phone", "problem-solving"],
      tasks: ["resolving"],
      software: ["practice", "people-first"],
      workplace: ["service"],
    },
  },
  {
    id: "medical-administrative-assistant",
    title: "Medical administrative assistant",
    matchSignals: {
      activities: ["helping-people", "organizing", "scheduling", "documents"],
      communication: ["in-person", "phone", "writing"],
      tasks: ["healthcare"],
      software: ["practice", "experience", "training"],
      workplace: ["healthcare"],
    },
  },
  {
    id: "records-clerk",
    title: "Records clerk",
    matchSignals: {
      activities: ["organizing", "documents"],
      communication: ["writing"],
      tasks: ["organizing"],
      software: ["enjoy", "experience"],
      workplace: ["general-office", "team-support"],
    },
  },
];

if (typeof module !== "undefined") {
  module.exports = careerRecords;
}

if (typeof globalThis !== "undefined") {
  globalThis.careerOptions = careerRecords;
}
