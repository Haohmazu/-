import {createStore} from './core/store.js';
import {mountUI} from './ui/controller.js';
import {startClock} from './ui/clock.js';
// Defer storage access to the store so denied localStorage is handled safely.
const storage = {getItem: key => window.localStorage.getItem(key), setItem: (key,value) => window.localStorage.setItem(key,value)};
mountUI(createStore({storage}));
startClock();
