/* ===============================
   ELEMENTOS DA INTERFACE
================================ */
const startBtn = document.getElementById("start-button");
const stopBtn = document.getElementById("stop-button"); // mantido por compatibilidade
const statusDiv = document.getElementById("status");

const attachPhotoButton = document.getElementById("attach-photo-button");
const endCallButton = document.getElementById("end-call-button");
const fileUpload = document.getElementById("file-upload");

const videoIdle = document.getElementById("videoIdle");
const videoSpeaking = document.getElementById("videoSpeaking");
const subtitleLang = document.getElementById("subtitleLang");

/* ===============================
   ESTADO GLOBAL
================================ */
let recognition;
const synth = window.speechSynthesis;
let selectedVoice = null;
let voicesLoaded = false;
let firstMicClick = true;
let currentLang = "en";

/* ===============================
   TEXTOS (i18n)
================================ */
const TEXT = {
  en: {
    listening: "🎧 Stella is listening...",
    thinking: "✨ Stella is thinking...",
    waiting: "⏹️ Waiting for answer...",
    ended: "Session ended. Touch to talk!",
    loadingVoice: "Loading voice...",
    hello: "Hello! How can I help you?",
    errorConnect: "I'm sorry, I couldn't connect right now.",
    errorImage: "I couldn't translate the image."
  },
  pt: {
    listening: "🎧 Stella está ouvindo...",
    thinking: "✨ Stella está pensando...",
    waiting: "⏹️ Aguardando resposta...",
    ended: "Sessão encerrada. Toque para falar!",
    loadingVoice: "Carregando voz...",
    hello: "Olá! Como posso te ajudar?",
    errorConnect: "Desculpa, não consegui me conectar agora.",
    errorImage: "Não consegui traduzir a imagem."
  }
};

function t(key) {
  return TEXT[currentLang][key] || "";
}

/* ===============================
   CONTROLE DE VÍDEO
================================ */
function startSpeakingAnimation() {
  videoIdle?.classList.add("hidden");
  videoSpeaking?.classList.remove("hidden");
  videoSpeaking.currentTime = 0;
  videoSpeaking.play().catch(() => {});
}

function stopSpeakingAnimation() {
  videoSpeaking?.pause();
  videoSpeaking?.classList.add("hidden");
  videoIdle?.classList.remove("hidden");
}

/* ===============================
   VOZ (Speech Synthesis)
================================ */
function loadAndSelectVoice() {
  const voices = synth.getVoices();
  if (!voices.length) return;

  selectedVoice =
    voices.find(v => v.name === "Alex" && v.lang === "en-US") ||
    voices.find(v => v.name.includes("Google US English")) ||
    voices.find(v => v.lang === "en-US") ||
    voices[0];

  voicesLoaded = true;
  console.log("🎤 Voz selecionada:", selectedVoice.name);
}

/* iOS unlock */
window.addEventListener("click", () => {
  if (!voicesLoaded) {
    synth.getVoices();
    loadAndSelectVoice();
  }
}, { once: true });

speechSynthesis.onvoiceschanged = () => {
  if (!voicesLoaded) loadAndSelectVoice();
};

/* ===============================
   RECONHECIMENTO DE VOZ
================================ */
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    statusDiv.textContent = t("listening");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    statusDiv.textContent = "🗣️ " + transcript;
    sendToStella(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech error:", event.error);
  };

  recognition.onend = () => {
    statusDiv.textContent = t("waiting");
  };
} else {
  alert("Speech recognition not supported.");
}

/* ===============================
   FALAR (VÍDEO + LEGENDA)
================================ */
function speak(textEn, textPt = null) {
  if (!voicesLoaded || !textEn) return;

  const utter = new SpeechSynthesisUtterance(textEn);
  utter.voice = selectedVoice;
  utter.lang = "en-US";

  utter.onstart = startSpeakingAnimation;
  utter.onend = stopSpeakingAnimation;
  utter.onerror = stopSpeakingAnimation;

  statusDiv.textContent =
    currentLang === "pt" && textPt ? textPt : textEn;

  synth.cancel();
  synth.speak(utter);
}

/* ===============================
   CONTROLE DE IDIOMA
================================ */
subtitleLang?.addEventListener("change", () => {
  currentLang = subtitleLang.value;
  recognition.lang = currentLang === "pt" ? "pt-BR" : "en-US";
});

/* ===============================
   BOTÃO MICROFONE
================================ */
startBtn.onclick = () => {
  if (!voicesLoaded) {
    statusDiv.textContent = t("loadingVoice");
    loadAndSelectVoice();
    return;
  }

  if (firstMicClick) {
    speak(TEXT.en.hello, TEXT.pt.hello);
    firstMicClick = false;
    setTimeout(() => recognition.start(), 1200);
  } else {
    recognition.start();
  }
};

/* ===============================
   ENCERRAR SESSÃO
================================ */
endCallButton.onclick = () => {
  recognition?.stop();
  synth.cancel();
  stopSpeakingAnimation();
  statusDiv.textContent = t("ended");
  firstMicClick = true;
};

/* ===============================
   BACKEND STELLA (Render)
================================ */
function sendToStella(pergunta) {
  statusDiv.textContent = t("thinking");

  fetch("https://stella-7.onrender.com/perguntar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pergunta })
  })
    .then(res => res.json())
    .then(data => {
      const resposta = data.reply || "Sorry, I didn’t understand.";
      speak(resposta);
    })
    .catch(() => {
      speak(TEXT.en.errorConnect, TEXT.pt.errorConnect);
    });
}

/* ===============================
   UPLOAD DE IMAGEM
================================ */
attachPhotoButton.onclick = () => fileUpload.click();

fileUpload.onchange = () => {
  const file = fileUpload.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = () => {
    sendImageForTranslation(reader.result, file.name);
  };
  reader.readAsDataURL(file);
};

function sendImageForTranslation(imageDataUrl, fileName) {
  fetch("YOUR_BACKEND_TRANSLATION_ENDPOINT", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageData: imageDataUrl, name: fileName })
  })
    .then(res => res.json())
    .then(data => {
      speak(data.translationResult);
    })
    .catch(() => {
      speak(TEXT.en.errorImage, TEXT.pt.errorImage);
    });
}

/* ===============================
   INIT
================================ */
loadAndSelectVoice();
