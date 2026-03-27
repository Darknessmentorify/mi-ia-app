import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

// 🔥 CONFIG
app.use(cors());
app.use(express.json());

// 🔑 API KEY (Railway)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🟢 TEST
app.get("/", (req, res) => {
  res.send("IA DARKNESS activa 🚀");
});

// =========================
// 💬 CHAT
// =========================
app.post("/text", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Falta mensaje" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres IA DARKNESS, una IA inteligente, clara y útil."
        },
        {
          role: "user",
          content: message
        }
      ],
    });

    res.json({
      reply: response.choices[0].message.content
    });

  } catch (error) {
    console.log("ERROR CHAT:", error);

    res.status(500).json({
      error: "Error en el chat",
      detalle: error.message
    });
  }
});

// =========================
// 🎨 IMÁGENES
// =========================
app.post("/image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Falta prompt" });
    }

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "512x512"
    });

    if (!result.data || !result.data[0].b64_json) {
      return res.status(500).json({
        error: "No se generó la imagen"
      });
    }

    const imageBase64 = result.data[0].b64_json;

    res.json({
      image: `data:image/png;base64,${imageBase64}`
    });

  } catch (error) {
    console.log("ERROR IMAGEN:", error);

    res.status(500).json({
      error: "Error generando imagen",
      detalle: error.message
    });
  }
});

// =========================
// 🚀 START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
