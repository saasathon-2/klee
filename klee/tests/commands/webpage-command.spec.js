import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';
import { webpageCommandCallback } from '../../listeners/commands/webpage-command.js';

describe('webpage command', () => {
  let fakeAck;
  let fakeRespond;
  let fakeLogger;

  beforeEach(() => {
    fakeAck = mock.fn();
    fakeRespond = mock.fn();
    fakeLogger = {
      error: mock.fn(),
    };
  });

  it('acknowledges and responds with the requested url', async () => {
    await webpageCommandCallback({
      command: { text: 'https://example.com' },
      ack: fakeAck,
      respond: fakeRespond,
      logger: fakeLogger,
    });

    assert.strictEqual(fakeAck.mock.callCount(), 1);
    assert.strictEqual(fakeRespond.mock.callCount(), 1);

    const callArgs = fakeRespond.mock.calls[0].arguments[0];
    assert.strictEqual(callArgs.text, 'https://example.com');
  });

  it('falls back to a default url when none is given', async () => {
    await webpageCommandCallback({
      command: { text: '' },
      ack: fakeAck,
      respond: fakeRespond,
      logger: fakeLogger,
    });

    const callArgs = fakeRespond.mock.calls[0].arguments[0];
    assert.strictEqual(callArgs.text, 'https://slack.com');
  });

  it('logs error when ack throws exception', async () => {
    const testError = new Error('test exception');
    fakeAck = mock.fn(() => {
      throw testError;
    });

    await webpageCommandCallback({
      command: { text: '' },
      ack: fakeAck,
      respond: fakeRespond,
      logger: fakeLogger,
    });

    assert.deepEqual(fakeLogger.error.mock.calls[0].arguments, [testError]);
  });
});
