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

    // START
    if (text === "/start") {
      await send(chatId, "🚀 IA DARKNESS funcionando 💀");
      return res.sendStatus(200);
    }

    // IMÁGENES
    if (text.startsWith("/imagen")) {

      const prompt = text.replace("/imagen", "").trim();

      if (!prompt) {
        await send(chatId, "Escribe algo después de /imagen");
        return res.sendStatus(200);
      }

      await send(chatId, "🎨 Creando imagen...");

      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024"
      });

      const image = result.data[0].b64_json;

      await fetch(`${TELEGRAM_URL}/sendPhoto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          photo: `data:image/png;base64,${image}`
        })
      });

      return res.sendStatus(200);
    }

    // CHAT NORMAL
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres IA DARKNESS, respondes claro y directo." },
        { role: "user", content: text }
      ]
    });

    const respuesta = completion.choices?.[0]?.message?.content || "Sin respuesta";

    await send(chatId, respuesta);

    res.sendStatus(200);

  } catch (error) {
    console.log(error);
    res.sendStatus(200);
  }
});

// =======================
// 📩 ENVIAR MENSAJE
// =======================
async function send(chatId, text) {
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
  res.send("IA DARKNESS funcionando 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Bot corriendo 🚀");
});
