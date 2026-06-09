# Solution : Student Management System

This document records the local setup performed to run the project and the full solution to
**Problem 2: Backend Developer Challenge — Complete CRUD Operations in Student Management**.

- **Status:** Problem 2 completed and verified end-to-end.
- **Scope touched:** `backend/` only (plus local environment configuration).
- **Date:** 2026-06-10

---

## 1. Problem 2 — Student CRUD (the task)

**Location:** `backend/src/modules/students/`

The service and repository layers were already implemented. The controller
(`students-controller.js`) shipped with empty stubs (`//write your code`). The task was to
complete the CRUD operations.

### 2.1 Endpoints implemented
| Method | Route | Handler | Purpose |
|--------|-------|---------|---------|
| GET  | `/api/v1/students`            | `handleGetAllStudents`  | List students (filter by name/class/section/roll) |
| POST | `/api/v1/students`            | `handleAddStudent`      | Create a student |
| GET  | `/api/v1/students/:id`        | `handleGetStudentDetail`| Read one student (full profile) |
| PUT  | `/api/v1/students/:id`        | `handleUpdateStudent`   | Update a student |
| POST | `/api/v1/students/:id/status` | `handleStudentStatus`   | Enable/disable a student |

Implementation followed the existing sibling pattern (`staffs-controller.js`) for consistency:
- Filters come from `req.query`; payloads from `req.body`.
- For update, `userId` is injected from `req.params.id` (the `student_add_update` SQL function
  uses the presence of `userId` to decide insert-vs-update).
- For status, `reviewerId` comes from `req.user`.

---

## 2. Improvements made beyond the bare stub

These were added to satisfy the README's backend checklist
(*"verify proper error handling and validation"*, *"test authentication and authorization"*,
*"file naming: kebab-case"*) and to bring the students module in line with the rest of the app.

### 2.1 Input validation (new)
- **File:** `backend/src/modules/students/students-schema.js` (new)
- Uses **Zod** + the project's existing `validateRequest()` middleware (the same pattern the
  `auth` module uses).
- Mirrors the frontend's `student-schema.ts` contract.
- `roll` is guarded as numeric so the DB `::INTEGER` cast cannot crash with a 500.
- Wired into `students-router.js` on POST / PUT / status routes.

**Effect:** missing/invalid fields now return `400 Validation error` (with per-field detail)
instead of a generic `500`.

### 2.2 Error handling fix
- **File:** `backend/src/modules/students/students-service.js`
- The original `addNewStudent` wrapped everything in a `try/catch` that masked the DB's
  meaningful `"Email already exists"` message behind a generic `500 "Unable to add student"`.
- Refactored so business-rule failures surface as **`400`** with the real message, while only
  genuine DB failures return `500`.

### 2.3 Authorization / RBAC (was missing)
- **File:** `backend/src/modules/students/students-router.js`
- The student routes did **not** enforce the `checkApiAccess` permission gate, even though four
  other modules (classes, notices, class-teacher, leave) do, and the permission rows for
  `/api/v1/students` already exist in `access_controls`.
- Added `checkApiAccess` to every student route.

**Effect (verified):**

| Role | POST `/api/v1/students` |
|------|--------------------------|
| Admin (1)   | BYPASS — full access |
| Teacher (2) | DENIED → 403 |
| Student (3) | DENIED → 403 |

### 2.4 File naming fix (kebab-case standard)
- Renamed `sudents-router.js` → **`students-router.js`** (typo) and updated the import in
  `backend/src/routes/v1.js`.

---

## 3. Verification (manual / curl)

All endpoints were exercised end-to-end with an authenticated admin session
(`authenticateToken` + `csrfProtection` + `checkApiAccess`).

### Happy path — all `200`
Create → Read all → Read one → Update → Status toggle, each confirmed in the database.

### Negative / validation / auth — all correct status codes
| Case | Result |
|------|--------|
| No auth token | `401` |
| Missing CSRF token | `400` |
| GET non-existent id | `404 Student not found` |
| Duplicate email | `400 Email already exists` |
| Missing name/email | `400 Validation error` (lists each field) |
| `status` not boolean | `400 Validation error` |
| `roll` non-numeric | `400 Roll must be a number` |
| Invalid email format | `400 Invalid email address` |

> Note: on create, the response may read *"Student added, but failed to send verification
> email."* — this is expected because `RESEND_API_KEY` is still the placeholder. The student is
> created regardless.

---

## 4. Files changed / added

```
backend/src/modules/students/students-controller.js   # implemented 5 CRUD handlers
backend/src/modules/students/students-schema.js        # NEW — Zod validation
backend/src/modules/students/students-router.js        # NEW name (was sudents-router.js) + validation + RBAC
backend/src/modules/students/students-service.js       # error-handling fix (4xx vs 500)
backend/src/routes/v1.js                               # updated router import
frontend/.env                                          # VITE_API_URL 5000 -> 5007 (setup)
```

---

## 5. Future enhancements (NOT done — optional, for later)

These are out of scope for Problem 2 but would further strengthen the backend:

1. **Automated tests.** The backend currently has none (`npm test` is a stub). A Jest +
   supertest suite for the student endpoints (happy path + the negative cases above) would be
   the highest-impact addition, since the README only asks for manual curl/Postman testing.
2. **Pagination on `GET /students`.** The list returns all rows; production systems should page
   (e.g. `?page=&limit=`) and return total counts.
3. **Apply the same error-handling fix to the `staffs` module.** `staffs-service.js` has the
   identical duplicate-email masking issue that was fixed here for students — worth fixing for
   parity.
4. **Surface the DB function's `description` (SQLERRM) in logs.** The `student_add_update`
   function returns a detailed `description` on failure; logging it server-side would speed up
   debugging without exposing internals to clients.

---


