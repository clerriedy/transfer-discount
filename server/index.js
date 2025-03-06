import '@shopify/shopify-api/adapters/node';
import express from 'express';
import dotenv from 'dotenv';
import { handleOrderCreate } from './webhookHandler.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/webhooks/orders/create", async (req, res) => {
  const orderId = req.body.id;

  console.log('--------------- Valor del gateway ---------------', {
    orderId: req.body.id,
    gateway: req.body.gateway,
  })

  if (req.body.gateway !== "Bank Deposit") {
    console.log("No es una orden de Bank Deposit.");
    return res.status(200).send({});
  };

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