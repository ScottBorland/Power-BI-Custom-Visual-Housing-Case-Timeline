// src/layoutEngine.ts — Converts TimelineEvents into ReactFlow nodes and edges
// Matches the web app's Design 2 colour system and layout

import type { Node, Edge } from "@xyflow/react";
import {
  TimelineEvent,
  EventType,
  CATEGORY_COLOURS,
  HAZARD_SEVERITY,
  HazardSeverity,
} from "./types";

/** Layout constants — tighter spacing to match the web app */
const COL_WIDTH = 250;         // Column spacing (web app uses ~250–420 scaled by days)
const NODE_STACK_HEIGHT = 155; // Vertical space per stacked node in same column
const TRACK_GAP = 180;        // Vertical gap between different event-type tracks
const HEADER_Y = 0;
const FIRST_ROW_Y = 60;       // Space below date headers before first node row

/** Explicit node dimensions for MiniMap rendering */
const EVENT_NODE_WIDTH = 200;
const EVENT_NODE_HEIGHT = 135;
const DATE_HEADER_WIDTH = 200;
const DATE_HEADER_HEIGHT = 48;
const RANGE_END_WIDTH = 80;
const RANGE_END_HEIGHT = 28;

/** Track order — determines vertical position of each event type */
/** Per-type stack height overrides */
const FORM_STACK_HEIGHT = 110;    // Tighter stacking for forms
const CONTACT_NODE_HEIGHT = 270;  // 2x standard height

const TRACK_ORDER: EventType[] = [
  "CRA",
  "Hazard",
  "Suspension",
  "MissingEpisode",
  "AssetPlus",
  "Intervention",
  "Breach",
  "Offence",
  "Form",
  "Contact",
  "PDAT",
];

export interface TrackVisibility {
  showHazards: boolean;
  showMissingEpisodes: boolean;
  showAssetPlus: boolean;
  showInterventions: boolean;
  showOffences: boolean;
  showBreaches: boolean;
  showPdats: boolean;
  showContacts: boolean;
  showCras: boolean;
  showForms: boolean;
  showSuspensions: boolean;
}

function isTrackVisible(eventType: EventType, vis: TrackVisibility): boolean {
  const map: Record<EventType, boolean> = {
    Hazard: vis.showHazards,
    MissingEpisode: vis.showMissingEpisodes,
    AssetPlus: vis.showAssetPlus,
    Intervention: vis.showInterventions,
    Offence: vis.showOffences,
    Breach: vis.showBreaches,
    Exclusion: false,
    PDAT: vis.showPdats,
    Contact: vis.showContacts,
    CRA: vis.showCras,
    Form: vis.showForms,
    Suspension: vis.showSuspensions,
  };
  return map[eventType];
}

/** UTC date key — avoids timezone drift from toISOString when dates are at midnight UTC */
function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildDateColumns(events: TimelineEvent[]): Date[] {
  const dateSet = new Map<string, Date>();
  for (const ev of events) {
    if (ev.startDate) {
      const key = dateKey(ev.startDate);
      if (!dateSet.has(key)) dateSet.set(key, ev.startDate);
    }
    if (ev.endDate) {
      const key = dateKey(ev.endDate);
      if (!dateSet.has(key)) dateSet.set(key, ev.endDate);
    }
  }
  return Array.from(dateSet.values()).sort((a, b) => a.getTime() - b.getTime());
}

function dateToX(date: Date, dateColumns: Date[]): number {
  const key = dateKey(date);
  const idx = dateColumns.findIndex((d) => dateKey(d) === key);
  return idx >= 0 ? idx * COL_WIDTH : 0;
}

