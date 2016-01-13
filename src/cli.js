#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import release from './index.js';

const config = Function('__dirname', 'return ' + fs.readFileSync(path.resolve('.octo-release'), 'utf8'))(process.cwd());

function arg(name, ...environmentVariables) {
  const index = process.argv.indexOf(name);
  if (index !== -1) {
    return process.argv[index + 1];
  }
  for (const n of environmentVariables) {
    if (process.env[n]) return process.env[n];
  }
}
const GITHUB_TOKEN = arg('--github-token', 'GITHUB_TOKEN');
const OWNER = arg('--owner', 'CIRCLE_PROJECT_USERNAME');
const REPO = arg('--repo', 'CIRCLE_PROJECT_REPONAME');

const target = arg('--target', 'CIRCLE_SHA1') || 'master';
const tag = 'v' + arg('--version', 'CIRCLE_BUILD_NUM');
const name = arg('--name') || ('Build ' + tag);
const prerelease = process.argv.indexOf('--prerelease') !== -1;
const body = arg('--body') || '';


release(GITHUB_TOKEN, OWNER, REPO, {
  target,
  tag,
  name,
  prerelease,
  body,
  assets: config.assets,
});
