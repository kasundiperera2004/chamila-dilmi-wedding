# Chamila & Dilmi Wedding Invitation

React/Vite frontend with a Node backend for RSVP submissions and an admin panel.

## Project Paths

- `frontend/` - invitation website and admin panel
- `backend/` - RSVP API and Google Sheets storage

## Run Locally

```bash
npm install
npm run dev
```

- Website: `http://127.0.0.1:5173/`
- Admin panel: `http://127.0.0.1:5173/admin`
- API: `http://127.0.0.1:5174/`

## Google Sheets Setup

1. Create a Google Sheet with a tab named `RSVPs`.
2. Add this header row in row 1:

```text
Created At | Name | Phone | Guests | Attending | Message
```

3. In Google Cloud, create a service account and enable the Google Sheets API.
4. Create a JSON key for the service account.
5. Share the Google Sheet with the service account email as an Editor.
6. Copy `.env.example` to `.env` and fill these values:

```bash
ADMIN_PASSCODE=chamila-dilmi
GOOGLE_SHEET_ID=your-google-sheet-id
GOOGLE_SHEET_NAME=RSVPs
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

The `GOOGLE_SHEET_ID` is the long ID in the Google Sheet URL.

## Scripts

```bash
npm run dev      # frontend + backend
npm run dev:frontend # frontend only
npm run api      # backend
npm run build    # production frontend build
npm run start    # backend serving dist
npm run lint     # lint checks
```
