// =========================================================
// მენიუს ფილტრი კატეგორიების მიხედვით
// =========================================================

function initMenuFilter() {
  const filtersBox = document.querySelector(".menu-filters");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const menuItems = document.querySelectorAll(".menu-item");
  const statusText = document.querySelector(".menu-status");

  // ღილაკები მხოლოდ JavaScript-ით ჩანს, რადგან უმისოდ არ იმუშავებდა
  filtersBox.hidden = false;

  // ერთი listener ყველა ღილაკისთვის (event delegation)
  filtersBox.addEventListener("click", function (event) {
    const clickedButton = event.target.closest(".filter-btn");
    if (!clickedButton) {
      return;
    }

    const category = clickedButton.dataset.filter;

    filterButtons.forEach(function (button) {
      const isActive = button === clickedButton;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    let visibleCount = 0;
    menuItems.forEach(function (item) {
      const isVisible = category === "all" || item.dataset.category === category;
      item.hidden = !isVisible;
      if (isVisible) {
        visibleCount = visibleCount + 1;
      }
    });

    // ეკრანის წამკითხველი გაიგებს, რამდენი პოზიცია დარჩა
    statusText.textContent = "ნაჩვენებია " + visibleCount + " პოზიცია";
  });
}

initMenuFilter();
