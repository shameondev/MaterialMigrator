import React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) => ({
  // This should be preserved - keyframes can't be converted
  '@keyframes slideIn': {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
  },
  animated: {
    animation: '$slideIn 0.3s ease-in-out',
  },
  // This should be converted - simple styles
  simple: {
    display: 'flex',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  // This should be preserved - complex selector
  nested: {
    '& .child': {
      color: theme.custom.builderContentPrimary,
      '& .grandchild': {
        fontSize: 12,
      }
    }
  },
}));

export const ComplexComponent = () => {
  const classes = useStyles();

  return (
    <div className={classes.simple}>
      <div className={classes.animated}>Animated</div>
      <div className={classes.nested}>
        <div className="child">
          <div className="grandchild">Nested</div>
        </div>
      </div>
    </div>
  );
};