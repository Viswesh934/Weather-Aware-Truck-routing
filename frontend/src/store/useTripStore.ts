import { create } from 'zustand';
import { DispatchParams, RouteEvaluationResponse } from '../types/routing';
import { routesApi } from '../api/routesApi';

interface TripState {
  // 1. Dispatch Form Inputs
  params: DispatchParams;
  setParam: <K extends keyof DispatchParams>(key: K, value: DispatchParams[K]) => void;

  // 2. Evaluated Routes & Active Selection
  routesData: RouteEvaluationResponse | null;
  selectedRouteId: string | null;
  setSelectedRouteId: (id: string) => void;

  // 3. 0-48h Heatmap Timeline Scrubber
  forecastHour: number;
  isPlayingForecast: boolean;
  setForecastHour: (hour: number) => void;
  togglePlayForecast: () => void;
  resetForecastHour: () => void;

  // 4. Async Execution State
  isLoading: boolean;
  error: string | null;
  evaluateRoutes: () => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  params: {
    origin: 'Chicago, IL',
    destination: 'Denver, CO',
    departure_time: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
    load_weight_lbs: 35000,
    sampling_interval_miles: 25,
  },

  setParam: (key, value) =>
    set((state) => ({ params: { ...state.params, [key]: value } })),

  routesData: null,
  selectedRouteId: null,
  setSelectedRouteId: (id) => set({ selectedRouteId: id }),

  forecastHour: 0,
  isPlayingForecast: false,
  setForecastHour: (hour) => set({ forecastHour: hour }),
  togglePlayForecast: () =>
    set((state) => ({ isPlayingForecast: !state.isPlayingForecast })),
  resetForecastHour: () => set({ forecastHour: 0, isPlayingForecast: false }),

  isLoading: false,
  error: null,

  evaluateRoutes: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await routesApi.evaluateRoutes(get().params);
      set({
        routesData: data,
        selectedRouteId: data.recommended_route_id,
        forecastHour: 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Route evaluation failed',
        isLoading: false,
      });
    }
  },
}));
