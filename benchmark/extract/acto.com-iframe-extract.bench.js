import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract acto.com iframe', async function() {
  const matrix = standardMatrix();

  const expected = [{
    cta_type: 'contact form',
    cta_is_contact_form: 'yes',
    cta_css_selector: '.x-content iframe',
    cta_html_500: `<html class=" tcfpibql idc0_350"><head>\n\t\t<base href="">\n\t\t<meta charset="utf-8">\n\t\t<meta http-equiv="Content-Type" content="text/html; charset=utf-8">\n\t\t<meta name="description" content="">\n\t\t<title></title>\n\t\t<style>\n\t\t    /* Form background, width etc */\n\nbody\n{\n    font-family: "Poppins",sans-serif !important;\n}\n\t\t    \n#pardot-form {\n   width: 100%;\n   max-width: 450px;\n}\n/* Text input fields */\n#pardot-form input.text {\n    width: 100%;\n    height: 36px;\n    left: 0px;\n    top: 36px;\n    ba`,
  }];

  const cases = [
    {
      name: 'live',
      url: 'https://acto.com/',
      expected,
    },
    // {
    //   name: 'saved',
    //   url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/nmo6z205wy/https-acto-com-book-a-demo-.html',
    //   expected,
    // },
  ];

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({
        questions: {
          cta_type: 'What type of CTA is this?',
          cta_is_contact_form: 'Does the CTA lead to a contact form? Answer "yes" or "no"',
          cta_css_selector: 'What is a CSS selector that grabs the entire contact form HTML? Leave blank if CTA is not a contact form',
          cta_html_500: 'First 500 bytes of the HTML of the CTA form. If it is an iframe, get the HTML inside the iframe',
        },
        mode: 'single',
      })
      .limit(5)
      .plan();

    return itRunMatrix(
      it,
      `extract acto.com iframe`,
      wf.dump(),
      matrix,
      [
        (items) => checkItemsAI(items, expected),
      ],
      { shouldSave: true });
  }
});
