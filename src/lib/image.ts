// บีบอัด/ย่อรูปฝั่ง browser ก่อนอัปขึ้น Storage — ประหยัดพื้นที่ Supabase หลายเท่า
// (รูปมือถือ 2–5MB → ~150–400KB) ทำงานเฉพาะฝั่ง client เท่านั้น

/** SHA-256 ของไฟล์ (เลขลายนิ้วมือของรูป) — ใช้กันส่งรูปสลิปเดิมซ้ำ */
export async function fileSha256(file: File): Promise<string> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return "";
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "";
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("โหลดรูปไม่ได้"));
    img.src = url;
  });
}

/**
 * ย่อด้านยาวสุดให้ไม่เกิน maxDim แล้ว encode เป็น JPEG คุณภาพ quality
 * - ไม่ใช่รูป หรือเป็น GIF (ภาพเคลื่อนไหว) → คืนไฟล์เดิม
 * - รูปเล็กอยู่แล้ว หรือบีบแล้วใหญ่กว่าเดิม → คืนไฟล์เดิม
 * - พังด้วยเหตุใด ๆ → คืนไฟล์เดิม (อัปได้เสมอ)
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.8,
): Promise<File> {
  try {
    if (typeof document === "undefined") return file;
    if (!file.type.startsWith("image/")) return file;
    if (file.type === "image/gif") return file; // คง GIF ไว้ (ภาพเคลื่อนไหว)

    const url = URL.createObjectURL(file);
    let img: HTMLImageElement;
    try {
      img = await loadImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }

    const longest = Math.max(img.width, img.height);
    // เล็กพออยู่แล้ว (ทั้งมิติและขนาดไฟล์) → ไม่ต้องบีบ
    if (longest <= maxDim && file.size < 400_000) return file;

    const scale = Math.min(1, maxDim / longest);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file; // ไม่อัปไฟล์ที่ใหญ่กว่าเดิม

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], base + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // อะไรพังก็อัปไฟล์เดิมไป
  }
}
