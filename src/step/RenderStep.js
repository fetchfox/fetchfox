import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import playwright from 'playwright';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();


export const RenderStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'render',
    description: `Renders a URL field on an item in the user's desired format. Typically used for rendering HTML pages or images.`,
    args: {
      field: {
        description: `The item field containing the target URL. Field names are an EXACT string from an 'extract' step`,
        format: 'string',
        example: 'What is the URL of the linked article? Format: Absolute URL'
      },
      format: {
        description: `The user's desired output format`,
        format: 'string',
        options: ['pdf'],
        example: 'pdf'
      }
    },
  });

  constructor(args) {
    super(args);
    this.field = args.field;
    this.format = args.format;
  }

  args() {
    return super.args({
      field: this.field,
      format: this.format,
    });
  }

  async *run(cursor) {
    const browser = await playwright.chromium.launch();

    console.log('');
    console.log('');
    console.log('');
    console.log('');
    console.log('');


    try {
      for (const item of cursor.last) {
        const url = item[this.field];

        console.log('try to render:', url);

        const page = await browser.newPage();
        await page.goto(url);
        await page.waitForTimeout(2000);
        const buf = await page.pdf({ format: 'A4' });

        const key = `pdfs/${url}.pdf`;
        const params = {
          Bucket: 'ffcloud',
          Key: key,
          Body: buf,
          ContentType: 'application/pdf',
          ACL: 'public-read',
        };
        const resp = await s3.upload(params).promise();
        const pdfUrl = resp.Location;

        console.log('pdfUrl', pdfUrl);

        yield Promise.resolve({ ...item, pdfUrl });
      }
    } finally {
      await browser.close();
    }
  }
}
