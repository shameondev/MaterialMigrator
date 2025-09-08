import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Card } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  // Mixed convertible and unconvertible properties - 50% conversion rate
  container: {
    display: 'flex',                    // ✅ convertible → flex
    flexDirection: 'column',            // ✅ convertible → flex-col
    padding: theme.spacing(2),          // ✅ convertible → p-4 (theme ref)
    margin: 16,                         // ✅ convertible → m-4
    animation: 'fadeIn 0.3s ease-out',  // ❌ unconvertible
    transform: 'rotate(3deg) scale(1.02)', // ❌ unconvertible
    clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)', // ❌ unconvertible
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))', // ❌ unconvertible
  },
  
  // Fully convertible style for comparison
  simpleCard: {
    backgroundColor: '#f5f5f5',         // ✅ convertible → bg-gray-100
    borderRadius: 8,                    // ✅ convertible → rounded-lg
    boxShadow: theme.shadows[2],        // ✅ convertible → shadow-md (theme ref)
  },
  
  // Mix with nested selectors
  interactiveButton: {
    color: theme.palette.primary.main,  // ✅ convertible → text-blue-600 (theme ref)
    fontSize: '14px',                   // ✅ convertible → text-sm
    '&:hover': {                        // ❌ unconvertible pseudo-selector
      transform: 'translateY(-2px)',    // ❌ unconvertible
      boxShadow: '0 8px 25px rgba(0,0,0,0.2)', // ❌ unconvertible  
    },
    '&:active': {                       // ❌ unconvertible pseudo-selector
      transform: 'scale(0.98)',         // ❌ unconvertible
    }
  }
}));

export const PartialConversionComponent: React.FC = () => {
  const classes = useStyles();
  
  return (
    <div className={classes.container}>
      <Card className={classes.simpleCard}>
        <h2>Partial Conversion Test</h2>
        <p>This component tests 50% convertible properties scenario</p>
      </Card>
      
      <Button className={classes.interactiveButton}>
        Interactive Button
      </Button>
    </div>
  );
};