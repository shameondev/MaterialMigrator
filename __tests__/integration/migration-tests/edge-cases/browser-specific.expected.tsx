import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(() => ({
  webkitSpecific: {
    // Scrollbar styling
    '&::-webkit-scrollbar': {
      width: '8px'
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1'
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#888',
      borderRadius: '4px'
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#555'
    }
  },
  mozillaSpecific: {
    // Firefox scrollbar
    scrollbarWidth: 'thin',
    scrollbarColor: '#888 #f1f1f1'
  },
  msSpecific: {
    // Microsoft-specific properties (legacy IE/Edge)
    msTransform: 'translateX(50px)',
    msFilter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity=50)',
    msOverflowStyle: 'none',
    msUserSelect: 'none',
    msTouchAction: 'pan-x pan-y'
  },
  experimentalFeatures: {
    // Experimental CSS features
    aspectRatio: '16 / 9',
    containIntrinsicSize: '300px 200px',
    contentVisibility: 'auto',
    contain: 'layout style paint',
    // New layout features
    containerType: 'inline-size',
    containerName: 'card',
    '@container card (min-width: 300px)': {
      fontSize: '1.2rem',
      padding: '2rem'
    }
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
    insetBlockEnd: '20px'
  }
}));
export const BrowserSpecificComponent: React.FC = () => {
  const classes = useStyles();
  return <div>
      <div className={cn(classes.webkitSpecific, "[-webkit-appearance:none] [-webkit-backface-visibility:hidden] [-webkit-text-stroke:1px black] [-webkit-text-fill-color:transparent] [-webkit-box-reflect:below 2px linear-gradient(transparent 50%, rgba(255,255,255,0.3))] [-webkit-filter:blur(2px)] [-webkit-mask:linear-gradient(90deg, transparent, black, transparent)] [-webkit-clip-path:polygon(50% 0%, 0% 100%, 100% 100%)]")}>
        WebKit-specific styles (Chrome, Safari)
      </div>
      <div className={cn(classes.mozillaSpecific, "[-moz-appearance:none] [-moz-user-select:none] [-moz-backface-visibility:hidden] [-moz-transform:translateZ(0)] [-moz-osx-font-smoothing:grayscale]")}>
        Mozilla-specific styles (Firefox)
      </div>
      <div className={classes.msSpecific}>
        Microsoft-specific styles (legacy)
      </div>
      <div className={cn(classes.experimentalFeatures, "text-[oklch(0.7 0.15 180)] bg-[lab(50% 20 -30)]")}>
        Experimental CSS features
      </div>
      <div className={classes.logicalProperties}>
        CSS Logical Properties
      </div>
    </div>;
};