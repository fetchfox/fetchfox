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

  async *run(cursor) {
    const schema = new Schema(cursor.ctx);
    const items = cursor.last;
    logger.info(`Schema transform ${items.length} items into ${JSON.stringify(this.schema)}`);
    const stream = schema.run(cursor.last, this.schema);
    for await (const match of stream) {
      logger.info(`Schema transformed into ${match}`);
      yield Promise.resolve(match);
    }
  }
}
