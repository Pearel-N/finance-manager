# Deploy Finance Manager to Vercel

This guide will help you deploy your Finance Manager application to Vercel so you can share it with your friends.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier works great)
2. A [Supabase account](https://supabase.com) for authentication
3. Your code pushed to GitHub (recommended) or ready to deploy via CLI

## Step 1: Prepare Your Database

You need a PostgreSQL database. The easiest option is to use Supabase's built-in database:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or use an existing one
3. Go to **Settings** → **Database**
4. Copy your **Connection string** (URI format)
   - It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - Click "URI" format to get the connection string

## Step 2: Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

1. Push your code to GitHub (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **Add New...** → **Project**
4. Import your GitHub repository
5. Vercel will auto-detect Next.js settings - click **Deploy**
6. Wait for the first deployment to complete (it may fail initially without environment variables - that's okay)

## Step 3: Set Environment Variables in Vercel

You **must** set these environment variables for your app to work:

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Where to Find |
|--------------|-------|---------------|
| `DATABASE_URL` | Your PostgreSQL connection string | Supabase Dashboard → Settings → Database → Connection string (URI) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Supabase Dashboard → Settings → API → anon public key |

**Important:** Set these for **Production**, **Preview**, and **Development** environments (you can select all three when adding each variable).

### Alternative: Set via Vercel CLI

```bash
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Step 4: Run Database Migrations

After setting up your database and environment variables, you need to apply your database schema:

1. **Set your production database URL:**
   ```bash
   export DATABASE_URL="your-production-database-url-from-supabase"
   ```

2. **Push your Prisma schema to the database:**
   ```bash
   npx prisma db push
   ```
   
   This will create all the tables (User, Category, Transaction, PiggyBank, Budget) in your database.

3. **Generate Prisma Client** (if needed):
   ```bash
   npx prisma generate
   ```

## Step 5: Configure Supabase Redirect URLs

Your Supabase authentication needs to know about your Vercel domain:

1. Go to your Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel URLs to **Redirect URLs**:
   - `https://your-app.vercel.app/**` (replace `your-app` with your actual Vercel project name)
   - `https://your-app.vercel.app/auth/callback` (if you have a callback route)
3. Add the same to **Site URL** if needed

## Step 6: Redeploy Your Application

After setting environment variables:

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click the three dots (⋯) on the latest deployment → **Redeploy**
3. Or simply push a new commit to trigger automatic deployment:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

## Step 7: Verify Your Deployment

1. Visit your deployment URL (e.g., `your-app.vercel.app`)
2. Test the signup/login functionality
3. Try creating a transaction
4. Test other features to ensure everything works

## Troubleshooting

### Build Fails During Deployment
- **Check build logs** in Vercel Dashboard → Deployments → Click on failed deployment
- **Verify environment variables** are set correctly (especially `DATABASE_URL`)
- **Ensure Prisma Client generates** - the `postinstall` script should handle this automatically

### Database Connection Issues
- Verify your `DATABASE_URL` is correct and includes the password
- Some database providers require SSL - if you get SSL errors, add `?sslmode=require` to the end of your connection string
- Check that your database allows connections from external IPs (Supabase does this by default)

### Authentication Not Working
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase Dashboard → Authentication → URL Configuration
- Make sure your Vercel domain is added to allowed redirect URLs
- Look for CORS errors in browser console

### Application Errors After Deployment
- Check Vercel function logs: Project → **Deployments** → Click deployment → **Functions** tab
- Verify all environment variables are set for the correct environment (Production/Preview)
- Test locally with the same environment variables to isolate issues

## Next Steps

Once your app is deployed and working:

1. **Share your Vercel URL** - Your app will be live at `your-app.vercel.app`
2. **Add a custom domain** (optional): Vercel Settings → Domains
3. **Monitor usage**: Check Vercel Dashboard for analytics and usage stats
4. **Set up error monitoring** (optional): Consider [Sentry](https://sentry.io) or similar services

## Useful Vercel Features

- **Automatic deployments**: Every push to your main branch triggers a new deployment
- **Preview deployments**: Every pull request gets its own preview URL
- **Environment variables**: Separate variables for Production, Preview, and Development
- **Analytics**: Monitor your app's performance in the Vercel dashboard

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/app/building-your-application/deploying)
- [Supabase Documentation](https://supabase.com/docs)
- Check your deployment logs in Vercel Dashboard for specific error messages

Your Finance Manager app is now ready to share with friends! 🚀
