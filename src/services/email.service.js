const nodemailer = require("nodemailer");
const env = require("../config/env");
const logger = require("../utils/logger");

let transporter = null;

function getTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass || !env.emailFrom) {
    throw new Error("SMTP configuration is incomplete");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });

    transporter.verify((error, success) => {
      if (error) {
        logger.error(`SMTP Connection failed: ${error.message}`);
      } else {
        logger.info("SMTP connected successfully");
      }
    });
  }

  return transporter;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildHtml(activity) {
  const username = activity.metadata?.username || "Unknown User";
  
  // Format the date to Indian Standard Time (IST)
  const dateObj = new Date(activity.timestamp);
  const istTime = dateObj.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short"
  });

  // Customize button text based on platform
  const buttonText = activity.platform === "leetcode" ? "Open question" : "Open activity";

  return `
<!doctype html>
<html>
  <head>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f4f7f6;
        color: #333;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        border-top: 5px solid #2ecc71;
      }
      h2 {
        color: #2c3e50;
        margin-top: 0;
        font-size: 24px;
      }
      .intro {
        font-size: 16px;
        color: #555;
        margin-bottom: 25px;
        line-height: 1.5;
      }
      .detail-row {
        margin-bottom: 12px;
        font-size: 15px;
      }
      .label {
        font-weight: 600;
        color: #7f8c8d;
        display: inline-block;
        width: 100px;
      }
      .value {
        color: #2c3e50;
        font-weight: 500;
      }
      .platform-badge {
        display: inline-block;
        background-color: #ecf0f1;
        padding: 3px 8px;
        border-radius: 4px;
        text-transform: capitalize;
        font-size: 14px;
      }
      .btn {
        display: inline-block;
        margin-top: 25px;
        padding: 10px 20px;
        background-color: #2ecc71;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>${escapeHtml(env.emailGreeting)}</h2>
      <p class="intro">${escapeHtml(env.emailMessage)}</p>
      
      <div class="detail-row">
        <span class="label">Platform:</span>
        <span class="value platform-badge">${escapeHtml(activity.platform)}</span>
      </div>
      <div class="detail-row">
        <span class="label">Title:</span>
        <span class="value">${escapeHtml(activity.title)}</span>
      </div>
      <div class="detail-row">
        <span class="label">Date & Time:</span>
        <span class="value">${escapeHtml(istTime)} (IST)</span>
      </div>
      
      ${
        activity.url
          ? `<a href="${escapeHtml(activity.url)}" class="btn">${escapeHtml(buttonText)}</a>`
          : ""
      }
    </div>
  </body>
</html>`;
}

async function sendActivityEmail(activity) {
  if (!env.notificationEmail) {
    throw new Error("NOTIFICATION_EMAIL is not configured");
  }

  const transporter = getTransporter();
  const username = activity.metadata?.username || "Unknown User";

  await transporter.sendMail({
    from: env.emailFrom,
    to: env.notificationEmail,
    subject: `[${activity.platform}] New submission⚠️: ${activity.title}`,
    html: buildHtml(activity)
  });
}

function verifyConnection() {
  getTransporter();
}

module.exports = { sendActivityEmail, verifyConnection };
