require('dotenv').config();
const { OpenAI } = require("openai"); // Importação correta da SDK
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://stella-7.onrender.com", // apenas o domínio
    "X-Title": "Stella"
  }
});

app.post("/perguntar", async (req, res) => {
  const { pergunta } = req.body;

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Você é uma professora de inglês da Star Idiomas. Deve ouvir o usuário, ensinar a falar inglês corretamente e tirar dúvidas."
        },
        { role: "user", content: pergunta }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    const reply = chatResponse.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Falha ao obter resposta da Stella." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Stella backend rodando na porta ${PORT}`);
});
