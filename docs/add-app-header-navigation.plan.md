<!-- f9e38ad4-727e-4a8c-ae0f-84fb5e03c2e8 1a9b82d6-600e-491d-b7d0-a1a55d708e45 -->
# Add App Header Navigation

## Overview

Create a persistent header component that shows on all pages with auth-aware navigation tabs and authentication actions.

## Implementation Steps

### 1. Create Header Component (`src/components/Header.tsx`)

- Build a client component that checks authentication status
- Use `createClient()` from `@/utils/supabase/client` to get auth user
- Show different content based on auth status:
- **Unauthenticated**: Show Login and Signup buttons
- **Authenticated**: Show navigation tabs (Home) and Logout button
- Include app branding/logo ("Finance Manager")
- Use responsive design with flexbox layout
- Style with Tailwind CSS for a modern, clean look

### 2. Create Logout Action (`src/app/auth/actions.ts`)

- Add a new server action `logout()` that:
- Calls `supabase.auth.signOut()`
- Uses `revalidatePath('/', 'layout')`
- Redirects to home page (`/`)

### 3. Update Root Layout (`src/app/layout.tsx`)

- Convert to async server component to check auth properly
- Import and render `<Header />` component above `{children}`
- Remove unused `createClientComponentClient` import
- Add proper container/wrapper styling

### 4. Update Home Page (`src/app/page.tsx`)

- Remove the temporary navigation buttons
- Update to show a proper landing page with welcome message
- Keep it simple since header now handles navigation

### 5. Prepare for Future Navigation

- Structure header to easily add more tabs when creating:
- `/piggybanks` route
- `/transactions` route  
- `/categories` route
- Use Next.js Link component for client-side navigation
- Apply active state styling based on current pathname

## Key Files to Modify

- `src/components/Header.tsx` (new)
- `src/app/auth/actions.ts` (add logout function)
- `src/app/layout.tsx` (add header)
- `src/app/page.tsx` (simplify)

## Technical Details

- Header will use `useEffect` + `onAuthStateChange` to reactively update when auth status changes
- Navigation tabs only visible when authenticated
- Logout immediately signs out and redirects (no confirmation)
- Use `usePathname()` from `next/navigation` to highlight active tab

### To-dos

- [x] Create Header.tsx component with auth-aware UI
- [x] Add logout server action to auth/actions.ts
- [x] Add Header to root layout
- [x] Clean up home page and remove temporary navigation

