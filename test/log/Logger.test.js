import assert from 'assert';
import os from 'os';
import { Logger } from '../../src/log/logger.js';

describe('Logger', function() {

  it('prefix job id', () => {

    const logger = new Logger({ prefix: `abc123xyz` });
    logger.trace('test trace');
    logger.debug('test debug');
    logger.info('test info');
    logger.warn('test warn');
    logger.error('test error');

  });

});
