/**
 * Elite Prime Clean — receives website form submissions and saves them to this Google Sheet.
 * Each form type (Commercial / Residential) gets its own tab.
 * Optional: sends an email alert for every new request.
 */

// Email that receives an alert for every new request. Leave "" to turn alerts off.
var NOTIFY_EMAIL = "contact@eliteprimeclean.com";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var p = e.parameter || {};
    var type = p["Type"] || "Other";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(type) || ss.insertSheet(type);

    // Header row: Date + every field received. New fields become new columns.
    var headers = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      : [];
    if (headers.length === 0) headers = ["Date"];
    Object.keys(p).forEach(function (k) {
      if (headers.indexOf(k) === -1) headers.push(k);
    });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);

    var row = headers.map(function (h) {
      return h === "Date" ? new Date() : (p[h] || "");
    });
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      var lines = Object.keys(p).map(function (k) { return k + ": " + p[k]; });
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: "New " + type + " request — " + (p["Your name"] || "website"),
        body: lines.join("\n") + "\n\nSheet: " + ss.getUrl()
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
