/* ------------------------------------------------------------------
   AFFORD-X project page.

   Every measured number below is recomputed from the run logs in
   AFFORD-X/outputs/sprint/ with the same estimator the paper build uses
   (paired percentile bootstrap, 10,000 resamples, seed 0), and matches
   paper/tables/*.tex and paper/figures/make_*.py.

   The one exception is CANDIDATES in the selection explorer, which is a
   worked example rather than logged data. It is labelled as such on the
   page. The scoring rule it applies is the shipped one, from
   affordx/capx/affordance_ops.py :: embodiment_gated_scores.
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   Copy BibTeX to clipboard
   ------------------------------------------------------------------ */
function copyBibTeX() {
  var bibtexElement = document.getElementById('bibtex-code');
  var button = document.querySelector('.copy-bibtex-btn');
  if (!bibtexElement || !button) return;

  var copyText = button.querySelector('.copy-text');

  function markCopied() {
    button.classList.add('copied');
    if (copyText) copyText.textContent = 'Copied!';
    setTimeout(function () {
      button.classList.remove('copied');
      if (copyText) copyText.textContent = 'Copy';
    }, 2000);
  }

  function fallbackCopy() {
    var textArea = document.createElement('textarea');
    textArea.value = bibtexElement.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand('copy'); } catch (e) { /* nothing else to try */ }
    document.body.removeChild(textArea);
    markCopied();
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(bibtexElement.textContent).then(markCopied).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Run a callback the first time an element scrolls into view. */
function onFirstView(element, callback, threshold) {
  if (!('IntersectionObserver' in window)) { callback(); return; }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      callback();
      observer.unobserve(entry.target);
    });
  }, { threshold: threshold || 0.25 });
  observer.observe(element);
}

/* ------------------------------------------------------------------
   Tiny SVG helpers. Charts are hand-built so the page ships no plotting
   library and every drawn value is traceable to the data blocks above.
   ------------------------------------------------------------------ */
var SVGNS = 'http://www.w3.org/2000/svg';

function svgEl(name, attrs) {
  var node = document.createElementNS(SVGNS, name);
  Object.keys(attrs || {}).forEach(function (key) {
    node.setAttribute(key, attrs[key]);
  });
  return node;
}

function svgText(x, y, text, cls, extra) {
  var node = svgEl('text', Object.assign({ x: x, y: y, class: cls || 'ax-svg-tick' }, extra || {}));
  node.textContent = text;
  return node;
}

/* Attach a shared hover tooltip to a chart host. */
function makeTooltip(host) {
  var tip = document.createElement('div');
  tip.className = 'ax-tip';
  host.appendChild(tip);

  return {
    show: function (event, html) {
      tip.innerHTML = html;
      tip.classList.add('is-on');
      var box = host.getBoundingClientRect();
      var x = event.clientX - box.left;
      var y = event.clientY - box.top;
      tip.style.left = Math.min(Math.max(x + 14, 4), box.width - tip.offsetWidth - 4) + 'px';
      tip.style.top = Math.max(y - tip.offsetHeight - 12, 4) + 'px';
    },
    hide: function () { tip.classList.remove('is-on'); }
  };
}

/* ------------------------------------------------------------------
   Sticky nav: scroll spy, reading progress, mobile toggle
   ------------------------------------------------------------------ */
function setupNav() {
  var nav = document.getElementById('ai-nav');
  var progress = document.getElementById('ai-progress');
  var toggle = document.getElementById('ai-nav-toggle');
  var links = document.getElementById('ai-nav-links');
  if (!nav) return;

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var anchors = links ? Array.prototype.slice.call(links.querySelectorAll('a')) : [];
  var sections = anchors
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  function onScroll() {
    if (progress) {
      var height = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (height > 0 ? (window.pageYOffset / height) * 100 : 0) + '%';
    }

    var scrollButton = document.querySelector('.scroll-to-top');
    if (scrollButton) scrollButton.classList.toggle('visible', window.pageYOffset > 300);

    var current = -1;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= nav.offsetHeight + 20) current = i;
    }
    anchors.forEach(function (a, i) { a.classList.toggle('is-active', i === current); });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });

  onScroll();
}

/* ------------------------------------------------------------------
   Animated stat counters
   ------------------------------------------------------------------ */
function setupCounters() {
  var counters = document.querySelectorAll('[data-count-to]');
  if (!counters.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render(el, value) {
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    el.textContent = (el.dataset.prefix || '') + value.toFixed(decimals) + (el.dataset.suffix || '');
  }

  counters.forEach(function (el) {
    var target = parseFloat(el.dataset.countTo);
    if (reduce) { render(el, target); return; }

    onFirstView(el, function () {
      var duration = 1100;
      var start = null;
      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        render(el, target * eased);
        if (progress < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }, 0.4);
  });
}

/* ------------------------------------------------------------------
   Generic tab groups
   ------------------------------------------------------------------ */
function setupTabs() {
  var tabs = document.querySelectorAll('.ai-tab[data-tab]');
  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var name = tab.dataset.tab;
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('.ai-tab-panel').forEach(function (panel) {
        panel.classList.toggle('is-active', panel.dataset.panel === name);
      });
    });
  });
}

/* ------------------------------------------------------------------
   Figure lightbox
   ------------------------------------------------------------------ */
