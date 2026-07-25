import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TYPE_ROUTES: Record<string, string> = {
  review: 'reviews',
  news: 'news',
  spotlight: 'spotlight',
  list: 'lists',
}

export function typeToRoute(type: string): string {
  return TYPE_ROUTES[type] ?? `${type}s`
}
