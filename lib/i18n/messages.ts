import type { Locale } from "./locales";

export function translator<Messages extends Record<string, string>>(
  locale: Locale,
  de: Messages,
  it: Record<keyof Messages, string>,
  en: Record<keyof Messages, string>,
) {
  const messages = { de, it, en }[locale];
  return (key: keyof Messages, values?: Record<string, string | number>) =>
    messages[key].replace(/\{([a-zA-Z]\w*)\}/g, (placeholder, name: string) =>
      values && Object.hasOwn(values, name) ? String(values[name]) : placeholder,
    );
}
