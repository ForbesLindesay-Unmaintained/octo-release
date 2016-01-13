import fs from 'fs';
import Promise from 'promise';
import createGitHubClient from 'github-basic';
import request from 'then-request';
import template from 'uri-templates';
import mime from 'mime';
import {pack} from 'tar-pack';
import barrage from 'barrage';

const readFile = Promise.denodeify(fs.readFile);

function firstDefined(...args) {
  for (const arg of args) {
    if (arg !== undefined) return arg;
  }
}

function bundleFile(file) {
  if (file.buffer) return file;
  return readFile(file.path).then(buffer => {
    return [
      {
        name: file.name,
        label: file.label,
        body: buffer,
      },
    ];
  });
}
function bundleFolder(folder) {
  const stream = barrage(pack(folder.path, {ignoreFiles: []}));
  return stream.buffer('buffer').then(buffer => {
    return [
      {
        name: folder.name + '.tgz',
        label: folder.label,
        body: buffer,
      },
    ];
  });
}

function validateTag(tag) {
  const split = tag.split('/');
  for (const component of split) {
    if (component[0] === '.') throw new Error('Invalid Tag: no slash-separated component can begin with a dot "."');
    if (/\.lock/.test(component)) throw new Error('Invalid Tag: no slash-separated component can end with ".lock"');
  }
  if (tag.indexOf('..') !== -1) throw new Error('Invalid Tag: cannot have two consecutive dots ".."');
  // They cannot have ASCII control characters (i.e. bytes whose values are lower than \040, or \177 DEL), space,
  // tilde ~, caret ^, or colon : anywhere.
  for (const char of [' ', '~', '^', ':', '?', '[', ']', '*', '\\']) {
    if (tag.indexOf(char) !== -1) throw new Error('Invalid Tag: cannot have "' + char + '"');
  }
  if (tag[tag.length - 1] === '.') throw new Error('Invalid Tag: cannot end with a dot "."');
  if (tag.indexOf('@{') !== -1) throw new Error('Invalid Tag: cannot contain the sequence "@{"');
  if (tag === '@') throw new Error('Invalid Tag: cannot be the character "@"');
}

export default function createRelease(auth, username, reponame, release) {
  const client = createGitHubClient({version: 3, auth});
  const url = '/repos/' + username + '/' + reponame + '/releases';
  const opts = {
    tag_name: firstDefined(release.tag, release.name),
    target_commitish: firstDefined(release.target, 'master'),
    name: firstDefined(release.name, release.tag),
    body: firstDefined(release.body, ''),
    draft: true,
    prerelease: firstDefined(release.prerelease, false),
  };
  if (!username) {
    throw new TypeError('username is required');
  }
  if (typeof username !== 'string') {
    throw new TypeError('username should be a string but got ' + typeof username);
  }
  if (!reponame) {
    throw new TypeError('username is required');
  }
  if (typeof reponame !== 'string') {
    throw new TypeError('username should be a string but got ' + typeof reponame);
  }
  if (!opts.tag_name) {
    throw new TypeError('release.tag is required');
  }
  if (typeof opts.tag_name !== 'string') {
    throw new TypeError('release.tag should be a string but got ' + typeof opts.tag_name);
  }
  validateTag(opts.tag_name);
  if (typeof opts.target_commitish !== 'string') {
    throw new TypeError('release.target should be a string but got ' + typeof opts.target_commitish);
  }
  if (typeof opts.name !== 'string') {
    throw new TypeError('release.name should be a string but got ' + typeof opts.name);
  }
  if (typeof opts.body !== 'string') {
    throw new TypeError('release.body should be a string but got ' + typeof opts.body);
  }
  if (typeof opts.prerelease !== 'boolean') {
    throw new TypeError('release.prerelease should be a boolean but got ' + typeof opts.prerelease);
  }
  const folders = firstDefined(release.folders, []);
  const files = firstDefined(release.files, []);
  if (!Array.isArray(folders)) {
    throw new TypeError('Expected release.folders to be an array but got ' + typeof folders);
  }
  if (!Array.isArray(files)) {
    throw new TypeError('Expected release.files to be an array but got ' + typeof files);
  }
  const assets = Promise.all(folders.map(bundleFolder).concat(files.map(bundleFile))).then(folders => {
    return folders.reduce((acc, val) => acc.concat(val), []);
  });
  return Promise.all([
    client.post(url, opts),
    assets,
  ]).then(([release, assets]) => {
    const uploadUrl = template(release.upload_url);
    // Content-Type
    // name
    // label
    return Promise.all(assets.map(asset => {
      const headers = {
        'accept': client._version,
        'authorization': client._authorization,
        'user-agent': 'ForbesLindesay/github-basic',
      };
      if (asset.contentType) {
        headers['Content-Type'] = asset.contentType;
      } else {
        headers['Content-Type'] = mime.lookup(asset.name.split('.').pop());
      }
      const args = {};
      args.name = asset.name;
      if (asset.label !== undefined) args.label = asset.label;
      return request('POST', uploadUrl.fill(args), {headers, body: asset.body});
    })).then(() => {
      return client.patch(release.url, {...opts, draft: false});
    });
  });
}
