
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";

// Lazy-initialize SECRET_KEY inside functions to avoid module-scope errors
// in static generation / edge contexts. Computed once per process.
let _secretKey: Buffer | null = null;

function getSecretKey(): Buffer {
    if (_secretKey) return _secretKey;
    const raw = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_dev_key_32_chars_padding";
    _secretKey = createHash("sha256").update(raw).digest();
    return _secretKey;
}

export const encrypt = (text: string): string => {
    const key = getSecretKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decrypt = (text: string): string => {
    // If text is missing or not in the expected encrypted format, return as-is
    // (it may already be a plain token from older records)
    if (!text) return text;

    // If it doesn't look like an encrypted value (iv:tag:data), return raw
    const parts = text.split(":");
    if (parts.length !== 3) {
        return text;
    }

    const [ivPart, authTagPart, encryptedPart] = parts;
    if (!ivPart || !authTagPart || !encryptedPart) {
        return text;
    }

    try {
        const key = getSecretKey();
        const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivPart, "hex"));
        decipher.setAuthTag(Buffer.from(authTagPart, "hex"));
        let decrypted = decipher.update(encryptedPart, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch (err) {
        // Decryption failed — likely wrong key in production vs dev environment.
        // Log the error but DO NOT throw — return empty string so callers can
        // handle gracefully instead of crashing the Server Component render.
        console.error("[vault] decrypt failed — check SUPABASE_SERVICE_ROLE_KEY env var matches what was used to encrypt:", err instanceof Error ? err.message : err);
        return "";
    }
};
