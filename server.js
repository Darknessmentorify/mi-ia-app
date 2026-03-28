import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// ===== DATOS =====
const admins = {};
const users = {};
const estados = {};
const productos = [
  "Br Mods",
  "Cuban Mods Store",
  "Drip Client",
  "Fluorite Iphone"
];

// ===== RESPUESTA =====
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
  res.send("BOT TIENDA funcionando 💰");
});

// ===== TELEGRAM =====
app.post("/telegram", async (req, res) => {
  const message = req.body.message;
  if (!message) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text || "";

  try {

    // ===== LOGIN ADMIN =====
    if (text.startsWith("/login")) {
      const [, user, pass] = text.split(" ");

      if (user === "Guillermo65" && pass === "Guillermito00.") {
        admins[chatId] = true;
        await reply(chatId, "✅ Admin logueado");
      } else {
        await reply(chatId, "❌ Error login");
      }
      return res.sendStatus(200);
    }

    // ===== START =====
    if (text === "/start") {
      if (!users[chatId]) {
        users[chatId] = { saldo: 10 };
      }

      await reply(
        chatId,
        `🏠 Menú Principal\n💰 Saldo: $${users[chatId].saldo}`,
        [
          ["🛒 Comprar", "💰 Mi cuenta"],
          ["⚙️ Admin"]
        ]
      );
      return res.sendStatus(200);
    }

    // ===== COMPRAR =====
    if (text === "🛒 Comprar") {
      await reply(
        chatId,
        "Selecciona un plan:",
        [
          ["1 día $3"],
          ["7 días $7"],
          ["30 días $15"],
          ["⬅️ Atrás"]
        ]
      );
      return res.sendStatus(200);
    }

    // ===== MI CUENTA =====
    if (text === "💰 Mi cuenta") {
      await reply(
        chatId,
        `💰 Tu saldo es: $${users[chatId].saldo}`,
        [["⬅️ Atrás"]]
      );
      return res.sendStatus(200);
    }

    // ===== ADMIN PANEL =====
    if (text === "⚙️ Admin") {
      if (!admins[chatId]) {
        await reply(chatId, "❌ No eres admin");
        return res.sendStatus(200);
      }

      await reply(
        chatId,
        "🛠 Panel Admin",
        [
          ["📦 Productos"],
          ["👥 Usuarios"],
          ["⬅️ Atrás"]
        ]
      );
      return res.sendStatus(200);
    }

    // ===== PRODUCTOS =====
    if (text === "📦 Productos") {
      const botones = productos.map(p => [p]);
      botones.push(["➕ Agregar producto"]);
      botones.push(["⬅️ Atrás"]);

      await reply(chatId, "📦 Lista de productos:", botones);
      return res.sendStatus(200);
    }

    // ===== AGREGAR PRODUCTO =====
    if (text === "➕ Agregar producto") {
      estados[chatId] = "agregar_producto";
      await reply(chatId, "Escribe el nombre del producto:");
      return res.sendStatus(200);
    }

    if (estados[chatId] === "agregar_producto") {
      productos.push(text);
      estados[chatId] = null;

      await reply(chatId, "✅ Producto agregado");
      return res.sendStatus(200);
    }

    // ===== ATRÁS =====
    if (text === "⬅️ Atrás") {
      await reply(
        chatId,
        "🏠 Menú Principal",
        [
          ["🛒 Comprar", "💰 Mi cuenta"],
          ["⚙️ Admin"]
        ]
      );
      return res.sendStatus(200);
    }

    // ===== DEFAULT =====
    await reply(chatId, "Usa el menú 👇");

    return res.sendStatus(200);

  } catch (err) {
    console.log(err);
    return res.sendStatus(200);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor listo 🚀");
});
