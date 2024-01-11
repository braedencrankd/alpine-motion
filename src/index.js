import { animate, timeline } from "motion";

const unitModifiers = new Map([]);

const imports = new Map([["spring", import("motion")]]);

export default function (Alpine) {
  Alpine.directive("motion", motion);

  Alpine.magic("timeline", () => async (names, options) => {
    // dynamic import the timeline function from motion

    // console.log(Alpine.store("motion"));

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

    // console.log(names, options);
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
      animationData: options,
      el,
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
    .split(/,(?![^[\]{}()]*[\]}])/g) // Only split on commas that are not inside of parentheses or brackets
    .map((option) => {
      try {
        /**
         * The Regex below will wrap all inner keys in double quotes
         * as well as expressions that need to be evaluated.
         */
        option = option.replace(
          /\b(?<![.0-9])[a-z_][a-z0-9_]*\b(\((?:[^()]|\([^()]*\))*\))?/g,
          '"$&"'
        );

        option = JSON.parse(option);

        const value = Object.values(option)[0];

        // Check if value is a function that is an import from motion
        handleFunctionImports(option, value, evaluate);

        // Check Alpine Data Stack for reactive values
        dataStack.forEach((data) => {
          const key = Object.keys(option)[0];

          if (data.hasOwnProperty(value)) {
            option[key] = evaluateLater(option[key]);
          }
        });

        return option;
      } catch (e) {
        console.warn("Invalid x-motion expression: ", e);
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
  // console.log(value);

  console.log();

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
