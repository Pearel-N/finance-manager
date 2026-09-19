# Project: Finance Manager

A comprehensive personal finance management application built with Next.js, Prisma, and Supabase.

## Project Overview

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [Supabase Auth](https://supabase.com/auth)
- **State Management:** [TanStack Query (React Query)](https://tanstack.com/query) for server state and [Zustand](https://zustand-demo.pmnd.rs/) for local state
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [Radix UI](https://www.radix-ui.com/) components
- **Validation:** [Zod](https://zod.dev/) and [React Hook Form](https://react-hook-form.com/)
- **Currency:** Supports multiple currencies (INR, USD, EUR) with INR as the default.

## Architecture

### Directory Structure

- `src/app/`: Next.js App Router pages and API routes.
- `src/components/`: Reusable UI components (including Radix/Shadcn UI).
- `src/services/`: Client-side API wrapper services using `axios`.
- `src/hooks/`: Custom React hooks for data fetching (`queries`) and mutations (`mutation`) using TanStack Query.
- `src/lib/`: Shared utilities, Prisma client initialization, and Supabase configuration.
- `src/utils/`: Helper functions, including Supabase server/client utilities and Zod schemas.
- `prisma/`: Database schema and migrations.

### Core Data Models

- **User:** Stores profile information and currency preference.
- **Category:** Transaction categories (e.g., Food, Salary, Rent).
- **Transaction:** Financial records (income/expense) linked to categories and optionally to Piggy Banks.
- **PiggyBank:** Savings goals or "buckets" for money. Supports hierarchical structures (parent/child) and tracking current balance against a goal.
- **RecurringTransaction:** Automated transaction setups (daily, weekly, monthly, yearly) processed via a daily cron job.

## Building and Running

### Prerequisites
- Node.js (Latest LTS recommended)
- PostgreSQL database
- Supabase project for authentication

### Environment Variables
Create a `.env` file with the following:
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
CRON_SECRET="your-secret-here" # Required for automated recurring transactions in production
```

### Commands
- `npm install`: Install dependencies.
- `npm run dev`: Start the development server with Turbopack.
- `npm run build`: Build the application for production.
- `npm run start`: Start the production server.
- `npm run lint`: Run ESLint checks.
- `npx prisma generate`: Update the Prisma client after schema changes.
- `npx prisma migrate dev`: Apply database migrations during development.

## Development Conventions

### Data Fetching & Mutations
- **Services:** Define all API calls in `src/services/`.
- **Hooks:** Wrap service calls in TanStack Query hooks in `src/hooks/`.
- **Validation:** Use Zod schemas (defined in `src/utils/schema/`) for form validation and API request parsing.

### Backend Logic
- API routes in `src/app/api/` handle authentication via Supabase server-side client.
- Ensure all database queries are scoped to the authenticated `userId`.
- The `PiggyBank` balances are automatically adjusted within the transaction API routes (`POST`, `PATCH`, `DELETE`) and the recurring transaction cron job whenever a transaction is linked to a piggy bank.

### Recurring Transactions Automation
- **Cron Job:** A daily cron job triggers `/api/cron/process-recurring`.
- **Logic:** It finds due `RecurringTransaction` records, creates the actual `Transaction`, updates any linked `PiggyBank` balance, and calculates the next `nextDate`.

### UI & Styling
- Use Radix UI components for accessible primitives.
- Tailwind CSS for all styling.
- `formatCurrency` utility from `@/lib/currency-utils` should be used for all monetary displays.

### System Category
- The project uses a special "System" category for internal transactions (like transfers between piggy banks). Use `getOrCreateSystemCategory(userId)` from `@/lib/prisma` to retrieve it.
