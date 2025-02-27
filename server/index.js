import '@shopify/shopify-api/adapters/node';
import express from 'express';
import dotenv from 'dotenv';
import { handleOrderCreate } from './webhookHandler.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/webhooks/orders/create", async (req, res) => {
  console.log("Llegó la request al webhook:", {
    gateway: req.body.gateway,
  });

  try {
    const result = await handleOrderCreate(req.body);
    console.log("Resultado del manejador del webhook:", result); // Log para depuración
    res.status(200).send(result);
  } catch (error) {
    console.error("Error en el manejador del webhook:", error); // Log para depuración
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo...`);
});