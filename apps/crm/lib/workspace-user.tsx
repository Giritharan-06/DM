'use client';
import { createContext } from 'react';
import type { Role } from '@zyroz/auth/permissions';
export const WorkspaceUser = createContext<{ id: string; name: string; role: Role } | null>(null);
