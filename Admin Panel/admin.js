/* Daily Operations UI — state is isolated behind storage helpers for easy API replacement. */
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];

const store = {
  get: (k, f) => {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? f;
    } catch {
      return f;
    }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};
const money = (n) =>
  `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const cap = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const today = new Date().toISOString().slice(0, 10);

const icons = {
  Bread: "ri-restaurant-2-line",
  Cake: "ri-cake-3-line",
  Cookies: "ri-cookie-line",
  Pastry: "ri-cake-2-line",
  Donuts: "ri-donut-chart-line",
  Brownies: "ri-cake-3-line",
  Muffins: "ri-cake-2-line",
  "Pizza Base": "ri-pie-chart-line",
  Croissant: "ri-restaurant-line",
  Cupcakes: "ri-cake-3-line",
};
let state = {
    inventory: [],
    orders: [],
    deliveries: [],
    sales: [],
    customers: [],
  },
  charts = {};
let inventoryPage = 1,
  ordersPage = 1,
  invSortAsc = true,
  confirmFn = null;

function seed() {
  if (store.get("bakerySeeded", false)) return;

  const products = [
    ["Sourdough Loaf", "Bread", 84, 3.5],
    ["Chocolate Fudge Cake", "Cake", 7, 24],
    ["Butter Cookies", "Cookies", 126, 6.5],
    ["Almond Danish", "Pastry", 21, 4.2],
    ["Classic Glazed Donuts", "Donuts", 0, 2.8],
    ["Walnut Brownies", "Brownies", 42, 3.8],
    ["Blueberry Muffins", "Muffins", 18, 3.2],
    ["Artisan Pizza Base", "Pizza Base", 51, 4],
    ["French Croissant", "Croissant", 63, 2.9],
    ["Vanilla Cupcakes", "Cupcakes", 31, 3.5],
  ];

  state.inventory = products.map((p, i) => ({
    id: `PRD-${String(i + 101).padStart(3, "0")}`,
    name: p[0],
    category: p[1],
    stock: p[2],
    price: p[3],
  }));

  const names = [
    "Ava Thompson",
    "Noah Williams",
    "Olivia Brown",
    "Liam Wilson",
    "Emma Davies",
    "Arjun Mehta",
    "Mia Taylor",
    "Ethan Clark",
  ];

  const picks = [[0, 2], [1], [3, 8], [2, 9], [5, 6], [7], [0, 4], [1, 2]];

  const statuses = [
    "Pending",
    "Confirmed",
    "Delivered",
    "Pending",
    "Cancelled",
    "Confirmed",
    "Delivered",
    "Pending",
  ];

  state.orders = names.map((name, i) => {
    let ps = picks[i].map((x) => state.inventory[x]),
      qty = (i % 3) + 1,
      amount = ps.reduce((a, p) => a + p.price, 0) * qty;
    return {
      id: `ORD-${2401 + i}`,
      customer: name,
      phone: `+44 7700 900${10 + i}`,
      products: ps.map((p) => p.name),
      quantity: qty,
      amount: +amount.toFixed(2),
      payment: i === 3 ? "Pending" : "Paid",
      status: statuses[i],
      date: i < 5 ? today : "2026-07-25",
    };
  });
  state.deliveries = state.orders.slice(0, 6).map((o, i) => ({
    id: `DLV-${6001 + i}`,
    vendor: i % 2 ? "Crumbly Central" : "Northside Kitchen",
    customer: o.customer,
    driver: ["James Cole", "Aisha Khan", "Mateo Silva", "Priya Shah"][i % 4],
    order: o.id,
    status: [
      "Packed",
      "Out For Delivery",
      "Delivered",
      "Pending",
      "Cancelled",
      "Delivered",
    ][i],
    eta: i === 2 ? "Delivered" : `${25 + i * 7} mins`,
  }));
  state.sales = state.orders.map((o, i) => ({
    id: `INV-${8801 + i}`,
    customer: o.customer,
    items: o.products.join(", "),
    amount: o.amount,
    date: o.date,
    payment: i === 3 ? "Card" : "Online",
    status: o.payment === "Paid" ? "Paid" : "Pending",
  }));
  state.customers = names.map((n, i) => ({
    name: n,
    phone: `+44 7700 900${10 + i}`,
    orders: (i % 4) + 1,
    value: 40 + i * 29,
    last: i < 5 ? "Today" : "Yesterday",
  }));
  save();
  store.set("bakerySeeded", true);
}
function save() {
  Object.entries(state).forEach(([k, v]) => store.set(`bakery_${k}`, v));
}
function loadLocalStorage() {
  seed();
  Object.keys(state).forEach((k) => (state[k] = store.get(`bakery_${k}`, [])));
}
function saveLocalStorage() {
  save();
}
function statusFor(stock) {
  return stock === 0 ? "Out of Stock" : stock < 20 ? "Low Stock" : "Available";
}
function badge(status) {
  return `<span class="badge ${status.toLowerCase().replaceAll(" ", "-")}">${status}</span>`;
}
function showToast(message, icon = "ri-checkbox-circle-line") {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<i class="${icon}"></i>${message}`;
  $("#toastStack").append(el);
  setTimeout(() => el.remove(), 3300);
}
function animateNumber(el, end, prefix = "", dec = 0) {
  let start = 0,
    t0 = null,
    d = 650;
  function frame(t) {
    t0 ??= t;
    let p = Math.min((t - t0) / d, 1),
      v = start + (end - start) * (1 - Math.pow(1 - p, 3));
    el.textContent =
      prefix + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString());
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
function updateDashboardCards() {
  const inv = state.inventory,
    orders = state.orders,
    ds = state.deliveries;

  const totals = [
    ["ri-stack-line", inv.reduce((a, x) => a + x.stock, 0), "Total stock"],
    [
      "ri-shopping-bag-3-line",
      orders.filter((x) => x.date === today).length,
      "Today's orders",
    ],
    [
      "ri-checkbox-circle-line",
      inv.filter((x) => x.stock > 0).reduce((a, x) => a + x.stock, 0),
      "Available stock",
    ],
    [
      "ri-truck-line",
      ds.filter((x) => x.status === "Delivered").length,
      "Delivered stock",
    ],
    [
      "ri-time-line",
      ds.filter((x) => !["Delivered", "Cancelled"].includes(x.status)).length,
      "Undelivered stock",
    ],
    ["ri-money-pound-circle-line", calculateSales(), "Today's sales", "£", 2],
    [
      "ri-user-heart-line",
      orders.filter((x) => x.status !== "Cancelled").length,
      "Customer orders",
    ],
  ];
  $("#statsGrid").innerHTML = totals
    .map(
      (x, i) =>
        `<article class="stat-card"><div class="stat-top"><span class="stat-icon"><i class="${x[0]}"></i></span><span class="trend">↗ ${5 + i}%</span></div><h2 data-value="${x[1]}" data-prefix="${x[3] || ""}" data-dec="${x[4] || 0}">0</h2><p>${x[2]}</p></article>`,
    )
    .join("");
  $$(".stat-card h2").forEach((e) =>
    animateNumber(e, +e.dataset.value, e.dataset.prefix, +e.dataset.dec),
  );
}
function calculateSales() {
  return +state.sales
    .filter((x) => x.date === today && x.status === "Paid")
    .reduce((a, x) => a + x.amount, 0)
    .toFixed(2);
}
function renderInventory() {
  const q = $("#inventorySearch").value.toLowerCase(),
    f = $("#inventoryFilter").value;
  let rows = state.inventory.filter(
    (x) =>
      (!q || `${x.id} ${x.name} ${x.category}`.toLowerCase().includes(q)) &&
      (f === "all" || statusFor(x.stock) === f),
  );
  const per = 6,
    total = Math.max(1, Math.ceil(rows.length / per));
  inventoryPage = Math.min(inventoryPage, total);
  rows = rows.slice((inventoryPage - 1) * per, inventoryPage * per);
  $("#inventoryBody").innerHTML =
    rows
      .map(
        (x) =>
          `<tr><td><b>${x.id}</b></td><td>
        <div class="prod-cell"><span class="product-avatar">
        <i class="${icons[x.category] || "ri-cake-3-line"}">
        </i></span>${x.name}</div></td>
        <td>${x.category}</td>
        <td>${x.stock} units</td>
        <td>${money(x.price)}</td>
        <td>${badge(statusFor(x.stock))}</td>
        <td><div class="row-actions">
        <button class="small-btn" title="Edit" onclick="editProduct('${x.id}')">
        <i class="ri-pencil-line"></i></button>
        <button class="small-btn" title="Delete" onclick="askDeleteProduct('${x.id}')">
        <i class="ri-delete-bin-line"></i>
        </button>
        </div></td></tr>`,
      )
      .join("") || `<tr><td colspan="7">No products found.</td></tr>`;
  $("#inventoryPagination").innerHTML = Array.from(
    { length: total },
    (_, i) =>
      `<button class="page-btn ${i + 1 === inventoryPage ? "active" : ""}" onclick="setInventoryPage(${i + 1})">${i + 1}</button>`,
  ).join("");
}
function setInventoryPage(p) {
  inventoryPage = p;
  renderInventory();
}
function searchInventory() {
  inventoryPage = 1;
  renderInventory();
}
function filterInventory() {
  inventoryPage = 1;
  renderInventory();
}
function loadInventory() {
  renderInventory();
}
function addProduct(data) {
  const next = 104 + state.inventory.length;
  state.inventory.push({
    id: `PRD-${next}`,
    ...data,
    stock: +data.stock,
    price: +data.price,
  });
  save();
  renderAll();
  showToast("Product added successfully");
}
function updateInventory(id, data) {
  const i = state.inventory.findIndex((x) => x.id === id);
  state.inventory[i] = {
    ...state.inventory[i],
    ...data,
    stock: +data.stock,
    price: +data.price,
  };
  save();
  renderAll();
  showToast("Stock updated successfully");
}
function deleteProduct(id) {
  state.inventory = state.inventory.filter((x) => x.id !== id);
  save();
  renderAll();
  showToast("Product deleted", "ri-delete-bin-line");
}
function editProduct(id) {
  const x = state.inventory.find((x) => x.id === id);
  $("#productModalTitle").textContent = "Edit product";
  $("#productEditId").value = x.id;
  $("#productName").value = x.name;
  $("#productCategory").value = x.category;
  $("#productStock").value = x.stock;
  $("#productPrice").value = x.price;
  openModal("productModal");
}
function askDeleteProduct(id) {
  askConfirm(
    "Delete product?",
    "This product will be permanently removed from inventory.",
    () => deleteProduct(id),
    "Delete product",
  );
}
function renderOrders() {
  const q = $("#orderSearch").value.toLowerCase(),
    f = $("#orderFilter").value;
  let rows = state.orders.filter(
    (x) =>
      (!q ||
        `${x.id} ${x.customer} ${x.products.join(" ")}`
          .toLowerCase()
          .includes(q)) &&
      (f === "all" || x.status === f),
  );
  let per = 6,
    total = Math.max(1, Math.ceil(rows.length / per));
  ordersPage = Math.min(ordersPage, total);
  rows = rows.slice((ordersPage - 1) * per, ordersPage * per);
  $("#ordersBody").innerHTML =
    rows
      .map(
        (x) =>
          `<tr><td><b>${x.id}</b></td><td>${x.customer}</td><td>${x.products.join(", ")}</td><td>${x.quantity}</td><td><b>${money(x.amount)}</b></td><td>${badge(x.payment)}</td><td>${badge(x.status)}</td><td><div class="row-actions">${x.status === "Pending" ? `<button class="small-btn" title="Confirm" onclick="confirmOrder('${x.id}')"><i class="ri-check-line"></i></button><button class="small-btn" title="Cancel" onclick="cancelOrder('${x.id}')"><i class="ri-close-line"></i></button>` : ""}<button class="small-btn" title="View" onclick="viewOrder('${x.id}')"><i class="ri-eye-line"></i></button></div></td></tr>`,
      )
      .join("") || `<tr><td colspan="8">No orders found.</td></tr>`;
  $("#ordersPagination").innerHTML = Array.from(
    { length: total },
    (_, i) =>
      `<button class="page-btn ${i + 1 === ordersPage ? "active" : ""}" onclick="setOrdersPage(${i + 1})">${i + 1}</button>`,
  ).join("");
}
function setOrdersPage(p) {
  ordersPage = p;
  renderOrders();
}
function filterOrders() {
  ordersPage = 1;
  renderOrders();
}
function loadOrders() {
  renderOrders();
}
function confirmOrder(id) {
  let x = state.orders.find((x) => x.id === id);
  x.status = "Confirmed";
  save();
  renderAll();
  showToast("Order confirmed");
}
function cancelOrder(id) {
  askConfirm(
    "Cancel order?",
    "This order will be marked as cancelled.",
    () => {
      state.orders.find((x) => x.id === id).status = "Cancelled";
      save();
      renderAll();
      showToast("Order cancelled", "ri-close-circle-line");
    },
    "Cancel order",
  );
}
function viewOrder(id) {
  const x = state.orders.find((x) => x.id === id);
  $("#orderModalTitle").textContent = x.id;
  $("#orderModalContent").innerHTML =
    `<div class="detail-list"><div><small>Customer</small><b>${x.customer}</b></div><div><small>Phone</small><b>${x.phone}</b></div><div><small>Products</small><b>${x.products.join(", ")}</b></div><div><small>Total</small><b>${money(x.amount)}</b></div><div><small>Payment</small>${badge(x.payment)}</div><div><small>Status</small>${badge(x.status)}</div></div>`;
  openModal("orderModal");
}
function deliveryProgress(s) {
  return (
    {
      Pending: 15,
      Packed: 38,
      "Out For Delivery": 72,
      Delivered: 100,
      Cancelled: 0,
    }[s] || 0
  );
}
function renderDelivery() {
  const q = $("#deliverySearch").value.toLowerCase(),
    f = $("#deliveryFilter").value,
    rows = state.deliveries.filter(
      (x) =>
        (!q || Object.values(x).join(" ").toLowerCase().includes(q)) &&
        (f === "all" || x.status === f),
    );
  $("#deliveryBody").innerHTML =
    rows
      .map(
        (x) =>
          `<tr><td><b>${x.id}</b></td><td>${x.vendor}</td><td>${x.customer}</td><td>${x.driver}</td><td>${x.order}</td><td>${badge(x.status)}</td><td>${x.eta}</td><td><button class="ghost-btn" onclick="openDelivery('${x.id}')">Track</button></td></tr>`,
      )
      .join("") || `<tr><td colspan="8">No deliveries found.</td></tr>`;
}
function loadDelivery() {
  renderDelivery();
}
function filterDelivery() {
  renderDelivery();
}
function openDelivery(id) {
  let x = state.deliveries.find((x) => x.id === id);
  $("#deliveryEditId").value = id;
  $("#deliveryStatus").value = x.status;
  renderSteps(x.status);
  openModal("deliveryModal");
}
function renderSteps(status) {
  let current = ["Pending", "Packed", "Out For Delivery", "Delivered"].indexOf(
    status,
  );
  $("#trackingSteps").innerHTML = [
    "Order received",
    "Packed",
    "Dispatched",
    "Delivered",
  ]
    .map(
      (x, i) =>
        `<div class="step ${i <= current ? "complete" : ""}"><i class="ri-check-line"></i>${x}</div>`,
    )
    .join("");
}
function updateDeliveryStatus(id, status) {
  let x = state.deliveries.find((x) => x.id === id);
  x.status = status;
  x.eta =
    status === "Delivered"
      ? "Delivered"
      : status === "Cancelled"
        ? "Cancelled"
        : x.eta;
  let o = state.orders.find((o) => o.id === x.order);
  if (status === "Delivered" && o) o.status = "Delivered";
  save();
  renderAll();
  showToast("Delivery updated");
}
function renderSales() {
  $("#salesTotal").textContent =
    `Today's paid sales · ${money(calculateSales())}`;
  $("#salesBody").innerHTML = state.sales
    .map(
      (x) =>
        `<tr><td><b>${x.id}</b></td><td>${x.customer}</td><td>${x.items}</td><td>${money(x.amount)}</td><td>${x.date === today ? "Today" : x.date}</td><td>${x.payment}</td><td>${badge(x.status)}</td></tr>`,
    )
    .join("");
}
function renderCustomers() {
  $("#customersBody").innerHTML = state.customers
    .map(
      (x) =>
        `<tr><td><b>${x.name}</b></td><td>${x.phone}</td><td>${x.orders}</td><td>${money(x.value)}</td><td>${x.last}</td></tr>`,
    )
    .join("");
}
function renderOverview() {
  let recent = state.orders.slice(0, 5);
  $("#recentOrders").innerHTML = recent
    .map(
      (x) =>
        `<div class="recent-row"><span class="customer-dot">${x.customer
          .split(" ")
          .map((n) => n[0])
          .join(
            "",
          )}</span><div><b>${x.customer}</b><small>${x.id} · ${x.products[0]}</small></div><div><span class="amount">${money(x.amount)}</span><small>${x.status}</small></div></div>`,
    )
    .join("");
  $("#deliveryGlance").innerHTML = state.deliveries
    .slice(0, 4)
    .map(
      (x) =>
        `<div class="delivery-mini"><div class="delivery-mini-top"><span>${x.customer} <b>· ${x.status}</b></span><span>${x.eta}</span></div><div class="progress"><span style="width:${deliveryProgress(x.status)}%"></span></div></div>`,
    )
    .join("");
}
function renderReports() {
  $("#reportCards").innerHTML = [
    [
      "ri-money-pound-circle-line",
      "Revenue snapshot",
      `${money(calculateSales())} paid today across ${state.sales.filter((s) => s.date === today).length} invoices.`,
    ],
    [
      "ri-box-3-line",
      "Stock health",
      `${state.inventory.filter((x) => x.stock < 20).length} products need attention before tomorrow.`,
    ],
    [
      "ri-truck-line",
      "Fulfillment",
      `${state.deliveries.filter((x) => x.status === "Delivered").length} deliveries completed; ${state.deliveries.filter((x) => x.status === "Out For Delivery").length} en route.`,
    ],
  ]
    .map(
      (x) =>
        `<article class="panel report-card"><i class="${x[0]}"></i><h3>${x[1]}</h3><p>${x[2]}</p></article>`,
    )
    .join("");
}
function buildCharts() {
  if (!window.Chart) return;
  Object.values(charts).forEach((c) => c.destroy());
  const tc = getComputedStyle(document.body).getPropertyValue("--muted"),
    ac = "#d96b3e";
  const common = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: tc } },
      y: {
        border: { display: false },
        grid: {
          color: getComputedStyle(document.body).getPropertyValue("--line"),
        },
        ticks: { color: tc },
      },
    },
  };
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  charts.sales = new Chart($("#salesChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: [420, 580, 460, 720, 640, 890, calculateSales() || 745],
          borderColor: ac,
          backgroundColor: "#d96b3e18",
          fill: true,
          tension: 0.42,
          pointRadius: 3,
        },
      ],
    },
    options: common,
  });
  charts.orders = new Chart($("#ordersChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: [12, 19, 14, 22, 18, 27, 23],
          backgroundColor: "#ec9a70",
          borderRadius: 6,
        },
      ],
    },
    options: common,
  });
  charts.stock = new Chart($("#stockChart"), {
    type: "doughnut",
    data: {
      labels: ["Bread", "Cake", "Pastry", "Other"],
      datasets: [
        {
          data: [
            84,
            7,
            84,
            state.inventory.reduce((a, x) => a + x.stock, 0) - 175,
          ],
          backgroundColor: ["#d96b3e", "#f4b66e", "#795b8b", "#b5d8c7"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: tc, boxWidth: 9, font: { size: 10 } },
        },
      },
    },
  });
  charts.weekly = new Chart($("#weeklyChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: [32, 45, 38, 58, 52, 70, 66],
          borderColor: "#6e87b9",
          backgroundColor: "#6e87b91a",
          fill: true,
          tension: 0.42,
          pointRadius: 0,
        },
      ],
    },
    options: common,
  });
}
function globalSearch() {
  const q = $("#globalSearch").value.toLowerCase().trim(),
    out = $("#searchResults");
  if (!q) {
    out.classList.remove("show");
    return;
  }
  const all = [
    ...state.inventory.map((x) => ({
      page: "inventory",
      text: `${x.name} · ${x.id}`,
    })),
    ...state.orders.map((x) => ({
      page: "orders",
      text: `${x.customer} · ${x.id}`,
    })),
    ...state.deliveries.map((x) => ({
      page: "delivery",
      text: `${x.customer} · ${x.id} · ${x.vendor}`,
    })),
  ]
    .filter((x) => x.text.toLowerCase().includes(q))
    .slice(0, 6);
  out.innerHTML = all.length
    ? all
        .map(
          (x) =>
            `<div class="search-item" data-page="${x.page}"><i class="ri-search-line"></i> ${x.text}</div>`,
        )
        .join("")
    : '<div class="search-item">No matching records</div>';
  out.classList.add("show");
  $$(".search-item[data-page]").forEach(
    (x) => (x.onclick = () => navigate(x.dataset.page)),
  );
}
function toggleDarkMode(force) {
  let dark = force ?? !document.body.classList.contains("dark");
  document.body.classList.toggle("dark", dark);
  localStorage.setItem("bakeryTheme", dark ? "dark" : "light");
  $("#themeToggle i").className = dark ? "ri-sun-line" : "ri-moon-line";
  if (Object.keys(charts).length) buildCharts();
}
function openModal(id) {
  $("#modalBackdrop").classList.add("open");
  $("#" + id).classList.add("open");
}
function closeModal() {
  $(".modal-backdrop").classList.remove("open");
  $$(".modal.open").forEach((x) => x.classList.remove("open"));
}
function askConfirm(title, text, fn, label) {
  $("#confirmTitle").textContent = title;
  $("#confirmText").textContent = text;
  $("#confirmAction").textContent = label;
  confirmFn = fn;
  openModal("confirmModal");
}
function navigate(page) {
  $$(".page").forEach((x) => x.classList.toggle("active", x.id === page));
  $$(".nav-link[data-page]").forEach((x) =>
    x.classList.toggle("active", x.dataset.page === page),
  );
  history.replaceState(null, "", `#${page}`);
  $("#sidebar").classList.remove("open");
  $("#sidebarOverlay").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "admin.html";
}
function loadDashboard() {
  const name = localStorage.getItem("adminName") || "Admin";
  $("#welcomeName").textContent = name.split(" ")[0];
  $("#profileName").textContent = name;
  $("#avatar").textContent = name[0].toUpperCase();
  $("#year").textContent = new Date().getFullYear();
  $("#companyName").value =
    localStorage.getItem("companyName") || "Crumbly Bakery";
  $("#settingsAdminName").value = name;
  $("#settingsPhone").value = localStorage.getItem("phoneNumber") || "";
  $("#settingsTheme").value = localStorage.getItem("bakeryTheme") || "light";
  updateDashboardCards();
  renderOverview();
  loadInventory();
  loadOrders();
  loadDelivery();
  renderSales();
  renderCustomers();
  renderReports();
  buildCharts();
}
function renderAll() {
  updateDashboardCards();
  renderOverview();
  renderInventory();
  renderOrders();
  renderDelivery();
  renderSales();
  renderCustomers();
  renderReports();
  buildCharts();
}
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "admin.html";
    return;
  }
  loadLocalStorage();
  if (localStorage.getItem("bakeryTheme") === "dark") toggleDarkMode(true);
  loadDashboard();
  setInterval(
    () =>
      ($("#dateTime").textContent = new Date().toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })),
    1000,
  );
  $("#dateTime").textContent = new Date().toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  $$(".nav-link[data-page]").forEach(
    (x) =>
      (x.onclick = (e) => {
        e.preventDefault();
        navigate(x.dataset.page);
      }),
  );
  $$("[data-close-modal]").forEach((x) => (x.onclick = closeModal));
  $("#modalBackdrop").onclick = closeModal;
  $$("[data-open-modal]").forEach(
    (x) =>
      (x.onclick = () => {
        $("#productForm").reset();
        $("#productEditId").value = "";
        $("#productModalTitle").textContent = "Add product";
        openModal("productModal");
      }),
  );
  $("#productForm").onsubmit = (e) => {
    e.preventDefault();
    const d = {
        name: $("#productName").value.trim(),
        category: $("#productCategory").value,
        stock: $("#productStock").value,
        price: $("#productPrice").value,
      },
      id = $("#productEditId").value;
    id ? updateInventory(id, d) : addProduct(d);
    closeModal();
  };
  $("#deliveryForm").onsubmit = (e) => {
    e.preventDefault();
    updateDeliveryStatus(
      $("#deliveryEditId").value,
      $("#deliveryStatus").value,
    );
    closeModal();
  };
  $("#deliveryStatus").onchange = (e) => renderSteps(e.target.value);
  $("#confirmAction").onclick = () => {
    confirmFn?.();
    closeModal();
  };
  $("#inventorySearch").oninput = searchInventory;
  $("#inventoryFilter").onchange = filterInventory;
  $("#inventorySort").onclick = () => {
    state.inventory.sort((a, b) =>
      invSortAsc ? a.stock - b.stock : b.stock - a.stock,
    );
    invSortAsc = !invSortAsc;
    renderInventory();
  };
  $("#orderSearch").oninput = filterOrders;
  $("#orderFilter").onchange = filterOrders;
  $("#deliverySearch").oninput = filterDelivery;
  $("#deliveryFilter").onchange = filterDelivery;
  $("#globalSearch").oninput = globalSearch;
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      $("#globalSearch").focus();
    }
    if (e.key === "Escape") closeModal();
  });
  $("#themeToggle").onclick = () => toggleDarkMode();
  $("#logoutBtn").onclick = logout;
  $("#menuBtn").onclick = () => {
    $("#sidebar").classList.add("open");
    $("#sidebarOverlay").classList.add("open");
  };
  $("#closeMenu").onclick = () => {
    $("#sidebar").classList.remove("open");
    $("#sidebarOverlay").classList.remove("open");
  };
  $("#sidebarOverlay").onclick = () => {
    $("#sidebar").classList.remove("open");
    $("#sidebarOverlay").classList.remove("open");
  };
  $("#settingsForm").onsubmit = (e) => {
    e.preventDefault();
    let n = $("#settingsAdminName").value.trim(),
      p = $("#settingsPhone").value.replace(/\D/g, "");
    if (!n || p.length < 10) {
      showToast(
        "Please enter a valid name and phone number",
        "ri-error-warning-line",
      );
      return;
    }
    localStorage.setItem("companyName", $("#companyName").value.trim());
    localStorage.setItem("adminName", n);
    localStorage.setItem("phoneNumber", p);
    toggleDarkMode($("#settingsTheme").value === "dark");
    loadDashboard();
    showToast("Saved successfully");
  };
  const hash = location.hash.slice(1);
  if (hash && $("#" + hash)) navigate(hash);
});
window.editProduct = editProduct;
window.askDeleteProduct = askDeleteProduct;
window.setInventoryPage = setInventoryPage;
window.setOrdersPage = setOrdersPage;
window.confirmOrder = confirmOrder;
window.cancelOrder = cancelOrder;
window.viewOrder = viewOrder;
window.openDelivery = openDelivery;
window.logout = logout;
window.updateInventory = updateInventory;
window.deleteProduct = deleteProduct;
window.addProduct = addProduct;
window.loadInventory = loadInventory;
window.loadOrders = loadOrders;
window.loadDelivery = loadDelivery;
window.updateDeliveryStatus = updateDeliveryStatus;
window.calculateSales = calculateSales;
window.updateDashboardCards = updateDashboardCards;
window.searchInventory = searchInventory;
window.filterInventory = filterInventory;
window.filterOrders = filterOrders;
window.filterDelivery = filterDelivery;
window.toggleDarkMode = toggleDarkMode;
window.showToast = showToast;
window.saveLocalStorage = saveLocalStorage;
window.loadLocalStorage = loadLocalStorage;
