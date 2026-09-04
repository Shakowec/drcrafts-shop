export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Методът не е разрешен."
    });
  }

  try {
    const order = req.body;

    if (!order) {
      return res.status(400).json({
        error: "Липсват данни за поръчката."
      });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Липсва RESEND_API_KEY."
      });
    }

    const customer = order.customer || {};
    const items = order.items || [];

    let total = 0;

    const productsText = items.map((item, index) => {
      const name = item.name || `Продукт #${item.id || index + 1}`;
      const qty = Number(item.qty) || 1;
      const price = Number(item.price) || 0;
      const sum = price * qty;

      total += sum;

      return `${index + 1}. ${name}
   Количество: ${qty}
   Единична цена: ${price.toFixed(2)} €
   Стойност: ${sum.toFixed(2)} €`;
    }).join("\n\n");

    const deliveryMethod =
      customer.deliveryMethod === "office"
        ? "До офис"
        : "До адрес";

    const paymentMethod =
      order.paymentMethod === "cash_on_delivery"
        ? "Наложен платеж"
        : "Плащане с карта";

    const emailText = `
НОВА ПОРЪЧКА ОТ DRCRAFT
==============================

ИНФОРМАЦИЯ ЗА КЛИЕНТА

Име: ${customer.name || "-"}
Телефон: ${customer.phone || "-"}
Имейл: ${customer.email || "-"}

ДОСТАВКА

Начин на доставка: ${deliveryMethod}
Куриер: ${customer.courier || "-"}

${customer.office
  ? `Офис: ${customer.office}`
  : `Адрес: ${customer.address || "-"}`}

Бележка от клиента:
${customer.note || "Няма"}

ПЛАЩАНЕ

Начин на плащане: ${paymentMethod}

ПРОДУКТИ
==============================

${productsText || "Няма добавени продукти."}

==============================

ОБЩА СУМА: ${total.toFixed(2)} €

==============================

Поръчката е направена автоматично през сайта на DRCRAFT.
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
        subject: `🛍️ Нова поръчка от ${customer.name || "клиент"}`,
        text: emailText
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);

      return res.status(500).json({
        error: "Грешка при изпращане на имейла.",
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
      error: "Грешка при обработване на поръчката."
    });
  }
}
