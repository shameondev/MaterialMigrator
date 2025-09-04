import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1976d2',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 0,
  },
  content: {
    flex: 1,
    padding: 24,
    maxWidth: 800,
    margin: '0 auto',
    width: '100%',
  },
  footer: {
    padding: 16,
    textAlign: 'center',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: 'white',
  },
}));

export const MultipleStylesComponent = () => {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <h1 className={classes.title}>My App</h1>
      </header>
      <main className={classes.content}>
        <p>Main content goes here</p>
      </main>
      <footer className={classes.footer}>
        <p>Footer content</p>
      </footer>
    </div>
  );
};