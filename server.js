import express from "express";
import fetch from "node-fetch";
import OpenAI from "openai";
import FormData from "form-data";

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// =======================
// TEST
// =======================
app.get("/", (req, res) => {
  res.send("IA DARKNESS funcionando 🚀");
});

// =======================
// TELEGRAM
// =======================
app.post("/telegram", async (req, res) => {

  const message = req.body.message;
  if (!message) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = (message.text || "").toLowerCase().trim();

  try {

    console.log("MENSAJE:", text);

    // =======================
    // 🖼️ IMÁGENES
    // =======================
    if (
      text.startsWith("imagen") ||
      text.includes("crear imagen") ||
      text.includes("haz una imagen") ||
      text.includes("genera imagen")
    ) {

      let prompt = text
        .replace("imagen:", "")
        .replace("imagen", "")
        .replace("crear imagen", "")
        .replace("haz una imagen", "")
        .replace("genera imagen", "")
        .trim();

      if (!prompt) {
        prompt = "una imagen futurista épica";
      }

      console.log("GENERANDO IMAGEN:", prompt);

      const img = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: "512x512" // más barato 💰
      });

      const imageBase64 = img.data[0].b64_json;
      const imageBuffer = Buffer.from(imageBase64, "base64");

      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("photo", imageBuffer, {
        filename: "imagen.png"
      });

      await fetch(`${TELEGRAM_URL}/sendPhoto`, {
        method: "POST",
        body: form
      });

      return res.sendStatus(200);
    }

    // =======================
    // 💬 CHAT NORMAL
    // =======================
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres IA DARKNESS. Puedes crear imágenes si el usuario lo pide." },
        { role: "user", content: text }
      ]
    });

    const respuesta = completion.choices?.[0]?.message?.content || "Error";

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
    console.log("ERROR:", error);
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo 🚀");
});
