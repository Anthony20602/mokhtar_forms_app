# Mokhtar Forms (web)

Next.js + PostgreSQL version of the Flutter "mokhtar_forms_app". It runs on one PC in
the mokhtar's office and is opened in a browser, from that PC or from any phone on the
same Wi-Fi.

What it does:

- Search the villagers registry (name, family name, father/mother name, registry number).
  Arabic spelling variants are ignored (أ/ا, ة/ه, ى/ي).
- Add, edit and delete people; see everyone on the same registry number.
- Fill in and print the 15 forms. إفادة سكن is written onto the scanned official form;
  the others are printed as a certificate letter with editable text.
- Every saved form is kept (with a yearly serial number) and can be reopened and reprinted.
- Print from the browser, send straight to a printer attached to the PC (works from a
  phone too), or download a PDF.

---

## 1. Install on the mokhtar's PC (once)

You need internet for this part only.

1. **Node.js** – install the LTS version from <https://nodejs.org> (version 22 or newer).
2. **PostgreSQL** – install version 16 or newer from
   <https://www.postgresql.org/download/windows/>. Keep the default port `5432` and
   **write down the password** you choose for the `postgres` user. The installer registers
   PostgreSQL as a Windows service, so it starts by itself with the PC.
3. **Copy this folder** (`mokhtar-forms-web`) to the PC, for example to `C:\mokhtar-forms-web`.
   Do not copy `node_modules`, `.next` or `.pgdata`.
4. **Connection settings** – copy `.env.example` to `.env.local` and put the PostgreSQL
   password in `DATABASE_URL`:

   ```
   DATABASE_URL=postgres://postgres:THE_PASSWORD@127.0.0.1:5432/mokhtar
   APP_PASSWORD=
   ```

   If the password contains `@ : / # ?` or spaces, percent-encode them (`@` → `%40`).
5. Open a terminal in the folder and run:

   ```
   npm install
   npm run db:setup
   npm run db:import -- "C:\path\to\Saghbine.db"
   npm run build
   ```

   - `db:setup` creates the `mokhtar` database and its tables.
   - `db:import` copies the people from the old SQLite file. It is safe to run again: ids
     that already exist are skipped (add `--replace` to overwrite them).

## 2. Start it every day

Double-click **`start-mokhtar.bat`**. It starts the app and opens `http://localhost:3000`.
Keep the black window open; closing it stops the app.

To start it automatically when Windows starts: press `Win + R`, type `shell:startup`, and
put a shortcut to `start-mokhtar.bat` in the folder that opens.

Port 3000 busy? Start it on another port: `set PORT=3100` then `start-mokhtar.bat`.

## 3. Open it from a phone

1. The phone must be on the **same Wi-Fi / network** as the PC.
2. In the app on the PC open **الإعدادات**: the box "الفتح من الهاتف" shows the address to
   type on the phone, for example `http://192.168.1.20:3000`.
3. The first time, Windows Firewall has to allow the port. Either click **Allow** when
   Windows asks, or run this once in PowerShell **as administrator**:

   ```powershell
   New-NetFirewallRule -DisplayName "Mokhtar Forms" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
   ```

   (The Wi-Fi network must be set to "Private" in Windows for that rule to apply.)
4. On the phone you can use the browser menu → **Add to Home screen** to get an app icon.
5. So the address never changes, reserve the PC's IP address in the router (DHCP
   reservation).

**Password.** Without a password, anyone on that Wi-Fi can open the registry. To require
one, set `APP_PASSWORD=...` in `.env.local` and restart the app. Every device then logs in
once and stays logged in for 30 days.

## 4. Printing

Install the printer in Windows first (USB or network) and print a Windows test page.

There are three ways to print a form, all from the print page (حفظ وطباعة):

| Button | What happens | Use it for |
| --- | --- | --- |
| **طباعة** | The print dialog of the device you are using. | Printing from the PC. |
| **إرسال إلى الطابعة** | The PC sends the page directly to the chosen Windows printer, no dialog. | Printing from a phone, or one-click printing. |
| **PDF** | Downloads the form as a PDF. | Sending by WhatsApp / e-mail. |

- Choose the default office printer once in **الإعدادات → طابعة المكتب الافتراضية**.
- In the browser print dialog use **A4**, **Scale 100% / Actual size**, **Margins: None**,
  otherwise the values shift on the form.
