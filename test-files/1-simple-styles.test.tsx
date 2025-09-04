import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@/components/Box';

// Test basic CSS properties conversion
const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 8,
    backgroundColor: '#ffffff',
    color: '#000000',
    borderRadius: 4,
    border: '1px solid #e0e0e0',
    width: '100%',
    height: 200,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    cursor: 'pointer',
  },
  container: {
    maxWidth: 600,
    minHeight: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  text: {
    lineHeight: 1.5,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    textDecoration: 'underline',
  },
  spacing: {
    paddingTop: 10,
    paddingBottom: 20,
    marginLeft: 12,
    marginRight: 24,
  },
  redundantUnused: {
    display: 'none',
  },
  emptyClass: {},
}));

export const SimpleStylesTest = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <p className={classes.text}>Simple styles test</p>
        <Box className={classes.spacing}>Spacing test</Box>
      </div>
    </div>
  );
};
