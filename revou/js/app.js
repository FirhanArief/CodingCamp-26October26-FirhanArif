/* ============================================================
   FinFlow — Expense & Budget Visualizer
   Vanilla JavaScript (ES6+) · Local Storage · Chart.js
   RevoU Software Engineering Mini Project
   ============================================================ */

(() => {
  "use strict";

  /* ---------- Storage Keys & Backward Migration ---------- */
  const STORAGE = {
    transactions: "finflow_transactions",
    budgets: "finflow_monthly_budget",
    savings: "finflow_monthly_savings",
    theme: "finflow_theme",
    sort: "finflow_sort",
  };

  const LEGACY_STORAGE = {
    transactions: "budgetly.transactions",
    budgets: "budgetly.monthlyBudget",
    savings: "budgetly.monthlySavings",
    theme: "budgetly.theme",
    sort: "budgetly.sort",
  };

  const CATEGORIES = ["Food", "Transport", "Fun"];
  const CATEGORY_COLOR = {
    Food: "#f59e0b",      // Amber Gold
    Transport: "#06b6d4", // Cyan
    Fun: "#ec4899",       // Pink / Fuchsia
  };

  const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  let transactions = [];
  let chart = null;
  let toastTimer = null;

  /* ---------- Cache DOM Elements ---------- */
  const $ = (id) => document.getElementById(id);

  const els = {
    // Input Form
    form: $("transactionForm"),
    itemType: $("itemType"),
    itemName: $("itemName"),
    itemAmount: $("itemAmount"),
    itemCategory: $("itemCategory"),
    nameError: $("itemNameError"),
    amountError: $("itemAmountError"),
    categoryError: $("itemCategoryError"),

    // KPI Summary
    totalBalance: $("totalBalance"),
    totalIncome: $("totalIncome"),
    totalExpense: $("totalExpense"),

    // Monthly Budget Limit
    budgetLimit: $("budgetLimit"),
    budgetBar: $("budgetBar"),
    budgetNote: $("budgetNote"),
    budgetBadge: $("budgetBadge"),
    budgetMonthSub: $("budgetMonthSub"),

    // Savings Target
    savingsTarget: $("savingsTarget"),
    savingsBar: $("savingsBar"),
    savingsNote: $("savingsNote"),
    savingsBadge: $("savingsBadge"),
    savingsMonthSub: $("savingsMonthSub"),

    // Transaction List
    transactionList: $("transactionList"),
    listEmpty: $("listEmpty"),
    sortSelect: $("sortSelect"),
    txTotalCount: $("txTotalCount"),

    // Chart & Breakdown
    chartCanvas: $("categoryChart"),
    chartEmpty: $("chartEmpty"),
    sumFood: $("sumFood"),
    sumTransport: $("sumTransport"),
    sumFun: $("sumFun"),

    // Header & Mobile Controls
    themeToggle: $("themeToggle"),
    headerDateText: $("headerDateText"),
    periodMonthLabel: $("periodMonthLabel"),
    formPanel: $("formPanel"),
    formToggleHeader: $("formToggleHeader"),
    formCollapseBtn: $("formCollapseBtn"),
    formCollapseText: $("formCollapseText"),
  };

  /* ---------- Helpers ---------- */
  const todayKey = () => new Date().toISOString().slice(0, 7); // YYYY-MM

  const formatRupiah = (num) => {
    const negative = num < 0;
    const abs = Math.abs(Math.round(num));
    const formatted = abs.toLocaleString("id-ID");
    return (negative ? "-Rp " : "Rp ") + formatted;
  };

  const escapeHTML = (str) =>
    String(str).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));

  const uid = () =>
    "ff_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);

  const showToast = (message) => {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    void toast.offsetWidth; // Force reflow
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  };

  /* ---------- Storage Management (With Legacy Fallback) ---------- */
  const safeParse = (value, fallback) => {
    try {
      const parsed = JSON.parse(value);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch {
      return fallback;
    }
  };

  const getStoredValue = (key, legacyKey) => {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
    const legacyVal = localStorage.getItem(legacyKey);
    if (legacyVal !== null) {
      localStorage.setItem(key, legacyVal); // Migrate to new key
      return legacyVal;
    }
    return null;
  };

  const loadTransactions = () => {
    const raw = getStoredValue(STORAGE.transactions, LEGACY_STORAGE.transactions);
    transactions = safeParse(raw, []);
    transactions = transactions.filter(
      (t) => t && typeof t.id === "string" && typeof t.name === "string" && typeof t.category === "string"
    );
  };

  const saveTransactions = () =>
    localStorage.setItem(STORAGE.transactions, JSON.stringify(transactions));

  const loadBudget = () =>
    String(getStoredValue(STORAGE.budgets, LEGACY_STORAGE.budgets) || "");

  const saveBudget = () =>
    localStorage.setItem(STORAGE.budgets, String(els.budgetLimit ? els.budgetLimit.value : ""));

  const loadSavings = () =>
    String(getStoredValue(STORAGE.savings, LEGACY_STORAGE.savings) || "");

  const saveSavings = () =>
    localStorage.setItem(STORAGE.savings, String(els.savingsTarget ? els.savingsTarget.value : ""));

  const loadSort = () =>
    getStoredValue(STORAGE.sort, LEGACY_STORAGE.sort) || "date-desc";

  const saveSort = () =>
    localStorage.setItem(STORAGE.sort, els.sortSelect ? els.sortSelect.value : "date-desc");

  /* ---------- Dynamic Dates & Subtitles ---------- */
  const updateDynamicDates = () => {
    const now = new Date();
    const dayName = DAY_NAMES[now.getDay()];
    const dateNum = now.getDate();
    const monthName = MONTH_NAMES[now.getMonth()];
    const year = now.getFullYear();

    if (els.headerDateText) {
      els.headerDateText.textContent = `${dayName}, ${dateNum} ${monthName} ${year}`;
    }
    if (els.periodMonthLabel) {
      els.periodMonthLabel.textContent = `${monthName} ${year}`;
    }
    if (els.budgetMonthSub) {
      els.budgetMonthSub.textContent = `Batas pengeluaran ${monthName}`;
    }
    if (els.savingsMonthSub) {
      els.savingsMonthSub.textContent = `Target tabungan ${monthName}`;
    }
  };

  /* ---------- Calculations ---------- */
  const thisMonthExpense = (list) =>
    list
      .filter((t) => t.type !== "income" && (t.created || "").slice(0, 7) === todayKey())
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const thisMonthIncome = (list) =>
    list
      .filter((t) => t.type === "income" && (t.created || "").slice(0, 7) === todayKey())
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const budgetLimitValue = () => Number(els.budgetLimit ? els.budgetLimit.value : 0) || 0;
  const savingsTargetValue = () => Number(els.savingsTarget ? els.savingsTarget.value : 0) || 0;

  /* ---------- Theme Management ---------- */
  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    if (chart) updateChartColors();
  };

  const initTheme = () => {
    let saved = getStoredValue(STORAGE.theme, LEGACY_STORAGE.theme);
    if (!saved) {
      saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    applyTheme(saved);
  };

  const toggleTheme = () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE.theme, next);
    applyTheme(next);
  };

  /* ---------- Sorting Logic ---------- */
  const getSorted = () => {
    if (!els.sortSelect) return [...transactions];
    const mode = els.sortSelect.value;
    const list = [...transactions];
    const byName = (a, b) => a.name.localeCompare(b.name, "id");
    const byAmount = (a, b) => Number(a.amount) - Number(b.amount);
    const byDate = (a, b) => new Date(a.created || 0) - new Date(b.created || 0);

    switch (mode) {
      case "date-asc":     return list.sort(byDate);
      case "date-desc":    return list.sort((a, b) => byDate(b, a));
      case "amount-desc":  return list.sort((a, b) => byAmount(b, a));
      case "amount-asc":   return list.sort(byAmount);
      case "category":     return list.sort((a, b) => a.category.localeCompare(b.category, "id") || byName(a, b));
      default:             return list;
    }
  };

  /* ---------- Render Functions ---------- */
  const renderSummary = () => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const expense = transactions
      .filter((t) => t.type !== "income")
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const balance = income - expense;

    if (els.totalBalance) els.totalBalance.textContent = formatRupiah(balance);
    if (els.totalIncome) els.totalIncome.textContent = formatRupiah(income);
    if (els.totalExpense) els.totalExpense.textContent = formatRupiah(expense);
  };

  const renderBudget = () => {
    if (!els.budgetBar || !els.budgetNote) return;
    const limit = budgetLimitValue();
    const spent = thisMonthExpense(transactions);
    const month = MONTH_NAMES[new Date().getMonth()];

    if (!limit || limit <= 0) {
      els.budgetBar.style.width = "0%";
      els.budgetBar.classList.remove("over");
      els.budgetNote.textContent = "Belum ada batas ditetapkan.";
      els.budgetNote.classList.remove("warn");
      if (els.budgetBadge) els.budgetBadge.hidden = true;
      els.budgetBar.parentElement.setAttribute("aria-valuenow", "0");
      return;
    }

    const pct = Math.min(Math.round((spent / limit) * 100), 100);
    const over = spent > limit;

    els.budgetBar.style.width = Math.max(pct, spent > 0 ? 3 : 0) + "%";
    els.budgetBar.classList.toggle("over", over);
    els.budgetBar.parentElement.setAttribute("aria-valuenow", String(pct));

    if (over) {
      els.budgetNote.textContent =
        `Pengeluaran ${month} melebihi limit: ${formatRupiah(spent)} / ${formatRupiah(limit)} (+${formatRupiah(spent - limit)})`;
      els.budgetNote.classList.add("warn");
      if (els.budgetBadge) els.budgetBadge.hidden = false;
    } else {
      const remaining = limit - spent;
      els.budgetNote.textContent =
        `${month}: ${formatRupiah(spent)} / ${formatRupiah(limit)} — sisa ${formatRupiah(remaining)}`;
      els.budgetNote.classList.remove("warn");
      if (els.budgetBadge) els.budgetBadge.hidden = true;
    }
  };

  const renderSavings = () => {
    if (!els.savingsBar || !els.savingsNote) return;
    const target = savingsTargetValue();
    const income = thisMonthIncome(transactions);
    const spent = thisMonthExpense(transactions);
    const netSaved = income - spent;
    const saved = Math.max(0, netSaved);
    const month = MONTH_NAMES[new Date().getMonth()];

    if (!target || target <= 0) {
      els.savingsBar.style.width = "0%";
      els.savingsBar.classList.remove("achieved");
      els.savingsNote.textContent = "Belum ada target ditetapkan.";
      els.savingsNote.classList.remove("success");
      if (els.savingsBadge) els.savingsBadge.hidden = true;
      els.savingsBar.parentElement.setAttribute("aria-valuenow", "0");
      return;
    }

    const pct = Math.min(Math.round((saved / target) * 100), 100);
    const actualPct = Math.round((saved / target) * 100);
    const achieved = saved >= target && saved > 0;

    els.savingsBar.style.width = Math.max(pct, saved > 0 ? 3 : 0) + "%";
    els.savingsBar.classList.toggle("achieved", achieved);
    els.savingsBar.parentElement.setAttribute("aria-valuenow", String(pct));

    if (achieved) {
      const surplus = saved - target;
      els.savingsNote.textContent =
        `Target ${month} tercapai! ${formatRupiah(saved)} / ${formatRupiah(target)} (${actualPct}%)` +
        (surplus > 0 ? ` (+${formatRupiah(surplus)})` : " 🎉");
      els.savingsNote.classList.add("success");
      if (els.savingsBadge) els.savingsBadge.hidden = false;
    } else if (income > 0 && netSaved <= 0) {
      els.savingsNote.textContent =
        `Pengeluaran melebihi pemasukan bulan ini. Tabungan: ${formatRupiah(0)} / ${formatRupiah(target)}.`;
      els.savingsNote.classList.remove("success");
      if (els.savingsBadge) els.savingsBadge.hidden = true;
    } else if (income === 0) {
      els.savingsNote.textContent =
        `Belum ada pemasukan bulan ini. Catat pemasukan (Income) untuk mulai menabung.`;
      els.savingsNote.classList.remove("success");
      if (els.savingsBadge) els.savingsBadge.hidden = true;
    } else {
      const remaining = target - saved;
      els.savingsNote.textContent =
        `${month}: ${formatRupiah(saved)} / ${formatRupiah(target)} (${actualPct}%) — sisa ${formatRupiah(remaining)} lagi`;
      els.savingsNote.classList.remove("success");
      if (els.savingsBadge) els.savingsBadge.hidden = true;
    }
  };

  const renderTransactions = () => {
    if (!els.transactionList) return;
    const sorted = getSorted();
    const limit = budgetLimitValue();

    if (els.txTotalCount) {
      els.txTotalCount.textContent = `${sorted.length} Transaksi`;
    }

    // Cumulative calculation for chronological over-limit detection
    const chrono = [...transactions].sort(
      (a, b) => new Date(a.created || 0) - new Date(b.created || 0)
    );
    let cum = 0;
    const cumAt = new Map();
    for (const t of chrono) {
      if (t.type === "income") continue;
      cum += Number(t.amount) || 0;
      cumAt.set(t.id, cum);
    }

    els.transactionList.innerHTML = "";
    if (els.listEmpty) {
      els.listEmpty.hidden = sorted.length > 0;
    }

    for (const t of sorted) {
      const isIncome = t.type === "income";
      const amount = Number(t.amount) || 0;
      const isInCurrentMonth = (t.created || "").slice(0, 7) === todayKey();
      const totalAtTime = cumAt.get(t.id) || 0;
      const overLimit = !isIncome && limit > 0 && isInCurrentMonth && totalAtTime > limit;

      const li = document.createElement("div");
      li.className = "tx-item" + (overLimit ? " over-limit" : "");
      li.setAttribute("role", "listitem");

      const dateObj = t.created ? new Date(t.created) : null;
      const dateText = dateObj
        ? `${dateObj.getDate()} ${MONTH_NAMES[dateObj.getMonth()].slice(0, 3)} ${dateObj.getFullYear()}`
        : "Tanpa tanggal";

      const dotColor = isIncome
        ? "var(--income)"
        : (CATEGORY_COLOR[t.category] || "var(--brand-primary)");

      li.innerHTML = `
        <span class="tx-dot" style="background:${dotColor}" aria-hidden="true"></span>
        <span class="tx-main">
          <span class="tx-name"></span>
          <span class="tx-sub">
            <span class="tx-cat"></span> · ${escapeHTML(dateText)}
          </span>
        </span>
        <span class="tx-amount${isIncome ? " income" : ""}"></span>
        <button type="button" class="tx-delete" data-id="${t.id}"
                aria-label="Hapus transaksi ${t.name}" title="Hapus Transaksi">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;

      li.querySelector(".tx-name").textContent = t.name;
      li.querySelector(".tx-cat").textContent = t.category;
      li.querySelector(".tx-amount").textContent = isIncome
        ? "+" + formatRupiah(amount)
        : "-" + formatRupiah(amount);

      els.transactionList.appendChild(li);
    }
  };

  /* ---------- Chart.js Visualizer ---------- */
  const expenseByCategory = () => {
    const totals = { Food: 0, Transport: 0, Fun: 0 };
    for (const t of transactions) {
      if (t.type !== "income" && t.category in totals) {
        totals[t.category] += Number(t.amount) || 0;
      }
    }
    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ category: k, total: v }));
  };

  const activeThemeIsDark = () =>
    document.documentElement.getAttribute("data-theme") === "dark";

  const updateChartColors = () => {
    if (!chart) return;
    const dark = activeThemeIsDark();
    chart.options.plugins.legend.labels.color = dark ? "#94a3b8" : "#475569";
    chart.options.plugins.tooltip.backgroundColor = dark ? "rgba(19, 31, 36, 0.95)" : "rgba(255, 255, 255, 0.96)";
    chart.options.plugins.tooltip.titleColor = dark ? "#f8fafc" : "#0f172a";
    chart.options.plugins.tooltip.bodyColor = dark ? "#cbd5e1" : "#334155";
    chart.options.plugins.tooltip.borderColor = dark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.3)";
    chart.data.datasets[0].borderColor = dark ? "#131f24" : "#ffffff";
    chart.update("none");
  };

  const renderChart = () => {
    const data = expenseByCategory();
    const isEmpty = data.length === 0;

    // Update live breakdown amounts
    const totals = { Food: 0, Transport: 0, Fun: 0 };
    for (const t of transactions) {
      if (t.type !== "income" && t.category in totals) {
        totals[t.category] += Number(t.amount) || 0;
      }
    }
    if (els.sumFood) els.sumFood.textContent = formatRupiah(totals.Food);
    if (els.sumTransport) els.sumTransport.textContent = formatRupiah(totals.Transport);
    if (els.sumFun) els.sumFun.textContent = formatRupiah(totals.Fun);

    if (els.chartEmpty) {
      els.chartEmpty.hidden = !isEmpty;
    }

    const labels = data.map((d) => d.category);
    const values = data.map((d) => d.total);
    const colors = labels.map(
      (c) => CATEGORY_COLOR[c] || "#10b981"
    );

    if (!chart) {
      if (typeof Chart === "undefined" || !els.chartCanvas) return;
      const dark = activeThemeIsDark();
      chart = new Chart(els.chartCanvas, {
        type: "doughnut",
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderColor: dark ? "#131f24" : "#ffffff",
            borderWidth: 3,
            hoverOffset: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "64%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: dark ? "#94a3b8" : "#475569",
                boxWidth: 10,
                boxHeight: 10,
                usePointStyle: true,
                padding: 14,
                font: { family: "Outfit, Inter, sans-serif", size: 12, weight: 600 },
              },
            },
            tooltip: {
              backgroundColor: dark ? "rgba(19, 31, 36, 0.95)" : "rgba(255, 255, 255, 0.96)",
              titleColor: dark ? "#f8fafc" : "#0f172a",
              bodyColor: dark ? "#cbd5e1" : "#334155",
              borderColor: dark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.3)",
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              boxPadding: 4,
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = total ? Math.round((ctx.parsed / total) * 100) : 0;
                  return ` ${ctx.label}: ${formatRupiah(ctx.parsed)} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    } else {
      chart.data.labels = labels;
      chart.data.datasets[0].data = values;
      chart.data.datasets[0].backgroundColor = colors;
      chart.update();
    }
  };

  const renderAll = () => {
    renderSummary();
    renderBudget();
    renderSavings();
    renderTransactions();
    renderChart();
  };

  /* ---------- Form Validation ---------- */
  const setError = (input, errorEl, message) => {
    if (!input || !errorEl) return;
    if (message) {
      input.classList.add("invalid");
      errorEl.textContent = message;
      errorEl.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", errorEl.id);
    } else {
      input.classList.remove("invalid");
      errorEl.textContent = "";
      errorEl.hidden = true;
      input.removeAttribute("aria-invalid");
    }
  };

  const validateInputs = () => {
    let valid = true;

    // Item Name
    const name = els.itemName.value.trim();
    if (!name) {
      setError(els.itemName, els.nameError, "Nama item wajib diisi.");
      valid = false;
    } else if (name.length < 2) {
      setError(els.itemName, els.nameError, "Nama minimal 2 karakter.");
      valid = false;
    } else {
      setError(els.itemName, els.nameError, "");
    }

    // Amount
    const amountRaw = els.itemAmount.value.trim();
    const amount = Number(amountRaw);
    if (!amountRaw) {
      setError(els.itemAmount, els.amountError, "Nominal wajib diisi.");
      valid = false;
    } else if (!Number.isFinite(amount) || amount <= 0) {
      setError(els.itemAmount, els.amountError, "Nominal harus angka lebih besar dari 0.");
      valid = false;
    } else if (amount > 1e12) {
      setError(els.itemAmount, els.amountError, "Nominal melebihi batas sistem.");
      valid = false;
    } else {
      setError(els.itemAmount, els.amountError, "");
    }

    // Type
    const type = els.itemType.value === "income" ? "income" : "expense";

    // Category
    const category = els.itemCategory.value;
    if (!category || !CATEGORIES.includes(category)) {
      setError(els.itemCategory, els.categoryError, "Silakan pilih salah satu kategori.");
      valid = false;
    } else {
      setError(els.itemCategory, els.categoryError, "");
    }

    if (!valid) {
      const firstInvalid = document.querySelector(".form-expand-body .invalid");
      if (firstInvalid) firstInvalid.focus();
    } else {
      els.nameError.hidden = true;
      els.amountError.hidden = true;
      els.categoryError.hidden = true;
    }

    return { valid, name, amount, category, type };
  };

  const clearForm = () => {
    els.itemName.value = "";
    els.itemAmount.value = "";
    els.itemType.value = "expense";
    els.itemCategory.selectedIndex = 0;
    setError(els.itemName, els.nameError, "");
    setError(els.itemAmount, els.amountError, "");
    setError(els.itemCategory, els.categoryError, "");
    els.itemName.focus();
  };

  /* ---------- Event Handlers ---------- */
  const handleSubmit = (event) => {
    event.preventDefault();
    const { valid, name, amount, category, type } = validateInputs();
    if (!valid) return;

    transactions.push({
      id: uid(),
      name: name.trim(),
      amount: Number(amount),
      category,
      type,
      created: new Date().toISOString(),
    });

    saveTransactions();
    renderAll();
    clearForm();

    const limit = budgetLimitValue();
    const spent = thisMonthExpense(transactions);
    if (limit > 0 && spent > limit && type !== "income") {
      showToast(`Tersimpan, tetapi pengeluaran bulan ini melebihi limit!`);
    } else {
      showToast(`"${name.trim()}" berhasil disimpan`);
    }

    // On mobile screens: collapse form after submit so transaction list is visible
    if (isMobile()) {
      setFormPanelOpen(false);
    }
  };

  const handleDelete = (event) => {
    const button = event.target.closest(".tx-delete");
    if (!button) return;
    const id = button.getAttribute("data-id");
    const tx = transactions.find((t) => t.id === id);
    transactions = transactions.filter((t) => t.id !== id);
    saveTransactions();
    renderAll();
    showToast(`${tx ? `"${tx.name}"` : "Transaksi"} berhasil dihapus`);
  };

  const handleSortChange = () => {
    saveSort();
    renderTransactions();
  };

  const handleBudget = () => {
    saveBudget();
    renderBudget();
    renderTransactions();
  };

  const handleSavings = () => {
    saveSavings();
    renderSavings();
  };

  /* ---------- Mobile Collapsible Panel Logic ---------- */
  const isMobile = () => window.innerWidth <= 840;

  const setFormPanelOpen = (open) => {
    if (!els.formPanel) return;
    if (!isMobile()) {
      els.formPanel.classList.remove("is-collapsed");
      if (els.formToggleHeader) els.formToggleHeader.setAttribute("aria-expanded", "true");
      return;
    }
    els.formPanel.classList.toggle("is-collapsed", !open);
    if (els.formToggleHeader) els.formToggleHeader.setAttribute("aria-expanded", open ? "true" : "false");
    if (els.formCollapseText) els.formCollapseText.textContent = open ? "Tutup Form" : "Buka Form";
  };

  const initMobileCollapsible = () => {
    if (!els.formPanel || !els.formToggleHeader) return;

    els.formToggleHeader.addEventListener("click", () => {
      if (!isMobile()) return;
      const isClosed = els.formPanel.classList.contains("is-collapsed");
      setFormPanelOpen(isClosed);
    });

    if (els.formCollapseBtn) {
      els.formCollapseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isClosed = els.formPanel.classList.contains("is-collapsed");
        setFormPanelOpen(isClosed);
      });
    }

    const checkInitial = () => {
      if (isMobile()) {
        setFormPanelOpen(false);
      } else {
        els.formPanel.classList.remove("is-collapsed");
        if (els.formToggleHeader) els.formToggleHeader.setAttribute("aria-expanded", "true");
      }
    };

    window.addEventListener("resize", checkInitial);
    checkInitial();
  };

  /* ---------- Initialization ---------- */
  const init = () => {
    initTheme();
    updateDynamicDates();
    initMobileCollapsible();

    if (els.themeToggle) els.themeToggle.addEventListener("click", toggleTheme);
    if (els.form) els.form.addEventListener("submit", handleSubmit);
    if (els.transactionList) els.transactionList.addEventListener("click", handleDelete);
    if (els.sortSelect) els.sortSelect.addEventListener("change", handleSortChange);
    if (els.budgetLimit) els.budgetLimit.addEventListener("input", handleBudget);
    if (els.savingsTarget) els.savingsTarget.addEventListener("input", handleSavings);

    for (const [input, error] of [
      [els.itemName, els.nameError],
      [els.itemAmount, els.amountError],
      [els.itemCategory, els.categoryError],
    ]) {
      if (input && error) {
        input.addEventListener("input", () => {
          if (input.classList.contains("invalid")) setError(input, error, "");
        });
      }
    }

    if (els.sortSelect) els.sortSelect.value = loadSort();
    if (els.budgetLimit) els.budgetLimit.value = loadBudget();
    if (els.savingsTarget) els.savingsTarget.value = loadSavings();

    loadTransactions();
    renderAll();

    // Listen for OS color scheme changes if user hasn't explicitly set a preference
    if (window.matchMedia) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const onSystemChange = () => {
        if (!localStorage.getItem(STORAGE.theme) && !localStorage.getItem(LEGACY_STORAGE.theme)) {
          applyTheme(media.matches ? "dark" : "light");
        }
      };
      if (media.addEventListener) media.addEventListener("change", onSystemChange);
      else if (media.addListener) media.addListener(onSystemChange);
    }
  };

  const boot = () => {
    init();
    if (typeof Chart === "undefined") {
      const retry = setInterval(() => {
        if (typeof Chart !== "undefined") {
          clearInterval(retry);
          renderChart();
        }
      }, 100);
      setTimeout(() => clearInterval(retry), 8000);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
