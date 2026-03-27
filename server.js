import express from "express";
import cors from "cors";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";

const app = express();

app.use(cors());
app.use(express.json());

// crear carpeta uploads si no existe
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// =======================
// 🧠 CHAT
// =======================
app.post("/text", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Falta prompt" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres IA DARKNESS, respondes claro, útil y directo."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    res.json({
      respuesta: completion.choices[0].message.content
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error en chat" });
  }
});

// =======================
// 🎨 GENERAR IMAGEN
// =======================
app.post("/image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024"
    });

    res.json({
      image: `data:image/png;base64,${result.data[0].b64_json}`
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error generando imagen" });
  }
});

// =======================
// 🖼️ EDITAR IMAGEN (SIMULADO)
// =======================
app.post("/edit-image", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).json({ error: "Falta prompt" });
    }

    // usamos generate porque edits falla en Railway
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024"
    });

    res.json({
      image: `data:image/png;base64,${result.data[0].b64_json}`
    });

    // borrar archivo si existe
    if (req.file) fs.unlinkSync(req.file.path);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error editando imagen" });
  }
});

// =======================
// 🟢 TEST
// =======================
app.get("/test", (req, res) => {
  res.send("IA DARKNESS funcionando 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
