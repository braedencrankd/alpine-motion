import { animate } from "motion";
import { snakeCaseToCamelCase, parseValue } from ".";

export default function (Alpine) {
  Alpine.directive("motion", motion);

  function motion(
    el,
    { expression, modifiers, value },
    { evaluateLater, cleanup }
  ) {
    // console.log("motion", expression, modifiers, value);
    // step one get the value of the expession
    if (value !== "animate") {
      return;
    }

    // Step two, get the modifiers and build an animation object
    const data = parseModifiers(el, modifiers);

    animate(el, { rotate: 45 }, { duration: 0.5 });

    cleanup(() => {
      console.log("cleanup");
    });
  }

  function parseModifiers(el, modifiers) {
    // let unitOffset = 0;
    const pairedModifiers = modifiers.reduce((acc, modifier, index) => {
      // Whenever we have a unit modifier, we need to offset the index by 1
      // let isUnitModifier = unitModifiers.has(modifier);
      // if (isUnitModifier) {
      //   acc.push([modifier, unitModifiers.get(modifier)]);
      //   unitOffset++;
      //   return acc;
      // }
      if ((index + unitOffset) % 2 === 0) {
        acc.push([modifier, modifiers[index + 1]]);
      }
      return acc;
    }, []);

    let options = pairedModifiers.reduce((acc, modifier, index) => {
      const [key, value] = modifier;

      acc[snakeCaseToCamelCase(key)] = parseValue(key, value);

      return acc;
    }, {});

    return options;
  }
}
