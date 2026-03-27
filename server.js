import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

// 🔥 IMPORTANTE: permitir conexiones desde cualquier web
app.use(cors({
  origin: "*"
}));

app.use(express.json());

// 🔑 OpenAI config (usa variable de Railway)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 Ruta principal de IA
app.post("/text", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).json({
        error: "Falta el prompt"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: prompt }
      ],
    });

    res.json({
      respuesta: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error("❌ ERROR:", error);

    res.status(500).json({
      error: "Error con OpenAI",
      detalle: error.message,
    });
  }
});

// 🟢 Ruta de prueba
app.get("/", (req, res) => {
  res.send("IA DARKNESS activa 🚀");
});

// 🔥 Puerto (Railway usa esto)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
