import { NextRequest, NextResponse } from 'next/server';
import { gmail_v1, google } from 'googleapis';
import { parseFamAppEmail } from '@/lib/utils';
import { Expense } from '@/types/expense';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Attempt to refresh the token if it might be expired
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
    } catch (refreshError: any) {
      // If refresh fails with 400/401, the refresh token might be invalid
      // Continue with the original access token - it might still be valid
      console.warn('Token refresh failed, attempting with current token:', refreshError.message);
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Determine date range for query
    // If this is the first sync, fetch 2 years. Otherwise only fetch since last sync.
    const lastSyncTime = request.headers.get('X-Last-Sync-Time');
    let dateStr: string;
    
    if (lastSyncTime) {
      // Subsequent sync - only fetch new emails since last sync
      const lastSyncDate = new Date(lastSyncTime);
      // Subtract 1 minute to ensure we don't miss emails from the exact sync time
      lastSyncDate.setMinutes(lastSyncDate.getMinutes() - 1);
      dateStr = lastSyncDate.toISOString().split('T')[0];
      console.log('Incremental sync - fetching emails after:', dateStr);
    } else {
      // First sync - fetch 2 years of historical data
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      dateStr = twoYearsAgo.toISOString().split('T')[0];
      console.log('Initial sync - fetching 2 years of emails after:', dateStr);
    }
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: `(from:no-reply@famapp.in OR from:noreply@famapp.in) after:${dateStr}`,
      maxResults: 500,
    });

    const messages = response.data.messages || [];
    
    // Process ALL messages in parallel at once (no sequential batching)
    const expensePromises = messages.map(async (message) => {
      if (!message.id) return null;

      try {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });

        const headers = (msg.data.payload?.headers || []) as Array<{ name: string; value?: string }>;
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
        const dateStr = headers.find((h: any) => h.name === 'Date')?.value;
        
        if (!dateStr) return null;

        // Extract email body
        let body = '';
        if (msg.data.payload?.parts) {
          // Multi-part email - look for plain text first
          const textPart = msg.data.payload.parts.find((part: any) => part.mimeType === 'text/plain');
          const htmlPart = msg.data.payload.parts.find((part: any) => part.mimeType === 'text/html');
          
          const part = textPart || htmlPart;
          if (part?.body?.data) {
            try {
              body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            } catch (e) {
              console.error('Error decoding body:', e);
            }
          }
        } else if (msg.data.payload?.body?.data) {
          // Single part email
          try {
            body = Buffer.from(msg.data.payload.body.data, 'base64').toString('utf-8');
          } catch (e) {
            console.error('Error decoding body:', e);
          }
        }

        const parsedExpense = parseFamAppEmail(body, subject);
        if (parsedExpense) {
          const gmailDate = new Date(dateStr);
          if (!isNaN(gmailDate.getTime())) {
            parsedExpense.date = gmailDate.toISOString().split('T')[0];
          }
          parsedExpense.messageId = message.id;
          
          // Debug logging
          console.log('Parsed expense:', {
            subject,
            body: body.substring(0, 100),
            parsed: parsedExpense,
          });
          
          return parsedExpense;
        }
        return null;
      } catch (e) {
        console.error('Error processing message:', message.id, e);
        return null;
      }
    });

    const allExpenses = await Promise.all(expensePromises);
    const expenses = allExpenses.filter((exp): exp is Expense => exp !== null);

    // Log first 5 expenses for debugging
    console.log('Total expenses fetched:', expenses.length);
    expenses.slice(0, 5).forEach((exp, i) => {
      console.log(`Expense ${i + 1}:`, {
        date: exp.date,
        amount: exp.amount,
        type: exp.type,
        description: exp.description,
      });
    });

    return NextResponse.json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    console.error('Error fetching Gmail data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses from Gmail' },
      { status: 500 }
    );
  }
}
