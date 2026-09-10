'use client';

import React from 'react';

/**
 * [LOCK 03] CLS-Zero Editor Skeleton
 * Matches exact dimensions of WorkflowEditor shell:
 * - Header: 56px (h-14)
 * - Body: h-[calc(100vh-3.5rem)]
 *   - Left Structure Panel: 240px (w-60)
 *   - Center Canvas: flex-1
 *   - Right Properties Panel: 288px / 320px (w-72 sm:w-80)
 */
export function EditorSkeleton() {
  return (
    <div
      className="w-screen h-screen flex flex-col overflow-hidden bg-slate-100 animate-pulse"
      data-testid="editor-skeleton"
    >
      {/* 1. Header Skeleton (h-14) */}
      <header className="h-14 border-b bg-white px-4 flex items-center justify-between shrink-0">
        {/* Left: back button & title */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 bg-slate-200 rounded-md" />
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="h-5 w-48 bg-slate-200 rounded-md" />
        </div>

        {/* Center: undo/redo & status */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-16 bg-slate-100 border border-slate-200 rounded-lg" />
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
        </div>

        {/* Right: panel toggles & action buttons */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 bg-slate-200 rounded-md" />
          <div className="h-8 w-16 bg-slate-200 rounded-md" />
          <div className="h-8 w-16 bg-blue-200 rounded-md" />
        </div>
      </header>

      {/* 2. Main 3-Panel Body Skeleton */}
      <div className="flex flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden relative">
        {/* Left Structure Panel Skeleton (w-60) */}
        <aside className="w-60 border-r bg-white flex flex-col shrink-0 h-full">
          <div className="h-11 border-b px-3 flex items-center justify-between bg-slate-50/70">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-6 w-6 bg-slate-200 rounded" />
          </div>
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-3 w-10 bg-slate-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-full bg-slate-100 rounded border border-slate-200" />
              <div className="h-8 w-full bg-slate-100 rounded border border-slate-200" />
              <div className="h-8 w-full bg-slate-100 rounded border border-slate-200" />
            </div>
          </div>
        </aside>

        {/* Center Canvas Viewport Skeleton */}
        <main className="flex-1 relative w-full h-full bg-slate-50 flex items-center justify-center">
          {/* Floating Toolbar Skeleton */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/80 border p-1.5 rounded-lg shadow-xs">
            <div className="h-8 w-24 bg-blue-200 rounded-md" />
            <div className="h-4 w-28 bg-slate-200 rounded" />
          </div>

          {/* Center Simulated Graph Skeleton Nodes */}
          <div className="flex items-center gap-20">
            <div className="w-56 h-32 bg-white border border-slate-200 rounded-lg p-3 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-200" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
              </div>
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-3/4 bg-slate-100 rounded" />
            </div>
            <div className="w-16 h-0.5 bg-slate-300" />
            <div className="w-56 h-32 bg-white border border-slate-200 rounded-lg p-3 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-200" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
              </div>
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-3/4 bg-slate-100 rounded" />
            </div>
          </div>
        </main>

        {/* Right Properties Panel Skeleton (w-72 sm:w-80) */}
        <aside className="w-72 sm:w-80 border-l bg-white flex flex-col shrink-0 h-full">
          <div className="h-11 border-b px-3 flex items-center justify-between bg-slate-50/70">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-6 w-6 bg-slate-200 rounded" />
          </div>
          <div className="h-9 border-b flex bg-slate-50/50">
            <div className="flex-1 border-b-2 border-slate-300 m-1 bg-slate-200 rounded" />
            <div className="flex-1 m-1 bg-slate-100 rounded" />
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-full bg-slate-100 border border-slate-200 rounded-md" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-8 w-full bg-slate-100 border border-slate-200 rounded-md" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-8 w-full bg-slate-100 border border-slate-200 rounded-md" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-16 w-full bg-slate-100 border border-slate-200 rounded-md" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
