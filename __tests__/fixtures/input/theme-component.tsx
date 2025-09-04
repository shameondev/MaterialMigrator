import React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) => ({
  card: {
    backgroundColor: theme.custom.builderBackgroundPrimary,
    color: theme.custom.builderContentPrimary,
    borderRadius: theme.custom.radiusMD,
    padding: theme.custom.spacing?.md || 16,
  },
  header: {
    backgroundColor: theme.custom.builderSurfaceSecondary,
    border: `1px solid ${theme.custom.builderBorderPrimary}`,
    borderRadius: theme.custom.radius2XL,
  },
}));

export const ThemeComponent = () => {
  const classes = useStyles();

  return (
    <div className={classes.card}>
      <div className={classes.header}>
        <h2>Theme Example</h2>
      </div>
      <p>Content goes here</p>
    </div>
  );
};