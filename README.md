# AFFORD-X

Project page for **AFFORD-X: Affordance-Grounded Agentic Policy for Zero-Shot Robot Manipulation**.

AFFORD-X makes interaction selection explicit: candidate interactions, a feasibility gate, functional affordance
grounded with SAM3, task compatibility from a semantic proposer's typed intent, then execution. It is evaluated
counterfactually, with every method ranking the same candidate set and every candidate executed in the benchmark's
own simulator. The page reports the pilot phase: LIBERO-PRO Spatial (Pos and Task) and an 11-task Meta-World suite,
positive results and nulls together.

Live at <https://physical-agi.github.io/AFFORD-X/>.

## What is interactive

| Component | What it does |
|---|---|
| Pipeline walkthrough | The five components, which are frozen and which are ours |
| **Replay explorer** | The logged hammer scene: switch part source, combination rule, gate and terms, and see which candidate executes and its simulator outcome |
| LIBERO-PRO chart | Success with 95% intervals under Pos and Task, paired differences and go/no-go verdicts |
| Meta-World chart | Unperturbed, reach envelopes and perturbation sweeps, including the SAM3 against geometric-part contrast |
| Proposer chart | Gemini arms B1 to B4 on the same scenes |

## Where the numbers come from

Every measured value is in `static/js/affordx_data.js`, which
`AFFORD-X/scripts/figures/export_project_page.py` writes from finalized run directories listed in the file. The
same script renders the framework figure, the LIBERO-PRO reporting heatmap and the SAM3 prompt figure, copies the
rollout videos after checking that each shows the candidate its method selected, and precomputes the explorer's
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
