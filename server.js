import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/texto", async (req, res) => {
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

app.get("/", (req, res) => {
  res.send("Servidor IA activo 🚀");
});
app.get("/test", async (req, res) => {
  const prompt = req.query.q || "Hola";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: prompt }
      ]
    });

    res.send(completion.choices[0].message.content);

  } catch (error) {
    res.send("Error: " + error.message);
  }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
