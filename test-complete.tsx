import React from 'react';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    padding: '16px',
    backgroundColor: 'red',
  },
  item: {
    fontSize: '14px',
    fontWeight: 'bold',
  }
});

export const TestComponent = () => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <span className={classes.item}>Text</span>
    </div>
  );
};