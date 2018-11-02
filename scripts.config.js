export const docs = ['docks --outfile .verb.md', 'verb'];

const globs = 'src test scripts.config.js cli.js';
export const lint = `eslint ${globs} --cache --fix --quiet --format codeframe`;

export const test = 'nyc asia';

export const precommit = [lint, test];
export const commit = ['git status --porcelain', 'git add -A', 'gitcommit -sS'];
