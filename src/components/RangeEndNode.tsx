// src/components/RangeEndNode.tsx — Pill-shaped end marker (matching InterventionEndNode style)

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

export const RangeEndNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as { label: string; borderColor: string; pillColor: string };

  // Full pill shape, solid category colour fill, white text
  const pillStyle: React.CSSProperties = {
    padding: "4px 12px",
    borderRadius: 20,
    background: d.pillColor || d.borderColor,
    border: "none",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Manrope', 'Inter', system-ui, -apple-system, sans-serif",
    color: "#ffffff",
    whiteSpace: "nowrap",
    textAlign: "center",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    pointerEvents: "none" as const,
  };

  return (
    <div style={pillStyle}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      Ended
    </div>
  );
};
