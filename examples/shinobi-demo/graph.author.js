import { body, choice, choices, fx, node, requires, storylet, storylets, tags } from "../../src/lib/story/dsl/index.js";

export const shinobiDemoAuthorGraph = {
  start: "roofline",
  nodes: [
    node("roofline", [
      { title: "Roofline" },
      body("Rain skims the antenna field while Shinobi watches Virtualia's service district breathe in quiet loops."),
      tags("shinobi", "intro", "investigation"),
      storylets([
        storylet("roofline-hum", "Relay traffic hums beneath the city like a machine trying to sound asleep.", {
          priority: 1
        }),
        storylet("watcher-shadow", "A watcher silhouette flickers in a mirrored pane and vanishes before the angle can settle.", {
          priority: 5,
          once: true,
          effectsOnReveal: [
            fx.learn("watcherShadow"),
            fx.pushLog("info", "TRACE: rooftop watcher flagged")
          ]
        })
      ]),
      choices([
        choice("collect-sniffer-chip", "Pocket a sniffer chip", undefined, {
          effects: [
            fx.addItem("signalChip", 1),
            fx.pushLog("info", "ACTION: sniffer chip pocketed")
          ]
        }),
        choice("ping-zephyr", "Ping Zephyr for a favor", undefined, {
          effects: [
            fx.adjustRelationship("zephyr", 3),
            fx.setTimer("zephyrWindow", 2),
            fx.pushLog("info", "ACTION: Zephyr favor line opened")
          ]
        }),
        choice("drop-to-service", "Drop into service access", "service_access", {
          effects: [
            fx.advanceTimer("pursuit", 1),
            fx.pushLog("info", "MOVE: service_access")
          ]
        }),
        choice("cut-through-market", "Cut through the market edge", "market_edge", {
          effects: [
            fx.advanceTimer("pursuit", 2),
            fx.pushLog("warn", "MOVE: market_edge")
          ]
        })
      ])
    ]),
    node("service_access", [
      { title: "Service Access" },
      body("A maintenance corridor holds its breath around a terminal someone forgot to fully close."),
      tags("shinobi", "service"),
      storylets([
        storylet("glass-shadow", "The watcher reflection keeps reappearing a fraction behind Shinobi's own motion.", {
          priority: 3,
          requires: [requires.knowledge("watcherShadow")]
        }),
        storylet("open-archive-port", "The archive port is already listening after the chip decode tears a seam in it.", {
          priority: 4,
          requires: [requires.scene("archive", "terminalOpen", true)]
        })
      ]),
      choices([
        choice("decode-chip", "Decode the sniffer chip", undefined, {
          requires: [requires.item("signalChip")],
          effects: [
            fx.learn("nexusPattern"),
            fx.setSceneFlag("archive", "terminalOpen", true),
            fx.advanceTimer("pursuit", 1),
            fx.pushLog("info", "TRACE: signal chip decoded")
          ]
        }),
        choice("map-guard-rhythm", "Map the guard rhythm", undefined, {
          effects: [
            fx.learn("guardRhythm"),
            fx.pushLog("info", "TRACE: guard rhythm mapped")
          ]
        }),
        choice("enter-archive", "Slip into the archive shell", "archive_shell", {
          requires: [
            requires.knowledge("nexusPattern"),
            requires.relationship("zephyr", 3),
            requires.scene("archive", "terminalOpen", true)
          ]
        }),
        choice("service-to-market", "Cut across to market edge", "market_edge", {
          effects: [fx.advanceTimer("pursuit", 1)]
        }),
        choice("service-to-roof", "Retreat to the roofline", "roofline")
      ])
    ]),
    node("market_edge", [
      { title: "Market Edge" },
      body("Vendors have packed up, but counterfeit credentials and clean exits still circulate in whispers."),
      tags("shinobi", "market"),
      storylets([
        storylet("service-tail", "Someone from the service corridor may have tailed the route into the market.", {
          priority: 2,
          requires: [requires.visitedNode("service_access")]
        }),
        storylet("zephyr-cutout", "Zephyr leaves one cutout window open and dares Shinobi to use it quickly.", {
          priority: 4,
          requires: [
            requires.relationship("zephyr", 3),
            requires.timerAtLeast("zephyrWindow", 2)
          ]
        })
      ]),
      choices([
        choice("buy-burner-pass", "Buy a burner pass", undefined, {
          effects: [
            fx.addItem("burnerPass", 1),
            fx.advanceTimer("pursuit", 1),
            fx.pushLog("warn", "ACTION: burner pass acquired")
          ]
        }),
        choice("call-zephyr-favor", "Call in Zephyr's favor", undefined, {
          effects: [
            fx.adjustRelationship("zephyr", 1),
            fx.setTimer("zephyrWindow", 3),
            fx.pushLog("info", "ACTION: Zephyr opened a cleaner corridor")
          ]
        }),
        choice("market-to-archive", "Use the stalls to reach archive shell", "archive_shell", {
          requires: [
            requires.item("burnerPass"),
            requires.timerAtMost("pursuit", 3)
          ]
        }),
        choice("market-to-service", "Return to service access", "service_access")
      ])
    ]),
    node("archive_shell", [
      { title: "Archive Shell" },
      body("Cold mirrors hold copies of routes that were never supposed to survive first contact."),
      tags("shinobi", "archive"),
      storylets([
        storylet("decoded-ledger", "The decoded chip aligns with an older ledger fragment and the pattern stops looking accidental.", {
          priority: 5,
          requires: [requires.chose("decode-chip")]
        }),
        storylet("market-residue", "The market route leaves a trace of borrowed identities in the archive glass.", {
          priority: 3,
          requires: [requires.visitedNode("market_edge")]
        })
      ]),
      choices([
        choice("pull-mirror-trace", "Pull the mirror trace", undefined, {
          effects: [
            fx.learn("echoAnchor"),
            fx.advanceTimer("pursuit", 1),
            fx.pushLog("info", "TRACE: echo anchor extracted")
          ]
        }),
        choice("download-ledger", "Download ledger fragment", undefined, {
          effects: [
            fx.addItem("ledgerFragment", 1),
            fx.pushLog("info", "ACTION: ledger fragment downloaded")
          ]
        }),
        choice("route-through-echo", "Route through the echo chamber", "echo_chamber", {
          requires: [requires.knowledge("echoAnchor")]
        }),
        choice("brute-force-relay", "Brute-force the relay lock", "echo_chamber", {
          requires: [requires.item("burnerPass")],
          effects: [
            fx.advanceTimer("pursuit", 2),
            fx.pushLog("warn", "ACTION: relay lock forced")
          ]
        }),
        choice("archive-to-market", "Fade back to the market edge", "market_edge")
      ])
    ]),
    node("echo_chamber", [
      { title: "Echo Chamber" },
      body("A dead channel waits with just enough live current to decide whether the evidence leaves with Shinobi or buries him there."),
      tags("shinobi", "echo"),
      storylets([
        storylet("zephyr-window-live", "Zephyr's cutout route is still live, but only if Shinobi trusts it enough to move now.", {
          priority: 4,
          requires: [
            requires.relationship("zephyr", 3),
            requires.timerAtLeast("zephyrWindow", 2)
          ]
        }),
        storylet("pressure-wave", "Security pressure is climbing. The chamber already sounds too interested in Shinobi's breathing.", {
          priority: 6,
          requires: [requires.timerAtLeast("pursuit", 4)]
        }),
        storylet("ledger-corroboration", "The ledger fragment corroborates the decoded pattern: this was architecture, not noise.", {
          priority: 5,
          requires: [
            requires.itemCount("ledgerFragment", 1),
            requires.knowledge("nexusPattern")
          ]
        })
      ]),
      choices([
        choice("seal-trace-and-exfil", "Seal the trace and exfiltrate clean", "clean_exit", {
          requires: [
            requires.knowledge("nexusPattern"),
            requires.knowledge("echoAnchor"),
            requires.relationship("zephyr", 3),
            requires.timerAtMost("pursuit", 3),
            requires.itemCount("ledgerFragment", 1)
          ],
          effects: [
            fx.removeItem("signalChip", 1),
            fx.pushLog("info", "ACTION: clean exfil route committed")
          ]
        }),
        choice("burn-evidence-and-run", "Burn the evidence and run", "blown_cover", {
          requires: [requires.timerAtLeast("pursuit", 4)],
          effects: [fx.pushLog("warn", "ACTION: evidence burned during compromised exit")]
        }),
        choice("echo-to-archive", "Retreat to archive shell", "archive_shell")
      ])
    ]),
    node("clean_exit", [
      { title: "Clean Exit" },
      body("Shinobi leaves with proof, a thinner trail, and just enough certainty to know the structure is real."),
      tags("ending", "success"),
      choices([
        choice("restart-clean", "Run the route again", "roofline")
      ])
    ]),
    node("blown_cover", [
      { title: "Blown Cover" },
      body("The exit works only as escape. The city keeps the shape of the truth, but not the proof."),
      tags("ending", "failure"),
      choices([
        choice("restart-blown", "Reset and try another route", "roofline")
      ])
    ])
  ]
};
