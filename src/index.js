export default function (Alpine) {
  Alpine.directive("motion", motion);

  function motion(el, { expression, modifiers }, { evaluateLater, cleanup }) {
    console.log("motion", el, expression, modifiers);
  }
}
