import { createContext } from "react";

export type DiffLayout = "split" | "unified";

/**
 * Lets a surrounding story (the landing page's scroll demo) drive every code
 * diff inside it. Undefined everywhere else, so diffs keep their own toggle.
 */
export const DiffLayoutContext = createContext<DiffLayout | undefined>(undefined);
