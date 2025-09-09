import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    backgroundColor: theme.custom?.unknownProperty,
    color: theme.superCustom.newColor,
  }
}));

export const TestError: React.FC = () => {
  const classes = useStyles();
  return <div className={classes.container}>Test</div>;
};