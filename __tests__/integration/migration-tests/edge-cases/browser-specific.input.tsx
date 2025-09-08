import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  webkitSpecific: {
    // Webkit-specific properties
    WebkitAppearance: 'none',
    WebkitBackfaceVisibility: 'hidden',
    WebkitTextStroke: '1px black',
    WebkitTextFillColor: 'transparent',
    WebkitBoxReflect: 'below 2px linear-gradient(transparent 50%, rgba(255,255,255,0.3))',
    WebkitFilter: 'blur(2px)',
    WebkitMask: 'linear-gradient(90deg, transparent, black, transparent)',
    WebkitClipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    
    // Scrollbar styling
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#888',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#555',
    },
  },
  
  mozillaSpecific: {
    // Firefox-specific properties
    MozAppearance: 'none',
    MozUserSelect: 'none',
    MozBackfaceVisibility: 'hidden',
    MozTransform: 'translateZ(0)',
    MozOsxFontSmoothing: 'grayscale',
    
    // Firefox scrollbar
    scrollbarWidth: 'thin',
    scrollbarColor: '#888 #f1f1f1',
  },
  
  msSpecific: {
    // Microsoft-specific properties (legacy IE/Edge)
    msTransform: 'translateX(50px)',
    msFilter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity=50)',
    msOverflowStyle: 'none',
    msUserSelect: 'none',
    msTouchAction: 'pan-x pan-y',
  },
  
  experimentalFeatures: {
    // Experimental CSS features
    aspectRatio: '16 / 9',
    containIntrinsicSize: '300px 200px',
    contentVisibility: 'auto',
    contain: 'layout style paint',
    
    // Color functions
    color: 'oklch(0.7 0.15 180)',
    backgroundColor: 'lab(50% 20 -30)',
    
    // New layout features
    containerType: 'inline-size',
    containerName: 'card',
    
    '@container card (min-width: 300px)': {
      fontSize: '1.2rem',
      padding: '2rem',
    },
  },
  
  logicalProperties: {
    // CSS Logical Properties
    marginInlineStart: '1rem',
    marginInlineEnd: '2rem',
    marginBlockStart: '0.5rem',
    marginBlockEnd: '1rem',
    paddingInline: '1rem 2rem',
    paddingBlock: '0.5rem',
    borderInlineStartWidth: '2px',
    borderInlineEndColor: 'red',
    insetInlineStart: '10px',
    insetBlockEnd: '20px',
  },
}));

export const BrowserSpecificComponent: React.FC = () => {
  const classes = useStyles();

  return (
    <div>
      <div className={classes.webkitSpecific}>
        WebKit-specific styles (Chrome, Safari)
      </div>
      <div className={classes.mozillaSpecific}>
        Mozilla-specific styles (Firefox)
      </div>
      <div className={classes.msSpecific}>
        Microsoft-specific styles (legacy)
      </div>
      <div className={classes.experimentalFeatures}>
        Experimental CSS features
      </div>
      <div className={classes.logicalProperties}>
        CSS Logical Properties
      </div>
    </div>
  );
};