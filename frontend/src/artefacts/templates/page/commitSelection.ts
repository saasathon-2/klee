import { createContext } from "react";

/**
 * Lets a surrounding story (the landing page's scroll demo) choose which
 * commit a git graph shows. Undefined everywhere else, so readers select
 * commits themselves.
 */
export const SelectedCommitContext = createContext<string | undefined>(undefined);
