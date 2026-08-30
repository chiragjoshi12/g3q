# ગુજરાત ક્વિઝ — Gujarat Gov Quiz

A Gujarati-language quiz MVP built with Next.js 16 (App Router), JavaScript, Tailwind v4 and Zustand.
All content is served from local JSON; all user state is persisted to LocalStorage.

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

### Demo credentials

| Role | Code | OTP |
| --- | --- | --- |
| વિદ્યાર્થી (Student, UDISE) | `24010100101` / `24020200202` | `123456` |
| કૉલેજ (College, ABC ID) | `123456789012` / `987654321098` | `123456` |

---

## Architecture

Layered so the data source can be replaced without touching UI or business logic.

```
View            app/**, components/**        rendering + interaction only
ViewModel       store/**, hooks/**           observable state, no I/O details
Use cases       controllers/**               orchestration + input validation
Domain          lib/domain/**                pure logic: grading, scoring, formatting
Data access     lib/data/repositories/**     returns domain models
Transport       lib/data/sources/**          JSON today, REST tomorrow
Persistence     lib/storage/**               namespaced LocalStorage adapter
Configuration   config/**                    routes, nav, question types, feature switches
```

Dependencies point downward only. Nothing in `components/` imports a source or a
repository; nothing in `lib/domain/` imports React.

### Swapping JSON for a real API

One line in [`config/app.config.js`](config/app.config.js):

```js
dataSource: DATA_SOURCE.REST,          // or NEXT_PUBLIC_DATA_SOURCE=rest
api: { baseUrl: "https://api.example.gov.in/v1" }
```

[`lib/data/sources/index.js`](lib/data/sources/index.js) resolves the active source, and
[`http.source.js`](lib/data/sources/http.source.js) already implements the full contract:

| Method | REST endpoint |
| --- | --- |
| `requestOtp({ role, credential })` | `POST /auth/otp/request` |
| `verifyOtp({ requestId, otp })` | `POST /auth/otp/verify` |
| `listQuizzes()` | `GET /quizzes` |
| `getQuizById(id)` | `GET /quizzes/:id` |
| `getQuestionsByQuizId(id)` | `GET /quizzes/:id/questions` |
| `getExplanationsByQuizId(id)` | `GET /quizzes/:id/explanations` |

Three things make the swap a non-event:

1. **The JSON source is already async and artificially delayed**, so every screen
   already renders loading and error states.
2. **Mappers in [`lib/domain/models.js`](lib/domain/models.js)** are the only place that
   knows the wire format. A renamed or renested API field is a change there and nowhere else.
3. **Errors are normalised** to `AppError` with a stable `code`, so the UI never
   branches on transport-specific failures.

Moving attempts server-side is the same shape of change: rewrite the four method
bodies in [`attempt.repository.js`](lib/data/repositories/attempt.repository.js) — callers
already `await` them.

---

## Quiz engine

Seven question types, each a renderer taking the identical prop contract
(`question`, `value`, `onChange`, `disabled`, `revealed`):

| Type | Interaction |
| --- | --- |
| `single_choice` | one option |
| `multiple_choice` | many options |
| `match_following` | tap left → tap right to pair |
| `image_choice` | image grid |
| `fill_blank` | free text, fuzzy-matched against `acceptable[]` |
| `drag_drop` | drag to reorder, with arrow-button fallback |
| `drag_into_blanks` | drag or tap chips into sentence blanks |

Adding an eighth type means three additions and no edits elsewhere: a constant in
[`config/question-types.js`](config/question-types.js), a grader in
[`lib/domain/grading.js`](lib/domain/grading.js), and a renderer registered in
[`QuestionRenderer.jsx`](components/quiz/QuestionRenderer.jsx).

### Session rules

State machine in [`store/quiz.store.js`](store/quiz.store.js):

- `ANSWERING` — timer running; Submit appears only once the answer is valid
- `REVIEWING` — timer frozen; correct/wrong verdict and AI explanation shown; Next unlocks
- `COMPLETED` — attempt graded and persisted

A question can never be skipped, because Next only exists in `REVIEWING`, which is
only reachable through Submit. Two durations are recorded: `totalTimeMs` (sum of
per-question active timers) and `wallClockMs` (start to submission, including reading time).
Progress persists mid-quiz — a reload resumes on the same question, and time spent with
the app closed is not billed to the question.

---

## Persistence

Everything is namespaced under `ggq:v1:` via
[`lib/storage/storage.js`](lib/storage/storage.js), which falls back to memory when
LocalStorage is unavailable (private mode, quota) and clears only its own keys.

| Key | Contents |
| --- | --- |
| `ggq:v1:session` | user profile, token, login state |
| `ggq:v1:quiz-progress` | current attempt, answers, timings, phase |
| `ggq:v1:attempts` | completed attempts with full breakdown |

---

## UI

Desktop-first Android framing: on `md+` the app renders inside a centred phone bezel
on a branded backdrop; below `md` the frame drops away and it fills the viewport. Material
touches — segmented buttons, elevation tokens (`shadow-m1…m3`), the navigation-bar pill
indicator, emphasized easing — are theme tokens in
[`app/globals.css`](app/globals.css) rather than per-component styling.

All content is Gujarati, including numerals: `toGujaratiDigits` in
[`lib/domain/format.js`](lib/domain/format.js) renders `૧૨૩` rather than `123` throughout.
