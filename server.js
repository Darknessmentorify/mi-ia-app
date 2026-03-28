import express from "express";
import fetch from "node-fetch";
import OpenAI from "openai";

const app = express();
app.use(express.json());

// ===== CONFIG =====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// ===== MEMORIA =====
const chats = {};
const admins = {};
const users = {};
const estados = {};

// ===== FUNCION RESPUESTA =====
async function reply(chatId, text, keyboard = null) {
  await fetch(`${TELEGRAM_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: keyboard
        ? { keyboard, resize_keyboard: true }
        : undefined
    })
  });
}

// ===== HOME =====
app.get("/", (req, res) => {
  res.send("IA DARKNESS funcionando 🚀");
});

// ===== TELEGRAM =====
app.post("/telegram", async (req, res) => {
  const message = req.body.message;
  if (!message) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text || "";

  try {

    // =========================
    // LOGIN ADMIN
    // =========================
    if (text.startsWith("/login")) {
      const [, user, pass] = text.split(" ");

      if (user === "Guillermo65" && pass === "Guillermito00.") {
        admins[chatId] = true;
        await reply(chatId, "✅ Admin logueado");
      } else {
        await reply(chatId, "❌ Credenciales incorrectas");
      }
      return res.sendStatus(200);
    }

    // =========================
    // START MENU
    // =========================
    if (text === "/start") {
      await reply(
        chatId,
        "🏠 Menú Principal",
        [
          ["🤖 IA", "💰 Mi cuenta"],
          ["⚙️ Admin"]
        ]
      );
      return res.sendStatus(200);
    }

    // =========================
    // ADMIN PANEL
    // =========================
    if (text === "⚙️ Admin") {
      if (!admins[chatId]) {
        await reply(chatId, "❌ No eres admin");
        return res.sendStatus(200);
      }

      await reply(
        chatId,
        "🛠 Panel Admin",
        [
          ["👥 Crear usuario"],
          ["⬅️ Atrás"]
        ]
      );
      return res.sendStatus(200);
    }

    // =========================
    // CREAR USUARIO (BOTON)
    // =========================
    if (text === "👥 Crear usuario") {
      if (!admins[chatId]) {
        await reply(chatId, "❌ No eres admin");
        return res.sendStatus(200);
      }

      estados[chatId] = "crear_usuario";
      await reply(chatId, "Escribe:\nID PLAN DIAS\nEjemplo:\n123456789 pro 30");
      return res.sendStatus(200);
    }

    // =========================
    // PROCESO CREAR USUARIO
    // =========================
    if (estados[chatId] === "crear_usuario") {
      const [id, plan, dias] = text.split(" ");

      users[id] = {
        plan,
        expires: Date.now() + dias * 86400000
      };

      estados[chatId] = null;

      await reply(chatId, `✅ Usuario creado:
ID: ${id}
Plan: ${plan}
Días: ${dias}`);

      return res.sendStatus(200);
    }

    // =========================
    // BOTON IA
    // =========================
    if (text === "🤖 IA") {
      await reply(chatId, "Escribe lo que quieras preguntar...");
      return res.sendStatus(200);
    }

    // =========================
    // IA RESPUESTA
    // =========================
    if (!chats[chatId]) {
      chats[chatId] = [
        { role: "system", content: "Eres una IA llamada IA DARKNESS" }
      ];
    }

    chats[chatId].push({
      role: "user",
      content: text
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chats[chatId]
    });

    const respuesta =
      completion.choices[0].message.content || "Error";

    chats[chatId].push({
      role: "assistant",
      content: respuesta
    });

    await reply(chatId, respuesta);

    return res.sendStatus(200);

  } catch (err) {
    console.log(err);
    return res.sendStatus(200);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo 🚀");
});
