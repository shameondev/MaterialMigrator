import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  // Webkit vendor prefixes
  textClamp: {
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '300px',                  // ✅ convertible → max-w-sm
  },
  
  // Scrolling behavior with webkit
  scrollContainer: {
    WebkitOverflowScrolling: 'touch',
    overflowX: 'auto',                  // ✅ convertible → overflow-x-auto
    overflowY: 'hidden',               // ✅ convertible → overflow-y-hidden
    padding: theme.spacing(1),          // ✅ convertible → p-2
  },
  
  // CSS supports rules with vendor prefixes
  safePadding: {
    paddingTop: '20px',                 // ✅ convertible → pt-5
    paddingBottom: 'env(safe-area-inset-bottom)',  // ❌ unconvertible
  },
  
  // Mozilla vendor prefixes
  firefoxSpecific: {
    MozUserSelect: 'none',
    MozAppearance: 'none',
    userSelect: 'none',                 // ✅ convertible → select-none
    appearance: 'none',                 // ✅ convertible → appearance-none
  },
  
  // Mixed vendor and regular properties
  crossBrowser: {
    display: 'flex',                    // ✅ convertible → flex
    WebkitFlexDirection: 'column',      // Vendor prefix version
    flexDirection: 'column',            // ✅ convertible → flex-col
    WebkitJustifyContent: 'center',     // Vendor prefix version
    justifyContent: 'center',           // ✅ convertible → justify-center
  }
}));

export const VendorPrefixComponent: React.FC = () => {
  const classes = useStyles();
  
  return (
    <div className={classes.crossBrowser}>
      <div className={classes.textClamp}>
        This is a long text that should be clamped to 3 lines with webkit line clamp
      </div>
      
      <div className={classes.scrollContainer}>
        <div>Horizontally scrollable content</div>
      </div>
      
      <div className={classes.safePadding}>
        Content with safe area padding
      </div>
      
      <div className={classes.firefoxSpecific}>
        Firefox-specific styling
      </div>
    </div>
  );
};