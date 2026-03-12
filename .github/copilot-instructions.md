# FamTrack - Expenditure Tracking App

## Project Overview
A comprehensive expenditure tracking application that integrates with Gmail to fetch FamApp transaction emails and provides detailed spending analytics.

## Features
- Gmail OAuth authentication for email fetching
- Automatic expense extraction from FamApp emails
- Real-time spending metrics (this month, last 30 days, last year)
- Average daily spending analysis
- Monthly project tracking
- Filterable expense list (income/expense)
- Responsive dashboard with charts
- Local data persistence

## Tech Stack
- **Frontend**: Next.js 14+ with TypeScript, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Charts**: Chart.js with React wrapper
- **Authentication**: Google OAuth 2.0
- **Dependencies**: 
  - google-auth-library: Gmail API authentication
  - googleapis: Gmail API client
  - axios: HTTP client
  - chart.js: Data visualization
  - react-chartjs-2: Chart.js React wrapper
  - date-fns: Date formatting
  - lucide-react: Icons

## Project Setup Status
- [x] Scaffold Next.js project
- [x] Install dependencies
- [x] Create API routes for Gmail integration
- [x] Create dashboard components
- [x] Create expense list and filtering
- [x] Create analytics components
- [x] Set up environment variables
- [x] Project builds successfully
- [x] Documentation complete

## Environment Variables
The `.env.local` file should be configured with:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

## Running the App
```bash
npm run dev
```
Visit http://localhost:3000

## File Structure
```
src/
├── app/
│   ├── page.tsx (Dashboard)
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── auth/
│       │   ├── callback/route.ts
│       │   └── token/route.ts
│       ├── expenses/route.ts
│       └── gmail/route.ts
├── components/
│   ├── Dashboard.tsx
│   ├── ExpenseList.tsx
│   ├── Chart.tsx
│   └── Filter.tsx
├── lib/
│   ├── gmail.ts
│   ├── storage.ts
│   └── utils.ts
└── types/
    └── expense.ts
```

## Key Features Implementation

### Gmail Integration
- OAuth 2.0 authentication flow
- Email fetching from FamApp sender
- Automatic parsing of transaction amounts (₹ symbol detection)
- Message ID tracking to prevent duplicates

### Expense Tracking
- Automatic income/expense classification
- Date-based filtering
- Category tracking
- Local storage persistence

### Analytics
- Monthly spending breakdown
- Income vs expense comparison
- Category-wise pie charts
- 30-day spending trends
- Daily average calculations

### UI Components
- Responsive dashboard with metric cards
- Interactive expense filtering
- Data visualization with Chart.js
- Secure logout functionality
- Loading states and error handling

## Notes
- FamApp emails are parsed to extract transaction amounts and descriptions
- Data is stored in localStorage for now (can be upgraded to a database)
- Google OAuth credentials are provided by the user
- All Gmail access is read-only
- No data is stored on external servers

