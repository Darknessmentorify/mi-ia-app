import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Ruta para IA (texto)
app.post("/texto", async (req, res) => {
  const prompt = req.body.prompt;

  res.json({
    respuesta: "Servidor funcionando con: " + prompt
  });
});

// Ruta principal
app.get("/", (req, res) => {
  res.send("Servidor activo 🚀");
});

// Puerto (IMPORTANTE para Railway)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
