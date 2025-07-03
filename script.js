const startBtn = document.getElementById("start-button");
const stopBtn = document.getElementById("stop-button");
const statusDiv = document.getElementById("status"); // Elemento para exibir o status/texto
const starElement = document.getElementById("star"); // O elemento da estrela para animação

let recognition;
const synth = window.speechSynthesis;
let selectedVoice = null;
let voicesLoaded = false; // Flag para controlar se as vozes foram carregadas
let firstMicClick = true; // Flag para controlar o primeiro clique no botão do microfone

// Função para carregar e selecionar a voz
function loadAndSelectVoice() {
  const voices = synth.getVoices();
  if (voices.length > 0) {
    selectedVoice = voices.find(v =>
      v.name.includes("Samantha") || v.name.includes("Female") || v.name.includes("Google US English") || v.lang === 'en-US'
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

// CRÍTICO PARA IOS: Força o carregamento das vozes no primeiro toque do usuário na página
window.addEventListener('click', () => {
  if (!voicesLoaded) { // Só carrega se ainda não tiver carregado
    synth.getVoices(); // Força o carregamento das vozes no iOS
    loadAndSelectVoice(); // Tenta carregar e selecionar a voz
    console.log("Vozes carregadas ou tentativa de carregamento acionada por clique inicial na página.");
  }
}, { once: true }); // Executa apenas uma vez

// Tenta carregar as vozes quando elas mudam (pode não disparar sem interação no iOS inicialmente)
window.speechSynthesis.onvoiceschanged = () => {
  if (!voicesLoaded) {
    loadAndSelectVoice();
  }
};


// Inicialização do webkitSpeechRecognition
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false; // Define como false para parar após uma frase
  recognition.interimResults = false; // Não retorna resultados intermediários

  recognition.onstart = () => {
    statusDiv.textContent = "✨ Stella is listening...";
    starElement.classList.add('speaking'); // Adiciona a classe para animar a estrela
    console.log("Reconhecimento de voz iniciado.");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    statusDiv.textContent = "🗣️ You said: " + transcript;
    starElement.classList.remove('speaking'); // Remove a animação após o resultado
    console.log("Você disse:", transcript);
    sendToStella(transcript);
  };

  recognition.onerror = (event) => {
    statusDiv.textContent = "❌ Error: " + event.error + ". Please try again.";
    console.error("Speech Recognition Error:", event.error);
    starElement.classList.remove('speaking'); // Remove a animação em caso de erro
    if (event.error === 'not-allowed') {
      alert("Microphone access denied. Please allow microphone permissions in your browser settings.");
    }
  };

  recognition.onend = () => {
    statusDiv.textContent = "⏹️ Touch to speak again!"; // Mensagem clara para o usuário
    starElement.classList.remove('speaking'); // Remove a animação quando a gravação termina
    console.log("Reconhecimento de voz encerrado.");
  };
} else {
  statusDiv.textContent = "❌ Speech recognition is not supported in this browser.";
  alert("Speech recognition is not supported in this browser. Please use Chrome on Android/Desktop or Safari on iOS.");
}

// Evento de clique do botão de iniciar (microfone)
startBtn.onclick = () => {
  console.log("Botão de microfone clicado.");

  // Garante que a voz seja carregada antes de iniciar, crucial para iOS
  if (!voicesLoaded) {
      loadAndSelectVoice(); // Tenta carregar a voz
      if (!selectedVoice) {
          statusDiv.textContent = "Please wait, loading Stella's voice...";
          console.warn("Voz ainda não carregada.");
          // Se a voz ainda não carregou, o reconhecimento de voz ainda pode tentar iniciar.
          if (recognition) {
              try {
                  recognition.start();
              } catch (e) {
                  console.error("Erro ao tentar iniciar o reconhecimento de voz:", e);
                  statusDiv.textContent = "❌ Error starting microphone. Check permissions.";
              }
          }
          return; // Sai da função para evitar chamar start() duas vezes ou sem voz.
      }
  }

  // Se é o primeiro clique no microfone E as vozes estão carregadas, faça a Stella dizer "Hello!"
  if (firstMicClick && selectedVoice) {
      speak("Hello! How can I help you?");
      firstMicClick = false; // Desativa a flag para não falar novamente na próxima vez
      // Dê um pequeno atraso antes de iniciar o reconhecimento para a fala inicial completar
      setTimeout(() => {
          if (recognition) {
              try {
                  recognition.start();
              } catch (e) {
                  console.error("Erro ao tentar iniciar o reconhecimento de voz (após 'Hello'):", e);
                  statusDiv.textContent = "❌ Error starting microphone. Check permissions.";
              }
          }
      }, 1000); // Ajuste o atraso se necessário
  } else {
      // Para cliques subsequentes ou se a voz ainda não carregou (mas o reconhecimento pode tentar)
      if (recognition) {
          try {
              recognition.start();
          } catch (e) {
              console.error("Erro ao tentar iniciar o reconhecimento de voz (subsequente):", e);
              statusDiv.textContent = "❌ Error starting microphone. Check permissions.";
          }
      } else {
        statusDiv.textContent = "Speech recognition is not initialized.";
      }
  }
};

// Evento de clique do botão de parar
stopBtn.onclick = () => {
  if (recognition) {
    recognition.stop();
    console.log("Reconhecimento de voz parado manualmente.");
  }
};

// Função para a Stella falar
function speak(textToSpeak) {
  if (!textToSpeak) {
    console.warn("Nenhum texto para falar.");
    return;
  }
  if (!selectedVoice) {
    console.warn("Voz não selecionada para falar. Tentando carregar novamente.");
    loadAndSelectVoice(); // Tenta carregar novamente
    statusDiv.textContent = "Loading voice, please try again soon.";
    return;
  }

  const utter = new SpeechSynthesisUtterance(textToSpeak);
  utter.lang = 'en-US';
  utter.voice = selectedVoice;

  utter.onstart = () => {
      starElement.classList.add('speaking'); // Anima a estrela quando Stella está falando
      console.log("Stella começou a falar.");
  };

  utter.onend = () => {
      starElement.classList.remove('speaking'); // Remove a animação quando Stella termina de falar
      console.log("Stella terminou de falar.");
  };

  utter.onerror = (event) => {
      console.error("Speech Synthesis Error:", event.error);
      starElement.classList.remove('speaking'); // Remove a animação em caso de erro
      statusDiv.textContent = "❌ Stella couldn't speak. Error: " + event.error;
  };

  synth.cancel(); // Cancela qualquer fala anterior para evitar sobreposição
  try {
      synth.speak(utter);
  } catch (e) {
      console.error("Erro ao tentar iniciar a síntese de fala:", e);
      statusDiv.textContent = "❌ Stella couldn't speak. Please try again.";
  }
}

// Função para enviar a pergunta para o backend da Stella (OpenRouter API)
function sendToStella(pergunta) {
  statusDiv.textContent = "✨ Stella is thinking...";
  fetch("https://stella-7.onrender.com/perguntar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pergunta })
  })
  .then(res => {
    if (!res.ok) {
        // Se a resposta não for 2xx, lance um erro para o .catch
        return res.json().then(errorData => {
            throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        });
    }
    return res.json();
  })
  .then(data => {
    const resposta = data.reply || "Sorry, I didn’t understand.";
    statusDiv.textContent = "✨ Stella: " + resposta;
    speak(resposta);
  })
  .catch(err => {
    console.error("Erro ao contatar Stella backend:", err);
    statusDiv.textContent = "❌ Error contacting Stella: " + err.message;
    speak("I'm sorry, I couldn't connect to my brain at the moment. Please try again.");
  });
}

// Inicializa o carregamento da voz ao carregar a página para navegadores que suportam
// (mas a interação do usuário ainda é chave para iOS).
loadAndSelectVoice();
