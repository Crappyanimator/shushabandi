// =========================================================
// სლაიდერი: ღილაკები, წერტილები, კლავიატურა,
// თითით გადაფურცვლა და ავტომატური გადართვა
// =========================================================

function initSlider() {
  const slider = document.querySelector(".slider");
  if (!slider) {
    return;
  }

  const track = slider.querySelector(".slider-track");
  const slides = slider.querySelectorAll(".slide");
  const prevButton = slider.querySelector(".slider-prev");
  const nextButton = slider.querySelector(".slider-next");
  const dotsBox = slider.querySelector(".slider-dots");
  const controls = slider.querySelector(".slider-controls");

  const AUTOPLAY_DELAY = 5000; // 5 წამი
  const SWIPE_DISTANCE = 50; // რამდენი პიქსელი ითვლება გადაფურცვლად
  let currentIndex = 0;
  let autoplayTimer = null;
  let touchStartX = 0;

  // JavaScript-ით მართვაზე გადასვლა (CSS-ში .slider.is-ready)
  slider.classList.add("is-ready");
  controls.hidden = false;

  // თითოეული სლაიდისთვის წერტილის შექმნა
  slides.forEach(function (slide, index) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "slider-dot";
    dot.setAttribute("aria-label", "შემოთავაზება " + (index + 1));
    dot.addEventListener("click", function () {
      goToSlide(index);
      restartAutoplay();
    });
    dotsBox.appendChild(dot);
  });

  const dots = dotsBox.querySelectorAll(".slider-dot");

  function goToSlide(index) {
    // ბოლო სლაიდის შემდეგ პირველზე გადადის და პირიქით
    if (index < 0) {
      index = slides.length - 1;
    }
    if (index >= slides.length) {
      index = 0;
    }
    currentIndex = index;

    track.style.transform = "translateX(-" + currentIndex * 100 + "%)";

    slides.forEach(function (slide, i) {
      slide.setAttribute("aria-hidden", i === currentIndex ? "false" : "true");
    });

    dots.forEach(function (dot, i) {
      const isActive = i === currentIndex;
      dot.classList.toggle("is-active", isActive);
      if (isActive) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  // ---------- ავტომატური გადართვა ----------
  // თუ მომხმარებელს ანიმაცია გამორთული აქვს, თავად არ ვატრიალებთ
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function startAutoplay() {
    if (reduceMotion || autoplayTimer !== null) {
      return;
    }
    autoplayTimer = setInterval(nextSlide, AUTOPLAY_DELAY);
  }

  function stopAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  // ტაიმერი თავიდან იწყებს ათვლას, თუ ამის პირობები არსებობს
  function restartAutoplay() {
    stopAutoplay();
    updateAutoplay();
  }

  // ---------- ღილაკები ----------
  nextButton.addEventListener("click", function () {
    nextSlide();
    restartAutoplay();
  });

  prevButton.addEventListener("click", function () {
    prevSlide();
    restartAutoplay();
  });

  // ---------- კლავიატურა: ისრები ----------
  slider.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") {
      nextSlide();
      restartAutoplay();
    }
    if (event.key === "ArrowLeft") {
      prevSlide();
      restartAutoplay();
    }
  });

  // ---------- თითით გადაფურცვლა ----------
  slider.addEventListener("touchstart", function (event) {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  slider.addEventListener("touchend", function (event) {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (distance < -SWIPE_DISTANCE) {
      nextSlide();
      restartAutoplay();
    }
    if (distance > SWIPE_DISTANCE) {
      prevSlide();
      restartAutoplay();
    }
  });

  // ---------- როდის უნდა მუშაობდეს ავტომატური გადართვა ----------
  // მხოლოდ მაშინ, როცა სლაიდერი ეკრანზე ჩანს, ჩანართი აქტიურია
  // და მომხმარებელი სლაიდერს მაუსით ან ფოკუსით არ ეხება.
  let isOnScreen = false;
  let isUserInside = false;

  function updateAutoplay() {
    if (isOnScreen && !isUserInside && !document.hidden) {
      startAutoplay();
    } else {
      stopAutoplay();
    }
  }

  // მაუსის მიტანისას ან ფოკუსისას პაუზა, რომ ტექსტის წაკითხვა მოასწრონ
  slider.addEventListener("mouseenter", function () {
    isUserInside = true;
    updateAutoplay();
  });
  slider.addEventListener("mouseleave", function () {
    isUserInside = false;
    updateAutoplay();
  });
  slider.addEventListener("focusin", function () {
    isUserInside = true;
    updateAutoplay();
  });
  slider.addEventListener("focusout", function () {
    isUserInside = false;
    updateAutoplay();
  });

  // სხვა ჩანართზე გადასვლისას ტაიმერი ჩერდება
  document.addEventListener("visibilitychange", updateAutoplay);

  // ეკრანს მიღმა სლაიდერი ტყუილად არ ტრიალებს
  const visibilityObserver = new IntersectionObserver(function (entries) {
    isOnScreen = entries[0].isIntersecting;
    updateAutoplay();
  });
  visibilityObserver.observe(slider);

  goToSlide(0);
}

initSlider();
