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
    backgroundImage: 'linear-gradient(45deg, #red, #blue)', // This should be unconvertible
  },
  label: {
    color: theme.custom.builderContentTertiary,
    fontSize: '14px',
    '&:hover': {
      color: 'blue',
    }, // Nested selectors should be unconvertible
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