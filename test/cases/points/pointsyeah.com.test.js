import os from 'os';
import process from 'node:process';
import { fox } from '../../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('pointsyeah.com', function() {
  this.timeout(0);

  it('should work', async () => {
    const url = 'https://www.pointsyeah.com/search?cabins=Economy%2CPremium+Economy%2CBusiness%2CFirst&cabin=Economy&banks=Amex%2CBilt%2CCapital+One%2CChase%2CCiti%2CWF&airlineProgram=AR%2CAM%2CAC%2CKL%2CAS%2CAA%2CAV%2CDL%2CEK%2CEY%2CF9%2CIB%2CB6%2CQF%2CSK%2CNK%2CTP%2CTK%2CUA%2CVS%2CVA&tripType=1&adults=1&children=0&departure=SFO&arrival=NYC&departDate=2024-11-07&departDateSec=2024-11-10&multiday=true&bankpromotion=false&pointpromotion=false'

    const out = await fox
      .config({
        actor: [
          'playwright',
          { headless: false, timeoutWait: 10000, loadWait: 2000 }],
        fetcher: ['actor'],
        diskCache: os.tmpdir() + '/fetchfox-test-cache',
      })
      .init(url)
      .login({
        username: 'marcell.ortutay@gmail.com',
        password: '123123123aA!',
      })
      .fetch({ scroll: 5, scrollWait: 500 })
      .extract({
        flightNumber: 'The flight number',
        airline: 'The airline hosting this flight',
        points: 'Number of points you get',
        flightDate: 'Departure date of the flight YYYY-MM-DD',
        flightTime: 'start and stop time of the flight',
      })
      .run();

    console.log('out', out);
    // console.log('out', JSON.stringify(out.items, null, 2));

  });

});
