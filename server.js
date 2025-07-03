require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://stella-5.onrender.com", // apenas o domínio
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

      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get response from Stella." });
  }
});

app.listen(PORT, () => {
  console.log(`Stella backend running on port ${PORT}`);
});

            
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
