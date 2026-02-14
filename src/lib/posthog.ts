import posthog from "posthog-js";

export function initPostHog() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
  if (!key) return;

  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false, // Manual tracking for cleaner data
    persistence: "localStorage+cookie",
    disable_session_recording: import.meta.env.MODE !== "production",
  });
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!posthog.__loaded) return;
  posthog.identify(userId, properties);
}

export function resetUser() {
  if (!posthog.__loaded) return;
  posthog.reset();
}

// Core tracking events as described in the briefing
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (!posthog.__loaded) return;
  posthog.capture(event, properties);
}

// Pre-defined events for consistency
export const AnalyticsEvents = {
  SIGNUP_COMPLETED: "signup_completed",
  ONBOARDING_FINISHED: "onboarding_finished",
  FIRST_ASSESSMENT_CREATED: "first_assessment_created",
  FIRST_ASSESSMENT_PUBLISHED: "first_assessment_published",
  FIRST_LEAD_CAPTURED: "first_lead_captured",
  FIRST_REPORT_DOWNLOADED: "first_report_downloaded",
  PLAN_UPGRADED: "plan_upgraded",
  PLAN_DOWNGRADED: "plan_downgraded",
  PLAN_CANCELLED: "plan_cancelled",
  ASSESSMENT_CREATED: "assessment_created",
  ASSESSMENT_PUBLISHED: "assessment_published",
  TEMPLATE_USED: "template_used",
  AI_GENERATE_USED: "ai_generate_used",
  REPORT_DOWNLOADED: "report_downloaded",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
} as const;

export { posthog };
