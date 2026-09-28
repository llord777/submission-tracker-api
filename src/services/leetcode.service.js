const axios = require("axios");
const env = require("../config/env");

const LEETCODE_URL = "https://leetcode.com/graphql/";

const QUERY = `
query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    timestamp
  }
}
`;

async function fetchRecentAcceptedSubmissions(username) {
  if (!username) {
    throw new Error("Username must be provided to fetch LeetCode submissions");
  }

  const response = await axios.post(
    LEETCODE_URL,
    {
      query: QUERY,
      variables: { username, limit: 20 }
    },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "submission-tracker-api/1.0"
      },
      timeout: 15000
    }
  );

  if (response.data?.errors?.length) {
    throw new Error(
      response.data.errors.map((error) => error.message).join("; ")
    );
  }

  const rows = response.data?.data?.recentAcSubmissionList || [];

  return rows.map((row) => ({
    platform: "leetcode",
    activityType: "accepted_solution",
    externalId: row.id,
    title: row.title,
    url: `https://leetcode.com/problems/${row.titleSlug}/`,
    timestamp: Number(row.timestamp) * 1000,
    metadata: {
      titleSlug: row.titleSlug,
      username
    }
  }));
}

module.exports = { fetchRecentAcceptedSubmissions };
