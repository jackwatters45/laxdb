export type SmoothScrollOptions = {
  duration?: number;
  offset?: number;
  easing?: (progress: number) => number;
};

export type HighlightOptions = {
  duration?: number;
  color?: string;
  easing?: string;
};

const defaultScrollDuration = 1200;
const defaultHighlightDuration = 1800;

let activeScrollAnimation: number | undefined;

export const easeOutQuint = (progress: number) => 1 - Math.pow(1 - progress, 5);

export function smoothScrollToElement(target: HTMLElement, options: SmoothScrollOptions = {}) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const computedScrollMarginTop = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const offset = options.offset ?? computedScrollMarginTop;
  const startY = window.scrollY;
  const targetY = target.getBoundingClientRect().top + window.scrollY - offset;
  const distance = targetY - startY;
  const duration = prefersReducedMotion ? 0 : (options.duration ?? defaultScrollDuration);
  const easing = options.easing ?? easeOutQuint;
  const startTime = performance.now();

  if (activeScrollAnimation !== undefined) {
    window.cancelAnimationFrame(activeScrollAnimation);
    activeScrollAnimation = undefined;
  }

  if (duration === 0) {
    window.scrollTo({ top: targetY, behavior: "auto" });
    return;
  }

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easing(progress);

    window.scrollTo({ top: startY + distance * eased, behavior: "auto" });

    if (progress < 1) {
      activeScrollAnimation = window.requestAnimationFrame(step);
      return;
    }

    activeScrollAnimation = undefined;
  };

  activeScrollAnimation = window.requestAnimationFrame(step);
}

export function highlightElement(target: HTMLElement, options: HighlightOptions = {}) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const color = options.color ?? "var(--color-primary)";

  target.animate(
    [
      { backgroundColor: `color-mix(in oklch, ${color} 8%, transparent)` },
      { backgroundColor: `color-mix(in oklch, ${color} 4%, transparent)`, offset: 0.35 },
      { backgroundColor: "transparent" },
    ],
    {
      duration: options.duration ?? defaultHighlightDuration,
      easing: options.easing ?? "cubic-bezier(0.16, 1, 0.3, 1)",
    },
  );
}

function focusElement(target: HTMLElement) {
  const hadTabIndex = target.hasAttribute("tabindex");

  if (!hadTabIndex) {
    target.setAttribute("tabindex", "-1");
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
  }

  target.focus({ preventScroll: true });
}

export function scrollToHash(hash: string, options: SmoothScrollOptions & HighlightOptions = {}) {
  const id = decodeURIComponent(hash.startsWith("#") ? hash.slice(1) : hash);
  const target = document.getElementById(id);

  if (!target) {
    return false;
  }

  focusElement(target);
  highlightElement(target, options);
  smoothScrollToElement(target, options);

  return true;
}
