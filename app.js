"use strict";

const speechText = document.getElementById("speechText");
const startListening = document.getElementById("startListening");
const speakText = document.getElementById("speakText");
const copyText = document.getElementById("copyText");
const clearSpeech = document.getElementById("clearSpeech");
const speechStatus = document.getElementById("speechStatus");

const accessibilityBtn = document.getElementById("accessibilityBtn");
const accessibilityPanel = document.getElementById("accessibilityPanel");
const closeAccessibility = document.getElementById("closeAccessibility");

const increaseFont = document.getElementById("increaseFont");
const decreaseFont = document.getElementById("decreaseFont");
const contrastMode = document.getElementById("contrastMode");
const reduceMotion = document.getElementById("reduceMotion");
const resetAccess = document.getElementById("resetAccess");

const toast = document.getElementById("toast");
const phraseModal = document.getElementById("phraseModal");
const closeModal = document.getElementById("closeModal");
const modalPhrase = document.getElementById("modalPhrase");
const modalSpeak = document.getElementById("modalSpeak");

const demoSignBtn = document.getElementById("demoSignBtn");
const signResult = document.getElementById("signResult");

let selectedPhrase = "";
let toastTimer;
let currentFontSize = 16;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function speakArabic(text) {
  if (!text.trim()) {
    showToast("اكتبي نصًا أولًا من فضلك");
    return;
  }

  if (!("speechSynthesis" in window)) {
    showToast("المتصفح لا يدعم تحويل النص إلى صوت");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-EG";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}

function setListeningState(isListening) {
  speechStatus.classList.toggle("listening", isListening);

  if (isListening) {
    speechStatus.innerHTML = `
      <span class="status-circle"></span>
      الميكروفون يعمل الآن...
    `;

    startListening.innerHTML = `
      <span>■</span>
      إيقاف الاستماع
    `;
  } else {
    speechStatus.innerHTML = `
      <span class="status-circle"></span>
      الميكروفون متوقف
    `;

    startListening.innerHTML = `
      <span>◉</span>
      ابدأ الاستماع
    `;
  }
}

let recognition = null;
let isListening = false;

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();

  recognition.lang = "ar-EG";
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    setListeningState(true);
    showToast("تحدثي الآن بوضوح");
  };

  recognition.onresult = (event) => {
    let finalText = "";
    let temporaryText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const current = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalText += current;
      } else {
        temporaryText += current;
      }
    }

    if (finalText) {
      speechText.value += `${finalText} `;
    } else if (temporaryText) {
      speechStatus.innerHTML = `
        <span class="status-circle"></span>
        أسمع: ${temporaryText}
      `;
    }
  };

  recognition.onerror = (event) => {
    isListening = false;
    setListeningState(false);

    if (event.error === "not-allowed") {
      showToast("اسمحي للمتصفح باستخدام الميكروفون");
    } else {
      showToast("حدثت مشكلة أثناء الاستماع");
    }
  };

  recognition.onend = () => {
    isListening = false;
    setListeningState(false);
  };
}

startListening.addEventListener("click", () => {
  if (!recognition) {
    showToast("ميزة تحويل الكلام إلى نص غير مدعومة في هذا المتصفح");
    return;
  }

  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

speakText.addEventListener("click", () => {
  speakArabic(speechText.value);
});

copyText.addEventListener("click", async () => {
  if (!speechText.value.trim()) {
    showToast("لا يوجد نص لنسخه");
    return;
  }

  try {
    await navigator.clipboard.writeText(speechText.value);
    showToast("تم نسخ النص بنجاح");
  } catch {
    speechText.select();
    document.execCommand("copy");
    showToast("تم نسخ النص");
  }
});

clearSpeech.addEventListener("click", () => {
  speechText.value = "";
  showToast("تم مسح النص");
});

document.querySelectorAll("[data-phrase]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedPhrase = button.dataset.phrase;
    modalPhrase.textContent = selectedPhrase;
    phraseModal.classList.add("open");
    phraseModal.setAttribute("aria-hidden", "false");

    if (navigator.vibrate) {
      navigator.vibrate(80);
    }
  });
});

modalSpeak.addEventListener("click", () => {
  speakArabic(selectedPhrase);
});

closeModal.addEventListener("click", () => {
  phraseModal.classList.remove("open");
  phraseModal.setAttribute("aria-hidden", "true");
});

phraseModal.addEventListener("click", (event) => {
  if (event.target === phraseModal) {
    phraseModal.classList.remove("open");
    phraseModal.setAttribute("aria-hidden", "true");
  }
});

document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(button.dataset.scroll);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
});

accessibilityBtn.addEventListener("click", () => {
  const isOpen = accessibilityPanel.classList.toggle("open");
  accessibilityPanel.setAttribute("aria-hidden", String(!isOpen));
});

closeAccessibility.addEventListener("click", () => {
  accessibilityPanel.classList.remove("open");
  accessibilityPanel.setAttribute("aria-hidden", "true");
});

increaseFont.addEventListener("click", () => {
  if (currentFontSize < 21) {
    currentFontSize += 1;
    document.documentElement.style.fontSize = `${currentFontSize}px`;
    showToast("تم تكبير الخط");
  }
});

decreaseFont.addEventListener("click", () => {
  if (currentFontSize > 14) {
    currentFontSize -= 1;
    document.documentElement.style.fontSize = `${currentFontSize}px`;
    showToast("تم تصغير الخط");
  }
});

contrastMode.addEventListener("click", () => {
  document.body.classList.toggle("high-contrast");
  showToast(
    document.body.classList.contains("high-contrast")
      ? "تم تشغيل التباين العالي"
      : "تم إيقاف التباين العالي"
  );
});

reduceMotion.addEventListener("click", () => {
  document.body.classList.toggle("reduced-motion");
  showToast(
    document.body.classList.contains("reduced-motion")
      ? "تم تقليل الحركة"
      : "تم تشغيل الحركة"
  );
});

resetAccess.addEventListener("click", () => {
  currentFontSize = 16;
  document.documentElement.style.fontSize = "16px";
  document.body.classList.remove("high-contrast", "reduced-motion");
  showToast("تمت إعادة الإعدادات");
});

demoSignBtn.addEventListener("click", () => {
  const demoSigns = [
    "مساعدة",
    "مرحبًا",
    "شكرًا",
    "نعم",
    "لا"
  ];

  const randomSign =
    demoSigns[Math.floor(Math.random() * demoSigns.length)];

  signResult.textContent = randomSign;
  showToast(`النموذج التجريبي تعرّف على: ${randomSign}`);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    phraseModal.classList.remove("open");
    accessibilityPanel.classList.remove("open");
  }
});
