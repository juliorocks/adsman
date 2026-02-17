
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = createHash("sha256")
    .update(process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_dev_key")
    .digest();

export const encrypt = (text: string) => {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decrypt = (text: string) => {
    const [ivPart, authTagPart, encryptedPart] = text.split(":");
    if (!ivPart || !authTagPart || !encryptedPart) {
        throw new Error("Invalid encrypted text format");
    }

    const decipher = createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), Buffer.from(ivPart, "hex"));
    decipher.setAuthTag(Buffer.from(authTagPart, "hex"));
    let decrypted = decipher.update(encryptedPart, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};
