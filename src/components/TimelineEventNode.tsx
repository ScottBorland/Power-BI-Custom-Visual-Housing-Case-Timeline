// src/components/TimelineEventNode.tsx — Event card matching web app's Design 2 style

import React, { useState, useRef, useEffect } from "react";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

interface RiskLevel {
  label: string;
  level: string;
}

interface TimelineEventData {
  label: string;
  eventType: string;
  severity: string;
  startDate: string;
  endDate: string;
  details: string;
  risks?: RiskLevel[];
  borderColor: string;
  backgroundColor: string;
  eyebrowLabel: string;
  eyebrowColor: string;
  shadowColor: string;
  minHeight?: number;
}

const DETAILS_COLLAPSED_HEIGHT = 40;
const DETAILS_COLLAPSED_HEIGHT_TALL = 180;

/** Colour-code risk severity levels to match the web app */
function riskLevelColor(level: string): string {
  const l = (level ?? "").toLowerCase().trim();
  if (l.includes("significant") || l.includes("high")) return "#c43030";
  if (l.includes("moderate") || l.includes("medium")) return "#d97706";
  if (l.includes("emerging") || l.includes("low")) return "#2d9e5c";
  return "#000000";
}

/** Background colour for risk level pills */
function riskLevelBg(level: string): string {
  const l = (level ?? "").toLowerCase().trim();
  if (l.includes("significant") || l.includes("high")) return "rgba(196, 48, 48, 0.1)";
  if (l.includes("moderate") || l.includes("medium")) return "rgba(217, 119, 6, 0.1)";
  if (l.includes("emerging") || l.includes("low")) return "rgba(45, 158, 92, 0.1)";
  return "rgba(0, 0, 0, 0.06)";
}

export const TimelineEventNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as unknown as TimelineEventData;
  const isCRA = d.eventType === "CRA";
  const isCRACompleted = isCRA && d.endDate;
  const risks = d.risks ?? [];
  const hasLabel = d.label && d.label.trim().length > 0;
  const hasDetails = d.details && d.details.trim().length > 0;

  const collapsedHeight = d.minHeight ? DETAILS_COLLAPSED_HEIGHT_TALL : DETAILS_COLLAPSED_HEIGHT;

  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [detailsOverflows, setDetailsOverflows] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (detailsRef.current) {
      setDetailsOverflows(detailsRef.current.scrollHeight > collapsedHeight);
    }
  }, [d.details, collapsedHeight]);

  const cardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    background: d.backgroundColor || "#ffffff",
    border: `2px solid ${d.borderColor}`,
    borderRadius: 8,
    padding: "8px 12px",
    minWidth: 150,
    maxWidth: 360,
    minHeight: d.minHeight ? d.minHeight : undefined,
    fontFamily: "'Manrope', 'Inter', system-ui, -apple-system, sans-serif",
    boxShadow: `0 2px 12px ${d.shadowColor || "rgba(0,0,0,0.04)"}, 0 1px 2px rgba(0,0,0,0.04)`,
    boxSizing: "border-box" as const,
  };

  // CRA nodes use normal weight throughout
  const boldWeight = isCRA ? 400 : 700;
  const semiBoldWeight = isCRA ? 400 : 600;

  const eyebrowStyle: React.CSSProperties = {
    fontWeight: isCRA ? 500 : 700,
    fontSize: isCRA ? 11 : 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    lineHeight: 1.4,
    textAlign: "center",
    color: d.eyebrowColor || d.borderColor,
    marginBottom: 2,
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "90px 1fr",
    gap: "4px 10px",
    fontSize: 12,
    marginBottom: 4,
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: boldWeight,
    color: "#000000",
  };

  const valueStyle: React.CSSProperties = {
    fontWeight: semiBoldWeight,
    fontSize: 12.5,
    color: "#000000",
  };

  return (
    <div style={cardStyle}>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />

      {/* Eyebrow */}
      <div style={eyebrowStyle}>
        {d.eyebrowLabel || d.eventType}
      </div>

      {/* Title (non-CRA only, skip if blank) */}
      {!isCRA && hasLabel && (
        <div style={{ fontWeight: 700, fontSize: 12.5, color: "#000000", lineHeight: 1.35, marginBottom: 8 }}>
          {d.label}
        </div>
      )}

      {/* CRA start-only node: single line "Started: date" */}
      {isCRA && d.startDate && !d.endDate && !risks.length && (
        <div style={{ fontSize: 12, color: "#000000", fontWeight: 400, textAlign: "center", marginTop: 2 }}>
          Started: {d.startDate}
        </div>
      )}

      {/* CRA completed node: full date grid */}
      {isCRA && d.startDate && d.endDate && (
        <div style={gridStyle}>
          <span style={labelStyle}>Start</span>
          <span style={valueStyle}>{d.startDate}</span>
          <span style={labelStyle}>Completed</span>
          <span style={valueStyle}>{d.endDate}</span>
        </div>
      )}

      {/* Standard dates grid (non-CRA) */}
      {!isCRA && d.startDate && (
        <div style={gridStyle}>
          <span style={labelStyle}>
            {d.eventType === "Offence" ? "Offence Date"
              : d.eventType === "Form" ? "Start Date"
              : "Start"}
          </span>
          <span style={valueStyle}>{d.startDate}</span>
          {d.endDate && (
            <>
              <span style={labelStyle}>{d.eventType === "Form" ? "End Date" : "End"}</span>
              <span style={valueStyle}>{d.endDate}</span>
            </>
          )}
        </div>
      )}

      {/* Risk levels (CRA only) — prominent pill style */}
      {isCRA && risks.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "90px 1fr",
          gap: "5px 10px",
          fontSize: 12,
          marginBottom: 4,
        }}>
          {risks.map((r, i) => (
            <React.Fragment key={i}>
              <span style={{ fontWeight: 400, color: "#000000", fontSize: 12 }}>{r.label}</span>
              <span style={{
                fontWeight: 600,
                fontSize: 12.5,
                color: riskLevelColor(r.level),
                background: riskLevelBg(r.level),
                borderRadius: 4,
                padding: "1px 6px",
                display: "inline-block",
                width: "fit-content",
              }}>
                {r.level}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Severity (hazards only) */}
      {d.severity && d.eventType === "Hazard" && (
        <div style={{ fontSize: 11, color: d.eyebrowColor || "#000000", marginTop: 2 }}>
          {d.severity}
        </div>
      )}

      {/* Details — collapsible if long, fills remaining card height */}
      {hasDetails && (
        <div style={{ marginTop: 4, flex: 1, display: "flex", flexDirection: "column" }}>
          <div
            ref={detailsRef}
            style={{
              fontSize: 11,
              color: "#000000",
              lineHeight: 1.4,
              overflow: "hidden",
              maxHeight: detailsExpanded ? "none" : collapsedHeight,
              flex: 1,
            }}
          >
            {d.details}
          </div>
          {detailsOverflows && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: d.eyebrowColor || d.borderColor,
                cursor: "pointer",
                marginTop: "auto",
                paddingTop: 2,
                textAlign: "center",
              }}
              onClick={(e) => { e.stopPropagation(); setDetailsExpanded(!detailsExpanded); }}
            >
              {detailsExpanded ? "Show less ▲" : "See more ▼"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
