import React from 'react';
import { makeStyles } from '@material-ui/core';
import { cn } from "@/lib/utils";
const useStyles = makeStyles({
  root: {
    display: 'flex',
    '@media (max-width: 600px)': {
      padding: '8px'
    }
  },
  item: {
    fontSize: '14px',
    '&:hover': {
      color: 'blue'
    }
  },
  label: {
    fontWeight: 'bold',
    '&:focus': {
      outline: 'none'
    }
  }
});
export const TestComponent = () => {
  const classes = useStyles();
  return <div className={cn(classes.root, "flex")}>
      <span className="text-sm hover:text-[blue]">Item</span>
      <span className="font-bold">Label</span>
    </div>;
};