function setupLightbox() {
  var lightbox = document.getElementById('ai-lightbox');
  var image = document.getElementById('ai-lightbox-img');
  var caption = document.getElementById('ai-lightbox-caption');
  var closeBtn = document.getElementById('ai-lightbox-close');
  if (!lightbox || !image) return;

  function open(source) {
    image.src = source.src;
    image.alt = source.alt;
    var figcaption = source.closest('figure') ? source.closest('figure').querySelector('figcaption') : null;
    if (caption) caption.textContent = figcaption ? figcaption.textContent.trim() : source.alt;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    image.src = '';
  }

  document.querySelectorAll('.ai-zoomable').forEach(function (img) {
    img.addEventListener('click', function () { open(img); });
  });

  if (closeBtn) closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) close();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) close();
  });
}

/* ------------------------------------------------------------------
   Pipeline walkthrough: agent, ground, select, execute
   ------------------------------------------------------------------ */
var STAGES = {
  agent: {
    eyebrow: 'Stage 1 of 4 · frozen',
    title: 'The coding agent',
    lead: 'A frozen language model writes Python against a fixed tool registry and declares what it will do next.',
    body: 'Nothing in the planner, the prompt scaffold or the motion primitives is ours. The agent calls ' +
      'affordance_grasp, contextual_grasp and affordance_confidence exactly as it calls any other tool, and ' +
      'the next_action argument it passes is the only extra information the layer receives. Withholding those ' +
      'three tools and substituting the detector argmax is the ablation that isolates our contribution.',
    spec: [
      ['Planner', 'frozen LM'],
      ['Rounds per episode', 'at most 4'],
      ['Tools we add', '3'],
      ['Gradient steps', '0']
    ]
  },
  ground: {
    eyebrow: 'Stage 2 of 4 · frozen',
    title: 'Ground the named part',
    lead: 'A frozen open-vocabulary segmenter returns a mask; a frozen detector returns K candidate poses.',
    body: 'SAM3 supplies the mask for a verb-conditioned part query, so candidates are restricted to the ' +
      'functionally correct region of the object, and Contact-GraspNet supplies 6-DoF candidates with quality ' +
      'scores. Neither is trained, fine-tuned or adapted. Grounding is also where the layer is weakest: both ' +
      'detectors we tried read visual categories reliably and product identities poorly.',
    spec: [
      ['Segmenter', 'SAM3 (frozen)'],
      ['Detector', 'Contact-GraspNet'],
      ['Category grounding', '0.71–0.91'],
      ['Product-name grounding', 'unreliable']
    ]
  },
  select: {
    eyebrow: 'Stage 3 of 4 · ours',
    title: 'Gate, then rank',
    lead: 'Feasibility forms the eligible set. Function and plan rank only inside it.',
    body: 'The grip term gₖ = qₖ rₖ cₖ combines detector quality, reachability and collision margin, ' +
      'and a relative floor keeps the candidates the arm can actually execute. Preference terms multiply only ' +
      'within that set, so a semantic or plan-derived preference can choose among holdable grasps but can never ' +
      'select an unholdable one. With neutral context and memory the rule reduces exactly to grip ordering.',
    spec: [
      ['Gate', 'gₖ ≥ 0.5 maxⱼ gⱼ'],
      ['Trainable parameters', '0'],
      ['Median gate term', '0.82'],
      ['Median preference', '0.69']
    ]
  },
  execute: {
    eyebrow: 'Stage 4 of 4 · frozen',
    title: 'Execute and re-perceive',
    lead: 'The selected 6-DoF pose goes to a frozen IK solver and the agent verifies by looking again.',
    body: 'The layer reports a scalar confidence with the pose, which the agent uses as a gate before committing ' +
      'to a motion. That confidence is a property of the grasp and the arm together: the perception-only carrier ' +
      'we pre-registered failed its bar, and multiplying it by the executed grasp reachability is what makes it ' +
      'work. The confidence threshold and the replan loop belong to the agent policy, outside our boundary.',
    spec: [
      ['IK', 'PyRoKi (frozen)'],
      ['Confidence AUROC', '0.806'],
      ['Pre-registered bar', '0.75'],
      ['Held-out episodes', '88']
    ]
  }
};

function setupStages() {
  var buttons = document.querySelectorAll('.ai-stage');
  var detail = document.getElementById('ai-loop-detail');
  if (!buttons.length || !detail) return;

  var el = {
    eyebrow: detail.querySelector('.ai-loop-eyebrow'),
    title: detail.querySelector('h3'),
    lead: detail.querySelector('.ai-loop-lead'),
    body: detail.querySelector('.ai-loop-body'),
    spec: detail.querySelector('.ai-loop-spec')
  };

  function show(key, button) {
    var stage = STAGES[key];
    if (!stage) return;

    buttons.forEach(function (b) {
      var active = b === button;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    });

    detail.style.setProperty('--stage-c', 'var(--stage-' + key + ')');
    el.eyebrow.textContent = stage.eyebrow;
    el.title.textContent = stage.title;
    el.lead.textContent = stage.lead;
    el.body.textContent = stage.body;
    el.spec.innerHTML = stage.spec.map(function (pair) {
      return '<div><span class="ai-spec-label">' + pair[0] +
        '</span><span class="ai-spec-val">' + pair[1] + '</span></div>';
    }).join('');
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () { show(button.dataset.stage, button); });
  });

  show('agent', buttons[0]);
}

/* ------------------------------------------------------------------
   Selection explorer.

   A worked example on the wrench-and-peg scene from the method figure,
   scored by the shipped rule:

     g = q * r * c
     F = { k : g_k >= tau * max_j g_j }         (tau = 0.5)
     s = g * f * x * m   inside F,   0 outside

   The candidate set is illustrative. The rule, the floor and the term
   ranges (memory is clipped to [0.3, 1.8]) are the implementation's.
   ------------------------------------------------------------------ */
