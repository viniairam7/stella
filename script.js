const startBtn = document.getElementById("start-button");
const stopBtn = document.getElementById("stop-button");
const statusDiv = document.getElementById("status"); // Elemento para exibir o status/texto
const starElement = document.getElementById("star"); // O elemento da estrela para animação

let recognition;
const synth = window.speechSynthesis;
let selectedVoice = null;
let voicesLoaded = false; // Flag para controlar se as vozes foram carregadas

// Função para carregar e selecionar a voz
function loadAndSelectVoice() {
  const voices = synth.getVoices();
  if (voices.length > 0) {
    selectedVoice = voices.find(v =>
      v.name.includes("Samantha") || v.name.includes("Female") || v.name.includes("Google US English")
    );
    if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang === 'en-US'); // Fallback para qualquer voz em inglês
    }
    if (!selectedVoice) {
        selectedVoice = voices[0]; // Último fallback para a primeira voz disponível
    }
    voicesLoaded = true;
    console.log("Voz selecionada:", selectedVoice ? selectedVoice.name : "Nenhuma voz em inglês encontrada, usando a primeira disponível.");
  } else {
    console.warn("Nenhuma voz disponível ainda. Tentando novamente...");
  }
}

// 1. Tenta carregar as vozes quando elas mudam (pode não disparar sem interação no iOS inicialmente)
window.speechSynthesis.onvoiceschanged = () => {
  if (!voicesLoaded) { // Só carrega se ainda não tiver carregado
    loadAndSelectVoice();
  }
};

// 2. Essencial para iOS: Força o carregamento das vozes no primeiro toque do usuário
// E também tenta inicializar o reconhecimento de voz aqui, se necessário.
window.addEventListener('click', () => {
  if (!voicesLoaded) {
    synth.getVoices(); // Força o carregamento das vozes no iOS
    loadAndSelectVoice(); // Tenta carregar e selecionar a voz
  }
}, { once: true }); // Executa apenas uma vez


if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false; // Define como false para parar após uma frase
  recognition.interimResults = false; // Não retorna resultados intermediários

  recognition.onstart = () => {
    statusDiv.textContent = "✨ Stella is listening...";
    starElement.classList.add('speaking'); // Adiciona a classe para animar a estrela
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    statusDiv.textContent = "🗣️ You said: " + transcript;
    starElement.classList.remove('speaking'); // Remove a animação após o resultado
    sendToStella(transcript);
  };

  recognition.onerror = (event) => {
    statusDiv.textContent = "❌ Error: " + event.error + ". Please try again.";
    console.error("Speech Recognition Error:", event.error);
    starElement.classList.remove('speaking'); // Remove a animação em caso de erro
  };

  recognition.onend = () => {
    statusDiv.textContent = "⏹️ Touch to speak again!"; // Mensagem clara para o usuário
    starElement.classList.remove('speaking'); // Remove a animação quando a gravação termina
  };
} else {
  statusDiv.textContent = "❌ Speech recognition is not supported in this browser.";
  alert("Speech recognition is not supported in this browser. Please use Chrome on Android/Desktop or Safari on iOS.");
}

startBtn.onclick = () => {
  // Garante que a voz seja carregada antes de iniciar, crucial para iOS
  if (!voicesLoaded) {
      loadAndSelectVoice();
      if (!selectedVoice) {
          statusDiv.textContent = "Please wait, loading Stella's voice...";
          // Se a voz ainda não carregou, pode-se tentar um pequeno atraso ou informar o usuário
          setTimeout(() => {
              if (recognition) recognition.start();
          }, 500); // Pequeno atraso para dar tempo de carregar a voz, se não foi pelo clique inicial
          return;
      }
  }

  if (recognition) {
    recognition.start();
  } else {
    statusDiv.textContent = "Speech recognition is not initialized.";
  }
};

stopBtn.onclick = () => {
  if (recognition) {
    recognition.stop();
  }
};

function speak(textToSpeak) {
  if (!textToSpeak) {
    console.warn("Nenhum texto para falar.");
    return;
  }
  if (!selectedVoice) {
    console.warn("Voz não selecionada para falar.");
    statusDiv.textContent = "Loading voice, please try again soon.";
    return;
  }

  const utter = new SpeechSynthesisUtterance(textToSpeak);
  utter.lang = 'en-US';
  utter.voice = selectedVoice;

  utter.onstart = () => {
      starElement.classList.add('speaking'); // Anima a estrela quando Stella está falando
  };

  utter.onend = () => {
      starElement.classList.remove('speaking'); // Remove a animação quando Stella termina de falar
  };

  utter.onerror = (event) => {
      console.error("Speech Synthesis Error:", event.error);
      starElement.classList.remove('speaking'); // Remove a animação em caso de erro
  };

  synth.cancel(); // Cancela qualquer fala anterior
  synth.speak(utter);
}

function sendToStella(pergunta) {
  statusDiv.textContent = "✨ Stella is thinking...";
  // Ajuste a URL do seu backend se for diferente do que está no `server.js`
  // O server.js usa '/perguntar', mas o script.js estava chamando a raiz.
  fetch("https://stella-7.onrender.com/perguntar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pergunta })
  })
  .then(res => res.json())
  .then(data => {
    const resposta = data.reply || "Sorry, I didn’t understand.";
    statusDiv.textContent = "✨ Stella: " + resposta;
    speak(resposta);
  })
  .catch(err => {
    console.error("Erro ao contatar Stella backend:", err);
    statusDiv.textContent = "❌ Error contacting Stella.";
    speak("I'm sorry, I couldn't connect to my brain at the moment. Please try again.");
  });
}

// Inicializa o carregamento da voz ao carregar a página, mas a interação do usuário ainda é chave para iOS.
// Isso ajuda navegadores que carregam as vozes mais cedo.
loadAndSelectVoice();
    .catch(err => {
      text.textContent = "❌ Error contacting Stella: " + err.message;
    });
}
