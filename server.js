import express from "express";
import cors from "cors";
import OpenAI from "openai";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 CONFIG
const SECRET = "mi_clave_super_secreta";

// 🧠 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 👤 Base de datos falsa (temporal)
const users = [];

// ======================
// 🧾 REGISTRO
// ======================
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  users.push({ email, password: hash });

  res.json({ mensaje: "Usuario creado" });
});

// ======================
// 🔑 LOGIN
// ======================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);

  if (!user) return res.status(400).json({ error: "No existe" });

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) return res.status(400).json({ error: "Incorrecto" });

  const token = jwt.sign({ email }, SECRET);

  res.json({ token });
});

// ======================
// 🤖 CHAT PROTEGIDO
// ======================
app.post("/texto", async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: "No autorizado" });
    }

    jwt.verify(token, SECRET);

    const prompt = req.body.prompt;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: prompt }
      ]
    });

    res.json({
      respuesta: completion.choices[0].message.content
    });

  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
});

// ======================
// 🟢 TEST
// ======================
app.get("/", (req, res) => {
  res.send("IA DARKNESS activa 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
