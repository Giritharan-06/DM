'use client';
import { create } from 'zustand';
export const useUI = create<{
  menu: boolean;
  setMenu: (value: boolean) => void;
}>((set) => ({ menu: false, setMenu: (menu) => set({ menu }) }));
