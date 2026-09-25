import { sampleCommandCallback } from './sample-command.js';
import { webpageCommandCallback } from './webpage-command.js';

export const register = (app) => {
  app.command('/sample-command', sampleCommandCallback);
  app.command('/webpage', webpageCommandCallback);
};
