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
  paper: {
    width: '100%',
  },
  unused: {
    display: 'none',
  },
  empty: {}
}));

export const ColorsComponent = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.card}>
        <div className={classes.paper}>
          <p>Paper content</p>
        </div>
        <button className={classes.button}>Click me</button>
      </div>
    </div>
  );
};