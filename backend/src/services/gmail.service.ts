// backend/src/services/gmail.service.ts
import { google } from 'googleapis';
import { decrypt } from './crypto.service.js';

interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  date: Date;
}

export async function getUnreadEmails(
  accessTokenEncrypted: string,
  maxResults: number = 50
): Promise<Email[]> {
  const accessToken = decrypt(accessTokenEncrypted);

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults
    });

    if (!messagesResponse.data.messages) {
      return [];
    }

    const emails: Email[] = [];

    for (const message of messagesResponse.data.messages) {
      const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full'
      });

      const payload = messageResponse.data.payload!;
      const headers = payload.headers || [];

      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = new Date(parseInt(messageResponse.data.internalDate || '0'));

      let body = '';
      if (payload.body?.data) {
        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      } else if (payload.parts) {
        const textPart = payload.parts.find(part =>
          part.mimeType === 'text/plain'
        );
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      }

      emails.push({
        id: message.id!,
        threadId: message.threadId!,
        subject,
        from,
        snippet: messageResponse.data.snippet || '',
        body: body.substring(0, 5000),
        date
      });
    }

    return emails;
  } catch (error) {
    console.error('Gmail API error:', error);
    throw error;
  }
}
