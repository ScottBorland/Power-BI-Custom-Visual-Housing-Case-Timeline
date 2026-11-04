// src/components/ReactFlowCanvas.tsx — Main React component for the PBI visual

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  Controls,
  useOnViewportChange,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TimelineEventNode } from "./TimelineEventNode";
import { DateHeaderNode } from "./DateHeaderNode";
import { RangeEndNode } from "./RangeEndNode";
import { SettingsPanel, CONTACT_CATEGORIES, FORM_CATEGORIES, buildDefaultHiddenContacts, buildDefaultHiddenForms } from "./SettingsPanel";
import { CATEGORY_COLOURS, type EventType, type TimelineEvent } from "../types";
import { buildLayout, type TrackVisibility } from "../layoutEngine";

const nodeTypes = {
  timelineEvent: TimelineEventNode,
  dateHeader: DateHeaderNode,
  rangeEnd: RangeEndNode,
};

/** Keeps date headers pinned to the top of the visible viewport */
const STICKY_DATE_TOP_PAD = 13;

function StickyDateHeadersController(): null {
  const rafRef = useRef<number | null>(null);

  const handleViewportChange = useCallback(
    ({ y, zoom }: { x: number; y: number; zoom: number }) => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const stickyY = (STICKY_DATE_TOP_PAD - y) / zoom;
        document
          .querySelectorAll<HTMLElement>(".react-flow__node-dateHeader")
          .forEach((el) => {
            const m = el.style.transform.match(
              /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/
            );
            if (m) el.style.transform = `translate(${m[1]}px, ${stickyY}px)`;
          });
      });
    },
    []
  );

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  useOnViewportChange({ onChange: handleViewportChange });
  return null;
}

function minimapNodeColor(node: Node): string {
  if (node.type === "dateHeader") return "transparent";
  const eventType = (node.data as { eventType?: string })?.eventType as EventType | undefined;
  if (eventType && CATEGORY_COLOURS[eventType]) {
    return CATEGORY_COLOURS[eventType].minimap;
  }
  return "#a1a1a1";
}

/** Gear icon SVG for settings button */
function GearIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: "block" }}>
      <path
        d="M6.5 1.5L6.8 3.1C6.3 3.3 5.8 3.6 5.4 4L3.8 3.4L2.8 5.1L4.1 6.2C4 6.5 4 6.7 4 7C4 7.3 4 7.5 4.1 7.8L2.8 8.9L3.8 10.6L5.4 10C5.8 10.4 6.3 10.7 6.8 10.9L6.5 12.5H8.5L8.8 10.9C9.3 10.7 9.8 10.4 10.2 10L11.8 10.6L12.8 8.9L11.5 7.8C11.6 7.5 11.6 7.3 11.6 7C11.6 6.7 11.6 6.5 11.5 6.2L12.8 5.1L11.8 3.4L10.2 4C9.8 3.6 9.3 3.3 8.8 3.1L8.5 1.5H6.5ZM7.5 5.5C8.3 5.5 9 6.2 9 7C9 7.8 8.3 8.5 7.5 8.5C6.7 8.5 6 7.8 6 7C6 6.2 6.7 5.5 7.5 5.5Z"
        fill={color}
      />
    </svg>
  );
}

interface ReactFlowCanvasProps {
  events: TimelineEvent[];
  initialVisibility: TrackVisibility;
  darkMode: boolean;
  width: number;
  height: number;
}

