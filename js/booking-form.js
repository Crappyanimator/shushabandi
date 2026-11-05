// =========================================================
// დაჯავშნის ფორმა: ვალიდაცია ქართული შეტყობინებებით,
// სიმბოლოების მთვლელი და დადასტურების ტექსტი
// =========================================================

function initBookingForm() {
  const form = document.getElementById("booking-form");
  if (!form) {
    return;
  }

  const nameInput = document.getElementById("name");
  const phoneInput = document.getElementById("phone");
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("time");
  const guestsSelect = document.getElementById("guests");
  const windowSeat = document.getElementById("window-seat");
  const noteInput = document.getElementById("note");
  const noteCount = document.getElementById("note-count");
  const successBox = document.getElementById("form-success");

  const MONTHS = [
    "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
    "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
  ];

  // ბრაუზერის ინგლისური შეტყობინებების ნაცვლად ჩვენსას ვაჩვენებთ
  form.noValidate = true;

  // დღევანდელი თარიღი ფორმატით YYYY-MM-DD (ისეთი, როგორსაც input[type=date] იყენებს)
  function getToday() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  // წარსული თარიღი კალენდარში არ აირჩევა
  dateInput.min = getToday();

  // "2026-11-12" → "12 ნოემბერი"
  function formatDate(value) {
    const parts = value.split("-");
    const monthIndex = Number(parts[1]) - 1;
    return Number(parts[2]) + " " + MONTHS[monthIndex];
  }

  // შეცდომის ჩვენება (ან გასუფთავება, თუ message ცარიელია)
  function showError(field, message) {
    const errorBox = document.getElementById(field.id + "-error");
    errorBox.textContent = message;
    field.classList.toggle("is-invalid", message !== "");
    field.setAttribute("aria-invalid", message !== "" ? "true" : "false");
  }

  // ---------- თითოეული ველის შემოწმება ----------
  function validateName() {
    if (nameInput.value.trim().length < 2) {
      showError(nameInput, "შეიყვანეთ სახელი (მინიმუმ 2 ასო).");
      return false;
    }
    showError(nameInput, "");
    return true;
  }

  // აშორებს ჰარეებს, ტირეებს და ქვეყნის კოდს (+995)
  function cleanPhone(value) {
    let digits = value.replace(/[\s-]/g, "");
    if (digits.startsWith("+995")) {
      digits = digits.slice(4);
    }
    return digits;
  }

  function validatePhone() {
    const digits = cleanPhone(phoneInput.value);
    // ქართული მობილური: 5-ით იწყება და 9 ციფრია
    if (!/^5\d{8}$/.test(digits)) {
      showError(phoneInput, "შეიყვანეთ 9-ნიშნა ნომერი, რომელიც 5-ით იწყება (5XX XX XX XX).");
      return false;
    }
    showError(phoneInput, "");
    return true;
  }

  function validateDate() {
    if (dateInput.value === "") {
      showError(dateInput, "აირჩიეთ თარიღი.");
      return false;
    }
    // YYYY-MM-DD ფორმატის სტრიქონები ერთმანეთს პირდაპირ შეედრება
    if (dateInput.value < getToday()) {
      showError(dateInput, "წარსული თარიღის არჩევა არ შეიძლება.");
      return false;
    }
    showError(dateInput, "");
    return true;
  }

  function validateTime() {
    if (timeSelect.value === "") {
      showError(timeSelect, "აირჩიეთ დრო.");
      return false;
    }
    // დღევანდელ თარიღზე უკვე გასული საათის დაჯავშნა არ შეიძლება
    const chosenHour = Number(timeSelect.value.slice(0, 2));
    if (dateInput.value === getToday() && chosenHour <= new Date().getHours()) {
      showError(timeSelect, "დღეს ეს საათი უკვე გავიდა. აირჩიეთ უფრო გვიანი დრო.");
      return false;
    }
    showError(timeSelect, "");
    return true;
  }

  // ---------- შემოწმება ველიდან გასვლისას ----------
  nameInput.addEventListener("blur", validateName);
  phoneInput.addEventListener("blur", validatePhone);
  dateInput.addEventListener("change", function () {
    validateDate();
    // თარიღის შეცვლამ შეიძლება არჩეული დრო არასწორი გახადოს
    if (timeSelect.value !== "") {
      validateTime();
    }
  });
  timeSelect.addEventListener("change", validateTime);

  // შეცდომის გამოსწორებისთანავე წითელი ჩარჩო ქრება
  nameInput.addEventListener("input", function () {
    if (nameInput.classList.contains("is-invalid")) {
      validateName();
    }
  });
  phoneInput.addEventListener("input", function () {
    if (phoneInput.classList.contains("is-invalid")) {
      validatePhone();
    }
  });

  // ---------- კომენტარის სიმბოლოების მთვლელი ----------
  function updateCounter() {
    noteCount.textContent = noteInput.value.length + " / " + noteInput.maxLength;
  }
  noteInput.addEventListener("input", updateCounter);

  // ---------- გაგზავნა ----------
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    successBox.textContent = "";

    // ყველა ველს ვამოწმებთ, რომ ყველა შეცდომა ერთად გამოჩნდეს
    const results = [
      { field: nameInput, valid: validateName() },
      { field: phoneInput, valid: validatePhone() },
      { field: dateInput, valid: validateDate() },
      { field: timeSelect, valid: validateTime() }
    ];

    const firstInvalid = results.find(function (result) {
      return !result.valid;
    });

    if (firstInvalid) {
      firstInvalid.field.focus();
      return;
    }

    // სერვერი არ გვაქვს, ამიტომ მონაცემებს არსად ვაგზავნით:
    // მომხმარებელს დადასტურების ტექსტს ვაჩვენებთ.
    // textContent (და არა innerHTML) — შეყვანილი ტექსტი HTML-ად არ წაიკითხება.
    let message = "მადლობა, " + nameInput.value.trim() + "! მოთხოვნა მიღებულია: " +
      formatDate(dateInput.value) + ", " + timeSelect.value + ", " +
      guestsSelect.value + " სტუმარი. დასადასტურებლად დაგირეკავთ.";

    if (windowSeat.checked) {
      message = message + " ფანჯარასთან მაგიდას, თუ თავისუფალი იქნება, შეგინახავთ.";
    }

    successBox.textContent = message;
    form.reset();
    updateCounter();
  });
}

initBookingForm();
