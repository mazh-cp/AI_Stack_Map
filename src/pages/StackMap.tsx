import { useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node,
} from "reactflow";
import { useStore } from "../store/useStore";
import { buildStackFlow } from "../lib/flow";
import { StackNode, ZoneNode } from "../components/flow/StackNode";
import { InspectorPanel } from "../components/flow/InspectorPanel";
import { STATUS_META } from "../lib/constants";
import type { ControlStatus } from "../types";

const nodeTypes = { stack: StackNode, zone: ZoneNode };

export function StackMap() {
  const { controls, selectControl, selectedControlId, fileScans, promptInspections } =
    useStore();

  const { nodes, edges } = useMemo(() => {
    const built = buildStackFlow(controls, { fileScans, promptInspections });
    // mark selection
    built.nodes = built.nodes.map((n) =>
      n.id === selectedControlId ? { ...n, selected: true } : n
    );
    return built;
  }, [controls, selectedControlId, fileScans, promptInspections]);

  return (
    <div className="flex h-full">
      <div className="relative flex-1">
        <div className="absolute left-4 top-4 z-10">
          <h1 className="text-lg font-bold text-white">LLM Stack Map</h1>
          <p className="text-xs text-gray-500">
            Defense-in-depth flow — click any control to inspect
          </p>
        </div>
        <Legend />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node: Node) => {
            if (node.type === "stack") selectControl(node.id);
          }}
          onPaneClick={() => selectControl(null)}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          proOptions={{ hideAttribution: false }}
          className="bg-base-bg"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#E5E7EB"
          />
          <Controls className="!border-base-border" />
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => {
              if (n.type === "zone") return "#F3F4F6";
              const st = (n.data as { status?: ControlStatus })?.status;
              return st
                ? {
                    not_implemented: "#C2453F",
                    planned: "#C8902E",
                    implemented: "#4E7FB5",
                    verified: "#3E9B74",
                  }[st]
                : "#CBD5E1";
            }}
            maskColor="rgba(249,250,251,0.6)"
          />
        </ReactFlow>
      </div>
      <InspectorPanel />
    </div>
  );
}

function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex gap-3 rounded-lg border border-base-border bg-base-card/90 px-3 py-2 backdrop-blur">
      {(
        ["verified", "implemented", "planned", "not_implemented"] as ControlStatus[]
      ).map((s) => (
        <div key={s} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
          <span className="text-[11px] text-gray-400">
            {STATUS_META[s].label}
          </span>
        </div>
      ))}
    </div>
  );
}
