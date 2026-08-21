import { GOOGLE_API_KEY, GOOGLE_APP_ID } from "./config";
import { loadGoogleScripts } from "./load-scripts";
import { getDriveFileToken } from "./token-client";

export class GooglePickerCancelledError extends Error {
  constructor(message = "Google picker cancelled") {
    super(message);
    this.name = "GooglePickerCancelledError";
  }
}

export interface PickedSpreadsheet {
  id: string;
  name: string;
}

export async function openSpreadsheetPicker(): Promise<PickedSpreadsheet> {
  await loadGoogleScripts();
  const accessToken = await getDriveFileToken();
  const pickerNs = window.google?.picker;
  if (!pickerNs) {
    throw new Error("Google Picker failed to load");
  }

  return new Promise((resolve, reject) => {
    const view = new pickerNs.DocsView(pickerNs.ViewId.SPREADSHEETS)
      .setMode(pickerNs.DocsViewMode.LIST);

    const picker = new pickerNs.PickerBuilder()
      .addView(view)
      .enableFeature(pickerNs.Feature.NAV_HIDDEN)
      .setOAuthToken(accessToken)
      .setDeveloperKey(GOOGLE_API_KEY)
      .setAppId(GOOGLE_APP_ID)
      .setOrigin(window.location.origin)
      .setTitle("Select a spreadsheet")
      .setCallback((data) => {
        if (data[pickerNs.Response.ACTION] === pickerNs.Action.CANCEL) {
          reject(new GooglePickerCancelledError());
          return;
        }
        if (data[pickerNs.Response.ACTION] !== pickerNs.Action.PICKED) return;
        const docs = data[pickerNs.Response.DOCUMENTS] ?? [];
        const doc = docs[0];
        const id = doc?.[pickerNs.Document.ID];
        if (!id) {
          reject(new Error("No spreadsheet selected"));
          return;
        }
        resolve({
          id,
          name: doc[pickerNs.Document.NAME] || "Spreadsheet",
        });
      })
      .build();

    picker.setVisible(true);
  });
}

export function isGooglePickerCancelled(error: unknown): boolean {
  return error instanceof GooglePickerCancelledError;
}
