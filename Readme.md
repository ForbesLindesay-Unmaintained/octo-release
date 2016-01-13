# octo-release

Create or update github releases from the command line

[![Build Status](https://img.shields.io/travis/scriptit/octo-release/master.svg)](https://travis-ci.org/scriptit/octo-release)
[![Dependency Status](https://img.shields.io/david/scriptit/octo-release/master.svg)](http://david-dm.org/scriptit/octo-release)
[![NPM version](https://img.shields.io/npm/v/octo-release.svg)](https://www.npmjs.org/package/octo-release)

## Installation

```
npm install octo-release --save
```

## Usage

```js
var octoRelease = require('octo-release');

var time = (new Date()).toISOString();
octoRelease(process.env.GITHUB_TOKEN, 'scriptit', 'octo-release', {
  tag: time.replace(/\:/g, ''),
  name: time,
  prerelease: true,
  files: [{name: 'file-1.txt', path: __dirname + '/assets/file-1.txt'}],
  folders: [{name: 'assets', path: __dirname + '/assets/'}],
}).done(function () {
  console.log('done');
});
```

## License

MIT
