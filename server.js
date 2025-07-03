require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// OpenRouter SDK
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://bible-chat-11.onrender.com", // apenas o domínio
    "X-Title": "Airam Chat Bíblico"
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
            "Você é um assistente bíblico. Responda com base na Bíblia Sagrada Evangélica, versão NVI. Responda informando conexões bíblicas e direcionando para versículos."
        },
        { role: "user", content: pergunta }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    const respostaFinal = chatResponse.choices[0].message.content;
    res.json({ resposta: respostaFinal });
  } catch (err) {
    console.error("Erro ao chamar OpenRouter:", err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao buscar resposta da IA" });
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
