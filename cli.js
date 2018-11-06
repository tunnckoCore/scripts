#!/usr/bin/env node

'use strict';

const path = require('path');
const proc = require('process');

const pkg = require('./package.json');
const cli = require('./index');

/* eslint-disable promise/always-return */

cli()
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
