const env = require("../config/env");
const { fetchRecentAcceptedSubmissions } = require("../services/leetcode.service");
const { fetchRecentPublicActivities } = require("../services/github.service");
const { sendActivityEmail } = require("../services/email.service");
const logger = require("../utils/logger");

const seenKeys = new Set();
let isFirstPoll = true;

async function processActivities(activities) {
  for (const activity of activities) {
    const uniqueKey = `${activity.platform}:${activity.externalId}`;
    
    if (!seenKeys.has(uniqueKey)) {
      if (!isFirstPoll) {
        try {
          await sendActivityEmail(activity);
          seenKeys.add(uniqueKey);
          logger.info(`Emailed new activity: ${uniqueKey}`);
        } catch (err) {
          logger.error({ err, uniqueKey }, "Failed to send email");
        }
      } else {
        seenKeys.add(uniqueKey);
      }
    }
  }
}

async function pollLeetCode() {
  if (!env.leetcodeUsername) return;
  try {
    const activities = await fetchRecentAcceptedSubmissions(env.leetcodeUsername);
    await processActivities(activities.reverse());
  } catch (err) {
    logger.error(`LeetCode poll failed for ${env.leetcodeUsername}: ${err.message}`);
  }
}

async function pollGitHub() {
  if (!env.githubUsername) return;
  try {
    const activities = await fetchRecentPublicActivities(env.githubUsername);
    await processActivities(activities.reverse());
  } catch (err) {
    logger.error(`GitHub poll failed for ${env.githubUsername}: ${err.message}`);
  }
}

async function initializePollers() {
  logger.info("Initializing pollers and populating cache to prevent startup spam...");
  await Promise.all([pollLeetCode(), pollGitHub()]);
  isFirstPoll = false;
  logger.info(`Cache populated with ${seenKeys.size} recent activities.`);
}

module.exports = { pollLeetCode, pollGitHub, initializePollers };
