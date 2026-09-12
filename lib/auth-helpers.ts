import bcrypt from "bcryptjs";

/**
 * Hashes a plain text password using bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Compares a plain text password with a stored hash or plain text (for legacy compatibility).
 */
export async function comparePassword(
  plainText: string,
  storedPassword?: string
): Promise<{ isValid: boolean; needsRehash: boolean }> {
  if (!storedPassword || !plainText) {
    return { isValid: false, needsRehash: false };
  }

  // Check if storedPassword is a bcrypt hash (bcrypt hashes start with $2a$, $2b$, or $2y$)
  const isBcryptHash = /^\$2[aby]\$\d+\$/.test(storedPassword);

  if (isBcryptHash) {
    const isValid = await bcrypt.compare(plainText, storedPassword);
    return { isValid, needsRehash: false };
  }

  // Legacy fallback: plain text comparison
  const isValid = storedPassword === plainText;
  return { isValid, needsRehash: isValid };
}
