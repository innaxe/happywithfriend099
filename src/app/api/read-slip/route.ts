// อ่านยอดเงินจากรูปสลิปด้วย Gemini Flash (ฟรี) — รันฝั่งเซิร์ฟเวอร์เพื่อเก็บ API key เป็นความลับ
// ตั้งค่า env: GEMINI_API_KEY (เอาจาก https://aistudio.google.com/apikey · ห้ามขึ้นต้น NEXT_PUBLIC_)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "gemini-2.5-flash";

export async function POST(req: Request): Promise<Response> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "ยังไม่ได้ตั้ง GEMINI_API_KEY" }, { status: 503 });
  }

  let b64 = "";
  let mime = "image/jpeg";
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "ไม่พบไฟล์รูป" }, { status: 400 });
    }
    mime = file.type || "image/jpeg";
    b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  } catch {
    return Response.json({ error: "อ่านไฟล์ไม่ได้" }, { status: 400 });
  }

  const prompt =
    "นี่คือรูปสลิปโอนเงินของธนาคารไทย/พร้อมเพย์ ดึงข้อมูลนี้: " +
    "amount = จำนวนเงินที่โอน (ตัวเลขล้วน ไม่มีคอมม่า/สัญลักษณ์), " +
    "date = วันที่โอนในรูปแบบ YYYY-MM-DD (ถ้าหาไม่เจอให้เป็น null), " +
    "ref = เลขที่รายการ/รหัสอ้างอิง/Reference No ของการโอน " +
    "(เอาเฉพาะตัวเลขและตัวอักษร ไม่มีช่องว่าง/ขีด ถ้าหาไม่เจอให้เป็น null). " +
    'ตอบเป็น JSON เท่านั้น เช่น {"amount": 500, "date": "2026-06-05", "ref": "016156145649CTF04997"}. ' +
    'ถ้าไม่ใช่สลิปโอนเงินให้ตอบ {"amount": null, "date": null, "ref": null}';

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mime, data: b64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0, responseMimeType: "application/json" },
        }),
      },
    );
    if (!res.ok) {
      return Response.json({ error: "เรียก Gemini ไม่สำเร็จ" }, { status: 502 });
    }
    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let parsed: {
      amount?: number | null;
      date?: string | null;
      ref?: string | null;
    } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // เผื่อมีข้อความห่อ JSON
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {}
      }
    }
    const amount =
      typeof parsed.amount === "number" && parsed.amount > 0
        ? Math.round(parsed.amount)
        : null;
    const date =
      typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
        ? parsed.date
        : null;
    const ref =
      typeof parsed.ref === "string" && parsed.ref.replace(/\s/g, "").length >= 6
        ? parsed.ref.replace(/\s/g, "")
        : null;
    return Response.json({ amount, date, ref });
  } catch {
    return Response.json({ error: "อ่านสลิปไม่สำเร็จ" }, { status: 500 });
  }
}
