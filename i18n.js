/**
 * i18n.js
 * Modul multibahasa (Indonesia / English) untuk Space Game Hub.
 */

export const translations = {
  id: {
    heroTagline: "Mainkan Game Bertema:",
    heroDesc: "Masuk sebagai Komandan untuk mengakses misi dan catatan skor game harian.",
    btnLogin: "LOGIN",
    btnSignup: "AYO DAFTAR SEKARANG",
    loginTitle: "Login",
    signupTitle: "Sign Up",
    commanderNamePlaceholder: "Nama Komandan",
    chooseAvatar: "Pilih Avatar:",
    emailPlaceholder: "Email Komandan",
    passwordPlaceholder: "Password",
    forgotPassword: "Lupa Password?",
    btnSubmit: "SUBMIT",
    btnCancel: "BATAL",
    btnEditProfile: "EDIT PROFIL",
    btnLogout: "LOGOUT",
    missionControl: "MISSION CONTROL",
    flightHours: "⏱ JAM TERBANG:",
    noNewMission: "Misi baru sedang disiapkan... Kembali lagi besok!",
    btnPlay: "MAIN",
    btnScore: "🏆 SKOR",
    released: "RILIS:",
    profileTitle: "DATA KOMANDAN",
    profileDesc: "Atur nama panggilan dan avatar luar angkasa Anda:",
    btnSaveData: "SIMPAN DATA",
    loadingScore: "Memuat peringkat komandan...",
    noScoreRecorded: "Belum ada skor tercatat. Jadilah yang pertama!",
    loadingFlightHours: "Memuat peringkat jam terbang komandan...",
    noFlightHours: "Belum ada catatan jam terbang.",
    btnClose: "TUTUP",
    loadingSystem: "MEMUAT SISTEM...",
    loadingMission: "MEMUAT MISI...",
    langSwitcherTitle: "Pilih Bahasa / Language",
    themeSwitcherTitle: "Ganti Tema",
    audioMuteTitle: "Mute/Unmute Audio"
  },
  en: {
    heroTagline: "Play Games Themed:",
    heroDesc: "Login as Commander to access daily missions and track high scores.",
    btnLogin: "LOGIN",
    btnSignup: "JOIN NOW",
    loginTitle: "Login",
    signupTitle: "Sign Up",
    commanderNamePlaceholder: "Commander Name",
    chooseAvatar: "Choose Avatar:",
    emailPlaceholder: "Commander Email",
    passwordPlaceholder: "Password",
    forgotPassword: "Forgot Password?",
    btnSubmit: "SUBMIT",
    btnCancel: "CANCEL",
    btnEditProfile: "EDIT PROFILE",
    btnLogout: "LOGOUT",
    missionControl: "MISSION CONTROL",
    flightHours: "⏱ FLIGHT HOURS:",
    noNewMission: "New missions are being prepared... Come back tomorrow!",
    btnPlay: "PLAY",
    btnScore: "🏆 SCORES",
    released: "RELEASED:",
    profileTitle: "COMMANDER DATA",
    profileDesc: "Set your space callsign and commander avatar:",
    btnSaveData: "SAVE DATA",
    loadingScore: "Loading commander rankings...",
    noScoreRecorded: "No scores recorded yet. Be the first!",
    loadingFlightHours: "Loading flight hour rankings...",
    noFlightHours: "No flight hours recorded yet.",
    btnClose: "CLOSE",
    loadingSystem: "LOADING SYSTEM...",
    loadingMission: "LOADING MISSIONS...",
    langSwitcherTitle: "Select Language / Pilih Bahasa",
    themeSwitcherTitle: "Change Theme",
    audioMuteTitle: "Mute/Unmute Audio"
  }
};

let currentLang = localStorage.getItem("hub_selected_lang") || "id";

export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (lang !== "id" && lang !== "en") lang = "id";
  currentLang = lang;
  localStorage.setItem("hub_selected_lang", lang);
  document.documentElement.lang = lang;
  applyTranslations();

  const langBtn = document.getElementById("lang-trigger-btn");
  if (langBtn) {
    langBtn.innerText = lang.toUpperCase();
  }
}

export function t(key) {
  const dict = translations[currentLang] || translations.id;
  return dict[key] || key;
}

export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key && translations[currentLang] && translations[currentLang][key]) {
      el.innerText = translations[currentLang][key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key && translations[currentLang] && translations[currentLang][key]) {
      el.setAttribute("placeholder", translations[currentLang][key]);
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (key && translations[currentLang] && translations[currentLang][key]) {
      el.setAttribute("title", translations[currentLang][key]);
    }
  });
}
