import { animate, spring, timeline, inView, scroll } from "motion";

export default function (Alpine) {
  Alpine.directive("motion", motion);

  Alpine.magic("sequence", () => async (names, options) => {
    const elements = Object.keys(Alpine.store("motion").elements)
      .filter((name) => names.includes(name))
      .reduce((acc, name) => {
        acc.push(Alpine.store("motion").elements[name]);
        return acc;
      }, []);

    const sequence = elements.map((element) => [
      element.el,
      ...Alpine.raw(element.options),
    ]);

    timeline(sequence);
  });

  Alpine.magic("motion", () => (name) => {
    /// find the element in the store by name

    if (!Alpine.store("motion")) {
      console.warn("No motion elements found");
      return;
    }

    const animationData = Alpine.store("motion").elements[name];

    if (!animationData) {
      console.warn(`x-motion:${name} not found`);
      return;
    }

    return animate(animationData.el, ...animationData.options);
  });

  Alpine.magic("animate", () => async (name, options) => {
    return animate(name, options);
  });

  Alpine.magic("scroll", () => async (callback, options) => {
    return scroll(callback, options);
  });

  async function motion(
    el,
    { expression, modifiers, value },
    { evaluateLater, evaluate, effect, cleanup }
  ) {
    const specialModifiersIndex = ["in-view", "scroll"];
    const specialModifiers = modifiers.filter((modifier) =>
      specialModifiersIndex.includes(modifier)
    );

    registerMotion(
      el,
      expression,
      effect,
      specialModifiers,
      evaluateLater,
      evaluate
    );

    cleanup(() => {
      console.log("cleanup");
    });
  }

  async function allocateAnimations(
    animationData,
    el,
    effect,
    specialModifiers
  ) {
    if (!Alpine.store("motion")) {
      Alpine.store("motion", { elements: {} });
    }
    // Running in an effect allows the animation to be run when the data changes
    effect(() => {
      animationData(async (data) => {
        const resolvedData = resolveSpringCalls(data);
        for (const [key, value] of Object.entries(resolvedData)) {
          handleSpecialModifiers(el, value, effect, specialModifiers);
          // Already exists
          if (Alpine.store("motion").elements[key]) {
            animate(el, ...value);
            return;
          }
          Alpine.store("motion").elements[key] = {
            name: key,
            options: value,
            el,
          };
        }
      });
    });
  }

  function registerMotion(
    el,
    expression,
    effect,
    specialModifiers,
    evaluateLater,
    evaluate
  ) {
    const animationData = parseExpression(expression, evaluateLater);

    // if nameless then run the animation now
    if (animationData.nameless) {
      effect(() => {
        animationData.nameless((data) => {
          handleSpecialModifiers(el, data, effect, specialModifiers);

          inView(el, () => {
            animate(el, ...data);
          });
        });
      });
      return;
    }

    // if named then store the animation
    if (animationData.named) {
      allocateAnimations(animationData.named, el, effect, specialModifiers);
    }
  }
}

async function handleSpecialModifiers(el, options, effect, specialModifiers) {
  if (specialModifiers.length === 0) return;

  //in-view
  if (specialModifiers.includes("in-view")) {
    inView(el, () => {
      animate(el, ...options);
    });
  }

  if (specialModifiers.includes("scroll")) {
    const animation = animate(el, ...options);

    // find the scroll target in options if it exists
    const scrollTarget = options.find((option) => option.scrollTarget);
    const scrollContainer = options.find((option) => option.scrollContainer);
    const scrollAxis = options.find((option) => option.scrollAxis);

    const settings = {
      target: scrollTarget ? scrollTarget.scrollTarget : undefined,
      container: scrollContainer ? scrollContainer.scrollContainer : undefined,
      axis: scrollAxis ? scrollAxis.scrollAxis : undefined,
    };

    scroll(animation, settings);
  }
}

function parseExpression(expression, evaluateLater) {
  const isSingleObject = expression.match(/^\{.*\}$/);

  if (expression.includes("spring(")) {
    // Replace spring calls with a marker object
    expression = expression.replace(
      /spring\((.*?)\)/g,
      (_, args) => `({ _springCall: true, args: [${args}] })`
    );
  }

  if (isSingleObject) {
    return {
      nameless: evaluateLater(`[${expression}]`),
    };
  }

  return {
    named: evaluateLater(expression),
  };
}

function resolveSpringCalls(data) {
  function resolveValue(value) {
    // Base case: if value is a spring call object
    if (value && typeof value === "object" && value._springCall) {
      return spring(...value.args);
    }

    // If value is an object or array, recursively resolve its values
    if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        return value.map((v) => resolveValue(v));
      }
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, resolveValue(v)])
      );
    }

    // Return primitive values as-is
    return value;
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, resolveValue(value)])
  );
}
