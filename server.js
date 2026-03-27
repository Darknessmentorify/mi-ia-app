import express from "express";
import cors from "cors";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();

app.use(cors());
app.use(express.json());

// crear uploads
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// =======================
// 🧠 BASE DE DATOS (temporal)
// =======================
const users = [];
const SECRET = "darkness_secret";

// =======================
// 🔐 REGISTRO
// =======================
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  users.push({
    email,
    password: hashed,
    imagenes: 5
  });

  res.json({ mensaje: "Usuario creado" });
});

// =======================
// 🔑 LOGIN
// =======================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(400).json({ error: "Usuario no existe" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  const token = jwt.sign({ email }, SECRET, { expiresIn: "7d" });

  res.json({ token });
});

// =======================
// 🔒 AUTH
// =======================
function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

// =======================
// 🎯 USAR IMAGEN
// =======================
function usarImagen(email) {
  const user = users.find(u => u.email === email);

  if (!user || user.imagenes <= 0) return false;

  user.imagenes -= 1;
  return true;
}

// =======================
// ➕ AGREGAR CRÉDITOS
// =======================
app.post("/add-images", auth, (req, res) => {
  const { cantidad } = req.body;

  const user = users.find(u => u.email === req.user.email);

  user.imagenes += cantidad;

  res.json({
    mensaje: "Créditos agregados",
    total: user.imagenes
  });
});

// =======================
// 📊 PERFIL
// =======================
app.get("/me", auth, (req, res) => {
  const user = users.find(u => u.email === req.user.email);

  res.json({
    imagenes: user.imagenes
  });
});

// =======================
// 🧠 CHAT
// =======================
app.post("/text", auth, async (req, res) => {
  const { prompt } = req.body;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Eres IA DARKNESS." },
      { role: "user", content: prompt }
    ]
  });

  res.json({
    respuesta: completion.choices[0].message.content
  });
});

// =======================
// 🎨 IMAGEN
// =======================
app.post("/image", auth, async (req, res) => {

  if (!usarImagen(req.user.email)) {
    return res.status(402).json({ error: "Sin imágenes disponibles" });
  }

  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: req.body.prompt,
    size: "512x512"
  });

  res.json({
    image: `data:image/png;base64,${result.data[0].b64_json}`
  });
});

// =======================
app.get("/test", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo");
});
