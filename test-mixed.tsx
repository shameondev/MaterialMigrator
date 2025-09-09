import React from 'react';
import { makeStyles } from '@material-ui/core';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(theme => ({
  item: {
    backgroundImage: 'linear-gradient(45deg, #red, #blue)' // This should be unconvertible
  }
}));
export const TestComponent = () => {
  const classes = useStyles();
  return <div className="flex gap-4">
      <div className={cn(classes.item, "p-2 bg-[red]")}>
        <span className="text-gray-600 text-sm hover:text-[blue]">Label</span>
      </div>
    </div>;
};