export interface SeedFinding {
  author_key: string;
  author_name: string;
  comment_text: string;
  language_code: "bn" | "banglish" | "en";
  label: "harassment" | "bullying" | "threat" | "body_shaming" | "hate" | "safe";
  severity: "critical" | "high" | "medium" | "low" | "none";
  explanation: string;
  reason_code: string;
}

export const SEED_REPEAT_AUTHORS = [
  { id: "seed:author-alpha", name: "Shahriar Ahmed (Alpha)" },
  { id: "seed:author-beta", name: "Anon Observer (Beta)" },
  { id: "seed:author-gamma", name: "Kamrul Islam (Gamma)" },
  { id: "seed:author-delta", name: "Community Critic (Delta)" },
  { id: "seed:author-epsilon", name: "Farhana Yasmin (Epsilon)" },
];

export const MILD_SAMPLE_COMMENTS: SeedFinding[] = [
  {
    author_key: "seed:author-alpha",
    author_name: "Shahriar Ahmed (Alpha)",
    comment_text: "তুমি এখানে কিছুই বোঝো না, কথা বলা বন্ধ করো।",
    language_code: "bn",
    label: "bullying",
    severity: "high",
    explanation: "Belittling and silencing language targeted at the creator.",
    reason_code: "BULLY_SILENCE",
  },
  {
    author_key: "seed:author-beta",
    author_name: "Anon Observer (Beta)",
    comment_text: "Nobody wants to hear your opinion on this page.",
    language_code: "en",
    label: "harassment",
    severity: "medium",
    explanation: "Hostile and exclusionary language directed at public post.",
    reason_code: "HARASS_DIRECT",
  },
  {
    author_key: "seed:author-alpha",
    author_name: "Shahriar Ahmed (Alpha)",
    comment_text: "Shobai tomake niye hashe, post bondho koro ekhoni.",
    language_code: "banglish",
    label: "bullying",
    severity: "medium",
    explanation: "Banglish ridicule and coordinated mocking remark.",
    reason_code: "BANGLISH_HOSTILE",
  },
  {
    author_key: "seed:author-gamma",
    author_name: "Kamrul Islam (Gamma)",
    comment_text: "Great community discussion, thank you for sharing!",
    language_code: "en",
    label: "safe",
    severity: "none",
    explanation: "Constructive engagement and supportive feedback.",
    reason_code: "CONSTRUCTIVE",
  },
  {
    author_key: "seed:author-alpha",
    author_name: "Shahriar Ahmed (Alpha)",
    comment_text: "Toke online e shanti te thakte dibo na ami.",
    language_code: "banglish",
    label: "threat",
    severity: "high",
    explanation: "Persistent intimidation and harassment threat.",
    reason_code: "THREAT_IMPLIED",
  },
  {
    author_key: "seed:author-delta",
    author_name: "Community Critic (Delta)",
    comment_text: "ব্যক্তিগত আক্রমণ না করে নীতিগত আলোচনা করুন।",
    language_code: "bn",
    label: "safe",
    severity: "none",
    explanation: "Constructive call for civil conversation.",
    reason_code: "CONSTRUCTIVE",
  },
  {
    author_key: "seed:author-beta",
    author_name: "Anon Observer (Beta)",
    comment_text: "If you keep posting this, there will be serious consequences.",
    language_code: "en",
    label: "threat",
    severity: "critical",
    explanation: "Direct intimidating statement warning of consequences.",
    reason_code: "THREAT_DIRECT",
  },
  {
    author_key: "seed:author-beta",
    author_name: "Anon Observer (Beta)",
    comment_text: "Eta pura faltu ekta post, tomar kono joggota nai.",
    language_code: "banglish",
    label: "harassment",
    severity: "medium",
    explanation: "Hostile demeaning personal remark in Banglish.",
    reason_code: "BANGLISH_HOSTILE",
  },
  {
    author_key: "seed:author-gamma",
    author_name: "Kamrul Islam (Gamma)",
    comment_text: "Can you provide the source or date for this event?",
    language_code: "en",
    label: "safe",
    severity: "none",
    explanation: "Ordinary community query requesting information.",
    reason_code: "CONSTRUCTIVE",
  },
  {
    author_key: "seed:author-alpha",
    author_name: "Shahriar Ahmed (Alpha)",
    comment_text: "আপনার চেহারা দেখে মানুষ হাসে, লজ্জা পাওয়া উচিত।",
    language_code: "bn",
    label: "body_shaming",
    severity: "high",
    explanation: "Degrading appearance-based shaming remark.",
    reason_code: "BODY_SHAME",
  },
  {
    author_key: "seed:author-delta",
    author_name: "Community Critic (Delta)",
    comment_text: "Abar ashchish faltu bhab niye? Chup thak.",
    language_code: "banglish",
    label: "bullying",
    severity: "medium",
    explanation: "Hostile silencing remark in Banglish.",
    reason_code: "BULLY_SILENCE",
  },
  {
    author_key: "seed:author-epsilon",
    author_name: "Farhana Yasmin (Epsilon)",
    comment_text: "Thank you for addressing this important topic.",
    language_code: "en",
    label: "safe",
    severity: "none",
    explanation: "Constructive and supportive feedback.",
    reason_code: "CONSTRUCTIVE",
  },
];
