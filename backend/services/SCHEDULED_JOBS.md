# Scheduled Jobs Documentation

This document describes all automated scheduled jobs in the Healthcare Appointment System.

## Overview

The system uses `node-cron` to run automated tasks at specific intervals. All jobs are initialized when the server starts.

## Available Jobs

### 1. Daily Appointment Reminders
**Schedule:** Every day at 9:00 AM  
**Cron Expression:** `0 9 * * *`

**Purpose:** Sends email reminders to patients who have approved appointments scheduled for the next day.

**Details:**
- Queries all appointments with `status: 'approved'`
- Filters for appointments scheduled exactly 24 hours from now
- Sends personalized reminder emails to each patient
- Includes appointment details (doctor, time, location)
- Logs success/failure for each email sent

**Example Log:**
```
🔄 Running daily appointment reminder job...
📧 Found 5 appointments for tomorrow
✅ Reminder sent to patient@email.com
✅ Reminder sent to another@email.com
✨ Reminder job completed: 5 sent, 0 failed
```

---

### 2. Auto-Complete Past Appointments
**Schedule:** Every day at midnight (00:00)  
**Cron Expression:** `0 0 * * *`

**Purpose:** Automatically marks past approved appointments as completed.

**Details:**
- Runs at midnight to clean up yesterday's appointments
- Updates all `approved` appointments with dates before yesterday
- Changes status to `completed`
- Helps maintain accurate appointment records

**Example Log:**
```
🔄 Running auto-complete job for past appointments...
✨ Auto-complete job done: 12 appointments marked as completed
```

---

### 3. Cleanup Old Appointments
**Schedule:** Every Sunday at 2:00 AM  
**Cron Expression:** `0 2 * * 0`

**Purpose:** Removes old cancelled and rejected appointments from the database.

**Details:**
- Runs weekly to keep database clean
- Deletes appointments with status `cancelled` or `rejected`
- Only removes appointments older than 6 months
- Helps optimize database performance

**Example Log:**
```
🔄 Running cleanup job for old appointments...
✨ Cleanup completed: 47 old appointments removed
```

---

### 4. Weekly Summary for Doctors
**Schedule:** Every Monday at 8:00 AM  
**Cron Expression:** `0 8 * * 1`

**Purpose:** Sends doctors a summary of their upcoming week's appointments.

**Details:**
- Queries each active doctor's upcoming appointments
- Includes appointments for the next 7 days
- Shows pending and approved appointment counts
- Can be extended to send summary emails

**Example Log:**
```
🔄 Running weekly summary job...
📊 Dr. John Smith: 3 pending, 8 approved appointments
📊 Dr. Jane Doe: 1 pending, 5 approved appointments
✨ Weekly summary job completed
```

---

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Set to true to run jobs immediately on server startup (for testing)
RUN_JOBS_ON_STARTUP=false

# Timezone for scheduled jobs
# See: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
JOBS_TIMEZONE=America/New_York
```

### Timezone Configuration

Jobs use the timezone specified in `JOBS_TIMEZONE`. Common timezones:
- `America/New_York` - Eastern Time
- `America/Chicago` - Central Time
- `America/Denver` - Mountain Time
- `America/Los_Angeles` - Pacific Time
- `Europe/London` - UK Time
- `Asia/Kolkata` - India Time

---

## Manual Triggers (Admin)

Admins can manually trigger any scheduled job via the API:

### Endpoint
```
POST /api/admin/jobs/trigger
```

### Headers
```
Authorization: Bearer <admin-token>
```

### Request Body
```json
{
  "jobName": "sendDailyReminders"
}
```

### Available Job Names
- `sendDailyReminders`
- `cleanupOldAppointments`
- `autoCompletePastAppointments`
- `sendWeeklySummary`

### Example Response
```json
{
  "message": "Job 'sendDailyReminders' triggered successfully",
  "note": "Job is running in the background. Check server logs for results."
}
```

---

## Testing Jobs

### Option 1: Set Environment Variable
```env
RUN_JOBS_ON_STARTUP=true
```
This will run `sendDailyReminders` 5 seconds after server startup.

### Option 2: Use Admin API
Send a POST request to `/api/admin/jobs/trigger` as shown above.

### Option 3: Modify Cron Schedule
For development, you can change the schedule to run more frequently:

```javascript
// Run every minute for testing
cron.schedule('* * * * *', sendDailyReminders);

// Run every 5 minutes
cron.schedule('*/5 * * * *', sendDailyReminders);
```

---

## Monitoring

### Server Logs
All jobs log their execution:
- Start message when job begins
- Progress updates during execution
- Summary with success/failure counts
- Error messages if something fails

### Recommended Monitoring
- Set up log aggregation (e.g., Winston, LogStash)
- Monitor job execution times
- Alert on job failures
- Track email delivery rates

---

## Production Considerations

### 1. Email Limits
Be aware of your email provider's rate limits:
- Gmail: ~500 emails/day for free accounts
- SendGrid: 100 emails/day on free tier
- AWS SES: 62,000 emails/month on free tier

### 2. Database Performance
- Ensure proper indexes on date fields
- Monitor query performance
- Consider archiving old data instead of deleting

### 3. Error Handling
All jobs include try-catch blocks and continue on individual failures.

### 4. Timezone Issues
Always set `JOBS_TIMEZONE` to match your business location.

### 5. Scaling
For high-volume systems, consider:
- Moving jobs to a dedicated worker process
- Using a queue system (Bull, BullMQ)
- Implementing job monitoring (Agenda Dashboard)

---

## Customization

### Adding New Jobs

1. Create the job function in `scheduledJobs.js`:
```javascript
const myCustomJob = async () => {
  try {
    console.log('Running custom job...');
    // Your logic here
  } catch (error) {
    console.error('Error in custom job:', error);
  }
};
```

2. Schedule it in `initScheduledJobs()`:
```javascript
cron.schedule('0 10 * * *', myCustomJob, {
  scheduled: true,
  timezone: process.env.JOBS_TIMEZONE || 'America/New_York',
});
```

3. Add to manual triggers:
```javascript
const manualTriggers = {
  sendDailyReminders,
  myCustomJob, // Add here
};
```

---

## Troubleshooting

### Job Not Running
1. Check server logs for initialization messages
2. Verify timezone is correct
3. Ensure server is running continuously
4. Check for syntax errors in cron expression

### Emails Not Sending
1. Verify email configuration in `.env`
2. Check email service credentials
3. Look for rate limiting issues
4. Review server logs for email errors

### Performance Issues
1. Add database indexes
2. Limit query results
3. Batch process large datasets
4. Consider running during off-peak hours

---

## Cron Expression Reference

```
┌─────────── minute (0 - 59)
│ ┌───────── hour (0 - 23)
│ │ ┌─────── day of month (1 - 31)
│ │ │ ┌───── month (1 - 12)
│ │ │ │ ┌─── day of week (0 - 7) (Sunday = 0 or 7)
│ │ │ │ │
* * * * *
```

Common patterns:
- `* * * * *` - Every minute
- `0 * * * *` - Every hour at minute 0
- `0 9 * * *` - Every day at 9:00 AM
- `0 0 * * 0` - Every Sunday at midnight
- `0 0 1 * *` - First day of every month at midnight
- `*/15 * * * *` - Every 15 minutes

---

## Support

For issues or questions about scheduled jobs:
1. Check server logs
2. Review this documentation
3. Test manually using admin API
4. Check node-cron documentation: https://www.npmjs.com/package/node-cron
