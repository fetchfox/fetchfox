import { fox } from '../../src/index.js';
import { Item } from '../../src/item/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI, checkAtLeast } from '../lib/checks.js';

describe('extract finefettle.com', async function() {
  const matrix = standardMatrix();

  const expected = [
    {
      product_name: 'Theraplant - Lato 41 (H) T22.04% Flower C0040000503 *NP',
      product_weight: '3.5G',
      product_strength: 'THC 22.05%',
      product_description: 'Theraplant - Lato 41 (H) T22.04% Flower C0040000503 *NP',
      product_strain: 'Hybrid',
      product_price: '$36.00'
    },
    {
      product_name: 'Theraplant - Purple Push P (I) Flower C0040000750',
      product_weight: '3.5G',
      product_strength: 'THC 19.81%',
      product_description: 'Theraplant - Purple Push P (I) Flower C0040000750',
      product_strain: 'Indica',
      product_price: '$36.00'
    },
    {
      product_name: 'Theraplant - P Haze (S) Flower C0040000589',
      product_weight: '3.5G',
      product_strength: 'THC 23.89%',
      product_description: 'Theraplant',
      product_strain: 'Sativa',
      product_price: '$42.00'
    },
    {
      product_name: 'Theraplant - Gas Face (H) Flower C0040000587',
      product_weight: '3.5G',
      product_strength: 'THC 20.22%',
      product_description: 'Theraplant - Gas Face (H) Flower C0040000587',
      product_strain: 'Hybrid',
      product_price: '$36.00'
    },
    {
      product_name: 'Theraplant - Gas Face (H) Flower C0040000780',
      product_weight: '3.5g',
      product_strength: 'THC 20.34%',
      product_description: 'Flower',
      product_strain: 'Hybrid',
      product_price: '$36.00'
    },
    {
      product_name: "Theraplant - Grand Pappy's Chillemon (S) Flower C0040000808",
      product_weight: '(3.5G)',
      product_strength: 'THC 24.48%',
      product_description: "Theraplant - Grand Pappy's Chillemon (S) Flower C0040000808",
      product_strain: 'Sativa',
      product_price: '$42.00'
    },
    {
      product_name: 'Theraplant - MAC V2 (H) Flower C0040000582',
      product_weight: '3.5g',
      product_strength: 'THC 20.86%',
      product_description: 'MAC V2 (H) Flower',
      product_strain: 'Hybrid',
      product_price: '$36.00'
    },
    {
      product_name: 'Curaleaf - A Tartz (H) Flower C0030000466',
      product_weight: '3.5G',
      product_strength: 'THC 28.12%',
      product_description: 'Curaleaf - A Tartz (H) Flower C0030000466',
      product_strain: 'Hybrid',
      product_price: '$38.00'
    },
    {
      product_name: 'Curaleaf - White Hot Guava (H) Flower C0030000573',
      product_weight: '3.5G',
      product_strength: 'THC 26.33%',
      product_description: 'Curaleaf - White Hot Guava (H) Flower C0030000573',
      product_strain: 'Hybrid',
      product_price: '$38.00'
    },
    {
      product_name: 'CTPharma - Lemon Skunk (S) T18.41% Second Cut Flower C0020024955',
      product_weight: '3.5G',
      product_strength: 'THC 18.41%',
      product_description: 'Lemon Skunk',
      product_strain: 'Sativa',
      product_price: '$28.00'
    },
    {
      product_name: 'CTPharma - Modified Haze (H) T23.52% Flower C0020025372 *NP',
      product_weight: '3.5G',
      product_strength: 'THC 23.52%',
      product_description: 'CTPharma - Modified Haze (H) T23.52% Flower C0020025372 *NP',
      product_strain: 'Hybrid',
      product_price: '$36.00'
    },
    {
      product_name: 'Curaleaf - Banana Papaya (S) Flower C0030000578',
      product_weight: '3.5g',
      product_strength: 'THC 23.72%',
      product_description: 'Curaleaf - Banana Papaya (S) Flower C0030000578',
      product_strain: 'Sativa',
      product_price: '$38.00'
    },
    {
      product_name: 'CTPharma - Mendo Cooler (S) Flower C0020025703',
      product_weight: '3.5g',
      product_strength: 'THC 27.90%',
      product_description: 'CTPharma - Mendo Cooler (S) Flower C0020025703',
      product_strain: 'Sativa',
      product_price: '$50.00'
    },
    {
      product_name: 'Curaleaf - Carmelita (I) Flower C0030000581',
      product_weight: '3.5G',
      product_strength: 'THC 23.14%',
      product_description: 'Curaleaf - Carmelita (I) Flower C0030000581',
      product_strain: 'Indica',
      product_price: '$38.00'
    },
    {
      product_name: 'BRIX Cannabis - Purple Milk (I) Flower C0101000190',
      product_weight: '3.5G',
      product_strength: 'THC 28.73%',
      product_description: 'Purple Milk (I) Flower',
      product_strain: 'Indica',
      product_price: '$50.00'
    },
    {
      product_name: 'Curaleaf - True OG (I) Flower C0030000528',
      product_weight: '3.5g',
      product_strength: 'THC 19.81%',
      product_description: 'Curaleaf - True OG (I) Flower C0030000528',
      product_strain: 'Indica',
      product_price: '$38.00'
    },
    {
      product_name: 'BRIX Cannabis - Soap (S) Flower C0101000151',
      product_weight: '3.5G',
      product_strength: 'THC 27.71%',
      product_description: 'Soap (S) Flower',
      product_strain: 'Sativa',
      product_price: '$50.00'
    },
    {
      product_name: 'CTPharma - Lemon Skunk (S) T22.64% Flower C0020025377',
      product_weight: '3.5G',
      product_strength: 'THC 22.64%',
      product_description: 'Lemon Skunk',
      product_strain: 'Sativa',
      product_price: '$42.00'
    },
    {
      product_name: 'CTPharma - Hazy Fields (S) Flower C0020025683',
      product_weight: '3.5g',
      product_strength: 'THC 26.33%',
      product_description: 'CTPharma - Hazy Fields (S) Flower C0020025683',
      product_strain: 'Sativa',
      product_price: '$45.00'
    },
    {
      product_name: 'BRIX Cannabis - Gary P (H) Flower C0101000169',
      product_weight: '3.5G',
      product_strength: 'THC 24.39%',
      product_description: 'BRIX Cannabis - Gary P (H) Flower C0101000169',
      product_strain: 'Hybrid',
      product_price: '$42.00'
    },
    {
      product_name: 'CTPharma - Ghost White (I) T22.5% Flower C0020025333',
      product_weight: '3.5G',
      product_strength: 'THC 22.50%',
      product_description: 'CTPharma - Ghost White (I) T22.5% Flower C0020025333',
      product_strain: 'Indica',
      product_price: '$42.00'
    },
    {
      product_name: 'Affinity Grow - PB Breath (H) Flower C0090000354',
      product_weight: '3.5g',
      product_strength: 'THC 22.38%',
      product_description: 'Affinity Grow - PB Breath (H) Flower C0090000354',
      product_strain: 'Hybrid',
      product_price: '$42.00'
    },
    {
      product_name: 'Rythm - White Durban (S) Flower C0010000452',
      product_weight: '3.5G',
      product_strength: 'THC 24.77%',
      product_description: 'Rythm - White Durban (S) Flower C0010000452',
      product_strain: 'Sativa',
      product_price: '$42.00'
    },
    {
      product_name: 'BRIX Cannabis - Permanent Marker (I) Flower C0101000152',
      product_weight: '3.5G',
      product_strength: 'THC 24.52% CBD 0.57%',
      product_description: 'Flower',
      product_strain: 'Indica',
      product_price: '$42.00'
    },
    {
      product_name: 'Rythm - Bananaconda (H) Flower C0010000547',
      product_weight: '3.5g',
      product_strength: 'THC 26.77%',
      product_description: 'Rythm - Bananaconda (H) Flower C0010000547',
      product_strain: 'Hybrid',
      product_price: '$45.00'
    },
    {
      product_name: 'Affinity Grow - Mac 1 (H) Flower C0090000295',
      product_weight: '3.5G',
      product_strength: 'THC 23.62%',
      product_description: 'Affinity Grow - Mac 1 (H) Flower C0090000295',
      product_strain: 'Hybrid',
      product_price: '$42.00'
    },
    {
      product_name: 'Affinity Grow - Space Mints (H) Flower C0090000395',
      product_weight: '3.5G',
      product_strength: 'THC 25.82%',
      product_description: 'Affinity Grow - Space Mints (H) Flower C0090000395',
      product_strain: 'Hybrid',
      product_price: '$45.00'
    },
    {
      product_name: 'Affinity Grow - Bachelor Party (H) Flower C0090000363',
      product_weight: '3.5g',
      product_strength: 'THC 25.20%',
      product_description: 'Affinity Grow - Bachelor Party (H) Flower C0090000363',
      product_strain: 'Hybrid',
      product_price: '$45.00'
    },
    {
      product_name: 'Affinity Grow - Zangria (I) Flower C0090000372',
      product_weight: '3.5g',
      product_strength: 'THC 20.09%',
      product_description: 'Affinity Grow - Zangria (I) Flower C0090000372',
      product_strain: 'Indica',
      product_price: '$42.00'
    },
    {
      product_name: 'Affinity Grow - Speakeasy (S) Flower C0090000365',
      product_weight: '3.5G',
      product_strength: 'THC 23.14%',
      product_description: 'Affinity Grow - Speakeasy (S) Flower C0090000365',
      product_strain: 'Sativa',
      product_price: '$42.00'
    },
    {
      product_name: 'BRIX Cannabis - Mac Stomper (S) Flower C0101000189',
      product_weight: '3.5g',
      product_strength: 'THC 27.34%',
      product_description: 'Mac Stomper',
      product_strain: 'Sativa',
      product_price: '$50.00'
    },
    {
      product_name: 'Affinity Grow - Gas Breath (S) Flower C0090000328',
      product_weight: '3.5G',
      product_strength: 'THC 20.40%',
      product_description: 'Affinity Grow - Gas Breath (S) Flower C0090000328',
      product_strain: 'Hybrid',
      product_price: '$42.00'
    },
    {
      product_name: 'Curaleaf - Mr E Pupil (S) Flower C0030000431',
      product_weight: '3.5g',
      product_strength: 'THC 18.86%',
      product_description: 'Curaleaf - Mr E Pupil (S) Flower C0030000431',
      product_strain: 'Sativa',
      product_price: '$38.00'
    },
    {
      product_name: 'Affinity Grow - Grinz (H) T20.12% Flower C0090000254 *NP',
      product_weight: '3.5G',
      product_strength: 'THC 20.12%',
      product_description: 'Affinity Grow - Grinz (H) T20.12% Flower C0090000254 *NP',
      product_strain: 'Hybrid',
      product_price: '$42.00'
    },
    {
      product_name: "Affinity Grow - Ko'Zeto (H) Flower C0090000393",
      product_weight: '3.5g',
      product_strength: 'THC 25.08%',
      product_description: "Affinity Grow - Ko'Zeto (H) Flower C0090000393",
      product_strain: 'Hybrid',
      product_price: '$45.00'
    },
    {
      product_name: 'CTPharma - GMO Skunk (I) Flower C0020025622',
      product_weight: '3.5G',
      product_strength: 'THC 23.51%',
      product_description: 'CTPharma - GMO Skunk (I) Flower C0020025622',
      product_strain: 'Indica',
      product_price: '42.00'
    },
    {
      product_name: 'BRIX Cannabis - Black Cherry G (I) Flower C0101000154',
      product_weight: '3.5g',
      product_strength: 'THC 20.02%',
      product_description: 'BRIX Cannabis - Black Cherry G (I) Flower C0101000154',
      product_strain: 'Indica',
      product_price: '$42.00'
    },
    {
      product_name: 'BRIX Cannabis - Chem 4 (H) Flower C0101000193',
      product_weight: '3.5G',
      product_strength: 'THC 25.73%',
      product_description: 'BRIX Cannabis - Chem 4 (H) Flower C0101000193',
      product_strain: 'Hybrid',
      product_price: '$45.00'
    },
    {
      product_name: 'CTPharma - Motorbreath (H) T22.9% Flower C0020025399 *NP',
      product_weight: '3.5G',
      product_strength: 'THC 22.90%',
      product_description: 'CTPharma - Motorbreath (H) T22.9% Flower C0020025399 *NP',
      product_strain: 'Hybrid',
      product_price: '$42.00/3.5g'
    },
    {
      product_name: 'BRIX Cannabis - Chili Verde (I) T22.99% Flower C0101000129',
      product_weight: '3.5g',
      product_strength: 'THC 22.99%',
      product_description: 'BRIX Cannabis - Chili Verde (I) T22.99% Flower C0101000129',
      product_strain: 'Indica',
      product_price: '$42.00'
    },
    {
      product_name: 'CTPharma - Blue Sky Haze 1:1 Flower C0020025560',
      product_weight: '3.5G',
      product_strength: 'THC 10.95% CBD 15.30%',
      product_description: 'CTPharma - Blue Sky Haze 1:1 Flower C0020025560',
      product_strain: 'Hybrid',
      product_price: '$36.00'
    },
    {
      product_name: 'AGL - Headcracker (I) Flower C0010000458',
      product_weight: '3.5G',
      product_strength: 'THC 27.31%',
      product_description: 'AGL - Headcracker (I) Flower C0010000458',
      product_strain: 'Indica',
      product_price: '$50.00'
    },
    {
      product_name: 'Curaleaf - GSC (H) T17.09% Flower C0030000399',
      product_weight: '3.5G',
      product_strength: 'THC 17.08%',
      product_description: 'Curaleaf - GSC (H) T17.09% Flower C0030000399',
      product_strain: 'Hybrid',
      product_price: '$38.00'
    },
    {
      product_name: 'AGL - OMG (H) SF C0010000559',
      product_weight: '7g',
      product_strength: 'THC 26.82%',
      product_description: 'AGL - OMG (H) SF C0010000559',
      product_strain: 'Hybrid',
      product_price: '$70.00'
    },
    {
      product_name: 'Curaleaf - Apes In Space (I) Flower C0030000512',
      product_weight: '3.5g',
      product_strength: 'THC 19.42%',
      product_description: 'Curaleaf - Apes In Space (I) Flower C0030000512',
      product_strain: 'Indica',
      product_price: '$38.00'
    },
    {
      product_name: 'Curaleaf - Sunset Shortcake (H) T18.44% Flower C0030000394',
      product_weight: '3.5g',
      product_strength: 'THC 18.44%',
      product_description: 'Curaleaf - Sunset Shortcake (H) T18.44% Flower C0030000394',
      product_strain: 'Hybrid',
      product_price: '$38.00'
    },
    {
      product_name: 'AGL - LA Kush CKE (I) Flower C0010000537',
      product_weight: '3.5g',
      product_strength: 'THC 24.67%',
      product_description: 'Flower',
      product_strain: 'Indica',
      product_price: '$42.00'
    },
    {
      product_name: 'BRIX Cannabis - Gush Mintz (I) Flower C0101000186',
      product_weight: '3.5G',
      product_strength: 'THC 27.64%',
      product_description: 'BRIX Cannabis - Gush Mintz (I) Flower C0101000186',
      product_strain: 'Indica',
      product_price: '$50.00'
    },
    {
      product_name: 'Curaleaf - Mr E Pupil (S) Flower C0030000487',
      product_weight: '3.5G',
      product_strength: 'THC 19.67%',
      product_description: 'Mr E Pupil (S) Flower C0030000487',
      product_strain: 'Sativa',
      product_price: '$38.00'
    },
    {
      product_name: 'Affinity Grow - The Soap (S) Flower C0090000371',
      product_weight: '3.5G',
      product_strength: 'THC 20.67%',
      product_description: 'Affinity Grow - The Soap (S) Flower C0090000371',
      product_strain: 'Sativa',
      product_price: '$42.00'
    },
    {
      product_name: 'all:hours - Permanent Marker (H) part:timers Flower C0040000789',
      product_weight: '3.5G',
      product_strength: 'THC 21.25%',
      product_description: 'all:hours - Permanent Marker (H) part:timers Flower C0040000789',
      product_strain: 'Hybrid',
      product_price: '$42.00'
    },
    {
      product_name: 'CTPharma - Dieselato (H) Flower C0020025583',
      product_weight: '3.5g',
      product_strength: 'THC 22.18%',
      product_description: 'CTPharma - Dieselato (H) Flower C0020025583',
      product_strain: 'Hybrid',
      product_price: '$42.00'
    },
    {
      product_name: 'all:hours - Nana Mints (S) part:timers Flower C0040000719',
      product_weight: '3.5g',
      product_strength: 'THC 22.57% CBD 0.19%',
      product_description: 'Nana Mints (S) part:timers Flower',
      product_strain: 'Sativa',
      product_price: '$42.00'
    },
    {
      product_name: 'BRIX Cannabis - Mac Stomper (S) Flower C0101000162',
      product_weight: '3.5G',
      product_strength: 'THC 23.70% CBD 0.40%',
      product_description: 'BRIX Cannabis - Mac Stomper (S) Flower C0101000162',
      product_strain: 'Sativa',
      product_price: '$42.00'
    },
    {
      product_name: 'CTPharma - Sunny Stomper (H) T22.67% Flower C0020025374 *NP',
      product_weight: '3.5g',
      product_strength: 'THC 22.67%',
      product_description: 'CTPharma - Sunny Stomper (H) T22.67% Flower C0020025374 *NP',
      product_strain: 'Hybrid',
      product_price: '$38.00'
    },
    {
      product_name: 'CTPharma - Dos Mendos (H) T20.5% Flower C0020025099 *NP',
      product_weight: '3.5G',
      product_strength: 'THC 20.50%',
      product_description: 'Dos Mendos (H) T20.5% Flower',
      product_strain: 'Hybrid',
      product_price: '$36.00'
    },
    {
      product_name: 'AGL - Slapz (H) Flower C0010000490',
      product_weight: '3.5G',
      product_strength: 'THC 26.01%',
      product_description: 'AGL - Slapz (H) Flower C0010000490',
      product_strain: 'hybrid',
      product_price: '$45.00'
    },
    {
      product_name: 'Rythm - Indicol BBF (I) T23.21% Flower C0010000439',
      product_weight: '3.5g',
      product_strength: 'THC 23.21%',
      product_description: 'Rythm - Indicol BBF (I) T23.21% Flower C0010000439',
      product_strain: 'Indica',
      product_price: '$42.00'
    },
    {
      product_name: 'AGL - Night Owl Haze (S) Smalls C0010000518',
      product_weight: '7G',
      product_strength: 'THC 12.37% CBD 0.21%',
      product_description: 'AGL - Night Owl Haze (S) Smalls C0010000518',
      product_strain: 'Sativa',
      product_price: '$50.00'
    },
    {
      product_name: 'AGL - Sherb Co (I) Smalls C0010000516',
      product_weight: '7g',
      product_strength: 'THC 16.83%',
      product_description: 'Small Flower',
      product_strain: 'Indica',
      product_price: '$50.00'
    },
    {
      product_name: 'Affinity Grow - Mac 1 (H) T23.27% Flower C0090000296',
      product_weight: '3.5g',
      product_strength: 'THC 23.27%',
      product_description: 'Affinity Grow - Mac 1 (H) T23.27% Flower C0090000296',
      product_strain: 'Hybrid',
      product_price: '$48.00'
    },
    {
      product_name: 'Curaleaf - Orange Z (S) Flower C0030000559',
      product_weight: '3.5g',
      product_strength: 'THC 16.74%',
      product_description: 'Curaleaf - Orange Z (S) Flower C0030000559',
      product_strain: 'Sativa',
      product_price: '$38.00'
    }
  ];

  const cases = [
    // {
    //   name: 'live',
    //   url: 'https://www.finefettle.com/connecticut/stamford-dispensary/recreational/menu/flower',
    //   expected,
    // },

    {
      name: 'saved',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/lqynlvd6fm/https-www-finefettle-com-connecticut-stamford-dispensary-recreational-menu-flower.html',
      expected,
    },
  ];

  const questions = {
    product_name: 'name of the product being sold',
    product_weight: 'weight of the product usually in grams ',
    product_strength: 'percentages of THC / CBD',
    product_description: 'answers the question, what is being sold? for example sour diesel',
    product_strain: 'hybrid, indica, or sativa',
    product_price: 'the cost of the flower product in dollars'
  };

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({
        questions,
        mode: 'multiple',
        view: 'html',
        maxPages: 1,
      })
      .plan();

    await itRunMatrix(
      it,
      `extract finefettle.com (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => checkItemsAI(items, expected, questions),
        (items) => checkAtLeast(items, 67),
      ],
      { shouldSave: true });
  }
});
