import { gsap } from 'gsap';

let toastTimeline = null;

const DEFAULT_DURATION = 2600;

/**
 * @param {string} msg
 * @param {number} [duration] how long the pill stays fully visible, in ms.
 */
export function showToast(msg, duration = DEFAULT_DURATION) {
  const toastPill = document.getElementById('toast-pill');
  if (!toastPill) return;
  toastPill.textContent = msg;

  if (toastTimeline) toastTimeline.kill();

  const holdSeconds = Math.max(0.4, Number(duration) / 1000);

  toastTimeline = gsap.timeline();
  toastTimeline.fromTo(toastPill,
    { opacity: 0, y: -8, scale: 0.9 },
    { opacity: 1, y: 8, scale: 1, duration: 0.35, ease: 'back.out(1.8)' }
  ).to(toastPill,
    { opacity: 0, y: -4, scale: 0.94, duration: 0.26, ease: 'power2.in', delay: holdSeconds }
  );
}
