import playwright from 'playwright';
import AWS from 'aws-sdk';
import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { publishToS3, publishToDropbox } from './publish.js';


export const RenderStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'render',
    description: `Renders a URL field on an item in the user's desired format. Typically used for rendering HTML pages or images.`,
    args: {
      field: {
        description: `The item field containing the target URL. Field names are an EXACT string from an 'extract' step`,
        format: 'string',
        example: 'What is the URL of the linked article? Format: Absolute URL',
        required: true,
      },
      format: {
        description: `The user's desired output format`,
        format: 'string',
        options: ['pdf'],
        example: 'pdf',
        default: 'pdf',
        required: false,
      },
      destination: {
        description: `The user's destination for the rendered output`,
        format: 'string',
        options: ['s3', 'dropbox'],
        example: 'dropbox',
        default: 's3',
        required: false,
      }
    },
  });

  constructor(args) {
    super(args);
    this.field = args.field;
    this.format = args.format || 'pdf';
    this.destination = args.destination || 's3';
  }

  args() {
    return super.args({
      field: this.field,
      format: this.format,
      destination: this.destination,
    });
  }

  async *run(cursor) {
    const browser = await playwright.chromium.launch();

    try {
      for (const item of cursor.last) {
        const url = item[this.field];

        const page = await browser.newPage();
        await page.goto(url);
        await page.waitForTimeout(2000);
        const buf = await page.pdf({ format: 'A4' });

        let renderUrl;
        switch (this.destination) {
          case 's3':
            renderUrl = await publishToS3(buf, `pdfs/${url}.pdf`);
            break;
          case 'dropbox':
            renderUrl = await publishToDropbox(buf, `/pdfs/${url.replace(/[^A-Za-z0-9]+/g, '-')}.pdf`);
            break;
          default:
            throw new Error(`unsupported publish: ${this.destination}`);
        }

        yield Promise.resolve({ ...item, renderUrl });
      }
    } finally {
      await browser.close();
    }
  }
}
