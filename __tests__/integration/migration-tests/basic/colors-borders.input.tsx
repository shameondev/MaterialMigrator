import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  card: {
    backgroundColor: '#ffffff',
    color: '#000000',
    borderRadius: 4,
    border: '1px solid #e0e0e0',
    padding: 20,
  },
  button: {
    backgroundColor: '#1976d2',
    color: '#ffffff',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
  },
}));

export const ColorsComponent = () => {
  const classes = useStyles();

  return (
    <div className={classes.card}>
      <button className={classes.button}>Click me</button>
    </div>
  );
};