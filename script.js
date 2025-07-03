const startBtn = document.getElementById("start-button");
const stopBtn = document.getElementById("stop-button"); // Este botão não está mais no HTML, mas a variável pode ser mantida ou removida se não for usada em outro lugar.
const statusDiv = document.getElementById("status");
const starElement = document.getElementById("star");

// Novos elementos para os botões do rodapé
const attachPhotoButton = document.getElementById("attach-photo-button");
const endCallButton = document.getElementById("end-call-button");
const fileUpload = document.getElementById("file-upload"); // O input de arquivo escondido

let recognition;
const synth = window.speechSynthesis;
let selectedVoice = null;
let voicesLoaded = false;
let firstMicClick = true;

// Função para carregar e selecionar a voz
function loadAndSelectVoice() {
  const voices = synth.getVoices();
  if (voices.length > 0) {
    console.log("Vozes disponíveis:");
    voices.forEach((voice, index) => {
      console.log(`${index}: ${voice.name} (${voice.lang}) - Default: ${voice.default}`);
    });

    // Prioriza a voz "Alex" se disponível (boa qualidade no iOS)
    selectedVoice = voices.find(voice => voice.name === "Alex" && voice.lang === 'en-US');

    // Se "Alex" não for encontrada, tenta "Google US English" (boa no Chrome/Android)
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.name.includes("Google US English"));
    }

    // Se nenhuma das anteriores, tenta outras vozes femininas em inglês
    if (!selectedVoice) {
      selectedVoice = voices.find(v => (v.name.includes("Samantha") || v.name.includes("Female")) && v.lang.startsWith('en'));
    }

    // Fallback para qualquer voz em inglês
    if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang === 'en-US');
    }

    // Último fallback para a primeira voz disponível
    if (!selectedVoice) {
        selectedVoice = voices?.[0];
    }

    voicesLoaded = true;
    console.log("Voz selecionada:", selectedVoice ? selectedVoice.name : "Nenhuma voz preferida encontrada, usando fallback.");
  } else {
    console.warn("Nenhuma voz disponível ainda. Tentando novamente...");
  }
}

// CRÍTICO PARA IOS: Força o carregamento das vozes no primeiro toque do usuário na página
window.addEventListener('click', () => {
  if (!voicesLoaded) {
    synth.getVoices();
    loadAndSelectVoice();
    console.log("Vozes carregadas ou tentativa de carregamento acionada por clique inicial na página.");
  }
}, { once: true });

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
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    statusDiv.textContent = "✨ Stella is listening...";
    starElement.classList.add('speaking');
    console.log("Reconhecimento de voz iniciado.");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    statusDiv.textContent = "🗣️ You said: " + transcript;
    starElement.classList.remove('speaking');
    console.log("Você disse:", transcript);
    sendToStella(transcript);
  };

  recognition.onerror = (event) => {
    statusDiv.textContent = "❌ Error: " + event.error + ". Please try again.";
    console.error("Speech Recognition Error:", event.error);
    starElement.classList.remove('speaking');
    if (event.error === 'not-allowed') {
      alert('Permissão de microfone negada. Por favor, verifique as configurações do seu navegador.');
    }
  };

  recognition.onend = () => {
    statusDiv.textContent = "⏹️ Wait the aswer. Touch again to talk!";
    starElement.classList.remove('speaking');
    console.log("Reconhecimento de voz encerrado.");
  };
} else {
  statusDiv.textContent = "❌ Speech recognition is not supported in this browser.";
  alert("Speech recognition is not supported in this browser. Please use Chrome on Android/Desktop or Safari on iOS.");
}

