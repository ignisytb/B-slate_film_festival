/** @OnlyCurrentDoc */

const SHEET_NAME = '기대평';
const HEADER = ['작성 시각', '영화', '내용', '숨김'];
const MAX_LENGTH = 300;
const FILM_ID_PATTERN = /^film_\d{3}$/;
const FORMULA_PREFIXES = ['=', '+', '-', '@'];

function setUpSheet() {
  const spreadsheet = SpreadsheetApp.getActive();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('C2:C').setNumberFormat('@');
  sheet.getRange('D2:D').insertCheckboxes();
}

function doGet(e) {
  const film = e.parameter.film;
  const rows = reviewSheet().getDataRange().getValues().slice(1);
  const reviews = rows
    .filter(([time, rowFilm, content, hidden]) => time && hidden !== true && (!film || rowFilm === film))
    .map(([time, rowFilm, content]) => ({ time: new Date(time).toISOString(), film: rowFilm, content: String(content) }))
    .reverse();
  return jsonOutput({ reviews });
}

function doPost(e) {
  const review = parseReview(e);
  if (!review) return jsonOutput({ ok: false });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = reviewSheet();
    sheet.getRange(nextEmptyRow(sheet), 1, 1, HEADER.length)
      .setValues([[new Date(), review.film, escapeFormula(review.content), false]]);
  } finally {
    lock.releaseLock();
  }
  return jsonOutput({ ok: true });
}

function nextEmptyRow(sheet) {
  const times = sheet.getRange('A:A').getValues();
  const lastFilledIndex = times.map(([time]) => time !== '').lastIndexOf(true);
  return lastFilledIndex + 2;
}

function parseReview(e) {
  try {
    const { film, content } = JSON.parse(e.postData.contents);
    const text = String(content || '').trim();
    if (!FILM_ID_PATTERN.test(film) || !text || text.length > MAX_LENGTH) return null;
    return { film, content: text };
  } catch (error) {
    return null;
  }
}

function escapeFormula(text) {
  return FORMULA_PREFIXES.some(prefix => text.startsWith(prefix)) ? `'${text}` : text;
}

function reviewSheet() {
  return SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
}

function jsonOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
