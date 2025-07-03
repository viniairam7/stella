require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "openai/gpt-4o",
      messages: [
        { role: "system", content: "Você é uma professora de inglês da Star Idiomas. Deve ouvir o usuário, ensinar a falar inglês corretamente e tirar dúvidas." },
        { role: "user", content: userMessage }
      ]
    }, {
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
