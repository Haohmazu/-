import {displayDefaults} from '../display/model.js?v=2.0-stage4B.0';
import {schoolDefaults,toolDefaults} from '../school/model.js?v=2.0-stage4B.0';
export const DATA_VERSION = 5;
export const STORAGE_KEY = 'class-dashboard-v2';
export function createInitialState() {
  return {schemaVersion: DATA_VERSION, revision: 0, savedAt: null,
    display:displayDefaults(),school:schoolDefaults(),...toolDefaults(),
    classroom: {name: '我們的班級'}, students: [], participation: {}, templates: [], rounds: [], rosterImports: []};
}
