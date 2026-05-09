export function parseBrowser(ua: string): string {
  if (!ua) return "Unknown";
  if (/Edg\//i.test(ua))           return "Edge";
  if (/OPR\//i.test(ua))           return "Opera";
  if (/SamsungBrowser/i.test(ua))  return "Samsung";
  if (/UCBrowser/i.test(ua))       return "UC Browser";
  if (/YaBrowser/i.test(ua))       return "Yandex";
  if (/Firefox\/\d/i.test(ua))     return "Firefox";
  if (/Chrome\/\d/i.test(ua))      return "Chrome";
  if (/Safari\/\d/i.test(ua))      return "Safari";
  if (/MSIE|Trident/i.test(ua))    return "IE";
  return "Other";
}

export function parseOs(ua: string): string {
  if (!ua) return "Unknown";
  if (/Windows NT/i.test(ua))      return "Windows";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X/i.test(ua))        return "macOS";
  if (/Android/i.test(ua))         return "Android";
  if (/Linux/i.test(ua))           return "Linux";
  if (/CrOS/i.test(ua))            return "ChromeOS";
  return "Other";
}

export function parseLanguage(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return null;
  const primary = acceptLanguage.split(",")[0].split(";")[0].trim();
  return primary.split("-")[0].toLowerCase() || null;
}

export function parseReferrerDomain(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}
