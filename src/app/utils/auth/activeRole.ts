let activeRoleMemory: string | null = null;

export function getActiveRoleMemory(): string | null {
  return activeRoleMemory;
}

export function setActiveRoleMemory(roleCd: string | null | undefined) {
  const trimmed = roleCd?.trim();
  activeRoleMemory = trimmed || null;
}

export function clearActiveRoleMemory() {
  activeRoleMemory = null;
}
