import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ["write_discounts", "write_orders"], // Asegúrate de incluir write_orders
  hostName: process.env.HOST,
  apiVersion: ApiVersion.October23,
  isEmbeddedApp: false,
});

export const handleOrderCreate = async (order) => {
  console.log("--------------- Procesando pedido ---------------");

  const client = new shopify.clients.Rest({
    session: {
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
      shop: process.env.SHOPIFY_STORE_DOMAIN,
    }
  });

  console.log('--------------- Llega al primer POST ---------------')

  try {
    const priceRuleResponse = await client.post({
      path: "/admin/api/2023-10/price_rules.json",
      data: {
        price_rule: {
          title: "Descuento por transferencia bancaria",
          target_type: "line_item",
          target_selection: "all",
          allocation_method: "across",
          value_type: "fixed_amount",
          value: -10,
          customer_selection: "all",
          starts_at: new Date().toISOString(),
        },
      },
    });

    const priceRuleId = priceRuleResponse.body.price_rule.id;
    const uniqueCode = `TRANSFERENCIA10-${uuidv4()}`;

    console.log('--------------- Llega al segundo POST ---------------')

    const discountResponse = await client.post({
      path: `/admin/api/2023-10/price_rules/${priceRuleId}/discount_codes.json`,
      data: {
        discount_code: {
          code: uniqueCode,
        },
      },
    });

    // Aplicar el código de descuento a la orden

    console.log('--------------- Llega al PUT ---------------')

    await client.put({
      path: `/admin/api/2023-10/orders/${order.id}.json`,
      data: {
        order: {
          id: order.id,
          discount_codes: [
            {
              code: uniqueCode,
              amount: -10,
              type: "fixed_amount",
            },
          ],
        },
      },
    });

    console.log('--------------- Termina la ejecución de los métodos ---------------')

    return "Descuento aplicado";
  } catch (error) {
    console.error("Error al aplicar el descuento:", error); // Log para depuración
    throw new Error(error.message);
  };
};
