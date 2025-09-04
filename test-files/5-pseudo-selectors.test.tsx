import React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';

// Test pseudo-selectors and interactive states
const useStyles = makeStyles((theme: Theme) => ({
  root: {
    padding: 16,
    borderRadius: theme.custom.radiusMD,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    
    '&:hover': {
      backgroundColor: theme.custom.builderBackgroundSecondary,
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    
    '&:focus': {
      outline: 'none',
      ring: `2px solid ${theme.custom.builderFocusRing}`,
      ringOffset: '2px',
    },
    
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      pointerEvents: 'none',
    }
  },
  
  // Pseudo-elements
  card: {
    position: 'relative',
    backgroundColor: theme.custom.card,
    padding: 24,
    
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: theme.custom.builderActionPrimary,
      borderRadius: `${theme.custom.radiusMD} ${theme.custom.radiusMD} 0 0`,
    },
    
    '&::after': {
      content: '"✓"',
      position: 'absolute',
      top: 8,
      right: 8,
      color: theme.custom.builderGreen,
      fontSize: 12,
      fontWeight: 'bold',
    }
  },
  
  // Complex nested pseudo-selectors
  listItem: {
    padding: 12,
    borderBottom: `1px solid ${theme.custom.divider}`,
    
    '&:first-child': {
      borderTopLeftRadius: theme.custom.radiusMD,
      borderTopRightRadius: theme.custom.radiusMD,
    },
    
    '&:last-child': {
      borderBottom: 'none',
      borderBottomLeftRadius: theme.custom.radiusMD,
      borderBottomRightRadius: theme.custom.radiusMD,
    },
    
    '&:nth-child(even)': {
      backgroundColor: theme.custom.builderBackgroundSecondary,
    },
    
    '&:hover': {
      backgroundColor: theme.custom.builderBackgroundTertiary,
      
      '& .icon': {
        color: theme.custom.builderActionPrimary,
        transform: 'scale(1.1)',
      }
    }
  },
  
  // Input states
  input: {
    width: '100%',
    padding: 12,
    border: `1px solid ${theme.custom.builderBorderPrimary}`,
    borderRadius: theme.custom.radiusMD,
    fontSize: 14,
    
    '&:focus': {
      borderColor: theme.custom.builderActionPrimary,
      boxShadow: `0 0 0 3px ${theme.custom.builderActionPrimary}20`,
      outline: 'none',
    },
    
    '&:invalid': {
      borderColor: theme.custom.builderRed,
    },
    
    '&::placeholder': {
      color: theme.custom.builderContentTertiary,
      opacity: 0.7,
    }
  }
}));

export const PseudoSelectorsTest = () => {
  const classes = useStyles();

  return (
    <div>
      <button className={classes.root}>
        Interactive Button
      </button>
      
      <div className={classes.card}>
        Card with pseudo-elements
      </div>
      
      <div>
        <div className={classes.listItem}>First item</div>
        <div className={classes.listItem}>
          Second item
          <span className="icon">→</span>
        </div>
        <div className={classes.listItem}>Third item</div>
        <div className={classes.listItem}>Last item</div>
      </div>
      
      <input 
        className={classes.input}
        placeholder="Test input with states"
        type="text"
      />
    </div>
  );
};