import React from 'react';

export const HeroSection: React.FC = () => {
  return (
    <section className="pt-8 sm:pt-12 pb-6 sm:pb-8 flex justify-center">
      <div className="w-full max-w-[50%] mx-auto text-center px-2 sm:px-4">
        <h1 className="text-xl sm:text-3xl md:text-4xl font-medium tracking-tight text-neutral-100 font-google-sans">
          Where every frame matters
        </h1>
        <p className="text-[11px] sm:text-sm text-neutral-400 mt-2 sm:mt-2.5 leading-relaxed font-normal">
          Stream and download your favorite movies in HD & 4K. Simple, fast, and high quality. developed for all devices
        </p>
      </div>
    </section>
  );
};