/** Inner component that uses hooks requiring ReactFlowProvider */
function FlowInner({
  initialNodes,
  initialEdges,
  darkMode,
  settingsOpen,
  setSettingsOpen,
  visibility,
  onToggle,
  contactTypes,
  hiddenContactTypes,
  onToggleContactType,
  onToggleContactCategory,
  formTypes,
  hiddenFormTypes,
  onToggleFormType,
  onToggleFormCategory,
  dateFilterStart,
  dateFilterEnd,
  onDateFilterStartChange,
  onDateFilterEndChange,
  onDateFilterClear,
  dateRangeMin,
  dateRangeMax,
}: {
  initialNodes: Node[];
  initialEdges: Edge[];
  darkMode: boolean;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  visibility: TrackVisibility;
  onToggle: (key: keyof TrackVisibility) => void;
  contactTypes: string[];
  hiddenContactTypes: Set<string>;
  onToggleContactType: (ct: string) => void;
  onToggleContactCategory: (cat: string) => void;
  formTypes: string[];
  hiddenFormTypes: Set<string>;
  onToggleFormType: (ft: string) => void;
  onToggleFormCategory: (cat: string) => void;
  dateFilterStart: string;
  dateFilterEnd: string;
  onDateFilterStartChange: (value: string) => void;
  onDateFilterEndChange: (value: string) => void;
  onDateFilterClear: () => void;
  dateRangeMin: string;
  dateRangeMax: string;
}): React.ReactElement {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when props change (new data from PBI or toggle change)
  const prevNodesRef = useRef(initialNodes);
  const prevEdgesRef = useRef(initialEdges);
  useEffect(() => {
    if (prevNodesRef.current !== initialNodes) {
      setNodes(initialNodes);
      prevNodesRef.current = initialNodes;
    }
    if (prevEdgesRef.current !== initialEdges) {
      setEdges(initialEdges);
      prevEdgesRef.current = initialEdges;
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, minZoom: 0.5, maxZoom: 1.2 }}
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable
        proOptions={{ hideAttribution: true }}
      >
        <StickyDateHeadersController />
        <Background
          color={darkMode ? "#334155" : "#d8dae0"}
          gap={20}
          size={1}
          style={{ backgroundColor: darkMode ? "#1e293b" : "#f0f1f4" }}
        />
        <Controls showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={minimapNodeColor}
          nodeStrokeWidth={3}
          maskColor={darkMode ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.05)"}
          style={{
            height: 200,
            width: 300,
            borderRadius: 12,
            overflow: "hidden",
            border: darkMode ? "1px solid #282c38" : "1px solid #d4d7de",
            background: darkMode ? "#1c1f2a" : "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          }}
        />
      </ReactFlow>

      {/* Settings gear button */}
      <div
        onClick={() => setSettingsOpen(!settingsOpen)}
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: settingsOpen ? 5 : 10,
          width: 32,
          height: 32,
          borderRadius: 8,
          background: darkMode ? "#1c1f2a" : "#ffffff",
          border: `1px solid ${darkMode ? "#282c38" : "#e0e2e8"}`,
          display: settingsOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        }}
      >
        <GearIcon color={darkMode ? "#8b8d94" : "#6e7280"} />
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <SettingsPanel
          visibility={visibility}
          onToggle={onToggle}
          onClose={() => setSettingsOpen(false)}
          darkMode={darkMode}
          contactTypes={contactTypes}
          hiddenContactTypes={hiddenContactTypes}
          onToggleContactType={onToggleContactType}
          onToggleContactCategory={onToggleContactCategory}
          formTypes={formTypes}
          hiddenFormTypes={hiddenFormTypes}
          onToggleFormType={onToggleFormType}
          onToggleFormCategory={onToggleFormCategory}
          dateFilterStart={dateFilterStart}
          dateFilterEnd={dateFilterEnd}
          onDateFilterStartChange={onDateFilterStartChange}
          onDateFilterEndChange={onDateFilterEndChange}
          onDateFilterClear={onDateFilterClear}
          dateRangeMin={dateRangeMin}
          dateRangeMax={dateRangeMax}
        />
      )}
    </>
  );
}

