// src/components/SettingsPanel.tsx — In-visual settings panel with track + subtype toggles

import React, { useState } from "react";
import type { TrackVisibility } from "../layoutEngine";
import { CATEGORY_COLOURS, type EventType } from "../types";

interface ToggleItem {
  key: keyof TrackVisibility;
  label: string;
  eventType: EventType;
}

const TOGGLES: ToggleItem[] = [
  { key: "showCras", label: "ROTH Assessments", eventType: "CRA" },
  { key: "showHazards", label: "Hazards", eventType: "Hazard" },
  { key: "showSuspensions", label: "Suspensions", eventType: "Suspension" },
  { key: "showMissingEpisodes", label: "Missing Episodes", eventType: "MissingEpisode" },
  { key: "showAssetPlus", label: "AssetPlus Assessments", eventType: "AssetPlus" },
  { key: "showInterventions", label: "Interventions", eventType: "Intervention" },
  { key: "showBreaches", label: "Breaches", eventType: "Breach" },
  { key: "showOffences", label: "Offences", eventType: "Offence" },
  { key: "showForms", label: "Forms", eventType: "Form" },
  { key: "showContacts", label: "Contacts", eventType: "Contact" },
  { key: "showPdats", label: "PDATs", eventType: "PDAT" },
];

/** Category grouping — items must match Event Label values exactly */
export interface CategoryGroup {
  name: string;
  items: string[];
}

/** @deprecated alias */
export type ContactCategory = CategoryGroup;

export const CONTACT_CATEGORIES: ContactCategory[] = [
  {
    name: "Meetings",
    items: [
      "Assessment meeting",
      "Assessment Meeting",
      "CP/CIN Meeting",
      "Core Group Meeting",
      "Initial Meeting",
      "MACE Meeting",
      "Meeting Review Plan/Activities",
      "Multi Agency Exploitation Meeting",
      "Multi Agency Meeting",
      "Risk, Safety and Wellbeing Meeting",
      "Case Conference",
      "Strategy Meeting",
    ],
  },
  {
    name: "Management",
    items: [
      "Management Oversight",
      "Management Quality Assurance",
      "Management Supervision of Case",
    ],
  },
  {
    name: "Education",
    items: [
      "Case Consultation Education",
      "Education Other Than at School / Alternative Curriculum",
      "Education School/Liaison",
      "Further Education",
    ],
  },
  {
    name: "Health",
    items: [
      "Health Assessment",
      "Mental Health/Therapeutic Contact",
      "Sexual Health Awareness Contact",
    ],
  },
  {
    name: "Home Visit",
    items: [
      "Home Visit",
      "Home Visit (UnScheduled)",
    ],
  },
  {
    name: "Letter/Email",
    items: [
      "Letter/Email In",
      "Letter/Email In (Other)",
      "Letter/Email Out",
      "Letter/Email/Text Advovacy",
    ],
  },
  {
    name: "Phone Call",
    items: [
      "Telephone In",
      "Telephone Out",
    ],
  },
  {
    name: "Police",
    items: [
      "Police Contact",
      "Police Intelligence",
    ],
  },
  {
    name: "Victim Engagement",
    items: [
      "Restorative Justice Contact (Individual)",
      "Victim Awareness Contact",
      "Victim Contact",
      "Victim Impact",
    ],
  },
];

/** Categories shown by default */
const DEFAULT_VISIBLE_CATEGORIES = new Set(["Police", "Management"]);

/** Build the default hidden set: everything NOT in the default-visible categories */
export function buildDefaultHiddenContacts(allContactLabels: string[]): Set<string> {
  const visibleItems = new Set<string>();
  for (const cat of CONTACT_CATEGORIES) {
    if (DEFAULT_VISIBLE_CATEGORIES.has(cat.name)) {
      for (const item of cat.items) visibleItems.add(item);
    }
  }
  const hidden = new Set<string>();
  for (const label of allContactLabels) {
    if (!visibleItems.has(label)) hidden.add(label);
  }
  return hidden;
}

