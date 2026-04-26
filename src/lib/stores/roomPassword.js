import { writable } from 'svelte/store';

function createRoomPasswordStore() {
    const { subscribe, set, update } = writable('');

    return {
        subscribe,
        set: (/** @type {string} */ password) => {
            if (password) {
                sessionStorage.setItem('room_password', password);
            } else {
                sessionStorage.removeItem('room_password');
            }
            set(password);
        },
        load: () => {
            const stored = sessionStorage.getItem('room_password') ?? '';
            set(stored);
            return stored;
        },
        clear: () => {
            sessionStorage.removeItem('room_password');
            set('');
        }
    };
}

export const pendingRoomPassword = createRoomPasswordStore();