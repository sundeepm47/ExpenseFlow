(() => {
  "use strict";
  const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Education", "Health", "Others"];
  const CATEGORY_ICONS = { Food: "🍜", Transport: "🚕", Shopping: "🛍️", Entertainment: "🎬", Education: "📚", Health: "💊", Others: "✦", Salary: "💼", Freelance: "💻", Investment: "📈", Gift: "🎁" };
  const COLORS = ["#9c8cff", "#4ad8c5", "#ffb86b", "#ff7e9f", "#76a8ff", "#65d99f", "#9aa8c5"];
  const USERS = { admin: "1234", staff: "1234", student: "1234" };
  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
  const dateFormat = (date) => date ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const escapeHTML = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  let currentUser = null, categoryChart = null, trendChart = null, pendingDeleteId = null, toastTimer = null;

  function storageKey(user = currentUser) { return `expenseflow_transactions_${user}`; }
  function readTransactions() {
    try { const value = JSON.parse(localStorage.getItem(storageKey()) || "[]"); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }
  function saveTransactions(items) { localStorage.setItem(storageKey(), JSON.stringify(items)); }
  function toast(message, isError = false) {
    const node = $("toast"); node.textContent = message;
    node.style.borderColor = isError ? "#ff718566" : "#4ad8c566";
    node.style.color = isError ? "#ffd8df" : "#dffbf4";
    node.classList.add("show"); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 2600);
  }
  function setLoggedIn(user) {
    currentUser = user; localStorage.setItem("expenseflow_session", user);
    $("loginView").classList.add("hidden"); $("appView").classList.remove("hidden");
    $("userName").textContent = user[0].toUpperCase() + user.slice(1);
    $("avatar").textContent = user[0].toUpperCase();
    $("todayLabel").textContent = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    $("date").value = todayISO();
    renderAll();
  }
  function logout() {
    localStorage.removeItem("expenseflow_session"); currentUser = null;
    $("appView").classList.add("hidden"); $("loginView").classList.remove("hidden");
    $("password").value = ""; navigate("dashboard"); toast("You have been logged out.");
  }
  function navigate(page) {
    const pages = { dashboard: "dashboardPage", transactions: "transactionsPage", add: "addPage" };
    Object.values(pages).forEach(id => $(id).classList.add("hidden"));
    $(pages[page] || pages.dashboard).classList.remove("hidden");
    document.querySelectorAll(".nav-item[data-page]").forEach(btn => btn.classList.toggle("active", btn.dataset.page === page));
    $("pageName").textContent = ({dashboard:"Dashboard",transactions:"Transactions",add:$("editId").value ? "Edit transaction" : "Add transaction"})[page] || "Dashboard";
    $("sidebar").classList.remove("open");
    if (page === "dashboard") renderDashboard();
    if (page === "transactions") renderTransactions();
    if (page === "add") renderRecent($("addRecentTransactions"), 5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function fillCategorySelects() {
    $("category").innerHTML = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join("");
    $("categoryFilter").innerHTML = `<option value="all">All categories</option>` + CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join("");
  }
  function iconFor(t) { return CATEGORY_ICONS[t.category] || (t.type === "income" ? "↗" : "✦"); }
  function transactionRow(t, includeCategory = true) {
    const amountClass = t.type === "income" ? "income" : "expense";
    const sign = t.type === "income" ? "+" : "−";
    const sub = `${t.type === "income" ? "Income" : "Expense"}${t.note ? " · " + escapeHTML(t.note) : ""}`;
    return `<div class="transaction-row">
      <div class="transaction-main"><div class="category-icon">${iconFor(t)}</div><div style="min-width:0"><div class="transaction-title" title="${escapeHTML(t.title)}">${escapeHTML(t.title)}</div><div class="transaction-sub">${sub}</div></div></div>
      ${includeCategory ? `<div class="transaction-category">${escapeHTML(t.category)}</div>` : ""}
      <div class="transaction-date">${dateFormat(t.date)}</div>
      <div class="amount ${amountClass}">${sign}${money(t.amount)}</div>
      <div class="row-actions"><button class="icon-btn" title="Edit transaction" aria-label="Edit ${escapeHTML(t.title)}" data-edit="${t.id}">✎</button><button class="icon-btn" title="Delete transaction" aria-label="Delete ${escapeHTML(t.title)}" data-delete="${t.id}">×</button></div>
    </div>`;
  }
  function renderRecent(container, limit = 5) {
    const items = readTransactions().sort((a,b) => (b.date || "").localeCompare(a.date || "") || b.id-a.id).slice(0,limit);
    container.innerHTML = items.length ? items.map(t => transactionRow(t, false)).join("") : `<div class="empty-inline">No transactions yet. Add your first transaction to get started.</div>`;
  }
  function renderDashboard() {
    const items = readTransactions();
    const expenses = items.filter(t => t.type === "expense");
    const income = items.filter(t => t.type === "income");
    const now = new Date(), month = now.getMonth(), year = now.getFullYear();
    const monthExpenses = expenses.filter(t => { const d = new Date(t.date + "T00:00:00"); return d.getMonth() === month && d.getFullYear() === year; });
    const total = expenses.reduce((s,t) => s + Number(t.amount), 0);
    const monthTotal = monthExpenses.reduce((s,t) => s + Number(t.amount), 0);
    const totalIncome = income.reduce((s,t) => s + Number(t.amount), 0);
    $("totalSpend").textContent = money(total); $("monthSpend").textContent = money(monthTotal);
    $("totalIncome").textContent = money(totalIncome); $("averageSpend").textContent = money(expenses.length ? total/expenses.length : 0);
    $("monthCaption").textContent = now.toLocaleDateString("en-IN", {month:"long",year:"numeric"}) + " spending";
    $("chartCenter").innerHTML = `<strong>${money(total)}</strong><span>Total spend</span>`;
    renderCategoryChart(expenses); renderTrendChart(expenses); renderRecent($("recentTransactions"), 5);
  }
  function renderCategoryChart(expenses) {
    const sums = CATEGORIES.map(c => expenses.filter(t => t.category === c).reduce((s,t) => s + Number(t.amount), 0));
    const ctx = $("categoryChart").getContext("2d");
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(ctx, { type:"doughnut", data:{ labels:CATEGORIES, datasets:[{data:sums,backgroundColor:COLORS,borderColor:"#141d30",borderWidth:4,hoverOffset:5}] }, options:{ responsive:true, maintainAspectRatio:false, cutout:"74%", plugins:{legend:{display:false},tooltip:{callbacks:{label:(c)=>`${c.label}: ${money(c.raw)}`}}} } });
    $("categoryLegend").innerHTML = CATEGORIES.map((c,i) => `<span class="legend-item"><i class="legend-dot" style="background:${COLORS[i]}"></i>${c}</span>`).join("");
  }
  function renderTrendChart(expenses) {
    const labels = [], values = [], now = new Date();
    for (let offset=5; offset>=0; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth()-offset, 1);
      labels.push(d.toLocaleDateString("en-IN",{month:"short"}));
      values.push(expenses.filter(t => { const td = new Date(t.date+"T00:00:00"); return td.getMonth()===d.getMonth() && td.getFullYear()===d.getFullYear(); }).reduce((s,t)=>s+Number(t.amount),0));
    }
    if (trendChart) trendChart.destroy();
    trendChart = new Chart($("trendChart").getContext("2d"), { type:"bar", data:{labels,datasets:[{label:"Expenses",data:values,backgroundColor:labels.map((_,i)=>i===5?"#9c8cff":"#4ad8c566"),borderRadius:7,borderSkipped:false,maxBarThickness:32}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>money(c.raw)}}},scales:{x:{grid:{display:false},ticks:{color:"#8390ac",font:{family:"DM Sans",size:10}},border:{display:false}},y:{beginAtZero:true,grid:{color:"rgba(158,177,220,.09)"},ticks:{color:"#8390ac",font:{family:"DM Sans",size:10},callback:v=>v>=1000?`₹${v/1000}k`:`₹${v}`},border:{display:false}}}} });
  }
  function renderTransactions() {
    const query = $("searchInput").value.trim().toLowerCase(), type = $("typeFilter").value, category = $("categoryFilter").value;
    const items = readTransactions().filter(t => (type==="all" || t.type===type) && (category==="all" || t.category===category) && (!query || `${t.title} ${t.category} ${t.note||""}`.toLowerCase().includes(query))).sort((a,b)=>(b.date||"").localeCompare(a.date||"")||b.id-a.id);
    $("allTransactions").innerHTML = items.map(t=>transactionRow(t,true)).join("");
    $("emptyTransactions").classList.toggle("hidden", items.length > 0);
  }
  function renderAll() { renderDashboard(); renderTransactions(); renderRecent($("addRecentTransactions"),5); }
  function resetForm() {
    $("transactionForm").reset(); $("editId").value = ""; $("transactionType").value = "expense";
    document.querySelectorAll(".type-option").forEach(b => b.classList.toggle("selected", b.dataset.type === "expense"));
    $("date").value = todayISO(); $("formHeading").textContent = "Add transaction"; $("saveTransaction").innerHTML = 'Save transaction <span>→</span>';
    $("cancelEdit").classList.add("hidden"); $("pageName").textContent = "Add transaction";
  }
  function startEdit(id) {
    const t = readTransactions().find(x => String(x.id) === String(id)); if (!t) return;
    $("editId").value = t.id; $("title").value = t.title; $("amount").value = t.amount; $("category").value = t.category;
    $("date").value = t.date; $("note").value = t.note || ""; $("transactionType").value = t.type;
    document.querySelectorAll(".type-option").forEach(b => b.classList.toggle("selected", b.dataset.type === t.type));
    $("formHeading").textContent = "Edit transaction"; $("saveTransaction").innerHTML = 'Update transaction <span>→</span>';
    $("cancelEdit").classList.remove("hidden"); navigate("add");
  }
  function deleteTransaction(id) {
    pendingDeleteId = id; const dialog = $("deleteDialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else if (confirm("Delete this transaction?")) doDelete();
  }
  function doDelete() {
    if (pendingDeleteId == null) return;
    saveTransactions(readTransactions().filter(t => String(t.id) !== String(pendingDeleteId)));
    pendingDeleteId = null; $("deleteDialog").close?.(); renderAll(); toast("Transaction deleted.");
  }
  $("loginForm").addEventListener("submit", e => {
    e.preventDefault(); const username = $("username").value.trim().toLowerCase(), password = $("password").value;
    if (USERS[username] === password) { setLoggedIn(username); toast(`Welcome back, ${username}!`); }
    else toast("Invalid username or password. Try a demo account.", true);
  });
  $("logoutBtn").addEventListener("click", logout);
  document.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => navigate(b.dataset.page)));
  document.addEventListener("click", e => {
    const goto = e.target.closest("[data-goto]"); if (goto) { resetFormIfNeeded(goto.dataset.goto); navigate(goto.dataset.goto); }
    const edit = e.target.closest("[data-edit]"); if (edit) startEdit(edit.dataset.edit);
    const del = e.target.closest("[data-delete]"); if (del) deleteTransaction(del.dataset.delete);
  });
  function resetFormIfNeeded(page) { if (page === "add" && !$("editId").value) resetForm(); }
  $("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));
  $("searchInput").addEventListener("input", renderTransactions);
  $("typeFilter").addEventListener("change", renderTransactions);
  $("categoryFilter").addEventListener("change", renderTransactions);
  document.querySelectorAll(".type-option").forEach(b => b.addEventListener("click", () => {
    $("transactionType").value = b.dataset.type;
    document.querySelectorAll(".type-option").forEach(x => x.classList.toggle("selected", x === b));
    const opts = b.dataset.type === "income" ? ["Salary","Freelance","Investment","Gift","Others"] : CATEGORIES;
    const previous = $("category").value;
    $("category").innerHTML = opts.map(c=>`<option value="${c}">${c}</option>`).join("");
    if (opts.includes(previous)) $("category").value = previous;
  }));
  $("transactionForm").addEventListener("submit", e => {
    e.preventDefault();
    const title = $("title").value.trim(), amount = Number($("amount").value), category = $("category").value, date = $("date").value, type = $("transactionType").value, note = $("note").value.trim();
    if (!title || !Number.isFinite(amount) || amount <= 0 || !date || !category) { toast("Please complete all required fields correctly.", true); return; }
    const items = readTransactions(), editId = $("editId").value;
    if (editId) {
      const index = items.findIndex(t => String(t.id) === String(editId));
      if (index >= 0) items[index] = {...items[index], title, amount, category, date, type, note};
      toast("Transaction updated successfully.");
    } else {
      items.push({id:Date.now(),title,amount,category,date,type,note});
      toast(`${type === "income" ? "Income" : "Expense"} added successfully.`);
    }
    saveTransactions(items); resetForm(); renderAll(); navigate("add");
  });
  $("cancelEdit").addEventListener("click", () => { resetForm(); navigate("add"); });
  $("keepTransaction").addEventListener("click", () => { pendingDeleteId = null; $("deleteDialog").close(); });
  $("confirmDelete").addEventListener("click", doDelete);
  fillCategorySelects();
  const session = localStorage.getItem("expenseflow_session");
  if (session && USERS[session]) setLoggedIn(session);
})();