import alpineMotion from "../src/index.js";

document.addEventListener("alpine:init", () =>
  window.Alpine.plugin(alpineMotion)
);
