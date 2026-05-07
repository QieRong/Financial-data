import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Route } from 'next'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function asPath(url: string) {
  return url as unknown as URL;
}

export function asRoute(url: string) {
  return url as Route
}

export const formatPeriod = (date: string) => {
  return date.substring(0, 7)
}

export const formatValue = (value: number) => {
  return Number(value.toFixed(2))
}

export const formatAmount = (value: number) => {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}亿`
  } else if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`
  }
  return value.toFixed(2)
}
