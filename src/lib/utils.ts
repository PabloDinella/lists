import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import debugLib from "debug";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

  export const debug = debugLib("lists")