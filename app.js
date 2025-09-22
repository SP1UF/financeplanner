// PWA check
if (window.navigator.standalone === true) {
  document.getElementById("app").style.display = "block";
} else {
  document.getElementById("install-instructions").style.display = "flex";
}

// =========================
// Nawigacja dolna
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // aktywne przyciski
      navButtons.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      // widoki
      const target = btn.dataset.target;
      document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
      document.getElementById("view-" + target).classList.add("active");
    });
  });
});

// =========================
// Tutaj reszta logiki: transakcje, cele, kalendarz, wykres
// =========================
