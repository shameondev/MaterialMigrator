import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  // RTL-aware spacing properties
  rtlCard: {
    marginLeft: theme.spacing(2),       // ✅ convertible → ml-4 (LTR) / mr-4 (RTL)
    marginRight: theme.spacing(1),      // ✅ convertible → mr-2 (LTR) / ml-2 (RTL)
    paddingLeft: '24px',               // ✅ convertible → pl-6 (LTR) / pr-6 (RTL)  
    paddingRight: '12px',              // ✅ convertible → pr-3 (LTR) / pl-3 (RTL)
    backgroundColor: '#f0f0f0',        // ✅ convertible → bg-gray-100
  },
  
  // RTL-aware positioning
  floatingButton: {
    position: 'fixed',                 // ✅ convertible → fixed
    right: '20px',                     // ✅ convertible → right-5 (LTR) / left-5 (RTL)
    bottom: '20px',                    // ✅ convertible → bottom-5
    left: 'auto',                      // ✅ convertible → left-auto
  },
  
  // RTL-aware text alignment and direction
  textContent: {
    textAlign: 'left',                 // ✅ convertible → text-left (LTR) / text-right (RTL)
    direction: 'ltr',                  // ❌ unconvertible - needs manual RTL handling
    unicodeBidi: 'embed',              // ❌ unconvertible
    fontSize: '16px',                  // ✅ convertible → text-base
  },
  
  // RTL-aware borders
  cardWithBorder: {
    borderLeft: '4px solid blue',      // Mixed: border-l-4 border-blue-600 (needs RTL flip)
    borderRight: '1px solid #ccc',     // Mixed: border-r border-gray-300 (needs RTL flip)
    borderTop: '2px solid red',        // ✅ convertible → border-t-2 border-red-600
    padding: theme.spacing(3),         // ✅ convertible → p-6
  },
  
  // Complex RTL scenario with transforms
  rtlIcon: {
    transform: 'scaleX(-1)',           // ❌ unconvertible - RTL icon flipping
    marginLeft: '8px',                 // ✅ convertible → ml-2 (needs RTL consideration)
    display: 'inline-block',           // ✅ convertible → inline-block
  },
  
  // Grid with RTL considerations  
  gridContainer: {
    display: 'grid',                   // ✅ convertible → grid
    gridTemplateColumns: '1fr 200px',  // ❌ unconvertible
    gridGap: theme.spacing(2),         // ✅ convertible → gap-4  
    textAlign: 'start',                // ✅ convertible → text-start (RTL-aware)
  }
}));

export const RTLDirectionComponent: React.FC = () => {
  const classes = useStyles();
  
  return (
    <div dir="ltr">
      <div className={classes.rtlCard}>
        <p className={classes.textContent}>
          This content should adapt to RTL layouts
        </p>
      </div>
      
      <div className={classes.cardWithBorder}>
        Border handling with RTL awareness
      </div>
      
      <div className={classes.gridContainer}>
        <div>Grid item 1</div>
        <div>Grid item 2</div>
      </div>
      
      <button className={classes.floatingButton}>
        <span className={classes.rtlIcon}>→</span>
        Action
      </button>
    </div>
  );
};