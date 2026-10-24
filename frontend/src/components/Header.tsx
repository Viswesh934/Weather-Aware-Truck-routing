import { Truck } from 'lucide-react';

export function Header() {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-3">
        <div className="bg-slate-900 text-white p-2 rounded-lg">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            WATR
            <span className="text-xs font-normal text-slate-500">
              Weather-Safe Truck Route Planner
            </span>
          </h1>
        </div>
      </div>

      <div className="text-xs text-slate-500 hidden sm:block">
        Real-Time Highway Weather &amp; Wind Rollover Safety
      </div>
    </header>
  );
}
