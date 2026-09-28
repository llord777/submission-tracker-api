# Submission Tracker API

A Node.js/Express backend that centralizes coding activity from GitHub, LeetCode and CodeChef.

## Architecture

The backend uses:

- GitHub webhooks for push-based ingestion.
- Cron polling for LeetCode and CodeChef.
- MongoDB/Mongoose for persistence.
- A normalized `Activity` model shared by all platforms.
- Unique activity keys for cross-run deduplication.
- Notification logs so email delivery can be retried independently.
- Nodemailer + Brevo SMTP for email notifications.
- A daily activity endpoint for a portfolio contribution calendar.

## Folder structure

```text
src/
├── config/
├── models/
├── routes/
├── controllers/
├── services/
├── jobs/
├── utils/
├── templates/
├── app.js
└── server.js
```

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env`.

Set at minimum:

```env
MONGO_URI=mongodb://127.0.0.1:27017/submission_tracker
NOTIFICATION_EMAIL=your-email@example.com
```

For email notifications configure the Brevo SMTP values.

### 3. Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Health check:

```text
GET /api/health
```

## GitHub webhook

Create a GitHub webhook pointing to:

```text
https://YOUR-DOMAIN/api/webhooks/github
```

Use:

- Content type: `application/json`
- Event: `Just the push event`
- Secret: same value as `GITHUB_WEBHOOK_SECRET`

The application verifies `X-Hub-Signature-256` when a webhook secret is configured.

## LeetCode

Set:

```env
LEETCODE_USERNAME=your_username
```

The poller calls LeetCode's GraphQL endpoint and imports recent accepted submissions.

Important: external platform endpoints can change or impose limitations. Treat this integration as a best-effort poller rather than a guaranteed official API contract.

## CodeChef

The CodeChef service intentionally does NOT hardcode an unverified scraper/API.

Configure:

```env
CODECHEF_USERNAME=your_username
CODECHEF_API_URL=https://your-provider.example/api/activity
```

The configured endpoint must return either:

```json
{
  "activities": [
    {
      "id": "123",
      "title": "Problem",
      "url": "https://...",
      "timestamp": "2026-09-27T10:00:00Z"
    }
  ]
}
```

or a plain array of activity objects.

Before production use, replace this adapter with a reliable and permitted CodeChef data source.

## Activity API

Fetch raw normalized activities:

```text
GET /api/activities
```

Optional query parameters:

```text
userId
platform
from
to
limit
```

Example:

```text
GET /api/activities?platform=leetcode&limit=50
```

Get daily contribution counts:

```text
GET /api/activities/daily?from=2026-01-01&to=2026-12-31
```

Response:

```json
{
  "success": true,
  "counts": {
    "2026-09-24": 5,
    "2026-09-25": 0,
    "2026-09-26": 3,
    "2026-09-27": 7
  }
}
```

This endpoint is designed for the portfolio's combined GitHub/LeetCode/CodeChef activity calendar.

## Notification flow

The intended sequence is:

```text
Platform
  ↓
Fetch/Webhook
  ↓
Normalize
  ↓
Activity uniqueKey
  ↓
MongoDB deduplication
  ↓
Save Activity
  ↓
Create NotificationLog
  ↓
Send email
  ↓
Mark notification as sent
```

An email failure does not delete the activity. Failed notifications can be retried by the notification cron job.

## Docker

Build:

```bash
docker build -t submission-tracker-api .
```

Run:

```bash
docker run --env-file .env -p 5000:5000 submission-tracker-api
```

## Important production improvements

Before public deployment, add:

- authentication/authorization for activity management endpoints
- rate limiting
- request-size limits
- CORS configuration
- structured audit logs
- webhook event ID handling where available
- encrypted secrets management
- stronger validation for external API responses
- platform-specific retry/backoff
- monitoring/alerting
- a proper queue if activity volume becomes large

## AI-agent implementation rule

When extending this project, preserve the separation:

```text
platform service
      ↓
normalizer
      ↓
activity service
      ↓
database
      ↓
notification
```

Do not put platform-specific logic inside the email service or database models.
