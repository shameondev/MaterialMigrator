import React from 'react';
import { makeStyles } from '@material-ui/core';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(theme => ({
  root: {
    '@media (max-width: 600px)': {
      padding: '8px'
    }
  }
}));
export const TestComponent = () => {
  const classes = useStyles();
  return <div className={cn(classes.root, "flex p-4")}>
      <span className="text-sm hover:text-[blue]">Text</span>
    </div>;
};