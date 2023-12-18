import { animate } from "motion";

const unitModifiers = new Map([]);

const directiveFunctions = new Map([]);

export default function (Alpine) {
  Alpine.directive("motion", motion);

  Alpine.magic("motion", () => (name, callback) => {
    /// find the element in the store by name
    const el = Alpine.store("motion").elements[name];

    if (!el) {
      console.warn(`x-motion:${name} not found`);
      return;
    }

    if (typeof el.animation()[callback] === "function") {
      el.animation()[callback]();
    }
  });

  function motion(
    el,
    { expression, modifiers, value },
    { evaluateLater, cleanup }
  ) {
    const options = parseModifiers(el, modifiers);

    console.log(options);

    registerMotion(el, value, options);

    cleanup(() => {
      console.log("cleanup");
    });
  }

  function registerMotion(el, name, options) {
    // register the element in an Alpine store so we can find it later

    // check if the store exists and create it if it doesn't otherwise append to it

    if (!Alpine.store("motion")) {
      Alpine.store("motion", { elements: {} });
    }

    Alpine.store("motion").elements[name] = {
      name,
      animation: () => animate(el, ...options),
    };
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
    let match = value.match(/(-?[0-9]+)ms/);
    if (match) return parseFloat(match[1]) / 1000;
  }

  if (key === "rotate") {
    let match = value.match(/(-?[0-9]+)deg/);
    if (match) return parseInt(match[1]);
  }

  return convertIfNumber(value);
}

function convertIfNumber(value) {
  let number = !isNaN(value) ? Number(value) : value;
  return number;
}
