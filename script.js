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
    text.textContent = "I'm listening...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    text.textContent = "You said: " + transcript;
    fetchAIResponse(transcript);
  };

  recognition.onerror = (event) => {
    text.textContent = "Error: " + event.error;
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
  const utter = new SpeechSynthesisUtterance(textToSpeak);
  utter.lang = 'en-US';
  utter.voice = synth.getVoices().find(v => v.name.includes("Female") || v.name.includes("Samantha")) || null;
  synth.speak(utter);
}

function fetchAIResponse(message) {
  text.textContent = "Stella is thinking...";
  fetch("https://stella-7.onrender.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  })
    .then(res => res.json())
    .then(data => {
      const reply = data.reply || "Sorry, I didn’t get that.";
      text.textContent = "Stella: " + reply;
      speak(reply);
    })
    .catch(err => {
      text.textContent = "Error contacting Stella: " + err.message;
    });
}
