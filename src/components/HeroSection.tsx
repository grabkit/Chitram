import React from 'react';

export const HeroSection: React.FC = () => {
  return (
    <section className="pt-4 pb-2 text-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-google-sans">
          Chitram<span className="text-neutral-500">.</span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 leading-relaxed">
          Stream and download your favorite movies in HD & 4K. Simple, fast, and high quality.
        </p>
      </div>
    </section>
  );
};
