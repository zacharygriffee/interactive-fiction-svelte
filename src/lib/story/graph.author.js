import { body, choice, choices, fx, graph, node, requires, storylet, storylets, tags } from "./dsl/index.js";

export const storyGraph = graph({
  start: "start",
  nodes: [
    node("start", [
      { title: "Crossroads" },
      body("You stand at the edge of the old forest."),
      tags("intro"),
      storylets([
        storylet("ambient-note", "Wind carries fragments of voices through the pines.", {
          priority: 1
        }),
        storylet("first-glimpse", "A dossier fragment flickers into view, then stabilizes.", {
          priority: 3,
          once: true,
          effectsOnReveal: [fx.inc("curiosity", 1)]
        }),
        storylet("deep-dossier", "The deep dossier decrypts and maps hidden motives.", {
          priority: 2,
          requires: [requires.cap("cap.deepDossier")]
        })
      ]),
      choices([
        choice("inspect", "Inspect the path", undefined, {
          effects: [
            fx.pushLog("info", "Inspected the path."),
            fx.set("inspected", true)
          ]
        }),
        choice("probe-signal", "Probe the distant signal"),
        choice("to-forest", "Enter the forest", "forest", {
          effects: [fx.inc("steps", 1)]
        }),
        choice("to-secret", "Take the hidden route", "secret", {
          requires: [requires.cap("cap.deepDossier")]
        })
      ])
    ]),
    node("forest", [
      { title: "Forest" },
      body("Trees close in around you."),
      tags("mid"),
      choices([
        choice("to-start", "Go back", "start")
      ])
    ]),
    node("secret", [
      { title: "Secret Route" },
      body("The hidden route opens under moonlight."),
      choices([
        choice("to-start", "Return to crossroads", "start")
      ])
    ])
  ]
});
