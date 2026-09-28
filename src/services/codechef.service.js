const axios = require("axios");
const env = require("../config/env");

/*
 * CodeChef does not provide one universally stable public activity endpoint
 * suitable for every account/use case. This service therefore expects a
 * configured CODECHEF_API_URL. The provider/endpoint must return either:
 *
 * { "activities": [...] }
 *
 * or a plain array.
 *
 * Each activity should contain enough information to map to:
 * id, title, url, timestamp.
 */
async function fetchRecentActivities() {
  if (!env.codechefUsername) {
    throw new Error("CODECHEF_USERNAME is not configured");
  }

  if (!env.codechefApiUrl) {
    throw new Error(
      "CODECHEF_API_URL is not configured. Add a reliable CodeChef activity API/provider before enabling this poller."
    );
  }

  const response = await axios.get(env.codechefApiUrl, {
    params: { username: env.codechefUsername },
    timeout: 15000,
    headers: {
      "User-Agent": "submission-tracker-api/1.0"
    }
  });

  const rows = Array.isArray(response.data)
    ? response.data
    : response.data?.activities || [];

  return rows.map((row) => ({
    platform: "codechef",
    activityType: row.activityType || "coding_activity",
    externalId: row.id || row.externalId || row.code,
    title: row.title || row.problem || "CodeChef activity",
    url: row.url || row.link || "",
    timestamp: row.timestamp || row.date || row.createdAt,
    metadata: {
      username: env.codechefUsername,
      raw: row
    }
  }));
}

module.exports = { fetchRecentActivities };
