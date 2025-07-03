const micBtn = document.getElementById('mic-btn');
const stopBtn = document.getElementById('stop-btn');
const speakIndicator = document.getElementById('speak-indicator');
const text = document.getElementById('text');

let recognition;
const synth = window.speechSynthesis;

// Garante que as vozes sejam carregadas no iOS
window.speechSynthesis.onvoiceschanged = () => {
  synth.getVoices();
};

function initializeVoice() {
  const utter = new SpeechSynthesisUtterance("Initializing Stella's voice");
  utter.lang = 'en-US';
  synth.speak(utter);
}

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    speakIndicator.classList.add('speaking');
    text.textContent = "✨ Stella is listening...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    text.textContent = "You said: " + transcript;
    fetchAIResponse(transcript);
  };

  recognition.onerror = (event) => {
    text.textContent = "❌ Error: " + event.error;
  };

  recognition.onend = () => {
    speakIndicator.classList.remove('speaking');
  };
} else {
  alert("Speech recognition is not supported in this browser.");
}

micBtn.onclick = () => {
  initializeVoice(); // ⚠️ essencial para funcionar no iOS
  if (recognition) {
    recognition.start();
  }
};

stopBtn.onclick = () => {
  if (recognition) {
    recognition.stop();
    text.textContent = "Touch to speak with Stella";
  }
};

let selectedVoice = null;

function loadVoices() {
  const voices = synth.getVoices();
  if (!voices.length) return;

  selectedVoice = voices.find(voice =>
    voice.name.includes("Samantha") ||
    voice.lang === "en-US"
  ) || voices[0]; // fallback para primeira voz disponível
}

// Garante que as vozes sejam carregadas corretamente
window.speechSynthesis.onvoiceschanged = () => {
  loadVoices();
};

// Também tenta carregar as vozes após o primeiro clique
window.addEventListener("click", () => {
  loadVoices();
}, { once: true });

function speak(textToSpeak) {
  if (!textToSpeak || !selectedVoice) {
    console.warn("Voz não carregada ainda");
    return;
  }

  const utter = new SpeechSynthesisUtterance(textToSpeak);
  utter.voice = selectedVoice;
  utter.lang = 'en-US';

  synth.cancel();
  synth.speak(utter);
}


function fetchAIResponse(message) {
  text.textContent = "Stella is thinking...";

  fetch("https://stella-7.onrender.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pergunta: message })
  })
    .then(res => res.json())
    .then(data => {
      const reply = data.reply || "Sorry, I didn’t get that.";
      text.textContent = "Stella: " + reply;
      speak(reply);
    })
    .catch(err => {
      text.textContent = "❌ Error contacting Stella: " + err.message;
    });
}