var CANDIDATES = [
  { id: 1, part: 'Ring',   pose: 'top-down',      q: 0.98, r: 1.0, c: 1.00, f: 1.00, x: 0.15, m: 1.00 },
  { id: 2, part: 'Ring',   pose: 'encircling',    q: 0.94, r: 1.0, c: 0.96, f: 1.00, x: 0.15, m: 1.00 },
  { id: 3, part: 'Ring',   pose: 'rim, tilted',   q: 0.86, r: 1.0, c: 0.88, f: 0.79, x: 0.15, m: 1.00 },
  { id: 4, part: 'Handle', pose: 'top-down',      q: 0.79, r: 1.0, c: 0.82, f: 1.00, x: 1.00, m: 1.00 },
  { id: 5, part: 'Handle', pose: 'angled 35°', q: 0.71, r: 1.0, c: 0.77, f: 0.71, x: 1.00, m: 1.00 },
  { id: 6, part: 'Handle', pose: 'pinch at tip',  q: 0.70, r: 1.0, c: 0.60, f: 1.00, x: 1.00, m: 1.80 },
  { id: 7, part: 'Handle', pose: 'from below',    q: 0.91, r: 0.1, c: 0.94, f: 0.30, x: 1.00, m: 1.00 },
  { id: 8, part: 'Shaft',  pose: 'mid-span',      q: 0.68, r: 1.0, c: 0.71, f: 0.83, x: 0.45, m: 1.00 }
];

var VERDICTS = {
  // Keyed by the winning candidate id, so the readout follows the rule
  // rather than restating the toggles.
  1: { tone: 'bad', text: 'The detector’s own favourite. A ring grasp is the most stable contact on this object and leaves nothing free to thread over the peg.' },
  2: { tone: 'bad', text: 'Still the ring. Closure stability is maximal and the task is unachievable from here.' },
  3: { tone: 'bad', text: 'Still the ring, now at the rim. The grasp holds; the placement cannot.' },
  4: { tone: 'good', text: 'The handle, held from above. Feasible for the arm and it leaves the ring clear, which is what the peg needs.' },
  5: { tone: 'ok', text: 'The handle at an angle. Functionally right, and the approach term attenuates it relative to a clean top-down contact.' },
  6: { tone: 'bad', text: 'A pinch at the very tip of the handle, promoted by a memory prior. Its grip term is below the floor: the arm fails at the grasp itself, which is the pilot failure the gate exists to prevent.' },
  7: { tone: 'bad', text: 'Functionally perfect and out of the workspace. Reachability multiplies its grip term by 0.1.' },
  8: { tone: 'bad', text: 'Mid-shaft. Holdable, and it occludes neither the part the plan needs nor the part it does not.' }
};

function setupExplorer() {
  var host = document.getElementById('ax-cands');
  if (!host) return;

  var state = { gate: true, fn: true, plan: true, memory: true, tau: 0.5 };

  var toggles = document.querySelectorAll('.ax-toggle[data-flag]');
  var tauInput = document.getElementById('ax-tau');
  var tauOut = document.getElementById('ax-tau-val');
  var verdict = document.getElementById('ax-verdict');
  var formula = document.getElementById('ax-formula');

  function grip(cand) { return cand.q * cand.r * cand.c; }

  function score(cand) {
    var value = grip(cand);
    if (state.fn) value *= cand.f;
    if (state.plan) value *= cand.x;
    if (state.memory) value *= cand.m;
    return value;
  }

  function render() {
    var grips = CANDIDATES.map(grip);
    var floor = state.gate ? state.tau * Math.max.apply(null, grips) : -1;

    var rows = CANDIDATES.map(function (cand) {
      var gated = grip(cand) < floor;
      return { cand: cand, gated: gated, grip: grip(cand), value: gated ? 0 : score(cand) };
    });

    var best = rows.reduce(function (a, b) { return b.value > a.value ? b : a; });
    var max = Math.max(best.value, 0.001);

    host.innerHTML = rows.map(function (row) {
      var winner = row === best && row.value > 0;
      var tag = '';
      if (winner) tag = '<span class="ax-cand-tag">executed</span>';
      else if (row.gated) tag = '<span class="ax-cand-tag is-gate">gated</span>';

      return '<div class="ax-cand' + (row.gated ? ' is-gated' : '') + (winner ? ' is-winner' : '') + '">' +
        '<span class="ax-cand-id">' + row.cand.id + '</span>' +
        '<span class="ax-cand-name">' + row.cand.part + tag +
          '<span>' + row.cand.pose + ' · g = ' + row.grip.toFixed(2) + '</span></span>' +
        '<span class="ax-cand-bar"><span class="ax-cand-fill" style="width:' +
          (row.gated ? 100 : (row.value / max) * 100).toFixed(1) + '%"></span></span>' +
        '<span class="ax-cand-val">' + (row.gated ? '0.00' : row.value.toFixed(2)) + '</span>' +
      '</div>';
    }).join('');

    var kept = rows.filter(function (row) { return !row.gated; }).length;
    var note = VERDICTS[best.cand.id];
    verdict.innerHTML =
      '<b>' + kept + ' of 8 candidates eligible</b> · executed: <b>' +
      best.cand.part.toLowerCase() + ', ' + best.cand.pose + '</b><br>' + note.text;

    if (formula) {
      formula.querySelectorAll('[data-term]').forEach(function (chip) {
        var term = chip.dataset.term;
        var on = term === 'g' ? true
          : term === 'f' ? state.fn
          : term === 'x' ? state.plan
          : state.memory;
        chip.classList.toggle('is-off', !on);
      });
      var gateChip = formula.querySelector('[data-gate]');
      if (gateChip) {
        gateChip.classList.toggle('is-off', !state.gate);
        gateChip.textContent = state.gate
          ? 'F = { k : gₖ ≥ ' + state.tau.toFixed(2) + ' · max g }'
          : 'no feasible set';
      }
    }
  }

  toggles.forEach(function (button) {
    button.addEventListener('click', function () {
      var flag = button.dataset.flag;
      state[flag] = !state[flag];
      button.classList.toggle('is-on', state[flag]);
      button.setAttribute('aria-pressed', String(state[flag]));
      if (tauInput) tauInput.disabled = !state.gate;
      render();
    });
  });

  if (tauInput) {
    tauInput.addEventListener('input', function () {
      state.tau = parseInt(tauInput.value, 10) / 100;
      if (tauOut) tauOut.textContent = state.tau.toFixed(2);
      render();
    });
  }

  render();
}

