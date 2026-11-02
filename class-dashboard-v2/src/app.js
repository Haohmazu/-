import {withBrowserLock} from './core/browser-commands.js';
import {mountTasks} from './ui/tasks.js';
import {createStore} from './core/store.js';
import {mountUI} from './ui/controller.js';
import {startClock} from './ui/clock.js';
// Defer storage access to the store so denied localStorage is handled safely.
const storage = {getItem: key => window.localStorage.getItem(key), setItem: (key,value) => window.localStorage.setItem(key,value)};
const store=withBrowserLock(createStore({storage}), navigator.locks);
mountTasks(store);
mountUI(store);
startClock();
