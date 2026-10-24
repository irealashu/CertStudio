import type { SavedCA } from '../types/cert.ts';

const VAULT_STORAGE_KEY = 'certstudio_local_ca_vault_v1';

export function getSavedCAs(): SavedCA[] {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read CA vault from localStorage', e);
    return [];
  }
}

export function saveCAToVault(ca: SavedCA): SavedCA[] {
  const current = getSavedCAs();
  const existingIndex = current.findIndex(c => c.id === ca.id);
  let updated: SavedCA[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = ca;
  } else {
    updated = [ca, ...current];
  }
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
  return updated;
}

export function deleteCAFromVault(id: string): SavedCA[] {
  const current = getSavedCAs();
  const updated = current.filter(c => c.id !== id);
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete from localStorage', e);
  }
  return updated;
}

export function exportVaultJson(): string {
  const cas = getSavedCAs();
  return JSON.stringify(cas, null, 2);
}

export function importVaultJson(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, error: 'Invalid JSON format: expected an array of CAs.' };
    }
    const current = getSavedCAs();
    const map = new Map<string, SavedCA>();
    current.forEach(c => map.set(c.id, c));
    let addedCount = 0;
    for (const item of parsed) {
      if (item && item.id && item.certPem && item.privateKeyPem) {
        map.set(item.id, item);
        addedCount++;
      }
    }
    const merged = Array.from(map.values());
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(merged));
    return { success: true, count: addedCount };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'JSON parse error';
    return { success: false, count: 0, error: msg };
  }
}
