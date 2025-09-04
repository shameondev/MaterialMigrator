import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    margin: 8,
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  button: {
    marginTop: 12,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 'bold',
  },
}));

export const SimpleComponent = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <h1>Hello World</h1>
      <Button className={classes.button}>
        Click me
      </Button>
    </div>
  );
};