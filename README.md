# FamTrack - Expenditure Tracking App 💰

A modern, feature-rich expenditure tracking application that seamlessly integrates with Gmail to automatically sync and analyze your **FamApp transaction emails**. Built with cutting-edge web technologies for a smooth, intuitive user experience.

> **Note**: This project is 🎨 **vibe coded** - built with passion, intuition, and flow.

> ⚠️ **FamApp Only**: This app is designed exclusively to track transactions from **FamApp**. It automatically fetches and parses emails from `no-reply@famapp.in` and works best with FamApp's transaction email format.

---

## ✨ Features

### 📧 Gmail Integration
- **OAuth 2.0 Authentication**: Secure Google account connection
- **Automatic Email Sync**: Fetches FamApp transaction emails from your inbox
- **Smart Incremental Syncing**: Efficient data fetching (2-year initial sync, then incremental updates)
- **Read-Only Access**: Your Gmail data stays secure - we only read emails, never modify

### 💳 Expense Tracking
- **Automatic Classification**: Intelligently categorizes transactions as income or expenses
- **Smart Categorization**: Auto-tags food expenses vs. personal transactions
- **Recipient Extraction**: Shows exactly who you paid or received money from
- **Date-Based Filtering**: Track spending across multiple time ranges

### 📊 Analytics & Insights
- **Real-Time Metrics**: 
  - Current month spending
  - Projected month-end totals
  - Daily average spending
  - Total income vs. expenses
- **Visual Charts**: Line graphs showing monthly spending trends
- **Flexible Date Ranges**: Last 30 days, 3/6/12 months, all-time, or custom ranges
- **Monthly Breakdowns**: Detailed expense summaries by month
- **Expandable Transactions**: View full email content for any transaction

### 🎨 User Interface
- **Responsive Dashboard**: Works seamlessly on desktop, tablet, and mobile
- **Material Design**: Clean, modern UI with Tailwind CSS
- **Professional Branding**: Custom favicon and polished layout
- **Smooth Interactions**: Collapsible sections and intuitive navigation
- **Dark-Themed Cards**: Professional slate and blue color scheme

### 💾 Data Persistence
- **Local Storage**: All data stored safely in your browser
- **Offline Access**: View your expenses anytime, even offline
- **Manual Sync Control**: Refresh data whenever you need

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14+, React, TypeScript |
| **Styling** | Tailwind CSS |
| **Authentication** | Google OAuth 2.0 |
| **APIs** | Gmail API v1 |
| **Visualization** | Chart.js + react-chartjs-2 |
| **Utilities** | date-fns, Axios |
| **Icons** | Lucide React |
| **Storage** | Browser localStorage |

## 📋 Prerequisites

- Node.js 18+ and npm
- Google Account with active Gmail
- 5 minutes to set up OAuth credentials

## 🚀 Quick Start

### 1. Setup Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Gmail API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click on it and select "Enable"
   
4. Create OAuth 2.0 Credentials:
   - Go to "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - Your production domain (e.g., `https://famtrack.vercel.app`)
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback` (development)
     - `https://yourdomain.com/api/auth/callback` (production)
   - Copy the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### 3. Install & Run

```bash
# Clone the repository
git clone https://github.com/yourusername/famtrack.git
cd famtrack

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` and click **"Login with Gmail"** to get started!

## 📖 Usage Guide

### Home Page - Dashboard
- View your **This Month's Spending** card
- See **Projected Spending** for the month
- Browse your **Transaction History** - all expenses from this month
- Click **"View Financial Insights"** for detailed analytics

### Analytics Page - Financial Insights
1. **Select Date Range**:
   - Last 30 Days (default, collapsible)
   - Last 3/6/12 Months
   - All Time
   - Custom date range

2. **View Your Metrics**:
   - Total Spent & Total Income
   - Daily Average Spending
   - Net Difference (Income - Expenses)
   - Monthly Summary Table

3. **Analyze Trends**:
   - Line chart showing spending vs. income by month
   - Click on monthly rows for quick details

4. **Browse Transactions**:
   - Filter by All/Income/Expense
   - Click mail icon to view original email
   - Delete incorrect entries
   - Sort by date, amount, or category

## 📊 How It Works

### Email Parsing Pipeline
1. **Fetch**: Gmail API retrieves emails from `no-reply@famapp.in`
2. **Extract**: Full email body decoded from base64 encoding
3. **Parse**: Regex patterns identify:
   - **Amount**: `₹`, `Rs`, or `$` currency symbols
   - **Transaction Type**: "paid" keyword = expense, else income
   - **Recipient**: Extracted from "to [Name] at [Time]" pattern
   - **Date**: Parsed from email timestamp
4. **Categorize**: Auto-categorized as:
   - **Food**: If recipient is BigBasket or Innovative Retail
   - **Individual**: For all other recipients
5. **Store**: Saved to browser localStorage with unique message ID

### Intelligent Syncing
- **First Sync**: Fetches 2 years of historical emails
- **Subsequent Syncs**: Only fetches new emails since last sync
- **Efficiency**: Prevents duplicate processing using message IDs
- **timestamp Tracking**: Last sync time stored in browser

## 📁 Project Structure

