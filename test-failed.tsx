import React from 'react';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    background: 'linear-gradient(45deg, red, blue)',
    '&:hover': {
      transform: 'scale(1.1)',
    },
  },
  item: {
    '&:before': {
      content: '"*"',
      color: 'red',
    },
  },
}));

export const TestComponent = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.item}>
        Failed migration - all unconvertible
      </div>
    </div>
  );
};