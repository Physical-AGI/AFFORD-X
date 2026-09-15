/* ------------------------------------------------------------------
   AFFORD-X project page.

   Every measured value comes from static/js/affordx_data.js (window.AFFORDX),
   which AFFORD-X/scripts/figures/export_project_page.py writes from finalized
   run directories. Nothing numeric is typed in this file.
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

var SVGNS = 'http://www.w3.org/2000/svg';

function svgEl(name, attrs) {
  var node = document.createElementNS(SVGNS, name);
  Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
  return node;
}

function svgText(x, y, text, cls, extra) {
  var node = svgEl('text', Object.assign({ x: x, y: y, class: cls || 'ax-svg-tick' }, extra || {}));
  node.textContent = text;
  return node;
}

function makeTooltip(host) {
  var tip = document.createElement('div');
  tip.className = 'ax-tip';
  host.appendChild(tip);
  return {
    show: function (event, html) {
      tip.innerHTML = html;
      tip.classList.add('is-on');
      var box = host.getBoundingClientRect();
      tip.style.left = Math.min(Math.max(event.clientX - box.left + 14, 4), box.width - tip.offsetWidth - 4) + 'px';
      tip.style.top = Math.max(event.clientY - box.top - tip.offsetHeight - 12, 4) + 'px';
    },
    hide: function () { tip.classList.remove('is-on'); }
  };
}

function signed(v, digits) {
  return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(digits);
}

/* ------------------------------------------------------------------
   Sticky nav, counters, tabs, lightbox
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
  var sections = anchors.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);

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

function setupCounters() {
  var counters = document.querySelectorAll('[data-count-to]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render(el, value) {
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    el.textContent = (el.dataset.prefix || '') + value.toFixed(decimals) + (el.dataset.suffix || '');
  }

  counters.forEach(function (el) {
    var target = parseFloat(el.dataset.countTo);
    if (reduce || !('IntersectionObserver' in window)) { render(el, target); return; }
    onFirstView(el, function () {
      var start = null;
      function step(timestamp) {
        if (start === null) start = timestamp;
        var p = Math.min((timestamp - start) / 1100, 1);
        render(el, target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }, 0.4);
  });
}

function setupTabs() {
  var tabs = document.querySelectorAll('.ai-tab[data-tab]');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('.ai-tab-panel').forEach(function (panel) {
        panel.classList.toggle('is-active', panel.dataset.panel === tab.dataset.tab);
      });
    });
  });
}

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
  lightbox.addEventListener('click', function (event) { if (event.target === lightbox) close(); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) close();
  });
}

/* ------------------------------------------------------------------
   Pipeline walkthrough
   ------------------------------------------------------------------ */
