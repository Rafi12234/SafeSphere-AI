import { generateDeterministicScan } from "@/lib/seed/generator";

export interface UserViewModel {
  id: string;
  email: string;
  displayName: string | null;
  workspaceId: string;
  workspaceName: string;
  role: string;
}

export interface PageConnectionViewModel {
  id: string;
  pageId: string;
  name: string;
  status: string;
  isDemo: boolean;
  selected: boolean;
  tasks: string[];
  grantedScopes: string[];
  hasToken: boolean;
  hasOlderOnFacebook?: boolean;
}

export interface PostViewModel {
  id: string;
  providerPostId: string;
  caption: string | null;
  postType: string;
  thumbnailUrl: string | null;
  permalink: string | null;
  publishedAt: string | null;
  isDemo: boolean;
  commentCount: number | null;
}

export interface FindingViewModel {
  id: string;
  postId: string;
  postCaption: string | null;
  postIsDemo: boolean;
  authorId: string;
  authorName: string | null;
  commentText: string | null;
  label: string;
  severity: "critical" | "high" | "medium" | "low" | "none";
  languageCode: string;
  explanation: string | null;
  reasonCode?: string;
}

export interface RepeatAccountViewModel {
  authorId: string;
  displayName: string;
  flaggedComments: number;
  affectedPosts: number;
  maxSeverity: string;
  meetsIncidentThreshold: boolean;
}

export interface IncidentViewModel {
  id: string;
  incidentType: string;
  status: string;
  maxSeverity: string;
  flaggedCommentCount: number;
  affectedPostCount: number;
  summary: string | null;
  isDemo: boolean;
}

export interface ScanViewModel {
  id: string;
  status: "running" | "completed";
  progressPercent: number;
  estimatedComments: number;
  processedComments: number;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number;
  selectedPosts: Array<{
    id: string;
    providerPostId: string;
    caption: string | null;
    postIsDemo: boolean;
  }>;
  statistics: {
    totalComments: number;
    flagged: number;
    safeOrUncertain: number;
    critical: number;
    severity: Record<string, number>;
    languages: Record<string, number>;
    labels: Record<string, number>;
    repeatAccounts: RepeatAccountViewModel[];
    repeatIncidents: number;
  } | null;
  findings: FindingViewModel[];
  incidents: IncidentViewModel[];
}

export function adaptUser(raw: any): UserViewModel {
  return {
    id: raw.id,
    email: raw.email,
    displayName: raw.display_name || null,
    workspaceId: raw.workspace_id,
    workspaceName: raw.workspace_name,
    role: raw.role,
  };
}

export function adaptConnection(raw: any): PageConnectionViewModel {
  return {
    id: raw.id,
    pageId: raw.page_id,
    name: raw.name,
    status: raw.status,
    isDemo: Boolean(raw.is_demo),
    selected: Boolean(raw.selected),
    tasks: raw.tasks || [],
    grantedScopes: raw.granted_scopes || [],
    hasToken: Boolean(raw.has_token),
    hasOlderOnFacebook: Boolean(raw.has_older_on_facebook),
  };
}

export function adaptPost(raw: any): PostViewModel {
  return {
    id: raw.id,
    providerPostId: raw.provider_post_id,
    caption: raw.caption || null,
    postType: raw.post_type,
    thumbnailUrl: raw.thumbnail_url || null,
    permalink: raw.permalink || null,
    publishedAt: raw.published_at || null,
    isDemo: Boolean(raw.is_demo),
    commentCount: raw.comment_count !== undefined ? raw.comment_count : null,
  };
}

