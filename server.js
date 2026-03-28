import express from "express";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("FUNCIONANDO 🔥");
});

app.post("/telegram", (req, res) => {
  console.log("Mensaje recibido");
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor activo en puerto", PORT);
});