var STAGES = {
  propose: {
    eyebrow: 'Component B',
    title: 'The typed intent',
    lead: 'A typed intent names what to interact with; every reported run takes it from the task definition.',
    body: 'The intent names the target, the interaction, the functional region, plan constraints and the next ' +
      'action. In the reported runs the task definition supplies it and a category prior names the functional ' +
      'region. A frozen language model can write the same intent from the instruction: a strict parser accepts ' +
      'exactly one well-formed object and never repairs it, and the same backbone serves as a baseline that picks a ' +
      'candidate directly. That proposer is evaluated in its own run below.',
    spec: [['Reported source', 'task definition'], ['Functional region', 'category prior'], ['Proposer (own run)', 'gemini-3.8-flash'], ['Parser repairs', 'none']]
  },
  candidates: {
    eyebrow: 'Component A · fixed',
    title: 'Candidate interactions',
    lead: 'K top-down grasp candidates, generated once per scene and shared by every method.',
    body: 'Candidate sets are content-hashed, so a comparison between methods is a comparison of selections from ' +
      'the same set. In every reported run candidates are sampled on the object’s simulator geometry with a declared ' +
      'stability score; the detector path (SAM3 with a grasp detector) would replace this and is not used in any reported run.',
    spec: [['Meta-World K', 'up to 16'], ['LIBERO-PRO K', 'up to 12'], ['Candidate source', 'simulator geometry'], ['Shared across methods', 'yes, hashed']]
  },
  ground: {
    eyebrow: 'Component D',
    title: 'Ground the named parts',
    lead: 'The named region becomes part points that score every candidate.',
    body: 'In every reported run the points come from a geometric partition of the object’s simulator geometry. ' +
      'The SAM3 path renders one RGB-D frame per scene, segments the named regions by text prompt on a GPU node, ' +
      'erodes each mask by two pixels and lifts it through depth; a region SAM3 does not detect contributes no ' +
      'points and scores every candidate neutrally. That path is evaluated in the earlier 11-task Meta-World run, with ' +
      'mask quality scored against the simulator’s own part labels.',
    spec: [['Reported source', 'geometric part partition'], ['SAM3 path', 'earlier 11-task Meta-World run'], ['SAM3 confidence threshold', '0.3'], ['Mask erosion', '2 px']]
  },
  select: {
    eyebrow: 'Component F · ours',
    title: 'Gate, then rank',
    lead: 'Feasibility forms the eligible set. Function, task and memory rank only inside it.',
    body: 'The gate keeps candidates with reach · approach · collision ≥ 0.5 and abstains when none ' +
      'passes; the survivors are ranked by the product of their terms. Ablations replace the gate, the ' +
      'combination rule or a term, always on identical term arrays, and weights and the threshold were fixed ' +
      'before any evaluation run.',
    spec: [['Gate', 'r · a · c ≥ 0.5'], ['Combination', 'product'], ['Trainable parameters', '0'], ['Ladder', 'L0 to L4, 2 × 2 each']]
  },
  execute: {
    eyebrow: 'Component G · fixed',
    title: 'Execute and record',
    lead: 'A scripted executor carries out the selection; the benchmark decides success.',
    body: 'Meta-World uses a mocap-driven 4-DoF Sawyer executor and LIBERO-PRO an operational-space Franka ' +
      'executor, both identical for every method. Success is the benchmark’s own check, and rollout videos ' +
      'of the selected candidates are recorded while they execute, each checked against the selection.',
    spec: [['Meta-World horizon', '500 steps'], ['LIBERO-PRO horizon', '600 steps'], ['Success check', 'benchmark native'], ['Videos', 'recorded during evaluation']]
  }
};

function setupStages() {
  var buttons = document.querySelectorAll('.ai-stage');
  var detail = document.getElementById('ai-loop-detail');
  if (!buttons.length || !detail) return;
  var el = {
    eyebrow: detail.querySelector('.ai-loop-eyebrow'), title: detail.querySelector('h3'),
    lead: detail.querySelector('.ai-loop-lead'), body: detail.querySelector('.ai-loop-body'),
    spec: detail.querySelector('.ai-loop-spec')
  };
  var data = window.AFFORDX;
  if (data) {
    var hammer = data.sam3_quality.filter(function (r) { return r.task === 'hammer-v3' && r.region === 'handle'; })[0];
    if (hammer) STAGES.ground.spec[2][1] = hammer.iou_mean.toFixed(2);
  }

  function show(key, button) {
    var stage = STAGES[key];
    if (!stage) return;
    buttons.forEach(function (b) {
      var active = b === button;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    });
    detail.style.setProperty('--stage-c', button.style.getPropertyValue('--stage-c'));
    el.eyebrow.textContent = stage.eyebrow;
    el.title.textContent = stage.title;
    el.lead.textContent = stage.lead;
    el.body.textContent = stage.body;
    el.spec.innerHTML = stage.spec.map(function (pair) {
      return '<div><span class="ai-spec-label">' + pair[0] + '</span><span class="ai-spec-val">' + pair[1] + '</span></div>';
    }).join('');
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () { show(button.dataset.stage, button); });
  });
  show('propose', buttons[0]);
}