/** Format date as "29 Aug 2025" to match the web app */
function formatDateHeader(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Format date as DD/MM/YYYY for card display */
function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Get the colour scheme for an event, with hazard severity overrides.
 */
function getEventColours(ev: TimelineEvent) {
  const cat = CATEGORY_COLOURS[ev.eventType];

  if (ev.eventType === "Hazard") {
    const sev = HAZARD_SEVERITY[ev.severity as HazardSeverity] ?? HAZARD_SEVERITY.Default;
    return {
      borderColor: sev.solid,
      eyebrowColor: sev.text,
      shadowColor: sev.border,
      pillColor: sev.solid,
      edgeColor: sev.solid,
      eyebrowLabel: "HAZARD" + sev.eyebrowSuffix,
    };
  }

  // CRA nodes use the event label as the eyebrow (STARTED / COMPLETED)
  const eyebrowLabel = ev.eventType === "CRA" && ev.label
    ? ev.label
    : cat.eyebrowLabel;

  return {
    borderColor: cat.solid,
    eyebrowColor: cat.text,
    shadowColor: cat.border,
    pillColor: cat.solid,
    edgeColor: cat.edge,
    eyebrowLabel,
  };
}

export function buildLayout(
  events: TimelineEvent[],
  visibility: TrackVisibility,
  hiddenContactTypes?: Set<string>,
  hiddenFormTypes?: Set<string>,
  dateFilterStart?: Date | null,
  dateFilterEnd?: Date | null
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const visibleEvents = events.filter((e) => {
    if (!isTrackVisible(e.eventType, visibility)) return false;
    if (e.eventType === "Contact" && hiddenContactTypes && hiddenContactTypes.size > 0) {
      return !hiddenContactTypes.has(e.label);
    }
    if (e.eventType === "Form" && hiddenFormTypes && hiddenFormTypes.size > 0) {
      return !hiddenFormTypes.has(e.label);
    }
    // Date range filter — use start date (or end date if no start)
    const evDate = e.startDate ?? e.endDate;
    if (evDate) {
      if (dateFilterStart && evDate.getTime() < dateFilterStart.getTime()) return false;
      if (dateFilterEnd && evDate.getTime() > dateFilterEnd.getTime()) return false;
    }
    return true;
  });
  if (visibleEvents.length === 0) return { nodes, edges };

  const dateColumns = buildDateColumns(visibleEvents);
  if (dateColumns.length === 0) return { nodes, edges };

  // ── Date header nodes with category dash indicators ──
  dateColumns.forEach((date, i) => {
    const colKey = dateKey(date);
    const colEvents = visibleEvents.filter(
      (e) => e.startDate && dateKey(e.startDate) === colKey
    );

    // Determine the accent colour from the highest-priority event
    const accentColor = colEvents.length > 0
      ? getEventColours(colEvents[0]).borderColor
      : "#2a9d8f";

    // Collect unique category colours present in this column for the dash indicators
    const categoryDashes: string[] = [];
    const seenTypes = new Set<string>();
    for (const ev of colEvents) {
      if (!seenTypes.has(ev.eventType)) {
        seenTypes.add(ev.eventType);
        categoryDashes.push(getEventColours(ev).borderColor);
      }
    }

    nodes.push({
      id: `date-header-${i}`,
      type: "dateHeader",
      position: { x: i * COL_WIDTH, y: HEADER_Y },
      width: DATE_HEADER_WIDTH,
      height: DATE_HEADER_HEIGHT,
      data: {
        label: formatDateHeader(date),
        accentColor,
        categoryDashes,
      },
      draggable: false,
      selectable: false,
    });
  });

  // ── Compute visible track indices and cumulative Y positions ──
  const visibleTracks = TRACK_ORDER.filter((t) => isTrackVisible(t, visibility));
  const trackYIndex = new Map<EventType, number>();
  visibleTracks.forEach((t, i) => trackYIndex.set(t, i));

  /** Height each track type contributes to the gap before the next track */
  function trackRowHeight(t: EventType): number {
    if (t === "Contact") return CONTACT_NODE_HEIGHT + 20;
    if (t === "Form") return TRACK_GAP + 40;
    return TRACK_GAP;
  }

  // Cumulative base-Y per track index
  const trackBaseY: number[] = [];
  let cumulativeY = FIRST_ROW_Y;
  for (let i = 0; i < visibleTracks.length; i++) {
    trackBaseY.push(cumulativeY);
    cumulativeY += trackRowHeight(visibleTracks[i]);
  }

  const stackCounters = new Map<string, number>();

  function getStackY(trackIdx: number, colIdx: number, eventType?: EventType): number {
    const key = `${trackIdx}-${colIdx}`;
    const count = stackCounters.get(key) ?? 0;
    stackCounters.set(key, count + 1);
    const baseY = trackBaseY[trackIdx] ?? (FIRST_ROW_Y + trackIdx * TRACK_GAP);
    const stackHeight = eventType === "Form" ? FORM_STACK_HEIGHT : NODE_STACK_HEIGHT;
    return baseY + count * stackHeight;
  }

  // ── Event nodes ──
  visibleEvents.forEach((ev, i) => {
    const trackIdx = trackYIndex.get(ev.eventType);
    if (trackIdx === undefined) return;

    const startX = ev.startDate ? dateToX(ev.startDate, dateColumns) : 0;
    const colIdx = ev.startDate
      ? dateColumns.findIndex(
          (d) => dateKey(d) === dateKey(ev.startDate!)
        )
      : 0;

    const y = getStackY(trackIdx, colIdx >= 0 ? colIdx : 0, ev.eventType);
    const colours = getEventColours(ev);
    const nodeId = `event-${ev.eventType}-${i}`;

    // ── CRA special layout: small start node → detailed completed node ──
    if (ev.eventType === "CRA") {
      // Start node: compact, just eyebrow + start date (20px above completed)
      nodes.push({
        id: nodeId,
        type: "timelineEvent",
        position: { x: startX, y: y - 20 },
        width: EVENT_NODE_WIDTH,
        height: 90,
        data: {
          label: "",
          eventType: ev.eventType,
          severity: "",
          startDate: ev.startDate ? formatDate(ev.startDate) : "",
          endDate: "",
          details: "",
          borderColor: colours.borderColor,
          backgroundColor: "#ffffff",
          eyebrowLabel: "ROTH ASSESSMENT STARTED",
          eyebrowColor: colours.eyebrowColor,
          shadowColor: colours.shadowColor,
        },
      });

      // Completed node: full detail card with risks at the end date
      if (ev.startDate && ev.endDate) {
        const endX = dateToX(ev.endDate, dateColumns);
        const endNodeId = `${nodeId}-end`;

        nodes.push({
          id: endNodeId,
          type: "timelineEvent",
          position: { x: endX, y },
          width: EVENT_NODE_WIDTH,
          height: EVENT_NODE_HEIGHT,
          data: {
            label: "",
            eventType: ev.eventType,
            severity: "",
            startDate: ev.startDate ? formatDate(ev.startDate) : "",
            endDate: ev.endDate ? formatDate(ev.endDate) : "",
            details: "",
            risks: ev.risks,
            borderColor: colours.borderColor,
            backgroundColor: "#ffffff",
            eyebrowLabel: "ROTH ASSESSMENT COMPLETED",
            eyebrowColor: colours.eyebrowColor,
            shadowColor: colours.shadowColor,
          },
        });

        const durationMs = ev.endDate.getTime() - ev.startDate.getTime();
        const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));

        edges.push({
          id: `edge-${nodeId}`,
          source: nodeId,
          target: endNodeId,
          type: "smoothstep",
          label: `${durationDays} days`,
          style: { stroke: colours.edgeColor, strokeWidth: 2 },
          labelStyle: {
            fill: "#000000",
            fontSize: 13,
            fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
            fontWeight: 700,
          },
          labelBgStyle: { fill: "#ffffff", stroke: "#e0e2e8" },
          labelBgPadding: [6, 4] as [number, number],
        });
      }

      return; // skip default handling
    }

    // ── Form special layout: discrete node at endDate, shows both dates as fields ──
    if (ev.eventType === "Form") {
      const posDate = ev.endDate ?? ev.startDate;
      const formX = posDate ? dateToX(posDate, dateColumns) : startX;
      const formColIdx = posDate
        ? dateColumns.findIndex(
            (d) => dateKey(d) === dateKey(posDate)
          )
        : colIdx;
      const formY = getStackY(trackIdx, formColIdx >= 0 ? formColIdx : 0, "Form");

      nodes.push({
        id: nodeId,
        type: "timelineEvent",
        position: { x: formX, y: formY },
        width: EVENT_NODE_WIDTH,
        height: EVENT_NODE_HEIGHT,
        data: {
          label: ev.label,
          eventType: ev.eventType,
          severity: ev.severity,
          startDate: ev.startDate ? formatDate(ev.startDate) : "",
          endDate: ev.endDate ? formatDate(ev.endDate) : "",
          details: ev.details,
          borderColor: colours.borderColor,
          backgroundColor: "#ffffff",
          eyebrowLabel: colours.eyebrowLabel,
          eyebrowColor: colours.eyebrowColor,
          shadowColor: colours.shadowColor,
        },
      });
      return; // discrete — no range end node
    }

    // ── Standard event node ──
    const isContact = ev.eventType === "Contact";
    const nodeHeight = isContact ? CONTACT_NODE_HEIGHT : EVENT_NODE_HEIGHT;
    nodes.push({
      id: nodeId,
      type: "timelineEvent",
      position: { x: startX, y },
      width: EVENT_NODE_WIDTH,
      height: nodeHeight,
      data: {
        label: ev.label,
        eventType: ev.eventType,
        severity: ev.severity,
        startDate: ev.startDate ? formatDate(ev.startDate) : "",
        endDate: ev.endDate ? formatDate(ev.endDate) : "",
        details: ev.details,
        borderColor: colours.borderColor,
        backgroundColor: "#ffffff",
        eyebrowLabel: colours.eyebrowLabel,
        eyebrowColor: colours.eyebrowColor,
        shadowColor: colours.shadowColor,
        minHeight: isContact ? CONTACT_NODE_HEIGHT : undefined,
      },
    });

    // ── Duration edges for events with start + end ──
    if (ev.startDate && ev.endDate) {
      const endX = dateToX(ev.endDate, dateColumns);
      const endNodeId = `${nodeId}-end`;

      nodes.push({
        id: endNodeId,
        type: "rangeEnd",
        position: { x: endX, y },
        width: RANGE_END_WIDTH,
        height: RANGE_END_HEIGHT,
        data: {
          label: formatDate(ev.endDate),
          borderColor: colours.borderColor,
          pillColor: colours.pillColor,
        },
        draggable: false,
      });

      const durationMs = ev.endDate.getTime() - ev.startDate.getTime();
      const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));

      edges.push({
        id: `edge-${nodeId}`,
        source: nodeId,
        target: endNodeId,
        type: "smoothstep",
        label: `${durationDays} days`,
        style: { stroke: colours.edgeColor, strokeWidth: 2 },
        labelStyle: {
          fill: "#000000",
          fontSize: 13,
          fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
          fontWeight: 700,
        },
        labelBgStyle: { fill: "#ffffff", stroke: "#e0e2e8" },
        labelBgPadding: [6, 4] as [number, number],
      });
    }
  });

  return { nodes, edges };
}
