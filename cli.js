#!/usr/bin/env node

'use strict';

const mod = require('module');
const proc = require('process');

const allModulesPaths = require('all-module-paths');

const cli = require('./index');

// eslint-disable-next-line no-underscore-dangle
const paths = mod._nodeModulePaths(proc.cwd());

const dirs = allModulesPaths({ paths });
const PATH = dirs.allPaths.binaries.join(':');

proc.env.PATH = `${PATH}:${process.env.PATH}`;

/* eslint-disable promise/always-return */
cli(null, { env: proc.env })
  .then((res) => {
    // if not an array, then there's no task given, so show all
    if (!Array.isArray(res)) {
      console.log('Available scripts, choose one:');

      Object.keys(res)
        .filter((x) => !['start', 'extends', 'presets'].includes(x))
        .forEach((taskName) => {
          console.log('-', taskName);
        });
    }
  })
  .catch(() => proc.exit(1));
