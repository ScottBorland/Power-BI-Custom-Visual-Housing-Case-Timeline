// src/visual.ts — Main Power BI visual entry point

import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualUpdateType = powerbi.VisualUpdateType;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import * as React from "react";
import { createRoot, Root } from "react-dom/client";

import { transformData } from "./dataTransform";
import { TrackVisibility } from "./layoutEngine";
import { ReactFlowCanvas } from "./components/ReactFlowCanvas";

import "./../style/visual.less";

export class Visual implements IVisual {
  private host: IVisualHost;
  private container: HTMLElement;
  private root: Root;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.container = options.element;
    this.container.style.overflow = "hidden";
    this.root = createRoot(this.container);

    const defaultVis: TrackVisibility = {
      showHazards: true, showMissingEpisodes: true, showAssetPlus: true,
      showInterventions: true, showBreaches: true, showOffences: true,
      showPdats: true, showContacts: false, showCras: true, showForms: false, showSuspensions: true,
    };

    // Show blank landing page on init
    this.root.render(
      React.createElement(ReactFlowCanvas, {
        events: [], initialVisibility: defaultVis, darkMode: false, width: 600, height: 400,
      })
    );
  }

  public update(options: VisualUpdateOptions): void {
    const width = options.viewport?.width ?? this.container.clientWidth ?? 600;
    const height = options.viewport?.height ?? this.container.clientHeight ?? 400;

    try {
      const dataView = options.dataViews?.[0];
      const rowCount = dataView?.table?.rows?.length ?? 0;

      // Read toggle settings
      const objects = dataView?.metadata?.objects;
      const timeline = (objects as any)?.timeline ?? {};
      const appearance = (objects as any)?.appearance ?? {};

      const visibility: TrackVisibility = {
        showHazards: timeline.showHazards !== false,
        showMissingEpisodes: timeline.showMissingEpisodes !== false,
        showAssetPlus: timeline.showAssetPlus !== false,
        showInterventions: timeline.showInterventions !== false,
        showBreaches: timeline.showBreaches !== false,
        showOffences: timeline.showOffences !== false,
        showPdats: timeline.showPdats !== false,
        showContacts: timeline.showContacts === true,
        showCras: timeline.showCras !== false,
        showForms: timeline.showForms === true,
        showSuspensions: timeline.showSuspensions !== false,
      };
      const darkMode = appearance.darkMode === true;

      if (!dataView || rowCount === 0) {
        // No data — show blank landing page
        this.root.render(
          React.createElement(ReactFlowCanvas, {
            events: [], initialVisibility: visibility, darkMode, width, height,
          })
        );
        return;
      }

      let events = transformData(dataView);

      // Manual drillthrough filter safety net:
      // If PBI sends all rows despite a page filter, apply it ourselves.
      const jsonFilters = (options as any).jsonFilters;
      if (jsonFilters && Array.isArray(jsonFilters) && jsonFilters.length > 0) {
        for (const f of jsonFilters) {
          if (f.filterType === 1 && f.values && f.values.length > 0) {
            const target = f.target;
            if (target && (target.column || "").toLowerCase().includes("case")) {
              const allowed = new Set(f.values.map((v: unknown) => String(v)));
              events = events.filter((e) => allowed.has(e.caseNumber));
              break;
            }
          }
        }
      }

      // Fallback: if still multiple cases after filter check,
      // the data is likely unfiltered — show only the first case.
      if (events.length > 0) {
        const uniqueCases = [...new Set(events.map((e) => e.caseNumber).filter(Boolean))];
        if (uniqueCases.length > 1) {
          const targetCase = uniqueCases[0];
          events = events.filter((e) => e.caseNumber === targetCase);
        }
      }

      this.root.render(
        React.createElement(ReactFlowCanvas, {
          events, initialVisibility: visibility, darkMode, width, height,
        })
      );
    } catch (err) {
      this.container.innerHTML = `<pre style="padding:12px;color:red;font-size:11px">Error: ${err}</pre>`;
    }
  }

  public destroy(): void {
    this.root.unmount();
  }
}
