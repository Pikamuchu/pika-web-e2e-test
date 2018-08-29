import { expect, test } from '@oclif/test';

import cmd = require('../src');

describe('Test pika-web-e2e-test script', () => {
  test
    .stdout()
    .do(() => cmd.run(['https://pikamachu.github.io']))
    .it('runs e2e on https://pikamachu.github.io', ctx => {
      expect(ctx.stdout).to.contain('Opening url https://pikamachu.github.io');
    });
});