/* ------------------------------------------------------------------
   Replay explorer: logged candidates, precomputed selections
   ------------------------------------------------------------------ */
var PART_COLORS = { handle: '#E69F00', head: '#56B4E9' };

function setupExplorer() {
  var data = window.AFFORDX;
  var host = document.getElementById('ax-cands');
  if (!host || !data) return;
  var ex = data.explorer;
  var state = { part: 'sam3', combine: 'product', gate: true, fn: true, task: true };
  var scene = document.getElementById('ax-scene');
  var image = document.getElementById('ax-scene-img');
  var note = document.getElementById('ax-scene-note');
  var verdict = document.getElementById('ax-verdict');

  var svg = svgEl('svg', { viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  scene.appendChild(svg);

  function key() {
    return [state.part, state.gate ? 'on' : 'off', state.combine, state.fn ? 1 : 0, state.task ? 1 : 0].join('|');
  }

  function render() {
    var sel = ex.selections[key()];
    var chosen = sel.index;
    image.src = state.part === 'sam3' && state.fn ? 'static/images/explorer_scene_masks.png' : 'static/images/explorer_scene.png';

    svg.innerHTML = '';
    ex.candidates.forEach(function (c) {
      var isSel = c.id === chosen;
      if (isSel) svg.appendChild(svgEl('circle', { cx: c.u * 100, cy: c.v * 100, r: 3.1, fill: 'none', stroke: '#111', 'stroke-width': 0.7, 'vector-effect': 'non-scaling-stroke' }));
      svg.appendChild(svgEl('circle', {
        cx: c.u * 100, cy: c.v * 100, r: isSel ? 1.9 : 1.3, fill: PART_COLORS[c.part] || '#fff',
        stroke: '#111', 'stroke-width': 0.35, opacity: sel.gated[c.id] ? 0.35 : 1
      }));
    });
    note.textContent = ex.instruction + ' Orange: handle candidates. Blue: head candidates.';

    host.innerHTML = ex.candidates.map(function (c) {
      var isSel = c.id === chosen;
      var gated = sel.gated[c.id];
      var tag = isSel ? '<span class="ax-cand-tag">executed</span>' : (gated ? '<span class="ax-cand-tag is-gate">gated</span>' : '');
      var outcome = '<span class="ax-cand-out ' + (c.success ? 'is-success' : 'is-fail') + '">' +
        (c.success ? '✓' : '✗') + '</span>';
      return '<div class="ax-cand' + (gated ? ' is-gated' : '') + (isSel ? ' is-winner' : '') + '">' +
        '<span class="ax-cand-id">' + c.id + '</span>' +
        '<span class="ax-cand-name">' + c.part + tag + '<span>r·a·c ' +
          (c.terms.reachable * c.terms.approach * c.terms.collision).toFixed(2) + ' · f ' +
          (state.part === 'sam3' ? c.terms.functional : c.terms.functional_geometry).toFixed(2) +
          ' · t ' + c.terms.task.toFixed(2) + ' · s ' + c.terms.stability.toFixed(2) + '</span></span>' +
        '<span class="ax-cand-bar"><span class="ax-cand-fill" style="width:' + (sel.scores[c.id] * 100).toFixed(1) + '%"></span></span>' +
        '<span class="ax-cand-val">' + outcome + '</span></div>';
    }).join('');

    if (chosen === null || chosen === undefined) {
      verdict.innerHTML = '<b>No candidate passes the gate.</b> The rule abstains.';
      return;
    }
    var c = ex.candidates[chosen];
    verdict.innerHTML = 'Executed: <b>candidate ' + chosen + ', ' + c.part + '</b> &middot; simulator outcome: <b class="' +
      (c.success ? 'ax-good' : 'ax-bad') + '">' + (c.success ? 'success' : 'failure') + '</b><br>' +
      ex.n_success + ' of ' + ex.candidates.length + ' candidates succeed in this scene. Stability ranking (L0) executes candidate ' +
      ex.l0_index + ', a ' + ex.candidates[ex.l0_index].part + ' grasp that ' +
      (ex.candidates[ex.l0_index].success ? 'succeeds.' : 'fails.');
  }

  document.querySelectorAll('.ax-pill[data-part]').forEach(function (pill) {
    pill.addEventListener('click', function () {
      state.part = pill.dataset.part;
      document.querySelectorAll('.ax-pill[data-part]').forEach(function (p) { p.classList.toggle('is-active', p === pill); });
      render();
    });
  });
  document.querySelectorAll('.ax-pill[data-combine]').forEach(function (pill) {
    pill.addEventListener('click', function () {
      state.combine = pill.dataset.combine;
      document.querySelectorAll('.ax-pill[data-combine]').forEach(function (p) { p.classList.toggle('is-active', p === pill); });
      render();
    });
  });
  document.querySelectorAll('.ax-toggle[data-flag]').forEach(function (button) {
    button.addEventListener('click', function () {
      var flag = button.dataset.flag;
      state[flag] = !state[flag];
      button.classList.toggle('is-on', state[flag]);
      button.setAttribute('aria-pressed', String(state[flag]));
      render();
    });
  });
  render();
}

/* ------------------------------------------------------------------
   Success-rate charts with Wilson intervals
   ------------------------------------------------------------------ */
var HIGHLIGHT = {
  L3_feasibility_first: '#8E6BCF', L4_feasibility_first: '#6A3FB5', B4_intent_full: '#6A3FB5',
  random: '#37404D', oracle: '#C9CDD4',
  L2_feasibility_first_geomparts: '#1F7A6E', L3_feasibility_first_geomparts: '#1F7A6E'
};

function drawRates(host, block) {
  var rows = block.methods;
  var W = 680, ML = 190, MR = 70, MT = 14, RH = 27, MB = 34;
  var H = MT + rows.length * RH + MB;
  var tip = host._tip || (host._tip = makeTooltip(host));
  function xAt(v) { return ML + v * (W - ML - MR); }

  var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
  svg.setAttribute('aria-label', 'Success rate by method with 95% intervals, ' + block.experiment);
  [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
    svg.appendChild(svgEl('line', { x1: xAt(v), x2: xAt(v), y1: MT - 4, y2: H - MB + 4, class: v === 0 ? 'ax-svg-axis' : 'ax-svg-grid' }));
    svg.appendChild(svgText(xAt(v), H - MB + 20, v.toFixed(2), 'ax-svg-tick', { 'text-anchor': 'middle' }));
  });
  rows.forEach(function (row, i) {
    var y = MT + i * RH;
    var color = HIGHLIGHT[row.key] || '#9AA3B2';
    svg.appendChild(svgText(ML - 12, y + RH / 2 + 4, row.label, row.key in HIGHLIGHT && row.key !== 'oracle' ? 'ax-svg-label' : 'ax-svg-tick', { 'text-anchor': 'end' }));
    var bar = svgEl('rect', { x: xAt(0), y: y + 5, width: Math.max(xAt(row.rate) - xAt(0), 1.5), height: RH - 10, rx: 3, fill: color, class: 'ax-point' });
    svg.appendChild(bar);
    svg.appendChild(svgEl('line', { x1: xAt(row.lo), x2: xAt(row.hi), y1: y + RH / 2, y2: y + RH / 2, stroke: '#1f2430', 'stroke-width': 1.3 }));
    [row.lo, row.hi].forEach(function (b) {
      svg.appendChild(svgEl('line', { x1: xAt(b), x2: xAt(b), y1: y + RH / 2 - 4, y2: y + RH / 2 + 4, stroke: '#1f2430', 'stroke-width': 1.3 }));
    });
    svg.appendChild(svgText(W - MR + 10, y + RH / 2 + 4, row.rate.toFixed(2), 'ax-svg-label'));
    bar.addEventListener('mousemove', function (event) {
      tip.show(event, '<b>' + row.label + '</b><br>' + row.rate.toFixed(3) + '<br>95% CI [' + row.lo.toFixed(3) + ', ' + row.hi.toFixed(3) + ']<br>n = ' + row.n);
    });
    bar.addEventListener('mouseleave', tip.hide);
  });
  svg.appendChild(svgText(ML + (W - ML - MR) / 2, H - 4, 'task success', 'ax-svg-label', { 'text-anchor': 'middle' }));
  host.querySelectorAll('svg').forEach(function (old) { old.remove(); });
  host.appendChild(svg);
}

function drawPairs(host, block, wanted) {
  if (!host) return;
  host.innerHTML = wanted.map(function (w) {
    var p = block.paired[w[0]];
    if (!p) return '';
    var excludes = p.lo > 0 || p.hi < 0;
    return '<div class="ax-pair' + (excludes ? ' is-clear' : '') + '"><span>' + w[1] + '</span><b>' + signed(p.d, 3) +
      '</b><em>[' + signed(p.lo, 3) + ', ' + signed(p.hi, 3) + ']</em></div>';
  }).join('') + '<div class="ax-go">' + block.go_no_go.map(function (g) {
    return '<span class="ax-go-chip ' + (g.verdict === 'GO' ? 'is-go' : 'is-nogo') + '" title="' + (g.meaning || '') + '">' +
      g.id.replace(/_/g, ' ') + ': ' + g.verdict + '</span>';
  }).join('') + '</div>';
}

function setupRateSection(hostId, pairsId, attr, blocks, wanted) {
  var host = document.getElementById(hostId);
  if (!host || !blocks) return;
  var pairs = document.getElementById(pairsId);
  function show(name) {
    drawRates(host, blocks[name]);
    drawPairs(pairs, blocks[name], wanted);
  }
  var pills = document.querySelectorAll('.ax-pill[data-' + attr + ']');
  pills.forEach(function (pill) {
    pill.setAttribute('aria-pressed', String(pill.classList.contains('is-active')));
    pill.addEventListener('click', function () {
      if (!blocks[pill.dataset[attr]]) return;
      pills.forEach(function (p) {
        p.classList.toggle('is-active', p === pill);
        p.setAttribute('aria-pressed', String(p === pill));
      });
      show(pill.dataset[attr]);
    });
  });
  show(pills.length ? pills[0].dataset[attr] : Object.keys(blocks)[0]);
}

function rateOf(block, key) {
  var row = block.methods.filter(function (m) { return m.key === key; })[0];
  return row ? row.rate.toFixed(2) : '–';
}

function renderLiberoTable(data) {
  var body = document.getElementById('ax-libero-table');
  if (!body || !data.libero_pro) return;
  var cols = ['goal_pos', 'goal_task', 'spatial_pos', 'spatial_task', 'object_pos', 'object_task'];
  var rows = [['L4_feasibility_first', 'AFFORD-X, full layer'], ['random', 'random choice'], ['oracle', 'best-candidate ceiling']];
  var html = rows.map(function (r) {
    return '<tr' + (r[0] === 'L4_feasibility_first' ? ' class="ax-row-ours"' : '') + '><th scope="row" class="ai-th-text">' + r[1] + '</th>' +
      cols.map(function (c) { return '<td>' + rateOf(data.libero_pro[c], r[0]) + '</td>'; }).join('') + '</tr>';
  }).join('');
  html += '<tr><th scope="row" class="ai-th-text">gate left no candidate (scenes)</th>' + cols.map(function (c) {
    return '<td>' + data.libero_pro[c].abstained + ' / ' + data.libero_pro[c].n_scenes + '</td>';
  }).join('') + '</tr>';
  html += '<tr><th scope="row" class="ai-th-text">tasks covered</th>' + cols.map(function (c) {
    return '<td>' + data.libero_pro[c].tasks_covered + ' / ' + data.libero_pro[c].tasks_total + '</td>';
  }).join('') + '</tr>';
  body.innerHTML = html;
  var integrity = document.getElementById('ax-libero-integrity');
  if (integrity && data.libero_pro_integrity) {
    var g = data.libero_pro_integrity;
    integrity.textContent = g.n_outcome_mismatch + ' of ' + g.n_videos.toLocaleString('en-US') +
      ' recorded rollouts disagree with their unrecorded simulator outcome, and ' + g.determinism_inexact + ' of ' +
      g.determinism_checks + ' rerun checks differ.';
  }
}

function renderTierTable(data) {
  var body = document.getElementById('ax-mt50-table');
  if (!body || !data.metaworld || !data.metaworld.mt50) return;
  var mt = data.metaworld.mt50;
  var tiers = ['easy', 'medium', 'hard', 'very_hard', 'overall'];
  var rows = [['L4_feasibility_first', 'AFFORD-X, full layer'], ['L0_stability', 'L0 stability'], ['random', 'random choice'],
    ['oracle', 'best-candidate ceiling']];
  body.innerHTML = rows.map(function (r) {
    return '<tr' + (r[0] === 'L4_feasibility_first' ? ' class="ax-row-ours"' : '') + '><th scope="row" class="ai-th-text">' + r[1] + '</th>' +
      tiers.map(function (t) { return '<td>' + mt.by_tier[r[0]][t].rate.toFixed(2) + '</td>'; }).join('') + '</tr>';
  }).join('');
  var head = document.getElementById('ax-mt50-head');
  if (head) {
    var names = { easy: 'Easy', medium: 'Medium', hard: 'Hard', very_hard: 'Very hard', overall: 'All' };
    head.innerHTML = '<th class="ai-th-text" scope="col">Method</th>' + tiers.map(function (t) {
      return '<th scope="col">' + names[t] + ' (' + mt.by_tier.oracle[t].n_tasks + ')</th>';
    }).join('');
  }
}

function setupResults() {
  var data = window.AFFORDX;
  if (!data) return;
  setupRateSection('ax-libero', 'ax-libero-pairs', 'libero', data.libero_pro, [
    ['L3_feasibility_first|random|success', 'feasibility-first + task (L3) minus random'],
    ['L4_feasibility_first|L3_feasibility_first|success', 'memory term: L4 minus L3'],
    ['L1_feasibility_first|L0_stability|success', 'feasibility gate: L1 feasibility-first minus L0 stability'],
    ['L3_feasibility_first|L1_feasibility_first|success', 'task term: L3 minus L1 feasibility-first']
  ]);
  setupRateSection('ax-mw', 'ax-mw-pairs', 'mw', data.metaworld, [
    ['L3_feasibility_first|random|success', 'feasibility-first + task (L3) minus random'],
    ['L4_feasibility_first|L3_feasibility_first|success', 'memory term: L4 minus L3'],
    ['L3_feasibility_first|L0_stability|success', 'L3 feasibility-first minus L0 stability']
  ]);
  renderLiberoTable(data);
  renderTierTable(data);
  setupRateSection('ax-proposer', 'ax-proposer-pairs', 'none', { arms: data.proposer }, [
    ['B4_intent_full|B1_proposer_direct_choice|success', 'B4 intent, all terms, minus B1 direct choice'],
    ['B1_proposer_direct_choice|random|success', 'B1 direct choice minus random']
  ]);

  var table = document.getElementById('ax-sam3-table');
  if (table) {
    var names = { 'hammer-v3|handle': 'hammer handle', 'hammer-v3|head': 'hammer head', 'assembly-v3|handle': 'wrench handle (assembly)',
      'disassemble-v3|handle': 'wrench handle (disassemble)', 'assembly-v3|ring': 'wrench ring (assembly)', 'push-wall-v3|object': 'push-wall cylinder',
      'pick-place-v3|object': 'pick-place cylinder' };
    table.innerHTML = data.sam3_quality.filter(function (r) { return names[r.task + '|' + r.region]; }).map(function (r) {
      return '<tr><th scope="row" class="ai-th-text">' + names[r.task + '|' + r.region] + '</th><td>' +
        (r.detection_rate * 100).toFixed(0) + '%</td><td>' + r.iou_mean.toFixed(2) + '</td></tr>';
    }).join('');
  }
}

/* ------------------------------------------------------------------
   Rollout gallery, video handling, keyboard support, failure isolation
   ------------------------------------------------------------------ */
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function playQuietly(video) {
  var promise = video.play();
  if (promise && promise.catch) promise.catch(function () { /* autoplay can be refused; controls stay available */ });
}

function showVideoFallback(video) {
  var holder = video.closest('figure') || video.parentNode;
  if (!holder || holder.querySelector('.ax-video-fallback:not([hidden])')) return;
  var src = video.currentSrc || video.getAttribute('src') || '';
  var note = document.createElement('p');
  note.className = 'ax-video-fallback';
  note.innerHTML = 'This rollout could not be played in your browser. ' +
    (src ? '<a href="' + escapeHtml(src) + '">Download the MP4</a>.' : '');
  holder.insertBefore(note, video.nextSibling);
}

function setupVideos() {
  var videos = Array.prototype.slice.call(document.querySelectorAll('video'));
  if (!videos.length) return;
  var info = (window.AFFORDX && window.AFFORDX.videos) || {};
  var reduce = prefersReducedMotion();
  videos.forEach(function (video) {
    video.muted = true;
    var name = (video.getAttribute('src') || '').split('/').pop();
    if (info[name] && info[name].poster && !video.getAttribute('poster')) video.setAttribute('poster', info[name].poster);
    video.addEventListener('error', function () { showVideoFallback(video); });
    if (reduce) {
      video.removeAttribute('autoplay');
      video.autoplay = false;
      video.controls = true;
      video.pause();
    }
  });
  if (reduce || !('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && entry.target.getAttribute('src')) playQuietly(entry.target);
      else entry.target.pause();
    });
  }, { threshold: 0.25 });
  videos.forEach(function (video) {
    video.removeAttribute('autoplay');
    observer.observe(video);
  });
}

