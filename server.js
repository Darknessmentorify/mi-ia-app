import express from "express";
import fetch from "node-fetch";
import OpenAI from "openai";

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// =======================
// 🔐 ADMIN
// =======================
const ADMIN_USER = "Guillermo65";
const ADMIN_PASS = "Guillermito00.";

const adminsLogueados = {};

// =======================
// 👤 USUARIOS
// =======================
const usuarios = {};

// =======================
// 📦 PLANES
// =======================
const planes = {
  basico: { limite: 50 },
  pro: { limite: 200 },
  ilimitado: { limite: Infinity }
};

// =======================
// 🧠 MEMORIA
// =======================
const chats = {};

// =======================
app.get("/", (req, res) => {
  res.send("IA DARKNESS funcionando 🚀");
});

// =======================
// 🤖 TELEGRAM
// =======================
app.post("/telegram", async (req, res) => {

  const message = req.body.message;
  if (!message) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text || "";

  try {

    // =======================
    // 🔐 LOGIN ADMIN
    // =======================
    if (text.startsWith("/login")) {
      const partes = text.split(" ");

      if (partes.length < 3) {
        return send(chatId, "Uso: /login usuario contraseña");
      }

      const user = partes[1];
      const pass = partes[2];

      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        adminsLogueados[chatId] = true;
        return send(chatId, "✅ Admin logueado");
      } else {
        return send(chatId, "❌ Datos incorrectos");
      }
    }

    // =======================
    // ➕ CREAR USUARIO
    // =======================
    if (text.startsWith("/crear")) {

      if (!adminsLogueados[chatId]) {
        return send(chatId, "🔒 No eres admin");
      }

      const partes = text.split(" ");

      if (partes.length < 4) {
        return send(chatId, "Uso: /crear chatId plan dias");
      }

      const nuevoId = partes[1];
      const plan = partes[2];
      const dias = parseInt(partes[3]);

      if (!planes[plan]) {
        return send(chatId, "❌ Plan inválido (basico/pro/ilimitado)");
      }

      usuarios[nuevoId] = {
        plan,
        expira: Date.now() + (dias * 24 * 60 * 60 * 1000),
        mensajes: 0
      };

      return send(chatId, `✅ Usuario creado\nPlan: ${plan}\nDías: ${dias}`);
    }

    // =======================
    // 👤 VALIDAR USUARIO
    // =======================
    const user = usuarios[chatId];

    if (!user) {
      return send(chatId, "❌ No tienes acceso");
    }

    if (Date.now() > user.expira) {
      return send(chatId, "⏰ Tu acceso expiró");
    }

    const plan = planes[user.plan];

    if (user.mensajes >= plan.limite) {
      return send(chatId, "⚠️ Límite alcanzado");
    }

    // =======================
    // 🧠 MEMORIA
    // =======================
    if (!chats[chatId]) {
      chats[chatId] = [
        { role: "system", content: `Eres IA DARKNESS. Usuario ${user.plan}` }
      ];
    }

    chats[chatId].push({
      role: "user",
      content: text
    });

    if (chats[chatId].length > 15) {
      chats[chatId].shift();
    }

    // =======================
    // 🤖 IA
    // =======================
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chats[chatId]
    });

    const respuesta = completion.choices?.[0]?.message?.content || "Error";

    chats[chatId].push({
      role: "assistant",
      content: respuesta
    });

    user.mensajes++;

    await send(chatId, respuesta);

  } catch (error) {
    console.log(error);
  }

  res.sendStatus(200);
});

// =======================
async function send(chatId, text) {
  await fetch(`${TELEGRAM_URL}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor listo 🚀");
});
