import { animate } from "motion";

const unitModifiers = new Map([]);

const directiveFunctions = new Map([]);

export default function (Alpine) {
  Alpine.directive("motion", motion);

  Alpine.magic("motion", () => (name, callback) => {
    // find a unique element with attribute x-motion:name="boxAnimation1"

    const el = document.querySelector('x-motion:name="boxAnimation1"');

    if (!el) {
      console.warn(`x-motion:${name} not found`);
      return;
    }

    console.log(id, callback);
  });

  function motion(
    el,
    { expression, modifiers, value },
    { evaluateLater, cleanup }
  ) {
    if (value !== "animate") {
      return;
    }

    const options = parseModifiers(el, modifiers);

    animate(el, ...options);

    cleanup(() => {
      console.log("cleanup");
    });
  }

  function parseModifiers(el, modifiers) {
    let unitOffset = 0;

    return modifiers.reduce((acc, modifier, index) => {
      if ((index + unitOffset) % 2 === 0) {
        const key = snakeCaseToCamelCase(modifier);
        acc.push({ [key]: parseValue(key, modifiers[index + 1]) });
      }
      return acc;
    }, []);
  }
}

function snakeCaseToCamelCase(str) {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );
}

function parseValue(key, value) {
  if (unitModifiers.has(key)) {
    return unitModifiers.get(key);
  }

  if (!value) return;

  if (value.includes("_")) {
    return convertIfNumber(value.replace("_", "."));
  }

  if (key === "duration") {
    let match = value.match(/([0-9]+)ms/);
    if (match) return parseFloat(match[1]) / 1000;
  }

  if (key === "rotate") {
    let match = value.match(/([0-9]+)deg/);
    if (match) return parseInt(match[1]);
  }

  return convertIfNumber(value);
}

function convertIfNumber(value) {
  let number = !isNaN(value) ? Number(value) : value;
  return number;
}
