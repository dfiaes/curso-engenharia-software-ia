(function () {
  "use strict";

  const script = document.currentScript;
  const unit = script && script.dataset.unit;
  if (!unit) return;
  const order = ["M00", "M01", "M02", "M02A", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10", "M11", "M12", "M13", "LT01", "LT02", "LT03", "LT04"];
  const index = order.indexOf(unit);
  const inPortal = window.parent !== window;
  const portalRoute = (code) => `../../index.html#/${code}`;

  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .course-portal-bar{position:relative;z-index:9999;display:flex;align-items:center;gap:.7rem;flex-wrap:wrap;padding:.65rem clamp(.75rem,3vw,1.5rem);background:#0b1220;color:#e8f0fa;border-bottom:3px solid #35d0ba;font:600 14px/1.35 Inter,system-ui,sans-serif}
      .course-portal-bar a{color:#fff;text-decoration:none;padding:.3rem .55rem;border:1px solid #41516a;border-radius:7px}.course-portal-bar a:hover,.course-portal-bar a:focus{border-color:#35d0ba;color:#35d0ba}.course-portal-bar .course-portal-state{margin-left:auto;color:#b9c7d9;font-weight:500}.course-preview-notice{margin:1rem auto;padding:.8rem 1rem;max-width:74rem;border-left:4px solid #0f8f83;background:#ecfaf7;color:#163b37;font:500 15px/1.5 Inter,system-ui,sans-serif}.course-preview-notice strong{color:#0b665e}@media(max-width:640px){.course-portal-bar .course-portal-state{width:100%;margin-left:0}.course-portal-bar{position:static}}
    `;
    document.head.appendChild(style);
  }

  function replaceReadinessNotice() {
    const notices = Array.from(document.querySelectorAll(".course-notice"));
    const readiness = notices.find((notice) => /Estado do material/i.test(notice.textContent));
    const text = "Prévia Editorial v1. O conteúdo principal está disponível para leitura. Laboratórios e checkpoints são opcionais nesta prévia; a certificação v4 continua independente.";
    if (readiness) {
      const paragraph = Array.from(readiness.querySelectorAll("p")).find((item) => /Estado do material/i.test(item.textContent));
      if (paragraph) paragraph.innerHTML = `<strong>Estado do material.</strong> ${text}`;
      return;
    }
    const notice = document.createElement("aside");
    notice.className = "course-preview-notice";
    notice.setAttribute("aria-label", "Estado da prévia editorial");
    notice.innerHTML = `<strong>Estado do material.</strong> ${text}`;
    const header = document.querySelector("header, h1");
    if (header) header.insertAdjacentElement("afterend", notice);
    else document.body.prepend(notice);
  }

  function addBar() {
    const bar = document.createElement("nav");
    bar.className = "course-portal-bar";
    bar.setAttribute("aria-label", "Navegação do portal do curso");
    const previous = index > 0 ? `<a href="${portalRoute(order[index - 1])}" target="_top">← ${order[index - 1]}</a>` : "";
    const next = index >= 0 && index < order.length - 1 ? `<a href="${portalRoute(order[index + 1])}" target="_top">${order[index + 1]} →</a>` : "";
    bar.innerHTML = `<a href="../../index.html#/inicio" target="_top">Portal do curso</a>${previous}${next}<span class="course-portal-state">${unit} · Prévia Editorial v1</span>`;
    document.body.prepend(bar);
  }

  function notify(anchor, href) {
    if (!inPortal) return;
    window.parent.postMessage({ type: "course:navigate", unit, anchor: anchor || "", href: href || "" }, "*");
  }

  function observeBlocks() {
    if (!("IntersectionObserver" in window)) return;
    const headings = Array.from(document.querySelectorAll("h2[id]")).filter((heading) => /^(Bloco|B)\s*0?\d+\b/i.test(heading.textContent.trim()));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) notify(visible.target.id);
    }, { rootMargin: "-10% 0px -75%", threshold: 0 });
    headings.forEach((heading) => observer.observe(heading));
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !inPortal || link.target === "_blank" || link.target === "_top") return;
    const raw = link.getAttribute("href");
    if (!raw || /^(mailto:|tel:|javascript:)/i.test(raw)) return;
    let target;
    try { target = new URL(raw, location.href); } catch (error) { return; }
    if (target.protocol === "http:" || target.protocol === "https:") {
      if (target.origin !== location.origin) { link.target = "_blank"; link.rel = "noopener"; return; }
    }
    if (raw.startsWith("#")) {
      window.setTimeout(() => notify(decodeURIComponent(target.hash.slice(1))), 0);
      return;
    }
    if (/\.html(?:#|$)/i.test(raw)) {
      event.preventDefault();
      notify("", target.href);
    }
  });

  addStyles();
  addBar();
  replaceReadinessNotice();
  observeBlocks();
  if (location.hash) notify(decodeURIComponent(location.hash.slice(1)));
})();
