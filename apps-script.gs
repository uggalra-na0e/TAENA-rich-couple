// 주니와 영이 부자되자 - 구글 시트 공유용 코드
// 1) 아래 PASSWORD 를 두 분만 아는 비밀번호로 바꿔 주세요.
//    코드를 새로 붙여넣을 때도 이 줄은 지금 쓰는 비밀번호로 다시 적어 주세요.
const PASSWORD = '여기에_우리집_비밀번호';
const SHEET = 'records';
const LOG = '접속기록';        // 누가(어느 기기가) 언제 연결했는지 남기는 탭
const TZ = 'Asia/Seoul';
const GAP = 30 * 60000;       // 30분 안에 같은 기기가 또 연결하면 같은 줄에 횟수만 더해요
const LOG_MAX = 5000;         // 접속기록이 이보다 길어지면 오래된 1000줄을 지워요
const BAD = '⚠️ 비밀번호 틀림';
const NEW = '🆕 처음 보는 기기';
const NODEV = '❓ 앱 밖에서 연결(또는 옛 버전 앱)';

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
  const p = e.parameter || {};
  if (p.text) return addInbox_(p);
  const what = p.log ? '접속 기록 보기' : '보기';
  if ((p.key || '') !== PASSWORD) { log_(p, what, true); return out_({ ok: false, error: 'bad key' }); }
  if (p.log) { log_(p, what, false); return out_({ ok: true, log: readLog_() }); }
  const since = Number(p.since || 0);
  const now = Date.now() - 1000;
  const rows = sheet_().getDataRange().getValues().slice(1)
    .filter(r => r[0] && Number(r[2]) > since)
    .map(r => ({ id: r[0], json: r[1], t: Number(r[2]) }));
  log_(p, what, false);
  return out_({ ok: true, rows: rows, now: now });
}
// 폰 자동화(MacroDroid 등)가 결제 알림 글자를 보내면 'inbox' 기록으로 넣어요. 가계부 앱이 읽어서 지출로 바꿔요.
function addInbox_(p) {
  const who = clip_(p.who, 10);
  const src = { dev: 'auto:' + who, dn: '폰 알림' + (who ? ' · ' + who : ''), dk: '폰 자동 알림' };
  if ((p.key || '') !== PASSWORD) { log_(src, '폰 알림', true); return out_({ ok: false, error: 'bad key' }); }
  const text = String(p.text || '').slice(0, 1000);
  if (!text.trim()) return out_({ ok: false, error: 'no text' });
  let res;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const s = sheet_();
    const last = Math.max(2, s.getLastRow() - 30);
    const recent = s.getLastRow() > 1 ? s.getRange(last, 2, s.getLastRow() - last + 1, 1).getValues() : [];
    const now = Date.now();
    let dup = false;
    for (const [j] of recent) { // 같은 알림이 두 번 오면 한 번만
      try { const o = JSON.parse(j); if (o.kind === 'inbox' && o.text === text && now - o.t < 10 * 60000) { dup = true; break; } } catch (err) {}
    }
    if (!dup) {
      const rec = { id: 'in_' + now + '_' + Math.floor(Math.random() * 1e6), kind: 'inbox', text: text, who: String(p.who || ''), t: now };
      s.appendRow([rec.id, JSON.stringify(rec), now]);
    }
    res = dup ? { ok: true, dup: true } : { ok: true };
  } finally {
    lock.releaseLock();
  }
  log_(src, '폰 알림', false);
  return out_(res);
}
function doPost(e) {
  if (e.parameter && e.parameter.text) return addInbox_(e.parameter);
  const body = JSON.parse(e.postData.contents || '{}');
  if (body.key !== PASSWORD) { log_(body, '저장', true); return out_({ ok: false, error: 'bad key' }); }
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
  } finally {
    lock.releaseLock();
  }
  log_(body, '저장', false);
  return out_({ ok: true });
}

// ---------- 접속 기록 ----------
// 구글은 접속한 곳의 IP 주소를 알려 주지 않아요. 그래서 기기 번호·이름·종류는 가계부 앱이 보내 준 걸 적어요.
// 앱은 기기마다 처음 열 때 기기 번호를 한 번 만들어요. 처음 보는 번호면 '처음 보는 기기'로 표시해요.
function clip_(v, n) { return String(v == null ? '' : v).replace(/[\r\n\t]/g, ' ').trim().slice(0, n); }
function safe_(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; } // 시트가 글자를 수식으로 읽지 않게
function logSheet_() {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(LOG);
  if (!s) {
    s = ss.insertSheet(LOG);
    s.appendRow(['날짜', '시작', '마지막', '기기 이름', '기기 종류', '한 일', '연결 횟수', '알림', '기기 번호', 't']);
    s.getRange('A:C').setNumberFormat('@');
    s.setFrozenRows(1);
  }
  return s;
}
function log_(p, what, bad) {
  const lock = LockService.getScriptLock();
  try { if (!lock.tryLock(5000)) return; } catch (err) { return; } // 바쁘면 기록만 건너뛰어요(가계부는 막지 않아요)
  try {
    p = p || {};
    const now = Date.now();
    const dev = clip_(p.dev, 40).replace(/[^\w:.\-가-힣]/g, '');
    const kind = safe_(clip_(p.dk, 40));
    const nm = safe_(clip_(p.dn, 30));
    let note = '';
    if (bad) note = BAD;
    else if (!dev) note = NODEV;
    else {
      const props = PropertiesService.getScriptProperties();
      let known = {};
      try { known = JSON.parse(props.getProperty('devs') || '{}'); } catch (err) {}
      if (!known[dev]) {
        note = NEW;
        if (Object.keys(known).length < 120) { known[dev] = now; try { props.setProperty('devs', JSON.stringify(known)); } catch (err) {} }
      }
    }
    const s = logSheet_();
    const last = s.getLastRow();
    if (last > 1) { // 30분 안에 같은 기기가 다시 왔으면 그 줄에 더해요
      const from = Math.max(2, last - 39);
      const vals = s.getRange(from, 1, last - from + 1, 10).getValues();
      for (let i = vals.length - 1; i >= 0; i--) {
        const v = vals[i];
        if (String(v[8]) === dev && (String(v[7]) === BAD) === bad && now - Number(v[9]) < GAP) {
          const did = String(v[5]).split('·').filter(String);
          if (did.indexOf(what) < 0) did.push(what);
          s.getRange(from + i, 3, 1, 8).setValues([[fmt_(now, 'HH:mm:ss'), nm || safe_(String(v[3])), kind || safe_(String(v[4])), did.join('·'), Number(v[6] || 0) + 1, v[7] || note, safe_(dev), now]]);
          return;
        }
      }
    }
    s.appendRow([fmt_(now, 'yyyy-MM-dd'), fmt_(now, 'HH:mm:ss'), fmt_(now, 'HH:mm:ss'), nm || (dev ? '이름 없는 기기' : '모르는 기기'), kind, what, 1, note, safe_(dev), now]);
    if (s.getLastRow() > LOG_MAX) s.deleteRows(2, 1000);
  } catch (err) {
  } finally {
    lock.releaseLock();
  }
}
function fmt_(t, f) { return Utilities.formatDate(new Date(t), TZ, f); }
// 앱의 '접속 기록 보기'용: 최근 80줄을 새것부터
function readLog_() {
  const s = SpreadsheetApp.getActive().getSheetByName(LOG);
  if (!s || s.getLastRow() < 2) return [];
  const n = Math.min(80, s.getLastRow() - 1);
  return s.getRange(s.getLastRow() - n + 1, 1, n, 9).getDisplayValues().reverse();
}
