import test from 'testit';
import octoRelease from '../src';

if (process.env.TRAVIS_TAG) {
  console.log('Refusing to build a tag');
  process.exit(0);
}
test('upload a new release', () => {
  const time = (new Date()).toISOString();
  console.log(time);
  return octoRelease(process.env.GITHUB_TOKEN, 'scriptit', 'octo-release', {
    tag: time.replace(/\:/g, ''),
    name: time,
    prerelease: true,
    assets: [
      {name: 'file-1.txt', path: __dirname + '/assets/file-1.txt'},
      {name: 'assets', path: __dirname + '/assets/'},
    ],
  });
});
