import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No records found', description = 'There are no items to display at this time.', action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80 text-center shadow-xs">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Inbox className="w-7 h-7" />
      </div>
      <h4 className="text-base font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
