# ExpenseFlow — Expense Tracker Management System

A responsive, frontend-only expense tracker built with HTML5, CSS3, JavaScript and Chart.js, based on the uploaded Expense Tracker Management System project report.

## Features
- Demo login for `admin`, `staff`, and `student` (password: `1234`)
- Dashboard: total expenses, this month's expenses, total income and average expense
- Category-wise doughnut chart and last-six-month bar chart
- Add, edit, delete, search and filter income/expense transactions
- Per-demo-user transaction separation using browser `localStorage`
- Responsive dark/glassmorphism interface
- INR currency formatting

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a modern browser. For best results, use VS Code with the Live Server extension.
3. Sign in with `admin` / `1234`.

Chart.js and Google Fonts load from CDNs, so an internet connection is needed for those assets. Transaction data is saved in the current browser and is not synced to other devices.

## Important security note
This is an academic demo. The usernames and passwords are hardcoded in client-side JavaScript, so this is **not production-grade authentication**. Do not use it to store sensitive financial records. A production version should use a secure backend and server-side authentication.

## Deploy to GitHub Pages
1. Create a GitHub repository and upload `index.html`, `style.css`, `script.js`, and `README.md` to its root.
2. In the repository, open **Settings → Pages**.
3. Choose the branch and root folder, then save.
4. Open the published URL once deployment completes.
