import { MediaExporter } from '../../src/index.js';
import assert from 'assert';
import { setTestTimeout } from '../lib/util.js';

describe('Export Media', function () {

  setTestTimeout(this, 10 * 1000);

  it('should export pdf', async () => {
    const pdfUrl = 'https://arxiv.org/pdf/2401.14196';
    const exporter = new MediaExporter();
    const s3Url = await exporter.export(pdfUrl);

    assert.ok(s3Url, 'export url should not be empty');
  });
});