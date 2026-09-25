const DEFAULT_URL = 'https://slack.com';

const webpageCommandCallback = async ({ command, ack, respond, logger }) => {
  try {
    await ack();

    const url = command.text?.trim() || DEFAULT_URL;

    await respond({
      response_type: 'in_channel',
      text: url,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Here's the page you asked for: ${url}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Open webpage',
              },
              url,
              action_id: 'open_webpage',
            },
          ],
        },
      ],
    });
  } catch (error) {
    logger.error(error);
  }
};

export { webpageCommandCallback };
