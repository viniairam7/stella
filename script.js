const micBtn = document.getElementById('mic-btn');
const stopBtn = document.getElementById('stop-btn');
const speakIndicator = document.getElementById('speak-indicator');
const text = document.getElementById('text');

let recognition;
let synth = window.speechSynthesis;

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

function speak(textToSpeak) {
  if (!textToSpeak) return;

  const utter = new SpeechSynthesisUtterance(textToSpeak);
  utter.lang = 'en-US';

  // Selecionar uma voz feminina se possível
  const availableVoices = synth.getVoices();
  const preferredVoice = availableVoices.find(voice => 
    voice.name.includes("Female") || voice.name.includes("Samantha") || voice.name.includes("Google US English")
  );

  if (preferredVoice) {
    utter.voice = preferredVoice;
  }

  synth.cancel(); // Para evitar sobreposição de vozes
  synth.speak(utter);
}

function fetchAIResponse(message) {
  text.textContent = "Stella is thinking...";
  
  fetch("https://stella-7.onrender.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pergunta: message })  // nome do campo deve ser "pergunta"
  })
    .then(res => res.json())
    .then(data => {
      const reply = data.reply || "Sorry, I didn’t get that.";
      text.textContent = "Stella: " + reply;
      speak(reply); // Stella fala aqui 🎤
    })
    .catch(err => {
      text.textContent = "❌ Error contacting Stella: " + err.message;
    });
}
