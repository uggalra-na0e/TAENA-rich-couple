# 주니와 영이 부자되자

부부 가계부 (픽셀아트). 웹 주소로 열어 쓰고, 기록은 각자 구글 시트(Apps Script)에 저장돼요.

- `index.html` : 프로그램 (빌드 결과)
- `#widget` : 작은 위젯 화면
- `apps-script.gs` : 구글 시트 Apps Script 연결 코드. 시트 `접속기록` 탭에 어느 기기가 언제 연결했는지 남겨요(처음 보는 기기·비밀번호 틀림 표시). 코드를 바꾸면 Apps Script에서 배포 → 배포 관리 → 수정 → 새 버전으로 다시 배포해야 반영돼요
- `src/` : 소스. `cd src && python3 build2.py && mv app.html ../index.html`
- `qrcode.js` : QR 생성 (qrcode-generator 1.4.4, Kazuhiko Arase, MIT)
