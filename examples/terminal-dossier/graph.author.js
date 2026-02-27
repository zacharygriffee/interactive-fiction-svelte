import { body, choice, choices, fx, node, requires, storylet, storylets, tags } from "../../src/lib/story/dsl/index.js";

export const terminalDossierAuthorGraph = {
  start: "terminal_boot",
  nodes: [
    node("terminal_boot", [
      { title: "Signal Terminal" },
      body("A green cursor blinks over an open dossier shell. Something is already watching this session."),
      tags("intro", "terminal"),
      storylets([
        storylet("ambient-ping", "Static pings crawl through the speaker grille.", {
          priority: 1
        }),
        storylet("first-handshake", "A one-time handshake leak tags your operator ID and vanishes.", {
          priority: 6,
          once: true,
          effectsOnReveal: [
            fx.inc("curiosity", 1),
            fx.pushLog("info", "TRACE: handshake fragment cached")
          ]
        }),
        storylet("liaison-whisper", "A second voice appears only after your probe and asks for confirmation.", {
          priority: 5,
          requires: [
            requires.flag("probePrimed"),
            requires.cap("cap.askAgent")
          ]
        }),
        storylet("deep-dossier-window", "Deep dossier blocks unfold into personnel links and suppressed timestamps.", {
          priority: 4,
          requires: [requires.cap("cap.deepDossier")]
        }),
        storylet("stitched-timeline", "Relay output and deep dossier records lock into one surveillance timeline.", {
          priority: 7,
          requires: [
            requires.cap("cap.deepDossier"),
            requires.flag("relayAligned")
          ]
        })
      ]),
      choices([
        choice("probe-handshake", "Probe handshake buffer", undefined, {
          effects: [
            fx.set("probePrimed", true),
            fx.pushLog("info", "ACTION: probe-handshake")
          ]
        }),
        choice("to-corridor", "Follow the service corridor", "service_corridor", {
          effects: [
            fx.inc("steps", 1),
            fx.pushLog("info", "MOVE: service_corridor")
          ]
        }),
        choice("to-archive", "Open the dossier archive", "dossier_archive", {
          effects: [
            fx.inc("steps", 1),
            fx.pushLog("info", "MOVE: dossier_archive")
          ]
        }),
        choice("probe-banner", "Probe the watcher banner", undefined, {
          effects: [fx.pushLog("warn", "ACTION: watcher banner returned static")]
        }),
        choice("to-mirror-feed", "Route video to mirror feed", "mirror_feed", {
          requires: [requires.cap("cap.askAgent")]
        }),
        choice("to-root-console", "Enter root console", "root_console", {
          requires: [requires.cap("cap.deepDossier")]
        })
      ])
    ]),
    node("service_corridor", [
      { title: "Service Corridor" },
      body("The lights dim whenever the terminal emits a ping behind you."),
      tags("mid"),
      choices([
        choice("probe-corridor-camera", "Probe corridor camera loop", undefined, {
          effects: [
            fx.set("corridorProbed", true),
            fx.pushLog("info", "TRACE: corridor camera loop sampled")
          ]
        }),
        choice("corridor-to-relay", "Drop into relay hub", "relay_hub"),
        choice("corridor-to-vent", "Climb into vent grid", "vent_grid"),
        choice("corridor-to-terminal", "Return to terminal", "terminal_boot")
      ])
    ]),
    node("dossier_archive", [
      { title: "Dossier Archive" },
      body("Rows of sealed files sit behind glass that fogs when names get close."),
      tags("mid"),
      storylets([
        storylet("restricted-ledger", "A restricted ledger opens only after deep dossier authority is granted.", {
          priority: 3,
          requires: [requires.cap("cap.deepDossier")]
        })
      ]),
      choices([
        choice("read-manifest", "Read shipment manifest", undefined, {
          effects: [
            fx.set("manifestRead", true),
            fx.pushLog("info", "ACTION: manifest snapshot captured")
          ]
        }),
        choice("probe-index-lattice", "Probe archive index lattice", undefined, {
          effects: [
            fx.set("archiveProbed", true),
            fx.pushLog("info", "TRACE: archive index probe recorded")
          ]
        }),
        choice("archive-to-redaction", "Enter redaction bay", "redaction_bay"),
        choice("archive-to-relay", "Move to relay hub", "relay_hub"),
        choice("archive-to-terminal", "Return to terminal", "terminal_boot")
      ])
    ]),
    node("relay_hub", [
      { title: "Relay Hub" },
      body("Signal routers spin in place, assigning your packets to unnamed observers."),
      storylets([
        storylet("relay-hum", "The relay hum settles into a steady machine prayer.", {
          priority: 1
        }),
        storylet("relay-consensus", "Corridor and archive probes agree on one tracking identity.", {
          priority: 4,
          requires: [
            requires.flag("corridorProbed"),
            requires.flag("archiveProbed")
          ]
        })
      ]),
      choices([
        choice("align-relay", "Align relay timestamps", undefined, {
          effects: [
            fx.set("relayAligned", true),
            fx.pushLog("info", "ACTION: relay timestamps aligned")
          ]
        }),
        choice("relay-to-memory", "Descend to memory well", "memory_well"),
        choice("relay-to-quarantine", "Open quarantine gate", "quarantine_gate"),
        choice("relay-to-witness", "Enter witness chamber", "witness_chamber", {
          requires: [requires.flag("relayAligned")]
        }),
        choice("relay-to-terminal", "Return to terminal", "terminal_boot")
      ])
    ]),
    node("redaction_bay", [
      { title: "Redaction Bay" },
      body("Strips of erased text float above a warm scanner bed."),
      choices([
        choice("lift-redaction", "Lift redaction mask", undefined, {
          effects: [
            fx.set("redactionLifted", true),
            fx.pushLog("info", "ACTION: redaction mask lifted")
          ]
        }),
        choice("redaction-to-witness", "Carry file fragments to witness chamber", "witness_chamber"),
        choice("redaction-to-archive", "Return to archive", "dossier_archive")
      ])
    ]),
    node("memory_well", [
      { title: "Memory Well" },
      body("Archived audio loops play out of sync with your breathing."),
      storylets([
        storylet("agent-overlap", "A second operator answers your channel from the same timestamp.", {
          priority: 2,
          requires: [
            requires.cap("cap.askAgent"),
            requires.flag("relayAligned")
          ]
        })
      ]),
      choices([
        choice("probe-memory-loop", "Probe memory loop", undefined, {
          effects: [
            fx.set("memoryProbe", true),
            fx.pushLog("info", "TRACE: memory loop probe complete")
          ]
        }),
        choice("memory-to-witness", "Go to witness chamber", "witness_chamber"),
        choice("memory-to-relay", "Return to relay hub", "relay_hub")
      ])
    ]),
    node("quarantine_gate", [
      { title: "Quarantine Gate" },
      body("A biometric gate keeps reopening, as if waiting for a face it already knows."),
      choices([
        choice("spoof-clearance", "Spoof quarantine clearance", undefined, {
          effects: [
            fx.set("spoofClearance", true),
            fx.pushLog("warn", "ACTION: quarantine clearance spoofed")
          ]
        }),
        choice("quarantine-to-witness", "Pass to witness chamber", "witness_chamber", {
          requires: [requires.flag("spoofClearance")]
        }),
        choice("quarantine-to-relay", "Return to relay hub", "relay_hub"),
        choice("quarantine-to-mirror", "Open mirror feed", "mirror_feed")
      ])
    ]),
    node("mirror_feed", [
      { title: "Mirror Feed" },
      body("A live camera view tracks you from angles this facility should not have."),
      storylets([
        storylet("mirror-echo", "The feed shows a second cursor typing your next command before you do.", {
          priority: 5,
          once: true,
          effectsOnReveal: [fx.pushLog("warn", "TRACE: mirror feed predicted operator input")]
        }),
        storylet("mirror-dossier-overlay", "Names from the deep dossier map directly onto reflected faces.", {
          priority: 3,
          requires: [
            requires.cap("cap.deepDossier"),
            requires.flag("reflectionProbed")
          ]
        })
      ]),
      choices([
        choice("probe-reflection", "Probe reflection latency", undefined, {
          effects: [
            fx.set("reflectionProbed", true),
            fx.pushLog("info", "TRACE: reflection latency sampled")
          ]
        }),
        choice("mirror-to-quarantine", "Return to quarantine gate", "quarantine_gate"),
        choice("mirror-to-lift", "Take silent lift", "silent_lift"),
        choice("mirror-to-terminal", "Return to terminal", "terminal_boot")
      ])
    ]),
    node("witness_chamber", [
      { title: "Witness Chamber" },
      body("A single chair faces a monitor labeled: YOU WERE HERE EARLIER."),
      storylets([
        storylet("witness-ready", "The chamber accepts your packet as admissible evidence.", {
          priority: 3,
          requires: [
            requires.flag("redactionLifted"),
            requires.flag("relayAligned")
          ]
        }),
        storylet("crosscheck-dossier", "Deep dossier notes identify the witness as a recycled operator profile.", {
          priority: 4,
          requires: [
            requires.cap("cap.deepDossier"),
            requires.flag("manifestRead")
          ]
        })
      ]),
      choices([
        choice("interrogate-witness", "Interrogate witness transcript", undefined, {
          effects: [
            fx.set("witnessSpoken", true),
            fx.pushLog("info", "ACTION: witness transcript interrogated")
          ]
        }),
        choice("probe-witness-thread", "Probe witness thread", undefined, {
          effects: [fx.pushLog("info", "TRACE: witness thread probe acknowledged")]
        }),
        choice("witness-to-lift", "Take silent lift", "silent_lift"),
        choice("witness-to-rooftop", "Climb to rooftop array", "rooftop_array", {
          requires: [requires.flag("witnessSpoken")]
        }),
        choice("witness-to-relay", "Return to relay hub", "relay_hub")
      ])
    ]),
    node("silent_lift", [
      { title: "Silent Lift" },
      body("The lift moves without vibration, as if your destination was queued long ago."),
      choices([
        choice("lift-to-root", "Descend to root console", "root_console"),
        choice("lift-to-rooftop", "Ascend to rooftop array", "rooftop_array"),
        choice("lift-to-witness", "Return to witness chamber", "witness_chamber"),
        choice("lift-to-mirror", "Return to mirror feed", "mirror_feed")
      ])
    ]),
    node("vent_grid", [
      { title: "Vent Grid" },
      body("Cold air carries fragments of commands from rooms below."),
      choices([
        choice("tap-vent-grid", "Tap vent relay", undefined, {
          effects: [
            fx.set("ventTapped", true),
            fx.pushLog("info", "ACTION: vent relay tapped")
          ]
        }),
        choice("vent-to-relay", "Drop to relay hub", "relay_hub"),
        choice("vent-to-rooftop", "Crawl to rooftop array", "rooftop_array", {
          requires: [requires.flag("ventTapped")]
        }),
        choice("vent-to-corridor", "Return to service corridor", "service_corridor")
      ])
    ]),
    node("root_console", [
      { title: "Root Console" },
      body("Root prompts bloom across black glass and request your forgotten clearance."),
      storylets([
        storylet("root-shell", "Root shell unlocks a branch tagged with your old operator hash.", {
          priority: 4,
          requires: [
            requires.cap("cap.deepDossier"),
            requires.flag("witnessSpoken")
          ]
        })
      ]),
      choices([
        choice("probe-root-daemon", "Probe root daemon", undefined, {
          effects: [
            fx.set("rootDaemonProbed", true),
            fx.pushLog("warn", "TRACE: root daemon probe returned mirrored PID")
          ]
        }),
        choice("compile-dossier", "Compile dossier packet", undefined, {
          requires: [
            requires.cap("cap.deepDossier"),
            requires.flag("manifestRead")
          ],
          effects: [
            fx.set("dossierCompiled", true),
            fx.pushLog("info", "ACTION: dossier packet compiled")
          ]
        }),
        choice("root-to-exfil", "Open exfil gateway", "exfil_gateway", {
          requires: [requires.flag("dossierCompiled")]
        }),
        choice("root-to-lift", "Return to silent lift", "silent_lift"),
        choice("root-to-terminal", "Return to terminal", "terminal_boot")
      ])
    ]),
    node("rooftop_array", [
      { title: "Rooftop Array" },
      body("Antennae point at a sky full of silent traffic."),
      storylets([
        storylet("skyline-channel", "An auxiliary operator channel opens over the city mesh.", {
          priority: 2,
          requires: [
            requires.cap("cap.askAgent"),
            requires.flag("relayAligned")
          ]
        })
      ]),
      choices([
        choice("probe-skyline", "Probe skyline channel", undefined, {
          effects: [fx.pushLog("info", "TRACE: skyline probe dispatched")]
        }),
        choice("rooftop-to-exfil", "Signal exfil gateway", "exfil_gateway", {
          requires: [requires.flag("witnessSpoken")]
        }),
        choice("rooftop-to-lift", "Return to silent lift", "silent_lift"),
        choice("rooftop-to-terminal", "Return to terminal", "terminal_boot")
      ])
    ]),
    node("exfil_gateway", [
      { title: "Exfil Gateway" },
      body("Outbound channels open in sequence, each signed by an unrecognized authority."),
      storylets([
        storylet("exfil-window", "The gateway marks this dossier as previously submitted by you.", {
          priority: 3,
          requires: [
            requires.flag("dossierCompiled"),
            requires.flag("witnessSpoken")
          ]
        })
      ]),
      choices([
        choice("transmit-dossier", "Transmit dossier", undefined, {
          effects: [
            fx.set("transmitted", true),
            fx.inc("steps", 1),
            fx.pushLog("info", "TRANSMIT: dossier package sent")
          ]
        }),
        choice("exfil-to-terminal", "Loop back to terminal", "terminal_boot"),
        choice("hold-pattern", "Hold position", undefined, {
          effects: [fx.pushLog("warn", "ACTION: exfil hold pattern active")]
        })
      ])
    ])
  ]
};
