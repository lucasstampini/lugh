import { z } from "zod";

// CPF e CNPJ: só validação de formato e dígitos verificadores. O Lugh não guarda o
// documento: ele vai direto para a AbacatePay na criação da subconta.

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// Dígito verificador pelo módulo 11, com os pesos de cada posição.
function checkDigit(digits: number[], weights: number[]): number {
  const sum = digits.reduce((total, digit, index) => total + digit * weights[index], 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

function allSameDigit(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || allSameDigit(digits)) return false;

  const numbers = [...digits].map(Number);
  const first = checkDigit(numbers.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(numbers.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return numbers[9] === first && numbers[10] === second;
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || allSameDigit(digits)) return false;

  const numbers = [...digits].map(Number);
  const first = checkDigit(numbers.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(numbers.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return numbers[12] === first && numbers[13] === second;
}

// Aceita com ou sem máscara e devolve só os dígitos.
export const taxIdSchema = z
  .string({ error: "Digite seu CPF ou CNPJ." })
  .trim()
  .min(1, "Digite seu CPF ou CNPJ.")
  // A máscara só tem pontos, traço, barra e espaço: qualquer outra coisa é erro de digitação.
  .regex(/^[\d.\-/\s]+$/, "Use só números, com ou sem pontuação.")
  .transform(onlyDigits)
  .refine((digits) => isValidCpf(digits) || isValidCnpj(digits), "CPF ou CNPJ inválido. Confira os números.");
