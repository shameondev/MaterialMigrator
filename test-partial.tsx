import React from 'react';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    gap: '16px',
  },
  item: {
    padding: '8px',
    backgroundColor: 'red',
    color: theme.custom.builderContentTertiary,
  },
  label: {
    fontSize: '14px',
    textAlign: 'center',
  },
}));

export const TestComponent = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.item}>
        <span className={classes.label}>Label</span>
      </div>
    </div>
  );
};