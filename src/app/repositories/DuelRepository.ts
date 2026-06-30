import { apiFetch } from '../utils/api-fetch';
import { Duel, CreateDuelParams, DuelBalance } from '../models/Duel';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PaginatedDuelResponse {
  data: Duel[];
  total: number;
}

export class DuelRepository {
  static async createDuel(
    challengedCompetitorId: string,
    params: CreateDuelParams,
    token: string,
  ): Promise<Duel> {
    const response = await apiFetch(`${API_BASE_URL}/duels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ challengedCompetitorId, ...params }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string }).message || `Failed to create duel: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  static async acceptDuel(duelId: string, token: string): Promise<Duel> {
    const response = await apiFetch(`${API_BASE_URL}/duels/${duelId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string }).message || `Failed to accept duel: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  static async declineDuel(duelId: string, token: string): Promise<void> {
    const response = await apiFetch(`${API_BASE_URL}/duels/${duelId}/decline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string }).message || `Failed to decline duel: ${response.statusText}`,
      );
    }
  }

  static async getMyDuels(token: string, status?: string): Promise<Duel[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);

    const response = await apiFetch(
      `${API_BASE_URL}/duels/my?${params.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch duels: ${response.statusText}`);
    }

    return await response.json();
  }

  static async getDuelFeed(
    limit = 10,
    offset = 0,
  ): Promise<PaginatedDuelResponse> {
    const response = await apiFetch(
      `${API_BASE_URL}/duels/feed?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch duel feed: ${response.statusText}`);
    }

    return await response.json();
  }

  static async cancelDuel(duelId: string, token: string): Promise<void> {
    const response = await apiFetch(`${API_BASE_URL}/duels/${duelId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string }).message || `Failed to cancel duel: ${response.statusText}`,
      );
    }
  }

  static async uploadProof(
    duelId: string,
    photoFile: File,
    token: string,
  ): Promise<Duel> {
    const formData = new FormData();
    formData.append('photo', photoFile);

    const response = await apiFetch(`${API_BASE_URL}/duels/${duelId}/proof`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      timeoutMs: 30_000, // longer timeout for file upload
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string }).message ||
          `Failed to upload proof: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  static async undoProof(duelId: string, token: string): Promise<Duel> {
    const response = await apiFetch(`${API_BASE_URL}/duels/${duelId}/proof`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string }).message ||
          `Failed to undo proof: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  static async getBalances(token: string): Promise<DuelBalance[]> {
    const response = await apiFetch(`${API_BASE_URL}/duels/balances`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch balances: ${response.statusText}`);
    }

    return await response.json();
  }
}
