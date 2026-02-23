import { apiFetch } from '../utils/api-fetch';
import { LiveBet } from '../models/LiveBet';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class LiveBettingRepository {
  static async createLiveBet(
    competitorId: string,
    photoFile: File,
    authToken: string,
  ): Promise<LiveBet> {
    const formData = new FormData();
    formData.append('competitorId', competitorId);
    formData.append('photo', photoFile);

    const response = await apiFetch(`${API_BASE_URL}/live-betting`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
      timeoutMs: 30_000, // longer timeout for file upload + AI detection
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string }).message ||
          `Failed to create live bet: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  static async confirmDetection(
    liveBetId: string,
    competitorIds: string[],
    authToken: string,
  ): Promise<LiveBet> {
    const response = await apiFetch(
      `${API_BASE_URL}/live-betting/${liveBetId}/confirm`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ competitorIds }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { message?: string }).message ||
          `Failed to confirm detection: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  static async getActiveBets(authToken: string): Promise<LiveBet[]> {
    const response = await apiFetch(`${API_BASE_URL}/live-betting/active`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch active live bets: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  static async getHistory(
    authToken: string,
    limit = 10,
    offset = 0,
  ): Promise<PaginatedResponse<LiveBet>> {
    const response = await apiFetch(
      `${API_BASE_URL}/live-betting/history?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch live bet history: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  static async getRecent(limit = 10): Promise<LiveBet[]> {
    const response = await apiFetch(
      `${API_BASE_URL}/live-betting/recent?limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch recent live bets: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  static async getLiveBet(
    id: string,
    authToken: string,
  ): Promise<LiveBet> {
    const response = await apiFetch(`${API_BASE_URL}/live-betting/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch live bet: ${response.statusText}`,
      );
    }

    return await response.json();
  }
}
