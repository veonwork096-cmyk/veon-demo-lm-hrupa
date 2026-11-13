// Homepage behaviour: mobile menu, call bar on phones, active anchor in the menu.
// The page is fully readable and callable without this script.

const header = document.querySelector<HTMLElement>("[data-header]");
const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
const nav = document.querySelector<HTMLElement>("[data-nav]");
const label = document.querySelector<HTMLElement>("[data-menu-label]");
const desktop = window.matchMedia("(min-width: 64rem)");

function outside(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("main, footer, [data-callbar], .skip-link"));
}

function setMenu(open: boolean, returnFocus = false): void {
  if (!header || !toggle || !nav) return;
  header.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  if (label) label.textContent = open ? "Закрити меню" : "Відкрити меню";
  outside().forEach((el) => { el.inert = open; });
  document.documentElement.style.overflow = open ? "hidden" : "";
  if (open) {
    nav.querySelector<HTMLElement>("a, [tabindex='0']")?.focus();
  } else if (returnFocus) {
    toggle.focus();
  }
}

function syncNavState(): void {
  if (!nav) return;
  // On the phone the closed menu panel must not be reachable with Tab.
  nav.inert = !desktop.matches && !header?.classList.contains("is-open");
}

if (header && toggle && nav) {
  syncNavState();
  toggle.addEventListener("click", () => {
    setMenu(!header.classList.contains("is-open"));
    syncNavState();
  });
  nav.addEventListener("click", (e) => {
    const link = (e.target as HTMLElement).closest("a");
    if (link && header.classList.contains("is-open")) { setMenu(false); syncNavState(); }
  });
  document.addEventListener("keydown", (e) => {
    if (!header.classList.contains("is-open")) return;
    if (e.key === "Escape") { setMenu(false, true); syncNavState(); return; }
    if (e.key !== "Tab") return;
    // Focus stays inside the header (menu toggle, call icon, brand and menu) while the menu is open.
    const items = Array.from(header.querySelectorAll<HTMLElement>("a[href], button, [tabindex='0']"))
      .filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  desktop.addEventListener("change", () => {
    if (desktop.matches && header.classList.contains("is-open")) setMenu(false);
    syncNavState();
  });
}

// Call bar on phones: shown after the first screen, hidden while the contact block is on screen.
const bar = document.querySelector<HTMLElement>("[data-callbar]");
const hero = document.getElementById("hero");
const zapys = document.getElementById("zapys");
if (bar && hero && zapys && "IntersectionObserver" in window) {
  let heroVisible = true;
  let zapysVisible = false;
  const update = (): void => {
    const show = !heroVisible && !zapysVisible;
    bar.classList.toggle("is-shown", show);
    bar.inert = !show;
  };
  update();
  new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.target === hero) heroVisible = e.isIntersecting;
      if (e.target === zapys) zapysVisible = e.isIntersecting;
    }
    update();
  }, { threshold: 0 }).observe(hero);
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) zapysVisible = e.isIntersecting;
    update();
  }, { threshold: 0.25 });
  io.observe(zapys);
}

// Zapys square: a clipped element (clip-path inset 100%) never reports an intersection itself,
// so the reveal is driven by its grid, which is not clipped.
const square = document.querySelector<HTMLElement>("[data-zapys-square]");
const squareGrid = square?.parentElement;
if (square && squareGrid && "IntersectionObserver" in window) {
  const sq = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      square.classList.add("is-visible");
      sq.disconnect();
    }
  }, { rootMargin: "0px 0px -15% 0px", threshold: 0 });
  sq.observe(squareGrid);
}

// Active anchor in the menu.
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]"));
if (links.length && "IntersectionObserver" in window) {
  const byId = new Map(links.map((a) => [a.getAttribute("href")!.slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const a = byId.get(e.target.id);
      if (!a) continue;
      if (e.isIntersecting) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
  }, { rootMargin: "-40% 0px -50% 0px" });
  byId.forEach((_a, id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });
}
