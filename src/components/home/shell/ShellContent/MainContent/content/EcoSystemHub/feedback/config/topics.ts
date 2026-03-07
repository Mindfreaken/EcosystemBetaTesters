export type FeedbackTopic =
  | "home"
  | "spaces"
  | "hire"
  | "view"
  | "live"
  | "campaigns"
  | "docs"
  | "music"
  | "gaming"
  | "dailies"
  | "esports"
  | "profiles"
  | "notes"
  | "friends"
  | "messages"
  | "settings";

export type QuestionType = "rating" | "text" | "select" | "multiselect";

export interface FeedbackQuestion {
  id: string;
  label: string;
  type: QuestionType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export type TopicQuestionsConfig = Record<FeedbackTopic, FeedbackQuestion[]>;

export const TOPICS: { value: FeedbackTopic; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "spaces", label: "Spaces" },
  { value: "hire", label: "Hire" },
  { value: "view", label: "View" },
  { value: "live", label: "Live" },
  { value: "campaigns", label: "Campaigns" },
  { value: "docs", label: "Docs" },
  { value: "music", label: "Music" },
  { value: "gaming", label: "Gaming" },
  { value: "dailies", label: "Dailies" },
  { value: "esports", label: "Esports" },
  { value: "profiles", label: "Profiles" },
  { value: "notes", label: "Notes" },
  { value: "friends", label: "Friends" },
  { value: "messages", label: "Messages" },
  { value: "settings", label: "Settings" },
];

export const DEFAULT_QUESTIONS: TopicQuestionsConfig = {
  home: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "comments", label: "Comments", type: "text", placeholder: "Share your thoughts" },
  ],
  spaces: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "usability", label: "Usability", type: "rating" },
    { id: "comments", label: "Comments", type: "text" },
  ],
  hire: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "comments", label: "Comments", type: "text" },
  ],
  view: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "performance", label: "Performance", type: "rating" },
    { id: "comments", label: "Comments", type: "text" },
  ],
  live: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "latency", label: "Latency", type: "rating" },
    { id: "comments", label: "Comments", type: "text" },
  ],
  campaigns: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "comments", label: "Comments", type: "text" },
  ],
  docs: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "clarity", label: "Clarity", type: "rating" },
    { id: "comments", label: "Comments", type: "text" },
  ],
  music: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "selection", label: "Music selection", type: "rating" },
    { id: "comments", label: "Comments", type: "text" },
  ],
  gaming: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "stability", label: "Stability", type: "rating" },
    { id: "comments", label: "Comments", type: "text" },
  ],
  dailies: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "comments", label: "Comments", type: "text" },
  ],
  esports: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "comments", label: "Comments", type: "text" },
  ],
  profiles: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "customization", label: "Customization options", type: "rating" },
    { id: "comments", label: "Comments", type: "text" },
  ],
  notes: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "comments", label: "Comments", type: "text" },
  ],
  friends: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "discovery", label: "Friend discovery", type: "rating" },
    { id: "comments", label: "Comments", type: "text" },
  ],
  messages: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "reliability", label: "Reliability", type: "rating" },
    { id: "comments", label: "Comments", type: "text" },
  ],
  settings: [
    { id: "overall", label: "Overall opinion", type: "rating", required: true },
    { id: "comments", label: "Comments", type: "text" },
  ],
};
