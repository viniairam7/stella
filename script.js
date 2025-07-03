const micBtn = document.getElementById('mic-btn');
const stopBtn = document.getElementById('stop-btn');
const speakIndicator = document.getElementById('star');
const text = document.getElementById('text');

let recognition;
let synth = window.speechSynthesis;
let selectedVoice = null;

function loadVoices() {
  const voices = synth.getVoices();
  if (!voices.length) return;
  selectedVoice = voices.find(voice =>
    voice.name.includes("Samantha") ||
    voice.name.includes("Karen") ||
    voice.name.includes("Daniel") ||
    voice.lang === "en-US"
  ) || voices[0];
}

window.speechSynthesis.onvoiceschanged = () => loadVoices();
window.addEventListener("click", () => loadVoices(), { once: true });

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
}

micBtn.onclick = () => {
  if (recognition) recognition.start();
};

stopBtn.onclick = () => {
  if (recognition) {
    recognition.stop();
    text.textContent = "Touch to speak with Stella";
  }
};

function speak(textToSpeak) {
  if (!textToSpeak || !selectedVoice) return;
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
    headers: { "Content-Type": "application/json" },
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
