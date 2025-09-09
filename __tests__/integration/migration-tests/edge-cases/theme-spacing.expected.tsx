import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(theme => ({
  // Test mixed spacing with other properties
  mixedSpacing: {
    // Unconvertible properties should remain
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
  }
}));
export const ThemeSpacingComponent: React.FC = () => {
  const classes = useStyles();
  return <div>
      <div className="p-0 m-0">Spacing 0</div>
      <div className="p-2 m-2">Spacing 1</div>
      <div className="p-4 m-4">Spacing 2</div>
      <div className="p-6 m-6">Spacing 3</div>
      <div className="p-8 m-8">Spacing 4</div>
      <div className="p-16 m-16">Spacing 8</div>
      <div className={cn(classes.mixedSpacing, "p-6 m-4 flex flex-col bg-[var(--palette-background-paper)]")}>Mixed Spacing</div>
      <div className="pt-4 pr-6 pb-8 pl-2 mt-10 mr-12 mb-14 ml-16">Spacing Variations</div>
    </div>;
};