/** Form type categories */
export const FORM_CATEGORIES: CategoryGroup[] = [
  {
    name: "Assessments",
    items: [
      "C & F Assessment",
      "Early Help Assessment",
      "Exploitation (CSE/CCE) Risk Assessment",
      "Contextual Risk (including Exploitation) Assessment",
      "ROTH Assessment",
      "Child Protection Plan",
    ],
  },
  {
    name: "Plans",
    items: [
      "Child/Young Person's Plan",
      "Child Look After/Young Person's Care Plan",
      "Family Action Plan",
      "Outline CP Plan",
      "Placement Plan",
    ],
  },
  {
    name: "Child Protection Conference",
    items: [
      "Child Protection Initial Conference Decisions",
      "Child Protection Plan",
      "Child Protection Review Conference Decisions",
      "Child Protection Review Conference Minutes",
      "Child Protection Review Conference Worker's Report",
    ],
  },
  {
    name: "Child in Care",
    items: [
      "Child in Care Invitation List",
      "Child in Care Review Assessment",
      "Child in Care Review Decisions",
      "Child in Care Review Record",
    ],
  },
  {
    name: "Referrals",
    items: [
      "Referral Record",
      "Referral to Early Help",
      "Referral to Social Care (EHM Contact)",
    ],
  },
  {
    name: "Supporting Families",
    items: [
      "Supporting Families - Enquiry",
      "Supporting Families - Episode Closure Record",
      "Supporting Families Indicators",
    ],
  },
  {
    name: "Workbook",
    items: [
      "Workbook - Child's Social Worker Summary",
      "Workbook - Closure Record",
      "Workbook - Group Case Supervision",
      "Workbook - Children's Practitioner Summary",
      "Workbook - Domestic Abuse Summary",
    ],
  },
];

/** Build the default hidden set for forms: hide everything by default */
export function buildDefaultHiddenForms(allFormLabels: string[]): Set<string> {
  return new Set(allFormLabels);
}

interface SettingsPanelProps {
  visibility: TrackVisibility;
  onToggle: (key: keyof TrackVisibility) => void;
  onClose: () => void;
  darkMode: boolean;
  contactTypes: string[];
  hiddenContactTypes: Set<string>;
  onToggleContactType: (contactType: string) => void;
  onToggleContactCategory: (category: string) => void;
  formTypes: string[];
  hiddenFormTypes: Set<string>;
  onToggleFormType: (formType: string) => void;
  onToggleFormCategory: (category: string) => void;
  dateFilterStart: string;
  dateFilterEnd: string;
  onDateFilterStartChange: (value: string) => void;
  onDateFilterEndChange: (value: string) => void;
  onDateFilterClear: () => void;
  dateRangeMin: string;
  dateRangeMax: string;
}

