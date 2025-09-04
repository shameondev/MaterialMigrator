import React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';

// Test responsive breakpoint conversion
const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'flex',
    padding: 40,
    [theme.breakpoints.down('xs')]: {
      padding: 16,
      flexDirection: 'column',
    },
    [theme.breakpoints.up('sm')]: {
      padding: 24,
      gap: 16,
    },
    [theme.breakpoints.up('md')]: {
      padding: 32,
      gap: 24,
      maxWidth: 800,
    },
    [theme.breakpoints.up('lg')]: {
      padding: 48,
      maxWidth: 1200,
    }
  },
  container: {
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      width: 'auto',
      marginBottom: 16,
    },
    [theme.breakpoints.between('sm', 'lg')]: {
      width: '50%',
      marginRight: 16,
    },
    [theme.breakpoints.up('xl')]: {
      width: '33.333%',
      marginRight: 24,
    }
  },
  nested: {
    backgroundColor: '#f5f5f5',
    [theme.breakpoints.down('md')]: {
      backgroundColor: '#ffffff',
      [theme.breakpoints.down('sm')]: {
        backgroundColor: '#e0e0e0',
        padding: 8,
      }
    }
  },
  mixedBreakpoints: {
    fontSize: 16,
    lineHeight: 1.4,
    [theme.breakpoints.up('sm')]: {
      fontSize: 18,
    },
    [theme.breakpoints.up('md')]: {
      fontSize: 20,
      lineHeight: 1.5,
    },
    [theme.breakpoints.up('lg')]: {
      fontSize: 24,
      lineHeight: 1.6,
    }
  }
}));

export const ResponsiveStylesTest = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <div className={classes.nested}>
          Nested responsive styles
        </div>
      </div>
      <div className={classes.mixedBreakpoints}>
        Mixed breakpoint text
      </div>
    </div>
  );
};