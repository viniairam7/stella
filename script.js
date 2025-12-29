/* =============================== ELEMENTOS DA INTERFACE ================================ */
const startBtn = document.getElementById("start-button");
const stopBtn = document.getElementById("stop-button"); // mantido por compatibilidade
const statusDiv = document.getElementById("status");
const attachPhotoButton = document.getElementById("attach-photo-button");
const endCallButton = document.getElementById("end-call-button");
const fileUpload = document.getElementById("file-upload");

// NOVOS ELEMENTOS (vídeo + legenda)
const videoIdle = document.getElementById("videoIdle");
const videoSpeaking = document.getElementById("videoSpeaking");
const subtitleLang = document.getElementById("subtitleLang");

/* =============================== VARIÁVEIS GLOBAIS ================================ */
let recognition;
const synth = window.speechSynthesis;
let selectedVoice = null;
let voicesLoaded = false;
let firstMicClick = true;

/* =============================== CONTROLE DE VÍDEO ================================ */
function startSpeakingAnimation() {
  videoIdle.classList.add("hidden");
  videoSpeaking.classList.remove("hidden");
  videoSpeaking.currentTime = 0;
  videoSpeaking.play();
}

function stopSpeakingAnimation() {
  videoSpeaking.pause();
  videoSpeaking.classList.add("hidden");
  videoIdle.classList.remove("hidden");
}

/* =============================== CARREGAMENTO E SELEÇÃO DE VOZ ================================ */
function loadAndSelectVoice() {
  const voices = synth.getVoices();
  if (!voices.length) {
    console.warn("Nenhuma voz disponível ainda.");
    return;
  }

  console.log("Vozes disponíveis:");
  voices.forEach((v, i) => console.log(${i}: ${v.name} (${v.lang})) );

  selectedVoice =
    voices.find(v => v.name === "Alex" && v.lang === "en-US") ||
    voices.find(v => v.name.includes("Google US English")) ||
    voices.find(v => v.lang === "en-US") ||
    voices[0];

  voicesLoaded = true;
  console.log("🎤 Voz selecionada:", selectedVoice.name);
}

/* iOS workaround */
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

speechSynthesis.onvoiceschanged = () => {
  if (!voicesLoaded) loadAndSelectVoice();
};

/* =============================== SPEECH RECOGNITION ================================ */
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    statusDiv.textContent = "🎧 Stella is listening...";
  };

  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    statusDiv.textContent = "🗣️ You said: " + transcript;
    sendToStella(transcript);
  };

  recognition.onerror = event => {
    console.error("Speech Recognition Error:", event.error);
    statusDiv.textContent = "❌ Error: " + event.error;
  };

  recognition.onend = () => {
    statusDiv.textContent = "⏹️ Waiting for answer...";
  };
} else {
  alert("Speech recognition not supported in this browser.");
}

/* =============================== FUNÇÃO FALAR (COM VÍDEO + LEGENDA) ================================ */
function speak(textEn, textPt = null) {
  if (!textEn || !selectedVoice) return;

  const utter = new SpeechSynthesisUtterance(textEn);
  utter.lang = "en-US";
  utter.voice = selectedVoice;

  utter.onstart = () => {
    startSpeakingAnimation();
  };

  utter.onend = () => {
    stopSpeakingAnimation();
  };

  utter.onerror = e => {
    console.error("Speech Synthesis Error:", e);
    stopSpeakingAnimation();
  };

  // Legenda dinâmica
const langSelect = document.getElementById("language-select");
const lang = langSelect ? langSelect.value : "en";

statusDiv.textContent = lang === "pt" && textPt ? textPt : textEn;

synth.cancel();
synth.speak(utter);
}


/* =============================== BOTÃO MICROFONE ================================ */
startBtn.onclick = () => {
  console.log("🎙️ Microfone clicado");

  if (!voicesLoaded) {
    loadAndSelectVoice();
    statusDiv.textContent = "Loading voice...";
    return;
  }

  if (firstMicClick) {
    speak(
      "Hello! How can I help you?",
      "Olá! Como posso te ajudar?"
    );
    firstMicClick = false;
    setTimeout(() => recognition.start(), 1200);
  } else {
    recognition.start();
  }
};

/* =============================== ENCERRAR SESSÃO ================================ */
endCallButton.onclick = () => {
  recognition?.stop();
  synth.cancel();
  stopSpeakingAnimation();
  statusDiv.textContent = "Session ended. Touch to talk!";
  firstMicClick = true;
};

/* =============================== BACKEND STELLA ================================ */
function sendToStella(pergunta) {
  statusDiv.textContent = "✨ Stella is thinking...";

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
    .catch(err => {
      console.error(err);
      speak(
        "I'm sorry, I couldn't connect right now.",
        "Desculpa, não consegui me conectar agora."
      );
    });
}

/* =============================== UPLOAD DE IMAGEM ================================ */
attachPhotoButton.onclick = () => fileUpload.click();

fileUpload.onchange = () => {
  const file = fileUpload.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;

  statusDiv.textContent = "📸 Uploading image...";
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
      speak(
        "I couldn't translate the image.",
        "Não consegui traduzir a imagem."
      );
    });
}

/* =============================== INIT ================================ */
loadAndSelectVoice();
