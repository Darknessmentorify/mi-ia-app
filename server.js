import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());
app.use(express.json());

// 🔑 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 MEMORIA
let conversaciones = {};

// 💬 CHAT
app.post("/text", async (req, res) => {
  try {
    const { prompt, userId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Falta prompt" });
    }

    // Crear memoria si no existe
    if (!conversaciones[userId]) {
      conversaciones[userId] = [
        {
          role: "system",
          content: "Eres IA DARKNESS, un asistente inteligente, fluido y profesional como ChatGPT."
        }
      ];
    }

    // guardar mensaje usuario
    conversaciones[userId].push({
      role: "user",
      content: prompt
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversaciones[userId],
    });

    const respuesta = completion.choices[0].message.content;

    // guardar respuesta IA
    conversaciones[userId].push({
      role: "assistant",
      content: respuesta
    });

    res.json({ respuesta });

  } catch (error) {
    res.status(500).json({
      error: "Error con OpenAI",
      detalle: error.message
    });
  }
});

// 🏠 ROOT
app.get("/", (req, res) => {
  res.send("IA DARKNESS activa 🚀");
});

// 🧪 TEST
app.get("/test", async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Hola" }
      ],
    });

    res.send(completion.choices[0].message.content);

  } catch (error) {
    res.send("Error: " + error.message);
  }
});

// 🚀 PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
