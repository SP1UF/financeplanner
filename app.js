// Początkowe ustawienia PWA
if (window.navigator.standalone === true) {
  document.getElementById("app").style.display = "block";
} else {
  document.getElementById("install-instructions").style.display = "flex";
}

// =========================
// Obsługa menu bocznego
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const menuToggle = document.getElementById("menu-toggle");
  const closeBtn = document.querySelector("#sidebar .close-btn");

  if (menuToggle && sidebar && overlay && closeBtn) {
    // Otwórz menu
    menuToggle.addEventListener("click", () => {
      sidebar.classList.add("open");
      overlay.classList.add("show");
    });

    // Zamknij menu (X)
    closeBtn.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });

    // Zamknij klikając overlay
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
  }

  // Nawigacja między widokami
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
      document.getElementById("view-" + btn.dataset.target).classList.add("active");

      // Zamknij menu po wyborze
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
  });
});

// =========================
// Tutaj dodajesz resztę logiki
// transakcje, cele, wykresy itd.
// =========================
