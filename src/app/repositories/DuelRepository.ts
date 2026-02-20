import { apiFetch } from '../utils/api-fetch';
import { Duel } from '../models/Duel';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PaginatedDuelResponse {
  data: Duel[];
  total: number;
}

export class DuelRepository {
  static async createDuel(
    challengedCompetitorId: string,
    stake: number,
    token: string,
  ): Promise<Duel> {
    const response = await apiFetch(`${API_BASE_URL}/duels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ challengedCompetitorId, stake }),
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
}
