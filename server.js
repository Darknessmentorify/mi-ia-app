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

// =======================
app.get("/", (req, res) => {
  res.send("IA DARKNESS funcionando 🚀");
});

// =======================
app.post("/telegram", async (req, res) => {

  const message = req.body.message;
  if (!message) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text || "";

  console.log("MENSAJE:", text);

  try {

    // 🔥 DETECCIÓN MEJORADA
    if (text.toLowerCase().includes("imagen")) {

      const prompt = text.replace(/imagen:?/i, "").trim();

      console.log("GENERANDO IMAGEN:", prompt);

      const img = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024"
      });

      const imageBase64 = img.data[0].b64_json;

      await fetch(`${TELEGRAM_URL}/sendPhoto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          photo: `data:image/png;base64,${imageBase64}`
        })
      });

      return res.sendStatus(200);
    }

    // 💬 CHAT NORMAL
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
