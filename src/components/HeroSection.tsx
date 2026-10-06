import React from 'react';

export const HeroSection: React.FC = () => {
  return (
    <section className="pt-8 sm:pt-12 pb-6 sm:pb-8 flex justify-center">
      <div className="w-full max-w-[80%] mx-auto text-center px-2 sm:px-4">
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-google-sans bg-gradient-to-b from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent drop-shadow-sm leading-tight">
          Where every frame matters
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-neutral-400 mt-2.5 sm:mt-3 leading-relaxed font-normal max-w-2xl mx-auto">
          Stream and download your favorite movies in HD & 4K. Simple, fast, and high quality. developed for all devices
        </p>
      </div>
    </section>
  );
};
