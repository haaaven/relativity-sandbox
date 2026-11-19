/* Tab 10 - concept cards: conceptual questions in the spirit of the script's "Questions" sections
   (paraphrased), each with an explanation and a link to the tab where you can see it. */
(function () {
  'use strict';
  const SR = window.SR, ui = SR.ui;

  const CARDS = [
    /* ---------------- chapter 1 */
    [1, 'Which assumptions give the Lorentz transformation in the first derivation (sec. 1.1)?',
      'The speed of light is the same for all inertial observers, so c²t² − x² − y² − z² = 0 must be preserved. The map must be <b>linear</b> (no special points in space or time). The proportionality factor K(V) between the two quadratic forms must be continuous with K(0) = 1, and the inverse map must have the same form (reciprocity), which gives K = 1. A linear map that preserves this "distance" is a (pseudo)rotation in the (ict, x) plane.', 'spacetime'],
    [1, 'Chapter 4 derives the transformation <i>without</i> the constancy of c. What is needed instead?',
      'The principle of relativity, linearity (homogeneity), isotropy, and the requirement that composing two transformations gives another of the same family. These allow either Galilean transformations or Lorentz transformations with some invariant speed. Experiment says that speed is finite: c.', 'formulas'],
    [1, 'What is the geometric meaning of a boost?',
      'A hyperbolic rotation of spacetime by the rapidity φ = artanh(V/c). It preserves the hyperbolas c²t² − x² = const, just as rotations preserve circles. On a Minkowski diagram the t′ and x′ axes scissor symmetrically towards the light cone, with tan α = V/c.', 'spacetime'],
    [1, 'Does the order of two boosts matter? Is V followed by −V the identity?',
      'Along one line, no: rapidities simply add (φ₁ + φ₂ = φ₂ + φ₁), and V then −V is the identity. In different directions, yes: the composition is a boost <i>plus a rotation</i> (Thomas–Wigner), and the result depends on the order.', 'space3d'],
    [1, 'How should "nothing can move faster than light" be phrased? Does it follow from relativity?',
      'No signal (matter, energy, information) can travel faster than c relative to any inertial observer. It is an extra postulate protecting causality: a superluminal signal could arrive before it was sent in some frames. Superluminal <i>patterns</i> (Mexican waves, laser spots, closing speeds of 1.8c) are allowed because they carry nothing.', 'paradox:wave'],
    [1, 'What role does the spacetime interval play?',
      's² = c²Δt² − Δr² is invariant. Its sign classifies a pair of events. <b>Timelike</b> (s² &gt; 0): one can influence the other, the order is absolute, and √s²/c is the proper time. <b>Null</b>: connected by light. <b>Spacelike</b>: no causal contact, the order is frame dependent, and √(−s²) is the proper distance.', 'spacetime'],
    [1, 'On a Minkowski diagram, why do you read t′ of an event by drawing a line parallel to the x′ axis, not perpendicular to the t′ axis?',
      'Lines of constant t′ are parallel to the x′ axis: they are the simultaneity lines of S′. Euclidean right angles on paper have no physical meaning in Minkowski geometry. The units on the t′ axis are calibrated by the hyperbola c²t² − x² = 1.', 'spacetime'],
    [1, 'Can you get the whole Lorentz transformation from its spatial part alone?',
      'Yes. Take x′ = γ(x − Vt). By the principle of relativity x = γ(x′ + Vt′). Eliminate x′ and solve for t′: t′ = γ(t − Vx/c²).', 'formulas'],
    [1, 'Are there nonlinear coordinate changes that preserve the speed of light?',
      'Yes, e.g. conformal maps such as inversions take light cones to light cones. But they single out special points of spacetime. Demanding that no event or place is special (homogeneity) forces linearity.', 'formulas'],
    [1, 'Can "rotation about an axis" be defined uniquely in 4D?',
      'No. In 4D a rotation acts in a <i>plane</i> and leaves the orthogonal plane fixed, not a line. A boost along x is a rotation in the (ct, x) plane that leaves the whole (y, z) plane untouched.', 'formulas'],
    /* ---------------- chapter 2 */
    [2, 'For any two events, is there a frame in which they are simultaneous? One in which they happen at the same place?',
      'Simultaneous: only if the pair is spacelike, with V = c²Δt/Δx. Same place: only if it is timelike, with V = Δx/Δt. For a null pair, neither (it would need V = c).', 'spacetime'],
    [2, 'Can the order of two events connected by a light ray depend on the observer?',
      'No. Δt′ = γΔt(1 ∓ V/c) has the sign of Δt for every |V| &lt; c.', 'spacetime'],
    [2, 'Is there always a non-trivial Lorentz transformation that leaves Δt between two events unchanged?',
      'Not if the events happen at the same place: then every boost gives Δt′ = γΔt. Otherwise yes: you need V·Δr = c²Δt(1 − 1/γ). Along the line through the events this works only for timelike pairs (V = 2u/(1 + u²) with u = Δx/cΔt). For spacelike pairs the boost needs a component perpendicular to Δr.', 'spacetime'],
    [2, 'Why can\'t motion shrink the perpendicular dimensions?',
      'Two equal pipes fly at each other along their common axis. If perpendicular sizes shrank, each frame would see the <i>other</i> pipe slip inside: a frame-dependent outcome, which is a contradiction. Hence y′ = y and z′ = z.', 'formulas'],
    [2, 'Is Lorentz contraction real or just an appearance?',
      'Real in the sense that it has physical consequences in the frame where it is measured: the stick passes through the hole, and the current-carrying cable becomes charged in the electrons\' frame. It is frame dependent, like the apparent length of a rotated stick. The invariant property is the proper length.', 'paradox:cable'],
    [2, 'Both inertial observers say the other\'s clocks run slow. How?',
      'They compare different pairs of events, because each uses their own lines of simultaneity. A single moving clock is compared with a <i>row</i> of synchronised clocks, and those clocks are out of sync for the other observer.', 'paradox:clocks'],
    [2, 'Why are the twins not symmetric?',
      'Rob changes inertial frames (he accelerates); Alice does not. During the turnaround his lines of simultaneity sweep across Alice\'s worldline. Between two events the inertial (straight) worldline has the most proper time. This is confirmed by atomic clocks flown around the world and by muons in storage rings.', 'twins'],
    [2, 'What is the clock postulate, and is it guaranteed?',
      'An ideal clock\'s rate depends only on its instantaneous speed: τ = ∫√(1 − v²/c²) dt, with no dependence on acceleration. It is an assumption, not a theorem. Muons confirm it up to ~10¹⁸ g, but quantum effects modify it at extreme accelerations.', 'twins'],
    [2, 'A → B is a boost by V, B → C another boost by V in the same direction. Is A → C a boost by 2V?',
      'No: 2V/(1 + V²/c²) &lt; c. Rapidities add, velocities do not.', 'velocity'],
    [2, 'Could a universe with periodic space (go straight, come back) obey the principle of relativity?',
      'No. Twins flying apart inertially meet again, and they cannot both be younger. A preferred frame must exist, namely the one in which the identification x ~ x + L is simultaneous.', 'twins'],
    [2, 'Is there an inertial observer for whom Elvis is still alive right now?',
      'Yes: a distant observer moving away from us, whose simultaneity line through "now" passes below Elvis\'s death (need V·D &gt; 44 years for us). It has no causal meaning, because those events are spacelike from the observer. Simultaneity at large distances is very fragile.', 'paradox:elvis'],
    [2, 'Does a speed walker\'s gait stay legal at relativistic speeds?',
      'No. Feet swapped simultaneously in the walker\'s frame are not swapped simultaneously in the judges\' frame: the rear foot lifts 2γVd/c² before the front foot lands (eq. 2.12). "Always one foot on the ground" is not a Lorentz-invariant rule.', 'paradox:walker'],
    /* ---------------- chapter 3 */
    [3, 'Does a boost change only the velocity component along the motion?',
      'No. The transverse components change too: u′_y = u_y√(1 − V²/c²)/(1 − u_xV/c²), because the clocks differ.', 'velocity'],
    [3, 'Does the direction of a light ray depend on the observer?',
      'Yes (aberration): cos θ′ = (cos θ − β)/(1 − β cos θ) for propagation directions. Its speed does not change.', 'optics'],
    [3, 'When does the composition of two boosts produce no rotation?',
      'Only when the two velocities are collinear (or one is zero). Otherwise there is a Thomas–Wigner rotation in the plane of the two velocities.', 'space3d'],
    [3, 'Why is the relative velocity of two observers who see the same Witch "the hardest problem"?',
      'The natural shortcut uses the Witch\'s frame as if it were a pure boost from both Alice and Bob. That is impossible because of the Wigner rotation, and the result (3.7) is not antisymmetric. The correct answer has V/(1 + √(1 − V²/c²)) = (γu − γ′u′)/(γ + γ′) (eq. 7.11), which is antisymmetric.', 'space3d'],
    [3, 'How is Thomas precession compatible with conservation of angular momentum?',
      'No torque acts: in its own frame the gyroscope\'s axis is simply carried along (Fermi–Walker transport). The precession is a mismatch with the lab axes reached by pure boosts, a geometric effect of non-commuting boosts. Per orbit the angle is 2π(γ − 1), opposite to the orbital motion.', 'space3d'],
    /* ---------------- chapter 5 */
    [5, 'Why are there no rigid bodies in relativity?',
      'A rigid body would react to a push everywhere at once, which needs an infinitely fast signal. Information travels at most at c (in practice at the speed of sound), so pushed bodies always deform first.', 'paradox:barn'],
    [5, 'Does a body moving at constant velocity feel stresses because it is contracted?',
      'No. There are no stresses in its rest frame, and stresses cannot appear just because someone else moves. A <i>rotating</i> ring is different: it cannot contract around a fixed hub, so internal stresses appear (Ehrenfest).', 'formulas'],
    [5, 'An instantaneous kick hits one point of a long body. Does it behave like a fluid for a while?',
      'Yes. The rest of the body does not "know" about the kick until a stress wave arrives, so locally it deforms like a fluid (the block "pours" into the hole, sec. 5.4).', 'paradox:barn'],
    /* ---------------- chapter 6 */
    [6, 'Does the speed of light in flowing water depend on the water\'s speed?',
      'Yes: u = (c/n + V)/(1 + V/nc) ≈ c/n + V(1 − 1/n²) (Fresnel drag, measured by Fizeau). The medium partly "drags" the light.', 'velocity'],
    [6, 'Is light from an approaching source always blueshifted?',
      'No. f/f₀ = 1/(γ(1 − β cos θ)). Near θ = 90° the transverse redshift 1/γ (time dilation) wins, even if the distance is slowly decreasing.', 'optics'],
    [6, 'What does a fast sphere look like in a photograph? And a flat circle?',
      'A sphere always has a circular outline, only rotated and resized (Terrell–Penrose rotation). A flat circle looks stretched while approaching and like a "sausage" while receding. The photo includes light-travel time; it is not the contracted shape.', 'optics'],
    /* ---------------- chapter 7 */
    [7, 'Does heating a body increase its rest mass? Its weight?',
      'Yes, by ΔE/c² (immeasurably small in daily life), and the weight too, since inertial and gravitational mass are equal.', 'dynamics'],
    [7, 'Is mechanical energy conserved in inelastic collisions? How does this differ from Newtonian physics?',
      'Total energy (rest + kinetic) is always conserved; kinetic energy alone is not, because part of it turns into rest mass. Newtonian physics keeps mass conserved separately and calls the lost kinetic energy "heat". Relativity puts heat into the rest mass: the mass of a system is not the sum of its parts\' masses.', 'dynamics'],
    [7, 'When is the product ma not parallel to the change of momentum?',
      'Whenever the force has components both along and across the velocity: a∥ = F∥/γ³m but a⊥ = F⊥/γm, so a leans towards the transverse direction.', 'dynamics'],
    [7, 'Why is the energy of a photon proportional to its frequency?',
      'The photon\'s four-momentum (E/c, p) and the wave four-vector (ω/c, k) are both null and point the same way, so they transform identically (the Doppler factor). Their ratio is frame independent, so E = ħω with one universal constant.', 'dynamics'],
    [7, 'Why can\'t a free electron absorb a photon, or an e⁺e⁻ pair become a single photon?',
      'In the CM frame the final electron would be at rest with energy mc², but before absorption the moving electron alone already had more. Similarly, the pair has a frame with p = 0 and E &gt; 0, which a single photon never has. Formally: compare invariant masses.', 'dynamics'],
    [7, 'What is the invariant mass of two photons?',
      'M²c⁴ = 2E₁E₂(1 − cos θ). It is zero only if they fly in the same direction; head-on, M = 2√(E₁E₂)/c².', 'dynamics'],
    /* ---------------- chapter 8 */
    [8, 'What is relativistic uniformly accelerated motion?',
      'Constant <i>proper</i> acceleration g (constant accelerometer reading). The worldline is a hyperbola x² − c²t² = (c²/g)² about its centre, and the rapidity grows linearly with proper time, so v → c without ever reaching it.', 'accel'],
    [8, 'An object starts accelerating uniformly. Can a light beam sent later from the same point always catch it?',
      'Only if sent within c/g of the start. Later beams never reach it: a horizon at distance c²/g follows the object.', 'accel'],
    [8, 'How can you release a finite body from an accelerating rocket so that it moves freely without internal stresses?',
      'Release all its points simultaneously in the rocket\'s frame (along a line of simultaneity, which passes through the hyperbolas\' centre). In a Born-rigid rocket all points then have the same velocity, so the body continues as an unstressed inertial body. Releasing simultaneously in the lab gives the points different velocities.', 'accel'],
    [8, 'What happens to light sent from an accelerating rocket towards the horizon? Away from it?',
      'Towards: in rocket coordinates it slows down and approaches the horizon forever, increasingly redshifted, although it crosses it in finite time in the inertial frame. Away: it climbs with coordinate speed gξ, increasing with height.', 'accel'],
    [8, 'What is the difference between coordinate and local velocity? Can a coordinate velocity exceed c?',
      'Local velocity is measured with a nearby observer\'s own ruler and clock, and is always c for light. Coordinate velocity uses the rocket\'s reference clock and coordinates, can be anything, and exceeds c high above the reference clock.', 'accel'],
    [8, 'Two rockets with identical engines start together, joined by a string (Bell). Does the string break?',
      'Yes. Their lab distance stays L, but in their instantaneous rest frame the distance grows ~γL. Keeping the distance fixed (Born rigidity) requires the front rocket to accelerate less: g/(1 + gL/c²).', 'accel'],
    [8, 'Why do clocks at the top of an accelerating rocket run faster?',
      'All rocket observers share lines of simultaneity through the hyperbolas\' centre. Between two such lines a clock at distance ξ from the horizon ages ξ·Δη/c, so the rate ratio is 1 + gh/c². By the equivalence principle the same holds in gravity (Pound–Rebka, GPS).', 'accel'],
    [8, 'The accelerated frame looks the same at all times, but different heights differ. Why this asymmetry?',
      'The Rindler frame is symmetric under boosts (a shift of its time η) but not under spatial shifts. The horizon is a special place, and the distance from it fixes each observer\'s acceleration c²/ξ and clock rate.', 'accel']
  ];

  SR.modules.push({
    id: 'concepts', order: 10, title: '10 · Concept cards', doc: true, tip: 'Conceptual exam questions with explanations',
    init(panel) {
      const inner = ui.el('div', { class: 'doc-inner' });
      panel.append(inner);
      inner.append(ui.el('h2', { text: 'Concept cards' }));
      ui.note(inner, 'Answer each question out loud (or on paper) before opening it. Questions follow the topics of the "Questions" sections of the script, in my own wording; the explanations are mine. "See it" opens the relevant tab.', 'small');
      const chapters = [[0, 'all'], [1, 'Ch. 1 spacetime'], [2, 'Ch. 2 consequences'], [3, 'Ch. 3 3D'], [5, 'Ch. 5 hard bodies'], [6, 'Ch. 6 optics'], [7, 'Ch. 7 dynamics'], [8, 'Ch. 8 acceleration']];
      let cur = 0;
      const seg = ui.segmented(inner, { value: 0, options: chapters.map(([v, l]) => ({ value: v, label: l })), onChange: v => { cur = v; render(); } });
      ui.buttons(inner, [{ label: 'open all', onClick: () => list.querySelectorAll('details').forEach(d => { d.open = true; }) }, { label: 'close all', onClick: () => list.querySelectorAll('details').forEach(d => { d.open = false; }) },
        { label: 'shuffle', onClick: () => { CARDS.sort(() => Math.random() - 0.5); render(); } }]);
      const list = ui.el('div'); inner.append(list);
      function render() {
        list.innerHTML = '';
        CARDS.filter(c => cur === 0 || c[0] === cur).forEach((c, i) => {
          const d = ui.el('details', { class: 'reveal card' });
          d.style.padding = '0';
          const [tab, arg] = c[3].split(':');
          const link = ui.el('a', { class: 'tablink', text: 'see it →' });
          link.addEventListener('click', e => { e.preventDefault(); SR.app.go(tab, arg); });
          d.append(ui.el('summary', { html: '<span class="pill">Ch. ' + c[0] + '</span> ' + c[1] }), ui.el('div', { class: 'ans', html: c[2] + ' ' }, link));
          list.append(d);
        });
      }
      render();
    }
  });
})();
