let audioUnlocked = false;

const micBtn = document.getElementById("mic-btn");
const stopBtn = document.getElementById("stop-btn");

const subtitleEN = document.getElementById("subtitle-en");
const subtitlePT = document.getElementById("subtitle-pt");

const videoIdle = document.getElementById("videoIdle");
const videoSpeaking = document.getElementById("videoSpeaking");

function safeText(el, text) {
  if (el) el.textContent = text;
}

const synth = window.speechSynthesis;
let voices = [];

function loadVoices() {
  voices = synth.getVoices();
}

loadVoices();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
}

function getFemaleEnglishVoice() {
  return (
    voices.find(v =>
      v.lang.startsWith("en") &&
      (
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("woman") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("google us")
      )
    ) ||
    voices.find(v => v.lang.startsWith("en")) ||
    voices[0] ||
    null
  );
}

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

async function speak(textEN) {
  if (!textEN) return;

  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(textEN);
  const voice = getFemaleEnglishVoice();

  if (voice) utterance.voice = voice;

  utterance.lang = "en-US";
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  utterance.volume = 1;

  utterance.onstart = () => {
    if (videoIdle && videoSpeaking) {
      videoIdle.classList.add("hidden");
      videoSpeaking.classList.remove("hidden");
      videoSpeaking.currentTime = 0;
      videoSpeaking.play().catch(() => {});
    }
  };

  utterance.onend = () => {
    if (videoIdle && videoSpeaking) {
      videoSpeaking.classList.add("hidden");
      videoIdle.classList.remove("hidden");
      videoIdle.play().catch(() => {});
    }
  };

  safeText(subtitleEN, textEN);
  safeText(subtitlePT, "Translating...");

  const pt = await translateToPT(textEN);
  safeText(subtitlePT, pt);

  synth.speak(utterance);
}

function unlockAudio() {
  if (audioUnlocked) return;

  const utterance = new SpeechSynthesisUtterance(" ");
  const voice = getFemaleEnglishVoice();

  if (voice) utterance.voice = voice;

  utterance.lang = "en-US";
  utterance.volume = 0;

  synth.speak(utterance);
  audioUnlocked = true;
}

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("Speech recognition not supported in this browser.");
}

const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = false;
recognition.interimResults = false;

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
