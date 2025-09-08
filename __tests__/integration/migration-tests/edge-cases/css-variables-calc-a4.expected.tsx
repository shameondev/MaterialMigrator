import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(theme => ({
  // CSS Variables with mixed convertible properties
  customVariables: {
    '--primary-color': '#3b82f6',
    // ❌ CSS custom property
    '--sidebar-width': '250px',
    // ❌ CSS custom property  
    '--header-height': '64px'
  }
}));
export const CSSVariablesCalcComponent: React.FC = () => {
  const classes = useStyles();
  return <div className={cn(classes.customVariables, "bg-[var(--primary-color)] w-[var(--sidebar-width)px] flex flex-col")}>
      <div className="h-[calc(100vh - var(--header-height))] w-[calc(100% - var(--sidebar-width))] p-[calc(var(--spacing) * 2)px] m-[{CallExpression}px] relative">
        <div className="w-[calc(50% - 20px)] h-[calc(100px + 2rem)] mt-[calc(1rem + 10px)] text-base leading-normal">
          Content with calc() expressions
        </div>
        
        <div className="grid grid-cols-[repeat(auto-fit, minmax(calc(25% - 10px), 1fr))] gap-[calc(var(--gap) / 2)px] p-[{CallExpression}px]">
          <div>Grid item 1</div>
          <div>Grid item 2</div>
          <div>Grid item 3</div>
        </div>
      </div>
      
      <div className="pt-[env(safe-area-inset-top)px] pl-[env(safe-area-inset-left)px] pr-[env(safe-area-inset-right)px] pb-[env(safe-area-inset-bottom)px] min-h-[calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))] var(--palette-background-default)">
        Safe area adapted content
      </div>
      
      <div className="w-[min(calc(100% - 40px), 800px)] h-[max(calc(50vh - 100px), 300px)] text-[clamp(14px, calc(1rem + 1vw), 24px)] block">
        Advanced calc expressions
      </div>
    </div>;
};