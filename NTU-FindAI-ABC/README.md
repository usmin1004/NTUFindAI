# NTU FindAI — A/B/C LLM Evaluation Version

This version uses one app with three selectable prompt variants. The OpenAI Responses API runs both AI modules. The API key and confidential verification features stay on the server and are never included in browser code.

## What A, B, and C mean

- **A — Minimal LLM:** only a short basic instruction.
- **B — Simplified system:** matching and basic verification instructions, without the full safeguards and detailed decision rules.
- **C — Full system:** the complete structured matching, privacy, uncertainty, and safe-verification instructions.

Use the same 20 test cases with every version. Select A, enter a case, and record the result; then repeat with B and C. You do not need three separate apps.

For a faster demonstration, enter one report and click **Compare A · B · C**. The app runs all three prompt variants against the same report and displays the results side by side. Click **Download JSON result** to save evidence for the report. Use `evaluation-template.csv` to record the full 20-case evaluation.

The prompts are separated from the server code:

- Edit `prompts.js` to change the actual prompts used by the app.
- Read `PROMPTS.md` for the team-friendly explanation of A, B, and C.

## English setup

1. Install Node.js 20 or newer.
2. Create an OpenAI API key in the OpenAI Platform.
3. Make a copy of `.env.example` and name it `.env`.
4. Replace `your_api_key_here` with your real API key. Never share or submit this file.
5. Open a terminal in this folder and run `npm start`.
6. Open `http://127.0.0.1:4173` in your browser.

The previously supplied `sk-or-...` key is an OpenRouter key, not an OpenAI key, and its test returned an authentication error. Use a valid OpenAI Platform key for this version. Never paste a key into `public/app.js` or `index.html`.

No `npm install` is needed because this classroom version uses Node.js built-in features.

## 한국어 실행 방법

1. Node.js 20 이상을 설치합니다.
2. OpenAI Platform에서 API 키를 발급받습니다.
3. `.env.example` 파일을 복사하여 이름을 `.env`로 바꿉니다.
4. `your_api_key_here`를 실제 API 키로 교체합니다. 이 파일은 공유하거나 과제로 제출하면 안 됩니다.
5. 이 폴더에서 터미널을 열고 `npm start`를 실행합니다.
6. 브라우저에서 `http://127.0.0.1:4173`을 엽니다.

화면 위에서 A, B, C 중 하나를 고른 다음 같은 테스트 문장을 각각 실행하면 됩니다. 앱을 세 개 만들 필요는 없습니다.

## Architecture

Student browser → local Node.js server → OpenAI Responses API → validated JSON → student browser

- Module 1 receives the student report and public records only.
- Module 2 receives one selected record and its hidden verification features on the server.
- The browser never receives the hidden features or API key.
- Human staff makes the final release decision.