// Evento de clique do botão de iniciar (microfone)
startBtn.onclick = () => {
  console.log("Botão de microfone clicado.");

  if (!voicesLoaded) {
      loadAndSelectVoice();
      if (!selectedVoice) {
          statusDiv.textContent = "Please wait, loading Stella's voice...";
          console.warn("Voz ainda não carregada.");
          if (recognition) {
              try {
                  recognition.start();
              } catch (e) {
                  console.error("Erro ao tentar iniciar o reconhecimento de voz:", e);
                  statusDiv.textContent = "❌ Error starting microphone. Check permissions.";
              }
          }
          return;
      }
  }

  if (firstMicClick && selectedVoice) {
      speak("Hello! How can I help you?");
      firstMicClick = false;
      setTimeout(() => {
          if (recognition) {
              try {
                  recognition.start();
              } catch (e) {
                  console.error("Erro ao tentar iniciar o reconhecimento de voz (após 'Hello'):", e);
                  statusDiv.textContent = "❌ Error starting microphone. Check permissions.";
              }
          }
      }, 1000);
  } else {
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

// Evento de clique do botão de parar (stopBtn não está mais no HTML, mas a função speak ainda usa synth.cancel)
// Se você quiser um botão de pausa real, precisaria reintroduzi-lo no HTML.
// Por enquanto, o botão 'X' (endCallButton) pode ser usado para parar a sessão.

// Evento de clique do botão de encerrar (X)
endCallButton.onclick = () => {
  console.log("Botão de encerrar clicado.");
  if (recognition) {
    recognition.stop(); // Para o reconhecimento de voz
  }
  synth.cancel(); // Para qualquer fala em andamento
  statusDiv.textContent = "Session ended. Touch to talk!";
  starElement.classList.remove('speaking'); // Garante que a animação pare
  firstMicClick = true; // Opcional: Reseta para que "Hello!" seja dito novamente na próxima sessão
  // Você pode adicionar aqui qualquer outra lógica para "encerrar a chamada"
};


// Função para a Stella falar
function speak(textToSpeak) {
  if (!textToSpeak) {
    console.warn("Nenhum texto para falar.");
    return;
  }
  if (!selectedVoice) {
    console.warn("Voz não selecionada para falar. Tentando carregar novamente.");
    loadAndSelectVoice();
    statusDiv.textContent = "Loading voice, please try again soon.";
    return;
  }

  const utter = new SpeechSynthesisUtterance(textToSpeak);
  utter.lang = 'en-US';
  utter.voice = selectedVoice;

  utter.onstart = () => {
      starElement.classList.add('speaking');
      console.log("Stella começou a falar.");
  };

  utter.onend = () => {
      starElement.classList.remove('speaking');
      console.log("Stella terminou de falar.");
  };

  utter.onerror = (event) => {
      console.error("Speech Synthesis Error:", event.error);
      starElement.classList.remove('speaking');
      statusDiv.textContent = "❌ Stella couldn't speak. Error: " + event.error;
  };

  synth.cancel();
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

// Lógica para o botão de anexar foto para tradução
attachPhotoButton.onclick = () => {
  fileUpload.click(); // Simula um clique no input de arquivo escondido
};

fileUpload.onchange = () => {
  const file = fileUpload.files?.[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      statusDiv.textContent = "🚫 Por favor, selecione um arquivo de imagem.";
      alert("Por favor, selecione um arquivo de imagem (JPEG, PNG, GIF, etc.).");
      return;
    }

    statusDiv.textContent = "⏳ Carregando imagem para tradução...";
    const reader = new FileReader();
    reader.onload = function(event) {
      const imageDataUrl = event.target?.result; // Conteúdo da imagem em Base64
      if (imageDataUrl) {
        // Envie o Base64 da imagem para o seu backend
        sendImageForTranslation(imageDataUrl, file.name);
      } else {
        statusDiv.textContent = "❌ Falha ao ler a imagem.";
      }
    };
    reader.onerror = function() {
      statusDiv.textContent = "❌ Erro ao ler a imagem.";
    };
    reader.readAsDataURL(file); // Lê o arquivo como Data URL (Base64)
  } else {
    statusDiv.textContent = "🚫 Nenhuma imagem selecionada.";
  }
};

function sendImageForTranslation(imageDataUrl, fileName) {
  statusDiv.textContent = "📡 Enviando imagem para tradução...";
  // IMPORTANTE: Substitua 'YOUR_BACKEND_TRANSLATION_ENDPOINT' pela URL real do seu backend
  // que irá processar a imagem e enviá-la para um serviço de tradução de imagem/OCR.
  fetch("YOUR_BACKEND_TRANSLATION_ENDPOINT", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ imageData: imageDataUrl, name: fileName })
  })
  .then(res => {
    if (!res.ok) {
        return res.json().then(errorData => {
            throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        });
    }
    return res.json();
  })
  .then(data => {
    const translationResult = data.translationResult || "No translation found.";
    statusDiv.textContent = "✅ Tradução concluída: " + translationResult;
    speak(translationResult); // Stella pode falar a tradução
  })
  .catch(err => {
    console.error("Erro ao enviar imagem para tradução:", err);
    statusDiv.textContent = "❌ Erro ao traduzir imagem: " + err.message;
    speak("I'm sorry, I couldn't translate the image at the moment.");
  });
}

// Inicializa o carregamento da voz ao carregar a página
loadAndSelectVoice();