```
famtrack/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Home page dashboard
│   │   ├── layout.tsx                    # Root layout (navbar, favicon)
│   │   ├── globals.css                   # Global styles & layout
│   │   ├── analytics/
│   │   │   └── page.tsx                  # Financial insights page
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── callback/route.ts     # OAuth callback handler
│   │       │   └── token/route.ts        # Generate auth URL
│   │       ├── gmail/route.ts            # Gmail sync endpoint
│   │       └── expenses/route.ts         # Expense CRUD operations
│   ├── components/
│   │   ├── Dashboard.tsx                 # Metrics & summary display
│   │   ├── ExpenseList.tsx               # Transaction table with expandable rows
│   │   ├── Chart.tsx                     # Monthly spending chart
│   │   └── Filter.tsx                    # Transaction filter (all/income/expense)
│   ├── lib/
│   │   ├── utils.ts                      # Email parsing & calculations
│   │   └── storage.ts                    # localStorage management
│   ├── types/
│   │   └── expense.ts                    # TypeScript interfaces
│   └── favicon.svg                       # App icon (64x64)
├── public/
│   └── favicon.svg                       # Favicon for browser tab
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── README.md
```

## 🔐 Privacy & Security

✅ **Your data is yours**
- All data stored locally in browser localStorage
- OAuth tokens stored in secure cookies
- Gmail access is **read-only** - we don't modify emails
- No data sent to external servers (except Gmail API)
- Revoke access anytime from [Google Account Settings](https://myaccount.google.com/permissions)

## 🌐 Deployment

### Deploy to Vercel (Recommended)

Vercel is designed for Next.js and provides:
- Automatic deployments on every git push
- Free serverless functions
- Edge Network for fast deliveries

**Deploy in 3 steps:**

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Visit [vercel.com](https://vercel.com/new)
   - Import your GitHub repository
   - Select project settings

3. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add `GOOGLE_CLIENT_SECRET` (keep this secret!)
   - `NEXT_PUBLIC_*` variables are automatically added from .env
   - Update `NEXT_PUBLIC_REDIRECT_URI` to your Vercel domain:
     ```
     https://your-project.vercel.app/api/auth/callback
     ```

4. **Deploy**
   - Click "Deploy"
   - Vercel automatically redeploys on new pushes to main

**Don't forget to update Google OAuth!**
- Add your Vercel domain to Google Cloud Console authorized URIs:
  - Authorized origins: `https://your-project.vercel.app`
  - Redirect URI: `https://your-project.vercel.app/api/auth/callback`

### Other Hosting Options
- **Railway**: `railway up` - simple CLI deployment
- **Render**: Heroku alternative with free tier
- **Self-Hosted**: DigitalOcean, AWS EC2, Linode (requires Node.js)

## 🎨 Customization

### Change Color Scheme
Edit `tailwind.config.ts`:
```typescript
theme: {
  colors: {
    slate: { /* your colors */ },
    blue: { /* your colors */ },
    // Customize here
  }
}
```

### Modify Categories
Edit `src/lib/utils.ts` in the `parseFamAppEmail` function:
```typescript
// Auto-categorize based on recipient
let category = 'Individual';
if (recipientName.toLowerCase().includes('your-store')) {
  category = 'Your Category';
}
```

### Add New Metrics
Extend `src/components/Dashboard.tsx`:
```typescript
const newMetric = expenses
  .filter(exp => /* your condition */)
  .reduce((sum, exp) => sum + exp.amount, 0);
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Favicon not showing | Hard refresh (`Ctrl+Shift+R`), clear browser cache |
| Gmail sync returns empty | Ensure FamApp emails in inbox (not archived), check API enabled |
| Expenses show as ₹0 | Click "Refresh" to sync, verify email format has ₹ symbol |
| OAuth redirect error | Update `NEXT_PUBLIC_REDIRECT_URI` in .env.local and Google Console |
| Port 3000 in use | Use `PORT=3001 npm run dev` |
| "Unauthorized" error when syncing | Logout and login again to refresh tokens |

## 📦 Scripts

```bash
# Development server (hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Check for syntax errors
npx tsc --noEmit
```

## 🤝 Contributing

Contributions welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 About

**Made with ❤️ by Joel**

This project was **vibe coded** - built with intuition, flow, and passion for creating beautiful, functional financial tools.

- 🎨 Designed with user experience in mind
- 🚀 Built with modern web technologies
- 📊 Powered by reliable data integration
- 💰 Made for financial awareness

### Key Achievements
- ✅ OAuth 2.0 secure authentication
- ✅ Smart email parsing & categorization
- ✅ Efficient incremental data syncing
- ✅ Beautiful responsive UI
- ✅ Production-ready code quality

---

## 📞 Need Help?

- 🐛 Found a bug? [Open an Issue](https://github.com/yourusername/famtrack/issues)
- 💡 Have a feature idea? [Start a Discussion](https://github.com/yourusername/famtrack/discussions)
- 📧 Questions? Feel free to reach out

---

**Take control of your spending today with FamTrack! 🎯**

*P.S. - This app is proudly vibe coded. No corporate mumbo jumbo, just clean code and good intentions.* ✨
