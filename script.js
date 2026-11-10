/* ORBIT behavior. "use strict" catches some accidental JS mistakes early. */
"use strict";

// Query each HTML element once and keep a reference to it.
const canvas = document.getElementById("starfield");
const context = canvas.getContext("2d"); // Canvas drawing API
// v0.4: this file now also runs on the planet pages, which have no theme button
// or star counter. Those elements can be null, so every use below is guarded.
const starCount = document.getElementById("star-count");
const themeButton = document.getElementById("theme-button");
const themeLabel = document.getElementById("theme-label");
const status = document.getElementById("status");

let stars = []; // Each star is an object containing its position and twinkle settings.
let animationId;

// Math.random() is between 0 and 1; multiplying gives a value up to max.
const random = max => Math.random() * max;

function createStars() {
  // devicePixelRatio makes canvas art crisp on high-density displays.
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * pixelRatio;
  canvas.height = innerHeight * pixelRatio;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  // A little density rule: larger screens get more stars.
  const count = Math.max(90, Math.floor(innerWidth * innerHeight / 3000));
  stars = Array.from({ length: count }, () => ({
    x: random(innerWidth),
    y: random(innerHeight),
    radius: random(1.15) + 0.2,
    phase: random(Math.PI * 2), // starting point in the twinkle cycle
    speed: random(0.018) + 0.004
  }));
  if (starCount) starCount.textContent = count.toLocaleString();
}

function drawStars() {
  context.clearRect(0, 0, innerWidth, innerHeight);

  for (const star of stars) {
    star.phase += star.speed;
    // Sine waves between -1 and 1; map that range to gentle opacity.
    const opacity = 0.25 + (Math.sin(star.phase) + 1) * 0.35;
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(190, 215, 255, ${opacity})`;
    context.fill();
  }

  // Ask the browser to call this function before its next screen repaint.
  animationId = requestAnimationFrame(drawStars);
}

// Events connect user actions to behavior.
if (themeButton) themeButton.addEventListener("click", () => {
  // classList.toggle adds the class if absent and removes it if present.
  const enabled = document.body.classList.toggle("nebula-mode");
  themeButton.setAttribute("aria-pressed", String(enabled));
  themeLabel.textContent = enabled ? "Nebula mode" : "Stellar mode";
  if (status) status.textContent = enabled ? "Nebula mode enabled." : "Nebula mode disabled.";
});

// On resize, rebuild star positions. The existing animation loop continues.
window.addEventListener("resize", createStars);

// Respect the operating system's reduced-motion setting.
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
createStars();
drawStars();
if (motionPreference.matches) {
  cancelAnimationFrame(animationId);
  // Draw a still frame instead of continuing the twinkle animation.
  context.clearRect(0, 0, innerWidth, innerHeight);
  for (const star of stars) {
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fillStyle = "rgba(190, 215, 255, .55)";
    context.fill();
  }
}
