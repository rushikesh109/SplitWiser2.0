# Splitwiser

[![Vercel](https://img.shields.io/badge/deployed%20on-vercel-000?logo=vercel)](https://splitwiser-app.vercel.app)
[![Next.js](https://img.shields.io/badge/built%20with-Next.js-000?logo=nextdotjs)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/styled%20with-Tailwind%20CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](CONTRIBUTING.md)
[![No License](https://img.shields.io/badge/license-NOT%20SPECIFIED-lightgrey)](LICENSE)

---

## Overview

**Splitwiser** is a modern web application that helps friends, roommates, and groups split expenses effortlessly. Whether you're sharing rent, planning a trip, or managing group expenses, Splitwiser provides a seamless experience for tracking shared expenses and settling balances.

- **Live Demo:** [https://split-wiser2-0.vercel.app](https://split-wiser2-0.vercel.app/)

---

## 🚀 Key Features

### Core Functionality
- **Group Expenses Management:** Create and manage groups for roommates, trips, or events.
- **Smart Settlements:** Intelligent algorithm that minimizes transactions for efficient settling.
- **Multiple Split Types:** Split bills equally, by percentage, or assign exact amounts.
- **Real-time Updates:** Instant updates when friends add expenses or settle balances.
- **Expense Analytics:** Visualize spending habits with detailed analytics and charts.
- **Payment Reminders:** Timely reminders for pending payments and settlements.

### User Experience
- **Modern UI:** Beautiful, responsive design built with Tailwind CSS and Radix UI.
- **Authentication:** Secure user authentication powered by Clerk.
- **Real-time Sync:** Live updates across all devices using Convex.
- **Mobile Responsive:** Optimized for all screen sizes.
- **Dark Mode:** Seamless light/dark theme toggle.

- **AI-generated Monthly Expense Summary:** A server-side AI insights feature generates short, human-readable summaries of monthly expense data. It runs as a Convex action that uses Google Generative AI (Gemini) with a server-only `GEMINI_API_KEY` and is surfaced via the existing expense-summary API flow.

- **Docker (published image):** You can run the app from a published Docker image. Pull `rushim09/splitwiser:1.0` and run it with a production env file (example below). Keep server API keys (like `GEMINI_API_KEY` and `RESEND_API_KEY`) out of client bundles.


---

## 🏗️ Architecture & Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS 4, Radix UI, Lucide Icons
- **State & Forms:** Convex (real-time DB & sync), React Hook Form, Zod, Clerk Auth
- **Backend:** Convex (serverless DB/functions), Inngest (background jobs), Resend (emails)
- **AI/Automation:** Google Generative AI, Inngest
- **Charts:** Recharts

**Key Technologies:**
```json
{
  "frontend": ["Next.js", "React 19", "Tailwind CSS", "Radix UI"],
  "backend": ["Convex", "Clerk", "Inngest", "Resend"],
  "ai": ["Google Generative AI"],
  "charts": ["Recharts"]
}
```

---

## 📁 Project Structure

```
splitwiser/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/             # Sign in pages
│   │   └── sign-up/             # Sign up pages
│   ├── (main)/                  # Main application routes
│   │   ├── dashboard/           # Dashboard with analytics
│   │   ├── expenses/            # Expense management
│   │   ├── contacts/            # User contacts and groups
│   │   ├── groups/              # Group management
│   │   ├── settlements/         # Settlement tracking
│   │   └── person/              # Individual user pages
│   └── api/                     # API routes
├── components/                   # Reusable UI components
│   ├── ui/                      # Base UI components (Radix)
│   └── *.jsx                    # Feature-specific components
├── convex/                      # Backend functions and schema
│   ├── schema.js                # Database schema definition
│   ├── users.js                 # User management functions
│   ├── expenses.js              # Expense CRUD operations
│   ├── groups.js                # Group management
│   ├── settlements.js           # Settlement tracking
│   ├── dashboard.js             # Dashboard analytics
│   └── contacts.js              # Contact management
├── lib/                         # Utility functions
│   ├── expense-categories.js    # Expense category definitions
│   ├── inngest/                 # Background job functions
│   └── utils.js                 # General utilities
└── hooks/                       # Custom React hooks
```

---

## 🗄️ Database Schema (Core Tables)

### Users
```js
{
  name: string,
  email: string,
  tokenIdentifier: string,
  imageUrl: optional(string)
}
```

### Expenses
```js
{
  description: string,
  amount: number,
  category: optional(string),
  date: number, // timestamp
  paidByUserId: id("users"),
  splitType: string, // "equal", "percentage", "exact"
  splits: array({
    userId: id("users"),
    amount: number,
    paid: boolean
  }),
  groupId: optional(id("groups")),
  createdBy: id("users")
}
```

### Groups
```js
{
  name: string,
  description: optional(string),
  createdBy: id("users"),
  members: array({
    userId: id("users"),
    role: string, // "admin" or "member"
    joinedAt: number
  })
}
```

### Settlements
```js
{
  amount: number,
  note: optional(string),
  date: number, // timestamp
  paidByUserId: id("users"),
  receivedByUserId: id("users"),
  groupId: optional(id("groups")),
  relatedExpenseIds: optional(array(id("expenses"))),
  createdBy: id("users")
}
```

---

## 🔧 Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) / [npm](https://www.npmjs.com/) / [yarn](https://yarnpkg.com/)
- Convex, Clerk, and Resend accounts for backend services

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/splitwiser.git
   cd splitwiser
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
yarn install
   # or
   pnpm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local` and fill in required values (Convex, Clerk, etc).

4. **Run the development server:**
   ```bash
   npm run dev
   # or
yarn dev
   # or
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production
```bash
npm run build
npm start
```

---

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Add environment variables in the Vercel dashboard
3. Deploy automatically on push to the main branch

### Convex Deployment
```bash
npx convex deploy
```

---

## 📊 Key Features Explained

### Smart Settlement Algorithm
- Calculates pair-wise balances between all group members
- Reduces circular debts automatically
- Minimizes the number of transactions needed to settle up
- Provides optimal settlement suggestions

### Real-time Synchronization
- All data updates are reflected instantly across all connected clients
- Uses Convex's real-time capabilities for live collaboration
- No manual refresh needed for expense updates

### Expense Categories
- Comprehensive categorization system with 20+ categories (e.g., Food & Drink, Coffee, Groceries, Travel, Housing, Entertainment, Utilities, Health, and more)
- Custom icons for each category

### Analytics Dashboard
- Monthly spending trends
- Total balance tracking
- Group-wise expense breakdown
- Visual charts and graphs

---

### 🖼️ Screenshots

### 🏠 Home Page

<img src="https://raw.githubusercontent.com/rushikesh109/SplitWiser/main/public/screenshots/home.png" alt="Home Page" width="700" />

---

### 📊 Dashboard View

<img src="https://raw.githubusercontent.com/rushikesh109/SplitWiser/main/public/screenshots/dashboard.png" alt="Dashboard View" width="700" />

---

### ➕ Add Expense

<img src="https://raw.githubusercontent.com/rushikesh109/SplitWiser/main/public/screenshots/expenses.png" alt="Add Expense" width="700" />

---

### 🔁 Settle Up

<img src="https://raw.githubusercontent.com/rushikesh109/SplitWiser/main/public/screenshots/settleup.png" alt="Settle Up" width="700" />


---

## 🔐 Security Features
- **Authentication:** Secure JWT-based authentication with Clerk
- **Authorization:** Role-based access control for groups
- **Data Validation:** Server-side validation with Convex
- **Protected Routes:** Middleware protection for all sensitive routes
- **Input Sanitization:** Proper validation and sanitization of all inputs

---

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Structure
- **Components:** Reusable UI components in `/components`
- **Pages:** Route components in `/app`
- **Backend:** Convex functions in `/convex`
- **Utilities:** Helper functions in `/lib`

---

## 🤝 Contributing

We welcome contributions! To get started:
1. Fork the repository and create your branch from `main`.
2. Make your changes and add tests if applicable.
3. Open a pull request with a clear description of your changes.

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments
- [Clerk](https://clerk.dev/) for authentication
- [Convex](https://convex.dev/) for the real-time database
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Next.js](https://nextjs.org/) for the framework

## 📞 Support
For support, please create an issue in the repository or email: mangrulerushikesh2003@gmail.com

---

**Splitwiser** — Making expense splitting simple, smart, and stress-free! 💚

