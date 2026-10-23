import { apiClient } from './client';
import { DispatchParams, RouteEvaluationResponse } from '../types/routing';

export const routesApi = {
  /**
   * Health check endpoint
   */
  async checkHealth(): Promise<{ status: string; service: string }> {
    const response = await apiClient.get('/health/');
    return response.data;
  },

  /**
   * Evaluates 3 truck routes against weather and weight rules
   */
  async evaluateRoutes(params: DispatchParams): Promise<RouteEvaluationResponse> {
    const response = await apiClient.post<RouteEvaluationResponse>('/routes/evaluate/', params);
    return response.data;
  },
};
