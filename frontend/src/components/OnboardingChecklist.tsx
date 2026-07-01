import React, { useState } from "react";
import { CheckCircle2, Circle, X } from "lucide-react";

interface OnboardingChecklistProps {
  venuesCount: number;
  slotsCount: number;
  hasProfileImage: boolean;
}

export default function OnboardingChecklist({ venuesCount, slotsCount, hasProfileImage }: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const tasks = [
    { label: "Add your first venue", completed: venuesCount > 0 },
    { label: "Create a booking slot", completed: slotsCount > 0 },
    { label: "Upload profile image", completed: hasProfileImage }
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  // Don't show if 100% complete
  if (completedCount === tasks.length) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-8 relative">
      <button 
        onClick={() => setDismissed(true)} 
        className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Complete your setup</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Get the most out of StageHub by completing these essential steps.
          </p>
          
          <div className="mt-4 flex items-center gap-3">
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[32px]">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        
        <div className="flex-1 space-y-3">
          {tasks.map((task, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
              {task.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
              )}
              {task.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
