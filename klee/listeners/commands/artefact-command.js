import { renderPageBlocks } from './render-page-blocks.js';

const ARTEFACT_BASE_URL = 'https://www.orcastrate.net/artefacts/shared';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ARTEFACT_URL_PATTERN = new RegExp(
  `^${ARTEFACT_BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([0-9a-f-]+)/?$`,
  'i',
);

const resolveArtefactId = (input) => {
  if (UUID_PATTERN.test(input)) {
    return input;
  }

  const match = input.match(ARTEFACT_URL_PATTERN);
  return match ? match[1] : null;
};

const artefactCommandCallback = async ({ command, ack, respond, logger }) => {
  try {
    await ack();

    const input = command.text?.trim();

    if (!input) {
      await respond('Usage: `/artefact <artefact-id-or-url>`');
      return;
    }

    const artefactId = resolveArtefactId(input);

    if (!artefactId || !UUID_PATTERN.test(artefactId)) {
      await respond(`"${input}" doesn't look like a valid artefact id or url.`);
      return;
    }

    const url = `${ARTEFACT_BASE_URL}/${artefactId}`;

    await respond({
      response_type: 'in_channel',
      text: url,
      blocks: renderPageBlocks(url, "Here's the artefact you asked for"),
    });
  } catch (error) {
    logger.error(error);
  }
};

export { artefactCommandCallback };
