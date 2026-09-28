const axios = require("axios");

async function fetchRecentPublicActivities(username) {
  if (!username) return [];

  const headers = {
    "User-Agent": "submission-tracker-api/1.0",
    "Accept": "application/vnd.github.v3+json"
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await axios.get(`https://api.github.com/users/${username}/events/public`, {
    headers,
    timeout: 15000
  });

  const events = response.data || [];
  const pushEvents = events.filter((e) => e.type === "PushEvent");

  return pushEvents.flatMap((event) => {
    const commits = event.payload.commits || [];
    const repoName = event.repo.name;
    
    return commits.map((commit) => ({
      platform: "github",
      activityType: "push",
      externalId: commit.sha,
      title: `${repoName}: ${commit.message ? commit.message.split("\\n")[0] : "commit"}`,
      url: `https://github.com/${repoName}/commit/${commit.sha}`,
      timestamp: new Date(event.created_at).getTime(),
      metadata: {
        username,
        repository: repoName,
        branch: event.payload.ref,
        author: commit.author?.name || null,
        message: commit.message || null
      }
    }));
  });
}

module.exports = { fetchRecentPublicActivities };
