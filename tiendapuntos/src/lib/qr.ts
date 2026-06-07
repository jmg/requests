import QRCode from "qrcode";

// Genera un QR como data URL (PNG) para incrustar en <img>.
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 220 });
}