function ToggleSwitch({ checked, accent, darkMode }: { checked: boolean; accent: string; darkMode: boolean }) {
  return (
    <div
      style={{
        width: 32,
        height: 18,
        borderRadius: 9,
        background: checked ? accent : (darkMode ? "#333" : "#d1d5db"),
        position: "relative",
        flexShrink: 0,
        transition: "background 0.15s",
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 2,
          left: checked ? 16 : 2,
          transition: "left 0.15s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );
}

function SubtypeSection({
  title,
  items,
  hiddenItems,
  onToggle,
  accent,
  darkMode,
  textColor,
  borderColor,
  hoverBg,
}: {
  title: string;
  items: string[];
  hiddenItems: Set<string>;
  onToggle: (item: string) => void;
  accent: string;
  darkMode: boolean;
  textColor: string;
  borderColor: string;
  hoverBg: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div style={{ borderTop: `1px solid ${borderColor}`, margin: "8px 0 6px" }} />
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 14px 6px",
          cursor: "pointer",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: textColor }}>{title}</span>
        <span style={{ fontSize: 11, color: darkMode ? "#8b8d94" : "#6e7280" }}>
          {open ? "▲" : "▼"}
        </span>
      </div>
      {open &&
        items.map((item) => {
          const checked = !hiddenItems.has(item);
          return (
            <div
              key={item}
              onClick={() => onToggle(item)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "5px 14px 5px 20px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: checked ? textColor : darkMode ? "#555" : "#aaa",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <ToggleSwitch checked={checked} accent={accent} darkMode={darkMode} />
              <span>{item}</span>
            </div>
          );
        })}
    </>
  );
}

/** Grouped contact types section with expandable subcategories */
function ContactTypesSection({
  contactTypes,
  hiddenContactTypes,
  onToggleContactType,
  onToggleContactCategory,
  accent,
  darkMode,
  textColor,
  borderColor,
  hoverBg,
}: {
  contactTypes: string[];
  hiddenContactTypes: Set<string>;
  onToggleContactType: (ct: string) => void;
  onToggleContactCategory: (cat: string) => void;
  accent: string;
  darkMode: boolean;
  textColor: string;
  borderColor: string;
  hoverBg: string;
}) {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const contactSet = new Set(contactTypes);

  // Build categorised items (only include items that exist in data)
  const categorised: { name: string; items: string[] }[] = [];
  const categorisedItems = new Set<string>();
  for (const cat of CONTACT_CATEGORIES) {
    const present = cat.items.filter((it) => contactSet.has(it));
    if (present.length > 0) {
      categorised.push({ name: cat.name, items: present });
      for (const it of present) categorisedItems.add(it);
    }
  }

  // Uncategorised items
  const uncategorised = contactTypes.filter((ct) => !categorisedItems.has(ct)).sort();

  const toggleCatExpand = (catName: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  };

  return (
    <>
      <div style={{ borderTop: `1px solid ${borderColor}`, margin: "8px 0 6px" }} />
      <div
        onClick={() => setSectionOpen(!sectionOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 14px 6px",
          cursor: "pointer",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: textColor }}>Show Contact Types</span>
        <span style={{ fontSize: 11, color: darkMode ? "#8b8d94" : "#6e7280" }}>
          {sectionOpen ? "▲" : "▼"}
        </span>
      </div>

      {sectionOpen && (
        <>
          {categorised.map((cat) => {
            const isExpanded = expandedCats.has(cat.name);
            const visibleCount = cat.items.filter((it) => !hiddenContactTypes.has(it)).length;
            const allVisible = visibleCount === cat.items.length;

            return (
              <React.Fragment key={cat.name}>
                {/* Category header row — toggle + expand */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 14px 5px 16px",
                    cursor: "pointer",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: visibleCount > 0 ? textColor : darkMode ? "#555" : "#aaa",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div onClick={(e) => { e.stopPropagation(); onToggleContactCategory(cat.name); }}>
                    <ToggleSwitch checked={allVisible} accent={accent} darkMode={darkMode} />
                  </div>
                  <span
                    onClick={() => toggleCatExpand(cat.name)}
                    style={{ flex: 1, userSelect: "none" }}
                  >
                    {cat.name}
                    <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 4, color: darkMode ? "#666" : "#999" }}>
                      ({visibleCount}/{cat.items.length})
                    </span>
                  </span>
                  <span
                    onClick={() => toggleCatExpand(cat.name)}
                    style={{ fontSize: 10, color: darkMode ? "#8b8d94" : "#6e7280" }}
                  >
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {/* Expanded individual items */}
                {isExpanded && cat.items.map((item) => {
                  const checked = !hiddenContactTypes.has(item);
                  return (
                    <div
                      key={item}
                      onClick={() => onToggleContactType(item)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "4px 14px 4px 36px",
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 500,
                        color: checked ? textColor : darkMode ? "#555" : "#aaa",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <ToggleSwitch checked={checked} accent={accent} darkMode={darkMode} />
                      <span>{item}</span>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Uncategorised items — treated as an "Other" group */}
          {uncategorised.length > 0 && (() => {
            const otherExpanded = expandedCats.has("Other");
            const otherVisibleCount = uncategorised.filter((it) => !hiddenContactTypes.has(it)).length;
            const otherAllVisible = otherVisibleCount === uncategorised.length;
            return (
              <React.Fragment>
                {/* Other category header row — toggle + expand */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 14px 5px 16px",
                    cursor: "pointer",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: otherVisibleCount > 0 ? textColor : darkMode ? "#555" : "#aaa",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div onClick={(e) => { e.stopPropagation(); onToggleContactCategory("Other"); }}>
                    <ToggleSwitch checked={otherAllVisible} accent={accent} darkMode={darkMode} />
                  </div>
                  <span
                    onClick={() => toggleCatExpand("Other")}
                    style={{ flex: 1, userSelect: "none" }}
                  >
                    Other
                    <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 4, color: darkMode ? "#666" : "#999" }}>
                      ({otherVisibleCount}/{uncategorised.length})
                    </span>
                  </span>
                  <span
                    onClick={() => toggleCatExpand("Other")}
                    style={{ fontSize: 10, color: darkMode ? "#8b8d94" : "#6e7280" }}
                  >
                    {otherExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {/* Expanded individual items */}
                {otherExpanded && uncategorised.map((item) => {
                  const checked = !hiddenContactTypes.has(item);
                  return (
                    <div
                      key={item}
                      onClick={() => onToggleContactType(item)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "4px 14px 4px 36px",
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 500,
                        color: checked ? textColor : darkMode ? "#555" : "#aaa",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <ToggleSwitch checked={checked} accent={accent} darkMode={darkMode} />
                      <span>{item}</span>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })()}
        </>
      )}
    </>
  );
}

/** Grouped form types section with expandable subcategories (mirrors ContactTypesSection) */
function FormTypesSection({
  formTypes,
  hiddenFormTypes,
  onToggleFormType,
  onToggleFormCategory,
  accent,
  darkMode,
  textColor,
  borderColor,
  hoverBg,
}: {
  formTypes: string[];
  hiddenFormTypes: Set<string>;
  onToggleFormType: (ft: string) => void;
  onToggleFormCategory: (cat: string) => void;
  accent: string;
  darkMode: boolean;
  textColor: string;
  borderColor: string;
  hoverBg: string;
}) {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const formSet = new Set(formTypes);

  // Build categorised items (only include items that exist in data)
  const categorised: { name: string; items: string[] }[] = [];
  const categorisedItems = new Set<string>();
  for (const cat of FORM_CATEGORIES) {
    const present = cat.items.filter((it) => formSet.has(it));
    if (present.length > 0) {
      categorised.push({ name: cat.name, items: present });
      for (const it of present) categorisedItems.add(it);
    }
  }

  // Uncategorised items
  const uncategorised = formTypes.filter((ft) => !categorisedItems.has(ft)).sort();

  const toggleCatExpand = (catName: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  };

  return (
    <>
      <div style={{ borderTop: `1px solid ${borderColor}`, margin: "8px 0 6px" }} />
      <div
        onClick={() => setSectionOpen(!sectionOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 14px 6px",
          cursor: "pointer",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: textColor }}>Show Form Types</span>
        <span style={{ fontSize: 11, color: darkMode ? "#8b8d94" : "#6e7280" }}>
          {sectionOpen ? "▲" : "▼"}
        </span>
      </div>

      {sectionOpen && (
        <>
          {categorised.map((cat) => {
            const isExpanded = expandedCats.has(cat.name);
            const visibleCount = cat.items.filter((it) => !hiddenFormTypes.has(it)).length;
            const allVisible = visibleCount === cat.items.length;

            return (
              <React.Fragment key={cat.name}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 14px 5px 16px",
                    cursor: "pointer",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: visibleCount > 0 ? textColor : darkMode ? "#555" : "#aaa",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div onClick={(e) => { e.stopPropagation(); onToggleFormCategory(cat.name); }}>
                    <ToggleSwitch checked={allVisible} accent={accent} darkMode={darkMode} />
                  </div>
                  <span
                    onClick={() => toggleCatExpand(cat.name)}
                    style={{ flex: 1, userSelect: "none" }}
                  >
                    {cat.name}
                    <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 4, color: darkMode ? "#666" : "#999" }}>
                      ({visibleCount}/{cat.items.length})
                    </span>
                  </span>
                  <span
                    onClick={() => toggleCatExpand(cat.name)}
                    style={{ fontSize: 10, color: darkMode ? "#8b8d94" : "#6e7280" }}
                  >
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {isExpanded && cat.items.map((item) => {
                  const checked = !hiddenFormTypes.has(item);
                  return (
                    <div
                      key={item}
                      onClick={() => onToggleFormType(item)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "4px 14px 4px 36px",
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 500,
                        color: checked ? textColor : darkMode ? "#555" : "#aaa",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <ToggleSwitch checked={checked} accent={accent} darkMode={darkMode} />
                      <span>{item}</span>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Uncategorised form items — "Other" group */}
          {uncategorised.length > 0 && (() => {
            const otherExpanded = expandedCats.has("Other");
            const otherVisibleCount = uncategorised.filter((it) => !hiddenFormTypes.has(it)).length;
            const otherAllVisible = otherVisibleCount === uncategorised.length;
            return (
              <React.Fragment>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 14px 5px 16px",
                    cursor: "pointer",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: otherVisibleCount > 0 ? textColor : darkMode ? "#555" : "#aaa",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div onClick={(e) => { e.stopPropagation(); onToggleFormCategory("Other"); }}>
                    <ToggleSwitch checked={otherAllVisible} accent={accent} darkMode={darkMode} />
                  </div>
                  <span
                    onClick={() => toggleCatExpand("Other")}
                    style={{ flex: 1, userSelect: "none" }}
                  >
                    Other
                    <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 4, color: darkMode ? "#666" : "#999" }}>
                      ({otherVisibleCount}/{uncategorised.length})
                    </span>
                  </span>
                  <span
                    onClick={() => toggleCatExpand("Other")}
                    style={{ fontSize: 10, color: darkMode ? "#8b8d94" : "#6e7280" }}
                  >
                    {otherExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {otherExpanded && uncategorised.map((item) => {
                  const checked = !hiddenFormTypes.has(item);
                  return (
                    <div
                      key={item}
                      onClick={() => onToggleFormType(item)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "4px 14px 4px 36px",
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 500,
                        color: checked ? textColor : darkMode ? "#555" : "#aaa",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <ToggleSwitch checked={checked} accent={accent} darkMode={darkMode} />
                      <span>{item}</span>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })()}
        </>
      )}
    </>
  );
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  visibility,
  onToggle,
  onClose,
  darkMode,
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
}) => {
  const panelBg = darkMode ? "#1c1f2a" : "#ffffff";
  const textColor = darkMode ? "#e4e5e7" : "#2a2e38";
  const borderColor = darkMode ? "#282c38" : "#e0e2e8";
  const hoverBg = darkMode ? "#252836" : "#f5f6f8";

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 10,
        background: panelBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
        padding: "12px 0",
        minWidth: 260,
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
        fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px 10px",
          borderBottom: `1px solid ${borderColor}`,
          marginBottom: 6,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: textColor }}>Visible Datasets</span>
        <span
          onClick={onClose}
          style={{
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            color: darkMode ? "#8b8d94" : "#6e7280",
            padding: "0 2px",
          }}
        >
          ×
        </span>
      </div>

      {/* Date range filter */}
      <div style={{ padding: "4px 14px 8px", borderBottom: `1px solid ${borderColor}`, marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: textColor, marginBottom: 6 }}>Date Range</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="date"
            value={dateFilterStart}
            min={dateRangeMin}
            max={dateFilterEnd || dateRangeMax}
            onChange={(e) => onDateFilterStartChange(e.target.value)}
            style={{
              flex: 1,
              fontSize: 11,
              padding: "4px 6px",
              borderRadius: 5,
              border: `1px solid ${borderColor}`,
              background: darkMode ? "#252836" : "#f9fafb",
              color: textColor,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <span style={{ fontSize: 11, color: darkMode ? "#666" : "#999" }}>to</span>
          <input
            type="date"
            value={dateFilterEnd}
            min={dateFilterStart || dateRangeMin}
            max={dateRangeMax}
            onChange={(e) => onDateFilterEndChange(e.target.value)}
            style={{
              flex: 1,
              fontSize: 11,
              padding: "4px 6px",
              borderRadius: 5,
              border: `1px solid ${borderColor}`,
              background: darkMode ? "#252836" : "#f9fafb",
              color: textColor,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>
        {(dateFilterStart || dateFilterEnd) && (
          <div
            onClick={onDateFilterClear}
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: darkMode ? "#8b8d94" : "#6e7280",
              cursor: "pointer",
              marginTop: 4,
              textAlign: "right",
            }}
          >
            Clear dates
          </div>
        )}
      </div>

      {/* Track toggle rows */}
      {TOGGLES.map((t) => {
        const checked = visibility[t.key];
        const accent = CATEGORY_COLOURS[t.eventType].solid;
        return (
          <div
            key={t.key}
            onClick={() => onToggle(t.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: 600,
              color: checked ? textColor : darkMode ? "#555" : "#aaa",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ToggleSwitch checked={checked} accent={accent} darkMode={darkMode} />
            <div
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: accent, opacity: checked ? 1 : 0.35, flexShrink: 0,
              }}
            />
            <span>{t.label}</span>
          </div>
        );
      })}

      {/* Form Types subfilter — categorised */}
      {formTypes.length > 0 && visibility.showForms && (
        <FormTypesSection
          formTypes={formTypes}
          hiddenFormTypes={hiddenFormTypes}
          onToggleFormType={onToggleFormType}
          onToggleFormCategory={onToggleFormCategory}
          accent={CATEGORY_COLOURS.Form.solid}
          darkMode={darkMode}
          textColor={textColor}
          borderColor={borderColor}
          hoverBg={hoverBg}
        />
      )}

      {/* Contact Types subfilter — categorised */}
      {contactTypes.length > 0 && visibility.showContacts && (
        <ContactTypesSection
          contactTypes={contactTypes}
          hiddenContactTypes={hiddenContactTypes}
          onToggleContactType={onToggleContactType}
          onToggleContactCategory={onToggleContactCategory}
          accent={CATEGORY_COLOURS.Contact.solid}
          darkMode={darkMode}
          textColor={textColor}
          borderColor={borderColor}
          hoverBg={hoverBg}
        />
      )}
    </div>
  );
};
