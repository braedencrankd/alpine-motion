import { animate, timeline } from "motion";

const unitModifiers = new Map([]);

const imports = new Map([
  ["spring", import("motion")],
  ["stagger", import("motion")],
  ["inView", import("motion")],
  ["scroll", import("motion")],
  ["timeline", import("motion")],
]);

export default function (Alpine) {
  Alpine.directive("motion", motion);

  Alpine.magic("timeline", () => async (names, options) => {
    const elements = Object.keys(Alpine.store("motion").elements)
      .filter((name) => names.includes(name))
      .reduce((acc, name) => {
        acc.push(Alpine.store("motion").elements[name]);
        return acc;
      }, []);

    const moduleBundle = await import("motion");

    const sequence = elements.map((element) => [
      element.el,
      ...element.animationData,
    ]);

    moduleBundle.timeline(sequence, options);
  });

  Alpine.magic("motion", () => (name) => {
    /// find the element in the store by name
    const el = Alpine.store("motion").elements[name];

    if (!el) {
      console.warn(`x-motion:${name} not found`);
      return;
    }

    return el.animation();
  });

  Alpine.magic("animate", () => (name, options) => {
    return animate(name, options);
  });

  Alpine.magic("scroll", () => async (props, options) => {
    const { scroll } = await import("motion");

    return scroll(props, options);
  });

  function motion(
    el,
    { expression, modifiers, value },
    { evaluateLater, evaluate, effect, cleanup }
  ) {
    const specialModifiersIndex = ["in-view"];
    const specialModifiers = modifiers.filter((modifier) =>
      specialModifiersIndex.includes(modifier)
    );

    const options =
      expression !== ""
        ? parseExpression(el, expression, evaluateLater, evaluate)
        : parseModifiers(modifiers);

    if (!value) {
      handleSpecialModifiers(el, options, effect, ["in-view"]);
    } else {
      registerMotion(el, value, options, effect, specialModifiers);
    }

    cleanup(() => {
      console.log("cleanup");
    });
  }

  function registerMotion(el, name, options, effect, specialModifiers = []) {
    if (!Alpine.store("motion")) {
      Alpine.store("motion", { elements: {} });
    }

    Alpine.store("motion").elements[name] = {
      name,
      animation: () => animate(el, ...options),
      animationData: options,
      el,
    };

    handleSpecialModifiers(el, options, effect, specialModifiers);

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

async function handleSpecialModifiers(el, options, effect, specialModifiers) {
  if (specialModifiers.length === 0) return;

  // in-view
  if (specialModifiers.includes("in-view")) {
    const { inView } = await import("motion");

    effect(() => {
      inView(el, () => {
        animate(el, ...options);
      });
    });
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
  const dataStack = Alpine.closestDataStack(el);

  // Updated regex to handle nested arrays and objects more carefully
  const options = expression
    .split(/,(?=(?:[^{}[\]]*|{[^{}]*}|\[[^\[\]]*\])*$)/)
    .map((option) => {
      try {
        // Modified to only look for variables on the right side of colons
        const alpineVarRegex = /:\s*([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*[({])/;
        const match = option.match(alpineVarRegex);
        const alpineVars = match ? [match[1]] : [];

        // Replace Alpine variables with their actual values from the data stack
        alpineVars.forEach((varName) => {
          for (const data of dataStack) {
            if (data.hasOwnProperty(varName)) {
              // Replace the variable with its stringified value
              option = option.replace(
                new RegExp(`\\b${varName}\\b`, "g"),
                `"${varName}"`
              ); // Keep the variable name as a string for later evaluation
              break;
            }
          }
        });

        // Replace single quotes with double quotes, then wrap remaining identifiers
        option = option
          .replace(/'([^']+)'/g, '"$1"') // Replace single quotes with double quotes
          .replace(
            /(?<!['"])(\b(?<![.0-9])[a-z_][a-z0-9_]*\b(\((?:[^()]|\([^()]*\))*\))?)/g,
            '"$1"'
          );

        option = JSON.parse(option);
        const value = Object.values(option)[0];

        // Handle function imports
        handleFunctionImports(option, value, evaluate);

        // Now handle the Alpine reactive values
        const key = Object.keys(option)[0];
        if (typeof value === "string" && alpineVars.includes(value)) {
          option[key] = evaluateLater(value);
        }

        return option;
      } catch (e) {
        console.warn("Invalid x-motion expression: ", e, option);
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
function handleFunctionImports(option, value, evaluate) {
  const looksLikeFunction =
    typeof value === "string" && value.match(/.*\(.*?\)/) !== null;

  if (looksLikeFunction) {
    // split on function name: before '(' then args without the end bracket
    const [fnName, brackets] = value.split(/(?=\()/);

    // remove brackets from args
    let args = brackets.replace(/[()]/g, "");
    args = args === "" ? {} : evaluate(args);

    const key = Object.keys(option)[0];

    if (imports.has(fnName)) {
      option[fnName] = imports.get(fnName).then((moduleBundle) => {
        option[key] = moduleBundle[fnName](args);
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
