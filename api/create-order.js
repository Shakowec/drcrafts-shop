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
        error: "Липсват данни за поръчката."
      });
    }

    console.log("НОВА ПОРЪЧКА:", order);

    return res.status(200).json({
      success: true,
      message: "Поръчката е приета успешно."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Грешка при обработване на поръчката."
    });
  }
}
