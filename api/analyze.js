const fetch = require('node-fetch');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { imageBase64 } = req.body;

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
            { type: "text", text: "استخرج البيانات التالية من الفاتورة بصيغة JSON فقط: id, customer, amount, notes. لا تكتب أي شيء آخر." },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    return res.status(200).json(JSON.parse(data.choices[0].message.content));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