/* ------------------------------------------------------------------
   The L-ladder (paper Fig. 2a, table mw_ladder).
   Rates and paired deltas recomputed from
   outputs/sprint/l_ladder_decider.jsonl and mw_ladder_full.jsonl.
   ------------------------------------------------------------------ */
var LADDER = {
  libero: {
    label: 'LIBERO', n: 440, color: '#6A3FB5', marker: 'circle',
    rungs: ['L1', 'L2', 'L3', 'L4'],
    success: [[0.430, 0.384, 0.475], [0.539, 0.491, 0.586], [0.489, 0.441, 0.536], [0.416, 0.370, 0.461]],
    grasp: [[0.477], [0.623], [0.618], [0.530]],
    place: [[0.900], [0.865], [0.790], [0.785]],
    deltas: [
      { from: 0, to: 1, d: 0.109, lo: 0.052, hi: 0.166 },
      { from: 1, to: 2, d: -0.050, lo: -0.107, hi: 0.007 },
      { from: 2, to: 3, d: -0.073, lo: -0.132, hi: -0.016 }
    ]
  },
  metaworld: {
    label: 'Meta-World', n: 160, color: '#1F7A6E', marker: 'square',
    rungs: ['L1', 'L2', 'L3'],
    success: [[0.350, 0.275, 0.425], [0.431, 0.356, 0.506], [0.406, 0.331, 0.481]],
    grasp: [[0.619], [0.681], [0.625]],
    place: [[0.566], [0.633], [0.650]],
    deltas: [
      { from: 0, to: 1, d: 0.081, lo: 0.000, hi: 0.163 },
      { from: 1, to: 2, d: -0.025, lo: -0.113, hi: 0.062 }
    ]
  }
};

var RUNG_CAPTION = ['L1\nraw detector', 'L2\n+ function', 'L3\n+ plan', 'L4\n+ memory'];

function setupLadder() {
  var host = document.getElementById('ax-ladder');
  if (!host) return;

  var state = { metric: 'success' };
  var W = 660, H = 330, ML = 62, MR = 26, MT = 26, MB = 66;
  var tip = makeTooltip(host);

  function xAt(i) { return ML + (i / 3) * (W - ML - MR); }
  function yAt(v) { return MT + (1 - v) * (H - MT - MB); }

  function render() {
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
    svg.setAttribute('aria-label', 'L-ladder ' + state.metric + ' by rung for LIBERO and Meta-World');

    [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
      svg.appendChild(svgEl('line', {
        x1: ML, x2: W - MR, y1: yAt(v), y2: yAt(v),
        class: v === 0 ? 'ax-svg-axis' : 'ax-svg-grid'
      }));
      svg.appendChild(svgText(ML - 10, yAt(v) + 3.5, v.toFixed(2), 'ax-svg-tick', { 'text-anchor': 'end' }));
    });

    RUNG_CAPTION.forEach(function (caption, i) {
      caption.split('\n').forEach(function (line, j) {
        svg.appendChild(svgText(xAt(i), H - MB + 22 + j * 14, line,
          j === 0 ? 'ax-svg-label' : 'ax-svg-tick', { 'text-anchor': 'middle' }));
      });
    });

    var yLabel = svgText(0, 0, {
      success: 'end-to-end success',
      grasp: 'grasp rate',
      place: 'P(place | grasp)'
    }[state.metric], 'ax-svg-label', {
      transform: 'translate(16,' + (MT + (H - MT - MB) / 2) + ') rotate(-90)',
      'text-anchor': 'middle'
    });
    svg.appendChild(yLabel);

    Object.keys(LADDER).forEach(function (key) {
      var series = LADDER[key];
      var values = series[state.metric];
      var points = values.map(function (v, i) { return [xAt(i), yAt(v[0])]; });

      svg.appendChild(svgEl('polyline', {
        points: points.map(function (p) { return p.join(','); }).join(' '),
        fill: 'none', stroke: series.color, 'stroke-width': 2.1,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round'
      }));

      values.forEach(function (v, i) {
        if (v.length === 3) {
          svg.appendChild(svgEl('line', {
            x1: xAt(i), x2: xAt(i), y1: yAt(v[1]), y2: yAt(v[2]),
            stroke: series.color, 'stroke-width': 1.5, opacity: 0.7
          }));
          [v[1], v[2]].forEach(function (bound) {
            svg.appendChild(svgEl('line', {
              x1: xAt(i) - 4, x2: xAt(i) + 4, y1: yAt(bound), y2: yAt(bound),
              stroke: series.color, 'stroke-width': 1.5, opacity: 0.7
            }));
          });
        }

        var node = series.marker === 'square'
          ? svgEl('rect', { x: xAt(i) - 5, y: yAt(v[0]) - 5, width: 10, height: 10, rx: 2, fill: series.color })
          : svgEl('circle', { cx: xAt(i), cy: yAt(v[0]), r: 5.5, fill: series.color });
        node.setAttribute('class', 'ax-point');

        node.addEventListener('mousemove', function (event) {
          var ci = v.length === 3 ? '<br>95% CI [' + v[1].toFixed(3) + ', ' + v[2].toFixed(3) + ']' : '';
          tip.show(event, '<b>' + series.label + ' · ' + series.rungs[i] + '</b><br>' +
            v[0].toFixed(3) + ci + '<br>n = ' + series.n);
        });
        node.addEventListener('mouseleave', tip.hide);
        svg.appendChild(node);
      });

      if (state.metric === 'success') {
        series.deltas.forEach(function (delta) {
          if (delta.from !== 0) return;
          var y = yAt(values[delta.to][0]) + (key === 'libero' ? -20 : 30);
          svg.appendChild(svgText(xAt(delta.to) + 12, y,
            (delta.d >= 0 ? '+' : '') + delta.d.toFixed(3), 'ax-svg-label',
            { fill: series.color }));
          svg.appendChild(svgText(xAt(delta.to) + 12, y + 13,
            '[' + delta.lo.toFixed(3) + ', ' + delta.hi.toFixed(3) + ']', 'ax-svg-tick',
            { fill: series.color }));
        });
      }
    });

    var legendY = MT + 4;
    Object.keys(LADDER).forEach(function (key, i) {
      var series = LADDER[key];
      var x = W - MR - 168;
      svg.appendChild(svgEl('rect', {
        x: x, y: legendY + i * 17 - 7, width: 10, height: 10, rx: 2, fill: series.color
      }));
      svg.appendChild(svgText(x + 16, legendY + i * 17 + 2,
        series.label + '  (n = ' + series.n + '/rung)', 'ax-svg-tick'));
    });

    host.querySelectorAll('svg').forEach(function (old) { old.remove(); });
    host.appendChild(svg);
  }

  document.querySelectorAll('.ax-pill[data-metric]').forEach(function (pill) {
    pill.addEventListener('click', function () {
      state.metric = pill.dataset.metric;
      document.querySelectorAll('.ax-pill[data-metric]').forEach(function (p) {
        p.classList.toggle('is-active', p === pill);
      });
      render();
    });
  });

  render();
}

