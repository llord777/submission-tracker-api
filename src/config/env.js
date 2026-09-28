require("dotenv").config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),

  notificationEmail: required("NOTIFICATION_EMAIL"),
  smtpHost: required("SMTP_HOST"),
  smtpPort: Number(process.env.SMTP_PORT || 2525),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: required("SMTP_USER"),
  smtpPass: required("SMTP_PASS"),
  emailFrom: required("EMAIL_FROM"),
  emailGreeting: process.env.EMAIL_GREETING || "Hello,",
  emailMessage: process.env.EMAIL_MESSAGE || "A new submission was done.",

  githubUsername: process.env.GITHUB_USERNAME || "",
  githubPollCron: process.env.GITHUB_POLL_CRON || "*/15 * * * *",
  githubToken: process.env.GITHUB_TOKEN || "",

  leetcodeUsername: process.env.LEETCODE_USERNAME || "",
  leetcodePollCron: process.env.LEETCODE_POLL_CRON || "*/15 * * * *",
};

module.exports = env;
