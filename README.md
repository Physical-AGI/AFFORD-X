# AFFORD-X

Project page for **Affordance-Grounded Coding Agents are Robust Where Vision-Language-Action
Policies Fail**.

A training-free affordance layer that sits between a frozen coding agent and a frozen grasp
detector and re-ranks candidates by function **gated on embodiment feasibility**. It consumes no
demonstrations, no reward and no gradient steps, so its marginal cost for a new task, object or
workspace is zero. Functional re-ranking improves paired end-to-end success by `+0.109` on LIBERO
(n = 440) and replicates zero-shot at `+0.081` on Meta-World (n = 160), across two simulators, two
arms and two gripper morphologies with no tuning.

Live at <https://physical-agi.github.io/AFFORD-X/>.

## What is interactive

| Component | What it does |
|---|---|
| Pipeline walkthrough | Four stages, three of them frozen, one of them ours |
| **Selection explorer** | Toggle the embodiment gate, the functional prior, the plan constraint and the memory prior, and drag the feasibility floor τ, to see which of eight candidates the arm executes |
| L-ladder chart | L1 to L4 with 95% bootstrap intervals; switch between end-to-end success, grasp rate and P(place \| grasp) |
| ROC panel | The pre-registered perception-only carrier against the reachability-gated one |
| Headroom scatter | Nine regimes, hover for the paired interval and the episode count |
| MT50 task grid | Filter by tier, revolute articulation and grasp dependence, and watch the aggregate move |

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Where the numbers come from

Every measured number on the page is recomputed from the run logs in the code repository at
`AFFORD-X/outputs/sprint/`, with the same estimator the paper build uses (paired percentile
bootstrap, 10,000 resamples, seed 0). They match `paper/tables/*.tex` and the panels produced by
`paper/figures/make_results.py` and `paper/figures/make_headroom.py`.

| Page section | Source |
|---|---|
| Framework figure | `paper/figures/method_framework.pdf` |
| Stat counters | `mw_ladder.tex`, paper Sec. RQ1 and RQ3 |
| L-ladder chart and table | `l_ladder_decider.jsonl`, `mw_ladder_full.jsonl`, `mw_ladder.tex` |
| ROC panel | `h3_calibration.jsonl`, 88 prospective held-out episodes |
| Headroom scatter | `make_headroom.py` over `l_ladder_decider.jsonl` + `mw_ladder_*.jsonl` |
| MT50 grid and tiers | `mt50_affordx_valid189.jsonl` joined to `scripts/mw50_tasks.py` |
| MT50 comparison table | `mt50_sota.tex` |
| LIBERO-PRO null | `libero_pro_matrix.tex` header, agent ablation |

The one exception is `CANDIDATES` in `static/js/index.js`, the eight-candidate set in the selection
explorer. That is a **worked example, not logged data**, and the page says so: per-candidate score
arrays are not written by the evaluation runs, so a real candidate set cannot be replayed. The
scoring rule it applies is the shipped one, from
`affordx/capx/affordance_ops.py :: embodiment_gated_scores`, including the `GRIP_GATE_FRAC = 0.5`
floor and the `[0.3, 1.8]` clip on the memory prior.

## Structure

```
index.html              # the whole page
static/css/index.css    # theme + interactive component styles
static/js/index.js      # nav, stages, explorer, SVG charts, task grid, lightbox
static/images/          # figures copied from the paper
```

Charts are hand-built SVG, so the page ships no plotting library and every drawn value is
traceable to a data block at the top of `static/js/index.js`.

## Keeping it in sync

After a new evaluation run, rerun `paper/figures/make_results.py` and `make_headroom.py` in the code
repository, then update `LADDER`, `ROC`, `HEADROOM` and `MT50` in `static/js/index.js` and the
static tables in `index.html` to match.

Page template adapted from [Nerfies](https://nerfies.github.io), licensed
[CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/).
