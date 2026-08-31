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

    const emailText = `
НОВА ПОРЪЧКА ОТ DRCRAFT

--------------------------------
${JSON.stringify(order, null, 2)}
--------------------------------

Получена автоматично от сайта.
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
