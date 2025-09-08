import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(theme => ({
  // Webkit vendor prefixes
  textClamp: {
    display: '-webkit-box',
    textOverflow: 'ellipsis'
  },
  // Mozilla vendor prefixes
  firefoxSpecific: {
    userSelect: 'none',
    // ✅ convertible → select-none
    appearance: 'none' // ✅ convertible → appearance-none
  }
}));
export const VendorPrefixComponent: React.FC = () => {
  const classes = useStyles();
  return <div className="flex [-webkit-flex-direction:column] flex-col [-webkit-justify-content:center] justify-center">
      <div className={cn(classes.textClamp, "[-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden max-w-[300px]")}>
        This is a long text that should be clamped to 3 lines with webkit line clamp
      </div>
      
      <div className="[-webkit-overflow-scrolling:touch] overflow-x-auto overflow-y-hidden p-[{CallExpression}px]">
        <div>Horizontally scrollable content</div>
      </div>
      
      <div className="pt-5 pb-[env(safe-area-inset-bottom)px]">
        Content with safe area padding
      </div>
      
      <div className={cn(classes.firefoxSpecific, "[-moz-user-select:none] [-moz-appearance:none]")}>
        Firefox-specific styling
      </div>
    </div>;
};