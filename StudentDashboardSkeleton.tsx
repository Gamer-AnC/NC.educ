import React from 'react';
import { motion } from 'motion/react';

export default function StudentDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5efff] font-sans pb-12 relative overflow-hidden select-none">
      
      {/* Header Skeleton */}
      <header className="bg-[#2f47b3] text-white py-6 px-8 shadow-lg flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 animate-pulse shrink-0 border border-white/10" />
          <div className="space-y-2 hidden sm:block">
            <div className="h-4 bg-white/35 rounded-md w-28 animate-pulse" />
            <div className="h-3 bg-white/20 rounded-md w-20 animate-pulse" />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Action buttons placeholder */}
          <div className="h-8 bg-white/10 rounded-full w-36 animate-pulse border border-white/5 hidden md:block" />
          <div className="h-8 bg-white/15 rounded-full w-28 animate-pulse border border-white/5" />
          <div className="h-8 bg-white/10 rounded-full w-24 animate-pulse border border-white/5" />
          <div className="h-8 bg-white/20 rounded-full w-20 animate-pulse shrink-0" />
        </div>
      </header>

      {/* Main Content Skeleton Area */}
      <main className="max-w-7xl mx-auto px-6 md:px-8 pt-10 space-y-10">
        
        {/* Dashboard Title Skeleton */}
        <div className="text-center md:text-left space-y-3">
          <div className="h-9 bg-indigo-200/55 rounded-2xl w-80 md:w-96 animate-pulse mx-auto md:mx-0" />
          <div className="h-4 bg-slate-300/40 rounded-xl w-64 md:w-80 animate-pulse mx-auto md:mx-0" />
        </div>

        {/* Welcome Block Skeleton Card */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-white space-y-6">
          <div className="space-y-3">
            <div className="h-8 bg-slate-200/80 rounded-2xl w-60 animate-pulse" />
            <div className="h-4 bg-slate-100/80 rounded-xl w-full max-w-2xl animate-pulse" />
            <div className="h-4 bg-slate-100/60 rounded-xl w-3/4 max-w-xl animate-pulse" />
          </div>

          {/* Access pills row */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 w-52 flex items-center gap-3 animate-pulse">
              <span className="w-1.5 h-8 bg-slate-200 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <div className="h-2.5 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3.5 bg-slate-300 rounded-md w-1/2" />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 w-60 flex items-center gap-3 animate-pulse">
              <span className="w-1.5 h-8 bg-slate-200 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <div className="h-2.5 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3.5 bg-slate-300 rounded-md w-1/3" />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 w-44 flex items-center gap-3 animate-pulse">
              <span className="w-1.5 h-8 bg-slate-200 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <div className="h-2.5 bg-slate-200 rounded-md w-2/3" />
                <div className="h-3.5 bg-slate-300 rounded-md w-1/2" />
              </div>
            </div>
          </div>

          {/* Premium banner box skeleton */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4 w-full">
              <div className="w-12 h-12 bg-slate-200 rounded-2xl animate-pulse shrink-0" />
              <div className="space-y-2.5 flex-1">
                <div className="h-4 bg-slate-200 rounded-xl w-48 animate-pulse" />
                <div className="h-3.5 bg-slate-100/80 rounded-lg w-full max-w-md animate-pulse" />
              </div>
            </div>
            <div className="w-32 h-12 bg-slate-200 rounded-2xl animate-pulse shrink-0 self-end md:self-center" />
          </div>
        </div>

        {/* Major Subject Cards Grid Skeleton (5 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div 
              key={idx}
              className="bg-white p-8 rounded-[2rem] shadow-lg shadow-blue-900/5 border border-slate-50 flex flex-col gap-4"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-2xl animate-pulse shrink-0" />
              <div className="h-5 bg-slate-200 rounded-xl w-3/4 animate-pulse mt-2" />
              
              <div className="space-y-2 mt-2 flex-1">
                <div className="h-3 bg-slate-100 rounded-lg w-full animate-pulse" />
                <div className="h-3 bg-slate-100 rounded-lg w-11/12 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded-lg w-5/6 animate-pulse" />
              </div>

              <div className="h-12 bg-slate-100/80 rounded-2xl w-full animate-pulse mt-4" />
            </div>
          ))}
        </div>

        {/* Global Academic Scoreboard Skeleton */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-slate-200 rounded-xl w-52 animate-pulse" />
              <div className="h-3.5 bg-slate-150 rounded-lg w-72 animate-pulse" />
            </div>
            <div className="h-8 bg-slate-100 rounded-xl w-24 animate-pulse hidden sm:block" />
          </div>

          {/* Table headers simulation */}
          <div className="border-b border-slate-100 pb-3 hidden md:grid grid-cols-4 gap-4 px-4">
            <div className="h-3 bg-slate-200 rounded w-16" />
            <div className="h-3 bg-slate-200 rounded w-28" />
            <div className="h-3 bg-slate-200 rounded w-24" />
            <div className="h-3 bg-slate-200 rounded w-12 justify-self-end" />
          </div>

          {/* Table Rows simulation */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((rowIdx) => (
              <div 
                key={rowIdx} 
                className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 items-center animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="h-3.5 bg-slate-300 rounded w-20" />
                </div>
                <div className="h-3.5 bg-slate-200 rounded w-32 hidden md:block" />
                <div className="h-3.5 bg-slate-200 rounded w-24 hidden md:block" />
                <div className="h-3.5 bg-slate-300 rounded w-12 justify-self-end col-span-2 md:col-span-1" />
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
