import { format } from "date-fns";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(value: string) {
  return format(new Date(value), "MMM d, yyyy");
}

export function formatDateTime(value: string) {
  return format(new Date(value), "MMM d, yyyy h:mm a");
}
