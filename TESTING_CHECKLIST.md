# Testing Checklist for UptimeMonitor

## Pre-Deployment

### Environment Setup
- [ ] All env variables set correctly
- [ ] Supabase project connected
- [ ] SMTP credentials configured
- [ ] Cron secret generated

### Database
- [ ] Schema created successfully
- [ ] RLS policies enabled
- [ ] Test user can read their own data
- [ ] Test user cannot access others' data

## Feature Testing

### Authentication Module
- [ ] Sign up creates user in Supabase
- [ ] Email verification works
- [ ] Sign in with correct credentials succeeds
- [ ] Sign in with wrong password fails
- [ ] Session persists after page reload
- [ ] Sign out clears session

### Monitor Creation
- [ ] Form validates required fields
- [ ] URL format validation works
- [ ] All interval options available
- [ ] Monitor saved to database
- [ ] User owns created monitor

### Monitor List
- [ ] All monitors displayed
- [ ] Status badges show correct state
- [ ] Can click to edit monitor
- [ ] Can delete monitor with confirmation

### Monitor Detail Page
- [ ] Current status displays
- [ ] Response time shows
- [ ] Uptime % calculated correctly
- [ ] Incident count accurate
- [ ] Chart renders with data
- [ ] Edit button opens form

### Monitoring Service
- [ ] Cron job called every 5 minutes
- [ ] Monitor status checked via HTTP
- [ ] Response time recorded
- [ ] Status stored in database
- [ ] Last check time updated

### Email Notifications
- [ ] Email sent on UP transition
- [ ] Email sent on DOWN transition
- [ ] Email has correct subject
- [ ] Email has monitor details
- [ ] Email TO address is correct
- [ ] Email FROM address is configured

### Incident Tracking
- [ ] Incident created on status change
- [ ] Incident timestamp recorded
- [ ] Incident message descriptive
- [ ] Multiple incidents tracked
- [ ] Incidents queryable by monitor

### Analytics Dashboard
- [ ] Total monitor count displays
- [ ] Active/Down counts update
- [ ] Average uptime calculates
- [ ] Recent incident count shows
- [ ] All cards update after incident

### Public Status Page
- [ ] Accessible without authentication
- [ ] Shows public monitors only
- [ ] Status badge displays
- [ ] Response time shown
- [ ] Updates when monitor status changes

### Incident History Page
- [ ] Lists all incidents
- [ ] Filter by Down works
- [ ] Filter by Up works
- [ ] Monitor names shown
- [ ] Timestamps accurate
- [ ] Can link to monitor detail

## Load Testing

- [ ] App handles 10+ monitors
- [ ] Dashboard loads < 2 seconds
- [ ] Incident list scrolls smoothly
- [ ] Charts render without lag

## Browser Compatibility

- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Edge latest
- [ ] Mobile responsive

## Security Testing

- [ ] SQL injection attempts fail
- [ ] XSS attempts fail
- [ ] CSRF tokens validated
- [ ] Rate limiting works
- [ ] Invalid auth tokens rejected

## Production Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] No unhandled exceptions
- [ ] Performance acceptable
- [ ] Error logging configured
- [ ] Monitoring/alerting setup
- [ ] Backup strategy in place
- [ ] Disaster recovery plan
