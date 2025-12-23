require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post("/perguntar", async (req, res) => {
  const { pergunta } = req.body;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Você é uma professora de inglês da Star Idiomas chamada Stella. Sua missão é conversar com o usuário, ensinando inglês com clareza, corrigindo gentilmente e incentivando a prática oral e escrita. Você responde com frases naturais, educativas e envolventes."
          },
          {
            role: "user",
            content: pergunta
          }
        ],
        temperature: 0.7,
        max_tokens: 120
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://stella-7.onrender.com",
          "X-Title": "Stella"
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Erro ao chamar OpenRouter:", err.response?.data || err.message);
    res.status(500).json({ error: "❌ Falha ao obter resposta da Stella." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Stella backend running on port ${PORT}`);
});
