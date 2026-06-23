export const EXPOSURE_HELP_TITLE = "AI Exposure Level";

export const EXPOSURE_HELP_SUMMARY = "How much AI will interact with this role?";

export const EXPOSURE_HELP_BODY =
  "Rated Low, Medium, or High based on how much typical work in this role involves tasks AI can assist with or automate.\n\nHigher exposure means more overlap with AI-capable work. Lower exposure means more judgment-heavy, in-person, or specialized responsibilities.\n\nThis is guidance to support your thinking, not a prediction about your specific job.";

export function formatExposureHelpAlert(): { title: string; message: string } {
  return {
    title: EXPOSURE_HELP_TITLE,
    message: `${EXPOSURE_HELP_SUMMARY}\n\n${EXPOSURE_HELP_BODY}`,
  };
}
