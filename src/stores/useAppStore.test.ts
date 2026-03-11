import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./useAppStore";

describe("useAppStore", () => {
  beforeEach(() => {
    // Reset store state between tests
    useAppStore.setState({
      isSidebarCollapsed: false,
      isRightDrawerOpen: false,
      searchQuery: "",
      quickCreateType: null,
    });
  });

  it("has correct initial state", () => {
    const state = useAppStore.getState();
    expect(state.isSidebarCollapsed).toBe(false);
    expect(state.isRightDrawerOpen).toBe(false);
    expect(state.searchQuery).toBe("");
    expect(state.quickCreateType).toBeNull();
  });

  it("toggles sidebar", () => {
    const { toggleSidebar } = useAppStore.getState();
    toggleSidebar();
    expect(useAppStore.getState().isSidebarCollapsed).toBe(true);
    toggleSidebar();
    expect(useAppStore.getState().isSidebarCollapsed).toBe(false);
  });

  it("sets right drawer open state", () => {
    const { setRightDrawerOpen } = useAppStore.getState();
    setRightDrawerOpen(true);
    expect(useAppStore.getState().isRightDrawerOpen).toBe(true);
    setRightDrawerOpen(false);
    expect(useAppStore.getState().isRightDrawerOpen).toBe(false);
  });

  it("sets search query", () => {
    const { setSearchQuery } = useAppStore.getState();
    setSearchQuery("test query");
    expect(useAppStore.getState().searchQuery).toBe("test query");
  });

  it("opens and closes quick create", () => {
    const { openQuickCreate, closeQuickCreate } = useAppStore.getState();
    openQuickCreate("tenant");
    expect(useAppStore.getState().quickCreateType).toBe("tenant");
    closeQuickCreate();
    expect(useAppStore.getState().quickCreateType).toBeNull();
  });
});
