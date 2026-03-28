import express from "express";
import cors from "cors";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// carpeta uploads
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 🔥 AQUÍ VA TU TOKEN (EJEMPLO)
const TELEGRAM_TOKEN = "8608868969:AAGmst9r2-7maQfVCIAxrGPJJKVxLyiQjkc";
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// =======================
// 🧠 CHAT WEB
// =======================
app.post("/text", async (req, res) => {
  try {
    const { messages } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres IA DARKNESS" },
        ...(messages || [])
      ]
    });

    const respuesta = completion.choices?.[0]?.message?.content || "Sin respuesta";

    res.json({ respuesta });

  } catch (error) {
    console.log(error);
    res.json({ respuesta: "Error 💀" });
  }
});

// =======================
// 🤖 TELEGRAM BOT
// =======================
app.post("/telegram", async (req, res) => {

  const message = req.body.message;
  if (!message) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text;

  try {

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres IA DARKNESS" },
        { role: "user", content: text }
      ]
    });

    const respuesta = completion.choices?.[0]?.message?.content || "Sin respuesta";

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

// =======================
app.get("/test", (req, res) => {
  res.send("IA DARKNESS funcionando 🚀");
});

app.listen(3000, () => {
  console.log("Servidor corriendo");
});
