import {create} from 'zustand';

interface AppState {
    token: string;
    setToken: (token: string) => void;
    currentUser: string;
    setCurrentUser: (user: string) => void;
};

export const useAppState = create<AppState>()((set) => ({
    token: '',
    setToken: (token: string) => (set(() => ({ token }))),
    currentUser: '',
    setCurrentUser: (user: string) => set(() => ({ currentUser: user })),
}));
