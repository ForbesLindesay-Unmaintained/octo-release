import test from 'testit';
import octoRelease from '../src';

test('upload a new release', () => {
  const time = (new Date()).toISOString();
  return octoRelease(process.env.GITHUB_TOKEN, 'scriptit', 'octo-release', {
    tag: time.replace(/\:/g, ''),
    name: time,
    prerelease: false,
    files: [{name: 'file-1.txt', path: __dirname + '/assets/file-1.txt'}],
    folders: [{name: 'assets', path: __dirname + '/assets/'}],
  });
});
