import type { Node, Edge } from "reactflow";
import { MarkerType } from "reactflow";
import type {
  SecurityControl,
  LayerKey,
  FileScan,
  PromptInspection,
} from "../types";
import { LAYERS, LAYER_ORDER } from "./constants";
import type { StackNodeData } from "../components/flow/StackNode";

const ZONE_WIDTH = 240;
const ZONE_GAP = 60;
const ZONE_STRIDE = ZONE_WIDTH + ZONE_GAP;
const ZONE_HEADER = 64;
const CARD_HEIGHT = 92;
const ZONE_TOP = 0;

export const CONTROL_ICONS: Record<LayerKey, string> = {
  threats: "Users",
  input: "Filter",
  file: "FileSearch",
  guard: "ScanSearch",
  retrieval: "Database",
  secrets: "KeyRound",
  model: "BrainCircuit",
  tools: "Wrench",
  output: "ScanLine",
  delivery: "Send",
  monitoring: "Activity",
  compliance: "ClipboardCheck",
  future: "Sparkles",
};

interface BuildOpts {
  fileScans?: FileScan[];
  promptInspections?: PromptInspection[];
}

function badgeFor(
  control: SecurityControl,
  opts: BuildOpts
): StackNodeData["badge"] {
  if (control.vendor === "checkpoint" && control.layer === "file") {
    const blocked = (opts.fileScans ?? []).filter(
      (f) => f.blockedFromRetrieval
    ).length;
    const total = (opts.fileScans ?? []).length;
    if (!total) return undefined;
    return blocked
      ? { text: `${blocked} blocked`, tone: "bad" }
      : { text: `${total} clean`, tone: "good" };
  }
  if (control.vendor === "lakera") {
    const blocked = (opts.promptInspections ?? []).filter(
      (p) => p.decision === "block" || p.decision === "redact"
    ).length;
    if (!blocked) return undefined;
    return { text: `${blocked} flagged`, tone: "warn" };
  }
  return undefined;
}

/** Build a clean column-per-zone layout for the LLM stack map. */
export function buildStackFlow(
  controls: SecurityControl[],
  opts: BuildOpts = {}
): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];

  // Group controls by layer
  const byLayer: Record<string, SecurityControl[]> = {};
  for (const c of controls) {
    (byLayer[c.layer] ??= []).push(c);
  }

  // Only lay out zones that actually contain controls, in flow order, so the
  // map stays readable (empty zones like Future Enhancements are omitted here
  // but still appear in Layer Assessment).
  const populated = LAYER_ORDER.filter((l) => (byLayer[l]?.length ?? 0) > 0);

  const maxRows = Math.max(
    1,
    ...populated.map((l) => byLayer[l]?.length ?? 0)
  );
  const zoneHeight = ZONE_HEADER + maxRows * CARD_HEIGHT + 24;

  // Zone backdrops
  populated.forEach((layerKey, idx) => {
    const layer = LAYERS[layerKey];
    nodes.push({
      id: `zone-${layerKey}`,
      type: "zone",
      position: { x: idx * ZONE_STRIDE, y: ZONE_TOP },
      data: {
        label: layer.name,
        color: layer.color,
        description: layer.description,
      },
      draggable: false,
      selectable: false,
      style: { width: ZONE_WIDTH, height: zoneHeight, zIndex: 0 },
    });
  });

  // Control cards inside each zone
  populated.forEach((layerKey, idx) => {
    const list = byLayer[layerKey] ?? [];
    list.forEach((c, i) => {
      nodes.push({
        id: c.id,
        type: "stack",
        position: {
          x: idx * ZONE_STRIDE + 12,
          y: ZONE_TOP + ZONE_HEADER + i * CARD_HEIGHT,
        },
        data: {
          label: c.name,
          layer: c.layer,
          status: c.status,
          owasp: c.owasp,
          icon: CONTROL_ICONS[c.layer],
          vendor: c.vendor,
          badge: badgeFor(c, opts),
        } as StackNodeData,
        zIndex: 1,
      });
    });
  });

  // Edges: connect each populated zone to the next populated zone
  const edges: Edge[] = [];
  for (let i = 0; i < populated.length - 1; i++) {
    const from = byLayer[populated[i]][0];
    const to = byLayer[populated[i + 1]][0];
    edges.push({
      id: `e-${from.id}-${to.id}`,
      source: from.id,
      target: to.id,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#4EB5A9" },
    });
  }

  return { nodes, edges };
}
