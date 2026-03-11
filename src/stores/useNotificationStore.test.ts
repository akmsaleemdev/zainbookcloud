import { describe, it, expect, beforeEach } from "vitest";
import { useNotificationStore } from "./useNotificationStore";

describe("useNotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [], unreadCount: 0 });
  });

  it("has correct initial state", () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  it("adds a notification", () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: "Test", message: "Hello", type: "info" });

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.unreadCount).toBe(1);
    expect(state.notifications[0].title).toBe("Test");
    expect(state.notifications[0].isRead).toBe(false);
    expect(state.notifications[0].id).toBeTruthy();
  });

  it("adds multiple notifications in correct order (newest first)", () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ title: "First", message: "1", type: "info" });
    addNotification({ title: "Second", message: "2", type: "success" });

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.unreadCount).toBe(2);
    expect(state.notifications[0].title).toBe("Second");
    expect(state.notifications[1].title).toBe("First");
  });

  it("marks a single notification as read", () => {
    const store = useNotificationStore.getState();
    store.addNotification({ title: "A", message: "a", type: "info" });
    store.addNotification({ title: "B", message: "b", type: "warning" });

    const id = useNotificationStore.getState().notifications[0].id;
    useNotificationStore.getState().markAsRead(id);

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(1);
    expect(state.notifications.find((n) => n.id === id)?.isRead).toBe(true);
  });

  it("marks all notifications as read", () => {
    const store = useNotificationStore.getState();
    store.addNotification({ title: "A", message: "a", type: "info" });
    store.addNotification({ title: "B", message: "b", type: "error" });
    store.addNotification({ title: "C", message: "c", type: "success" });

    useNotificationStore.getState().markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.notifications.every((n) => n.isRead)).toBe(true);
  });

  it("clears all notifications", () => {
    const store = useNotificationStore.getState();
    store.addNotification({ title: "A", message: "a", type: "info" });
    store.addNotification({ title: "B", message: "b", type: "info" });

    useNotificationStore.getState().clearAll();

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  it("notification has link when provided", () => {
    const store = useNotificationStore.getState();
    store.addNotification({ title: "Nav", message: "Go", type: "info", link: "/dashboard" });

    const state = useNotificationStore.getState();
    expect(state.notifications[0].link).toBe("/dashboard");
  });
});
