import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';
import { artefactCommandCallback } from '../../listeners/commands/artefact-command.js';

describe('artefact command', () => {
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

  it('renders the artefact url for a valid id', async () => {
    await artefactCommandCallback({
      command: { text: '4868e69f-ff8c-4d64-922f-363f39357fe9' },
      ack: fakeAck,
      respond: fakeRespond,
      logger: fakeLogger,
    });

    assert.strictEqual(fakeAck.mock.callCount(), 1);
    const callArgs = fakeRespond.mock.calls[0].arguments[0];
    assert.strictEqual(
      callArgs.text,
      'https://www.orcastrate.net/artefacts/shared/4868e69f-ff8c-4d64-922f-363f39357fe9',
    );

    const imageBlock = callArgs.blocks.find((block) => block.type === 'image');
    assert(imageBlock.image_url.includes('4868e69f-ff8c-4d64-922f-363f39357fe9'));
  });

  it('renders the artefact url when given the full url', async () => {
    await artefactCommandCallback({
      command: {
        text: 'https://www.orcastrate.net/artefacts/shared/4868e69f-ff8c-4d64-922f-363f39357fe9',
      },
      ack: fakeAck,
      respond: fakeRespond,
      logger: fakeLogger,
    });

    const callArgs = fakeRespond.mock.calls[0].arguments[0];
    assert.strictEqual(
      callArgs.text,
      'https://www.orcastrate.net/artefacts/shared/4868e69f-ff8c-4d64-922f-363f39357fe9',
    );
  });

  it('prompts for usage when no id is given', async () => {
    await artefactCommandCallback({
      command: { text: '' },
      ack: fakeAck,
      respond: fakeRespond,
      logger: fakeLogger,
    });

    const callArgs = fakeRespond.mock.calls[0].arguments[0];
    assert(callArgs.includes('Usage'));
  });

  it('rejects an invalid artefact id', async () => {
    await artefactCommandCallback({
      command: { text: 'not-an-id' },
      ack: fakeAck,
      respond: fakeRespond,
      logger: fakeLogger,
    });

    const callArgs = fakeRespond.mock.calls[0].arguments[0];
    assert(callArgs.includes("doesn't look like a valid artefact id or url"));
  });

  it('logs error when ack throws exception', async () => {
    const testError = new Error('test exception');
    fakeAck = mock.fn(() => {
      throw testError;
    });

    await artefactCommandCallback({
      command: { text: '' },
      ack: fakeAck,
      respond: fakeRespond,
      logger: fakeLogger,
    });

    assert.deepEqual(fakeLogger.error.mock.calls[0].arguments, [testError]);
  });
});