/* ------------------------------------------------------------------
   Grasp-confidence ROC (paper Fig. 2b), prospective held-out episodes.
   Recomputed from outputs/sprint/h3_calibration.jsonl.
   ------------------------------------------------------------------ */
var ROC = {
  n: 88, pos: 16,
  perception: [[0.0, 0.0], [0.0833, 0.0], [0.0833, 0.0625], [0.0972, 0.0625], [0.0972, 0.125], [0.1667, 0.125], [0.1667, 0.1875], [0.25, 0.1875], [0.25, 0.3125], [0.2778, 0.3125], [0.2778, 0.375], [0.2917, 0.375], [0.2917, 0.4375], [0.3056, 0.4375], [0.3056, 0.5], [0.3194, 0.5], [0.3194, 0.5625], [0.3472, 0.5625], [0.3472, 0.625], [0.3889, 0.625], [0.3889, 0.6875], [0.4722, 0.6875], [0.4722, 0.8125], [0.4861, 0.8125], [0.4861, 0.875], [0.5, 0.875], [0.5, 0.9375], [0.5278, 0.9375], [0.5278, 1.0], [1.0, 1.0]],
  gated: [[0.0, 0.0], [0.0417, 0.0], [0.0417, 0.0625], [0.0556, 0.0625], [0.0556, 0.125], [0.0972, 0.125], [0.0972, 0.25], [0.1111, 0.25], [0.1111, 0.3125], [0.125, 0.3125], [0.125, 0.375], [0.1389, 0.375], [0.1389, 0.4375], [0.1528, 0.4375], [0.1528, 0.5], [0.1667, 0.5], [0.1667, 0.5625], [0.2361, 0.5625], [0.2361, 0.6875], [0.25, 0.6875], [0.25, 0.75], [0.2639, 0.75], [0.2639, 0.8125], [0.2778, 0.8125], [0.2778, 0.875], [0.4028, 0.875], [0.4028, 0.9375], [0.4444, 0.9375], [0.4444, 1.0], [1.0, 1.0]]
};

var ROC_SERIES = [
  { key: 'perception', label: 'perception only (pre-registered)', auroc: 0.673, color: '#C62828', dash: '5 4' },
  { key: 'gated', label: '× executed-grasp reachability', auroc: 0.806, color: '#B45309', dash: '' }
];