function setupGallery() {
  var data = window.AFFORDX;
  var root = document.getElementById('ax-gallery');
  if (!root || !data || !data.gallery || !data.gallery.length) return;
  var items = data.gallery;
  var pillHost = document.getElementById('ax-gallery-pills');
  var video = document.getElementById('ax-gallery-video');
  var caption = document.getElementById('ax-gallery-caption');
  var fallback = document.getElementById('ax-gallery-fallback');
  var groups = [];
  var byGroup = {};
  items.forEach(function (item, i) {
    if (!byGroup[item.group]) { byGroup[item.group] = []; groups.push(item.group); }
    byGroup[item.group].push(i);
  });
  pillHost.innerHTML = groups.map(function (group) {
    return '<div class="ax-gallery-group"><span class="ax-gallery-group-name">' + escapeHtml(group) + '</span>' +
      '<div class="ax-pills ax-pills-left" role="group" aria-label="' + escapeHtml(group) + ' rollouts">' +
      byGroup[group].map(function (i) {
        return '<button class="ax-pill" type="button" data-gallery="' + i + '" aria-pressed="false">' +
          escapeHtml(items[i].label) + '</button>';
      }).join('') + '</div></div>';
  }).join('');
  var buttons = Array.prototype.slice.call(pillHost.querySelectorAll('[data-gallery]'));
  var current = 0;

  function show(index, fromUser) {
    current = (index + items.length) % items.length;
    var item = items[current];
    buttons.forEach(function (b) {
      var on = Number(b.dataset.gallery) === current;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (fallback) fallback.hidden = true;
    var stale = root.querySelectorAll('.ax-video-fallback:not(#ax-gallery-fallback)');
    Array.prototype.forEach.call(stale, function (node) { node.remove(); });
    video.setAttribute('poster', item.poster);
    video.setAttribute('src', item.video);
    video.setAttribute('aria-label', 'Successful AFFORD-X rollout: ' + item.instruction);
    caption.innerHTML = '<span class="ax-outcome is-success"><i class="fas fa-check"></i> succeeds</span> <b>' +
      escapeHtml(item.group + ' · ' + item.label) + '</b> &middot; ' + escapeHtml(item.scene) +
      (item.instruction ? '<br><em>' + escapeHtml(item.instruction) + '</em>' : '');
    if (fromUser && !prefersReducedMotion()) playQuietly(video);
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { show(Number(b.dataset.gallery), true); });
  });
  var prev = document.getElementById('ax-gallery-prev');
  var next = document.getElementById('ax-gallery-next');
  if (prev) prev.addEventListener('click', function () { show(current - 1, true); });
  if (next) next.addEventListener('click', function () { show(current + 1, true); });
  root.addEventListener('keydown', function (event) {
    if (event.target.closest && event.target.closest('.ax-pills')) return;   // pill groups handle their own arrows
    if (event.key === 'ArrowRight') { show(current + 1, true); event.preventDefault(); }
    if (event.key === 'ArrowLeft') { show(current - 1, true); event.preventDefault(); }
  });
  show(0, false);
}

