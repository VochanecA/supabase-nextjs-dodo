// src/lib/utils/encryption.ts

// Jednostavna base64 enkripcija (za osnovnu zaštitu)
export function encryptData(data: string): string {
  if (typeof window === 'undefined') return data;
  return btoa(encodeURIComponent(data));
}

export function decryptData(encryptedData: string): string {
  if (typeof window === 'undefined') return encryptedData;
  try {
    return decodeURIComponent(atob(encryptedData));
  } catch {
    return encryptedData; // Fallback ako dekripcija ne uspije
  }
}

// Interface za page data
export interface PageData {
  subscriptionStatus: string;
  accountName: string;
  isSubscribed: boolean;
  timestamp?: number;
}

// Enkripcija objekta
export function encryptObject(obj: PageData): string {
  const jsonString = JSON.stringify(obj);
  return encryptData(jsonString);
}

// Dekripcija objekta
export function decryptObject(encryptedString: string): PageData | null {
  try {
    const decrypted = decryptData(encryptedString);
    return JSON.parse(decrypted) as PageData;
  } catch {
    return null;
  }
}

// Generic verzija ako trebate za druge tipove podataka
export function encryptGenericObject<T extends Record<string, unknown>>(obj: T): string {
  const jsonString = JSON.stringify(obj);
  return encryptData(jsonString);
}

export function decryptGenericObject<T extends Record<string, unknown>>(encryptedString: string): T | null {
  try {
    const decrypted = decryptData(encryptedString);
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}