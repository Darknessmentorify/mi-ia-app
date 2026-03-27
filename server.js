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

// 🔹 Ruta principal (chat)
app.post("/text", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).json({
        error: "Falta el prompt",
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
    res.status(500).json({
      error: "Error con OpenAI",
      detalle: error.message,
    });
  }
});

// 🔹 Ruta raíz
app.get("/", (req, res) => {
  res.send("IA DARKNESS activa 🚀");
});

// 🔹 🔥 ESTA ES LA QUE TE FALTA
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

// 🔹 Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
