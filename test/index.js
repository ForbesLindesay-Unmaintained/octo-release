import assert from 'assert';
import test from 'testit';
import octoRelease from '../src';

test('upload a new release', () => {
  octoRelease(process.env.GITHUB_TOKEN, 'scriptit', 'octo-release', {
    tag: (new Date()).toISOString(),
    prerelease: true,
    files: [{name: 'file-1.txt', path: __dirname + '/assets/file-1.txt'}],
    folders: [{name: 'assets', path: __dirname + '/assets/'}],
  });
});
