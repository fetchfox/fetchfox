import { MediaExporter } from '../../src/index.js';
import assert from 'assert';
import { setTestTimeout } from '../lib/util.js';

describe('Export Media', function () {

  // Media exports take time
  setTestTimeout(this, 10 * 1000);

  it('should export pdf', async () => {
    const url = 'https://arxiv.org/pdf/2401.14196';
    const exporter = new MediaExporter();
    const { s3Url, fileSize } = await exporter.export(url);

    assert.ok(s3Url, 'export url should not be empty');
    assert.ok(fileSize > 0, 'file size should be greater than 0');
  });

  it('should export image', async () => {
    const url = 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg';
    const exporter = new MediaExporter();
    const { s3Url, fileSize } = await exporter.export(url);

    assert.ok(s3Url, 'export url should not be empty');
    assert.ok(fileSize > 0, 'file size should be greater than 0');
  });

  it('should export youtube video', async () => {
    const url = 'https://www.youtube.com/shorts/N1934B5vaGI';
    const exporter = new MediaExporter();
    const { s3Url, fileSize } = await exporter.export(url);

    assert.ok(s3Url, 'export url should not be empty');
    assert.ok(fileSize > 0, 'file size should be greater than 0');
  });
});