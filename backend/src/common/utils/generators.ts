import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a random invite code for families
 */
export function generateInviteCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a random PIN for child accounts
 */
export function generatePin(length = 4): string {
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10).toString();
  }
  return pin;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Hash a PIN (simple hash for demo, use bcrypt in production)
 */
export function hashPin(pin: string): string {
  // In production, use bcrypt. For simplicity here, we'll just return the pin
  // The actual implementation will use bcrypt in the auth service
  return pin;
}
