import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  // Test various theme.spacing() values
  spacing0: {
    padding: theme.spacing(0), // Should become p-0
    margin: theme.spacing(0),  // Should become m-0
  },
  
  spacing1: {
    padding: theme.spacing(1), // Should become p-2 (8px)
    margin: theme.spacing(1),  // Should become m-2
  },
  
  spacing2: {
    padding: theme.spacing(2), // Should become p-4 (16px)
    margin: theme.spacing(2),  // Should become m-4
  },
  
  spacing3: {
    padding: theme.spacing(3), // Should become p-6 (24px)
    margin: theme.spacing(3),  // Should become m-6
  },
  
  spacing4: {
    padding: theme.spacing(4), // Should become p-8 (32px)
    margin: theme.spacing(4),  // Should become m-8
  },
  
  spacing8: {
    padding: theme.spacing(8), // Should become p-32 (64px)
    margin: theme.spacing(8),  // Should become m-32
  },
  
  // Test mixed spacing with other properties
  mixedSpacing: {
    padding: theme.spacing(3),
    margin: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    // Unconvertible properties should remain
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  },
  
  // Test spacing with different CSS properties
  spacingVariations: {
    paddingTop: theme.spacing(2),     // Should become pt-4
    paddingRight: theme.spacing(3),   // Should become pr-6
    paddingBottom: theme.spacing(4),  // Should become pb-8
    paddingLeft: theme.spacing(1),    // Should become pl-2
    marginTop: theme.spacing(5),      // Should become mt-10
    marginRight: theme.spacing(6),    // Should become mr-12
    marginBottom: theme.spacing(7),   // Should become mb-14
    marginLeft: theme.spacing(8),     // Should become ml-32
  },
}));

export const ThemeSpacingComponent: React.FC = () => {
  const classes = useStyles();

  return (
    <div>
      <div className={classes.spacing0}>Spacing 0</div>
      <div className={classes.spacing1}>Spacing 1</div>
      <div className={classes.spacing2}>Spacing 2</div>
      <div className={classes.spacing3}>Spacing 3</div>
      <div className={classes.spacing4}>Spacing 4</div>
      <div className={classes.spacing8}>Spacing 8</div>
      <div className={classes.mixedSpacing}>Mixed Spacing</div>
      <div className={classes.spacingVariations}>Spacing Variations</div>
    </div>
  );
};
