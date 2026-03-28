import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 VARIABLES (desde Railway)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// =======================
// 🟢 TEST (IMPORTANTE)
// =======================
app.get("/test", (req, res) => {
  res.send("IA DARKNESS funcionando 🚀");
});

// =======================
// 🤖 TELEGRAM BOT
// =======================
app.post("/telegram", async (req, res) => {

  try {

    const message = req.body.message;
    if (!message) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = message.text;

    // 👉 comando start
    if (text === "/start") {
      await fetch(`${TELEGRAM_URL}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "🚀 IA DARKNESS funcionando 💀"
        })
      });

      return res.sendStatus(200);
    }

    // 👉 generar imagen si empieza con /img
    if (text.startsWith("/img")) {

      const prompt = text.replace("/img", "").trim();

      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: "512x512"
      });

      const imageBase64 = result.data[0].b64_json;

      await fetch(`${TELEGRAM_URL}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: `data:image/png;base64,${imageBase64}`
        })
      });

      return res.sendStatus(200);
    }

    // 👉 CHAT NORMAL
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres IA DARKNESS, respondes claro y directo." },
        { role: "user", content: text }
      ]
    });

    const respuesta = completion.choices[0].message.content;

    await fetch(`${TELEGRAM_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: respuesta
      })
    });

    res.sendStatus(200);

  } catch (error) {
    console.log(error);
    res.sendStatus(200);
  }
});

// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo 🚀");
});      chat_id: chatId,
      text: text
    })
  });
}

// =======================
// 🟢 TEST
// =======================
app.get("/", (req, res) => {
  res.send("IA DARKNESS funcionando 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Bot corriendo 🚀");
});
