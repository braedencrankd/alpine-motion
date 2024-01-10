import { animate } from "motion";

const unitModifiers = new Map([]);

const imports = new Map([["spring", import("motion")]]);

export default function (Alpine) {
  Alpine.directive("motion", motion);

  Alpine.magic("motion", () => (name) => {
    /// find the element in the store by name
    const el = Alpine.store("motion").elements[name];

    if (!el) {
      console.warn(`x-motion:${name} not found`);
      return;
    }

    return el.animation();
  });

  function motion(
    el,
    { expression, modifiers, value },
    { evaluateLater, evaluate, effect, cleanup }
  ) {
    // if there is an expression then we need to ignore modifiers and just run the expression
    const options =
      expression !== ""
        ? parseExpression(el, expression, evaluateLater, evaluate)
        : parseModifiers(modifiers);

    registerMotion(el, value, options, effect);

    cleanup(() => {
      console.log("cleanup");
    });
  }

  function registerMotion(el, name, options, effect) {
    if (!Alpine.store("motion")) {
      Alpine.store("motion", { elements: {} });
    }

    Alpine.store("motion").elements[name] = {
      name,
      animation: () => animate(el, ...options),
    };

    // Loop over properties to check if they are reactive
    // if they are then we need to watch them for changes

    animateFromReactive(el, options, effect);
  }

  function parseModifiers(modifiers) {
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

function animateFromReactive(el, options, effect) {
  Array.from(options).forEach((option) => {
    const key = Object.keys(option)[0];
    const expression = Object.values(option)[0];

    if (typeof expression === "function") {
      effect(() => {
        expression((value) => {
          option[key] = value;
          animate(el, ...options);
        });
      });
    }
  });
}

function parseExpression(el, expression, evaluateLater, evaluate) {
  // Get Alpinejs context data
  const dataStack = Alpine.closestDataStack(el);

  const options = expression
    .split(",")
    .map((option) => {
      try {
        option = option.replace(
          /\b(?<![.0-9])[a-z_][a-z0-9_]*\b(\(\))?/gi,
          '"$&"'
        );

        option = JSON.parse(option);
        const value = Object.values(option)[0];
        const key = Object.keys(option)[0];

        // Check if value is a function that is an import from motion
        handleFunctionImports(option, value);

        dataStack.forEach((data) => {
          const key = Object.keys(option)[0];

          if (data.hasOwnProperty(value)) {
            option[key] = evaluateLater(option[key]);
          }
        });

        return option;
      } catch (e) {
        console.warn("Invalid x-motion expression");
      }
    })
    .filter((option) => option);

  return options;
}

/**
 * Handles function imports.
 *
 * @param {object} option - The option object.
 * @param {string} value - The value to check for function imports.
 */
function handleFunctionImports(option, value) {
  if (typeof value === "string" && value.includes("()")) {
    const [fn] = value.split("()");
    const key = Object.keys(option)[0];

    if (imports.has(fn)) {
      option[fn] = imports.get(fn).then((moduleBundle) => {
        option[key] = moduleBundle[fn]();
      });
    }
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
