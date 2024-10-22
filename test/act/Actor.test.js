import assert from 'assert';
import { Actor } from '../../src/act/Actor.js';

describe('Actor', function() {
  this.timeout(3 * 60 * 1000); // 3 minutes

  it('should replay', async () => {
    let copy;
    const actor = new Actor();

    try {
      await actor.start('https://www.sgtestpapersfree.com/');

      const url = actor.url();
      assert.equal(actor.url(), 'https://www.sgtestpapersfree.com/');

      // No "View" buttons on first page
      {
        const el  = await (actor.finder('Button that says "View"', 'button')).first();
        assert.equal(el, undefined);
      }

      // Click "Primary 1", and expect "View" buttons
      await actor.act('click', 'Buttons that says exactly "Primary 1"', 'a.btn');

      const expectView = async (a) => {
        const el = await (a.finder('Button that says "View"', 'button')).first();
        assert.equal(await el.innerText(), 'View');
        assert.equal(
          await el.evaluate(el => el.getAttribute('data-file')),
          'P1_HChinese_2019_Red_Swastika_test1_Papers.pdf');
      }
      await expectView(actor);

      copy = await actor.replay();
      await expectView(copy);

    } finally {
      await actor.finish();
      copy && (await copy.finish());
    }
  });

  // TODO: this test never terminates, figure out why
  it('should fork', async () => {
    const actor = new Actor();
    let fork1, fork2, fork3;

    try {
      await actor.start('https://www.sgtestpapersfree.com/');

      const url = actor.url();
      assert.equal(actor.url(), 'https://www.sgtestpapersfree.com/');

      [fork1] = await actor.fork(
        'click',
        'Buttons that contains "Primary"',
        'a.btn');

      [fork2] = await actor.fork(
        'click',
        'Buttons that contain "Primary"',
        'a.btn');

      [fork3] = await actor.fork(
        'click',
        'Buttons that contain "Primary"',
        'a.btn');

      const expect = [
        [fork1, 'P1_HChinese_2019_Red_Swastika_test1_Papers.pdf'],
        [fork2, 'P3_Chinese_2022_WA1_anglochinese.pdf'],
        [fork3, 'P5_Chinese_2022_WA1_acs.pdf'],
      ];

      for (const [fork, filename] of expect) {
        const el = await (fork.finder('Button that says "View"', 'button')).first();
        assert.equal(
          await el.evaluate(el => el.getAttribute('data-file')),
          filename);
      }
    } finally {
      console.log('Close actor and forks');
      await Promise.all([
        actor.finish(),
        fork1.finish(),
        fork2.finish(),
        fork3.finish(),
      ]);
    }
  });

  it('should get testpapersfree', async () => {
    const actor = new Actor();
    try {
      await actor.start('https://www.testpapersfree.com/secondary/sec3/index.php?level=secondary3&year=%25&subject=Pure-Chemistry&type=%25&school=%25&Submit=Show+Test+Papers');
      console.log('started');

      await actor.act('click', 'download testpaper buttons', 'input[type="submit"],button');
      const doc1 = await actor.doc();
      await new Promise(ok => setTimeout(ok, 4000));
      const doc2 = await actor.doc();

      console.log('doc1 html', doc1.html);
      console.log('');
      console.log('');
      console.log('');
      console.log('');
      console.log('');
      console.log('');
      console.log('doc2 html', doc2.html);

      // TODO: finish this test

    } finally {
      await actor.finish();
    }
  });
});
