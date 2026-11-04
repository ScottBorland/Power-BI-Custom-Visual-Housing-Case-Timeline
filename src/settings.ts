// src/settings.ts — Visual formatting settings for the Power BI properties pane

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";

export class TimelineSettings {
  public showHazards: boolean = true;
  public showMissingEpisodes: boolean = true;
  public showAssetPlus: boolean = true;
  public showInterventions: boolean = true;
  public showOffences: boolean = true;
  public showExclusions: boolean = true;
}

export class AppearanceSettings {
  public darkMode: boolean = false;
  public nodeSpacing: number = 0; // 0 = auto
}

export class VisualSettings extends dataViewObjectsParser.DataViewObjectsParser {
  public timeline: TimelineSettings = new TimelineSettings();
  public appearance: AppearanceSettings = new AppearanceSettings();
}
