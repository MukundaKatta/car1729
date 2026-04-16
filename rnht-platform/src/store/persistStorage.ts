import { createJSONStorage, type StateStorage } from "zustand/middleware";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const browserStorage = createJSONStorage(() =>
  typeof window === "undefined" ? noopStorage : localStorage
);
