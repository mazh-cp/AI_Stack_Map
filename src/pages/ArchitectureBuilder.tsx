import { useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type Node,
} from "reactflow";
import { GripVertical } from "lucide-react";
import { useStore } from "../store/useStore";
import { StackNode } from "../components/flow/StackNode";
import { InspectorPanel } from "../components/flow/InspectorPanel";
import { CONTROL_ICONS } from "../lib/flow";
import { LAYERS, LAYER_ORDER } from "../lib/constants";
import type { LayerKey, OwaspCategory, SecurityControl } from "../types";
import type { StackNodeData } from "../components/flow/StackNode";

const nodeTypes = { stack: StackNode };

interface Template {
  name: string;
  layer: LayerKey;
  owasp: OwaspCategory[];
  description: string;
}

const PALETTE: Template[] = [
  { name: "WAF / Bot Defense", layer: "input", owasp: ["LLM01"], description: "Edge filtering of malicious traffic." },
  { name: "Prompt Injection Classifier", layer: "input", owasp: ["LLM01"], description: "Scores prompts for injection intent." },
  { name: "Retrieval Source Validation", layer: "retrieval", owasp: ["LLM04", "LLM08"], description: "Validate & sign ingested documents." },
  { name: "Vault for Secrets", layer: "secrets", owasp: ["LLM07"], description: "Centralized secret storage." },
  { name: "Hardened System Prompt", layer: "secrets", owasp: ["LLM07"], description: "Leak-resistant instruction hierarchy." },
  { name: "Signed Model Files", layer: "model", owasp: ["LLM03"], description: "Integrity-verified model artifacts." },
  { name: "Tool Allow-list", layer: "tools", owasp: ["LLM06"], description: "Only approved tools are callable." },
  { name: "Output Schema Validation", layer: "output", owasp: ["LLM05"], description: "Validate structured output." },
  { name: "DLP Scan", layer: "output", owasp: ["LLM02"], description: "Block & log sensitive data egress." },
  { name: "SIEM Logging", layer: "monitoring", owasp: ["LLM02"], description: "Forward events to the SIEM." },
];

function toNode(c: SecurityControl, selected: boolean): Node {
  return {
    id: c.id,
    type: "stack",
    position: c.position ?? { x: 40, y: 40 },
    selected,
    data: {
      label: c.name,
      layer: c.layer,
      status: c.status,
      owasp: c.owasp,
      icon: CONTROL_ICONS[c.layer],
    } as StackNodeData,
  };
}

function BuilderCanvas() {
  const {
    controls,
    selectControl,
    selectedControlId,
    updateControlPosition,
    addControl,
  } = useStore();
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(
    controls.map((c) => toNode(c, c.id === selectedControlId))
  );

  // Keep canvas in sync with the store (status edits, palette drops, deletes)
  useEffect(() => {
    setNodes(controls.map((c) => toNode(c, c.id === selectedControlId)));
  }, [controls, selectedControlId, setNodes]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/control");
      if (!raw) return;
      const t = JSON.parse(raw) as Template;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const control: SecurityControl = {
        id: `ctl-${Date.now()}`,
        name: t.name,
        description: t.description,
        layer: t.layer,
        mitigates: [],
        owasp: t.owasp,
        status: "planned",
        owner: "Unassigned",
        weight: 2,
        position,
      };
      addControl(control);
      selectControl(control.id);
    },
    [screenToFlowPosition, addControl, selectControl]
  );

  return (
    <div className="relative flex-1">
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={(_, n) => updateControlPosition(n.id, n.position)}
        onNodeClick={(_, n) => selectControl(n.id)}
        onPaneClick={() => selectControl(null)}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        fitView
        minZoom={0.2}
        className="bg-base-bg"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#E5E7EB"
        />
        <Controls />
      </ReactFlow>
      <div className="pointer-events-none absolute left-4 top-4">
        <h1 className="text-lg font-bold text-white">Architecture Builder</h1>
        <p className="text-xs text-gray-500">
          Drag controls from the palette onto the canvas · drag nodes to arrange
        </p>
      </div>
    </div>
  );
}

function Palette() {
  return (
    <aside className="w-64 flex-shrink-0 overflow-auto border-r border-base-border bg-base-sidebar p-4">
      <p className="stat-label mb-3">Control Palette</p>
      <div className="space-y-2">
        {PALETTE.map((t) => (
          <div
            key={t.name}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/control", JSON.stringify(t));
              e.dataTransfer.effectAllowed = "move";
            }}
            className="flex cursor-grab items-center gap-2 rounded-lg border border-base-border bg-base-card px-3 py-2 hover:border-accent/40 active:cursor-grabbing"
            style={{ borderLeft: `3px solid ${LAYERS[t.layer].color}` }}
          >
            <GripVertical className="h-4 w-4 flex-shrink-0 text-gray-600" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-gray-200">
                {t.name}
              </p>
              <p className="text-[10px] text-gray-500">{LAYERS[t.layer].name}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-gray-600">
        Tip: drop a control near its layer band. Click any node to edit its
        owner, status, evidence and notes in the inspector.
      </p>
      <div className="mt-4 space-y-1 border-t border-base-border pt-3">
        <p className="stat-label mb-1">Layers</p>
        {LAYER_ORDER.map((l) => (
          <div key={l} className="flex items-center gap-2 text-xs text-gray-400">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: LAYERS[l].color }}
            />
            {LAYERS[l].name}
          </div>
        ))}
      </div>
    </aside>
  );
}

export function ArchitectureBuilder() {
  return (
    <ReactFlowProvider>
      <div className="flex h-full">
        <Palette />
        <BuilderCanvas />
        <InspectorPanel />
      </div>
    </ReactFlowProvider>
  );
}
