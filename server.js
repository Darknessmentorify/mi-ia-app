import express from "express";
import cors from "cors";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// 🧠 CHAT
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


// 🎨 GENERAR IMAGEN
app.post("/image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024"
    });

    const imageBase64 = result.data[0].b64_json;

    res.json({
      image: `data:image/png;base64,${imageBase64}`
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error generando imagen" });
  }
});


// 🖼️ EDITAR IMAGEN
app.post("/edit-image", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const file = req.file;

    if (!file || !prompt) {
      return res.status(400).json({ error: "Falta imagen o prompt" });
    }

    const result = await openai.images.edits({
      model: "gpt-image-1",
      image: fs.createReadStream(file.path),
      prompt: prompt,
      size: "512x512"
    });

    const imageBase64 = result.data[0].b64_json;

    res.json({
      image: `data:image/png;base64,${imageBase64}`
    });

    fs.unlinkSync(file.path);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error editando imagen" });
  }
});


// 🟢 TEST
app.get("/test", (req, res) => {
  res.send("IA DARKNESS funcionando 🚀");
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