function setupRoc() {
  var host = document.getElementById('ax-roc');
  if (!host) return;

  var W = 420, H = 400, ML = 54, MR = 18, MT = 18, MB = 76;
  var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
  svg.setAttribute('aria-label',
    'ROC curves: perception-only confidence AUROC 0.673, multiplied by reachability 0.806');

  function xAt(v) { return ML + v * (W - ML - MR); }
  function yAt(v) { return H - MB - v * (H - MT - MB); }

  [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
    svg.appendChild(svgEl('line', { x1: ML, x2: W - MR, y1: yAt(v), y2: yAt(v), class: 'ax-svg-grid' }));
    svg.appendChild(svgEl('line', { x1: xAt(v), x2: xAt(v), y1: MT, y2: H - MB, class: 'ax-svg-grid' }));
    svg.appendChild(svgText(ML - 8, yAt(v) + 3.5, v.toFixed(2), 'ax-svg-tick', { 'text-anchor': 'end' }));
    svg.appendChild(svgText(xAt(v), H - MB + 16, v.toFixed(2), 'ax-svg-tick', { 'text-anchor': 'middle' }));
  });

  svg.appendChild(svgEl('line', {
    x1: xAt(0), y1: yAt(0), x2: xAt(1), y2: yAt(1),
    stroke: '#C9CDD4', 'stroke-width': 1
  }));

  svg.appendChild(svgText(ML + (W - ML - MR) / 2, H - MB + 36, 'false positive rate', 'ax-svg-label',
    { 'text-anchor': 'middle' }));
  svg.appendChild(svgText(0, 0, 'true positive rate', 'ax-svg-label', {
    transform: 'translate(14,' + (MT + (H - MT - MB) / 2) + ') rotate(-90)',
    'text-anchor': 'middle'
  }));

  ROC_SERIES.forEach(function (series, i) {
    var path = ROC[series.key].map(function (p) { return xAt(p[0]) + ',' + yAt(p[1]); }).join(' ');
    var line = svgEl('polyline', {
      points: path, fill: 'none', stroke: series.color, 'stroke-width': 2.2,
      'stroke-linejoin': 'round'
    });
    if (series.dash) line.setAttribute('stroke-dasharray', series.dash);

    svg.appendChild(line);

    var y = H - 34 + i * 16;
    svg.appendChild(svgEl('line', {
      x1: ML, x2: ML + 20, y1: y - 4, y2: y - 4,
      stroke: series.color, 'stroke-width': 2.2,
      'stroke-dasharray': series.dash || 'none'
    }));
    svg.appendChild(svgText(ML + 27, y, series.label + '   AUROC ' + series.auroc.toFixed(3), 'ax-svg-tick'));
  });

  svg.appendChild(svgText(W - MR, MT + 12, 'pre-registered bar: AUROC ≥ 0.75', 'ax-svg-tick',
    { 'text-anchor': 'end', fill: '#8A8272' }));

  host.appendChild(svg);
}

/* ------------------------------------------------------------------
   Headroom diagnostic (paper Fig. 3).
   x = 1 - P(place | grasp) at L2.   y = paired L3 - L2 with 95% CI.
   Recomputed over the nine regimes with at least 10 paired episodes.
   ------------------------------------------------------------------ */
var HEADROOM = [
  { name: 'assembly',        src: 'mw',  n: 60,  h: 0.300, d: 0.233,  lo: 0.083,  hi: 0.383 },
  { name: 'peg-insert-side', src: 'mw',  n: 30,  h: 0.065, d: 0.067,  lo: 0.000,  hi: 0.167 },
  { name: 'sweep-into',      src: 'mw',  n: 20,  h: 0.500, d: 0.050,  lo: -0.250, hi: 0.350 },
  { name: 'LIBERO goal',     src: 'lib', n: 120, h: 0.493, d: 0.000,  lo: -0.083, hi: 0.083 },
  { name: 'LIBERO spatial',  src: 'lib', n: 320, h: 0.010, d: -0.069, lo: -0.138, hi: 0.000 },
  { name: 'bin-picking',     src: 'mw',  n: 20,  h: 0.700, d: -0.100, lo: -0.300, hi: 0.100 },
  { name: 'shelf-place',     src: 'mw',  n: 20,  h: 0.500, d: -0.100, lo: -0.300, hi: 0.100 },
  { name: 'basketball',      src: 'mw',  n: 20,  h: 0.000, d: -0.150, lo: -0.400, hi: 0.100 },
  { name: 'hammer',          src: 'mw',  n: 20,  h: 0.450, d: -0.250, lo: -0.550, hi: 0.050 }
];

