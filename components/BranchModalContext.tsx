"use client";

import { createContext, useContext, useState } from "react";

type BranchModalContextValue = {
  isOpen: boolean;
  openBranch: () => void;
  closeBranch: () => void;
};

const BranchModalContext = createContext<BranchModalContextValue | null>(null);

export function BranchModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <BranchModalContext.Provider
      value={{
        isOpen,
        openBranch: () => setIsOpen(true),
        closeBranch: () => setIsOpen(false),
      }}
    >
      {children}
    </BranchModalContext.Provider>
  );
}

export function useBranchModal() {
  const ctx = useContext(BranchModalContext);
  if (!ctx) {
    throw new Error("useBranchModal must be used within a BranchModalProvider");
  }
  return ctx;
}
