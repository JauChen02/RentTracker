# 🏠 Rent Ledger

A free, offline rent tracking app for homeowners and landlords. No accounts, no subscriptions, no cloud, no internet required after setup — just download three files, run a setup script, and you're ready to go.

Track which weeks each tenant has paid, spot overdue payments instantly, and keep a full payment history for as long as the tenancy runs.

---

## Features

- **Multiple tenants** — add as many tenants as you need, each tracked independently
- **Custom start dates** — each tenant's weeks are counted from their own tenancy start date, not from January 1st
- **Exact date ranges** — every row shows the precise dates it covers (e.g. `15 Mar → 21 Mar`), no ambiguity
- **Colour-coded at a glance**
  - 🟩 Green — rent paid for that week
  - 🔴 Red — overdue (past weeks with no payment recorded)
  - ⬛ Dark — upcoming weeks not yet due
  - 🟡 Amber outline — the current week
- **Week numbers** — each row shows the week number counted from that tenant's individual start date (Week 1, Week 2, etc.)
- **Financial summary** — tracks weekly rent amount, total collected, and total outstanding per tenant
- **Year navigation** — browse forward and backward through years to view full payment history
- **Runs entirely offline** — no internet needed after first open, no data ever leaves your computer
- **Instant setup** — one double-click to install the desktop shortcut with the app icon already applied

---

## Files in this repository

| File | Description |
|---|---|
| `RentLedger.html` | The app itself — open this in any browser |
| `RentLedger.ico` | App icon used for the desktop shortcut |
| `CreateShortcut.vbs` | One-click setup script that creates a desktop shortcut with the icon pre-applied |

---

## Installation

### Step 1 — Download all three files

Click each file in this repository and hit the **Download** button:

- `RentLedger.html`
- `RentLedger.ico`
- `CreateShortcut.vbs`

### Step 2 — Create a folder and move the files into it

1. Open **File Explorer**
2. Navigate to `Documents`
3. Create a new folder called `RentLedger`
4. Move all three downloaded files into that folder

Your folder should look exactly like this:

```
Documents/
└── RentLedger/
    ├── RentLedger.html
    ├── RentLedger.ico
    └── CreateShortcut.vbs
```

> ⚠️ **Do not move this folder after setup.** The desktop shortcut points directly to it — moving or renaming it will break the shortcut.

### Step 3 — Run the setup script

Double-click `CreateShortcut.vbs` inside the `RentLedger` folder.

A confirmation pop-up will appear when it's done. You will now have a **Rent Ledger** shortcut on your desktop with the correct icon — ready to launch any time.

---

## Using the app

Double-click the **Rent Ledger** shortcut on your desktop. The app opens in your default browser. No loading, no login, no internet needed.

### Adding a tenant

1. Click **+ Add Tenant**
2. Enter the tenant's name
3. Set the **tenancy start date** — this is the date Week 1 begins from
4. Optionally add a unit or property name and a weekly rent amount
5. Click **Add Tenant**

Weeks will be generated automatically from that date forward, each covering exactly 7 days.

### Marking rent as paid

Click any week row to toggle it between paid and unpaid. The row turns green immediately. Everything saves automatically — there is no save button.

### Switching between tenants

Click any tenant name in the left sidebar to switch to their view.

### Navigating years

Use the year arrows in the top right to move between years and view older payment history.

---

## Your data

All data is saved automatically to your browser's local storage. It is stored **on your computer only** — nothing is uploaded, synced, or shared anywhere.

Your data persists between sessions. Closing the browser or shutting down your computer will not erase it.

### ⚠️ Backing up your data

Data lives in your browser, so it **will be erased** if you ever clear your browser's cache or site data. Protect yourself with one of these methods:

**Option A — Quick save (recommended)**

1. Open the app in your browser
2. Press `Ctrl + S`
3. Save the page back into your `Documents\RentLedger\` folder, overwriting `RentLedger.html`

Your tenant data gets embedded into the saved file. Even if your browser storage is wiped, you can open the saved file and your history will still be there.

**Option B — Copy the whole folder**

Periodically copy the entire `Documents\RentLedger\` folder to an external drive or a cloud storage folder (OneDrive, Google Drive, etc.) as a full backup.

---

## Switching browsers or computers

Data is tied to the browser and machine you use. If you switch browsers or move to a new PC, your history will not carry over automatically. Use **Option A** above (Ctrl + S) before switching to preserve everything.

---

## Requirements

- Windows PC
- A modern browser: Chrome, Edge, or Firefox
- No installation, no Python, no Node.js, no admin rights needed

---

## Troubleshooting

**The shortcut icon still shows the browser logo**
Run `CreateShortcut.vbs` again. If it still doesn't update, right-click the shortcut → Properties → Change Icon → browse to `RentLedger.ico` in your `Documents\RentLedger\` folder → OK.

**The app opened but all my tenants are gone**
Your browser's local storage was likely cleared. Restore from a backup (see above). Going forward, use Ctrl + S periodically to save backups.

**The shortcut stopped working after I moved files**
The `Documents\RentLedger\` folder was moved or renamed. Move it back to its original location, or delete the shortcut and run `CreateShortcut.vbs` again from the new location.

---

## License

Free to use and modify for personal use.
