import { sliders } from "./catalog";

const published = () => sliders.filter((s) => s.status === "published");

export const items = {
  query() {
    const result = {
      limit: () => result,
      eq: () => result,
      async find() {
        return {
          items: published().map((s) => ({ ...s })),
          hasNext: () => false,
        };
      },
    };
    return result;
  },
  async get(_collection: string, id: string) {
    return published().find((s) => s._id === id) ?? null;
  },
};