- The PDF and "إرسال إلى الطابعة" use Microsoft Edge (already part of Windows) in the
  background, and SumatraPDF (bundled with the `pdf-to-printer` package) to print.
  If Edge is somewhere unusual, set `BROWSER_PATH` in `.env.local`.

**Printing on the official pre-printed إفادة سكن paper.** In the form editor untick
"طباعة النموذج مع البيانات": only the data is printed, to land in the boxes of the paper
form. If everything is shifted by the same amount on paper, correct it in
**الإعدادات → إزاحة أفقية / عمودية** (millimetres). A single field can be dragged with
"تحريك الحقول" in the editor.

## 5. Importing many people from Excel

Open **الأهالي → استيراد من Excel** (or the link on the "add person" page).

1. **Download the template** (an empty Excel file with the right column titles) and fill it in. Only
   `الاسم` and `الشهرة` are required; every other column is optional and can be deleted. Other column
   titles that mean the same thing (for example `first_name`, `اسم الأب`, `الجنس`) are recognised.
2. **Choose the file.** It must be `.xlsx`, up to 5 MB and 5000 rows. The app checks every row and
   shows a **preview** with nothing saved yet:
   - **صالح (valid):** will be added. Small notes (for example "father's name is empty") are shown but do not block.
   - **مكرر (duplicate):** the same person (same names in any Arabic spelling, same birth date) already exists in the
     registry or appears earlier in the file. It is skipped.
   - **خطأ (error):** not added; the reason is written next to the row (missing name or surname, impossible or
     future birth date such as 31/2/1990, gender that is not ذكر/أنثى, unsupported characters in the registry number...).
3. **Press «تأكيد الاستيراد».** All valid rows are added in one step (all or nothing if the database fails). The
   summary shows how many were added, which rows were skipped as duplicates and which failed and why; the list can
   be downloaded as a CSV file to fix and re-upload. Uploading the same file again adds nothing.

Accepted values: birth date `26/5/1994` or just `1970` (Arabic digits and `-` or `.` separators are fine, Excel date
cells too); gender `ذكر` / `أنثى` (also `male`/`female`, `ذكور`/`إناث`).

The app has one shared password, not separate user roles, so anyone who can log in can import. Keep `APP_PASSWORD`
set when the app is reachable from other devices.

## 6. Backup

```
npm run db:backup
```

writes `backups\mokhtar-<date>.sql` (people + all issued forms). Copy that file to a USB
stick or cloud drive regularly. Restore with:

```
psql -U postgres -d mokhtar -f backups\mokhtar-<date>.sql
```

## 7. Updating the app

Replace the files (keep `.env.local`), then:

```
npm install
npm run db:setup
npm run build
```

and start it again.

---

## For developers

```
npm run dev            # http://localhost:3000, reloads on change
npm run typecheck
npm run lint
```

No PostgreSQL installed? `npm run db:dev` starts a private PostgreSQL on port 5433 with its
data in `.pgdata/` (`npm run db:dev -- stop` stops it). Point `DATABASE_URL` at
`postgres://postgres:mokhtar_dev@127.0.0.1:5433/mokhtar`.

`npm run db:backup` uses the `pg_dump` of the installed PostgreSQL, which must be the same
version as the server or newer. It therefore cannot dump the private development database
(PostgreSQL 18) with PostgreSQL 16 tools; against an installed PostgreSQL it matches.

### Project structure

One Next.js project, split into a backend, a frontend and a small shared layer. ESLint enforces the
import rules below (`npm run lint` fails if a layer imports what it must not).

```
src/
  backend/                  BACKEND: runs only on the PC
    database/                 db.ts (PostgreSQL connection pool, error messages), load.ts
    services/                 persons.ts, documents.ts, settings.ts (data + rules), printing.ts (PDF, printers),
                              personImport.ts + personImportRules.ts (Excel import: reading, validation, duplicates)
    api/                      http.ts (API error handling), validation.ts (zod input schemas)
    auth/                     auth.ts (optional password gate, session and print tokens)
  frontend/                 FRONTEND: runs in the browser
    api/                      client.ts: the one function that calls the HTTP API
    components/
      ui/                       buttons, cards, notices, icons, DeleteButton
      layout/                   AppNav (top navigation)
      persons/                  PersonSearch, PersonCombobox (dropdown search), PersonForm, PersonImport (Excel)
      documents/                DocumentEditor, DocumentList, PrintToolbar
      sheets/                   DocumentSheet, ScaledSheet: the A4 page shown and printed
      settings/                 SettingsForm
      auth/                     LoginForm
  shared/                   Pure code both sides need
    types.ts, arabic.ts, params.ts
    forms/                    the 15 form definitions (registry, residence, letter, prefill)
  app/                      Next.js routes (the framework requires them here)
    api/                      BACKEND HTTP layer: thin route handlers -> src/backend
    (app)/ (auth)/ (print)/   FRONTEND pages -> src/frontend
  proxy.ts                  password gate in front of everything
db/migrations/              database schema (numbered SQL files)
scripts/                    command-line tools: db-setup, db-import, db-backup, dev-db
```

