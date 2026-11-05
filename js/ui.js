// =========================================================
// წვრილმანები: მიმდინარე წელი ფუტერში
// და „ზემოთ ასვლის“ ღილაკი
// =========================================================

function initUi() {
  // წელი ავტომატურად განახლდება
  document.getElementById("year").textContent = new Date().getFullYear();

  const backToTop = document.querySelector(".back-to-top");
  const hero = document.querySelector(".hero");

  // ღილაკი მაშინ ჩნდება, როცა მთავარი ეკრანი ხედიდან გადის.
  // IntersectionObserver-ს scroll-ის ყოველ მოვლენაზე კოდის გაშვება არ სჭირდება.
  const heroObserver = new IntersectionObserver(function (entries) {
    const heroIsVisible = entries[0].isIntersecting;
    backToTop.classList.toggle("is-visible", !heroIsVisible);
  });

  heroObserver.observe(hero);
}

initUi();
