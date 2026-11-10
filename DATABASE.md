# Connecting to the database

The app stores everything in a PostgreSQL database named **`mokhtar`**.
The password is never written in this file: it is in `.env.local`, inside `DATABASE_URL`
(how to change passwords: section 5).

```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
                        ^user ^password ^host ^port ^database name
```

## 1. Where the database is

There are two PostgreSQL servers on this PC. Check `.env.local` to see which one the app uses.

| | Development server | Installed PostgreSQL 16 |
| --- | --- | --- |
| Port | **5433** | **5432** |
| Host | `127.0.0.1` (this PC only) | `127.0.0.1` locally, or this PC's IP on the network |
| Database | `mokhtar` (already holds the 4,141 people) | `mokhtar` (created by `npm run db:setup`) |
| User | `postgres` | `postgres` |
| Password | in `DATABASE_URL` of `.env.local` | the one chosen when PostgreSQL 16 was installed |
| Files on disk | `mokhtar-forms-web\.pgdata\` | `C:\Program Files\PostgreSQL\16\data` |
| How it runs | started by hand: `npm run db:dev` | Windows service `postgresql-x64-16`, starts with Windows |

Development server commands (run in the `mokhtar-forms-web` folder):

```
npm run db:dev              start it
npm run db:dev -- status    is it running?
npm run db:dev -- stop      stop it
```

## 2. Connect from this PC

### Option A: pgAdmin or DBeaver (graphical)

1. Install pgAdmin (<https://www.pgadmin.org/download/>) or DBeaver (<https://dbeaver.io/download/>).
2. Create a new connection with:
   - **Host:** `127.0.0.1`
   - **Port:** `5433` (development) or `5432` (installed PostgreSQL 16)
   - **Database:** `mokhtar`
   - **Username:** `postgres`
   - **Password:** the one from `.env.local`
3. Save and connect. The tables are under `mokhtar > Schemas > public > Tables`:
   `persons`, `documents`, `settings`, `schema_migrations`.

### Option B: psql (command line, installed PostgreSQL 16 only)

```
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -h 127.0.0.1 -p 5432 -U postgres -d mokhtar
```

It asks for the password. To reach the development server, use `-p 5433`; PostgreSQL 16's `psql` can connect to it.

Useful commands inside `psql`:

```
\dt                                  list tables
\d persons                           show a table's columns
SELECT count(*) FROM persons;        number of people
\q                                   quit
```

### Check that the app itself is connected

Open `http://localhost:3000/api/health` (or port 3100 when running the dev preview). A working
connection shows `"database":"up"` and the number of people.

## 3. Connect from another PC on the network

Most people do **not** need this: phones and other PCs simply open the web app, and only the office
PC talks to PostgreSQL. Do this only to use pgAdmin/DBeaver from another computer, and only on
the installed PostgreSQL 16 (the development server accepts local connections only).

1. **Allow the network.** Open `C:\Program Files\PostgreSQL\16\data\pg_hba.conf` as administrator
   and add one line below the existing `host` lines (adjust `192.168.2.0/24` to your network):

   ```
   host    mokhtar    postgres    192.168.2.0/24    scram-sha-256
   ```

2. **Open the firewall** (PowerShell as administrator):

   ```powershell
   New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow -Profile Private
   ```

3. **Restart PostgreSQL** (PowerShell as administrator):

   ```powershell
   Restart-Service postgresql-x64-16
   ```

4. On the other PC connect to host = **this PC's IP address** (shown on the app's Settings page,
   for example `192.168.2.45`), port `5432`, database `mokhtar`, user `postgres`.

PostgreSQL 16 already listens on all network interfaces (`listen_addresses = '*'`); the `pg_hba.conf`
line and the firewall rule are what actually allow remote logins. Never open port 5432 to the
internet.

## 4. Switch the app to the installed PostgreSQL 16

1. Edit `.env.local`:

   ```
   DATABASE_URL=postgres://postgres:YOUR_PG16_PASSWORD@127.0.0.1:5432/mokhtar
   ```

   If the password contains `@ : / # ?` or spaces, write them percent-encoded (`@` becomes `%40`).
2. Create the database and tables, then copy the people in:

   ```
   npm run db:setup
   npm run db:import -- "C:\Users\Administrator\Documents\Database SQLite\Saghbine.db"
   ```
3. Restart the app.

## 5. Passwords: where they are and how to change them

There are three different passwords. Do not mix them up.

