import { create } from 'zustand';

interface AppState {
    isSidebarCollapsed: boolean;
    isRightDrawerOpen: boolean;
    searchQuery: string;
    quickCreateType: string | null;
    toggleSidebar: () => void;
    setRightDrawerOpen: (isOpen: boolean) => void;
    setSearchQuery: (query: string) => void;
    openQuickCreate: (type: string) => void;
    closeQuickCreate: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    isSidebarCollapsed: false,
    isRightDrawerOpen: false,
    searchQuery: '',
    quickCreateType: null,

    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setRightDrawerOpen: (isOpen) => set({ isRightDrawerOpen: isOpen }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    openQuickCreate: (type) => set({ quickCreateType: type }),
    closeQuickCreate: () => set({ quickCreateType: null }),
}));
