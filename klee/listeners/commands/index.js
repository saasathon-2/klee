import { artefactCommandCallback } from './artefact-command.js';
import { sampleCommandCallback } from './sample-command.js';

export const register = (app) => {
  app.command('/sample-command', sampleCommandCallback);
  app.command('/artefact', artefactCommandCallback);
};
