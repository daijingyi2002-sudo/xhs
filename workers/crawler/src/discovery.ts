export type DiscoveryQueryOptions = {
  companies: string[];
  keywords: string[];
  tags: string[];
};

export type DiscoveredUrl = {
  query: string;
  url: string;
};

export function buildDiscoveryQueries(options: DiscoveryQueryOptions) {
  const queries = new Set<string>();

  for (const company of options.companies) {
    for (const keyword of options.keywords) {
      for (const tag of options.tags) {
        queries.add(`site:xiaohongshu.com/explore ${company} ${keyword} ${tag}`);
      }
    }
  }

  for (const keyword of options.keywords) {
    for (const tag of options.tags) {
      queries.add(`site:xiaohongshu.com/explore ${keyword} ${tag}`);
    }
  }

  return Array.from(queries);
}

export function parseDuckDuckGoResults(html: string) {
  const matches = [...html.matchAll(/uddg=([^&"]+)/g)].map((match) => decodeURIComponent(match[1]));
  const urls = new Set<string>();

  for (const url of matches) {
    if (url.includes("xiaohongshu.com/explore/")) {
      urls.add(url);
    }
  }

  return Array.from(urls);
}

export async function discoverDuckDuckGoUrls(options: {
  queries: string[];
  limit: number;
  fetchImpl?: typeof fetch;
}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const discovered: DiscoveredUrl[] = [];
  const seen = new Set<string>();

  for (const query of options.queries) {
    if (seen.size >= options.limit) {
      break;
    }

    const response = await fetchImpl(
      `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=cn-zh`,
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
        }
      }
    );

    if (!response.ok) {
      continue;
    }

    const html = await response.text();
    const urls = parseDuckDuckGoResults(html);

    for (const url of urls) {
      if (seen.has(url)) {
        continue;
      }

      seen.add(url);
      discovered.push({ query, url });

      if (seen.size >= options.limit) {
        break;
      }
    }
  }

  return discovered;
}
