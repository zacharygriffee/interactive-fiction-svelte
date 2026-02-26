export function createStoryGraph() {
  return {
    startNodeId: "start",
    nodesById: {
      start: {
        id: "start",
        title: "Start",
        body: "At a crossroads.",
        storylets: [
          {
            id: "ambient",
            body: "Dust swirls over old tracks.",
            priority: 1
          },
          {
            id: "first-reveal",
            body: "A clue surfaces for just a moment.",
            priority: 4,
            once: true,
            effectsOnReveal: [
              { type: "inc", key: "curiosity", by: 1 }
            ]
          },
          {
            id: "deep-dossier",
            body: "Restricted dossier access granted.",
            priority: 2,
            requires: [
              { type: "capability", name: "cap.deepDossier" }
            ]
          },
          {
            id: "full-brief",
            body: "The full brief unlocks once keycard and dossier align.",
            priority: 3,
            requires: [
              { type: "capability", name: "cap.deepDossier" },
              { type: "flagTruthy", key: "keycard" }
            ]
          }
        ],
        choices: [
          {
            id: "reflect",
            label: "Reflect",
            effects: [
              { type: "setFlag", key: "introspected", value: true }
            ]
          },
          {
            id: "set-keycard",
            label: "Find keycard",
            effects: [
              { type: "setFlag", key: "keycard", value: true }
            ]
          },
          {
            id: "set-stage",
            label: "Set stage",
            effects: [
              { type: "setFlag", key: "stage", value: 2 }
            ]
          },
          {
            id: "to-grove",
            label: "Go to grove",
            to: "grove",
            effects: [
              { type: "inc", key: "steps", by: 1 },
              { type: "pushLog", level: "info", text: "Moved to grove" }
            ]
          },
          {
            id: "to-lab",
            label: "Open lab",
            to: "lab",
            requires: [
              { type: "flagTruthy", key: "keycard" },
              { type: "flagEquals", key: "stage", value: 2 }
            ]
          },
          {
            id: "to-secret",
            label: "Secret path",
            to: "secret",
            requires: [
              { type: "capability", name: "betaRoute" }
            ]
          },
          {
            id: "probe-signal",
            label: "Probe the signal"
          }
        ]
      },
      grove: {
        id: "grove",
        title: "Grove",
        body: "An old grove.",
        choices: [
          {
            id: "grove-to-start",
            label: "Return",
            to: "start"
          }
        ]
      },
      lab: {
        id: "lab",
        title: "Lab",
        body: "A silent lab.",
        choices: []
      },
      secret: {
        id: "secret",
        title: "Secret",
        body: "A hidden alcove.",
        choices: []
      }
    }
  };
}

export function createClock({ start = 1000, step = 1 } = {}) {
  let value = start - step;
  return {
    now() {
      value += step;
      return value;
    }
  };
}
