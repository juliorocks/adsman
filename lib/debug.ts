
import fs from 'fs';
import path from 'path';

export async function logToFile(message: string) {
    const logPath = path.join(process.cwd(), 'debug_campaigns.log');
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(logPath, `${timestamp}: ${message}\n`);
    } catch (err) {
        console.error("Failed to write to log file:", err);
    }
}
