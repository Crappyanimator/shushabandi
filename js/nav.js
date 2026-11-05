// =========================================================
// ნავიგაცია: ჰამბურგერ-მენიუ მობილურზე
// და მიმდინარე სექციის მონიშვნა მენიუში
// =========================================================

function initNav() {
  const menuToggle = document.querySelector(".menu-toggle");
  const toggleText = menuToggle.querySelector(".visually-hidden");
  const navList = document.querySelector(".nav-list");
  const navLinks = document.querySelectorAll(".nav-link");

  function openMenu() {
    navList.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    toggleText.textContent = "მენიუს დახურვა";
  }

  function closeMenu() {
    navList.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    toggleText.textContent = "მენიუს გახსნა";
  }

  function isMenuOpen() {
    return navList.classList.contains("is-open");
  }

  menuToggle.addEventListener("click", function () {
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // ბმულზე დაჭერის შემდეგ მენიუ იხურება
  navLinks.forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  // Escape ღილაკი ხურავს მენიუს და ფოკუსს ღილაკზე აბრუნებს
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isMenuOpen()) {
      closeMenu();
      menuToggle.focus();
    }
  });

  // მენიუს გარეთ დაჭერისას მენიუ იხურება
  document.addEventListener("click", function (event) {
    const clickedInsideNav = event.target.closest(".main-nav");
    if (!clickedInsideNav && isMenuOpen()) {
      closeMenu();
    }
  });

  // მიმდინარე სექციის მონიშვნა. IntersectionObserver-ს
  // scroll-ის ყოველ მოვლენაზე გამოთვლა არ სჭირდება.
  const sections = document.querySelectorAll("main section[id]");

  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) {
        return;
      }
      navLinks.forEach(function (link) {
        const isCurrent = link.getAttribute("href") === "#" + entry.target.id;
        link.classList.toggle("is-current", isCurrent);
        if (isCurrent) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });
}

initNav();