| Layer | May import | Must not import |
| --- | --- | --- |
| `src/backend` | `shared` | `frontend` |
| `src/frontend` | `shared` | `backend` |
| `src/shared` | (nothing else in the project) | `backend`, `frontend` |
| `src/app` | all three | |

**How the two sides talk.** Interactive parts of the UI (search, saving, printing, settings) call the
JSON API below through `src/frontend/api/client.ts`. Server-rendered pages read data directly from
`src/backend` on the server, which is the normal Next.js way and never reaches the browser. Both
paths use the same functions, so the rules (search, serial numbers, validation) live in one place.

### HTTP API

All responses are JSON; errors are `{ "error": "<message>" }` with a fitting status (400 invalid input,
401 not logged in, 404 not found, 503 database unavailable).

| Method and path | Purpose |
| --- | --- |
| `GET /api/persons?q=&limit=&offset=` | Search people (`{ items, total }`) |
| `POST /api/persons/import/preview` | Upload an `.xlsx` (multipart field `file`); returns every row with its status and errors. Saves nothing. |
| `POST /api/persons/import` | `{ rows }` from the preview; re-checks, adds the valid non-duplicate rows, returns `{ total, imported, skipped, failed }` |
| `GET /api/persons/import/template` | The empty Excel template |
| `POST /api/persons` | Add a person |
| `GET` / `PUT` / `DELETE /api/persons/:id` | Read, update, delete one person |
| `GET /api/documents?q=&personId=&formType=&limit=&offset=` | List issued documents |
| `POST /api/documents` | Save a new document (assigns the serial number) |
| `GET` / `PUT` / `DELETE /api/documents/:id` | Read, update, delete one document |
| `GET /api/documents/:id/pdf[?download=1]` | The document as a PDF |
| `POST /api/documents/:id/print` | `{ mode: "server", printer?, copies? }` prints on the PC's printer; `{ mode: "browser" }` records a print done on the device |
| `GET /api/printers` | Printers installed on the PC |
| `GET` / `PUT /api/settings` | Mokhtar details and print preferences |
| `GET /api/stats` | Registry statistics |
| `GET /api/health` | Server and database status |
| `POST /api/auth/login`, `/api/auth/logout` | Password login (only when `APP_PASSWORD` is set) |

### Adding a feature

1. Data and rules: a function in `src/backend/services/` (and a zod schema in `src/backend/api/validation.ts`).
2. Expose it: a route in `src/app/api/.../route.ts` wrapped in `route(...)` from `src/backend/api/http.ts`.
3. Use it: a page in `src/app/` or a component in `src/frontend/components/` that calls it via `api()`.
4. New data shape used on both sides: add it to `src/shared/types.ts`.

### Database

- `persons` – the registry. `record_no` is text (the registry has values like `17 مكرر`);
  `birth_date` is kept as written (`26/5/1994` or just `1970`); `search_text` is a generated,
  normalised column used for searching.
- `documents` – every saved form: `form_type`, `person_id`, `serial_year` + `serial_no`,
  and `data` (JSON: the field values, per-field position nudges, extra free texts).
- `settings` – one JSON row with the mukhtar's details and printing preferences.

### Adding another official form as a template

1. Scan the form to an A4 JPG (150 dpi is enough) into `public/templates/`.
2. Copy `src/shared/forms/residence.ts`: list the inputs and, for each value, the box
   (x, y, width, height in millimetres from the top-left corner of the page).
3. Register it in `src/shared/forms/index.ts` and set `kind: "template"` and `background` for
   that form in `src/shared/forms/registry.ts`.

Until a form has a template it is printed as a letter; its default text is the `body` in
`src/shared/forms/registry.ts`.
