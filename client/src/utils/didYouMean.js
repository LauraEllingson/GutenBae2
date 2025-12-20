// Lightweight "Did you mean" suggestion helper.
// Strategy:
// - If a Gutendex search returns no results, try searching Gutendex for each token
//   in the original query individually (top N results).
// - Compare tokens against words in returned titles using Levenshtein distance.
// - If a close match is found, return a suggested query with the token replaced.

const levenshtein = (a = '', b = '') => {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
};

const normalize = (s = '') => s.replace(/[^a-z0-9\s'-]/gi, '').trim();

export async function suggestCorrection(query) {
  if (!query || !String(query).trim()) return null;
  const q = String(query).trim();
  const tokens = q.split(/\s+/).filter(Boolean);
  const MAX_TOKENS = 3; // limit work
  const TITLES_PER_TOKEN = 8;

  for (let ti = 0; ti < Math.min(tokens.length, MAX_TOKENS); ti++) {
    const token = normalize(tokens[ti]);
    if (!token || token.length <= 2) continue; // skip tiny tokens

    // Query Gutendex for this token
    try {
      const url = `https://gutendex.com/books/?search=${encodeURIComponent(token)}&page_size=${TITLES_PER_TOKEN}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const titles = (data.results || []).map((r) => r.title || '').filter(Boolean);

      // For each title, compare token to each word in the title
      for (const title of titles) {
        const words = normalize(title).split(/\s+/).filter(Boolean);
        for (const w of words) {
          if (!w) continue;
          const dist = levenshtein(token, w);
          const maxLen = Math.max(token.length, w.length, 1);
          const norm = dist / maxLen;
          // heuristics: accept small absolute edits or small normalized distance
          if (dist <= 2 || norm <= 0.35) {
            // build suggestion by replacing token with this word
            const suggestedTokens = tokens.slice();
            suggestedTokens[ti] = w;
            const suggestion = suggestedTokens.join(' ');
            if (suggestion.toLowerCase() !== q.toLowerCase()) return suggestion;
          }
        }
      }
    } catch {
      // ignore network/errors and continue
    }
  }

  return null;
}
