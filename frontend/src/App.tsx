import { CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header';
import { DispatchForm } from './components/DispatchForm';
import { RouteCard } from './components/RouteCard';
import { ForecastSlider } from './components/ForecastSlider';
import { MapViewport } from './components/MapViewport';
import { useTripStore } from './store/useTripStore';

export default function App() {
  const { routesData, error } = useTripStore();

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* Clean Top Header */}
      <Header />

      {/* Main Workspace: Left Sidebar + Center Map Viewport */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Dispatch Control & Comparison Sidebar */}
        <aside className="w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          {/* Dispatch Inputs Form */}
          <DispatchForm />

          {/* Evaluated Routes List */}
          <div className="p-4 flex-1">
            <h2 className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider mb-2.5">
              Available Routes (Safest First)
            </h2>

            {error && (
              <div className="p-3 mb-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
                {error}
              </div>
            )}

            {/* Recommendation Banner */}
            {routesData && routesData.recommendation_reason && (
              <div className="mb-3.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs shadow-2xs">
                <div className="font-semibold text-emerald-900 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dispatcher Recommendation
                </div>
                <div className="text-emerald-800 leading-relaxed text-[11px]">
                  {routesData.recommendation_reason}
                </div>
              </div>
            )}

            {routesData && routesData.routes.length > 0 ? (
              <div className="space-y-2.5">
                {routesData.routes.map((route) => (
                  <RouteCard key={route.id} route={route} />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs leading-relaxed">
                Enter your trip details above and click <span className="font-medium text-slate-700">"Find Safest Route"</span> to check weather and travel times on 3 highway options.
              </div>
            )}
          </div>
        </aside>

        {/* Center/Right Map Viewport */}
        <main className="flex-1 flex flex-col relative bg-slate-50">
          {/* 0-48h Forecast Scrubber Bar */}
          <ForecastSlider />

          {/* Map Area */}
          <div className="flex-1 relative">
            <MapViewport />
          </div>
        </main>
      </div>
    </div>
  );
}
