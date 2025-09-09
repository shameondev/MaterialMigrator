import React from 'react';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    gap: '16px',
  },
  item: {
    padding: '8px',
    cursor: 'pointer',
  },
  label: {
    color: theme.custom.builderContentTertiary,
    fontSize: '14px',
  },
  labelActive: {
    color: theme.custom.builderActionPrimary,
    fontWeight: 'bold',
  },
}));

export const TestComponent = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.item}>
        <span className={classes.label}>Label</span>
      </div>
      <div className={classes.item}>
        <span className={classes.labelActive}>Active Label</span>
      </div>
    </div>
  );
};