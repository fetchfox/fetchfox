import assert from 'assert';
import { Actor } from '../../src/act/Actor.js';

describe('Actor', function() {
  this.timeout(0);

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
      console.log('ev el->', el);
      assert.equal(await el.innerText(), 'View');
      assert.equal(
        await el.evaluate(el => el.getAttribute('data-file')),
        'P1_HChinese_2019_Red_Swastika_test1_Papers.pdf');
    }
    await expectView(actor);

    console.log('history:', actor.history);
    await actor.finish();

    const copy = await actor.rerun();
    await expectView(copy);
    await copy.finish();
  });
});
