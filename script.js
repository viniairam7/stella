/* ================================
   ELEMENTOS DO DOM
================================ */
let audioUnlocked = false;

const micBtn = document.getElementById("mic-btn");
const stopBtn = document.getElementById("stop-btn");

const subtitleEN = document.getElementById("subtitle-en");
const subtitlePT = document.getElementById("subtitle-pt");

const videoIdle = document.getElementById("videoIdle");
const videoSpeaking = document.getElementById("videoSpeaking");

/* ================================
   FUNÇÃO SAFE (ANTI-NULL)
================================ */
function safeText(el, text) {
  if (el) el.textContent = text;
}

/* ================================
   SPEECH SYNTHESIS (VOZ)
================================ */
const synth = window.speechSynthesis;
let voices = [];

// carregar vozes (necessário para mobile / iOS)
function loadVoices() {
  voices = synth.getVoices();
}
loadVoices();

if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
}

// melhor voz possível SEM API externa
function getBestEnglishVoice() {
  if (!voices.length) return null;

  return (
    voices.find(v =>
      v.lang.startsWith("en") &&
      (
        v.name.includes("Google US") ||
        v.name.includes("Samantha") || // iOS
        v.name.includes("Karen") ||
        v.name.includes("Daniel") ||
        v.name.includes("English")
      )
    ) ||
    voices.find(v => v.lang.startsWith("en")) ||
    voices[0]
  );
}

/* ================================
   TRADUÇÃO (LEGENDA PT)
================================ */
async function translateToPT(text) {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|pt`
    );
    const data = await res.json();
    return data.responseData.translatedText;
  } catch {
    return "";
  }
}

/* ================================
   FALAR (INGLÊS) + LEGENDA (EN/PT)
================================ */
async function speak(textEN) {
  if (!textEN) return;

  synth.cancel();

  const utter = new SpeechSynthesisUtterance(textEN);
  const voice = getBestEnglishVoice();

  if (voice) utter.voice = voice;

  utter.lang = "en-US";
  utter.rate = 0.95;   // natural
  utter.pitch = 1.05; // mais humano
  utter.volume = 1;

  utter.onstart = () => {
    videoIdle?.classList.add("hidden");
    videoSpeaking?.classList.remove("hidden");
    if (videoSpeaking) {
      videoSpeaking.currentTime = 0;
      videoSpeaking.play();
    }
  };

  utter.onend = () => {
    videoSpeaking?.pause();
    videoSpeaking?.classList.add("hidden");
    videoIdle?.classList.remove("hidden");
  };

  safeText(subtitleEN, textEN);
  safeText(subtitlePT, "Translating...");

  const pt = await translateToPT(textEN);
  safeText(subtitlePT, pt);

  synth.speak(utter);
}

function unlockAudio() {
  if (audioUnlocked) return;

  const utter = new SpeechSynthesisUtterance(" ");
  const voice = getBestEnglishVoice();
  if (voice) utter.voice = voice;
  utter.lang = "en-US";
  utter.volume = 0;

  synth.speak(utter);
  audioUnlocked = true;

  console.log("🔓 Audio unlocked for mobile");
}


/* ================================
   SPEECH RECOGNITION
================================ */
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("Speech recognition not supported in this browser.");
}

const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = false;
recognition.interimResults = false;

/* ================================
   EVENTOS DE VOZ
================================ */
recognition.onstart = () => {
  safeText(subtitleEN, "Listening...");
  safeText(subtitlePT, "Ouvindo...");
};

recognition.onresult = (event) => {
  const userText = event.results[0][0].transcript;
  safeText(subtitleEN, userText);
  safeText(subtitlePT, "Processing...");
  sendToStella(userText);
};

recognition.onerror = () => {
  safeText(subtitleEN, "Tap the microphone and try again.");
  safeText(subtitlePT, "Toque no microfone e tente novamente.");
};

recognition.onend = () => {
  // evita bugs — não faz nada
};

/* ================================
   BACKEND STELLA (REAL)
================================ */
function sendToStella(question) {
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
   BOTÕES
================================ */
if (micBtn) {
  micBtn.onclick = () => {
    unlockAudio();
    synth.cancel();
    recognition.start();
  };
}

if (stopBtn) {
  stopBtn.onclick = () => {
    recognition.stop();
    synth.cancel();
    safeText(subtitleEN, "Session ended.");
    safeText(subtitlePT, "Sessão encerrada.");
  };
}

