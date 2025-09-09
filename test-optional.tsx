import React from 'react';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    '@media (max-width: 600px)': {
      padding: '8px',
    }
  }
});

export const TestComponent = () => {
  const classes = useStyles();
  return (
    <div className={classes?.root}>
      Optional chaining test
    </div>
  );
};