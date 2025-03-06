import '@shopify/shopify-api/adapters/node';
import express from 'express';
import dotenv from 'dotenv';
import { handleOrderCreate } from './webhookHandler.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const processingOrders = new Set();

let fromGateway = null;

app.post("/webhooks/orders/create", async (req, res) => {
  const orderId = req.body.id;
  fromGateway = req.body.gateway;

  if (fromGateway !== "Bank Deposit" || fromGateway === req.body.gateway) {
    res.status(200).send({});
  }

  if (processingOrders.has(orderId)) {
    console.log(`Pedido ${orderId} ya está siendo procesado.`);
    return res.status(429).send("Pedido ya está siendo procesado.");
  }

  processingOrders.add(orderId);

  console.log("Llegó la request al webhook:", {
    gateway: req.body.gateway,
  });

  try {
    console.log('--------------- Entra al handleOrderCreate ---------------');

    const result = await handleOrderCreate(req.body);

    console.log("Resultado del manejador del webhook:", result); // Log para depuración

    res.status(200).send(result);
  } catch (error) {
    console.error("Error en el manejador del webhook:", error); // Log para depuración
    res.status(500).json({ error: error.message });
  } finally {
    processingOrders.delete(orderId);
  }
});

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo...`);
});