import express from "express";
import fs from "fs";

const app = express();
app.use(express.json());

const TOKEN = process.env.TELEGRAM_TOKEN;
const URL = `https://api.telegram.org/bot${TOKEN}`;

// DB
let db = {
  users: {},
  admin: { user: "Guillermo65", pass: "Guillermito00." }
};

// estados temporales (login paso a paso)
let states = {};

// guardar db
function saveDB() {
  fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
}

// cargar db
if (fs.existsSync("db.json")) {
  db = JSON.parse(fs.readFileSync("db.json"));
}

// enviar mensaje
async function send(chatId, text, keyboard = null) {
  await fetch(`${URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: keyboard
    })
  });
}

// menú
function menu() {
  return {
    keyboard: [
      ["💰 Mi cuenta", "🛒 Comprar"],
      ["⚙️ Admin"]
    ],
    resize_keyboard: true
  };
}

app.post("/telegram", async (req, res) => {
  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text;

  // crear usuario si no existe
  if (!db.users[chatId]) {
    db.users[chatId] = {
      plan: "gratis",
      expire: 0,
      saldo: 0,
      admin: false
    };
  }

  const user = db.users[chatId];

  // 🔥 INICIO
  if (text === "/start") {
    states[chatId] = { step: "login_user" };
    return send(chatId, "👤 Ingresa tu usuario:");
  }

  // 🔥 PASO 1: usuario
  if (states[chatId]?.step === "login_user") {
    states[chatId] = {
      step: "login_pass",
      username: text
    };
    return send(chatId, "🔑 Ingresa tu contraseña:");
  }

  // 🔥 PASO 2: contraseña
  if (states[chatId]?.step === "login_pass") {
    const username = states[chatId].username;
    const password = text;

    // ADMIN LOGIN
    if (
      username === db.admin.user &&
      password === db.admin.pass
    ) {
      user.admin = true;
      states[chatId] = null;
      saveDB();
      return send(chatId, "✅ Admin logueado", menu());
    }

    // USUARIO NORMAL
    const found = Object.values(db.users).find(
      u => u.username === username && u.password === password
    );

    if (found) {
      states[chatId] = null;
      return send(chatId, "✅ Login correcto", menu());
    }

    states[chatId] = null;
    return send(chatId, "❌ Login incorrecto");
  }

  // 🔥 CREAR USUARIO (admin)
  if (text.startsWith("/crear")) {
    if (!user.admin) return send(chatId, "❌ Solo admin");

    const [, username, password, plan, dias] = text.split(" ");

    db.users[username] = {
      username,
      password,
      plan,
      expire: Date.now() + dias * 86400000,
      saldo: 0,
      admin: false
    };

    saveDB();
    return send(chatId, "✅ Usuario creado");
  }

  // MI CUENTA
  if (text === "💰 Mi cuenta") {
    return send(
      chatId,
      `👤 Plan: ${user.plan}\n💰 Saldo: $${user.saldo}`
    );
  }

  // COMPRAR
  if (text === "🛒 Comprar") {
    return send(chatId, "🛒 Planes:\n1 día $3\n7 días $7\n30 días $15");
  }

  // ADMIN
  if (text === "⚙️ Admin") {
    if (!user.admin) return send(chatId, "❌ No eres admin");

    return send(
      chatId,
      "⚙️ Panel Admin\nUsa:\n/crear usuario pass plan dias"
    );
  }

  res.sendStatus(200);
});

// test
app.get("/", (req, res) => {
  res.send("BOT LOGIN ACTIVO 🔥");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor ON"));
