import React from 'react';
import { Film } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-900 bg-black text-neutral-500 py-8 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
            <Film className="w-3.5 h-3.5 text-black stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-white uppercase tracking-wider">Chitram</span>
          <span className="text-neutral-500">• Movie Streaming & Downloads</span>
        </div>
        <p>© {new Date().getFullYear()} Chitram. All rights reserved.</p>
      </div>
    </footer>
  );
};
