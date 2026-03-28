import express from "express";
import fetch from "node-fetch";
import OpenAI from "openai";

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// 🧠 MEMORIA (por usuario)
const chats = {};

// =======================
// TEST
// =======================
app.get("/", (req, res) => {
  res.send("IA DARKNESS funcionando 🚀");
});

// =======================
// TELEGRAM BOT
// =======================
app.post("/telegram", async (req, res) => {

  const message = req.body.message;
  if (!message) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text || "";

  try {

    // 👉 crear memoria si no existe
    if (!chats[chatId]) {
      chats[chatId] = [
        { role: "system", content: "Eres IA DARKNESS, recuerdas todo lo que el usuario dice." }
      ];
    }

    // 👉 guardar mensaje del usuario
    chats[chatId].push({
      role: "user",
      content: text
    });

    // 👉 limitar memoria (opcional para no gastar de más)
    if (chats[chatId].length > 20) {
      chats[chatId].shift(); // borra el más viejo
    }

    // 💬 IA responde con TODO el historial
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chats[chatId]
    });

    const respuesta = completion.choices?.[0]?.message?.content || "No entendí";

    // 👉 guardar respuesta también
    chats[chatId].push({
      role: "assistant",
      content: respuesta
    });

    // 📤 enviar a Telegram
    await fetch(`${TELEGRAM_URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: respuesta
      })
    });

  } catch (error) {
    console.log(error);
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo 🚀");
});
