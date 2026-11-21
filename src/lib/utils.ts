import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "+97477350438" -> "https://wa.me/97477350438" */
export function whatsappLink(number: string, text?: string) {
  const digits = number.replace(/[^\d]/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

/** "+97477350438" -> "+974 7735 0438" */
export function formatPhone(number: string) {
  const d = number.replace(/[^\d]/g, "");
  if (d.startsWith("974") && d.length === 11) return `+974 ${d.slice(3, 7)} ${d.slice(7)}`;
  return number;
}

export function absoluteUrl(path: string, base: string) {
  return new URL(path, base).toString();
}
