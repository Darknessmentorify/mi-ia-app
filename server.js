import express from "express";
import cors from "cors";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// =======================
// 📁 UPLOADS
// =======================
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

// =======================
// 🔐 API KEYS (SEGURAS)
// =======================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// =======================
// 🧠 CHAT WEB (CON MEMORIA)
// =======================
app.post("/text", async (req, res) => {
  try {
    const { messages } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres IA DARKNESS, respondes claro y recuerdas todo." },
        ...(messages || [])
      ]
    });

    const respuesta =
      completion.choices?.[0]?.message?.content || "Sin respuesta";

    res.json({ respuesta });

  } catch (error) {
    console.log(error);
    res.json({ respuesta: "Error en IA 💀" });
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
      prompt,
      size: "512x512"
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
// 🖼️ EDITAR IMAGEN
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
    res.status(500).json({ error: "Error editando imagen" });
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
    const text = message.text;

    // 🔹 comando imagen
    if (text && text.startsWith("/imagen")) {
      const prompt = text.replace("/imagen", "").trim();

      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "512x512"
      });

      const image = result.data[0].b64_json;

      await fetch(`${TELEGRAM_URL}/sendPhoto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          photo: `data:image/png;base64,${image}`
        })
      });

      return res.sendStatus(200);
    }

    // 🔹 chat normal
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres IA DARKNESS" },
        { role: "user", content: text }
      ]
    });

    const respuesta =
      completion.choices?.[0]?.message?.content || "Sin respuesta";

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
  console.log("Servidor corriendo en puerto " + PORT);
});
