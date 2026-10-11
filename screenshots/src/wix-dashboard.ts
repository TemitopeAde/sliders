export const dashboard = {
  onBeforeUnload() {
    return { remove() {} };
  },
  async openMediaManager() {
    return { items: [] };
  },
};
