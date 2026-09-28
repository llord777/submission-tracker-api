const cron = require("node-cron");
const env = require("../config/env");
const { pollLeetCode, pollGitHub, initializePollers } = require("./pollers");
const logger = require("../utils/logger");

function registerSafeJob(name, expression, handler) {
  if (!expression) return;
  cron.schedule(expression, async () => {
    try {
      logger.info({ job: name }, "Starting scheduled job");
      await handler();
    } catch (error) {
      logger.error(`Scheduled job '${name}' failed: ${error.message}`);
    }
  });
}

async function startScheduler() {
  await initializePollers();
  registerSafeJob("leetcode-poller", env.leetcodePollCron, pollLeetCode);
  registerSafeJob("github-poller", env.githubPollCron, pollGitHub);
  logger.info("Cron scheduler started");
}

module.exports = { startScheduler };
