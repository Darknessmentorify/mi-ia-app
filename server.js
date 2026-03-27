import express from "express";
import cors from "cors";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";

const app = express();

app.use(cors());
app.use(express.json());

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
    const { messages } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres IA DARKNESS, respondes claro y recuerdas todo."
        },
        ...(messages || [])
      ]
    });

    const respuesta = completion.choices?.[0]?.message?.content || "Sin respuesta";

    res.json({ respuesta });

  } catch (error) {
    console.log(error);
    res.json({ respuesta: "Error en IA 💀" });
  }
});

// =======================
// 🎨 IMAGEN
// =======================
app.post("/image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "512x512"
    });

    res.json({
      image: `data:image/png;base64,${result.data[0].b64_json}`
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error imagen" });
  }
});

// =======================
app.post("/edit-image", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "512x512"
    });

    res.json({
      image: `data:image/png;base64,${result.data[0].b64_json}`
    });

    if (req.file) fs.unlinkSync(req.file.path);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error editando" });
  }
});

app.get("/test", (req, res) => {
  res.send("OK 🚀");
});

app.listen(3000, () => {
  console.log("Servidor corriendo");
});