| Password | Where it is stored | What it protects |
| --- | --- | --- |
| **Development database** (user `postgres`) | In `DATABASE_URL` in `.env.local`, between `postgres:` and `@` | The temporary server on port 5433 |
| **Installed PostgreSQL 16** (user `postgres`) | Nowhere on the PC. It is the one chosen when PostgreSQL was installed. | The server on port 5432 |
| **App login** (`APP_PASSWORD`) | In `.env.local` | The login page of the web app |

Rules for `.env.local` (the app reads it only when it starts, so **restart the app after every change**):

- Put the app password in double quotes if it contains `#`, otherwise everything from `#` on is cut off:
  `APP_PASSWORD="Your#Password"`
- Inside `DATABASE_URL` the password is part of a URL, so quotes do not help. Avoid the characters
  `@ : / # ? %` and spaces, or write them percent-encoded (`@` = `%40`, `#` = `%23`, `:` = `%3A`,
  `/` = `%2F`, `?` = `%3F`, `%` = `%25`, space = `%20`).

### 5.1 Change the app login password (`APP_PASSWORD`)

1. Open `mokhtar-forms-web\.env.local`.
2. Change the line, for example `APP_PASSWORD="new-password-here"`.
   To switch the login off, leave it empty: `APP_PASSWORD=`.
3. Stop the app (Ctrl+C or close its window) and start it again.
4. Everyone is logged out and must use the new password.

If you forget it, open `.env.local`: the value is there in plain text. Anyone who can open that file
can read it, so keep the PC itself protected.

### 5.2 Change the password of the installed PostgreSQL 16

**If you know the current password** (PowerShell; it asks for the current password):

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h 127.0.0.1 -U postgres -c "ALTER USER postgres PASSWORD 'NEW_PASSWORD';"
```

Avoid `'` in the new password. In pgAdmin you can instead right-click
**Login/Group Roles > postgres > Properties > Definition**, type the new password and save.

**If you forgot it** (PowerShell **as administrator**):

1. Temporarily allow local logins without a password:

   ```powershell
   Copy-Item "C:\Program Files\PostgreSQL\16\data\pg_hba.conf" "C:\Program Files\PostgreSQL\16\data\pg_hba.conf.bak"
   (Get-Content "C:\Program Files\PostgreSQL\16\data\pg_hba.conf") -replace 'scram-sha-256','trust' | Set-Content "C:\Program Files\PostgreSQL\16\data\pg_hba.conf"
   Restart-Service postgresql-x64-16
   ```

2. Set the new password:

   ```powershell
   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h 127.0.0.1 -U postgres -c "ALTER USER postgres PASSWORD 'NEW_PASSWORD';"
   ```

3. **Turn password checking back on.** Do not skip this: until you do, anyone using this PC can log in
   as the database administrator.

   ```powershell
   Move-Item -Force "C:\Program Files\PostgreSQL\16\data\pg_hba.conf.bak" "C:\Program Files\PostgreSQL\16\data\pg_hba.conf"
   Restart-Service postgresql-x64-16
   ```

After either method, put the new password in `.env.local` and restart the app:

```
DATABASE_URL=postgres://postgres:NEW_PASSWORD@127.0.0.1:5432/mokhtar
```

### 5.3 Change the password of the development database

The development server is only for testing. The simplest choice is to leave its password alone.
To change it, the server has to be recreated, which **erases its data** (you can re-import afterwards):

1. Stop the app.
2. Stop the server and delete its data:

   ```powershell
   npm run db:dev -- stop
   Remove-Item -Recurse -Force .pgdata
   ```

3. Create it again with the new password, then reload the data:

   ```powershell
   $env:DEV_PGPASSWORD = "new-dev-password"
   npm run db:dev
   npm run db:setup
   npm run db:import -- "C:\Users\Administrator\Documents\Database SQLite\Saghbine.db"
   ```

4. Put the same password in `DATABASE_URL` in `.env.local` and start the app.

## 6. Back up and restore

```
npm run db:backup
```

creates `backups\mokhtar-<date>.sql` (works against PostgreSQL 16). To restore:

```
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d mokhtar -f backups\mokhtar-<date>.sql
```

## 7. Troubleshooting

| Message | Meaning / fix |
| --- | --- |
| `Cannot reach PostgreSQL` / `ECONNREFUSED` | The server is not running. Installed: start the service `postgresql-x64-16`. Development: `npm run db:dev`. |
| `password authentication failed` (`28P01`) | Wrong user or password in `DATABASE_URL`. |
| `database "mokhtar" does not exist` (`3D000`) | Run `npm run db:setup`. |
| `relation "persons" does not exist` (`42P01`) | Tables are missing: run `npm run db:setup`. |
| Works on this PC, not from another one | Steps 3.1 to 3.3 are missing (`pg_hba.conf`, firewall, restart). |
