
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectURI = process.env.GOOGLE_REDIRECT_URI;

export function getOAuth2Client(): OAuth2Client {
    if (!clientID || !clientSecret || !redirectURI) {
        throw new Error("Missing Google OAuth environment variables");
    }
    // Debug log to ensure the URI matches the Google Console exactly (server-side logs only)
    console.log("[GoogleAuth] Initializing with Redirect URI:", redirectURI.trim());
    return new google.auth.OAuth2(clientID, clientSecret, redirectURI.trim());
}

export const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
];

export async function getDriveClient(accessToken: string) {
    const auth = getOAuth2Client();
    auth.setCredentials({ access_token: accessToken });
    return google.drive({ version: 'v3', auth });
}

export async function listDriveFiles(accessToken: string, folderId: string = 'root') {
    const drive = await getDriveClient(accessToken);

    // Query items in the specific folder that are either folders, images or videos
    const query = `'${folderId}' in parents and (mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`;

    const response = await drive.files.list({
        pageSize: 100,
        fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, webContentLink, size)',
        q: query,
        spaces: 'drive',
        orderBy: 'folder,name', // Folders first, then by name
    });
    return response.data;
}

export async function downloadDriveFile(accessToken: string, fileId: string): Promise<Buffer> {
    const drive = await getDriveClient(accessToken);
    const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data as ArrayBuffer);
}
