/* eslint-disable */

import { load } from '@gdn/envify-nconf';
load(process.cwd() + '/../../');

import alias from '@rollup/plugin-alias';
import path from 'path';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
  input: './dist/standalone/functions/src/index.js',
  output: {
    sourcemap: true,
    file: './lib/index.js',
    format: 'cjs'
  },
  external: [
    'firebase-functions',
    'firebase-functions/lib/logger',
    'source-map-support/register',
    'reflect-metadata',
    'inversify-express-utils',
    'firebase-admin',
    'domain',
    'cookie-parser',
    'passport',
    'fs',
    'url',
    'os',
    'path',
    'cookie',
    '@gdn/envify-nconf',
    'uniqid',
    'lru_map',
    'http',
    'https',
    'util',
    'express',
    'atlassian-jwt',
    'passport-jwt',
    'passport-http-bearer',
    'axios',
    'query-string',
  ],
  plugins: [
    nodeResolve({
      modulesOnly: true,
      preferBuiltins: false
    }),
    alias({
      entries: {
        API: path.join(__dirname, './dist/api/src')
      }
    }),
    terser({ keep_classnames: true, keep_fnames: true })
  ],
  onwarn(warning, rollupWarn) {
    // Remove some of the warnings noise:
    // - CIRCULAR_DEPENDENCY -> not sure if this is an issue
    // - THIS_IS_UNDEFINED -> result of using typescript polyfills
    // - EVAL -> sometimes people just use eval. Deal with it.
    if (warning.code !== 'CIRCULAR_DEPENDENCY' && warning.code !== 'THIS_IS_UNDEFINED' && warning.code !== 'EVAL') {
      rollupWarn(warning);
    }
  }
};