const screenshotUrl = (url) => `https://image.thum.io/get/width/1200/crop/900/noanimate/${url}`;

const renderPageBlocks = (url, label) => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${label}*\n${url}`,
    },
  },
  {
    type: 'image',
    image_url: screenshotUrl(url),
    alt_text: label,
  },
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Open in browser',
        },
        url,
        action_id: 'open_page',
      },
    ],
  },
];

export { renderPageBlocks };
