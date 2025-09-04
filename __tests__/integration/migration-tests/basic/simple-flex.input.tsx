import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 8,
  },
}));

export const SimpleFlexComponent = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <h1>Hello World</h1>
    </div>
  );
};