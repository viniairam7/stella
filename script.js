/* ================================
   ELEMENTOS DA INTERFACE
================================ */
const startBtn = document.getElementById("start-button");
const statusDiv = document.getElementById("status");

const attachPhotoButton = document.getElementById("attach-photo-button");
const endCallButton = document.getElementById("end-call-button");
const fileUpload = document.getElementById("file-upload");

const videoIdle = document.getElementById("videoIdle");
const videoSpeaking = document.getElementById("videoSpeaking");

/* ================================
   SPEECH SYNTHESIS
================================ */
const synth = window.speechSynthesis;
let selectedVoice = null;
let voicesLoaded = false;
let firstMicClick = true;

/* ================================
   SPEECH RECOGNITION
================================ */
let recognition;

/* ================================
   VOZ – DESKTOP + MOBILE SAFE
================================ */
function loadAndSelectVoice() {
  const voices = synth.getVoices();
  if (!voices.length) return;

  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  if (!isMobile) {
    selectedVoice =
      voices.find(v => v.name.toLowerCase().includes("natural")) ||
      voices.find(v => v.name.toLowerCase().includes("neural")) ||
      voices.find(v => v.name.includes("Google")) ||
      voices.find(v => v.lang === "en-US");
  } else {
    // mobile: melhor possível dentro da limitação
    selectedVoice = voices.find(v => v.lang === "en-US") || voices[0];
  }

  voicesLoaded = true;
  console.log("🎤 Voz selecionada:", selectedVoice?.name);
}

/* iOS precisa de interação */
window.addEventListener(
  "click",
  () => {
    if (!voicesLoaded) {
      synth.getVoices();
      loadAndSelectVoice();
    }
  },
  { once: true }
);

speechSynthesis.onvoiceschanged = loadAndSelectVoice;

/* ================================
   SPEECH RECOGNITION SETUP
================================ */
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    statusDiv.textContent = "🎧 Stella is listening...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    statusDiv.textContent = `🗣️ You said: ${transcript}`;
    sendToStella(transcript);
  };

  recognition.onerror = () => {
    statusDiv.textContent = "❌ Microphone error. Try again.";
  };

  recognition.onend = () => {
    statusDiv.textContent = "⏹️ Waiting for answer...";
  };
} else {
  alert("Speech recognition not supported.");
}

/* ================================
   TRADUÇÃO SOMENTE DA LEGENDA
================================ */
async function translateToPT(text) {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=en|pt`
    );
    const data = await res.json();
    return data.responseData.translatedText;
  } catch {
    return text;
  }
}

/* ================================
   FALAR (INGLÊS) + LEGENDA (EN/PT)
================================ */
const subtitleEN = document.getElementById("subtitle-en");
const subtitlePT = document.getElementById("subtitle-pt");

async function translateToPT(text) {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=en|pt`
    );
    const data = await res.json();
    return data.responseData.translatedText;
  } catch {
    return "";
  }
}

async function speak(textEn) {
  if (!textEn || !selectedVoice) return;

  // 🎤 fala SOMENTE em inglês
  const utter = new SpeechSynthesisUtterance(textEn);
  utter.lang = "en-US";
  utter.voice = selectedVoice;
  utter.rate = 0.95;
  utter.pitch = 1;
  utter.volume = 1;

  utter.onstart = () => {
    videoIdle.classList.add("hidden");
    videoSpeaking.classList.remove("hidden");
    videoSpeaking.currentTime = 0;
    videoSpeaking.play();
  };

  utter.onend = () => {
    videoSpeaking.pause();
    videoSpeaking.classList.add("hidden");
    videoIdle.classList.remove("hidden");
  };

  // 📄 legendas inteiras
  subtitleEN.textContent = textEn;
  subtitlePT.textContent = "Translating...";

  subtitlePT.textContent = await translateToPT(textEn);

  synth.cancel();
  synth.speak(utter);
}

/* ================================
   BOTÃO MICROFONE
================================ */
startBtn.onclick = () => {
  if (!voicesLoaded) {
    loadAndSelectVoice();
    statusDiv.textContent = "Loading voice...";
    return;
  }

  if (firstMicClick) {
    speak("Hello! How can I help you today?");
    firstMicClick = false;
    setTimeout(() => recognition.start(), 1200);
  } else {
    recognition.start();
  }
};

/* ================================
   ENCERRAR
================================ */
endCallButton.onclick = () => {
  recognition?.stop();
  synth.cancel();

  videoSpeaking.pause();
  videoSpeaking.classList.add("hidden");
  videoIdle.classList.remove("hidden");

  statusDiv.textContent = "Session ended. Touch to talk!";
  firstMicClick = true;
};

/* ================================
   BACKEND STELLA
================================ */
function sendToStella(question) {
  statusDiv.textContent = "✨ Stella is thinking...";

  fetch("https://stella-7.onrender.com/perguntar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pergunta: question })
  })
    .then(res => res.json())
    .then(data => {
      speak(data.reply || "Sorry, I didn't understand.");
    })
    .catch(() => {
      speak("I'm sorry, I couldn't connect right now.");
    });
}

/* ================================
   INIT
================================ */
loadAndSelectVoice();

