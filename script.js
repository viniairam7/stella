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
const subtitleLang = document.getElementById("subtitleLang");

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
   CARREGAR VOZ (iOS / Chrome safe)
================================ */
function loadAndSelectVoice() {
  const voices = synth.getVoices();
  if (!voices.length) return;

  // Prioridade: vozes neurais / naturais
  selectedVoice =
    voices.find(v => v.name.toLowerCase().includes("natural")) ||
    voices.find(v => v.name.toLowerCase().includes("neural")) ||
    voices.find(v => v.name.includes("Google US English")) ||
    voices.find(v => v.lang === "en-US") ||
    voices[0];

  voicesLoaded = true;
  console.log("🎤 Voz selecionada:", selectedVoice.name);
}


/* iOS precisa de interação */
window.addEventListener("click", () => {
  if (!voicesLoaded) {
    synth.getVoices();
    loadAndSelectVoice();
  }
}, { once: true });

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

  recognition.onerror = (event) => {
    statusDiv.textContent = "❌ Microphone error. Try again.";
    console.error(event.error);
  };

  recognition.onend = () => {
    statusDiv.textContent = "⏹️ Waiting for answer...";
  };

} else {
  alert("Speech recognition not supported in this browser.");
}

/* ================================
   FUNÇÃO FALAR (VÍDEO + LEGENDA)
================================ */
function speak(textEn, textPt = null) {
  if (!textEn || !selectedVoice) return;

  // 🎤 FALA SEMPRE EM INGLÊS
  const utter = new SpeechSynthesisUtterance(textEn);
  utter.lang = "en-US";
  utter.voice = selectedVoice;

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

  utter.onerror = () => {
    videoSpeaking.classList.add("hidden");
    videoIdle.classList.remove("hidden");
  };

  // 📄 LEGENDA CONTROLADA PELO USUÁRIO
  const langSelect = document.getElementById("language-select");
  const selectedLang = langSelect?.value || "en";

  statusDiv.textContent =
    selectedLang === "pt" && textPt ? textPt : textEn;

  synth.cancel();
  synth.speak(utter);
}


function showSubtitles(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let index = 0;

  statusDiv.textContent = "";

  const interval = setInterval(() => {
    if (index >= sentences.length) {
      clearInterval(interval);
      return;
    }
    statusDiv.textContent = sentences[index].trim();
    index++;
  }, 1200); // tempo entre frases
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
    speak(
      "Hello! How can I help you today?",
      "Olá! Como posso te ajudar hoje?"
    );
    firstMicClick = false;

    setTimeout(() => recognition.start(), 1200);
  } else {
    recognition.start();
  }
};

/* ================================
   ENCERRAR SESSÃO
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
      const reply = data.reply || "Sorry, I didn't understand.";
      speak(reply);
    })
    .catch(() => {
      speak(
        "I'm sorry, I couldn't connect right now.",
        "Desculpa, não consegui me conectar agora."
      );
    });
}

/* ================================
   UPLOAD DE IMAGEM
================================ */
attachPhotoButton.onclick = () => fileUpload.click();

fileUpload.onchange = () => {
  const file = fileUpload.files[0];
  if (!file || !file.type.startsWith("image/")) return;

  statusDiv.textContent = "📸 Uploading image...";

  const reader = new FileReader();
  reader.onload = () => {
    sendImageForTranslation(reader.result, file.name);
  };
  reader.readAsDataURL(file);
};

function sendImageForTranslation(imageData, name) {
  fetch("YOUR_BACKEND_TRANSLATION_ENDPOINT", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageData, name })
  })
    .then(res => res.json())
    .then(data => {
      speak(
        data.translationResult,
        "Tradução concluída."
      );
    })
    .catch(() => {
      speak(
        "I couldn't translate the image.",
        "Não consegui traduzir a imagem."
      );
    });
}

/* ================================
   INIT
================================ */
loadAndSelectVoice();
