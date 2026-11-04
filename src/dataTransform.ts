// src/dataTransform.ts — Converts Power BI DataView into TimelineEvent[]

import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import DataViewTable = powerbi.DataViewTable;

import { TimelineEvent, EventType, HazardSeverity, RiskLevel } from "./types";

/**
 * Column index lookup helper.
 * Maps data role names to their column index in the table DataView.
 */
function getColumnIndex(table: DataViewTable, roleName: string): number {
  return table.columns.findIndex((col) =>
    col.roles ? Object.prototype.hasOwnProperty.call(col.roles, roleName) : false
  );
}

/**
 * Safely parse a date value from a Power BI cell.
 * Normalises to UTC noon to avoid timezone-boundary drift
 * (e.g. "2025-07-28" parsed as UTC midnight can shift to 27 Jul in local time).
 */
function parseDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(value as string | number);
  if (isNaN(d.getTime())) return null;
  // Normalise to UTC noon so date never drifts across day boundaries
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}

/**
 * Normalise an event type string to a known EventType.
 */
function normaliseEventType(raw: string): EventType | null {
  const lower = raw.toLowerCase().replace(/[\s_-]/g, "");
  const map: Record<string, EventType> = {
    hazard: "Hazard",
    missingepisode: "MissingEpisode",
    missing: "MissingEpisode",
    assetplus: "AssetPlus",
    assetplusassessment: "AssetPlus",
    intervention: "Intervention",
    offence: "Offence",
    offense: "Offence",
    exclusion: "Exclusion",
    pdat: "PDAT",
    preventionanddiversion: "PDAT",
    preventionanddivertassessment: "PDAT",
    contact: "Contact",
    cra: "CRA",
    roth: "CRA",
    rothassessment: "CRA",
    contextualriskassessment: "CRA",
    contextualrisk: "CRA",
    form: "Form",
    forms: "Form",
    suspension: "Suspension",
    suspensions: "Suspension",
    breach: "Breach",
    breaches: "Breach",
  };
  return map[lower] ?? null;
}

/**
 * Normalise a severity string to a known HazardSeverity.
 */
function normaliseSeverity(raw: string): HazardSeverity {
  const lower = raw.toLowerCase().trim();
  if (lower.includes("significant")) return "Significant";
  if (lower.includes("moderate")) return "Moderate";
  if (lower.includes("emerging")) return "Emerging";
  return "Default";
}

/**
 * Transform a Power BI table DataView into an array of TimelineEvents.
 */
export function transformData(dataView: DataView): TimelineEvent[] {
  const table = dataView.table;
  if (!table || !table.rows || table.rows.length === 0) return [];

  const colIdx = {
    caseNumber: getColumnIndex(table, "caseNumber"),
    eventType: getColumnIndex(table, "eventType"),
    eventLabel: getColumnIndex(table, "eventLabel"),
    startDate: getColumnIndex(table, "startDate"),
    endDate: getColumnIndex(table, "endDate"),
    severity: getColumnIndex(table, "severity"),
    details: getColumnIndex(table, "details"),
    cceRisk: getColumnIndex(table, "cceRisk"),
    cseRisk: getColumnIndex(table, "cseRisk"),
    popcrRisk: getColumnIndex(table, "popcrRisk"),
    syvRisk: getColumnIndex(table, "syvRisk"),
    radRisk: getColumnIndex(table, "radRisk"),
  };

  // eventType is required to build nodes
  if (colIdx.eventType === -1) return [];

  const events: TimelineEvent[] = [];

  for (const row of table.rows) {
    const rawType = colIdx.eventType >= 0 ? String(row[colIdx.eventType] ?? "") : "";
    const eventType = normaliseEventType(rawType);
    if (!eventType) continue;

    const rawSeverity = colIdx.severity >= 0 ? String(row[colIdx.severity] ?? "") : "";

    // Build risk data for CRA events
    let risks: RiskLevel[] | undefined;
    if (eventType === "CRA") {
      const hasAnyRisk = colIdx.cceRisk >= 0 || colIdx.cseRisk >= 0 ||
        colIdx.popcrRisk >= 0 || colIdx.syvRisk >= 0 || colIdx.radRisk >= 0;
      if (hasAnyRisk) {
        risks = [
          { label: "CCE Risk", level: colIdx.cceRisk >= 0 ? String(row[colIdx.cceRisk] ?? "N/A") : "N/A" },
          { label: "CSE Risk", level: colIdx.cseRisk >= 0 ? String(row[colIdx.cseRisk] ?? "N/A") : "N/A" },
          { label: "PoP/CR Risk", level: colIdx.popcrRisk >= 0 ? String(row[colIdx.popcrRisk] ?? "N/A") : "N/A" },
          { label: "SYV Risk", level: colIdx.syvRisk >= 0 ? String(row[colIdx.syvRisk] ?? "N/A") : "N/A" },
          { label: "Rad Risk", level: colIdx.radRisk >= 0 ? String(row[colIdx.radRisk] ?? "N/A") : "N/A" },
        ];
      }
    }

    const startDate = colIdx.startDate >= 0 ? parseDate(row[colIdx.startDate]) : null;
    let endDate = colIdx.endDate >= 0 ? parseDate(row[colIdx.endDate]) : null;

    // Offences and PDATs are always discrete (no end node)
    if (eventType === "Offence" || eventType === "PDAT") {
      endDate = null;
    }

    // Missing Episodes and Suspensions are discrete when start == end (same day)
    if ((eventType === "MissingEpisode" || eventType === "Suspension") && startDate && endDate &&
        startDate.toISOString().slice(0, 10) === endDate.toISOString().slice(0, 10)) {
      endDate = null;
    }

    events.push({
      caseNumber: colIdx.caseNumber >= 0 ? String(row[colIdx.caseNumber] ?? "") : "",
      eventType,
      label: colIdx.eventLabel >= 0 ? String(row[colIdx.eventLabel] ?? "") : rawType,
      startDate,
      endDate,
      severity: eventType === "Hazard" ? normaliseSeverity(rawSeverity) : rawSeverity,
      details: colIdx.details >= 0 ? String(row[colIdx.details] ?? "") : "",
      risks,
    });
  }

  return events;
}