function setupPillKeys() {
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    var pill = event.target.closest && event.target.closest('.ax-pills .ax-pill');
    if (!pill) return;
    var group = Array.prototype.slice.call(pill.parentNode.querySelectorAll('.ax-pill'));
    var step = event.key === 'ArrowRight' ? 1 : -1;
    var target = group[(group.indexOf(pill) + step + group.length) % group.length];
    target.focus();
    target.click();
    event.preventDefault();
  });
}

function setupDataNotice() {
  if (window.AFFORDX) return;
  ['ax-libero', 'ax-mw', 'ax-proposer', 'ax-cands', 'ax-gallery'].forEach(function (id) {
    var host = document.getElementById(id);
    if (!host) return;
    var note = document.createElement('p');
    note.className = 'ax-data-notice';
    note.textContent = 'The interactive results could not load (static/js/affordx_data.js is missing). The figures and text remain valid.';
    host.appendChild(note);
  });
}

/* The embedded viewers are same-origin, so each iframe takes the height of its content. */
function setupEmbeds() {
  Array.prototype.forEach.call(document.querySelectorAll('.ax-embed iframe'), fitEmbed);
}

function fitEmbed(frame) {
  function fit() {
    try {
      var doc = frame.contentDocument;
      if (doc && doc.body) frame.style.height = doc.documentElement.scrollHeight + 'px';
    } catch (err) {
      /* A cross-origin preview keeps the stylesheet height. */
    }
  }
  frame.addEventListener('load', function () {
    fit();
    try {
      if (window.ResizeObserver && frame.contentDocument) new ResizeObserver(fit).observe(frame.contentDocument.body);
    } catch (err) {
      /* A cross-origin preview keeps the stylesheet height. */
    }
  });
}

function safe(name, fn) {
  try {
    fn();
  } catch (err) {
    if (window.console && console.warn) console.warn('AFFORD-X page: ' + name + ' did not initialise', err);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  safe('navigation', setupNav);
  safe('counters', setupCounters);
  safe('tabs', setupTabs);
  safe('lightbox', setupLightbox);
  safe('pipeline stages', setupStages);
  safe('replay explorer', setupExplorer);
  safe('results', setupResults);
  safe('rollout gallery', setupGallery);
  safe('videos', setupVideos);
  safe('embedded viewer', setupEmbeds);
  safe('keyboard', setupPillKeys);
  safe('data notice', setupDataNotice);
});
