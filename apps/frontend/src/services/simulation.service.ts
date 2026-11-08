import { apiClient } from "../api/client";
import type {
  MitigationProposal,
  OperationalAction,
} from "../types/incident-simulation.types";

export const simulationApi = {
  async getRecommendations(): Promise<MitigationProposal[]> {
    try {
      const res = await apiClient.get<MitigationProposal[]>("/simulation/recommendations");
      return res.data;
    } catch {
      // In-memory fallback if backend is offline
      return [];
    }
  },

  async validateRecommendation(id: string, simulateMismatch = false): Promise<MitigationProposal | null> {
    try {
      const res = await apiClient.post<MitigationProposal>(`/simulation/recommendations/${id}/validate`, {
        simulateMismatch,
      });
      return res.data;
    } catch {
      return null;
    }
  },

  async adjustParameter(id: string, paramId: string, newValue: number): Promise<MitigationProposal | null> {
    try {
      const res = await apiClient.post<MitigationProposal>(`/simulation/recommendations/${id}/adjust`, {
        paramId,
        newValue,
      });
      return res.data;
    } catch {
      return null;
    }
  },

  async switchAlternativeHub(id: string, newHubId: string): Promise<MitigationProposal | null> {
    try {
      const res = await apiClient.post<MitigationProposal>(`/simulation/recommendations/${id}/switch-hub`, {
        newHubId,
      });
      return res.data;
    } catch {
      return null;
    }
  },

  async approveRecommendation(id: string, operatorNotes?: string): Promise<MitigationProposal | null> {
    try {
      const res = await apiClient.post<MitigationProposal>(`/simulation/recommendations/${id}/approve`, {
        operatorNotes,
      });
      return res.data;
    } catch {
      return null;
    }
  },

  async rejectRecommendation(id: string, reason?: string): Promise<MitigationProposal | null> {
    try {
      const res = await apiClient.post<MitigationProposal>(`/simulation/recommendations/${id}/reject`, {
        reason,
      });
      return res.data;
    } catch {
      return null;
    }
  },

  async archiveRecommendation(id: string): Promise<MitigationProposal | null> {
    try {
      const res = await apiClient.post<MitigationProposal>(`/simulation/recommendations/${id}/archive`);
      return res.data;
    } catch {
      return null;
    }
  },

  async getCoordinationActions(): Promise<OperationalAction[]> {
    try {
      const res = await apiClient.get<OperationalAction[]>("/simulation/coordination-actions");
      return res.data;
    } catch {
      return [];
    }
  },
};

