import React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { Typography } from '@/components/ui/typography';

// Test theme reference conversion
const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: theme.custom.builderBackgroundPrimary,
    color: theme.custom.builderContentPrimary,
    borderRadius: theme.custom.radiusMD,
    padding: theme.custom.spacing?.md || 16,
  },
  header: {
    backgroundColor: theme.custom.builderSurfaceSecondary,
    border: `1px solid ${theme.custom.builderBorderPrimary}`,
    borderRadius: theme.custom.radius2XL,
    color: theme.custom.builderContentSecondary,
  },
  button: {
    backgroundColor: theme.custom.builderActionPrimary,
    color: theme.custom.builderActionText,
    borderRadius: theme.custom.radiusLG,
    '&:hover': {
      backgroundColor: theme.custom.builderActionPrimaryHover,
    },
    '&:focus': {
      outline: `2px solid ${theme.custom.builderFocusRing}`,
    }
  },
  card: {
    backgroundColor: theme.custom.card,
    borderColor: theme.custom.divider,
    boxShadow: theme.custom.shadow?.sm,
  },
  // Mixed theme and static values
  mixed: {
    padding: 20,
    backgroundColor: theme.custom.builderGrey,
    border: '2px solid red',
    borderRadius: theme.custom.radiusXL,
    color: '#ffffff',
  }
}));

export const ThemeReferencesTest = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography variant="headlineRegular16">Theme Header</Typography>
      </div>
      <button className={classes.button}>
        Action Button
      </button>
      <div className={classes.card}>
        Card content
      </div>
      <div className={classes.mixed}>
        Mixed styles
      </div>
    </div>
  );
};