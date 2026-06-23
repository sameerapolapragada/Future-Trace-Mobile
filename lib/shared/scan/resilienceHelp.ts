export const RESILIENCE_HELP_TITLE = "Career Resilience Score";

export const RESILIENCE_HELP_SUMMARY =
  "How well-positioned is this role to remain valuable in the AI era?";

export const RESILIENCE_HELP_BODY =
  "Scores run from 0–100 based on your skills, typical tasks, experience, and industry context.\n\nHigher scores suggest more durable responsibilities in an AI-shaped workplace. Lower scores mean it may help to build adjacent strengths or plan a transition.\n\nThis is guidance to support your thinking, not a guarantee about job security, salary, or hiring.";

export function formatResilienceHelpAlert(): { title: string; message: string } {
  return {
    title: RESILIENCE_HELP_TITLE,
    message: `${RESILIENCE_HELP_SUMMARY}\n\n${RESILIENCE_HELP_BODY}`,
  };
}
