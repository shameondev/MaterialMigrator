import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  // CSS Variables with mixed convertible properties
  customVariables: {
    '--primary-color': '#3b82f6',      // ❌ CSS custom property
    '--sidebar-width': '250px',        // ❌ CSS custom property  
    '--header-height': '64px',         // ❌ CSS custom property
    backgroundColor: 'var(--primary-color)', // ❌ uses CSS variable
    width: 'var(--sidebar-width)',     // ❌ uses CSS variable
    display: 'flex',                   // ✅ convertible → flex
    flexDirection: 'column',           // ✅ convertible → flex-col
  },
  
  // calc() expressions with CSS variables
  dynamicLayout: {
    height: 'calc(100vh - var(--header-height))', // ❌ complex calc with variable
    width: 'calc(100% - var(--sidebar-width))',   // ❌ complex calc with variable
    padding: 'calc(var(--spacing) * 2)',          // ❌ calc with variable
    margin: theme.spacing(2),                      // ✅ convertible → m-4
    position: 'relative',                          // ✅ convertible → relative
  },
  
  // calc() with mixed units
  complexCalc: {
    width: 'calc(50% - 20px)',         // ❌ mixed unit calc
    height: 'calc(100px + 2rem)',      // ❌ mixed unit calc
    marginTop: 'calc(1rem + 10px)',    // ❌ mixed unit calc
    fontSize: '16px',                  // ✅ convertible → text-base
    lineHeight: 1.5,                   // ✅ convertible → leading-6
  },
  
  // CSS Grid with calc()
  gridWithCalc: {
    display: 'grid',                   // ✅ convertible → grid
    gridTemplateColumns: 'repeat(auto-fit, minmax(calc(25% - 10px), 1fr))', // ❌ complex calc
    gridGap: 'calc(var(--gap) / 2)',   // ❌ calc with variable
    padding: theme.spacing(1),         // ✅ convertible → p-2
  },
  
  // env() functions for device adaptation
  safeAreaLayout: {
    paddingTop: 'env(safe-area-inset-top)',    // ❌ env() function
    paddingLeft: 'env(safe-area-inset-left)',  // ❌ env() function
    paddingRight: 'env(safe-area-inset-right)', // ❌ env() function
    paddingBottom: 'env(safe-area-inset-bottom)', // ❌ env() function
    minHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))', // ❌ complex
    backgroundColor: theme.palette.background.default, // ✅ convertible → bg-white
  },
  
  // Nested calc() and max/min functions
  advancedCalc: {
    width: 'min(calc(100% - 40px), 800px)', // ❌ nested functions with calc
    height: 'max(calc(50vh - 100px), 300px)', // ❌ nested functions with calc
    fontSize: 'clamp(14px, calc(1rem + 1vw), 24px)', // ❌ responsive calc
    display: 'block',                  // ✅ convertible → block
  }
}));

export const CSSVariablesCalcComponent: React.FC = () => {
  const classes = useStyles();
  
  return (
    <div className={classes.customVariables}>
      <div className={classes.dynamicLayout}>
        <div className={classes.complexCalc}>
          Content with calc() expressions
        </div>
        
        <div className={classes.gridWithCalc}>
          <div>Grid item 1</div>
          <div>Grid item 2</div>
          <div>Grid item 3</div>
        </div>
      </div>
      
      <div className={classes.safeAreaLayout}>
        Safe area adapted content
      </div>
      
      <div className={classes.advancedCalc}>
        Advanced calc expressions
      </div>
    </div>
  );
};