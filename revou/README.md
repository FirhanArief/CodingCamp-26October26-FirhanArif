# FinFlow — Expense & Budget Visualizer

A modern, high-performance **Expense & Budget Visualizer** dashboard built strictly with **Vanilla HTML5, CSS3, and JavaScript (ES6+)** without any external UI frameworks or backend dependencies. Visualizations are rendered via **Chart.js** and user data is automatically persisted in browser **LocalStorage**.

Crafted for the **RevoU Software Engineering Mini Project** in compliance with the AWS Builder ID submission requirements and Kiro workflow specification.

---

## ✨ Features & Functional Compliance

### Core Requirements (100% Complete)
- **Input Form**: Record daily transactions with *Tipe* (Expense / Income), *Kategori* (`Food`, `Transport`, `Fun`), *Nama Item*, and *Nominal*. Complete form validation prevents empty or invalid entries with intuitive error messages.
- **Scrollable Transaction List**: Chronological activity feed showing transaction name, category badge, date, formatted Rupiah amounts, and instant delete capability.
- **Dynamic Balance Calculation**: Real-time KPI summary recalculating Total Saldo, Total Pemasukan, and Total Pengeluaran immediately upon adding or removing transactions.
- **Visual Category Chart**: Interactive spending distribution rendered using Chart.js with responsive sizing and live category totals.

### Optional Bonus Challenges
- 🌓 **Adaptive Dark / Light Mode**: Seamless theme switcher detecting system preference by default, with smooth CSS variable transitions and persistent state.
- ⇅ **Smart Sort Filter**: Instantly sort records by newest (*Terbaru*), oldest (*Terlama*), highest amount, lowest amount, or alphabetically by category.
- ⚠ **Monthly Budget Limit & Over-Limit Warning**: Set monthly budget caps; transactions that push spending over the limit are automatically flagged with warning highlights and visual badges.
- 🎯 **Target Tabungan Bulanan (Savings Goal)**: Interactive savings tracker computing net monthly savings with animated progress bar and celebration badge upon target completion.

### Modern UX & Responsive Design
- **Fintech Emerald & Cyan Glassmorphism**: Sleek dark and light interfaces with deep glass blur, vibrant gradients, and accessible contrast ratios.
- **Collapsible Mobile Form**: Automatically collapses the entry form on mobile screens after submission so users immediately see their updated transaction feed.
- **Live Dynamic Timestamps**: Automatically updates Indonesian day, date, and month badges in real-time.

---

## 🗂 Project Structure

Adheres strictly to the RevoU technical folder constraints:

```
├── index.html                   # Semantic HTML5 Structure & Meta
├── css/
│   └── style.css                # Pure Vanilla CSS Design System & Theme Variables
├── js/
│   └── app.js                   # Pure Vanilla JavaScript & Chart.js Integration
├── .kiro/                       # Required RevoU / Kiro submission metadata
│   ├── constraints.md           # Verbatim Technical Constraints
│   └── specs/
│       └── expense-budget-visualizer/
│           └── spec.md          # Project Specification & Prompt
└── README.md                    # Documentation & Setup Guide
```

---

## 🚀 How to Run

1. Clone or download this repository.
2. Open `index.html` directly in any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
3. Alternatively, host with **GitHub Pages** by navigating to repository **Settings > Pages > Branch: main**.

---

## 💾 Local Storage Schema

| Storage Key | Type | Description |
|---|---|---|
| `finflow_transactions` | Array of Objects | Stored transaction records with ID, name, amount, category, type, and timestamp |
| `finflow_monthly_budget` | String / Number | Monthly spending limit cap |
| `finflow_monthly_savings`| String / Number | Monthly savings target |
| `finflow_theme` | String (`dark` \| `light`) | User's preferred color theme |
| `finflow_sort` | String | Active sorting filter mode |

*(Includes automatic backward-compatibility migration for previous sessions).*

---

## 🌐 Browser Compatibility

Tested and optimized for:
- Google Chrome & Chromium-based browsers (Desktop & Mobile)
- Mozilla Firefox
- Microsoft Edge
- Apple Safari (macOS & iOS)
