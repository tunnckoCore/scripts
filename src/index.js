import path from 'path';
import proc from 'process';
import { shell } from '@tunnckocore/execa';

/**
 * Collecting tasks/scripts from various places such as `scripts.config.js`
 * or even all the defined ones from `package.json`'s field `scripts`.
 * You can also pass `scripts.extends` and pass local javascript file
 * or some npm module which in turn can be either CJS or ESM written.
 *
 * @name  scripts
 * @param {Array} [argv] array of string, defaults to `process.argv.slice(2)`
 * @param {object} [options] optioanl settings, like `cwd` and `manager`, also can pass `tasks` from here
 * @returns {Promise} if object is resolved, then it's all the collected tasks/scripts from configs,
 *                    if array, then it's array of [execa][] results.
 * @public
 */
export default async function monora(cliArgv, options) {
  const argv = Array.isArray(cliArgv) ? cliArgv : proc.argv.slice(2);
  const { cwd, tasks, manager, nonStrictBehavior, env } = Object.assign(
    { cwd: proc.cwd() },
    options,
  );

  const pkgPath = resolve(cwd, 'package.json');
  const pkg = await import(pkgPath);

  const config = await loadConfig(cwd, manager);

  let scripts = Object.assign({}, pkg.scripts, pkg.monora, tasks, config);

  const cfgPresets = scripts.extends || scripts.preset || scripts.presets;

  if (cfgPresets) {
    const presetPath = cfgPresets.startsWith('.')
      ? resolve(cwd, cfgPresets)
      : cfgPresets;

    scripts = Object.assign({}, scripts, await import(presetPath));
  }

  // List all available scripts/tasks
  // if not one given, e.g. running `$ scripts`
  if (argv.length === 0) {
    return scripts;
  }

  const commands = normalizer(scripts, argv, nonStrictBehavior);
  return shell(commands, { env, stdio: 'inherit' });
}

function resolve(...args) {
  return path.resolve(path.join(...args));
}

async function loadConfig(cwd, mngr = 'yarn') {
  const config =
    (await tryCatch(() => import(resolve(cwd, 'scripts.config.js')))) ||
    (await tryCatch(() => import(resolve(cwd, `${mngr}.scripts.js`)))) ||
    (await tryCatch(() => import(resolve('..', '..', 'scripts.config.js')))) ||
    (await tryCatch(() => import(resolve('..', '..', `${mngr}.scripts.js`))));

  return config;
}

async function tryCatch(fn) {
  let val = null;

  try {
    val = await fn();
  } catch (err) {
    return null;
  }
  return val;
}

function normalizer(scripts, argv, nonStrictBehavior) {
  const name = argv.shift();
  const pre = scripts[`pre${name}`];
  const cmd = scripts[name];
  const post = scripts[`post${name}`];
  const stringify = (x) => [x].concat(argv).join(' ');

  /**
   * Pretty handy. The hooks works both for the package.json scripts
   * and for installed bin executables.
   * For example: you have installed eslint.
   * Run `monora eslint` and it will run `preeslint` hook task,
   * the eslint cli, and `posteslint` task hook (e.g. defined in npm.scripts.js)
   */

  return (
    [pre, cmd || stringify(name), post]
      .filter(Boolean)
      .reduce(function reducer(acc, script) {
        if (typeof script === 'string') {
          return acc.concat(script);
        }
        if (Array.isArray(script)) {
          return script.reduce(reducer, acc);
        }
        if (typeof script === 'function') {
          const result = script(scripts, argv);

          if (typeof result === 'string') {
            return acc.concat(result);
          }
          if (Array.isArray(result)) {
            return result.reduce(reducer, acc);
          }
        }
        return acc;
      }, [])
      .filter(Boolean)
      // append argv/args & flags
      .map((x, i, arr) => {
        const shouldPrep = nonStrictBehavior === false && i === arr.length - 1;
        if ((cmd && nonStrictBehavior) || shouldPrep) {
          return stringify(x);
        }

        return x;
      })
  );
}

// A bit more complex and featureful
// .reduce(function reducer(promise, script) {
//   return promise.then(async (acc) => {
//     if (typeof script === 'string') {
//       return shell(script, options);
//     }
//     if (Array.isArray(script)) {
//       return script.reduce(
//         (x, val) => reducer(x, val),
//         Promise.resolve(acc),
//       );
//     }
//     if (typeof script === 'function') {
//       const result = await script(scripts, argv);

//       if (typeof result === 'string') {
//         return shell(result, options);
//       }
//       return reducer(Promise.resolve(acc), result);
//     }
//     return acc;
//   });
// }, Promise.resolve([]));
