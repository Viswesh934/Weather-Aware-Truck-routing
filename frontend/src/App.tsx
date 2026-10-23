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
      {/* Clean Enterprise Top Header */}
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
              Route Safety Assessment
            </h2>

            {error && (
              <div className="p-3 mb-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
                {error}
              </div>
            )}

            {routesData && routesData.routes.length > 0 ? (
              <div className="space-y-2.5">
                {routesData.routes.map((route) => (
                  <RouteCard key={route.id} route={route} />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                Configure origin, destination, and vehicle weight, then click analyze to compare 3 weather-evaluated routes.
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
