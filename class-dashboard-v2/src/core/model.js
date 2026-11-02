export const DATA_VERSION = 1;
export const STORAGE_KEY = 'class-dashboard-v2';
export function createInitialState() {
  return {schemaVersion: DATA_VERSION, revision: 0, savedAt: null,
    classroom: {name: '我們的班級'}, students: []};
}
