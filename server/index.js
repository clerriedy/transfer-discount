import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION, ApiVersion } from '@shopify/shopify-api';
import express from 'express';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { handleOrderCreate } from './webhookHandler.js';

dotenv.config();

const app = express();
const PORT = 3000;

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ["write_discounts"],
  hostName: process.env.HOST,
  apiVersion: ApiVersion.October23,
  isEmbeddedApp: false,
});

app.use(express.json());

app.post("/create-discount", async (req, res) => {
  console.log('Hello.');

  //const { title, value } = req.body;
  const title = "Descuento por transferencia";
  const value = 10;

  if (!title || !value) {
    return res.status(400).json({ error: "Title and value are required" });
  }

  const client = new shopify.clients.Rest({
    session: {
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
      shop: process.env.SHOPIFY_STORE_DOMAIN,
    }
  });

  try {
    const priceRuleResponse = await client.post({
      path: "/admin/api/2023-10/price_rules.json",
      data: {
        price_rule: {
          title,
          target_type: "line_item",
          target_selection: "all",
          allocation_method: "across",
          value_type: "fixed_amount",
          value: -value,
          customer_selection: "all",
          starts_at: new Date().toISOString(),
        },
      },
    });

    const priceRuleId = priceRuleResponse.body.price_rule.id;

    const uniqueCode = `TRANSFERENCIA10-${uuidv4()}`;

    const discountResponse = await client.post({
      path: `/admin/api/2023-10/price_rules/${priceRuleId}/discount_codes.json`,
      data: {
        discount_code: {
          code: uniqueCode,
        },
      },
    });

    res.status(200).json(discountResponse.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/webhooks/orders/create", async (req, res) => {
  console.log("Webhook recibido:", req.body); // Log para depuración
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
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});