export const APPS_SCRIPT_CODE = `/**
 * LifeOS Mini — Google Sheets Database Connector (Bidirectional Push & Pull)
 * Paste this script into your Google Sheet's Extensions > Apps Script.
 * Deploy as a Web App with access "Anyone".
 * 
 * OPTIONAL: Set your password here if you want password protection.
 * Leave as "" or "YOUR_CHOSEN_PASSWORD" if you do not want password protection.
 */
const ACCESS_PASSWORD = "YOUR_CHOSEN_PASSWORD"; // <-- CHANGE OR LEAVE BLANK

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const userPassword = params.password || "";
    
    // Check password if configured
    if (ACCESS_PASSWORD && ACCESS_PASSWORD !== "" && ACCESS_PASSWORD !== "YOUR_CHOSEN_PASSWORD") {
      if (userPassword !== ACCESS_PASSWORD) {
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "error", 
          message: "Unauthorized: Invalid or missing sync password. Please check your config." 
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    const doc = SpreadsheetApp.getActiveSpreadsheet();
    
    // Pull from each tab (supports multiple naming variations)
    const result = {
      status: "success",
      journal: getSheetData(doc, ["Journal", "Journal Entries", "Daily Journal"]),
      content: getSheetData(doc, ["ContentCalendar", "Content Calendar", "Content Pipeline", "Content"]),
      social: getSheetData(doc, ["SocialCalendar", "Social Calendar", "Social Events", "Social"]),
      evidence: getSheetData(doc, ["EvidencePortfolio", "Evidence Portfolio", "Deliverables", "Evidence"]),
      period: getSheetData(doc, ["PeriodLogs", "Period Logs", "Cycle Logs", "Cycle"]),
      cycleSettings: getSheetData(doc, ["CycleSettings", "Cycle Settings", "Settings"])
    };
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "Pull failed in Apps Script: " + err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data payload received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    const params = (e && e.parameter) ? e.parameter : {};
    const userPassword = data.password || params.password || "";

    if (ACCESS_PASSWORD && ACCESS_PASSWORD !== "" && ACCESS_PASSWORD !== "YOUR_CHOSEN_PASSWORD") {
      if (userPassword !== ACCESS_PASSWORD) {
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "error", 
          message: "Unauthorized: Invalid or missing sync password. Please check your config." 
        })).setMimeType(ContentService.MimeType.JSON);
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
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Robust sheet data extraction that tolerates date objects, capitalized headers, and empty rows
function getSheetData(doc, sheetNames) {
  const names = Array.isArray(sheetNames) ? sheetNames : [sheetNames];
  let sheet = null;
  for (let i = 0; i < names.length; i++) {
    sheet = doc.getSheetByName(names[i]);
    if (sheet) break;
  }
  
  if (!sheet) {
    sheet = doc.insertSheet(names[0]);
    return [];
  }
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  
  const rows = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  if (rows.length <= 1) return [];
  
  // Normalize header names to camelCase without spaces
  const rawHeaders = rows[0];
  const headers = rawHeaders.map(h => normalizeHeaderKey(String(h || "").trim()));
  const items = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Skip completely blank rows
    const isRowEmpty = row.every(cell => cell === "" || cell === null || cell === undefined);
    if (isRowEmpty) continue;
    
    const item = {};
    headers.forEach((header, index) => {
      if (!header) return;
      let val = row[index];
      
      // Format Google Sheets Date object to YYYY-MM-DD string
      if (val instanceof Date) {
        val = formatDate(val);
      } else if (typeof val === "string" && (header === "date" || header === "lastPeriodDate")) {
        val = sanitizeDateString(val);
      }
      
      // Parse JSON array / list fields
      if (header === "tags" || header === "photos" || header === "symptoms" || header === "pcosSymptoms") {
        if (typeof val === "string" && val.trim().startsWith("[")) {
          try {
            val = JSON.parse(val);
          } catch (e) {
            val = val.split(",").map(t => t.trim()).filter(Boolean);
          }
        } else if (typeof val === "string" && val.trim()) {
          val = val.split(",").map(t => t.trim()).filter(Boolean);
        } else if (!Array.isArray(val)) {
          val = [];
        }
      }
      
      // Handle boolean strings
      if (header === "isPCOSEnabled" || header === "isIrregular") {
        if (val === "true" || val === true || val === 1 || val === "1") val = true;
        else val = false;
      }
      
      item[header] = val;
    });
    
    // Ensure item has an ID
    if (!item.id && item.date) {
      item.id = (sheet.getName().toLowerCase().replace(/[^a-z]/g, "") || "item") + "-" + i + "-" + Date.now();
    }
    
    items.push(item);
  }
  return items;
}

function normalizeHeaderKey(header) {
  const map = {
    "id": "id",
    "date": "date",
    "title": "title",
    "content": "content",
    "mood": "mood",
    "tags": "tags",
    "photos": "photos",
    "phase": "phase",
    "status": "status",
    "notes": "notes",
    "capacitycount": "capacityCount",
    "impactvalue": "impactValue",
    "impactunit": "impactUnit",
    "qualityscore": "qualityScore",
    "flow": "flow",
    "symptoms": "symptoms",
    "lhtest": "lhTest",
    "basalbodytemp": "basalBodyTemp",
    "cervicalmucus": "cervicalMucus",
    "pcossymptoms": "pcosSymptoms",
    "cyclelength": "cycleLength",
    "periodlength": "periodLength",
    "lastperioddate": "lastPeriodDate",
    "ispcosenabled": "isPCOSEnabled",
    "isirregular": "isIrregular"
  };
  const clean = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  return map[clean] || header;
}

function formatDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return y + "-" + m + "-" + d;
}

function sanitizeDateString(str) {
  const trimmed = str.trim();
  if (/^\\d{4}-\\d{2}-\\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return formatDate(parsed);
  }
  return trimmed;
}

function saveToSheet(doc, sheetName, items, headers) {
  let sheet = doc.getSheetByName(sheetName);
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
  }
  
  sheet.clearContents();
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  if (!items || items.length === 0) return;
  
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
