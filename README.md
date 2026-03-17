# 🏠 Rent Ledger

A simple, offline rent tracking app for homeowners and landlords. No accounts, no subscriptions, no internet required — just download one file and run it.

Track which weeks each tenant has paid, spot overdue payments at a glance, and keep a full history going back as far as you need.

---

## What it does

- Add multiple tenants, each with their own tenancy start date
- Weeks are counted from each tenant's individual start date — not from January 1st
- Every week shows its exact date range (e.g. `15 Mar → 21 Mar`)
- Colour-coded rows: **green** = paid, **red** = overdue, **amber outline** = current week
- Tracks weekly rent amount and calculates total collected vs outstanding
- Navigate between years to see full payment history
- All data saved automatically on your computer — nothing leaves your machine

---

## How to install

### Step 1 — Download the file

Click on `RentLedger.html` in this repository, then click the **Download** button (top right of the file view).

### Step 2 — Save it somewhere permanent

Create a dedicated folder so you don't accidentally move or delete it:

1. Open **File Explorer**
2. Go to `Documents`
3. Create a new folder called `RentLedger`
4. Move the downloaded `RentLedger.html` file into that folder

Your path should look like:
```
C:\Users\YourName\Documents\RentLedger\RentLedger.html
```

### Step 3 — Create a desktop shortcut

1. Open the `Documents\RentLedger\` folder in File Explorer
2. Right-click `RentLedger.html`
3. Select **Send to → Desktop (create shortcut)**

You'll now have a **Rent Ledger** shortcut on your desktop. Double-click it any time to open the app in your browser — no internet needed.

---

## Your data

- All tenant and payment data is saved automatically in your browser's local storage
- Data is stored **on your computer only** — it is never uploaded or shared anywhere
- Your data persists between sessions; closing the browser does not erase it
- Data is tied to the browser you use — if you switch browsers, you'll start fresh in the new one

### ⚠️ Important — backing up your data

Because data is stored in your browser, it **will be lost** if you clear your browser's cache or site data. To protect yourself:

1. Regularly export a backup by opening the app, pressing `Ctrl + S` in your browser, and saving the page to your `Documents\RentLedger\` folder (overwriting the existing file is fine — your data is embedded in the saved page)
2. Alternatively, copy the `Documents\RentLedger\` folder to an external drive or cloud storage periodically

---

## Requirements

- A modern web browser (Chrome, Edge, Firefox, or Safari)
- No installation, no Python, no Node.js, nothing else required

---

## License

Free to use and modify for personal use.
