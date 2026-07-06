export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "لا توجد صورة مرسلة" });

  // 1. التأكد من وجود المفتاح
  if (!process.env.OPENAI_API_KEY) {
      console.log("Error: OPENAI_API_KEY is missing in Vercel!");
      return res.status(500).json({ error: "Server Configuration Error: API Key missing" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "استخرج البيانات التالية من الفاتورة بصيغة JSON فقط بهذا الشكل: {\"id\": \"رقم\", \"customer\": \"اسم\", \"amount\": \"رقم\", \"notes\": \"نص\"}. لا تكتب أي شيء إضافي." },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    
    // 2. فحص محتوى الرد من OpenAI
    if (!data.choices || data.choices.length === 0) {
        console.log("API Response Error:", JSON.stringify(data));
        return res.status(500).json({ error: "OpenAI did not return data: " + JSON.stringify(data) });
    }

    const content = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(content);

  } catch (error) {
    console.log("Critical Server Error:", error.message);
    return res.status(500).json({ error: "System Crash: " + error.message });
  }
}
