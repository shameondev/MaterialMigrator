import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(theme => ({
  // Dark mode media queries
  darkModeCard: {
    // ✅ convertible → rounded-lg

    '@media (prefers-color-scheme: dark)': {
      // ❌ media query unconvertible
      backgroundColor: '#1f2937',
      // Should suggest dark:bg-gray-800
      color: '#ffffff',
      // Should suggest dark:text-white
      borderColor: '#374151' // Should suggest dark:border-gray-700
    } as any
  },
  // Arbitrary color values
  customColors: {
    // ✅ convertible → text-[hsl(220,100%,50%)]
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  // Complex media queries and container queries
  responsiveContainer: {
    // ✅ convertible → w-full

    '@media (min-width: 768px)': {
      // ❌ custom breakpoint unconvertible 
      width: '750px',
      // Should suggest md:w-[750px]
      margin: '0 auto' // Should suggest md:mx-auto
    } as any,
    '@media (max-width: 480px)': {
      // ❌ custom breakpoint unconvertible
      padding: '8px' // Should suggest custom responsive class
    } as any,
    '@container (min-width: 400px)': {
      // ❌ container query unconvertible
      fontSize: '18px' // Modern container query feature
    } as any
  },
  // Arbitrary properties and utilities
  arbitraryStyles: {
    // ✅ convertible → gap-4

    // Arbitrary CSS properties that don't have Tailwind equivalents
    maskImage: 'linear-gradient(to right, transparent, black)',
    // ❌ mask properties
    clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0 100%)',
    // ❌ clip-path
    filter: 'blur(4px) brightness(1.2)',
    // ❌ complex filters
    backdropFilter: 'blur(10px)' // ❌ backdrop-filter
  },
  // Print and other media queries
  printStyles: {
    // ✅ convertible → text-sm

    '@media print': {
      // ❌ print media query unconvertible
      color: '#000000',
      // Should suggest print:text-black
      backgroundColor: 'transparent',
      // Should suggest print:bg-transparent
      boxShadow: 'none' // Should suggest print:shadow-none
    } as any
  }
}));
export const DarkModeVariantsComponent: React.FC = () => {
  const classes = useStyles();
  return <div>
          <div className={cn(classes.darkModeCard, "bg-white text-black p-6 rounded-lg")}>
        <h2>Dark Mode Adaptive Card</h2>
        <p>This card should adapt to dark mode preferences</p>
      </div>
      
      <div className={cn(classes.customColors, "bg-[#123abc] border-[rgb(255, 128, 0)] text-[hsl(220, 100%, 50%)] flex")}>
        Custom arbitrary color values
      </div>
      
      <div className={cn(classes.responsiveContainer, "w-full")}>
            <div className={cn(classes.arbitraryStyles, "grid grid-cols-[repeat(auto-fit, minmax(200px, 1fr))] gap-4")}>
          Grid with arbitrary properties
        </div>
      </div>
      
      <button className="bg-[#f3f4f6] transition-all hover:bg-[#e5e7eb]">
        Interactive button with hover states
      </button>
      
      <div className={cn(classes.printStyles, "text-sm")}>
        Content optimized for print
      </div>
    </div>;
};