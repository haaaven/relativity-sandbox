# Special Relativity Sandbox

An interactive intuition builder that follows Andrzej Dragan's *Unusually Special Relativity*.

**Open it:** double-click `index.html` (Chrome, Edge or Firefox). There is nothing to install and it works offline.
`tests.html` runs the physics self-checks; the badge in the top-right corner of the app shows their status.

Conventions everywhere: **c = 1**, so `t` means `ct` and velocities are fractions of c. S is the lab frame, and S′ moves with velocity V along +x with a common origin. On diagrams, time points up and the light cone is at 45°.

## Tabs

| Tab | What you can do | Script |
|---|---|---|
| 1 Spacetime diagram | Drag events, add worldlines with proper-time ticks, draw S′/S″ axes and grids, and view everything from any frame (a hyperbolic rotation). Pair analysis gives the interval, its type, proper time or distance, and the special frame. Compare the Lorentz, Galilean and Euclidean-rotation laws. | 1.1–1.4, 2.1 |
| 2 Paradox lab | 11 guided scenarios. Each has a Minkowski diagram plus a strip showing space at the current moment in the chosen frame: stomping feet, dilation and desynchronised clocks, broom measurement, castles, truck/tunnel, pole and barn with a door and a crash signal, Elvis lives, speed walker, superluminal Mexican wave, the cable paradox (charge densities and forces in any frame), trains at ±0.9c. | 1.3, 2.1–2.10, 5.2 |
| 3 Twin paradox | Instant turnaround, smooth constant-g trip, a trip you drag yourself, and the loopy (periodic) universe. Shows Rob's simultaneity fan, light flashes, and a plot of Alice's age on Rob's "now" against what he sees through a telescope. | 2.6, 2.7, 8.9 |
| 4 Velocities | v′(V) including superluminal waves (Figs. 2.10/2.12), 2D velocity space with aberration, rapidity chains (100 rockets), Fizeau drag, an addition calculator. | 1.3, 2.10, 3.1, 6.2 |
| 5 3D: Wigner & Thomas | Composing non-collinear boosts as seen by Alice and by the Witch, the "hardest problem" (naive 3.7 against correct 7.11), Thomas precession (2π(γ−1) per orbit, verified by composing 1500 boosts), stick through a moving hole, two colliding squares. | 2.4, 3.1–3.4, 5.3, 7.3 |
| 6 Dynamics | Energy–momentum diagram (mass shells, invariant mass, CM frame, photons, tachyon), force against acceleration, constant force, and calculators for kinematics, decays, thresholds, elastic/sticky collisions and Compton scattering. | 7.1–7.9 |
| 7 Optics | What a camera photographs (circle → "sausage", grid, bicycle, sphere with a circular outline to ~10⁻¹⁵), a Doppler polar plot, a traffic-light calculator, an aberration starfield. | 6.1–6.4 |
| 8 Accelerated frames | Hyperbolic motion and its horizon, a Rindler-coordinates view, Bell's spaceships against Born-rigid acceleration, clocks in a rocket (1 + gh/c²), the hungry astronaut ((c/g) ln 2). | 8.2–8.8 |
| 9 Drill | 16 kinds of randomised exam-style problems with answer checking, worked solutions and "show in sandbox" links. | all |
| 10 Concept cards | About 45 conceptual questions organised like the script's question sections, with explanations. | all |
| 11 Formula sheet | Key formulas with c kept explicit, plus useful numbers. Printable. | all |

## Controls
- Mouse wheel zooms. Dragging the background pans; dragging points, arrow tips or squares moves them. Double-clicking the spacetime diagram adds an event.
- Frame buttons hyperbolically rotate the view into another observer's frame.
- Each tab has "Predict, then reveal" questions. Commit to an answer before opening one.

## Files
- `js/core/physics.js`: all the physics (pure functions, c = 1).
- `js/core/tests.js`: 34 independent checks of it.
- `js/core/*.js`: canvas, diagram, plot and UI helpers.
- `js/modules/*.js`: one file per tab.
