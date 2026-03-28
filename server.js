const express = require("express");
const fs = require("fs");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const URL = `https://api.telegram.org/bot${TOKEN}`;

const DB_FILE = "db.json";

// 📂 DB
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, products: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// 🧠 estados login
const states = {};

// 📩 enviar mensaje
async function send(chatId, text, keyboard = null) {
  return fetch(`${URL}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: keyboard
    })
  });
}

// 📋 menús
function menu() {
  return {
    keyboard: [
      ["🛒 Comprar", "💰 Mi cuenta"],
      ["⚙️ Admin"]
    ],
    resize_keyboard: true
  };
}

function adminMenu() {
  return {
    keyboard: [
      ["👤 Crear usuario", "💵 Agregar saldo"],
      ["📦 Crear producto", "🔑 Agregar key"],
      ["📋 Ver productos"],
      ["⬅️ Volver"]
    ],
    resize_keyboard: true
  };
}

// 🌐 webhook
app.post("/", async (req, res) => {
  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text;

  const db = loadDB();
  const user = db.users[chatId];
  const state = states[chatId];

  // 🚀 START
  if (text === "/start") {
    states[chatId] = { step: "login_user" };
    return send(chatId, "👤 Ingresa tu usuario:");
  }

  // LOGIN USER
  if (state?.step === "login_user") {
    state.username = text;
    state.step = "login_pass";
    return send(chatId, "🔑 Ingresa tu contraseña:");
  }

  // LOGIN PASS
  if (state?.step === "login_pass") {
    const username = state.username;
    const password = text;

    // ADMIN
    if (username === "Guillermo65" && password === "Guillermito00.") {
      db.users[chatId] = {
        username,
        role: "admin",
        saldo: 0
      };
      saveDB(db);
      delete states[chatId];
      return send(chatId, "✅ Admin logueado", adminMenu());
    }

    // USERS
    const found = Object.values(db.users).find(
      u => u.username === username && u.password === password
    );

    if (found) {
      db.users[chatId] = found;
      saveDB(db);
      delete states[chatId];
      return send(chatId, "✅ Login exitoso", menu());
    }

    delete states[chatId];
    return send(chatId, "❌ Credenciales incorrectas");
  }

  if (!user) {
    return send(chatId, "⚠️ Usa /start para iniciar sesión");
  }

  // ================= ADMIN =================

  if (text === "⚙️ Admin" && user.role === "admin") {
    return send(chatId, "⚙️ Panel admin", adminMenu());
  }

  // CREAR USUARIO
  if (text === "👤 Crear usuario" && user.role === "admin") {
    states[chatId] = { step: "new_user" };
    return send(chatId, "👤 Username:");
  }

  if (state?.step === "new_user") {
    state.username = text;
    state.step = "new_pass";
    return send(chatId, "🔑 Password:");
  }

  if (state?.step === "new_pass") {
    state.password = text;
    state.step = "new_plan";
    return send(chatId, "📦 Plan:");
  }

  if (state?.step === "new_plan") {
    state.plan = text;
    state.step = "new_days";
    return send(chatId, "📅 Días:");
  }

  if (state?.step === "new_days") {
    const id = Date.now();

    db.users[id] = {
      username: state.username,
      password: state.password,
      plan: state.plan,
      dias: text,
      saldo: 0,
      role: "user"
    };

    saveDB(db);
    delete states[chatId];

    return send(chatId, "✅ Usuario creado");
  }

  // SALDO
  if (text === "💵 Agregar saldo" && user.role === "admin") {
    states[chatId] = { step: "saldo_user" };
    return send(chatId, "👤 Usuario:");
  }

  if (state?.step === "saldo_user") {
    state.target = text;
    state.step = "saldo_amount";
    return send(chatId, "💵 Monto:");
  }

  if (state?.step === "saldo_amount") {
    const target = Object.values(db.users).find(u => u.username === state.target);
    if (!target) {
      delete states[chatId];
      return send(chatId, "❌ Usuario no existe");
    }

    target.saldo += parseFloat(text);
    saveDB(db);
    delete states[chatId];

    return send(chatId, "✅ Saldo agregado");
  }

  // PRODUCTOS
  if (text === "📦 Crear producto" && user.role === "admin") {
    states[chatId] = { step: "prod_name" };
    return send(chatId, "📦 Nombre:");
  }

  if (state?.step === "prod_name") {
    state.name = text;
    state.step = "prod_price";
    return send(chatId, "💰 Precio:");
  }

  if (state?.step === "prod_price") {
    db.products[state.name] = { price: parseFloat(text), keys: [] };
    saveDB(db);
    delete states[chatId];
    return send(chatId, "✅ Producto creado");
  }

  // KEYS
  if (text === "🔑 Agregar key" && user.role === "admin") {
    states[chatId] = { step: "key_prod" };
    return send(chatId, "📦 Producto:");
  }

  if (state?.step === "key_prod") {
    state.product = text;
    state.step = "key_value";
    return send(chatId, "🔑 Key:");
  }

  if (state?.step === "key_value") {
    db.products[state.product].keys.push(text);
    saveDB(db);
    delete states[chatId];
    return send(chatId, "✅ Key agregada");
  }

  // USUARIO
  if (text === "💰 Mi cuenta") {
    return send(chatId, `💰 Saldo: $${user.saldo}`);
  }

  if (text === "🛒 Comprar" || text === "📋 Ver productos") {
    const buttons = Object.keys(db.products).map(p => [p]);
    return send(chatId, "🛒 Productos:", {
      keyboard: buttons,
      resize_keyboard: true
    });
  }

  if (db.products[text]) {
    const product = db.products[text];

    if (user.saldo < product.price) {
      return send(chatId, "❌ Sin saldo");
    }

    if (product.keys.length === 0) {
      return send(chatId, "❌ Sin stock");
    }

    const key = product.keys.shift();
    user.saldo -= product.price;

    saveDB(db);

    return send(chatId, `✅ Compra\n🔑 ${key}`);
  }

  res.sendStatus(200);
});

// servidor
app.get("/", (req, res) => {
  res.send("🔥 FUNCIONANDO");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server activo");
});
