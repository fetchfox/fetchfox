import assert from 'assert';
import { Actor } from '../../src/act/Actor.js';

describe('Actor', function() {
  this.timeout(3 * 60 * 1000); // 3 minutes

  it('should replay', async () => {
    const actor = new Actor();

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

    await actor.finish();

    const copy = await actor.replay();
    await expectView(copy);
    await copy.finish();
  });

  // TODO: this test never terminates, figure out why
  it('should fork', async () => {
    const actor = new Actor();

    await actor.start('https://www.sgtestpapersfree.com/');

    const url = actor.url();
    assert.equal(actor.url(), 'https://www.sgtestpapersfree.com/');

    await actor.finish();

    const fork1 = await actor.fork(
      'click',
      'Buttons that contains "Primary"',
      'a.btn');

    const fork2 = await actor.fork(
      'click',
      'Buttons that contain "Primary"',
      'a.btn');

    const fork3 = await actor.fork(
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

    await fork1.finish();
    await fork2.finish();
    return fork3.finish();
  });
});
