import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { Document } from '../../src/document/Document.js';
import { fox } from '../../src/index.js';
import { sample } from './data/chia-anime-sample.html.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('pointhound.com', function() {
  this.timeout(0);

  it('should work for simple crawl', async () => {

    const url = 'https://www.pointhound.com/flights?dateBuffer=false&flightClass=Business+%26+First+Class&originCode=JFK&originName=New+York&destinationCode=BOS&destinationName=Boston&passengerCount=1&departureDate=2024-11-23';

    const f = await fox
      .config({
        fetcher: ['playwright', { headless: false } ],
        // diskCache: os.tmpdir() + '/fetchfox-test-cache',
      });
    const out = await f
      .init(url)
      .extract({
        duration: 'Flight duration',
        time: 'Flight departure and arrival time',
        flightNumber: 'What is the flight number? If available',
        points: 'What is the number of points for this flight?',
      })
      .limit(5)
      .run(null, (partial) => {
        console.log('got partial result:', partial);
      });

    console.log('out:', out);
  })
})
