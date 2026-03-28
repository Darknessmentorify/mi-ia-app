import express from "express";
import cors from "cors";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// crear carpeta uploads si no existe
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Telegram
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// =======================
// 🧠 CHAT WEB (TU HTML)
// =======================
app.post("/text", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ respuesta: "Escribe algo..." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres IA DARKNESS, respondes claro y directo." },
        { role: "user", content: prompt }
      ]
    });

    const respuesta = completion.choices?.[0]?.message?.content || "Sin respuesta";

    res.json({ respuesta });

  } catch (error) {
    console.log(error);
    res.json({ respuesta: "Error 💀" });
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

    const imageBase64 = result.data[0].b64_json;

    res.json({
      image: `data:image/png;base64,${imageBase64}`
    });

  } catch (error) {
    console.log(error);
    res.json({ error: "Error generando imagen" });
  }
});

// =======================
// 🖼️ EDITAR IMAGEN
// =======================
app.post("/edit-image", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const file = req.file;

    if (!file || !prompt) {
      return res.json({ error: "Falta imagen o prompt" });
    }

    const result = await openai.images.edits({
      model: "gpt-image-1",
      image: fs.createReadStream(file.path),
      prompt: prompt,
      size: "1024x1024"
    });

    const imageBase64 = result.data[0].b64_json;

    res.json({
      image: `data:image/png;base64,${imageBase64}`
    });

    fs.unlinkSync(file.path);

  } catch (error) {
    console.log(error);
    res.json({ error: "Error editando imagen" });
  }
});

// =======================
// 🤖 TELEGRAM BOT
// =======================
app.post("/telegram", async (req, res) => {

  try {

    const message = req.body.message;
    if (!message) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = message.text || "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres IA DARKNESS" },
        { role: "user", content: text }
      ]
    });

    const respuesta = completion.choices?.[0]?.message?.content || "Sin respuesta";

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

    res.sendStatus(200);

  } catch (error) {
    console.log(error);
    res.sendStatus(200);
  }
});

// =======================
// 🟢 TEST
// =======================
app.get("/test", (req, res) => {
  res.send("IA DARKNESS funcionando 🚀");
});

// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo 🚀");
});
