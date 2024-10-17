import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Schema } from '../schema/Schema.js';

export const SchemaStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'schema',
    description: 'Reformat items into a target schema',
    args: {
      schema: {
        description: 'The desired target schema',
        format: 'object',
        example: '{"title": "article title", "authors": ["list of authors..."]}',
        required: true,
      },
    },
  });

  constructor(args) {
    super(args);

    if (args.schema) {
      this.schema = args.schema;
    } else if (args && typeof args == 'object') {
      this.schema = args;
    }
    if (!this.schema) throw new Error('no schema'); 
  }

  async process(cursor, item, cb) {
    // TODO: use batch mode once available

    const schema = new Schema(cursor.ctx);
    const items = [item]
    logger.verbose(`Schema transform ${item} items into ${JSON.stringify(this.schema)}`);
    const stream = schema.run([item], this.schema);
    for await (const output of stream) {
      logger.verbose(`Schema transformed into ${output}`);
      const done = cb(output);
      if (done) break;
    }
  }
}
