/* @ds-bundle: {"format":4,"namespace":"Trilha","components":[{"name":"Button"},{"name":"Badge"},{"name":"Code"},{"name":"Takeaway"},{"name":"ProgressBar"},{"name":"SegmentedControl"},{"name":"Card"},{"name":"TextField"},{"name":"StepTimeline"},{"name":"Terminal"},{"name":"TutorBubble"},{"name":"Callout"},{"name":"List"},{"name":"LessonToolbar"},{"name":"SectionHeader"},{"name":"TextLink"},{"name":"StatusDot"},{"name":"LanguageSwitch"},{"name":"SiteSidebar"},{"name":"StatGroup"},{"name":"MetricStrip"},{"name":"TagList"},{"name":"Timeline"},{"name":"ProjectList"},{"name":"FAQ"},{"name":"ProfileCard"},{"name":"EmailCapture"},{"name":"CurriculumTrack"},{"name":"ChallengeStepper"},{"name":"CodeEditor"},{"name":"BrowserFrame"},{"name":"DataTable"},{"name":"Skeleton"},{"name":"LiquidGlass"},{"name":"GlassPanel"},{"name":"Sheet"},{"name":"Reveal"},{"name":"ReaderView"},{"name":"ReaderControls"},{"name":"ArticleLayout"},{"name":"ArticleHeader"},{"name":"Prose"},{"name":"PullQuote"},{"name":"Sidenote"},{"name":"TableOfContents"},{"name":"ReadingProgress"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState, useRef = React.useRef, useLayoutEffect = React.useLayoutEffect, useEffect = React.useEffect;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }
  function omit(obj, keys) {
    var o = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) o[k] = obj[k];
    return o;
  }
  function useControllable(value, defaultValue, onChange) {
    var st = useState(defaultValue);
    var controlled = value !== undefined;
    return [controlled ? value : st[0], function (v) { if (!controlled) st[1](v); if (onChange) onChange(v); }];
  }


  /* ───────── Liquid Glass: motor ───────── */
  function mq(q) { try { return window.matchMedia && window.matchMedia(q).matches; } catch (e) { return false; } }
  function canRefract() {
    if (mq('(prefers-reduced-transparency: reduce)') || mq('(prefers-contrast: more)')) return false;
    var b = navigator.userAgentData && navigator.userAgentData.brands;
    if (b) return b.some(function (x) { return /Chromium/.test(x.brand); });
    return /Chrome\//.test(navigator.userAgent) && !/Firefox\//.test(navigator.userAgent);
  }
  var glassSeq = 0;
  function glassDefs() {
    var d = document.getElementById('tr-lg-defs');
    if (!d) {
      d = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      d.setAttribute('id', 'tr-lg-defs'); d.setAttribute('aria-hidden', 'true'); d.setAttribute('width', '0'); d.setAttribute('height', '0');
      d.style.position = 'absolute'; d.style.width = '0'; d.style.height = '0'; d.style.pointerEvents = 'none';
      d.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
      document.body.appendChild(d);
    }
    return d.firstChild;
  }
  function glassMap(w, h, r, bezel) {
    var k = 0.5, cw = Math.max(2, Math.round(w * k)), ch = Math.max(2, Math.round(h * k));
    var c = document.createElement('canvas'); c.width = cw; c.height = ch;
    var ctx = c.getContext('2d'), img = ctx.createImageData(cw, ch), d = img.data;
    var hw = w / 2, hh = h / 2, R = Math.min(r, hw, hh), bz = Math.max(4, Math.min(bezel, hh));
    for (var j = 0; j < ch; j++) for (var i = 0; i < cw; i++) {
      var x = (i + 0.5) / k - hw, y = (j + 0.5) / k - hh;
      var ax = Math.abs(x) - (hw - R), ay = Math.abs(y) - (hh - R);
      var ox = Math.max(ax, 0), oy = Math.max(ay, 0);
      var depth = -(Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(ax, ay), 0) - R);
      var nx = 0, ny = 0, m = 0;
      if (depth > 0 && depth < bz) {
        if (ox > 0 || oy > 0) { var L = Math.sqrt(ox * ox + oy * oy) || 1; nx = ox / L * (x < 0 ? -1 : 1); ny = oy / L * (y < 0 ? -1 : 1); }
        else if (ax > ay) nx = x < 0 ? -1 : 1; else ny = y < 0 ? -1 : 1;
        var t = 1 - depth / bz; m = t * t;
      }
      var o = (j * cw + i) * 4;
      d[o] = 128 - nx * m * 127; d[o + 1] = 128 - ny * m * 127; d[o + 2] = 128; d[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }
  function useGlass(ref, opt) {
    var o = opt || {};
    useEffect(function () {
      var el = ref.current; if (!el || o.enabled === false) return;
      var off = [];
      if (o.specular !== false && !mq('(prefers-reduced-motion: reduce)')) {
        var raf = 0;
        var move = function (e) {
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = 0; var r = el.getBoundingClientRect();
            el.style.setProperty('--tr-lg-x', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
            el.style.setProperty('--tr-lg-y', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
          });
        };
        var leave = function () { el.style.removeProperty('--tr-lg-x'); el.style.removeProperty('--tr-lg-y'); };
        el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
        off.push(function () { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); if (raf) cancelAnimationFrame(raf); });
      }
      if (o.refraction !== false && canRefract() && typeof ResizeObserver !== 'undefined') {
        var NS = 'http://www.w3.org/2000/svg', id = 'tr-lg-' + (++glassSeq);
        var f = document.createElementNS(NS, 'filter'), fi = document.createElementNS(NS, 'feImage'), fd = document.createElementNS(NS, 'feDisplacementMap');
        f.setAttribute('id', id); f.setAttribute('filterUnits', 'userSpaceOnUse'); f.setAttribute('color-interpolation-filters', 'sRGB'); f.setAttribute('x', '0'); f.setAttribute('y', '0');
        fi.setAttribute('x', '0'); fi.setAttribute('y', '0'); fi.setAttribute('preserveAspectRatio', 'none'); fi.setAttribute('result', 'map');
        fd.setAttribute('in', 'SourceGraphic'); fd.setAttribute('in2', 'map'); fd.setAttribute('xChannelSelector', 'R'); fd.setAttribute('yChannelSelector', 'G');
        f.appendChild(fi); f.appendChild(fd); glassDefs().appendChild(f);
        var last = '';
        var build = function () {
          var w = Math.round(el.offsetWidth), hgt = Math.round(el.offsetHeight); if (!w || !hgt) return;
          var cs = getComputedStyle(el), rad = parseFloat(cs.borderTopLeftRadius) || 0;
          var key = w + 'x' + hgt + 'r' + rad; if (key === last) return; last = key;
          var bezel = parseFloat(cs.getPropertyValue('--glass-bezel')) || 18, k = parseFloat(cs.getPropertyValue('--glass-refraction')) || 28;
          if (o.strength != null) k = o.strength;
          [f, fi].forEach(function (n) { n.setAttribute('width', w); n.setAttribute('height', hgt); });
          var url = glassMap(w, hgt, rad, bezel); fi.setAttribute('href', url); fi.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url);
          fd.setAttribute('scale', String(k));
          el.style.backdropFilter = 'url(#' + id + ') blur(' + (o.clear ? 'var(--glass-blur-clear)' : 'var(--glass-blur)') + ') saturate(var(--glass-saturate))';
          el.setAttribute('data-refract', 'on');
        };
        var pending = 0;
        var ro = new ResizeObserver(function () { cancelAnimationFrame(pending); pending = requestAnimationFrame(build); });
        ro.observe(el); build();
        off.push(function () { ro.disconnect(); cancelAnimationFrame(pending); if (f.parentNode) f.parentNode.removeChild(f); el.style.backdropFilter = ''; el.removeAttribute('data-refract'); });
      }
      return function () { off.forEach(function (fn) { fn(); }); };
    }, [o.enabled, o.refraction, o.specular, o.clear, o.strength]);
  }
  function useScrollCollapse(enabled) {
    var st = useState(false);
    useEffect(function () {
      if (!enabled) return;
      var last = window.scrollY, busy = false;
      function on() {
        if (busy) return; busy = true;
        requestAnimationFrame(function () {
          var y = window.scrollY, d = y - last;
          if (y < 80) st[1](false); else if (d > 6) st[1](true); else if (d < -6) st[1](false);
          last = y; busy = false;
        });
      }
      window.addEventListener('scroll', on, { passive: true });
      return function () { window.removeEventListener('scroll', on); };
    }, [enabled]);
    return st[0];
  }
  function LiquidGlass(p) {
    var ref = useRef(null);
    var variant = p.variant || 'regular';
    useGlass(ref, { refraction: p.refraction, specular: p.specular, clear: variant === 'clear', strength: p.strength });
    var rest = omit(p, ['variant', 'shape', 'refraction', 'specular', 'strength', 'legibility', 'interactive', 'padded', 'as', 'className', 'children']);
    return h(p.as || 'div', Object.assign({}, rest, {
      ref: ref,
      className: cx('tr-lg', variant !== 'regular' && 'tr-lg-' + variant, 'tr-lg-' + (p.shape || 'rounded'), p.legibility === 'scrim' && 'tr-lg-scrim', p.interactive && 'tr-lg-interactive', p.padded !== false && 'tr-lg-pad', p.className)
    }), p.children);
  }

  /* Button */
  function Button(p) {
    var variant = p.variant || 'filled', size = p.size || 'md';
    var ref = useRef(null);
    var glass = variant === 'glass' || variant === 'glass-tint';
    useGlass(ref, { enabled: glass, refraction: p.refraction, strength: 16 });
    var rest = omit(p, ['variant', 'size', 'leading', 'trailing', 'fullWidth', 'className', 'children', 'icon', 'refraction']);
    return h('button', Object.assign({ type: 'button' }, rest, {
      ref: ref,
      className: cx('tr-btn', 'tr-btn-' + variant, size !== 'md' && 'tr-btn-' + size, p.fullWidth && 'tr-btn-full', p.icon && 'tr-btn-icon', p.className)
    }),
      p.leading != null && h('span', { className: 'tr-btn-glyph', 'aria-hidden': true }, p.leading),
      p.children,
      p.trailing != null && h('span', { className: 'tr-btn-glyph', 'aria-hidden': true }, p.trailing));
  }

  /* Badge */
  function Badge(p) {
    return h('span', { className: cx('tr-badge', 'tr-badge-' + (p.tone || 'neutral'), p.className) }, p.children);
  }

  /* Code */
  function Code(p) { return h('code', { className: cx('tr-code', p.className) }, p.children); }

  /* Takeaway + Mark */
  function Mark(p) { return h('mark', { className: 'tr-mark' }, p.children); }
  function Takeaway(p) {
    return h('p', { className: cx('tr-takeaway', p.align === 'start' && 'tr-takeaway-start', p.className) }, p.children);
  }
  Takeaway.Mark = Mark;

  /* ProgressBar */
  function ProgressBar(p) {
    var v = Math.max(0, Math.min(1, p.value || 0));
    return h('div', { className: p.className },
      p.label != null && h('div', { className: 'tr-progress-label' }, h('span', null, p.label), p.showValue && h('span', null, Math.round(v * 100) + '%')),
      h('div', {
        className: cx('tr-progress', p.tone === 'brand' && 'tr-progress-brand'), role: 'progressbar',
        'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(v * 100), 'aria-label': p.label || p['aria-label'] || 'Progresso'
      }, h('div', { className: 'tr-progress-fill', style: { width: v * 100 + '%' } })));
  }

  /* SegmentedControl */
  function SegmentedControl(p) {
    var options = (p.options || []).map(function (o) { return typeof o === 'string' ? { value: o, label: o } : o; });
    var pair = useControllable(p.value, p.defaultValue !== undefined ? p.defaultValue : (options[0] && options[0].value), p.onChange);
    var value = pair[0], setValue = pair[1];
    var ref = useRef(null);
    var thumb = useState(null), moves = useState(0), first = useRef(true);
    useLayoutEffect(function () {
      var root = ref.current; if (!root) return;
      var el = root.querySelector('[aria-checked="true"]');
      if (el) thumb[1]({ left: el.offsetLeft, width: el.offsetWidth });
      if (first.current) first.current = false; else moves[1](function (n) { return n + 1; });
    }, [value, options.length]);
    function onKey(e) {
      var idx = options.findIndex(function (o) { return o.value === value; });
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      for (var i = 1; i <= options.length; i++) {
        var n = options[(idx + d * i + options.length * 2) % options.length];
        if (!n.disabled) { setValue(n.value); var b = ref.current.querySelector('[data-v="' + String(n.value).replace(/"/g, '') + '"]'); if (b) b.focus(); break; }
      }
    }
    useGlass(ref, { enabled: !!p.glass, strength: 14 });
    return h('div', { ref: ref, role: 'radiogroup', 'aria-label': p['aria-label'], className: cx('tr-seg', p.fullWidth && 'tr-seg-full', p.glass && 'tr-seg-glass', p.className), onKeyDown: onKey },
      thumb[0] && h('span', { key: 'thumb-' + moves[0], className: cx('tr-seg-thumb', moves[0] > 0 && p.glass && 'is-moving'), 'aria-hidden': true, style: { left: thumb[0].left, width: thumb[0].width } }),
      options.map(function (o) {
        var on = o.value === value;
        return h('button', {
          key: o.value, type: 'button', role: 'radio', 'aria-checked': on, tabIndex: on ? 0 : -1, disabled: o.disabled,
          'data-v': String(o.value).replace(/"/g, ''), className: 'tr-seg-item', onClick: function () { setValue(o.value); }
        }, o.label);
      }));
  }

  /* Card */
  function Card(p) {
    var variant = p.variant || 'raised';
    var rest = omit(p, ['variant', 'title', 'subtitle', 'className', 'children', 'as']);
    return h(p.as || 'section', Object.assign({}, rest, { className: cx('tr-card', 'tr-card-' + variant, p.className) }),
      (p.title || p.subtitle) && h('header', { className: 'tr-card-head' },
        p.title && h('h3', { className: 'tr-card-title' }, p.title),
        p.subtitle && h('p', { className: 'tr-card-sub' }, p.subtitle)),
      h('div', { className: 'tr-card-body' }, p.children));
  }

  /* TextField */
  var fieldId = 0;
  function TextField(p) {
    var idRef = useRef(null); if (!idRef.current) idRef.current = 'tr-field-' + (++fieldId);
    var id = p.id || idRef.current;
    var rest = omit(p, ['prefix', 'trailing', 'hint', 'tone', 'mono', 'shape', 'className', 'label', 'id']);
    return h('div', { className: p.className },
      h('div', { className: cx('tr-field', p.mono && 'tr-field-mono', p.shape === 'pill' && 'tr-field-pill') },
        p.prefix != null && h('label', { className: 'tr-field-prefix', htmlFor: id }, p.prefix),
        h('input', Object.assign({ id: id, 'aria-label': p.prefix == null ? p.label : undefined, 'aria-invalid': p.tone === 'danger' || undefined, 'aria-describedby': p.hint ? id + '-hint' : undefined }, rest)),
        p.trailing),
      p.hint && h('div', { id: id + '-hint', className: cx('tr-field-hint', p.tone === 'danger' && 'tr-field-hint-danger') }, p.hint));
  }

  /* StepTimeline */
  function StepTimeline(p) {
    var steps = p.steps || [];
    var total = p.total || steps.reduce(function (m, s) { return Math.max(m, (s.start || 0) + (s.duration || 0)); }, 0) || 1;
    var pair = useControllable(p.selected, p.defaultSelected !== undefined ? p.defaultSelected : null, p.onSelect);
    var unit = p.unit || 'ms';
    return h('div', { className: cx('tr-steps', p.className), role: 'list' },
      steps.map(function (s, i) {
        var done = s.duration != null;
        var key = s.id || s.name;
        var on = pair[0] === key;
        return h('div', { role: 'listitem', key: key },
          h('button', {
            type: 'button', className: cx('tr-step', !done && 'tr-step-pending'), disabled: !done, 'aria-pressed': done ? on : undefined,
            onClick: function () { pair[1](on ? null : key); }
          },
            h('span', null, h('span', { className: 'tr-step-name' }, s.name), s.description && h('span', { className: 'tr-step-desc' }, s.description)),
            h('span', { className: 'tr-track', 'aria-hidden': true },
              done && h('span', { className: cx('tr-bar', 'tr-tone-' + (s.tone || 'ink')), style: { left: ((s.start || 0) / total) * 100 + '%', width: (s.duration / total) * 100 + '%' } })),
            h('span', { className: 'tr-step-ms' }, done ? s.duration + ' ' + unit : '—')));
      }),
      p.showTotal && h('div', { className: 'tr-steps-total' }, 'Total ' + Math.round(total) + ' ' + unit));
  }

  /* Terminal */
  var PREFIX = { cmd: '$ ', info: '* ', out: '> ', in: '< ', hint: '', body: '', ok: '', warn: '', bad: '', log: '' };
  function Terminal(p) {
    var bodyRef = useRef(null);
    var lines = p.lines || [];
    useEffect(function () { if (p.autoScroll !== false && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [lines.length]);
    return h('div', { className: cx('tr-term', p.className), style: p.height ? { height: p.height, display: 'flex', flexDirection: 'column' } : undefined },
      h('div', { className: 'tr-term-head' }, h('span', null, p.title || 'terminal'), p.accessory),
      h('pre', { ref: bodyRef, className: 'tr-term-body', style: p.height ? { flex: 1 } : undefined, 'aria-live': p.live ? 'polite' : undefined },
        lines.map(function (l, i) {
          var line = typeof l === 'string' ? { kind: 'cmd', text: l } : l;
          var kind = line.kind || 'cmd';
          var showPrefix = line.prefix !== false;
          return h('span', { key: i, className: cx('tr-term-line', 'tr-term-' + (kind === 'body' ? 'body-text' : kind), line.dim && 'is-dim') }, (showPrefix ? PREFIX[kind] || '' : '') + line.text);
        }),
        p.caret && h('span', { className: 'tr-term-caret', 'aria-hidden': true })));
  }

  /* TutorBubble */
  function TutorBubble(p) {
    var tone = p.tone || 'neutral';
    return h('div', { className: cx('tr-tutor', 'tr-tutor-' + tone, p.className), role: tone === 'neutral' ? undefined : 'status' },
      p.avatar !== null && h('span', { className: 'tr-tutor-avatar', 'aria-hidden': true }, p.avatar || 'T'),
      h('div', { className: 'tr-tutor-bubble' }, p.lead && h('span', { className: 'tr-tutor-lead' }, p.lead), p.children));
  }

  /* Callout */
  var CALLOUT_ICON = { success: '✓', danger: '!', info: 'i', neutral: '•', note: 'i', tip: '★', warning: '!' };
  function Callout(p) {
    var tone = p.tone || 'success';
    return h('div', { className: cx('tr-callout', 'tr-callout-' + tone, p.className), role: tone === 'danger' ? 'alert' : 'status' },
      h('span', { className: 'tr-callout-icon', 'aria-hidden': true }, p.icon || CALLOUT_ICON[tone]),
      h('div', null, p.title && h('span', { className: 'tr-callout-title' }, p.title + ' '), p.children));
  }

  /* List + ListRow */
  function ListRow(p) {
    var Tag = p.href ? 'a' : 'button';
    var props = { className: cx('tr-row-item', p.done && 'tr-row-done'), 'aria-current': p.current ? 'true' : undefined, onClick: p.onClick };
    if (p.href) props.href = p.href; else { props.type = 'button'; if (p.expanded != null) props['aria-expanded'] = p.expanded; }
    if (p.href) props.style = { textDecoration: 'none' };
    return h('li', null, h(Tag, props,
      p.leading != null && h('span', { 'aria-hidden': true }, p.leading),
      h('span', { className: 'tr-row-main' }, h('span', { className: 'tr-row-title' }, p.title), p.subtitle && h('span', { className: 'tr-row-sub' }, p.subtitle)),
      p.detail != null && h('span', { className: 'tr-row-detail' }, p.detail),
      p.chevron !== false && h('span', { className: cx('tr-row-chevron', p.expanded && 'is-open'), 'aria-hidden': true }, '›')));
  }
  function List(p) {
    return h('div', { className: p.className },
      p.title && h('h4', { className: 'tr-list-title' }, p.title),
      h('ul', { className: cx('tr-list', p.variant === 'plain' && 'tr-list-plain') }, p.children));
  }
  List.Row = ListRow;

  /* LessonToolbar */
  function LessonToolbar(p) {
    var steps = p.steps || [];
    var floating = p.floating !== false;
    var collapsedScroll = useScrollCollapse(floating && p.collapseOnScroll !== false);
    var collapsed = p.collapsed != null ? p.collapsed : collapsedScroll;
    var navRef = useRef(null);
    useGlass(navRef, { enabled: floating, strength: 22 });
    var nav = h('nav', { ref: navRef, className: cx('tr-toolbar', floating && collapsed && 'is-collapsed', p.className), 'aria-label': p['aria-label'] || 'Etapas da aula' },
      h('div', null, p.onBack !== undefined ? h(Button, { variant: floating ? 'glass' : 'gray', icon: floating, size: 'sm', 'aria-label': 'Voltar', onClick: p.onBack }, '←') : null),
      h('div', { className: 'tr-toolbar-steps' }, steps.map(function (s, i) {
        var label = typeof s === 'string' ? s : s.label;
        var prog = typeof s === 'string' ? (i < p.current ? 1 : 0) : (s.progress != null ? s.progress : (i < p.current ? 1 : 0));
        return h('button', {
          key: label, type: 'button', className: 'tr-toolbar-step', 'aria-current': i === p.current ? 'step' : undefined,
          onClick: p.onStep ? function () { p.onStep(i); } : undefined
        }, h('span', { className: 'tr-toolbar-step-label' }, label), h(ProgressBar, { value: prog, 'aria-label': label }));
      })),
      h('div', { className: 'tr-toolbar-trail' },
        p.hint && h('span', { className: 'tr-toolbar-hint' }, p.hint),
        p.action !== undefined ? p.action : h(Button, { size: 'sm', variant: floating ? 'glass-tint' : 'filled', trailing: '→', disabled: p.canContinue === false, onClick: p.onContinue }, p.continueLabel || 'Continuar')));
    return floating ? h('div', { className: 'tr-toolbar-float' }, nav) : nav;
  }

  /* ───────── Página ───────── */
  function Eyebrow(p) {
    return h('span', { className: cx('tr-eyebrow', p.className) }, p.index != null && h('span', { className: 'tr-eyebrow-num' }, p.index + ' /'), p.children);
  }
  function SectionHeader(p) {
    var T = p.as || 'h2';
    return h('header', { id: p.id, className: cx('tr-section-head', p.size === 'sm' && 'tr-section-head-sm', p.align === 'center' && 'tr-section-head-center', p.className) },
      (p.eyebrow || p.index != null) && h(Eyebrow, { index: p.index }, p.eyebrow),
      h(T, { className: 'tr-section-title' }, p.title),
      p.subtitle && h('p', { className: 'tr-section-sub' }, p.subtitle),
      p.children);
  }
  function TextLink(p) {
    var ext = p.external != null ? p.external : /^https?:/.test(p.href || '');
    var rest = omit(p, ['external', 'quiet', 'className', 'children', 'arrow']);
    var arrow = p.arrow !== undefined ? p.arrow : (ext ? '↗' : null);
    return h('a', Object.assign({}, rest, ext ? { target: '_blank', rel: 'noopener noreferrer' } : {}, { className: cx('tr-link', p.quiet && 'tr-link-quiet', p.className) }),
      p.children, arrow && h('span', { className: 'tr-link-arrow', 'aria-hidden': true }, arrow),
      ext && h('span', { className: 'tr-visually-hidden', style: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' } }, ' (abre em nova aba)'));
  }
  function StatusDot(p) {
    return h('span', { className: cx('tr-status', 'tr-status-' + (p.tone || 'success'), p.live && 'tr-status-live', p.className), role: 'status' },
      h('span', { className: 'tr-status-dot', 'aria-hidden': true }), p.children);
  }
  function LanguageSwitch(p) {
    var opts = p.options || ['EN', 'PT'];
    var pair = useControllable(p.value, p.defaultValue || opts[opts.length - 1], p.onChange);
    var items = [];
    opts.forEach(function (o, i) {
      if (i) items.push(h('span', { key: 's' + i, className: 'tr-lang-sep', 'aria-hidden': true }, '/'));
      items.push(h('button', { key: o, type: 'button', 'aria-pressed': pair[0] === o, lang: o.toLowerCase(), onClick: function () { pair[1](o); } }, o));
    });
    return h('div', { className: cx('tr-lang', p.className), role: 'group', 'aria-label': p['aria-label'] || 'Idioma' }, items);
  }
  function SiteSidebar(p) {
    var id = p.identity || {};
    var mark = id.mark != null ? id.mark : (id.name ? id.name.charAt(0) : '·');
    return h('aside', { className: cx('tr-sidebar', p.className) },
      h('a', { className: 'tr-sidebar-id', href: id.href || '#' },
        h('span', { className: 'tr-sidebar-mark', 'aria-hidden': true }, mark),
        h('span', null, h('span', { className: 'tr-sidebar-name' }, id.name), id.role && h('span', { className: 'tr-sidebar-role' }, id.role))),
      p.meta && h('div', { className: 'tr-footnote', style: { fontSize: 12, color: 'var(--ink-muted)', marginTop: -16 } }, p.meta),
      h('nav', { 'aria-label': p['aria-label'] || 'Seções' }, h('ul', { className: 'tr-sidebar-nav' }, (p.items || []).map(function (it, i) {
        var n = it.index != null ? it.index : String(i + 1).padStart(2, '0');
        return h('li', { key: it.href || it.label }, h('a', { className: 'tr-sidebar-link', href: it.href, 'aria-current': p.current === (it.id || it.href) ? 'true' : undefined, target: it.external ? '_blank' : undefined, rel: it.external ? 'noopener noreferrer' : undefined },
          h('span', { className: 'tr-sidebar-num' }, it.external ? '↗' : n), it.label));
      }))),
      h('div', { className: 'tr-sidebar-foot' }, p.status && h(StatusDot, { live: true }, p.status), p.children));
  }

  /* ───────── Conteúdo ───────── */
  function StatGroup(p) {
    return h('div', { className: cx('tr-stats', p.className) },
      (p.stats || []).map(function (s, i) {
        return h('div', { key: i },
          h('strong', { className: 'tr-stat-value' }, s.value),
          h('span', { className: 'tr-stat-label' }, s.label),
          s.href && h(TextLink, { href: s.href, className: 'tr-stat-link', quiet: true, arrow: s.external ? undefined : '↓' }, s.linkLabel || 'ver prova'));
      }),
      p.note && h('p', { className: 'tr-stats-note' }, '↳ ', p.note));
  }
  function MetricStrip(p) {
    return h('dl', { className: cx('tr-metrics', p.fullWidth && 'tr-metrics-full', p.className), style: { margin: 0 } },
      (p.items || []).map(function (m, i) {
        return h('div', { key: i, className: 'tr-metric' }, h('dt', { className: 'tr-metric-label' }, m.label), h('dd', { className: 'tr-metric-value', style: { margin: 0 } }, m.value));
      }));
  }
  function TagList(p) {
    return h('ul', { className: cx('tr-tags', p.size === 'sm' && 'tr-tags-sm', p.mono && 'tr-tags-mono', p.className), 'aria-label': p['aria-label'] },
      (p.tags || []).map(function (t) { return h('li', { key: t, className: 'tr-tag' }, t); }));
  }
  function Timeline(p) {
    return h('ol', { className: cx('tr-timeline', p.className) }, (p.entries || []).map(function (e, i) {
      var n = e.index != null ? e.index : String(i + 1).padStart(2, '0');
      var meta = [e.period, e.location].filter(Boolean);
      return h('li', { key: e.id || e.title, id: e.id, className: 'tr-tl-entry' },
        h('span', { className: 'tr-tl-index' }, n),
        h('div', null,
          h('div', { className: 'tr-tl-head' },
            e.logo !== undefined && h('span', { className: 'tr-tl-logo', 'aria-hidden': true }, typeof e.logo === 'string' && /^(https?:|\/|data:)/.test(e.logo) ? h('img', { src: e.logo, alt: '' }) : e.logo),
            h('div', null, h('h3', { className: 'tr-tl-title' }, e.title), e.subtitle && h('p', { className: 'tr-tl-sub' }, e.subtitle),
              meta.length > 0 && h('p', { className: 'tr-tl-meta' }, meta.map(function (m, j) { return h('span', { key: j }, m); })))),
          (e.metrics || e.chapters || e.footnote) && h('div', { className: 'tr-tl-body' },
            e.metrics && h(MetricStrip, { items: e.metrics }),
            (e.chapters || []).map(function (c, j) {
              return h('div', { key: j, className: 'tr-tl-chapter' }, h('span', { className: 'tr-tl-chapter-num' }, c.index || ((i + 1) + '.' + (j + 1))),
                h('div', null, h('h4', null, c.title), c.items && h('ul', null, c.items.map(function (it, k) { return h('li', { key: k }, it); }))));
            }),
            e.footnote && h('p', { className: 'tr-tl-foot' }, e.footnote))));
    }));
  }
  function ProjectList(p) {
    return h('ol', { className: cx('tr-projects', p.className) }, (p.projects || []).map(function (pr, i) {
      return h('li', { key: pr.title }, h('article', { className: 'tr-project' },
        h('span', { className: 'tr-project-num' }, pr.index || String(i + 1).padStart(2, '0')),
        h('div', null,
          pr.type && h(Eyebrow, { className: 'tr-project-type' }, pr.type),
          h('h3', { className: 'tr-project-title' }, pr.title),
          pr.description && h('p', { className: 'tr-project-desc' }, pr.description),
          pr.tags && h(TagList, { tags: pr.tags, size: 'sm', mono: true, className: 'tr-project-tags' })),
        pr.href ? h(TextLink, { href: pr.href, className: 'tr-project-open' }, pr.linkLabel || 'abrir') : h('span')));
    }));
  }
  function FAQ(p) {
    return h('div', { className: cx('tr-faq', p.className), style: { '--tr-cols': p.columns || 2 } },
      (p.items || []).map(function (it, i) {
        return h('details', { key: i, className: 'tr-faq-item', open: it.open },
          h('summary', null, h('span', null, it.question), h('span', { className: 'tr-faq-icon', 'aria-hidden': true }, '+')),
          h('div', { className: 'tr-faq-answer' }, it.answer));
      }));
  }
  function ProfileCard(p) {
    var photo = p.photo;
    return h('section', { className: cx('tr-profile', p.className) },
      h('div', { className: 'tr-profile-photo' }, photo ? h('img', { src: photo, alt: p.photoAlt || p.name }) : (p.initials || (p.name || '').split(' ').map(function (w) { return w.charAt(0); }).slice(0, 2).join(''))),
      h('div', null, h('h3', { className: 'tr-profile-name' }, p.name), p.role && h('p', { className: 'tr-profile-role' }, p.role), p.bio && h('p', { className: 'tr-profile-bio' }, p.bio), p.children),
      p.stats && h('ul', { className: 'tr-profile-stats' }, p.stats.map(function (s, i) { return h('li', { key: i }, h('strong', null, s.value), h('span', null, s.label)); })));
  }
  function EmailCapture(p) {
    var st = useState(p.state || 'idle'), state = p.state || st[0], setState = st[1];
    var em = useState(''), err = useState(null);
    function submit(e) {
      e.preventDefault();
      var v = em[0].trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { err[1](p.invalidMessage || 'Ainda não: confira o email.'); return; }
      err[1](null); setState('loading');
      Promise.resolve(p.onSubmit ? p.onSubmit(v) : true).then(function (ok) { setState(ok === false ? 'error' : 'done'); }, function () { setState('error'); });
    }
    if (state === 'done') return h('div', { className: cx('tr-capture', p.className), role: 'status' }, h('div', { className: 'tr-capture-done' }, h('span', { className: 'tr-check', 'aria-hidden': true }, '✓'), p.doneMessage || 'Pronto. Você está na lista.'));
    return h('form', { className: cx('tr-capture', p.className), onSubmit: submit, noValidate: true },
      h('div', { className: 'tr-capture-row' },
        h(TextField, { type: 'email', label: p.label || 'Seu email', placeholder: p.placeholder || 'Seu email', value: em[0], onChange: function (e) { em[1](e.target.value); }, autoComplete: 'email', tone: err[0] || state === 'error' ? 'danger' : undefined }),
        h(Button, { type: 'submit', size: 'lg', trailing: '→', disabled: state === 'loading' }, state === 'loading' ? 'Enviando…' : (p.cta || 'Entrar na lista'))),
      (err[0] || state === 'error') && h('div', { className: 'tr-field-hint tr-field-hint-danger', role: 'alert' }, err[0] || p.errorMessage || 'Ainda não: não deu para enviar. Tente de novo.'),
      p.note && h('p', { className: 'tr-capture-note' }, p.note));
  }

  /* ───────── Curso ───────── */
  var NODE = { done: '✓', next: '›', locked: '', open: '' };
  function StateNode(p) { return h('span', { className: cx('tr-node', 'tr-node-' + (p.status || 'open')), 'aria-hidden': true }, p.label != null ? p.label : NODE[p.status || 'open']); }
  var STATUS_WORD = { done: 'concluído', next: 'próximo', locked: 'bloqueado', open: '' };
  function CurriculumTrack(p) {
    var parts = p.parts || [];
    var st = useState(function () { var o = {}; (p.defaultOpen || [0]).forEach(function (i) { o[i] = true; }); return o; });
    return h('div', { className: cx('tr-curr', p.className) }, parts.map(function (pt, i) {
      var open = !!st[0][i];
      var lessons = (pt.chapters || []).reduce(function (n, c) { return n + (c.lessons || 0); }, 0);
      var panelId = 'tr-curr-' + i;
      return h('section', { key: i, className: cx('tr-curr-part', open && 'is-open') },
        h('button', { type: 'button', className: 'tr-curr-head', 'aria-expanded': open, 'aria-controls': panelId, onClick: function () { var o = Object.assign({}, st[0]); o[i] = !open; st[1](o); } },
          h('span', { className: 'tr-curr-n' }, i + 1),
          h('span', null, h('span', { className: 'tr-curr-title' }, pt.title), pt.description && h('span', { className: 'tr-curr-desc' }, pt.description)),
          h('span', { className: 'tr-curr-count' }, pt.count || (lessons + ' aulas')),
          h('span', { className: 'tr-curr-chev', 'aria-hidden': true }, '›')),
        open && h('ol', { id: panelId, className: 'tr-curr-list' }, (pt.chapters || []).map(function (c, j) {
          var s = c.status || 'open';
          return h('li', { key: j, className: cx('tr-curr-ch', 'is-' + s) },
            h(StateNode, { status: s }),
            h('span', null, c.title, STATUS_WORD[s] && h('span', { style: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' } }, ' (' + STATUS_WORD[s] + ')')),
            h('span', { className: 'tr-curr-ch-meta' }, c.meta || ((c.lessons != null ? c.lessons + ' aulas' : '') + (c.duration ? ' · ' + c.duration : ''))));
        })));
    }));
  }
  function ChallengeStepper(p) {
    var cur = p.current || 0;
    return h('ol', { className: cx('tr-stepper', p.className) }, (p.steps || []).map(function (s, i) {
      var status = i < cur ? 'done' : i === cur ? 'next' : 'locked';
      return h('li', { key: i, className: cx('tr-stepper-item', 'is-' + status), 'aria-current': status === 'next' ? 'step' : undefined },
        h(StateNode, { status: status, label: status === 'done' ? '✓' : String(i + 1) }),
        h('div', null,
          h('span', { className: 'tr-stepper-title' }, s.title, status === 'next' && h(Badge, { tone: 'ink', className: 'tr-stepper-state' }, p.nextLabel || 'agora'), status === 'locked' && h('span', { style: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' } }, ' (bloqueada)')),
          s.description && h('span', { className: 'tr-stepper-desc' }, s.description)));
    }));
  }

  var KW = { python: 'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield', js: 'async await break case catch class const continue default delete do else export extends false finally for from function if import in instanceof let new null return super switch this throw true try typeof undefined var void while yield', bash: 'if then else fi for do done in case esac function export local return echo cd' };
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function highlight(code, lang) {
    var kws = (KW[lang] || KW.python).split(' ');
    var commentRe = lang === 'js' ? '\\/\\/[^\\n]*' : '#[^\\n]*';
    var re = new RegExp('(' + commentRe + ')|("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`[^`]*`)|\\b(\\d[\\d_.]*)\\b|\\b([A-Z][A-Z0-9_]{1,})\\b|\\b([A-Za-z_][\\w]*)(?=\\s*\\()|\\b([A-Za-z_]\\w*)\\b', 'g');
    var out = '', last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index)); last = re.lastIndex;
      var t = esc(m[0]);
      if (m[1]) out += '<span class="tk-c">' + t + '</span>';
      else if (m[2]) out += '<span class="tk-s">' + t + '</span>';
      else if (m[3]) out += '<span class="tk-n">' + t + '</span>';
      else if (m[4]) out += '<span class="tk-C">' + t + '</span>';
      else if (m[5]) out += kws.indexOf(m[5]) >= 0 ? '<span class="tk-k">' + t + '</span>' : '<span class="tk-f">' + t + '</span>';
      else if (m[6] && kws.indexOf(m[6]) >= 0) out += '<span class="tk-k">' + t + '</span>';
      else out += t;
    }
    return out + esc(code.slice(last));
  }
  function CodeEditor(p) {
    var files = p.files || [{ name: 'main.py', code: p.code || '' }];
    var tab = useState(0);
    var codes = useState(function () { return files.map(function (f) { return f.code; }); });
    var f = files[tab[0]] || files[0];
    var code = codes[0][tab[0]];
    var lang = f.language || (/\.js$/.test(f.name) ? 'js' : /\.sh$/.test(f.name) ? 'bash' : 'python');
    var lines = code.split('\n');
    var hl = (p.highlightLines || []);
    var html = highlight(code, lang).split('\n').map(function (l, i) { return hl.indexOf(i + 1) >= 0 ? '<span class="tr-editor-line is-hl">' + (l || ' ') + '</span>' : l; }).join('\n') + '\n';
    function onEdit(e) { var c = codes[0].slice(); c[tab[0]] = e.target.value; codes[1](c); if (p.onChange) p.onChange(f.name, e.target.value); }
    function onKeyDown(e) {
      if (e.key === 'Tab' && !e.shiftKey && !p.allowTabOut) { e.preventDefault(); var t = e.target, s = t.selectionStart; t.setRangeText('    ', s, t.selectionEnd, 'end'); onEdit({ target: t }); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && p.onRun) { e.preventDefault(); p.onRun(f.name, code); }
    }
    return h('div', { className: cx('tr-editor', p.className) },
      h('div', { className: 'tr-editor-bar' },
        h('div', { className: 'tr-editor-tabs', role: 'tablist' }, files.map(function (x, i) {
          return h('button', { key: x.name, type: 'button', role: 'tab', 'aria-selected': i === tab[0], className: 'tr-editor-tab', onClick: function () { tab[1](i); } }, x.name);
        })),
        p.meta && h('span', { className: 'tr-editor-meta' }, p.meta),
        p.onRun && h('button', { type: 'button', className: 'tr-editor-run', onClick: function () { p.onRun(f.name, code); }, disabled: p.running, 'aria-keyshortcuts': 'Meta+Enter' }, p.running ? 'Rodando…' : h(React.Fragment, null, h('span', { 'aria-hidden': true }, '▶'), p.runLabel || 'Rodar'))),
      h('div', { className: 'tr-editor-body', style: p.maxHeight ? { maxHeight: p.maxHeight } : undefined },
        h('div', { className: 'tr-editor-gutter', 'aria-hidden': true }, lines.map(function (_, i) { return i + 1; }).join('\n')),
        h('div', { className: 'tr-editor-code' },
          h('pre', { className: 'tr-editor-hl', 'aria-hidden': p.editable ? true : undefined, dangerouslySetInnerHTML: { __html: html } }),
          p.editable && h('textarea', { className: 'tr-editor-ta', value: code, onChange: onEdit, onKeyDown: onKeyDown, spellCheck: false, autoCapitalize: 'off', autoComplete: 'off', 'aria-label': 'Código de ' + f.name, rows: lines.length }))),
      p.caption && h('div', { className: 'tr-editor-caption' }, p.caption));
  }
  function BrowserFrame(p) {
    return h('figure', { className: cx('tr-browser', p.className), style: { margin: 0 } },
      h('div', { className: 'tr-browser-bar' },
        h('span', { className: 'tr-browser-nav', 'aria-hidden': true }, '‹ ›'),
        h('span', { className: 'tr-browser-url' }, p.secure !== false && h('svg', { className: 'tr-browser-lock', width: 10, height: 12, viewBox: '0 0 10 12', role: 'img', 'aria-label': 'conexão segura' }, h('rect', { x: 1, y: 5, width: 8, height: 6.5, rx: 1.5, fill: 'currentColor' }), h('path', { d: 'M3 5V3.6a2 2 0 0 1 4 0V5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 })), p.url),
        p.actions),
      h('div', { className: 'tr-browser-body' }, p.children),
      p.caption && h('figcaption', { className: 'tr-editor-caption', style: { color: 'var(--ink-muted)', borderTop: '1px solid var(--line)' } }, p.caption));
  }
  function DataTable(p) {
    var cols = p.columns || [], rows = p.rows || [];
    return h('div', { className: cx('tr-table-wrap', p.className) },
      (p.title || p.count !== false) && h('div', { className: 'tr-table-head' },
        h('span', { className: 'tr-table-title' }, p.title),
        p.count !== false && h(Badge, null, (p.count != null ? p.count : rows.length) + ' ' + (p.countLabel || 'registros'))),
      h('div', { className: 'tr-table-scroll' },
        h('table', { className: 'tr-table' },
          p.caption && h('caption', { style: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' } }, p.caption),
          h('thead', null, h('tr', null, cols.map(function (c) { return h('th', { key: c.key, scope: 'col', className: c.align === 'right' ? 'is-num' : undefined }, c.label, c.type && h('small', null, c.type)); }))),
          h('tbody', null, rows.length ? rows.map(function (r, i) {
            return h('tr', { key: i }, cols.map(function (c) { return h('td', { key: c.key, className: cx(c.mono && 'is-mono', c.align === 'right' && 'is-num') }, c.render ? c.render(r[c.key], r) : r[c.key]); }));
          }) : h('tr', null, h('td', { colSpan: cols.length || 1, className: 'tr-table-empty' }, p.empty || 'Nenhum registro ainda. Rode o código para preencher.'))))));
  }
  function Skeleton(p) {
    var n = p.lines || 3, w = p.widths || ['100%', '92%', '64%'];
    var out = []; for (var i = 0; i < n; i++) out.push(h('span', { key: i, className: 'tr-skel', style: { width: w[i % w.length], height: p.height } }));
    return h('div', { className: p.className, 'aria-busy': true, 'aria-label': p.label || 'Carregando' }, out);
  }

  /* ───────── Superfícies ───────── */
  function GlassPanel(p) {
    if (p.variant) {
      return h(LiquidGlass, Object.assign(omit(p, ['tone', 'padding']), { shape: p.shape || 'rounded', style: Object.assign({}, p.style, p.padding != null ? { padding: p.padding } : null) }));
    }
    var rest = omit(p, ['tone', 'className', 'children', 'as', 'padding']);
    return h(p.as || 'div', Object.assign({}, rest, { className: cx('tr-glass', p.tone === 'dark' && 'tr-glass-dark', p.className), style: Object.assign({}, p.style, p.padding != null ? { padding: p.padding } : null) }), p.children);
  }
  function Sheet(p) {
    var ref = useRef(null);
    useEffect(function () {
      if (!p.open || p.inline) return;
      var prev = document.activeElement;
      var node = ref.current; if (node) node.focus();
      function key(e) {
        if (e.key === 'Escape' && p.onClose) p.onClose();
        if (e.key === 'Tab' && node) {
          var f = node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (!f.length) return;
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      document.addEventListener('keydown', key);
      return function () { document.removeEventListener('keydown', key); if (prev && prev.focus) prev.focus(); };
    }, [p.open]);
    if (!p.open) return null;
    var titleId = 'tr-sheet-t';
    return h('div', { className: cx('tr-sheet-backdrop', p.inline && 'tr-sheet-inline'), onMouseDown: function (e) { if (e.target === e.currentTarget && p.onClose) p.onClose(); } },
      h('div', { ref: ref, className: cx('tr-sheet', p.material !== 'solid' && 'tr-sheet-glass', p.className), role: 'dialog', 'aria-modal': p.inline ? undefined : true, 'aria-labelledby': titleId, tabIndex: -1 },
        h('div', { className: 'tr-sheet-head' }, h('h2', { id: titleId, className: 'tr-sheet-title' }, p.title), p.onClose && h('button', { type: 'button', className: 'tr-sheet-close', 'aria-label': 'Fechar', onClick: p.onClose }, '×')),
        p.children,
        p.actions && h('div', { className: 'tr-sheet-actions' }, p.actions)));
  }
  function Reveal(p) {
    var ref = useRef(null), st = useState(false);
    useEffect(function () {
      var el = ref.current; if (!el) return;
      if (!('IntersectionObserver' in window) || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) { st[1](true); return; }
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { st[1](true); io.disconnect(); } }); }, { rootMargin: '0px 0px -10% 0px' });
      io.observe(el); return function () { io.disconnect(); };
    }, []);
    var kids = p.stagger ? React.Children.map(p.children, function (c, i) { return h('div', { className: cx('tr-reveal', st[0] && 'is-in'), style: { '--tr-d': ((p.delay || 0) + i * (p.stagger === true ? 0.08 : p.stagger)) + 's' } }, c); }) : p.children;
    return h(p.as || 'div', { ref: ref, className: cx(!p.stagger && 'tr-reveal', !p.stagger && st[0] && 'is-in', p.className), style: !p.stagger ? { '--tr-d': (p.delay || 0) + 's' } : undefined }, kids);
  }

  /* ───────── Leitura ───────── */
  var READER_KEY = 'trilha-reader';
  var SIZES = [16, 17, 19, 21, 24];
  var READER_DEFAULT = { size: 2, family: 'serif', theme: 'auto', width: 'normal' };
    function ReaderControls(p) {
    var v = Object.assign({}, READER_DEFAULT, p.value);
    var open = useState(!!p.inline);
    function set(k, val) { var n = Object.assign({}, v); n[k] = val; if (p.onChange) p.onChange(n); }
    var panel = h('div', { className: cx('tr-rc-panel', p.inline && 'is-inline'), role: 'group', 'aria-label': 'Aparência da leitura' },
      h('div', { className: 'tr-rc-row' }, h('span', { className: 'tr-rc-label' }, 'Tamanho do texto'),
        h('div', { className: 'tr-rc-size' },
          h('button', { type: 'button', 'aria-label': 'Diminuir texto', disabled: v.size <= 0, onClick: function () { set('size', v.size - 1); } }, h('span', { style: { fontSize: 13 } }, 'A')),
          h('div', { className: 'tr-rc-dots', 'aria-hidden': true }, SIZES.map(function (_, i) { return h('span', { key: i, className: i <= v.size ? 'is-on' : undefined }); })),
          h('button', { type: 'button', 'aria-label': 'Aumentar texto', disabled: v.size >= SIZES.length - 1, onClick: function () { set('size', v.size + 1); } }, h('span', { style: { fontSize: 19 } }, 'A')))),
      h('div', { className: 'tr-rc-row' }, h('span', { className: 'tr-rc-label' }, 'Fonte'),
        h(SegmentedControl, { fullWidth: true, 'aria-label': 'Fonte', value: v.family, onChange: function (x) { set('family', x); }, options: [{ value: 'serif', label: h('span', { style: { fontFamily: 'var(--font-serif)' } }, 'New York') }, { value: 'sans', label: 'SF Pro' }] })),
      h('div', { className: 'tr-rc-row' }, h('span', { className: 'tr-rc-label' }, 'Largura'),
        h(SegmentedControl, { fullWidth: true, 'aria-label': 'Largura da coluna', value: v.width, onChange: function (x) { set('width', x); }, options: [{ value: 'narrow', label: 'Estreita' }, { value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Larga' }] })),
      h('div', { className: 'tr-rc-row' }, h('span', { className: 'tr-rc-label' }, 'Tema'),
        h('div', { className: 'tr-rc-themes', role: 'radiogroup', 'aria-label': 'Tema' }, [['auto', 'Auto'], ['light', 'Claro'], ['paper', 'Papel'], ['dark', 'Escuro']].map(function (t) {
          return h('button', { key: t[0], type: 'button', role: 'radio', 'aria-checked': v.theme === t[0], className: 'tr-rc-theme tr-rc-theme-' + t[0], onClick: function () { set('theme', t[0]); } }, h('b', { 'aria-hidden': true }, 'Aa'), t[1]);
        }))));
    if (p.inline) return h('div', { className: cx('tr-rc', p.className) }, panel);
    return h('div', { className: cx('tr-rc', p.className) },
      h(Button, { variant: p.glass ? 'glass' : 'gray', size: 'sm', className: 'tr-rc-trigger', 'aria-expanded': open[0], 'aria-label': 'Aparência da leitura', onClick: function () { open[1](!open[0]); } }, h('span', { 'aria-hidden': true, style: { fontFamily: 'var(--font-serif)' } }, 'A', h('small', null, 'A'))),
      open[0] && panel);
  }
  function ReaderView(p) {
    var st = useState(function () { var base = Object.assign({}, READER_DEFAULT, p.defaultSettings); if (p.persist === false) return base; var saved = {}; try { saved = JSON.parse(localStorage.getItem(READER_KEY) || '{}'); } catch (e) {} return Object.assign(base, saved); });
    var s = p.settings || st[0];
    function change(n) { if (!p.settings) st[1](n); if (p.persist !== false) { try { localStorage.setItem(READER_KEY, JSON.stringify(n)); } catch (e) {} } if (p.onSettingsChange) p.onSettingsChange(n); }
    var rootRef = useRef(null), prog = useState(0), past = useState(false);
    useEffect(function () {
      function onScroll() {
        var el = rootRef.current; if (!el) return;
        var r = el.getBoundingClientRect(), vh = window.innerHeight;
        var total = Math.max(1, r.height - vh);
        prog[1](Math.min(1, Math.max(0, -r.top / total)));
        past[1](-r.top > 240);
      }
      onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll);
      return function () { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
    }, []);
    var floating = p.floating !== false;
    var collapsedScroll = useScrollCollapse(floating && p.collapseOnScroll !== false);
    var barRef = useRef(null);
    useGlass(barRef, { enabled: floating, strength: 20 });
    var measure = s.width === 'narrow' ? 'var(--size-measure-narrow)' : s.width === 'wide' ? 'var(--size-measure-wide)' : 'var(--size-measure)';
    return h('div', { ref: rootRef, className: cx('tr-reader', p.className), 'data-theme': s.theme === 'auto' ? undefined : s.theme, 'data-family': s.family, lang: p.lang || 'pt-BR', style: { '--tr-reader-size': SIZES[s.size] + 'px', '--tr-reader-measure': measure } },
      p.toolbar !== false && (function (bar) { return floating ? h('div', { className: 'tr-reader-float' }, bar) : bar; })(h('div', { ref: barRef, className: cx('tr-reader-bar', floating && collapsedScroll && 'is-collapsed') },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 } }, p.back && h('span', { className: 'tr-reader-extra' }, p.back), h('span', { className: cx('tr-reader-bar-title', past[0] && 'is-on'), 'aria-hidden': !past[0] }, p.title)),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } }, p.readingTime && h('span', { className: 'tr-status tr-reader-extra', style: { whiteSpace: 'nowrap' } }, p.readingTime), h(ReaderControls, { value: s, onChange: change, glass: floating })),
        h('div', { className: 'tr-reader-progress', role: 'progressbar', 'aria-label': 'Progresso da leitura', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(prog[0] * 100) }, h('span', { style: { transform: 'scaleX(' + prog[0] + ')' } })))),
      p.children);
  }
  function ArticleLayout(p) {
    return h('article', { className: cx('tr-article', p.className) },
      p.aside && h('aside', { className: cx('tr-article-aside', p.asideSide === 'start' && 'tr-article-aside-start') }, p.aside),
      p.children);
  }
  function ArticleHeader(p) {
    return h('header', { className: cx('tr-article-head', p.className) },
      p.eyebrow && h(Eyebrow, { index: p.index }, p.eyebrow),
      h('h1', { className: 'tr-article-title' }, p.title),
      p.lede && h('p', { className: 'tr-article-lede' }, p.lede),
      (p.author || p.date || p.readingTime) && h('div', { className: 'tr-article-byline' },
        p.author && h('span', { className: 'tr-article-avatar', 'aria-hidden': true }, p.avatar ? h('img', { src: p.avatar, alt: '' }) : String(p.author).charAt(0)),
        p.author && h('span', { className: 'tr-article-author', style: { marginRight: 4 } }, p.author),
        p.date && h('span', { className: 'tr-article-meta' }, h('time', { dateTime: p.dateTime }, p.date)),
        p.readingTime && h('span', { className: 'tr-article-meta' }, p.readingTime)));
  }
  function Prose(p) {
    var rest = omit(p, ['className', 'children', 'as', 'html']);
    return h(p.as || 'div', Object.assign({}, rest, { className: cx('tr-prose', p.className) }, p.html != null ? { dangerouslySetInnerHTML: { __html: p.html } } : null), p.html != null ? undefined : p.children);
  }
  function PullQuote(p) {
    return h('figure', { className: cx('tr-pullquote', p.className) }, h('blockquote', { style: { margin: 0, padding: 0, border: 0 } }, h('p', null, p.children)), p.cite && h('figcaption', null, h('cite', null, p.cite)));
  }
  function Sidenote(p) {
    var open = useState(false), n = p.n || '*';
    var id = 'tr-sn-' + n;
    return h(React.Fragment, null,
      h('button', { type: 'button', className: 'tr-sidenote-ref', 'aria-expanded': open[0], 'aria-controls': id, onClick: function () { open[1](!open[0]); } }, n),
      h('span', { id: id, role: 'note', className: cx('tr-sidenote', open[0] && 'is-open') }, h('span', { className: 'tr-sidenote-n' }, n), p.children));
  }
  function TableOfContents(p) {
    var items = p.items || [];
    var act = useState(items[0] && items[0].id);
    useEffect(function () {
      if (!('IntersectionObserver' in window)) return;
      var io = new IntersectionObserver(function (es) {
        var vis = es.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
        if (vis[0]) act[1](vis[0].target.id);
      }, { rootMargin: '-72px 0px -65% 0px' });
      items.forEach(function (it) { var el = document.getElementById(it.id); if (el) io.observe(el); });
      return function () { io.disconnect(); };
    }, [items.length]);
    var list = h('ol', null, items.map(function (it) {
      return h('li', { key: it.id, className: it.level === 3 ? 'is-l3' : undefined }, h('a', { href: '#' + it.id, 'aria-current': act[0] === it.id ? 'true' : undefined, onClick: function () { act[1](it.id); } }, it.label));
    }));
    if (p.variant === 'mobile') return h('details', { className: cx('tr-toc-mobile', p.className) }, h('summary', null, p.title || 'Nesta página', h('span', { 'aria-hidden': true }, '›')), list);
    return h('nav', { className: cx('tr-toc', p.className), 'aria-label': p.title || 'Nesta página' }, h(Eyebrow, { className: 'tr-toc-title' }, p.title || 'Nesta página'), list);
  }
  function ReadingProgress(p) {
    var v = useState(0);
    useEffect(function () {
      function f() { var d = document.documentElement; var t = Math.max(1, d.scrollHeight - window.innerHeight); v[1](Math.min(1, window.scrollY / t)); }
      f(); window.addEventListener('scroll', f, { passive: true }); return function () { window.removeEventListener('scroll', f); };
    }, []);
    var val = p.value != null ? p.value : v[0];
    return h('div', { className: cx('tr-reader-progress', p.className), style: { position: p.fixed ? 'fixed' : 'relative', top: p.fixed ? 0 : undefined, bottom: 'auto', zIndex: 40, height: p.height || 2 }, role: 'progressbar', 'aria-label': p['aria-label'] || 'Progresso da leitura', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(val * 100) }, h('span', { style: { transform: 'scaleX(' + val + ')' } }));
  }

  var api = {
    Button: Button, Badge: Badge, Code: Code, Takeaway: Takeaway, Mark: Mark, ProgressBar: ProgressBar,
    SegmentedControl: SegmentedControl, Card: Card, TextField: TextField, StepTimeline: StepTimeline,
    Terminal: Terminal, TutorBubble: TutorBubble, Callout: Callout, List: List, ListRow: ListRow, LessonToolbar: LessonToolbar,
    Eyebrow: Eyebrow, SectionHeader: SectionHeader, TextLink: TextLink, StatusDot: StatusDot, LanguageSwitch: LanguageSwitch, SiteSidebar: SiteSidebar,
    StatGroup: StatGroup, MetricStrip: MetricStrip, TagList: TagList, Timeline: Timeline, ProjectList: ProjectList, FAQ: FAQ, ProfileCard: ProfileCard, EmailCapture: EmailCapture,
    CurriculumTrack: CurriculumTrack, ChallengeStepper: ChallengeStepper, StateNode: StateNode, CodeEditor: CodeEditor, BrowserFrame: BrowserFrame, DataTable: DataTable, Skeleton: Skeleton,
    GlassPanel: GlassPanel, LiquidGlass: LiquidGlass, Sheet: Sheet, Reveal: Reveal,
    ReaderView: ReaderView, ReaderControls: ReaderControls, ArticleLayout: ArticleLayout, ArticleHeader: ArticleHeader, Prose: Prose, PullQuote: PullQuote, Sidenote: Sidenote, TableOfContents: TableOfContents, ReadingProgress: ReadingProgress
  };
  window.Trilha = Object.assign(window.Trilha || {}, api);
})();
