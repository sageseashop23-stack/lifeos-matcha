export const APPS_SCRIPT_CODE = `/**
 * LifeOS Mini — Google Sheets Database Connector with Password Protection
 * Paste this script into your Google Sheet's Extensions > Apps Script.
 * Deploy as a Web App with access "Anyone".
 * 
 * IMPORTANT: Set your password here! Keep it secure.
 */
const ACCESS_PASSWORD = "YOUR_CHOSEN_PASSWORD"; // <-- CHANGE THIS TO YOUR SECURE PASSWORD

function doGet(e) {
  const userPassword = e.parameter.password || "";
  if (ACCESS_PASSWORD && ACCESS_PASSWORD !== "" && ACCESS_PASSWORD !== "YOUR_CHOSEN_PASSWORD") {
    if (userPassword !== ACCESS_PASSWORD) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Unauthorized: Invalid or missing sync password. Please check your config." 
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
  }

  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const result = {
    journal: getSheetData(doc, "Journal"),
    content: getSheetData(doc, "ContentCalendar"),
    social: getSheetData(doc, "SocialCalendar"),
    evidence: getSheetData(doc, "EvidencePortfolio"),
    period: getSheetData(doc, "PeriodLogs"),
    cycleSettings: getSheetData(doc, "CycleSettings")
  };
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const userPassword = data.password || e.parameter.password || "";

    if (ACCESS_PASSWORD && ACCESS_PASSWORD !== "" && ACCESS_PASSWORD !== "YOUR_CHOSEN_PASSWORD") {
      if (userPassword !== ACCESS_PASSWORD) {
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "error", 
          message: "Unauthorized: Invalid or missing sync password. Please check your config." 
        }))
        .setMimeType(ContentService.MimeType.JSON);
      }
    }

    const doc = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.journal) saveToSheet(doc, "Journal", data.journal, ["id", "date", "content", "mood", "tags", "photos"]);
    if (data.content) saveToSheet(doc, "ContentCalendar", data.content, ["id", "date", "title", "phase", "status", "notes"]);
    if (data.social) saveToSheet(doc, "SocialCalendar", data.social, ["id", "date", "title", "phase", "status", "notes"]);
    if (data.evidence) saveToSheet(doc, "EvidencePortfolio", data.evidence, ["id", "date", "title", "capacityCount", "impactValue", "impactUnit", "qualityScore", "notes"]);
    if (data.period) saveToSheet(doc, "PeriodLogs", data.period, ["id", "date", "flow", "symptoms", "lhTest", "basalBodyTemp", "cervicalMucus", "pcosSymptoms", "notes"]);
    if (data.cycleSettings) saveToSheet(doc, "CycleSettings", data.cycleSettings, ["cycleLength", "periodLength", "lastPeriodDate", "isPCOSEnabled", "isIrregular"]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Successfully synced with Google Sheets" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData(doc, sheetName) {
  let sheet = doc.getSheetByName(sheetName);
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
    return [];
  }
  
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  const headers = rows[0];
  const items = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const item = {};
    headers.forEach((header, index) => {
      let val = row[index];
      if (header === "tags" || header === "photos" || header === "symptoms" || header === "pcosSymptoms") {
        try {
          val = JSON.parse(val || "[]");
        } catch (e) {
          val = val ? val.toString().split(",").map(t => t.trim()) : [];
        }
      }
      // Handle boolean strings from sheet
      if (header === "isPCOSEnabled" || header === "isIrregular") {
        if (val === "true" || val === true) val = true;
        else if (val === "false" || val === false) val = false;
      }
      item[header] = val;
    });
    items.push(item);
  }
  return items;
}

function saveToSheet(doc, sheetName, items, headers) {
  let sheet = doc.getSheetByName(sheetName);
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
  }
  
  sheet.clearContents();
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  if (items.length === 0) return;
  
  const values = items.map(item => {
    return headers.map(header => {
      const val = item[header];
      if (header === "tags" || header === "photos" || header === "symptoms" || header === "pcosSymptoms") {
        return JSON.stringify(val || []);
      }
      return val === undefined ? "" : val;
    });
  });
  
  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}
`;
