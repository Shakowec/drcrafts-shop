export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const order = req.body;

    if (!order) {
      return res.status(400).json({
        error: "Липсват данни за поръчката"
      });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Липсва RESEND_API_KEY"
      });
    }

  const customer = order.customer || {};

const productsText = (order.items || []).map((item, index) => {
  const name = item.name || item.title || `Продукт №${item.id}`;
  const qty = Number(item.qty || 1);
  const price = Number(item.price || 0);
  const total = price * qty;

  return `${index + 1}. ${name}
Количество: ${qty}
Цена: ${price.toFixed(2)} €
Общо: ${total.toFixed(2)} €`;
}).join("\n\n");

const totalPrice = (order.items || []).reduce((sum, item) => {
  return sum + (Number(item.price || 0) * Number(item.qty || 1));
}, 0);

const deliveryText =
  customer.deliveryMethod === "office"
    ? `До офис
Куриер: ${customer.courier || "Не е посочен"}
Офис: ${customer.office || "Не е посочен"}`
    : `До адрес
Адрес: ${customer.address || "Не е посочен"}`;

const paymentText =
  order.paymentMethod === "cash_on_delivery"
    ? "Наложен платеж"
    : "Плащане с карта";

const emailText = `
🛍️ НОВА ПОРЪЧКА ОТ DRCraft

================================

👤 ДАННИ ЗА КЛИЕНТА

Име: ${customer.name || "Не е посочено"}
Телефон: ${customer.phone || "Не е посочен"}
Имейл: ${customer.email || "Не е посочен"}

================================

🚚 ДОСТАВКА

${deliveryText}

================================

💳 ПЛАЩАНЕ

${paymentText}

================================

🛒 ПРОДУКТИ

${productsText || "Няма добавени продукти."}

================================

💰 КРАЙНА СУМА

${totalPrice.toFixed(2)} €

================================

📝 ЗАБЕЛЕЖКА

${customer.note || "Няма допълнителна забележка."}

================================

Поръчката е получена автоматично от сайта DRCraft.
`;  

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: "DRCraft <onboarding@resend.dev>",
        to: ["drcrafts1307@gmail.com"],
        subject: "🛍️ Нова поръчка от DRCRAFT",
        text: emailText
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);

      return res.status(500).json({
        error: "Грешка при изпращане на имейла",
        details: data
      });
    }

    console.log("НОВА ПОРЪЧКА:", order);
    console.log("EMAIL SENT:", data);

    return res.status(200).json({
      success: true,
      message: "Поръчката е приета и имейлът е изпратен."
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Грешка при обработване на поръчката"
    });
  }
}
