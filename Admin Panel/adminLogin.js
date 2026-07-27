const $ = (s) => document.querySelector(s);
$("#phoneNumber").addEventListener(
  "input",
  (e) => (e.target.value = e.target.value.replace(/\D/g, "")),
);
$("#loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = $("#adminName").value.trim(),
    phone = $("#phoneNumber").value.trim();

  let valid = true;

  $("#nameError").textContent = name ? "" : "Please enter your admin name.";

  $("#phoneError").textContent = /^\d{10,}$/.test(phone)
    ? ""
    : "Enter at least 10 digits.";

  valid = !!name && /^\d{10,}$/.test(phone);

  if (!valid) return;
  localStorage.setItem("adminName", name);
  localStorage.setItem("phoneNumber", phone);
  localStorage.setItem("isLoggedIn", "true");
  window.location.href = "admin.html";
});
