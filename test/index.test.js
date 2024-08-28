import { expect } from 'chai';
import { add } from '../src/index.js';

describe('add', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).to.equal(5);
  });
});