export const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = ({
  events,
  initialVisibility,
  darkMode,
  width,
  height,
}) => {
  const [visibility, setVisibility] = useState<TrackVisibility>(initialVisibility);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hiddenContactTypes, setHiddenContactTypes] = useState<Set<string>>(new Set());
  const [hiddenFormTypes, setHiddenFormTypes] = useState<Set<string>>(new Set());
  const [dateFilterStart, setDateFilterStart] = useState("");
  const [dateFilterEnd, setDateFilterEnd] = useState("");

  // Sync PBI-level visibility changes
  const prevVisRef = useRef(initialVisibility);
  useEffect(() => {
    if (prevVisRef.current !== initialVisibility) {
      setVisibility(initialVisibility);
      prevVisRef.current = initialVisibility;
    }
  }, [initialVisibility]);

  const handleToggle = useCallback((key: keyof TrackVisibility) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleToggleContactType = useCallback((ct: string) => {
    setHiddenContactTypes((prev) => {
      const next = new Set(prev);
      if (next.has(ct)) next.delete(ct);
      else next.add(ct);
      return next;
    });
  }, []);

  const handleToggleFormType = useCallback((ft: string) => {
    setHiddenFormTypes((prev) => {
      const next = new Set(prev);
      if (next.has(ft)) next.delete(ft);
      else next.add(ft);
      return next;
    });
  }, []);

  // Extract sorted unique contact type labels
  const contactTypes = useMemo(() => {
    const labels = new Set<string>();
    for (const ev of events) {
      if (ev.eventType === "Contact" && ev.label && ev.label.trim()) {
        labels.add(ev.label.trim());
      }
    }
    return Array.from(labels).sort();
  }, [events]);

  // Initialize default hidden contacts when contact types first become available
  const defaultsInitRef = useRef(false);
  useEffect(() => {
    if (contactTypes.length > 0 && !defaultsInitRef.current) {
      defaultsInitRef.current = true;
      setHiddenContactTypes(buildDefaultHiddenContacts(contactTypes));
    }
  }, [contactTypes]);

  // Extract sorted unique form type labels
  const formTypes = useMemo(() => {
    const labels = new Set<string>();
    for (const ev of events) {
      if (ev.eventType === "Form" && ev.label && ev.label.trim()) {
        labels.add(ev.label.trim());
      }
    }
    return Array.from(labels).sort();
  }, [events]);

  // Initialize default hidden forms when form types first become available
  const formDefaultsInitRef = useRef(false);
  useEffect(() => {
    if (formTypes.length > 0 && !formDefaultsInitRef.current) {
      formDefaultsInitRef.current = true;
      setHiddenFormTypes(buildDefaultHiddenForms(formTypes));
    }
  }, [formTypes]);

  const handleToggleContactCategory = useCallback((catName: string) => {
    let items: string[];
    if (catName === "Other") {
      const categorisedItems = new Set<string>();
      for (const cat of CONTACT_CATEGORIES) {
        for (const it of cat.items) categorisedItems.add(it);
      }
      items = contactTypes.filter((ct) => !categorisedItems.has(ct));
    } else {
      const cat = CONTACT_CATEGORIES.find((c) => c.name === catName);
      if (!cat) return;
      items = cat.items;
    }
    setHiddenContactTypes((prev) => {
      const next = new Set(prev);
      const allVisible = items.every((it) => !prev.has(it));
      for (const item of items) {
        if (allVisible) next.add(item);
        else next.delete(item);
      }
      return next;
    });
  }, [contactTypes]);

  const handleToggleFormCategory = useCallback((catName: string) => {
    let items: string[];
    if (catName === "Other") {
      const categorisedItems = new Set<string>();
      for (const cat of FORM_CATEGORIES) {
        for (const it of cat.items) categorisedItems.add(it);
      }
      items = formTypes.filter((ft) => !categorisedItems.has(ft));
    } else {
      const cat = FORM_CATEGORIES.find((c) => c.name === catName);
      if (!cat) return;
      items = cat.items;
    }
    setHiddenFormTypes((prev) => {
      const next = new Set(prev);
      const allVisible = items.every((it) => !prev.has(it));
      for (const item of items) {
        if (allVisible) next.add(item);
        else next.delete(item);
      }
      return next;
    });
  }, [formTypes]);

  // Compute overall date range from all events (for date picker min/max)
  const { dateRangeMin, dateRangeMax } = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;
    for (const ev of events) {
      const d = ev.startDate ?? ev.endDate;
      if (!d) continue;
      if (!min || d.getTime() < min.getTime()) min = d;
      if (!max || d.getTime() > max.getTime()) max = d;
    }
    return {
      dateRangeMin: min ? min.toISOString().slice(0, 10) : "",
      dateRangeMax: max ? max.toISOString().slice(0, 10) : "",
    };
  }, [events]);

  // Parse date filter strings to Date objects for layout engine
  const parsedDateStart = useMemo(() => dateFilterStart ? new Date(dateFilterStart + "T00:00:00Z") : null, [dateFilterStart]);
  const parsedDateEnd = useMemo(() => dateFilterEnd ? new Date(dateFilterEnd + "T23:59:59Z") : null, [dateFilterEnd]);

  const handleDateFilterClear = useCallback(() => {
    setDateFilterStart("");
    setDateFilterEnd("");
  }, []);

  // Compute layout from events + current visibility + subtype filters + date range
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => (events.length > 0 ? buildLayout(events, visibility, hiddenContactTypes, hiddenFormTypes, parsedDateStart, parsedDateEnd) : { nodes: [], edges: [] }),
    [events, visibility, hiddenContactTypes, hiddenFormTypes, parsedDateStart, parsedDateEnd]
  );

  if (events.length === 0) {
    return (
      <div
        className={`vantage-timeline-container ${darkMode ? "dark-mode" : ""}`}
        style={{ width, height }}
      >
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">Vantage Case Timeline</div>
          <div className="empty-state-hint">
            Drag fields into the data roles to build the timeline,
            then filter to a single case number.
            <br /><br />
            Required: <strong>Event Type</strong> and <strong>Start Date</strong>.
            <br />
            Recommended: Case Number, Event Label, End Date, Severity.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`vantage-timeline-container ${darkMode ? "dark-mode" : ""}`}
      style={{ width, height, position: "relative" }}
    >
      <ReactFlowProvider>
        <FlowInner
          initialNodes={layoutNodes}
          initialEdges={layoutEdges}
          darkMode={darkMode}
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
          visibility={visibility}
          onToggle={handleToggle}
          contactTypes={contactTypes}
          hiddenContactTypes={hiddenContactTypes}
          onToggleContactType={handleToggleContactType}
          onToggleContactCategory={handleToggleContactCategory}
          formTypes={formTypes}
          hiddenFormTypes={hiddenFormTypes}
          onToggleFormType={handleToggleFormType}
          onToggleFormCategory={handleToggleFormCategory}
          dateFilterStart={dateFilterStart}
          dateFilterEnd={dateFilterEnd}
          onDateFilterStartChange={setDateFilterStart}
          onDateFilterEndChange={setDateFilterEnd}
          onDateFilterClear={handleDateFilterClear}
          dateRangeMin={dateRangeMin}
          dateRangeMax={dateRangeMax}
        />
      </ReactFlowProvider>
    </div>
  );
};
