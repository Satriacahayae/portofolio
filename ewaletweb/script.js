document.addEventListener("DOMContentLoaded", () => {
  /* =====================================================
     NYIMPEN DIGITAL WALLET
     Frontend Simulation
     ===================================================== */

  const STORAGE_KEY = "nyimpenWalletV2";

  /* =====================================================
     DEFAULT DATA
     ===================================================== */

  const defaultData = {
    balance: 2450000,

    transactions: [
      {
        id: 1,
        title: "Shopping",
        category: "Shopping",
        type: "expense",
        amount: 50000,
        icon: "🛒",
        date: "Today",
        time: "14:25",
      },
      {
        id: 2,
        title: "Internet",
        category: "Bills",
        type: "expense",
        amount: 150000,
        icon: "📱",
        date: "Yesterday",
        time: "19:10",
      },
      {
        id: 3,
        title: "Top Up",
        category: "Top Up",
        type: "income",
        amount: 500000,
        icon: "💰",
        date: "Yesterday",
        time: "10:30",
      },
      {
        id: 4,
        title: "Coffee Shop",
        category: "Food",
        type: "expense",
        amount: 35000,
        icon: "☕",
        date: "2 days ago",
        time: "16:20",
      },
      {
        id: 5,
        title: "Salary",
        category: "Income",
        type: "income",
        amount: 3000000,
        icon: "💼",
        date: "5 days ago",
        time: "09:00",
      },
    ],

    notifications: [
      {
        id: 1,
        title: "Welcome to NYIMPEN",
        message: "Your digital wallet is ready to use.",
        icon: "👋",
        unread: true,
      },
      {
        id: 2,
        title: "Transaction successful",
        message: "Your recent payment was completed.",
        icon: "✓",
        unread: true,
      },
      {
        id: 3,
        title: "Security reminder",
        message: "Never share your PIN with anyone.",
        icon: "🔐",
        unread: false,
      },
    ],

    profile: {
      name: "Satria",
      email: "satriacahya339@gmail.com",
      phone: "0882002191756",
    },

    settings: {
      darkMode: false,
      notifications: true,
    },
  };

  /* =====================================================
     LOAD DATA
     ===================================================== */

  let walletData;

  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    walletData = savedData ? JSON.parse(savedData) : structuredClone(defaultData);
  } catch (error) {
    console.warn("Failed to load NYIMPEN data:", error);
    walletData = structuredClone(defaultData);
  }

  /* =====================================================
     SAFETY CHECK
     ===================================================== */

  walletData.balance ??= defaultData.balance;
  walletData.transactions ??= [];
  walletData.notifications ??= [];
  walletData.profile ??= structuredClone(defaultData.profile);
  walletData.settings ??= structuredClone(defaultData.settings);

  /* =====================================================
     STATE
     ===================================================== */

  let balanceVisible = true;
  let showingAll = false;
  let currentFilter = "all";
  let currentSort = "latest";
  let currentSearch = "";

  /* =====================================================
     HELPER
     ===================================================== */

  const $ = (selector) => document.querySelector(selector);

  const $$ = (selector) => document.querySelectorAll(selector);

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(walletData));
    } catch (error) {
      console.warn("Failed to save NYIMPEN data:", error);
    }
  }

  function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  }

  function getCurrentTime() {
    const now = new Date();

    return {
      date: "Today",
      time: now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }

  function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
  }

  /* =====================================================
     ELEMENTS
     ===================================================== */

  const balanceElement = $("#balance");
  const totalIncomeElement = $("#totalIncome");
  const totalExpenseElement = $("#totalExpense");
  const transactionsList = $("#transactionsList");

  const toggleBalance = $("#toggleBalance");

  const topUpButton = $("#topUpButton");
  const transferButton = $("#transferButton");

  const viewAllButton = $("#viewAllButton");

  const topUpModal = $("#topUpModal");
  const transferModal = $("#transferModal");

  const closeTopUp = $("#closeTopUp");
  const closeTransfer = $("#closeTransfer");

  const topUpForm = $("#topUpForm");
  const transferForm = $("#transferForm");

  /* =====================================================
     BALANCE
     ===================================================== */

  function updateBalance() {
    if (!balanceElement) return;

    if (balanceVisible) {
      balanceElement.textContent = formatRupiah(walletData.balance);
    } else {
      balanceElement.textContent = "Rp •••••••";
    }
  }

  if (toggleBalance) {
    toggleBalance.addEventListener("click", () => {
      balanceVisible = !balanceVisible;

      toggleBalance.textContent = balanceVisible ? "👁" : "🙈";

      updateBalance();
    });
  }

  /* =====================================================
     SUMMARY
     ===================================================== */

  function calculateSummary() {
    let income = 0;
    let expense = 0;

    walletData.transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        income += Number(transaction.amount) || 0;
      } else {
        expense += Number(transaction.amount) || 0;
      }
    });

    return {
      income,
      expense,
    };
  }

  function updateSummary() {
    const summary = calculateSummary();

    if (totalIncomeElement) {
      totalIncomeElement.textContent = formatRupiah(summary.income);
    }

    if (totalExpenseElement) {
      totalExpenseElement.textContent = formatRupiah(summary.expense);
    }
  }

  /* =====================================================
     TRANSACTIONS
     ===================================================== */

  function getFilteredTransactions() {
    let data = [...walletData.transactions];

    /* FILTER */

    if (currentFilter === "income") {
      data = data.filter((transaction) => transaction.type === "income");
    }

    if (currentFilter === "expense") {
      data = data.filter((transaction) => transaction.type === "expense");
    }

    if (currentFilter === "topup") {
      data = data.filter((transaction) => transaction.category === "Top Up");
    }

    /* SEARCH */

    if (currentSearch) {
      const keyword = currentSearch.toLowerCase();

      data = data.filter((transaction) => {
        const title = transaction.title?.toLowerCase() || "";

        const category = transaction.category?.toLowerCase() || "";

        return title.includes(keyword) || category.includes(keyword);
      });
    }

    /* SORT */

    if (currentSort === "latest") {
      data.sort((a, b) => b.id - a.id);
    }

    if (currentSort === "highest") {
      data.sort((a, b) => Number(b.amount) - Number(a.amount));
    }

    if (currentSort === "lowest") {
      data.sort((a, b) => Number(a.amount) - Number(b.amount));
    }

    return data;
  }

  function renderTransactions() {
    if (!transactionsList) return;

    transactionsList.innerHTML = "";

    let transactions = getFilteredTransactions();

    if (!showingAll) {
      transactions = transactions.slice(0, 5);
    }

    if (transactions.length === 0) {
      transactionsList.innerHTML = `
        <div class="empty-transactions">

          <div class="empty-icon">
            ${currentSearch ? "🔎" : "📭"}
          </div>

          <strong>
            ${currentSearch ? "No results" : "No transactions found"}
          </strong>

          <span>
            ${currentSearch ? `No transaction matches "${escapeHTML(currentSearch)}".` : "Try another filter or make a transaction."}
          </span>

        </div>
      `;

      updateViewAllButton();
      return;
    }

    transactions.forEach((transaction) => {
      const item = document.createElement("div");

      item.className = "transaction";

      const sign = transaction.type === "income" ? "+" : "-";

      const amountClass = transaction.type === "income" ? "income-text" : "expense-text";

      item.innerHTML = `

          <div class="transaction-icon">
            ${transaction.icon || "💳"}
          </div>

          <div class="transaction-info">

            <strong>
              ${escapeHTML(transaction.title)}
            </strong>

            <span>
              ${escapeHTML(transaction.category)}
              ·
              ${escapeHTML(transaction.date)}
              ·
              ${escapeHTML(transaction.time)}
            </span>

          </div>

          <strong
            class="transaction-amount ${amountClass}">
            ${sign}
            ${formatRupiah(transaction.amount)}
          </strong>

          <button
            class="transaction-delete"
            data-id="${transaction.id}"
            title="Delete transaction"
            aria-label="Delete transaction">
            ×
          </button>

        `;

      transactionsList.appendChild(item);
    });

    attachDeleteButtons();

    updateViewAllButton();
  }

  function updateViewAllButton() {
    if (!viewAllButton) return;

    const total = getFilteredTransactions().length;

    if (total <= 5) {
      viewAllButton.style.display = "none";

      return;
    }

    viewAllButton.style.display = "inline-flex";

    viewAllButton.textContent = showingAll ? "Show Less" : "View All";
  }

  /* =====================================================
     DELETE TRANSACTION
     ===================================================== */

  function attachDeleteButtons() {
    $$(".transaction-delete").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();

        const id = Number(button.dataset.id);

        deleteTransaction(id);
      });
    });
  }

  function deleteTransaction(id) {
    const transaction = walletData.transactions.find((item) => item.id === id);

    if (!transaction) return;

    const confirmDelete = confirm(`Delete "${transaction.title}" transaction?`);

    if (!confirmDelete) return;

    if (transaction.type === "income") {
      walletData.balance -= Number(transaction.amount);
    } else {
      walletData.balance += Number(transaction.amount);
    }

    walletData.transactions = walletData.transactions.filter((item) => item.id !== id);

    saveData();

    updateApp();

    showToast("Transaction deleted", "success");
  }

  /* =====================================================
     VIEW ALL
     ===================================================== */

  if (viewAllButton) {
    viewAllButton.addEventListener("click", () => {
      showingAll = !showingAll;

      renderTransactions();
    });
  }

  /* =====================================================
     TOP UP MODAL
     ===================================================== */

  function openTopUpModal() {
    if (!topUpModal) return;

    topUpModal.classList.add("active");

    topUpModal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    setTimeout(() => {
      $("#topUpAmount")?.focus();
    }, 200);
  }

  function closeTopUpModal() {
    if (!topUpModal) return;

    topUpModal.classList.remove("active");

    topUpModal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
  }

  if (topUpButton) {
    topUpButton.addEventListener("click", openTopUpModal);
  }

  if (closeTopUp) {
    closeTopUp.addEventListener("click", closeTopUpModal);
  }

  /* =====================================================
     TOP UP FORM
     ===================================================== */

  if (topUpForm) {
    topUpForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const input = $("#topUpAmount");

      const amount = Number(input?.value);

      if (!amount || amount < 1000) {
        showToast("Minimum top up is Rp 1.000", "error");

        return;
      }

      if (amount > 100000000) {
        showToast("Maximum top up is Rp 100.000.000", "error");

        return;
      }

      const current = getCurrentTime();

      walletData.balance += amount;

      walletData.transactions.unshift({
        id: generateId(),
        title: "Top Up",
        category: "Top Up",
        type: "income",
        amount,
        icon: "💰",
        date: current.date,
        time: current.time,
      });

      walletData.notifications.unshift({
        id: generateId(),
        title: "Top Up successful",
        message: `${formatRupiah(amount)} has been added to your balance.`,
        icon: "💰",
        unread: true,
      });

      saveData();

      showingAll = false;

      updateApp();

      topUpForm.reset();

      closeTopUpModal();

      showToast(`${formatRupiah(amount)} added to your balance`, "success");
    });
  }

  /* =====================================================
     TRANSFER MODAL
     ===================================================== */

  function openTransferModal() {
    if (!transferModal) return;

    transferModal.classList.add("active");

    transferModal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    setTimeout(() => {
      $("#recipient")?.focus();
    }, 200);
  }

  function closeTransferModal() {
    if (!transferModal) return;

    transferModal.classList.remove("active");

    transferModal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
  }

  if (transferButton) {
    transferButton.addEventListener("click", openTransferModal);
  }

  if (closeTransfer) {
    closeTransfer.addEventListener("click", closeTransferModal);
  }

  /* =====================================================
     TRANSFER FORM
     ===================================================== */

  if (transferForm) {
    transferForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const recipient = $("#recipient")?.value.trim();

      const amount = Number($("#transferAmount")?.value);

      if (!recipient) {
        showToast("Please enter recipient name", "error");

        return;
      }

      if (!amount || amount < 1000) {
        showToast("Minimum transfer is Rp 1.000", "error");

        return;
      }

      if (amount > walletData.balance) {
        showToast("Insufficient balance", "error");

        return;
      }

      const current = getCurrentTime();

      walletData.balance -= amount;

      walletData.transactions.unshift({
        id: generateId(),
        title: `Transfer to ${recipient}`,
        category: "Transfer",
        type: "expense",
        amount,
        icon: "↗",
        date: current.date,
        time: current.time,
      });

      walletData.notifications.unshift({
        id: generateId(),
        title: "Transfer successful",
        message: `Transfer to ${recipient} was completed.`,
        icon: "↗",
        unread: true,
      });

      saveData();

      showingAll = false;

      updateApp();

      transferForm.reset();

      closeTransferModal();

      showToast(`Transfer to ${recipient} successful`, "success");
    });
  }

  /* =====================================================
     QUICK ACTIONS
     ===================================================== */

  const quickActions = $$(".quick-action, .quick-card");

  quickActions.forEach((card) => {
    card.addEventListener("click", () => {
      const action = card.dataset.action || card.querySelector("strong")?.textContent || card.textContent.trim();

      const normalized = action.toLowerCase();

      if (normalized.includes("top") || normalized.includes("top up")) {
        openTopUpModal();
        return;
      }

      if (normalized.includes("transfer")) {
        openTransferModal();
        return;
      }

      showToast(`${action} feature is coming soon`, "info");
    });
  });

  /* =====================================================
     TRANSACTION SEARCH
     ===================================================== */

  const searchInput = $(".transaction-search input") || $("#transactionSearch");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentSearch = searchInput.value.toLowerCase().trim();

      showingAll = true;

      renderTransactions();
    });
  }

  /* =====================================================
     FILTER
     ===================================================== */

  $$(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".filter-button").forEach((btn) => btn.classList.remove("active"));

      button.classList.add("active");

      currentFilter = button.dataset.filter || "all";

      showingAll = false;

      renderTransactions();
    });
  });

  /* =====================================================
     SORT
     ===================================================== */

  const sortSelect = $(".sort-select");

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      currentSort = sortSelect.value;

      renderTransactions();
    });
  }

  /* =====================================================
     ANALYTICS
     ===================================================== */

  function calculateCategoryExpenses() {
    const categories = {};

    walletData.transactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        const category = transaction.category || "Other";

        if (!categories[category]) {
          categories[category] = 0;
        }

        categories[category] += Number(transaction.amount) || 0;
      });

    return categories;
  }

  function renderCategoryAnalytics() {
    const categoryList = $(".category-list");

    if (!categoryList) return;

    const categories = calculateCategoryExpenses();

    const entries = Object.entries(categories);

    if (entries.length === 0) {
      categoryList.innerHTML = `
        <p style="color:var(--muted);font-size:10px;">
          No expense data yet.
        </p>
      `;

      return;
    }

    const total = entries.reduce((sum, [, value]) => sum + value, 0);

    categoryList.innerHTML = "";

    entries
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, amount]) => {
        const percentage = Math.round((amount / total) * 100);

        const item = document.createElement("div");

        item.className = "category-item";

        item.innerHTML = `

            <div class="category-info">

              <div class="category-name">
                <span>
                  ${escapeHTML(category)}
                </span>

                <span>
                  ${formatRupiah(amount)}
                </span>
              </div>

              <div class="category-progress">
                <span
                  style="width:${percentage}%">
                </span>
              </div>

            </div>

            <div class="category-percent">
              ${percentage}%
            </div>

          `;

        categoryList.appendChild(item);
      });
  }

  /* =====================================================
     MINI CHART
     ===================================================== */

  function renderMiniChart() {
    const chart = $(".mini-chart");

    if (!chart) return;

    const expenses = walletData.transactions
      .filter((transaction) => transaction.type === "expense")
      .slice(0, 7)
      .reverse();

    chart.innerHTML = "";

    if (expenses.length === 0) {
      chart.innerHTML = `
        <span style="
          color:var(--muted);
          font-size:9px;
          margin:auto;
        ">
          No expense data
        </span>
      `;

      return;
    }

    const max = Math.max(...expenses.map((transaction) => Number(transaction.amount)));

    expenses.forEach((transaction) => {
      const column = document.createElement("div");

      column.className = "chart-column";

      const height = Math.max(10, (transaction.amount / max) * 100);

      column.innerHTML = `

          <div
            class="chart-bar expense"
            style="height:${height}%"
            title="${formatRupiah(transaction.amount)}">
          </div>

          <span class="chart-label">
            ${escapeHTML(transaction.category.substring(0, 5))}
          </span>

        `;

      chart.appendChild(column);
    });
  }

  /* =====================================================
     VIRTUAL CARD
     ===================================================== */

  const virtualCard = $(".virtual-card");

  if (virtualCard) {
    virtualCard.addEventListener("click", () => {
      virtualCard.classList.toggle("flipped");
    });
  }

  /* =====================================================
     CARD NUMBER COPY
     ===================================================== */

  const cardNumber = $(".card-number");

  if (cardNumber) {
    cardNumber.addEventListener("click", async (event) => {
      event.stopPropagation();

      const text = cardNumber.textContent.trim();

      try {
        await navigator.clipboard.writeText(text);

        showToast("Card number copied", "success");
      } catch {
        showToast("Unable to copy card number", "error");
      }
    });
  }

  /* =====================================================
     NOTIFICATIONS
     ===================================================== */

  function renderNotifications() {
    const notificationList = $(".notification-list");

    if (!notificationList) return;

    notificationList.innerHTML = "";

    if (walletData.notifications.length === 0) {
      notificationList.innerHTML = `
        <div class="empty-transactions">
          <div class="empty-icon">
            🔔
          </div>

          <strong>
            No notifications
          </strong>

          <span>
            You're all caught up.
          </span>
        </div>
      `;

      return;
    }

    walletData.notifications.forEach((notification) => {
      const item = document.createElement("div");

      item.className = "notification-item";

      if (notification.unread) {
        item.classList.add("unread");
      }

      item.innerHTML = `

          <div class="notification-icon">
            ${notification.icon}
          </div>

          <div class="notification-content">

            <strong>
              ${escapeHTML(notification.title)}
            </strong>

            <p>
              ${escapeHTML(notification.message)}
            </p>

            <small>
              ${notification.unread ? "New notification" : "Read"}
            </small>

          </div>

          ${notification.unread ? `<span class="unread-dot"></span>` : ""}

        `;

      item.addEventListener("click", () => {
        notification.unread = false;

        saveData();

        renderNotifications();

        updateNotificationBadge();
      });

      notificationList.appendChild(item);
    });
  }

  /* =====================================================
     NOTIFICATION BADGE
     ===================================================== */

  function updateNotificationBadge() {
    const unread = walletData.notifications.filter((item) => item.unread).length;

    const badges = $$(".notification-badge");

    badges.forEach((badge) => {
      badge.textContent = unread > 9 ? "9+" : unread;

      badge.style.display = unread > 0 ? "flex" : "none";
    });
  }

  /* =====================================================
     PROFILE
     ===================================================== */

  function renderProfile() {
    const nameElements = $$(".profile-name, .profile-mini-name");

    nameElements.forEach((element) => {
      element.textContent = walletData.profile.name;
    });

    const emailElements = $$(".profile-email");

    emailElements.forEach((element) => {
      element.textContent = walletData.profile.email;
    });

    const phoneElements = $$(".profile-phone");

    phoneElements.forEach((element) => {
      element.textContent = walletData.profile.phone;
    });
  }

  /* =====================================================
     PROFILE EDIT
     ===================================================== */

  $$(".profile-edit, [data-action='edit-profile']").forEach((button) => {
    button.addEventListener("click", () => {
      const name = prompt("Enter your name:", walletData.profile.name);

      if (!name || !name.trim()) {
        return;
      }

      walletData.profile.name = name.trim();

      saveData();

      renderProfile();

      showToast("Profile updated", "success");
    });
  });

  /* =====================================================
     DARK MODE
     ===================================================== */

  function applyTheme() {
    const isDark = Boolean(walletData.settings.darkMode);

    document.body.classList.toggle("dark-mode", isDark);

    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

    updateThemeButtons();
  }

  function updateThemeButtons() {
    const themeButtons = $$("[data-theme-toggle], .theme-toggle");

    themeButtons.forEach((button) => {
      const isDark = walletData.settings.darkMode;

      button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");

      if (button.dataset.themeToggle !== undefined) {
        const icon = button.querySelector(".theme-icon");

        if (icon) {
          icon.textContent = isDark ? "☀️" : "🌙";
        }
      }
    });
  }

  const themeButtons = $$("[data-theme-toggle], .theme-toggle");

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      walletData.settings.darkMode = !walletData.settings.darkMode;

      saveData();

      applyTheme();

      showToast(walletData.settings.darkMode ? "Dark mode enabled" : "Light mode enabled", "info");
    });
  });

  /* =====================================================
     NAVIGATION
     ===================================================== */

  const navLinks = $$(".nav-link");

  const pages = $$(".page");

  function activatePage(target, clickedLink = null) {
    if (!target) return;

    let targetSelector = target;

    if (!target.startsWith("#")) {
      targetSelector = `#${target}`;
    }

    const targetPage = document.querySelector(targetSelector);

    if (!targetPage) {
      console.warn(`NYIMPEN: Page ${targetSelector} not found.`);

      return;
    }

    navLinks.forEach((item) => item.classList.remove("active"));

    if (clickedLink) {
      clickedLink.classList.add("active");
    }

    pages.forEach((page) => page.classList.remove("active"));

    targetPage.classList.add("active");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const target = link.dataset.page || link.getAttribute("href");

      activatePage(target, link);
    });
  });

  /* =====================================================
     MOBILE NAVIGATION
     ===================================================== */

  const mobileMenu = $(".mobile-menu");

  const sidebar = $(".sidebar");

  if (mobileMenu && sidebar) {
    mobileMenu.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  $$(".mobile-nav-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const target = link.dataset.page || link.getAttribute("href");

      activatePage(target, link);

      sidebar?.classList.remove("open");
    });
  });

  /* =====================================================
     MODAL OUTSIDE CLICK
     ===================================================== */

  [topUpModal, transferModal].forEach((modal) => {
    if (!modal) return;

    modal.addEventListener("click", (event) => {
      if (event.target !== modal) {
        return;
      }

      if (modal === topUpModal) {
        closeTopUpModal();
      }

      if (modal === transferModal) {
        closeTransferModal();
      }
    });
  });

  /* =====================================================
     ESCAPE KEY
     ===================================================== */

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    closeTopUpModal();

    closeTransferModal();

    sidebar?.classList.remove("open");
  });

  /* =====================================================
     TOAST
     ===================================================== */

  function showToast(message, type = "info") {
    const existing = $(".nyimpen-toast");

    if (existing) {
      existing.remove();
    }

    const toast = document.createElement("div");

    toast.className = `nyimpen-toast ${type}`;

    let icon = "💡";

    if (type === "success") {
      icon = "✓";
    }

    if (type === "error") {
      icon = "⚠";
    }

    toast.innerHTML = `

      <div class="toast-icon">
        ${icon}
      </div>

      <span>
        ${escapeHTML(message)}
      </span>

    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");

      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  /* =====================================================
     TOAST + EXTRA COMPONENT CSS
     ===================================================== */

  const toastStyle = document.createElement("style");

  toastStyle.textContent = `

    .nyimpen-toast {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 99999;

      display: flex;
      align-items: center;
      gap: 10px;

      max-width: 360px;

      padding: 13px 16px;

      background: white;
      color: #171827;

      border: 1px solid #e9eaf1;
      border-radius: 14px;

      box-shadow:
        0 20px 50px rgba(0,0,0,.15);

      font-size: 13px;
      font-weight: 600;

      opacity: 0;

      transform:
        translateY(15px)
        scale(.97);

      transition:
        .3s ease;
    }

    .nyimpen-toast.show {
      opacity: 1;

      transform:
        translateY(0)
        scale(1);
    }

    .nyimpen-toast .toast-icon {
      width: 30px;
      height: 30px;

      display: flex;
      align-items: center;
      justify-content: center;

      border-radius: 9px;

      flex-shrink: 0;

      font-weight: 800;
    }

    .nyimpen-toast.success
    .toast-icon {
      color: #19b889;
      background: #e6faf4;
    }

    .nyimpen-toast.error
    .toast-icon {
      color: #f45d87;
      background: #fff0f4;
    }

    .nyimpen-toast.info
    .toast-icon {
      color: #7457ff;
      background: #eeeaff;
    }

    .transaction-delete {
      width: 28px;
      height: 28px;

      border: 0;
      background: transparent;

      color: #aaa;

      cursor: pointer;

      border-radius: 8px;

      font-size: 18px;

      opacity: 0;

      transition: .2s ease;

      flex-shrink: 0;
    }

    .transaction:hover
    .transaction-delete {
      opacity: 1;
    }

    .transaction-delete:hover {
      background: #fff0f4;
      color: #f45d87;
    }

    .virtual-card {
      cursor: pointer;

      transition:
        transform .5s ease;
    }

    .virtual-card.flipped {
      transform:
        rotateY(180deg);
    }

    @media (max-width: 600px) {

      .nyimpen-toast {
        left: 15px;
        right: 15px;
        bottom: 82px;
        max-width: none;
      }

      .transaction-delete {
        opacity: 1;
      }

    }

  `;

  document.head.appendChild(toastStyle);

  /* =====================================================
     GLOBAL UPDATE
     ===================================================== */

  function updateApp() {
    updateBalance();

    updateSummary();

    renderTransactions();

    renderCategoryAnalytics();

    renderMiniChart();

    renderNotifications();

    updateNotificationBadge();

    renderProfile();

    applyTheme();
  }

  /* =====================================================
     INITIALIZE
     ===================================================== */

  updateApp();

  console.log("NYIMPEN v2 initialized successfully 🚀");
});
