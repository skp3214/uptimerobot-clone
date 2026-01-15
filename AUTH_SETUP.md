# Auth Setup Guide

## Email Confirmation Flow Issues - FIXED

### What Was Wrong
1. Email confirmation links were using `localhost:3000` instead of your deployed URL
2. Callback route wasn't handling errors properly
3. No clear feedback when email couldn't be sent

### What's Fixed
1. Auth page now uses `NEXT_PUBLIC_APP_URL` environment variable for email confirmation links
2. Callback route has proper error handling with logging
3. Clear success/error messages on signup

## Required Environment Variables

Set these in your Vercel project:

### Supabase (already set)
- `NEXT_PUBLIC_SUPABASE_URL` 
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Email (Nodemailer SMTP)
- `SMTP_HOST` - Your SMTP server (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`)
- `SMTP_PORT` - Usually 587 or 465
- `SMTP_USER` - Your email address or username
- `SMTP_PASSWORD` - Your password or app-specific password
- `SMTP_FROM_EMAIL` - Email address to send from
- `SMTP_SECURE` - Set to `true` if using port 465, `false` for 587

### App URL (CRITICAL FOR EMAIL LINKS)
- `NEXT_PUBLIC_APP_URL` - Your deployed URL (e.g., `https://my-uptimerobot.vercel.app`)
  - For localhost testing: `http://localhost:3000`
  - For production: Your Vercel domain

## Gmail SMTP Setup (Recommended for Testing)

1. Enable 2-factor authentication on your Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer" (or other device)
4. Generate app password
5. Use in environment variables:
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `your-email@gmail.com`
   - `SMTP_PASSWORD`: `xxxx xxxx xxxx xxxx` (the 16-char password from step 4)
   - `SMTP_FROM_EMAIL`: `your-email@gmail.com`
   - `SMTP_SECURE`: `false`

## Testing the Setup

1. Check health: `GET /api/auth/health`
2. Sign up with an email
3. Check your email inbox (and spam folder)
4. Click the confirmation link
5. You should be redirected to dashboard

## Troubleshooting

### "Invalid credentials" on sign in
- Confirm your email first (check email for confirmation link)
- Make sure you're using the correct password

### Not receiving confirmation emails
- Check `/api/auth/health` endpoint for SMTP errors
- Verify SMTP credentials are correct
- Check spam/junk folder
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly

### Email links point to localhost:3000
- Set `NEXT_PUBLIC_APP_URL` to your deployed URL (e.g., `https://my-uptimerobot.vercel.app`)

### "Exchange code for session failed"
- Email confirmation link expired (24 hour limit)
- Sign up again with your email

## Email Confirmation Email Template

You can customize the email sent by Supabase Auth in your Supabase dashboard:
1. Go to Authentication → Email Templates
2. Edit the "Confirm signup" template
3. Add your app branding/messaging