export function adaptScan(raw: any): ScanViewModel {
  const forceSeed = process.env.NEXT_PUBLIC_FORCE_SEED === "true";
  const isCompleted = raw.status === "completed";

  const selectedPosts = (raw.selected_posts || []).map((p: any) => ({
    id: p.id,
    providerPostId: p.provider_post_id || p.id,
    caption: p.caption || null,
    postIsDemo: Boolean(p.post_is_demo),
  }));

  // If completed and findings are missing or forceSeed is enabled, generate deterministic seed
  if (isCompleted && (forceSeed || !raw.findings || raw.findings.length === 0)) {
    const seed = generateDeterministicScan(raw.id, selectedPosts);
    return {
      id: raw.id,
      status: "completed",
      progressPercent: 100,
      estimatedComments: seed.estimated_demo_comments,
      processedComments: seed.animated_demo_comments_processed,
      startedAt: raw.started_at || new Date().toISOString(),
      completedAt: raw.completed_at || new Date().toISOString(),
      durationSeconds: raw.duration_seconds || 18,
      selectedPosts,
      statistics: {
        totalComments: seed.statistics.fictional_comments,
        flagged: seed.statistics.flagged,
        safeOrUncertain: seed.statistics.safe_or_uncertain,
        critical: seed.statistics.critical,
        severity: seed.statistics.severity,
        languages: seed.statistics.languages,
        labels: seed.statistics.labels,
        repeatAccounts: seed.statistics.repeat_accounts.map((r) => ({
          authorId: r.author_id,
          displayName: r.display_name,
          flaggedComments: r.flagged_comments,
          affectedPosts: r.affected_posts,
          maxSeverity: r.max_severity,
          meetsIncidentThreshold: r.meets_incident_threshold,
        })),
        repeatIncidents: seed.statistics.repeat_incidents,
      },
      findings: seed.findings.map((f) => ({
        id: f.id,
        postId: f.post_id,
        postCaption: f.post_caption,
        postIsDemo: f.post_is_demo,
        authorId: f.author_id,
        authorName: f.author_name,
        commentText: f.comment_text,
        label: f.label,
        severity: f.severity,
        languageCode: f.language_code,
        explanation: f.explanation,
        reasonCode: f.reason_code,
      })),
      incidents: seed.incidents.map((inc) => ({
        id: inc.id,
        incidentType: inc.incident_type,
        status: inc.status,
        maxSeverity: inc.max_severity,
        flaggedCommentCount: inc.flagged_comment_count,
        affectedPostCount: inc.affected_post_count,
        summary: inc.summary,
        isDemo: true,
      })),
    };
  }

  const rawStats = raw.statistics;
  const statistics = rawStats
    ? {
        totalComments: rawStats.fictional_comments || 0,
        flagged: rawStats.flagged || 0,
        safeOrUncertain: rawStats.safe_or_uncertain || 0,
        critical: rawStats.critical || 0,
        severity: rawStats.severity || {},
        languages: rawStats.languages || {},
        labels: rawStats.labels || {},
        repeatAccounts: (rawStats.repeat_accounts || []).map((r: any) => ({
          authorId: r.author_id,
          displayName: r.display_name,
          flaggedComments: r.flagged_comments || 0,
          affectedPosts: r.affected_posts || 0,
          maxSeverity: r.max_severity || "low",
          meetsIncidentThreshold: Boolean(r.meets_incident_threshold),
        })),
        repeatIncidents: rawStats.repeat_incidents || 0,
      }
    : null;

  const findings: FindingViewModel[] = (raw.findings || []).map((f: any) => ({
    id: f.id,
    postId: f.post_id,
    postCaption: f.post_caption || null,
    postIsDemo: Boolean(f.post_is_demo),
    authorId: f.author_id,
    authorName: f.author_name || null,
    commentText: f.comment_text || null,
    label: f.label || "other",
    severity: f.severity || "low",
    languageCode: f.language_code || "en",
    explanation: f.explanation || null,
    reasonCode: f.reason_code || undefined,
  }));

  const incidents: IncidentViewModel[] = (raw.incidents || []).map((inc: any) => ({
    id: inc.id,
    incidentType: inc.incident_type,
    status: inc.status,
    maxSeverity: inc.max_severity,
    flaggedCommentCount: inc.flagged_comment_count || 0,
    affectedPostCount: inc.affected_post_count || 0,
    summary: inc.summary || null,
    isDemo: Boolean(inc.is_demo),
  }));

  return {
    id: raw.id,
    status: raw.status,
    progressPercent: raw.progress_percent || 0,
    estimatedComments: raw.estimated_demo_comments || 0,
    processedComments: raw.animated_demo_comments_processed || 0,
    startedAt: raw.started_at,
    completedAt: raw.completed_at || null,
    durationSeconds: raw.duration_seconds || 18,
    selectedPosts,
    statistics,
    findings,
    incidents,
  };
}
