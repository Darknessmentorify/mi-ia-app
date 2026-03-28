import express from "express";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const DB_FILE = "./db.json";

// ===== DB =====
function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

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

// ===== ROOT =====
app.get("/", (req, res) => {
  res.send("NEGOCIO ACTIVO 💰");
});

// ===== TELEGRAM =====
app.post("/telegram", async (req, res) => {

  const message = req.body.message;
  if (!message) return res.sendStatus(200);

  const chatId = String(message.chat.id);
  const text = message.text || "";

  let db = loadDB();

  try {

    // ===== LOGIN ADMIN =====
    if (text.startsWith("/login")) {
      const [, user, pass] = text.split(" ");

      if (user === "Guillermo65" && pass === "Guillermito00.") {
        db.admins[chatId] = true;
        saveDB(db);
        return reply(chatId, "✅ Admin activado");
      } else {
        return reply(chatId, "❌ Credenciales incorrectas");
      }
    }

    // ===== START =====
    if (text === "/start") {

      if (!db.users[chatId]) {
        db.users[chatId] = { saldo: 0 };
        saveDB(db);
      }

      return reply(chatId, "🏠 MENÚ PRINCIPAL", [
        ["🛒 Comprar", "💰 Mi cuenta"],
        ["⚙️ Admin"]
      ]);
    }

    // ===== MI CUENTA =====
    if (text === "💰 Mi cuenta") {
      const user = db.users[chatId];

      return reply(chatId,
        `💰 Saldo: $${user.saldo}`
      );
    }

    // ===== ADMIN PANEL =====
    if (text === "⚙️ Admin") {
      if (!db.admins[chatId]) {
        return reply(chatId, "❌ No eres admin");
      }

      return reply(chatId, "🛠 PANEL ADMIN", [
        ["👤 Crear usuario", "💰 Agregar saldo"],
        ["📦 Crear producto", "🔑 Agregar key"],
        ["📋 Ver productos"],
        ["⬅️ Atrás"]
      ]);
    }

    // ===== CREAR USUARIO =====
    if (text === "👤 Crear usuario") {
      db.temp[chatId] = "crear_user";
      saveDB(db);
      return reply(chatId, "Formato:\nID SALDO\nEj: 123456789 10");
    }

    if (db.temp[chatId] === "crear_user") {
      const [id, saldo] = text.split(" ");

      db.users[id] = { saldo: Number(saldo) };

      db.temp[chatId] = null;
      saveDB(db);

      return reply(chatId, "✅ Usuario creado");
    }

    // ===== AGREGAR SALDO =====
    if (text === "💰 Agregar saldo") {
      db.temp[chatId] = "saldo";
      saveDB(db);
      return reply(chatId, "Formato:\nID MONTO\nEj: 123456789 20");
    }

    if (db.temp[chatId] === "saldo") {
      const [id, monto] = text.split(" ");

      if (!db.users[id]) {
        return reply(chatId, "❌ Usuario no existe");
      }

      db.users[id].saldo += Number(monto);

      db.temp[chatId] = null;
      saveDB(db);

      return reply(chatId, "💰 Saldo agregado");
    }

    // ===== CREAR PRODUCTO =====
    if (text === "📦 Crear producto") {
      db.temp[chatId] = "producto";
      saveDB(db);
      return reply(chatId, "Formato:\nNombre Precio\nEj: Netflix 5");
    }

    if (db.temp[chatId] === "producto") {
      const [nombre, precio] = text.split(" ");

      db.productos[nombre] = {
        precio: Number(precio),
        keys: []
      };

      db.temp[chatId] = null;
      saveDB(db);

      return reply(chatId, "✅ Producto creado");
    }

    // ===== AGREGAR KEY =====
    if (text === "🔑 Agregar key") {
      db.temp[chatId] = "key";
      saveDB(db);
      return reply(chatId, "Formato:\nProducto KEY\nEj: Netflix ABC123");
    }

    if (db.temp[chatId] === "key") {
      const [producto, key] = text.split(" ");

      if (!db.productos[producto]) {
        return reply(chatId, "❌ Producto no existe");
      }

      db.productos[producto].keys.push(key);

      db.temp[chatId] = null;
      saveDB(db);

      return reply(chatId, "🔑 Key agregada");
    }

    // ===== VER PRODUCTOS =====
    if (text === "📋 Ver productos") {
      let lista = "📦 Productos:\n";

      for (let p in db.productos) {
        lista += `${p} - $${db.productos[p].precio} (${db.productos[p].keys.length} stock)\n`;
      }

      return reply(chatId, lista);
    }

    // ===== COMPRAR =====
    if (text === "🛒 Comprar") {

      let botones = [];

      for (let p in db.productos) {
        botones.push([p]);
      }

      botones.push(["⬅️ Atrás"]);

      return reply(chatId, "🛒 Selecciona producto:", botones);
    }

    if (db.productos[text]) {
      const producto = db.productos[text];
      const user = db.users[chatId];

      if (!user) {
        return reply(chatId, "❌ Usa /start primero");
      }

      if (user.saldo < producto.precio) {
        return reply(chatId, "❌ No tienes saldo");
      }

      if (producto.keys.length === 0) {
        return reply(chatId, "❌ Sin stock");
      }

      const key = producto.keys.shift();
      user.saldo -= producto.precio;

      saveDB(db);

      return reply(chatId, `✅ Compra exitosa\n🔑 Key: ${key}`);
    }

    // ===== ATRÁS =====
    if (text === "⬅️ Atrás") {
      return reply(chatId, "🏠 MENÚ PRINCIPAL", [
        ["🛒 Comprar", "💰 Mi cuenta"],
        ["⚙️ Admin"]
      ]);
    }

  } catch (err) {
    console.log(err);
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("🔥 NEGOCIO FUNCIONANDO"));
