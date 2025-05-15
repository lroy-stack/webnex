
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un valor numérico como moneda (EUR)
 */
export function formatCurrency(amount: number): string {
  // Evitar errores con valores no numéricos
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0,00 €';
  }
  
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}
