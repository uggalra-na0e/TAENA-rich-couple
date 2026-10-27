// 주니와 영이 부자되자 - 구글 시트 공유용 코드
// 1) 아래 PASSWORD 를 두 분만 아는 비밀번호로 바꿔 주세요.
const PASSWORD = '여기에_우리집_비밀번호';
const SHEET = 'records';

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(SHEET);
  if (!s) { s = ss.insertSheet(SHEET); s.appendRow(['id', 'json', 't']); }
  return s;
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  if (e.parameter.text) return addInbox_(e.parameter);
  if ((e.parameter.key || '') !== PASSWORD) return out_({ ok: false, error: 'bad key' });
  const since = Number(e.parameter.since || 0);
  const rows = sheet_().getDataRange().getValues().slice(1)
    .filter(r => r[0] && Number(r[2]) > since)
    .map(r => ({ id: r[0], json: r[1], t: Number(r[2]) }));
  return out_({ ok: true, rows: rows, now: Date.now() - 1000 });
}
// 폰 자동화(MacroDroid 등)가 결제 알림 글자를 보내면 'inbox' 기록으로 넣어요. 가계부 앱이 읽어서 지출로 바꿔요.
function addInbox_(p) {
  if ((p.key || '') !== PASSWORD) return out_({ ok: false, error: 'bad key' });
  const text = String(p.text || '').slice(0, 1000);
  if (!text.trim()) return out_({ ok: false, error: 'no text' });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const s = sheet_();
    const last = Math.max(2, s.getLastRow() - 30);
    const recent = s.getLastRow() > 1 ? s.getRange(last, 2, s.getLastRow() - last + 1, 1).getValues() : [];
    const now = Date.now();
    for (const [j] of recent) { // 같은 알림이 두 번 오면 한 번만
      try { const o = JSON.parse(j); if (o.kind === 'inbox' && o.text === text && now - o.t < 10 * 60000) return out_({ ok: true, dup: true }); } catch (err) {}
    }
    const rec = { id: 'in_' + now + '_' + Math.floor(Math.random() * 1e6), kind: 'inbox', text: text, who: String(p.who || ''), t: now };
    s.appendRow([rec.id, JSON.stringify(rec), now]);
    return out_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
function doPost(e) {
  if (e.parameter && e.parameter.text) return addInbox_(e.parameter);
  const body = JSON.parse(e.postData.contents || '{}');
  if (body.key !== PASSWORD) return out_({ ok: false, error: 'bad key' });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const s = sheet_();
    const data = s.getDataRange().getValues();
    const idx = {};
    data.forEach((r, i) => { if (i > 0) idx[r[0]] = i + 1; });
    (body.rows || []).forEach(rec => {
      if (!rec || !rec.id) return;
      const row = [rec.id, JSON.stringify(rec), Date.now()];
      if (idx[rec.id]) {
        const old = JSON.parse(s.getRange(idx[rec.id], 2).getValue() || '{}');
        if ((old.t || 0) > (rec.t || 0)) return; // 더 최근 기록이 이미 있으면 그대로 둬요
        s.getRange(idx[rec.id], 1, 1, 3).setValues([row]);
      } else {
        s.appendRow(row);
        idx[rec.id] = s.getLastRow();
      }
    });
    return out_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
