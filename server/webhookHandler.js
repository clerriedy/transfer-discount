import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ["write_discounts"],
  hostName: process.env.HOST,
  apiVersion: ApiVersion.October23,
  isEmbeddedApp: false,
});

export const handleOrderCreate = async (order) => {
  console.log("Procesando pedido:", order); // Log para depuración

  // Verificar que payment_gateway_names existe y es un array
  /*
  if (!order.payment_gateway_names || !Array.isArray(order.payment_gateway_names) || order.payment_gateway_names.length === 0) {
    console.warn("payment_gateway_names no está presente o no es un array válido, usando método de pago por defecto"); // Log para depuración
    order.payment_gateway_names = ["default_payment_method"];
  }
  */



  //const paymentMethod = order.payment_gateway_names[0];
  const paymentMethod = order.gateway;

  if (paymentMethod === "Bank Deposit") {
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

      console.log("Regla de precio creada:", priceRuleResponse.body); // Log para depuración

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

      console.log("Código de descuento creado:", discountResponse.body); // Log para depuración

      // Aplicar el código de descuento a la orden
      const orderUpdateResponse = await client.put({
        path: `/admin/api/2023-10/orders/${order.id}.json`,
        data: {
          order: {
            id: order.id,
            discount_codes: [
              {
                code: uniqueCode,
                amount: 10,
                type: "fixed_amount",
              },
            ],
          },
        },
      });

      console.log("Descuento aplicado al pedido:", orderUpdateResponse.body); // Log para depuración

      return "Descuento aplicado";
    } catch (error) {
      console.error("Error al aplicar el descuento:", error); // Log para depuración
      throw new Error(error.message);
    }
  } else {
    console.log("Método de pago no es transferencia bancaria, no se aplicó descuento."); // Log para depuración
    return "No se aplicó descuento";
  }
};