function setupHeadroom() {
  var host = document.getElementById('ax-headroom');
  if (!host) return;

  var W = 620, H = 400, ML = 62, MR = 24, MT = 24, MB = 62;
  var X0 = -0.02, X1 = 0.80, Y0 = -0.62, Y1 = 0.46;
  var tip = makeTooltip(host);

  var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
  svg.setAttribute('aria-label',
    'Placement headroom against the detected plan-conditioning effect across nine regimes');

  function xAt(v) { return ML + ((v - X0) / (X1 - X0)) * (W - ML - MR); }
  function yAt(v) { return H - MB - ((v - Y0) / (Y1 - Y0)) * (H - MT - MB); }

  svg.appendChild(svgEl('rect', {
    x: xAt(X0), y: MT, width: xAt(0.10) - xAt(X0), height: H - MB - MT, fill: '#F2F3F5'
  }));
  svg.appendChild(svgText(xAt(0.04), MT + 20, 'no headroom', 'ax-svg-tick',
    { 'text-anchor': 'middle', fill: '#8A8272' }));
  svg.appendChild(svgText(xAt(0.04), MT + 33, 'to recover', 'ax-svg-tick',
    { 'text-anchor': 'middle', fill: '#8A8272' }));

  [-0.6, -0.4, -0.2, 0, 0.2, 0.4].forEach(function (v) {
    svg.appendChild(svgEl('line', {
      x1: ML, x2: W - MR, y1: yAt(v), y2: yAt(v),
      class: v === 0 ? 'ax-svg-axis' : 'ax-svg-grid'
    }));
    svg.appendChild(svgText(ML - 9, yAt(v) + 3.5, v.toFixed(1), 'ax-svg-tick', { 'text-anchor': 'end' }));
  });

  [0, 0.2, 0.4, 0.6, 0.8].forEach(function (v) {
    svg.appendChild(svgText(xAt(v), H - MB + 17, v.toFixed(1), 'ax-svg-tick', { 'text-anchor': 'middle' }));
  });

  svg.appendChild(svgText(ML + (W - ML - MR) / 2, H - MB + 38,
    'placement headroom at L2   1 − P(place | grasp)', 'ax-svg-label', { 'text-anchor': 'middle' }));
  svg.appendChild(svgText(0, 0, 'detected effect   L3 − L2', 'ax-svg-label', {
    transform: 'translate(16,' + (MT + (H - MT - MB) / 2) + ') rotate(-90)',
    'text-anchor': 'middle'
  }));

  HEADROOM.forEach(function (point) {
    var color = point.src === 'lib' ? '#6A3FB5' : '#1F7A6E';
    var detected = point.lo > 0;

    svg.appendChild(svgEl('line', {
      x1: xAt(point.h), x2: xAt(point.h), y1: yAt(point.lo), y2: yAt(point.hi),
      stroke: color, 'stroke-width': 1.4, opacity: detected ? 1 : 0.5
    }));
    [point.lo, point.hi].forEach(function (bound) {
      svg.appendChild(svgEl('line', {
        x1: xAt(point.h) - 3.5, x2: xAt(point.h) + 3.5, y1: yAt(bound), y2: yAt(bound),
        stroke: color, 'stroke-width': 1.4, opacity: detected ? 1 : 0.5
      }));
    });

    var node = point.src === 'lib'
      ? svgEl('circle', { cx: xAt(point.h), cy: yAt(point.d), r: detected ? 7 : 5 })
      : svgEl('rect', {
          x: xAt(point.h) - (detected ? 6 : 4.5), y: yAt(point.d) - (detected ? 6 : 4.5),
          width: detected ? 12 : 9, height: detected ? 12 : 9, rx: 2
        });
    node.setAttribute('fill', detected ? color : '#ffffff');
    node.setAttribute('stroke', color);
    node.setAttribute('stroke-width', '1.6');
    node.setAttribute('class', 'ax-point');
    node.setAttribute('opacity', detected ? 1 : 0.85);

    node.addEventListener('mousemove', function (event) {
      tip.show(event, '<b>' + point.name + '</b><br>headroom ' + point.h.toFixed(3) +
        '<br>L3 − L2 ' + (point.d >= 0 ? '+' : '') + point.d.toFixed(3) +
        ' [' + point.lo.toFixed(3) + ', ' + point.hi.toFixed(3) + ']<br>' +
        point.n + ' paired episodes' + (detected ? '<br>interval excludes zero' : ''));
    });
    node.addEventListener('mouseleave', tip.hide);
    svg.appendChild(node);

    if (point.name === 'assembly' || point.name === 'hammer' || point.name === 'LIBERO spatial') {
      svg.appendChild(svgText(xAt(point.h) + 12, yAt(point.d) + 4, point.name, 'ax-svg-label',
        { fill: color }));
    }
  });

  host.appendChild(svg);
}

/* ------------------------------------------------------------------
   Meta-World MT50 task grid.
   189 episodes over 38 tasks (37 complete at 5 episodes; push-back ran 4).
   Recomputed from outputs/sprint/mt50_affordx_valid189.jsonl, joined to
   the tier table in scripts/mw50_tasks.py.
   ------------------------------------------------------------------ */
var MT50 = [
  { t: 'assembly', tier: 'hard', s: 2, n: 5, grasp: 1, rev: 0 },
  { t: 'basketball', tier: 'medium', s: 2, n: 5, grasp: 1, rev: 0 },
  { t: 'bin-picking', tier: 'medium', s: 0, n: 5, grasp: 1, rev: 0 },
  { t: 'box-close', tier: 'medium', s: 4, n: 5, grasp: 1, rev: 0 },
  { t: 'button-press', tier: 'easy', s: 4, n: 5, grasp: 0, rev: 0 },
  { t: 'button-press-topdown', tier: 'easy', s: 5, n: 5, grasp: 0, rev: 0 },
  { t: 'button-press-topdown-wall', tier: 'easy', s: 4, n: 5, grasp: 0, rev: 0 },
  { t: 'button-press-wall', tier: 'easy', s: 5, n: 5, grasp: 0, rev: 0 },
  { t: 'coffee-button', tier: 'easy', s: 4, n: 5, grasp: 0, rev: 0 },
  { t: 'coffee-pull', tier: 'medium', s: 3, n: 5, grasp: 1, rev: 0 },
  { t: 'coffee-push', tier: 'medium', s: 2, n: 5, grasp: 1, rev: 0 },
  { t: 'dial-turn', tier: 'easy', s: 0, n: 5, grasp: 0, rev: 1 },
  { t: 'disassemble', tier: 'very hard', s: 4, n: 5, grasp: 1, rev: 0 },
  { t: 'door-close', tier: 'easy', s: 3, n: 5, grasp: 0, rev: 0 },
  { t: 'door-lock', tier: 'easy', s: 0, n: 5, grasp: 0, rev: 1 },
  { t: 'door-open', tier: 'easy', s: 0, n: 5, grasp: 0, rev: 1 },
  { t: 'door-unlock', tier: 'easy', s: 0, n: 5, grasp: 0, rev: 1 },
  { t: 'drawer-close', tier: 'easy', s: 5, n: 5, grasp: 0, rev: 0 },
  { t: 'drawer-open', tier: 'easy', s: 5, n: 5, grasp: 0, rev: 0 },
  { t: 'faucet-close', tier: 'easy', s: 0, n: 5, grasp: 0, rev: 1 },
  { t: 'faucet-open', tier: 'easy', s: 0, n: 5, grasp: 0, rev: 1 },
  { t: 'hammer', tier: 'medium', s: 1, n: 5, grasp: 1, rev: 0 },
  { t: 'hand-insert', tier: 'hard', s: 2, n: 5, grasp: 1, rev: 0 },
  { t: 'handle-press', tier: 'easy', s: 5, n: 5, grasp: 0, rev: 0 },
  { t: 'handle-press-side', tier: 'easy', s: 5, n: 5, grasp: 0, rev: 0 },
  { t: 'handle-pull', tier: 'easy', s: 0, n: 5, grasp: 0, rev: 1 },
  { t: 'handle-pull-side', tier: 'easy', s: 0, n: 5, grasp: 0, rev: 1 },
  { t: 'lever-pull', tier: 'easy', s: 0, n: 5, grasp: 0, rev: 1 },
  { t: 'peg-insert-side', tier: 'medium', s: 4, n: 5, grasp: 1, rev: 0 },
  { t: 'peg-unplug-side', tier: 'easy', s: 0, n: 5, grasp: 1, rev: 0 },
  { t: 'pick-out-of-hole', tier: 'hard', s: 4, n: 5, grasp: 1, rev: 0 },
  { t: 'pick-place', tier: 'hard', s: 0, n: 5, grasp: 1, rev: 0 },
  { t: 'pick-place-wall', tier: 'very hard', s: 1, n: 5, grasp: 1, rev: 0 },
  { t: 'plate-slide', tier: 'easy', s: 5, n: 5, grasp: 0, rev: 0 },
  { t: 'plate-slide-back', tier: 'easy', s: 0, n: 5, grasp: 0, rev: 0 },
  { t: 'plate-slide-back-side', tier: 'easy', s: 5, n: 5, grasp: 0, rev: 0 },
  { t: 'plate-slide-side', tier: 'easy', s: 4, n: 5, grasp: 0, rev: 0 },
  { t: 'push-back', tier: 'hard', s: 0, n: 4, grasp: 1, rev: 0 }
];

