const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const URL = `https://api.telegram.org/bot${TOKEN}`;

const ADMIN_USER = "Guillermo65";
const ADMIN_PASS = "Guillermito00.";

let users = {};

app.post("/", async (req, res) => {
  // 🔥 RESPONDER INMEDIATO (ESTO ARREGLA TU ERROR)
  res.sendStatus(200);

  const msg = req.body.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const text = msg.text;

  if (!users[chatId]) {
    users[chatId] = { step: "user", logged: false };
  }

  const user = users[chatId];

  // START
  if (text === "/start") {
    user.step = "user";
    user.logged = false;

    await send(chatId, "👤 Ingresa tu usuario:");
    return;
  }

  // USERNAME
  if (user.step === "user") {
    if (text === ADMIN_USER) {
      user.step = "pass";
      await send(chatId, "🔒 Ingresa tu contraseña:");
    } else {
      await send(chatId, "❌ Usuario incorrecto");
    }
    return;
  }

  // PASSWORD
  if (user.step === "pass") {
    if (text === ADMIN_PASS) {
      user.logged = true;
      user.step = "menu";

      await sendMenu(chatId);
    } else {
      await send(chatId, "❌ Contraseña incorrecta");
    }
    return;
  }

  // MENU
  if (user.logged) {
    if (text === "🛒 Comprar") {
      await send(chatId, "📦 Aquí irán los productos");
    } else if (text === "💰 Mi cuenta") {
      await send(chatId, "💵 Saldo: $0");
    } else if (text === "⚙️ Admin") {
      await send(chatId, "🔧 Panel admin próximamente");
    }
  }
});

// MENÚ
async function sendMenu(chatId) {
  await axios.post(`${URL}/sendMessage`, {
    chat_id: chatId,
    text: "🏠 Menú Principal",
    reply_markup: {
      keyboard: [
        ["🛒 Comprar", "💰 Mi cuenta"],
        ["⚙️ Admin"]
      ],
      resize_keyboard: true
    }
  });
}

// MENSAJE SIMPLE
async function send(chatId, text) {
  await axios.post(`${URL}/sendMessage`, {
    chat_id: chatId,
    text
  });
}

// SERVER
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 Bot corriendo");
});
