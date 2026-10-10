import { fetchSchedule, INBAR_ORIGIN, LOGIN_URL, NotLoggedInError } from "@/core/inbar/fetchSchedule";
import { encodePayload, HASH_KEY } from "@/core/transfer/codec";

// Replaced with the app's own URL when the app renders the bookmarklet link.
const APP_URL = "__APP_URL__";

function toast(text: string): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText =
    "position:fixed;inset:auto 16px 24px 16px;z-index:2147483647;padding:14px 16px;border-radius:12px;" +
    "background:#0a0a0a;color:#fff;font:600 15px system-ui,sans-serif;direction:rtl;text-align:center;" +
    "box-shadow:0 10px 30px rgba(0,0,0,.3)";
  document.body.appendChild(el);
  return el;
}

async function run() {
  if (location.origin.toLowerCase() !== INBAR_ORIGIN) {
    if (confirm("יש להפעיל את הסימנייה מתוך אתר Inbar. לפתוח את Inbar עכשיו?")) location.href = LOGIN_URL;
    return;
  }
  const t = toast("טוען מערכת שעות מ-Inbar…");
  try {
    const payload = await fetchSchedule();
    t.textContent = `נמצאו ${payload.lessons.length} שיעורים – עובר לאפליקציה…`;
    location.href = `${APP_URL}#${HASH_KEY}=${encodePayload(payload)}`;
  } catch (e) {
    t.remove();
    if (e instanceof NotLoggedInError) {
      alert("צריך להתחבר ל-Inbar קודם, ואז להפעיל שוב את הסימנייה.");
      location.href = LOGIN_URL;
    } else {
      alert(`שגיאה בקריאת מערכת השעות: ${(e as Error).message}`);
    }
  }
}

run();
