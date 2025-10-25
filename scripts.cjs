const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const pkgPath = path.resolve(__dirname, 'package.json');
const pkg = require(pkgPath);
const version = pkg.version;
const buildNumber = pkg.build || 1;
const releaseId = pkg.releaseIdentifier || 'build';
const fullVersion = `${version}-${releaseId}${buildNumber}`;

function run(command) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit', shell: true });
}

const scripts = {
  start: () => run('node src/server.js'),
  test: () => run('NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js'),
  lint: () => run('eslint .'),
  lintFix: () => run('eslint . --fix'),
  format: () => run('prettier --write .'),

  dockerBuild: () => {
    run(`docker build -t ijimiguel/my-json-server:${fullVersion} .`);
  },

  dockerPush: () => {
    run(
      `docker tag ijimiguel/my-json-server:${fullVersion} ijimiguel/my-json-server:latest && docker push ijimiguel/my-json-server:${fullVersion} && docker push ijimiguel/my-json-server:latest`,
    );
  },

  dockerRelease: () => {
    scripts.dockerBuild();
    scripts.dockerPush();
  },

  dockerPull: () =>
    run(
      'docker rmi ijimiguel/my-json-server:latest && docker pull ijimiguel/my-json-server:latest',
    ),

  dockerStop: () => run('docker-compose down'),

  dockerCompose: () => run('UID=$(id -u) GID=$(id -g) docker-compose up -d'),

  dockerRestart: () => {
    scripts.dockerPull();
    scripts.dockerStop();
    scripts.dockerCompose();
  },

  releasePatch: () => {
    run('npm version patch');
    scripts.dockerRelease();
    scripts.incrementBuild();
    run('git push --follow-tags');
  },

  releaseMinor: () => {
    run('npm version minor');
    scripts.incrementBuild();
    scripts.dockerRelease();
    run('git push --follow-tags');
  },

  releaseMajor: () => {
    run('npm version major');
    scripts.incrementBuild();
    scripts.dockerRelease();
    run('git push --follow-tags');
  },

  incrementBuild: () => {
    const pkgRaw = fs.readFileSync(pkgPath, 'utf-8');
    const pkgJson = JSON.parse(pkgRaw);

    pkgJson.build = (pkgJson.build || 0) + 1;
    pkgJson.releaseIdentifier = releaseId;
    pkgJson.fullVersion = `${version}-${releaseId}${pkgJson.build}`;

    fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf-8');
    console.log(`Build number updated to ${pkgJson.build} version ${pkgJson.fullVersion}`);

    run('git add .');
    run('git commit -m "Build bump/version update"');
  },
};

const [, , scriptName] = process.argv;

if (!scriptName || !scripts[scriptName]) {
  console.error(`Unknown script: ${scriptName}`);
  console.log('Available scripts:', Object.keys(scripts).join(', '));
  process.exit(1);
}

scripts[scriptName]();