function setupTaskGrid() {
  var host = document.getElementById('ax-tasks');
  if (!host) return;

  var state = { revolute: true, nongrasp: true, tier: 'all' };

  function keep(task) {
    if (!state.revolute && task.rev) return false;
    if (!state.nongrasp && !task.grasp) return false;
    if (state.tier !== 'all' && task.tier !== state.tier) return false;
    return true;
  }

  host.innerHTML = MT50.map(function (task) {
    var dots = '';
    for (var i = 0; i < task.n; i++) {
      dots += '<span class="ax-dot' + (i < task.s ? ' is-hit' : '') + '"></span>';
    }
    return '<div class="ax-task" data-task="' + task.t + '" data-rev="' + task.rev +
      '" data-grasp="' + task.grasp + '" title="' + task.t + ' · ' + task.tier +
      ' · ' + task.s + '/' + task.n + '">' +
      '<div class="ax-task-name">' + task.t + '</div>' +
      '<div class="ax-task-meta"><span class="ax-task-dots">' + dots + '</span><span>' +
      task.s + '/' + task.n + '</span></div></div>';
  }).join('');

  var cards = {};
  host.querySelectorAll('.ax-task').forEach(function (node) { cards[node.dataset.task] = node; });

  var out = {
    rate: document.getElementById('ax-mt-rate'),
    tasks: document.getElementById('ax-mt-tasks'),
    eps: document.getElementById('ax-mt-eps')
  };

  function render() {
    var kept = MT50.filter(keep);
    var eps = kept.reduce(function (a, t) { return a + t.n; }, 0);
    var succ = kept.reduce(function (a, t) { return a + t.s; }, 0);

    MT50.forEach(function (task) { cards[task.t].classList.toggle('is-dim', !keep(task)); });

    out.rate.textContent = eps ? (succ / eps).toFixed(3) : '–';
    out.tasks.textContent = kept.length;
    out.eps.textContent = succ + ' / ' + eps;
  }

  document.querySelectorAll('.ax-toggle[data-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      var flag = button.dataset.filter;
      state[flag] = !state[flag];
      button.classList.toggle('is-on', state[flag]);
      button.setAttribute('aria-pressed', String(state[flag]));
      render();
    });
  });

  document.querySelectorAll('.ax-pill[data-tier]').forEach(function (pill) {
    pill.addEventListener('click', function () {
      state.tier = pill.dataset.tier;
      document.querySelectorAll('.ax-pill[data-tier]').forEach(function (p) {
        p.classList.toggle('is-active', p === pill);
      });
      render();
    });
  });

  render();
}

/* ------------------------------------------------------------------
   Grow-on-scroll bars
   ------------------------------------------------------------------ */
function setupGrowables() {
  document.querySelectorAll('.ai-ladder').forEach(function (ladder) {
    onFirstView(ladder, function () {
      ladder.querySelectorAll('.ai-rung').forEach(function (rung, i) {
        setTimeout(function () { rung.classList.add('is-grown'); }, i * 70);
      });
    });
  });

  document.querySelectorAll('.ai-chart').forEach(function (chart) {
    onFirstView(chart, function () {
      chart.querySelectorAll('.ai-col').forEach(function (col) { col.classList.add('is-grown'); });
    });
  });
}

/* ------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', function () {
  setupNav();
  setupCounters();
  setupTabs();
  setupLightbox();
  setupStages();
  setupExplorer();
  setupLadder();
  setupRoc();
  setupHeadroom();
  setupTaskGrid();
  setupGrowables();
});
