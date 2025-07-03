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
    replyAsStella(transcript);
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

function replyAsStella(input) {
  let response = "Can you repeat that, please?";
  if (input.toLowerCase().includes("hello")) {
    response = "Hello! How are you today?";
  } else if (input.toLowerCase().includes("how do you say")) {
    response = "Let me help you translate that.";
  } else if (input.toLowerCase().includes("thank you")) {
    response = "You're welcome! That's very polite.";
  }

  const utter = new SpeechSynthesisUtterance(response);
  utter.lang = 'en-US';
  utter.voice = synth.getVoices().find(v => v.name.includes("Female") || v.name.includes("Samantha")) || null;
  synth.speak(utter);
}
