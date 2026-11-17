import { MILD_SAMPLE_COMMENTS, SEED_REPEAT_AUTHORS } from "./fixtures";

// Simple deterministic PRNG based on string seed
function createPrng(seed: string) {
  let h = 0xdeadbeef;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h >>> 0) / 4294967296;
  };
}

export interface GeneratedFinding {
  id: string;
  post_id: string;
  post_caption: string | null;
  post_is_demo: boolean;
  author_id: string;
  author_name: string;
  comment_text: string;
  label: string;
  severity: "critical" | "high" | "medium" | "low" | "none";
  language_code: string;
  explanation: string;
  reason_code: string;
  source_type: "demo_fixture";
  is_demo: true;
}

export interface GeneratedScanData {
  id: string;
  status: "completed";
  progress_percent: 100;
  estimated_demo_comments: number;
  animated_demo_comments_processed: number;
  statistics: {
    fictional_comments: number;
    flagged: number;
    safe_or_uncertain: number;
    critical: number;
    severity: Record<string, number>;
    languages: Record<string, number>;
    labels: Record<string, number>;
    repeat_accounts: Array<{
      author_id: string;
      display_name: string;
      flagged_comments: number;
      affected_posts: number;
      max_severity: string;
      meets_incident_threshold: boolean;
    }>;
    repeat_incidents: number;
  };
  findings: GeneratedFinding[];
  incidents: Array<{
    id: string;
    incident_type: string;
    status: string;
    max_severity: string;
    flagged_comment_count: number;
    affected_post_count: number;
    summary: string;
    is_demo: true;
  }>;
}

export function generateDeterministicScan(
  scanId: string,
  selectedPosts: Array<{ id: string; caption: string | null; post_is_demo: boolean }>
): GeneratedScanData {
  const prng = createPrng(scanId);
  const findings: GeneratedFinding[] = [];
  const authorStats: Record<
    string,
    { name: string; flagged: number; posts: Set<string>; maxSev: string }
  > = {};

  const sevRanks: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    none: 0,
  };

  const effectivePosts = selectedPosts.length > 0
    ? selectedPosts
    : [
        { id: "post-seed-1", caption: "Community update and quarterly discussion.", post_is_demo: true },
        { id: "post-seed-2", caption: "Thank you all for supporting digital safety.", post_is_demo: true },
        { id: "post-seed-3", caption: "Live Q&A session: Share your thoughts below.", post_is_demo: true },
      ];

  effectivePosts.forEach((post, postIdx) => {
    // Generate 40 to 60 comments per post
    const count = 40 + Math.floor(prng() * 21);
    for (let i = 0; i < count; i++) {
      const template = MILD_SAMPLE_COMMENTS[Math.floor(prng() * MILD_SAMPLE_COMMENTS.length)];
      // Ensure repeat authors show up across multiple posts
      const isRepeatAuthor = prng() > 0.45;
      const author = isRepeatAuthor
        ? SEED_REPEAT_AUTHORS[Math.floor(prng() * SEED_REPEAT_AUTHORS.length)]
        : {
            id: `seed:user-${postIdx}-${i}`,
            name: `User ${postIdx + 1}${i + 1}`,
          };

      const findingId = `finding-${scanId.slice(0, 8)}-${post.id.slice(0, 6)}-${i}`;
      findings.push({
        id: findingId,
        post_id: post.id,
        post_caption: post.caption,
        post_is_demo: post.post_is_demo,
        author_id: author.id,
        author_name: author.name,
        comment_text: template.comment_text,
        label: template.label,
        severity: template.severity,
        language_code: template.language_code,
        explanation: template.explanation,
        reason_code: template.reason_code,
        source_type: "demo_fixture",
        is_demo: true,
      });

      if (template.label !== "safe") {
        if (!authorStats[author.id]) {
          authorStats[author.id] = {
            name: author.name,
            flagged: 0,
            posts: new Set(),
            maxSev: template.severity,
          };
        }
        authorStats[author.id].flagged++;
        authorStats[author.id].posts.add(post.id);
        if (sevRanks[template.severity] > sevRanks[authorStats[author.id].maxSev]) {
          authorStats[author.id].maxSev = template.severity;
        }
      }
    }
  });

  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };
  const labelCounts: Record<string, number> = {};
  const langCounts: Record<string, number> = {};

  findings.forEach((f) => {
    severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
    labelCounts[f.label] = (labelCounts[f.label] || 0) + 1;
    langCounts[f.language_code] = (langCounts[f.language_code] || 0) + 1;
  });

  const repeatAccounts = Object.entries(authorStats)
    .filter(([_, data]) => data.posts.size >= 2 || data.flagged >= 3)
    .map(([id, data]) => ({
      author_id: id,
      display_name: data.name,
      flagged_comments: data.flagged,
      affected_posts: data.posts.size,
      max_severity: data.maxSev,
      meets_incident_threshold: data.posts.size >= 3,
    }))
    .sort((a, b) => b.flagged_comments - a.flagged_comments);

  const flaggedTotal = findings.filter((f) => f.label !== "safe").length;

  return {
    id: scanId,
    status: "completed",
    progress_percent: 100,
    estimated_demo_comments: findings.length,
    animated_demo_comments_processed: findings.length,
    statistics: {
      fictional_comments: findings.length,
      flagged: flaggedTotal,
      safe_or_uncertain: findings.length - flaggedTotal,
      critical: severityCounts.critical,
      severity: severityCounts,
      languages: langCounts,
      labels: labelCounts,
      repeat_accounts: repeatAccounts,
      repeat_incidents: repeatAccounts.filter((r) => r.meets_incident_threshold).length,
    },
    findings,
    incidents: repeatAccounts
      .filter((r) => r.meets_incident_threshold)
      .map((r, idx) => ({
        id: `incident-${scanId.slice(0, 8)}-${idx}`,
        incident_type: "repeat_harassment_campaign",
        status: "open",
        max_severity: r.max_severity,
        flagged_comment_count: r.flagged_comments,
        affected_post_count: r.affected_posts,
        summary: `Repeat hostile interactions detected across ${r.affected_posts} posts by ${r.display_name}.`,
        is_demo: true,
      })),
  };
}
