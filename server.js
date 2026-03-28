import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Telegram
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// =======================
// 🤖 TELEGRAM BOT
// =======================
app.post("/telegram", async (req, res) => {

  try {

    const message = req.body.message;

    if (!message) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = message.text || "";

    // comandos básicos
    if (text === "/start") {
      await sendMessage(chatId, "👋 Hola, soy IA DARKNESS\nEscríbeme lo que quieras 💀");
      return res.sendStatus(200);
    }

    if (text === "/help") {
      await sendMessage(chatId, "Comandos:\n/start\n/help\nSolo escribe y te respondo 😈");
      return res.sendStatus(200);
    }

    // IA
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres IA DARKNESS, respondes claro y directo." },
        { role: "user", content: text }
      ]
    });

    const respuesta = completion.choices?.[0]?.message?.content || "Sin respuesta";

    await sendMessage(chatId, respuesta);

    res.sendStatus(200);

  } catch (error) {
    console.log(error);
    res.sendStatus(200);
  }
});

// =======================
// 📩 FUNCION ENVIAR MSG
// =======================
async function sendMessage(chatId, text) {
  await fetch(`${TELEGRAM_URL}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
}

// =======================
// 🟢 TEST
// =======================
app.get("/", (req, res) => {
  res.send("BOT TELEGRAM ACTIVO 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Bot corriendo 🚀");
});
