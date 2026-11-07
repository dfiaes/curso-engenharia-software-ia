/* @ds-bundle: {"format":4,"namespace":"Trilha","components":[{"name":"Button"},{"name":"Badge"},{"name":"Code"},{"name":"Takeaway"},{"name":"ProgressBar"},{"name":"SegmentedControl"},{"name":"Card"},{"name":"TextField"},{"name":"StepTimeline"},{"name":"Terminal"},{"name":"TutorBubble"},{"name":"Callout"},{"name":"List"},{"name":"LessonToolbar"}]} */
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

  /* Button */
  function Button(p) {
    var variant = p.variant || 'filled', size = p.size || 'md';
    var rest = omit(p, ['variant', 'size', 'leading', 'trailing', 'fullWidth', 'className', 'children']);
    return h('button', Object.assign({ type: 'button' }, rest, {
      className: cx('tr-btn', 'tr-btn-' + variant, size !== 'md' && 'tr-btn-' + size, p.fullWidth && 'tr-btn-full', p.className)
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
    var thumb = useState(null);
    useLayoutEffect(function () {
      var root = ref.current; if (!root) return;
      var el = root.querySelector('[aria-checked="true"]');
      if (el) thumb[1]({ left: el.offsetLeft, width: el.offsetWidth });
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
    return h('div', { ref: ref, role: 'radiogroup', 'aria-label': p['aria-label'], className: cx('tr-seg', p.fullWidth && 'tr-seg-full', p.className), onKeyDown: onKey },
      thumb[0] && h('span', { className: 'tr-seg-thumb', 'aria-hidden': true, style: { left: thumb[0].left, width: thumb[0].width } }),
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
  var PREFIX = { cmd: '$ ', info: '* ', out: '> ', in: '< ', hint: '', body: '' };
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
  var CALLOUT_ICON = { success: '✓', danger: '!', info: 'i', neutral: '•' };
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
    return h('nav', { className: cx('tr-toolbar', p.className), 'aria-label': p['aria-label'] || 'Etapas da aula' },
      h('div', null, p.onBack !== undefined ? h(Button, { variant: 'gray', size: 'sm', 'aria-label': 'Voltar', onClick: p.onBack }, '←') : null),
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
        p.action !== undefined ? p.action : h(Button, { size: 'sm', trailing: '→', disabled: p.canContinue === false, onClick: p.onContinue }, p.continueLabel || 'Continuar')));
  }

  var api = {
    Button: Button, Badge: Badge, Code: Code, Takeaway: Takeaway, Mark: Mark, ProgressBar: ProgressBar,
    SegmentedControl: SegmentedControl, Card: Card, TextField: TextField, StepTimeline: StepTimeline,
    Terminal: Terminal, TutorBubble: TutorBubble, Callout: Callout, List: List, ListRow: ListRow, LessonToolbar: LessonToolbar
  };
  window.Trilha = Object.assign(window.Trilha || {}, api);
})();
