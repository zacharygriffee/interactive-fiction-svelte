import { body, choice, choices, fx, node, requires, storylet, storylets, tags } from "../../src/lib/story/dsl/index.js";

export const shinobiDemoAuthorGraph = {
  start: "roofline",
  nodes: [
    node("roofline", [
      { title: "Roofline" },
      body("Rain combs across the antenna field while Shinobi studies Virtualia's service district cycling through another sleepless loop."),
      tags("shinobi", "intro", "investigation"),
      storylets([
        storylet("roofline-hum", "Relay traffic hums under the district, low and steady, like a machine pretending it knows how to sleep.", {
          priority: 1
        }),
        storylet("watcher-shadow", "A watcher-shaped smear skates across a mirrored pane, gone again before the angle can lock.", {
          priority: 5,
          once: true,
          effectsOnReveal: [
            fx.learn("watcherShadow"),
            fx.pushLog("info", "TRACE: rooftop watcher marked")
          ]
        })
      ]),
      choices([
        choice("collect-sniffer-chip", "Slip a sniffer chip into your palm", undefined, {
          requires: [requires.not(requires.item("signalChip"))],
          effects: [
            fx.addItem("signalChip", 1),
            fx.pushLog("info", "ACTION: sniffer chip lifted")
          ]
        }),
        choice("ping-zephyr", "Tap Zephyr for a favor", undefined, {
          requires: [requires.not(requires.relationship("zephyr", 1))],
          effects: [
            fx.adjustRelationship("zephyr", 3),
            fx.setTimer("zephyrWindow", 2),
            fx.pushLog("info", "ACTION: Zephyr line nudged open")
          ]
        }),
        choice("drop-to-service", "Drop into the service access run", "service_access", {
          effects: [
            fx.advanceTimer("pursuit", 1),
            fx.pushLog("info", "MOVE: dropped into service_access")
          ]
        }),
        choice("cut-through-market", "Cut across the market edge", "market_edge", {
          effects: [
            fx.advanceTimer("pursuit", 2),
            fx.pushLog("warn", "MOVE: crossed into market_edge")
          ]
        })
      ])
    ]),
    node("service_access", [
      { title: "Service Access" },
      body("The maintenance corridor smells like wet dust and coolant. Ahead, a terminal sits half-closed, as if somebody stood up from it too fast."),
      tags("shinobi", "service"),
      storylets([
        storylet("glass-shadow", "That reflected watcher keeps surfacing a beat behind Shinobi's own movement, never quite late enough to ignore.", {
          priority: 3,
          requires: [requires.knowledge("watcherShadow")]
        }),
        storylet("open-archive-port", "The archive port is already listening. Decoding the chip left the seal ragged.", {
          priority: 4,
          requires: [requires.scene("archive", "terminalOpen", true)]
        })
      ]),
      choices([
        choice("decode-chip", "Crack open the sniffer chip", undefined, {
          requires: [
            requires.item("signalChip"),
            requires.not(requires.knowledge("nexusPattern"))
          ],
          effects: [
            fx.learn("nexusPattern"),
            fx.setSceneFlag("archive", "terminalOpen", true),
            fx.advanceTimer("pursuit", 1),
            fx.pushLog("info", "TRACE: sniffer chip cracked")
          ]
        }),
        choice("map-guard-rhythm", "Read the guard rhythm", undefined, {
          requires: [requires.not(requires.knowledge("guardRhythm"))],
          effects: [
            fx.learn("guardRhythm"),
            fx.pushLog("info", "TRACE: guard rhythm read")
          ]
        }),
        choice("enter-archive", "Slide into the archive shell", "archive_shell", {
          requires: [
            requires.knowledge("nexusPattern"),
            requires.relationship("zephyr", 3),
            requires.scene("archive", "terminalOpen", true)
          ]
        }),
        choice("service-to-market", "Angle out toward the market edge", "market_edge", {
          effects: [fx.advanceTimer("pursuit", 1)]
        }),
        choice("service-to-roof", "Climb back to the roofline", "roofline")
      ])
    ]),
    node("market_edge", [
      { title: "Market Edge" },
      body("Most of the vendors have folded their stalls, but the market never really closes. Counterfeit credentials and exit routes still pass hand to hand in voices too soft for the cameras."),
      tags("shinobi", "market"),
      storylets([
        storylet("service-tail", "Someone may have ridden Shinobi's service route into the market. The feeling sticks even when the crowd thins.", {
          priority: 2,
          requires: [requires.visitedNode("service_access")]
        }),
        storylet("zephyr-cutout", "Zephyr leaves a single cutout channel hanging open, the kind that comes with a timer and a threat.", {
          priority: 4,
          requires: [
            requires.relationship("zephyr", 3),
            requires.timerAtLeast("zephyrWindow", 2)
          ]
        })
      ]),
      choices([
        choice("buy-burner-pass", "Buy a burner pass off the whispers", undefined, {
          requires: [requires.not(requires.item("burnerPass"))],
          effects: [
            fx.addItem("burnerPass", 1),
            fx.advanceTimer("pursuit", 1),
            fx.pushLog("warn", "ACTION: burner pass acquired")
          ]
        }),
        choice("call-zephyr-favor", "Lean on Zephyr's favor", undefined, {
          requires: [requires.not(requires.chose("call-zephyr-favor"))],
          effects: [
            fx.adjustRelationship("zephyr", 1),
            fx.setTimer("zephyrWindow", 3),
            fx.pushLog("info", "ACTION: Zephyr cleared a cleaner corridor")
          ]
        }),
        choice("market-to-archive", "Use the stalls as cover into archive shell", "archive_shell", {
          requires: [
            requires.item("burnerPass"),
            requires.timerAtMost("pursuit", 3)
          ]
        }),
        choice("market-to-service", "Slip back toward service access", "service_access")
      ])
    ]),
    node("archive_shell", [
      { title: "Archive Shell" },
      body("Cold mirrors stack into black corridors, each one holding routes that should have died on contact and somehow didn't."),
      tags("shinobi", "archive"),
      storylets([
        storylet("decoded-ledger", "The cracked chip lines up with an older ledger fragment. After that, the pattern stops passing for coincidence.", {
          priority: 5,
          requires: [requires.chose("decode-chip")]
        }),
        storylet("market-residue", "The market route left a residue of borrowed identities in the archive glass. Cheap masks. Good enough until they aren't.", {
          priority: 3,
          requires: [requires.visitedNode("market_edge")]
        })
      ]),
      choices([
        choice("pull-mirror-trace", "Pull a trace out of the mirror stack", undefined, {
          requires: [requires.not(requires.knowledge("echoAnchor"))],
          effects: [
            fx.learn("echoAnchor"),
            fx.advanceTimer("pursuit", 1),
            fx.pushLog("info", "TRACE: echo anchor pulled free")
          ]
        }),
        choice("download-ledger", "Lift the ledger fragment", undefined, {
          requires: [requires.not(requires.item("ledgerFragment"))],
          effects: [
            fx.addItem("ledgerFragment", 1),
            fx.pushLog("info", "ACTION: ledger fragment lifted")
          ]
        }),
        choice("route-through-echo", "Thread the route into the echo chamber", "echo_chamber", {
          requires: [requires.knowledge("echoAnchor")]
        }),
        choice("brute-force-relay", "Kick the relay lock until it gives", "echo_chamber", {
          requires: [requires.item("burnerPass")],
          effects: [
            fx.advanceTimer("pursuit", 2),
            fx.pushLog("warn", "ACTION: relay lock kicked open")
          ]
        }),
        choice("archive-to-market", "Fade back out to the market edge", "market_edge")
      ])
    ]),
    node("echo_chamber", [
      { title: "Echo Chamber" },
      body("The channel is supposed to be dead. It still carries enough current to decide whether Shinobi walks out with the evidence or gets buried under it."),
      tags("shinobi", "echo"),
      storylets([
        storylet("zephyr-window-live", "Zephyr's cutout route is still breathing, but only for a little longer. Trust it now or lose it.", {
          priority: 4,
          requires: [
            requires.relationship("zephyr", 3),
            requires.timerAtLeast("zephyrWindow", 2)
          ]
        }),
        storylet("pressure-wave", "Security pressure is spiking. The chamber has started listening hard enough to make breathing feel expensive.", {
          priority: 6,
          requires: [requires.timerAtLeast("pursuit", 4)]
        }),
        storylet("ledger-corroboration", "The ledger fragment confirms what the decoded pattern was already whispering: this was built. It was never noise.", {
          priority: 5,
          requires: [
            requires.itemCount("ledgerFragment", 1),
            requires.knowledge("nexusPattern")
          ]
        })
      ]),
      choices([
        choice("seal-trace-and-exfil", "Seal the trace and walk out clean", "clean_exit", {
          requires: [
            requires.knowledge("nexusPattern"),
            requires.knowledge("echoAnchor"),
            requires.relationship("zephyr", 3),
            requires.timerAtMost("pursuit", 3),
            requires.itemCount("ledgerFragment", 1)
          ],
          effects: [
            fx.removeItem("signalChip", 1),
            fx.pushLog("info", "ACTION: clean exfil line committed")
          ]
        }),
        choice("burn-evidence-and-run", "Torch the evidence and run hot", "blown_cover", {
          requires: [requires.timerAtLeast("pursuit", 4)],
          effects: [fx.pushLog("warn", "ACTION: evidence torched during compromised exit")]
        }),
        choice("echo-to-archive", "Fall back to archive shell", "archive_shell")
      ])
    ]),
    node("clean_exit", [
      { title: "Clean Exit" },
      body("Shinobi leaves with proof, a thinner shadow, and the kind of certainty that only gets heavier once you're carrying it."),
      tags("ending", "success"),
      choices([
        choice("restart-clean", "Run the route again", "roofline")
      ])
    ]),
    node("blown_cover", [
      { title: "Blown Cover" },
      body("The exit still works, but only as escape. The city keeps the shape of the truth for itself and lets the proof burn off in the dark."),
      tags("ending", "failure"),
      choices([
        choice("restart-blown", "Reset and try another route", "roofline")
      ])
    ])
  ]
};
