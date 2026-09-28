const express = require("express");
const env = require("./config/env");
const { startScheduler } = require("./jobs/scheduler");
const logger = require("./utils/logger");

const app = express();

app.get("/health", (req, res) => {
  logger.info("Health check pinged");
  res.json({
    status: "ok",
    service: "submission-tracker-worker",
    timestamp: new Date().toISOString()
  });
});

const { verifyConnection } = require("./services/email.service");

app.listen(env.port, async () => {
  logger.info(
    { port: env.port, environment: env.nodeEnv },
    "Submission Tracker Worker started"
  );
  verifyConnection();
  await startScheduler();
});
