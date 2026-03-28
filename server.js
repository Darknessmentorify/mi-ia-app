const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

// 🔑 TOKEN DE TELEGRAM
const TOKEN = process.env.TOKEN;
const URL = `https://api.telegram.org/bot${TOKEN}`;

// 📂 BASE DE DATOS SIMPLE
const DB_FILE = "db.json";

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, products: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// 🧠 ESTADOS (login paso a paso)
const states = {};

// 📩 ENVIAR MENSAJE
async function send(chatId, text, keyboard = null) {
  return fetch(`${URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: keyboard
    })
  });
}

// 📋 MENÚS
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

// 🌐 WEBHOOK
app.post("/", async (req, res) => {
  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text;

  const db = loadDB();
  const user = db.users[chatId];
  const state = states[chatId];

  // 🚀 START → LOGIN
  if (text === "/start") {
    states[chatId] = { step: "login_user" };
    return send(chatId, "👤 Ingresa tu usuario:");
  }

  // 🔐 LOGIN USUARIO
  if (state?.step === "login_user") {
    state.username = text;
    state.step = "login_pass";
    return send(chatId, "🔑 Ingresa tu contraseña:");
  }

  // 🔐 LOGIN PASSWORD
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

    // USUARIOS NORMALES
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

  // ❌ SI NO ESTÁ LOGUEADO
  if (!user) {
    return send(chatId, "⚠️ Debes hacer login con /start");
  }

  // ================= ADMIN =================

  if (text === "⚙️ Admin" && user.role === "admin") {
    return send(chatId, "⚙️ Panel admin", adminMenu());
  }

  // 👤 CREAR USUARIO
  if (text === "👤 Crear usuario" && user.role === "admin") {
    states[chatId] = { step: "crear_user" };
    return send(chatId, "👤 Username:");
  }

  if (state?.step === "crear_user") {
    state.newUser = text;
    state.step = "crear_pass";
    return send(chatId, "🔑 Password:");
  }

  if (state?.step === "crear_pass") {
    state.newPass = text;
    state.step = "crear_plan";
    return send(chatId, "📦 Plan (basico/pro/ilimitado):");
  }

  if (state?.step === "crear_plan") {
    state.plan = text;
    state.step = "crear_dias";
    return send(chatId, "📅 Días:");
  }

  if (state?.step === "crear_dias") {
    const id = Date.now();

    db.users[id] = {
      username: state.newUser,
      password: state.newPass,
      plan: state.plan,
      dias: text,
      saldo: 0,
      role: "user"
    };

    saveDB(db);
    delete states[chatId];

    return send(chatId, "✅ Usuario creado");
  }

  // 💵 AGREGAR SALDO
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
      return send(chatId, "❌ Usuario no encontrado");
    }

    target.saldo += parseFloat(text);
    saveDB(db);
    delete states[chatId];

    return send(chatId, "✅ Saldo agregado");
  }

  // 📦 CREAR PRODUCTO
  if (text === "📦 Crear producto" && user.role === "admin") {
    states[chatId] = { step: "prod_name" };
    return send(chatId, "📦 Nombre del producto:");
  }

  if (state?.step === "prod_name") {
    state.name = text;
    state.step = "prod_price";
    return send(chatId, "💰 Precio:");
  }

  if (state?.step === "prod_price") {
    db.products[state.name] = {
      price: parseFloat(text),
      keys: []
    };

    saveDB(db);
    delete states[chatId];

    return send(chatId, "✅ Producto creado");
  }

  // 🔑 AGREGAR KEY
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

  // ================= USUARIO =================

  if (text === "💰 Mi cuenta") {
    return send(chatId, `💰 Saldo: $${user.saldo}`);
  }

  if (text === "📋 Ver productos" || text === "🛒 Comprar") {
    const buttons = Object.keys(db.products).map(p => [p]);
    return send(chatId, "🛒 Productos:", {
      keyboard: buttons,
      resize_keyboard: true
    });
  }

  // 🛒 COMPRAR
  if (db.products[text]) {
    const product = db.products[text];

    if (user.saldo < product.price) {
      return send(chatId, "❌ Saldo insuficiente");
    }

    if (product.keys.length === 0) {
      return send(chatId, "❌ Sin stock");
    }

    const key = product.keys.shift();
    user.saldo -= product.price;

    saveDB(db);

    return send(chatId, `✅ Compra exitosa\n🔑 Key: ${key}`);
  }

  // ⬅️ VOLVER
  if (text === "⬅️ Volver") {
    return send(chatId, "🏠 Menú", menu());
  }

  res.sendStatus(200);
});

// 🚀 SERVIDOR
app.get("/", (req, res) => {
  res.send("🔥 FUNCIONANDO");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server activo");
});
