import QRCode from "qrcode";

export async function generateQRCodeDataURL(
  url: string,
  options?: {
    size?: number;
    color?: string;
    backgroundColor?: string;
  }
): Promise<string> {
  const { size = 300, color = "#000000", backgroundColor = "#ffffff" } = options ?? {};

  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: {
      dark: color,
      light: backgroundColor,
    },
    errorCorrectionLevel: "M",
  });
}

export async function generateQRCodeSVG(
  url: string,
  options?: {
    color?: string;
    backgroundColor?: string;
  }
): Promise<string> {
  const { color = "#000000", backgroundColor = "#ffffff" } = options ?? {};

  return QRCode.toString(url, {
    type: "svg",
    margin: 2,
    color: {
      dark: color,
      light: backgroundColor,
    },
    errorCorrectionLevel: "M",
  });
}
