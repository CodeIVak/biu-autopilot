/** Public project info shown in the app. Leave a URL empty to hide its button. */
export const DEVELOPER = {
  name: "Idan Vaknin",
  nameHe: "עידן ועקנין",
  email: "idan.vaknin1@live.biu.ac.il",
  /** "https://www.linkedin.com/in/<handle>". Empty hides the button. */
  linkedin: "https://www.linkedin.com/in/idan-vaknin/",
};

/** Google Form created by scripts/create-feedback-form.gs ("Published" responder link). */
export const FEEDBACK_FORM_URL = "";

/** e.g. "https://buymeacoffee.com/<username>". */
export const DONATE_URL = "";

const FEEDBACK_SUBJECT = "משוב על אוטו-פיילוט בר-אילן";
const FEEDBACK_BODY = [
  "שלום,",
  "",
  "מה עבד טוב:",
  "",
  "מה כדאי לשפר:",
  "",
  "הצעה לפיצ'ר חדש:",
  "",
].join("\n");

export const feedbackMailto = `mailto:${DEVELOPER.email}?subject=${encodeURIComponent(FEEDBACK_SUBJECT)}&body=${encodeURIComponent(FEEDBACK_BODY)}`;
