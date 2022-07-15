/* eslint-disable */

const path = require('path');
require('@gdn/envify-nconf').load(path.join(process.cwd(), '../'));

const pkg = require('./package.json');
const emulator = require('firebase-tools/lib/emulator/controller');
const firebaseConfig = require('./firebase.json');
const gulp = require('gulp');
const log = require('fancy-log');
const webpack = require('webpack');
const tools = require('firebase-tools');
const firebaseLogger = require('firebase-tools/lib/logger');
const winston = require('winston');
const tripleBeam = require("triple-beam");
const ngrok = require('ngrok');
const webpackConfig = require('./webpack.config.js');
const exitHook = require('exit-hook');
const fkill = require('fkill');
const Greenlock = require('greenlock');
const browser = require('browser-sync').create();
const { cwd, env, exit } = require('process');

firebaseLogger.logger.add(new winston.transports.Console({
  level: 'info',
  format: winston.format.printf((info) => [info.message, ...(info[tripleBeam.SPLAT] || [])]
    .filter((chunk) => typeof chunk == "string")
    .join(" ")),
}));

exitHook(async () => {
  log('Disconnecting NGROK');
  await emulator.cleanShutdown();
  await ngrok.disconnect();
  await ngrok.kill();
  fkill('ngrok').catch(() => { });
  if (firebaseConfig && firebaseConfig.emulators && firebaseConfig.emulators.pubsub) {
    fkill(`:${ firebaseConfig.emulators.pubsub.port }`);
  }
});

const tunnel = async () => {
  let retryCount = 0;
  while (retryCount <= 5) {
    try {
      log('Establishing NGROK tunnel...');
      const response = await ngrok.connect({
        proto: 'http', // http|tcp|tls
        addr: 6000, // port or network address
        hostname: env.NGROK_SUBDOMAIN, // reserved tunnel name https://alex.ngrok.io
        authtoken: env.NGROK_AUTHTOKEN, // your authtoken from ngrok.com
        region: 'eu' // one of ngrok regions (us, eu, au, ap), defaults to us
      });
      if (response !== null) return response;
    } catch (error) {
      log('NGROK tunnel is not yet available, retrying...');
      await ngrok.disconnect();
      await ngrok.kill();
      fkill('ngrok').catch(() => { });

      if (retryCount === 5) {
        log(error);
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      retryCount++;
    }
  }
};

const certificate = async () => {
  try {
    const greenlock = Greenlock.create({
      packageRoot: cwd(),
      configDir: '.greenlock/config.json',
      packageAgent: pkg.name + '/' + pkg.version,
      maintainerEmail: pkg.author || 'info@collabsoft.net',
      staging: true,
      notify: function (event, details) {
        log(`[Greenlock:${ event }`, details);
      }
    });

    await greenlock.manager.defaults({
      agreeToTerms: true,
      store: {
        module: "greenlock-store-fs",
        basePath: ".greenlock"
      }
    });

    await greenlock.add({
      subject: env.NGROK_SUBDOMAIN,
      altnames: [env.NGROK_SUBDOMAIN],
      challenges: {
        'dns-01': {
          module: '@collabsoft-net/greenlock-dns-route53',
          AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
          AWS_REGION: 'us-east-1',
          ensureSync: true
        }
      },
    });
    const certInfo = await greenlock.get({ servername: env.NGROK_SUBDOMAIN });
    return certInfo;
  } catch (error) {
    log(error);
  }
};

const build = async () => {
  waitForWebpack = true;
  webpack(webpackConfig).watch({}, (err, stats) => {
    if (err) {
      console.error(err);
    }
    initialWebpackCompileCompleted = true;
    log('[webpack:build]', stats.toString({
      chunks: false, // Makes the build much quieter
      colors: true
    }));
  });
};

const emulate = async () => {
  const emulators = [];
  if (firebaseConfig && firebaseConfig.emulators && firebaseConfig.emulators.pubsub) {
    log('[Registering emulator] PubSub');
    emulators.push(emulatePubsub());
  }

  if (emulators.length <= 0) {
    log('No emulators found');
  }

  return Promise.all(emulators);
};

const emulatePubsub = async () => {
  let retryCount = 0;
  while (retryCount <= 5) {
    try {
      log('Starting PubSub emulator...');
      await tools.emulators.start({
        only: 'pubsub',
        project: env.FB_PROJECTID,
        token: env.FIREBASE_TOKEN
      });
      return Promise.resolve();
    } catch (error) {
      log('PubSub emulator is not yet available, retrying...');
      await emulator.cleanShutdown();
      fkill(`:${ firebaseConfig.emulators.pubsub.port }`).catch(() => { });
      if (retryCount === 5) {
        log(error);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      retryCount++;
    }
  }
};

const firebase = async (done) => {
  try {
    const url = await tunnel();
    log('NGrok is up and running on ' + url);

    await certificate();

    browser.init({
      files: './public/**/*',
      proxy: 'localhost:6000',
      port: 443,
      open: false,
      https: {
        key: `./.greenlock/live/${ env.NGROK_SUBDOMAIN }/privkey.pem`,
        cert: `./.greenlock/live/${ env.NGROK_SUBDOMAIN }/bundle.pem`,
      },
      socket: {
        domain: env.AC_BASEURL
      },
      injectChanges: false
    }, async () => {
      let retryCount = 0;
      while (retryCount <= 5) {
        await tools.serve({
          project: env.FB_PROJECTID,
          port: 6000,
          only: `hosting,functions:${ env.FB_PROJECTID }`,
          tail: true
        }).then(async () => {
          done();
          exit(0);
        }).catch((err) => {
          console.warn('An error occurred while trying to run firebase, retrying..');
          console.warn(err);
        });
        retryCount++;
      }
      done();
      exit(1);
    });
  } catch (error) {
    log(error);
    done();
    exit(1);
  }
};

exports.build = build;
exports.serve = firebase;
exports.emulate = emulate;
exports.default = gulp.series(build, gulp.parallel(emulate, firebase));

