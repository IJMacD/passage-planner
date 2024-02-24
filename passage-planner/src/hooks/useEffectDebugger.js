import { useEffect } from "react";
import { usePrevious } from "./usePrevious.js";

/**
 * @see https://stackoverflow.com/a/59843241/1228394
 * @param {*} effectHook
 * @param {*} dependencies
 * @param {*} dependencyNames
 */
export function useEffectDebugger (effectHook, dependencies, dependencyNames = []) {
    const previousDeps = usePrevious(dependencies, []);

    const changedDeps = dependencies.reduce((accum, dependency, index) => {
      if (dependency !== previousDeps[index]) {
        const keyName = dependencyNames[index] || index;
        return {
          ...accum,
          [keyName]: {
            before: previousDeps[index],
            after: dependency
          }
        };
      }

      return accum;
    }, {});

    if (Object.keys(changedDeps).length) {
      console.log('[use-effect-debugger] ', changedDeps);
    }

    useEffect(effectHook, dependencies);
  };