import React from 'react';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.custom.unknownProperty, // This will fail
  },
  item: {
    backgroundColor: theme.custom.anotherUnknown, // This will also fail
  }
}));

export const TestComponent = () => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <span className={classes.item}>Text</span>
    </div>
  );
};