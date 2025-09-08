import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  // Dark mode media queries
  darkModeCard: {
    backgroundColor: '#ffffff',         // ✅ convertible → bg-white
    color: '#000000',                  // ✅ convertible → text-black
    padding: theme.spacing(3),         // ✅ convertible → p-6
    borderRadius: 8,                   // ✅ convertible → rounded-lg
    
    '@media (prefers-color-scheme: dark)': { // ❌ media query unconvertible
      backgroundColor: '#1f2937',     // Should suggest dark:bg-gray-800
      color: '#ffffff',               // Should suggest dark:text-white
      borderColor: '#374151',         // Should suggest dark:border-gray-700
    } as any,
  },
  
  // Arbitrary color values
  customColors: {
    backgroundColor: '#123abc',        // ✅ convertible → bg-[#123abc] arbitrary value
    borderColor: 'rgb(255, 128, 0)',   // ✅ convertible → border-[rgb(255,128,0)]
    color: 'hsl(220, 100%, 50%)',      // ✅ convertible → text-[hsl(220,100%,50%)]
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // ✅ convertible → shadow-md
    display: 'flex',                   // ✅ convertible → flex
  },
  
  // Complex media queries and container queries
  responsiveContainer: {
    width: '100%',                     // ✅ convertible → w-full
    
    '@media (min-width: 768px)': {     // ❌ custom breakpoint unconvertible 
      width: '750px',                  // Should suggest md:w-[750px]
      margin: '0 auto',                // Should suggest md:mx-auto
    } as any,
    
    '@media (max-width: 480px)': {     // ❌ custom breakpoint unconvertible
      padding: '8px',                  // Should suggest custom responsive class
    } as any,
    
    '@container (min-width: 400px)': { // ❌ container query unconvertible
      fontSize: '18px',                // Modern container query feature
    } as any,
  },
  
  // Arbitrary properties and utilities
  arbitraryStyles: {
    display: 'grid',                   // ✅ convertible → grid
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', // ❌ complex grid
    gap: theme.spacing(2),             // ✅ convertible → gap-4
    
    // Arbitrary CSS properties that don't have Tailwind equivalents
    maskImage: 'linear-gradient(to right, transparent, black)', // ❌ mask properties
    clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0 100%)', // ❌ clip-path
    filter: 'blur(4px) brightness(1.2)', // ❌ complex filters
    backdropFilter: 'blur(10px)',      // ❌ backdrop-filter
  },
  
  // Hover and focus variants with arbitrary values
  interactiveElement: {
    backgroundColor: '#f3f4f6',        // ✅ convertible → bg-gray-100
    transition: 'all 0.2s',           // ✅ convertible → transition-all duration-200
    
    '&:hover': {                       // ❌ pseudo-selector unconvertible
      backgroundColor: '#e5e7eb',      // Should suggest hover:bg-gray-200
      transform: 'scale(1.05)',        // Should suggest hover:scale-105
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)', // Should suggest hover:shadow-xl
    },
    
    '&:focus': {                       // ❌ pseudo-selector unconvertible
      outline: '2px solid #3b82f6',    // Should suggest focus:outline-blue-500
      outlineOffset: '2px',            // Should suggest focus:outline-offset-2
    },
    
    '&:active': {                      // ❌ pseudo-selector unconvertible
      transform: 'scale(0.98)',        // Should suggest active:scale-98
    }
  },
  
  // Print and other media queries
  printStyles: {
    fontSize: '14px',                  // ✅ convertible → text-sm
    
    '@media print': {                  // ❌ print media query unconvertible
      color: '#000000',                // Should suggest print:text-black
      backgroundColor: 'transparent',   // Should suggest print:bg-transparent
      boxShadow: 'none',               // Should suggest print:shadow-none
    } as any,
  }
}));

export const DarkModeVariantsComponent: React.FC = () => {
  const classes = useStyles();
  
  return (
    <div>
      <div className={classes.darkModeCard}>
        <h2>Dark Mode Adaptive Card</h2>
        <p>This card should adapt to dark mode preferences</p>
      </div>
      
      <div className={classes.customColors}>
        Custom arbitrary color values
      </div>
      
      <div className={classes.responsiveContainer}>
        <div className={classes.arbitraryStyles}>
          Grid with arbitrary properties
        </div>
      </div>
      
      <button className={classes.interactiveElement}>
        Interactive button with hover states
      </button>
      
      <div className={classes.printStyles}>
        Content optimized for print
      </div>
    </div>
  );
};