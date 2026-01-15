# UptimeMonitor - Deployment & Setup Guide

## Prerequisites
- Supabase project set up and connected
- SMTP email credentials (Gmail, SendGrid, etc.)
- Vercel account (or any Next.js hosting)
- CRON service for periodic monitoring

## Environment Variables Setup

Add these to your Vercel/hosting environment:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com           # or your email provider
SMTP_PORT=587                      # usually 587 for TLS, 465 for SSL
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password   # Use app-specific password for Gmail
SMTP_FROM_EMAIL=noreply@yourapp.com
SMTP_SECURE=false                  # true for port 465, false for 587

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
CRON_SECRET=your-random-secret-key
```

## Email Configuration Examples

### Gmail Setup
1. Enable 2-factor authentication
2. Generate an "App Password" at myaccount.google.com/apppasswords
3. Use the 16-character password as SMTP_PASSWORD
4. SMTP_HOST: smtp.gmail.com
5. SMTP_PORT: 587
6. SMTP_SECURE: false

### SendGrid Setup
1. Create API key at sendgrid.com/settings/api_keys
2. SMTP_HOST: smtp.sendgrid.net
3. SMTP_USER: apikey
4. SMTP_PASSWORD: your-api-key
5. SMTP_PORT: 587

### Other Providers
- **Mailgun**: smtp.mailgun.org:587
- **AWS SES**: email-smtp.region.amazonaws.com:587
- **Brevo (Sendinblue)**: smtp-relay.brevo.com:587

## Database Setup

The database schema is automatically created when you run:

```bash
npm run seed # or execute scripts/01-init-schema.sql in Supabase
```

This creates:
- `monitors` - Website monitors
- `monitor_checks` - Individual check records
- `incidents` - Status change events
- `status_pages` - Public status pages
- Row Level Security (RLS) policies

## Cron Job Configuration

The monitoring system requires a background job to check monitors every 5 minutes.

### Option 1: Vercel Cron (Recommended)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-monitors",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use Upstash Cron, EasyCron, or similar:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/check-monitors
```

Schedule this to run every 5 minutes.

### Option 3: Local Development Testing

```bash
# Test monitoring manually
curl -X POST http://localhost:3000/api/monitors/check

# Test cron endpoint
curl -H "Authorization: Bearer test-secret" \
  http://localhost:3000/api/cron/check-monitors
```

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial UptimeMonitor setup"
git push origin main
```

### 2. Deploy to Vercel
1. Go to vercel.com/new
2. Import your GitHub repository
3. Add environment variables (from .env.local)
4. Click Deploy

### 3. Setup Database
In Supabase dashboard:
1. Go to SQL Editor
2. Copy and run the schema from `scripts/01-init-schema.sql`
3. Enable Row Level Security on all tables

### 4. Configure SMTP
1. Test email sending with your SMTP credentials
2. Send test notification from dashboard

### 5. Setup Cron
1. Configure Vercel Cron in vercel.json or
2. Setup external cron service with correct secret

## Testing Checklist

### Authentication
- [ ] Sign up with new account
- [ ] Verify email confirmation
- [ ] Sign in with credentials
- [ ] Sign out works
- [ ] Protected pages redirect to auth

### Monitor Management
- [ ] Create new monitor
- [ ] Edit monitor details
- [ ] Delete monitor
- [ ] All intervals work (5min, 10min, 30min, 1hour)
- [ ] Invalid URLs are rejected

### Monitoring & Alerts
- [ ] Monitor checks run every 5 minutes
- [ ] Status updates correctly (UP/DOWN)
- [ ] Email alerts sent on status change
- [ ] Response time is recorded accurately
- [ ] Incidents are created on transitions

### Public Status Page
- [ ] Public status page is accessible
- [ ] Shows correct monitor statuses
- [ ] Updates in real-time
- [ ] Shows response times

### Dashboard Analytics
- [ ] Total monitors count
- [ ] Active/Down badge
- [ ] 30-day uptime percentage
- [ ] Recent incidents count
- [ ] Charts display response times

### Incident History
- [ ] Incidents listed in chronological order
- [ ] Filter by status (All/Down/Up)
- [ ] Shows monitor name and URL
- [ ] Timestamps are accurate
- [ ] Can navigate from incidents to monitor detail

### Monitor Detail Page
- [ ] Shows current status
- [ ] Displays uptime percentage
- [ ] Response time chart renders
- [ ] Recent incidents listed
- [ ] Edit and Delete buttons work

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in env vars
2. Test credentials manually: `npm run test:email`
3. Check spam folder
4. Verify sender email is allowed

### Monitors Not Checking
1. Verify cron endpoint is being called
2. Check cron authorization header
3. Monitor logs in Vercel dashboard
4. Test POST /api/monitors/check manually

### Database Connection Issues
1. Verify Supabase URL and keys
2. Check RLS policies aren't blocking reads
3. Ensure tables exist
4. Check user is authenticated

### Status Page Not Updating
1. Verify status_page_id on monitors
2. Check monitor.is_public flag
3. Clear browser cache
4. Verify Supabase realtime is enabled

## Performance Optimization

1. **Monitor Limits**: Each check makes one HTTP request. Limit monitors per user to avoid rate limits
2. **Database Indexing**: Add indexes on frequently queried fields (user_id, monitor_id, created_at)
3. **Email Throttling**: Implement cooldown to avoid spam
4. **Check History Cleanup**: Archive old monitor_checks records after 90 days

## Security Notes

- All user data is protected with Row Level Security
- Cron endpoint requires secret token
- Monitor URLs are validated before checking
- Email addresses verified during signup
- Passwords hashed with bcrypt

## Support

For issues or questions:
1. Check this guide
2. Review logs in Vercel dashboard
3. Test components individually
4. Contact support if needed
