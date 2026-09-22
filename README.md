# AFFORD-X

Project page for **AFFORD-X: Affordance-Grounded Agentic Policy for Zero-Shot Robot Manipulation**.

AFFORD-X makes interaction selection explicit: candidate interactions, a feasibility gate, functional affordance
from a geometric part partition and task compatibility from the task definition's typed intent; a frozen VLM arbitrates
within the two best candidates by affordance, and a closed agentic loop executes, verifies with a frozen VLM and replans.
It is evaluated counterfactually, with every method ranking the same candidate set and every candidate executed in the
benchmark's own simulator. The page reports LIBERO-PRO Goal, Spatial and Object under the Pos and Task perturbations and
Meta-World MT50, the held-out test of the arbitration rule and the agentic loop.

Live at <https://physical-agi.github.io/AFFORD-X/>.

## What is interactive

| Component | What it does |
|---|---|
| Pipeline walkthrough | The five components, which are frozen and which are ours |
| **Replay explorer** | The logged hammer scene: switch part source, combination rule, gate and terms, and see which candidate executes and its simulator outcome |
| LIBERO-PRO chart | Success with 95% intervals under Pos and Task, and the paired difference against random choice |
| Meta-World chart | MT50 success with 95% intervals, by difficulty tier |
| Arbitration chart | Held-out success of the arbitration rule against the VLM alone and random choice in the shortlist |
| Agentic loop chart | One attempt against the closed loop, verifier agreement, and replayed recovery videos |

## Where the numbers come from

Every measured value is in `static/js/affordx_data.js`, which
`AFFORD-X/scripts/figures/export_project_page.py` writes from finalized run directories listed in the file. The
same script renders the framework figure from replayed agentic-loop episodes, the LIBERO-PRO reporting heatmap and the SAM3 prompt figure, copies the
rollout videos after checking that each shows the candidate its method selected, replays and renders the
agentic-loop recoveries, and precomputes the explorer's
selections with the engine's decision specs, checked against the selections the run recorded. `static/js/index.js`
contains no numbers.

## Updating

```bash
cd AFFORD-X
scripts/metaworld_python.sh scripts/figures/export_project_page.py --page ../AFFORD-X-page
```

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

```
index.html                 # the page
static/css/index.css       # theme and shared components
static/css/affordx.css     # replay overlay, videos, paired readouts
static/js/affordx_data.js  # generated data (do not edit)
static/js/index.js         # nav, walkthrough, explorer, SVG charts, lightbox
static/images/             # generated figures
static/videos/             # rollout videos recorded during evaluation
```

Page template adapted from [Nerfies](https://nerfies.github.io), licensed
[CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/).
