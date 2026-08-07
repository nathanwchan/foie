export const resourceFormats = [
  "article",
  "video",
  "podcast",
  "paper",
  "documentation",
  "repository",
  "tool",
  "social"
] as const;

export const topics = [
  "agent-workflows",
  "xcode-tooling",
  "agent-readable-architecture",
  "code-review",
  "testing-evaluation",
  "visual-validation",
  "sdlc-automation",
  "human-in-the-loop"
] as const;

export const availabilityStatuses = ["available", "temporarily-unavailable", "archived"] as const;

export const formatLabels: Record<(typeof resourceFormats)[number], string> = {
  article: "Article",
  video: "Video",
  podcast: "Podcast",
  paper: "Paper",
  documentation: "Documentation",
  repository: "Repository",
  tool: "Tool",
  social: "Social"
};

export const topicLabels: Record<(typeof topics)[number], string> = {
  "agent-workflows": "Agent workflows",
  "xcode-tooling": "Xcode & tooling",
  "agent-readable-architecture": "Agent-readable architecture",
  "code-review": "Code review",
  "testing-evaluation": "Testing & evaluation",
  "visual-validation": "Visual validation",
  "sdlc-automation": "SDLC automation",
  "human-in-the-loop": "Human in the loop"
};
