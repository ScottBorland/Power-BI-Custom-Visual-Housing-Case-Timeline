// src/components/DateHeaderNode.tsx — Date column header pill with category colour dashes

import React from "react";
import type { NodeProps } from "@xyflow/react";

export const DateHeaderNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as {
    label: string;
    accentColor?: string;
    categoryDashes?: string[];
  };

  const pillStyle: React.CSSProperties = {
    fontFamily: "'Manrope', 'Inter', system-ui, -apple-system, sans-serif",
    fontWeight: 700,
    fontSize: 14,
    color: "#2e3a5c",
    background: "#ffffff",
    border: "1.5px solid #e0e2e8",
    borderRadius: "0 0 7px 7px",
    padding: "8px 16px 10px",
    textAlign: "center",
    whiteSpace: "nowrap",
    width: 200,
    boxSizing: "border-box" as const,
    position: "relative" as const,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 5,
  };

  const accentStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    background: d.accentColor || "#2a9d8f",
    borderRadius: "2px 2px 0 0",
  };

  const dashes = d.categoryDashes ?? [];

  return (
    <div style={pillStyle}>
      <div style={accentStyle} />
      <span>{d.label}</span>
      {dashes.length > 0 && (
        <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
          {dashes.map((color, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 3,
                borderRadius: 1.5,
                background: color,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
