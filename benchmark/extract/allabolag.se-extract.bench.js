import { fox } from '../../src/index.js';
import { Item } from '../../src/item/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract ct.curaleaf.com', async function() {
  const matrix = standardMatrix();

  const expected = [];

  const wf = await fox
    .init([
      'https://www.allabolag.se/foretag/agder-gruppen-ab/kungs%C3%A4ngen/uthyrning/2KHHZMHI5YIEZ',
      'https://www.allabolag.se/foretag/beyond-consulting-ab/lund/f%C3%B6retagsutveckling/2KIRI9UI5YEHU',
      'https://www.allabolag.se/foretag/fastigheter-oscar-m%C3%A5nsson-ab/helsingborg/-/2KHJBG7I0000',
      'https://www.allabolag.se/foretag/g%C3%B6thberg-ab/flen/f%C3%B6retagsutveckling/2KHK8K3I5YEHU',
      'https://www.allabolag.se/foretag/greta-ab/enskede/designers-formgivare/2KIANM9I5YCXC',

      'https://www.allabolag.se/foretag/agder-gruppen-ab/kungs%C3%A4ngen/uthyrning/2KHHZMHI5YIEZ',
      'https://www.allabolag.se/foretag/beyond-consulting-ab/lund/f%C3%B6retagsutveckling/2KIRI9UI5YEHU',
      'https://www.allabolag.se/foretag/fastigheter-oscar-m%C3%A5nsson-ab/helsingborg/-/2KHJBG7I0000',
      'https://www.allabolag.se/foretag/g%C3%B6thberg-ab/flen/f%C3%B6retagsutveckling/2KHK8K3I5YEHU',
      'https://www.allabolag.se/foretag/greta-ab/enskede/designers-formgivare/2KIANM9I5YCXC',
    ])
    .extract({
      questions: {
        name: 'Company name',
        company_registration_number: 'What is the organisationsnummer?',
        bankruptcy_commenced: 'Has bankruptcy commenced? \'Konkurs inledde\', if yes give date YYYY-MM-DD, if no answer \'no\'',
        business_address: 'What is the postadress or alternativly adress?',
        phone_number: 'What is the Telefonnummer?',
        revenue: 'What is the Omsättning?',
        operating_profit: 'What is the Rörelseresultat efter finansiellt netto?',
        f_tax_registration: 'Is F-skatt registered? Answer yes or no.',
        vat_registration: 'Is Moms registrerad? Answer yes or no.',
        year_of_establishment: 'What is the Registreringsdatum?',
        url: 'Url of Befattningar page. Full absolute URL.'
      },
      mode: 'single',
      view: 'text',
      maxPages: 1,
      hint: 'Return a single result, even if some data is missing'
    })
    .extract({
      questions: {
        verkstallande_direktor: 'Name of Verkställande direktör',
        ledamot: 'Name of Ledamot',
        uppleant: 'Name of Suppleant'
      },
      mode: 'single',
      view: 'text',
      hint: 'Return a single result, even if some data is missing',
      maxPages: 1
    })
    .plan();

  itRunMatrix(
    it,
    `extract allabolag.se`,
    wf.dump(),
    matrix,
    [
      (items) => {
        for (const i of items) {
          console.log(new Item(i).publicOnly());
        }

        console.log('num:', items.length);

        return [0, 1];
        // return checkItemsAI(items, expected, questions);
      }
    ],
    { shouldSave: true });
});
