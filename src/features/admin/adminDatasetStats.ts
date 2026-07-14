import { getDatasetBrowserDefinition } from "./datasetBrowserData";

export interface DatasetStats {
  records: number;
  lastImported: string;
}

export function getDatasetStats(
  datasetId: string,
): DatasetStats {
  const browser = getDatasetBrowserDefinition(datasetId);

  if (!browser) {
    return {
      records: 0,
      lastImported: "Never",
    };
  }

  return {
    records: browser.rows.length,
    lastImported: "Demo",
  };
}