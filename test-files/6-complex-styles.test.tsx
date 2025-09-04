import React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';

// Test complex scenarios and edge cases
const useStyles = makeStyles((theme: Theme) => ({
  // Keyframe animations (should be flagged for manual review)
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' }
  },
  
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.05)' },
    '100%': { transform: 'scale(1)' }
  },
  
  animated: {
    animation: '$fadeIn 0.3s ease-in-out',
    '&:hover': {
      animation: '$pulse 0.5s ease-in-out infinite',
    }
  },
  
  // Complex selectors (should be flagged)
  complexNesting: {
    '& .child': {
      color: theme.custom.builderContentPrimary,
      
      '& .grandchild': {
        fontSize: 12,
        '&:hover': {
          color: theme.custom.builderActionPrimary,
        }
      }
    },
    
    '& > .direct-child': {
      marginBottom: 16,
    },
    
    '& + .sibling': {
      marginTop: 8,
    }
  },
  
  // CSS functions and calc()
  calculations: {
    width: 'calc(100% - 32px)',
    height: 'calc(100vh - 120px)',
    margin: 'calc(1rem + 5px)',
    padding: `calc(${theme.custom.spacing?.md || 16}px * 2)`,
  },
  
  // CSS variables and custom properties
  customProperties: {
    '--local-color': theme.custom.builderActionPrimary,
    '--local-radius': theme.custom.radiusMD,
    backgroundColor: 'var(--local-color)',
    borderRadius: 'var(--local-radius)',
    color: 'rgb(var(--rgb-primary))',
  },
  
  // CSS Grid (complex layout)
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gridTemplateRows: 'auto 1fr auto',
    gridGap: 16,
    gridTemplateAreas: `
      "header header header"
      "sidebar content content"  
      "footer footer footer"
    `,
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: '1fr',
      gridTemplateAreas: `
        "header"
        "content"
        "sidebar"
        "footer"
      `,
    }
  },
  
  // CSS Flexbox with complex alignment
  flexComplex: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    alignContent: 'space-between',
    justifyContent: 'space-evenly',
    gap: 'clamp(8px, 2vw, 24px)',
  },
  
  // Multiple background images
  multipleBackgrounds: {
    background: [
      'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 70%)',
      'radial-gradient(circle at 50% 50%, rgba(91,140,255,0.1) 0%, transparent 50%)',
      theme.custom.builderBackgroundPrimary,
    ].join(', '),
    backgroundSize: '100% 100%, 200px 200px, auto',
    backgroundRepeat: 'no-repeat, no-repeat, repeat',
    backgroundPosition: 'center, center, center',
  },
  
  // CSS filters and transforms
  transforms: {
    filter: 'blur(0px) brightness(1) contrast(1)',
    transform: 'translateX(0) translateY(0) rotate(0deg) scale(1)',
    transformOrigin: 'center center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    
    '&:hover': {
      filter: 'blur(1px) brightness(1.1) contrast(1.05)',
      transform: 'translateX(-2px) translateY(-2px) rotate(-1deg) scale(1.02)',
    }
  },
  
  // CSS clipping and masking
  clipped: {
    clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)',
    mask: 'linear-gradient(90deg, transparent 0%, black 25%, black 75%, transparent 100%)',
    WebkitMask: 'linear-gradient(90deg, transparent 0%, black 25%, black 75%, transparent 100%)',
  }
}));

export const ComplexStylesTest = () => {
  const classes = useStyles();

  return (
    <div>
      <div className={classes.animated}>
        Animated element
      </div>
      
      <div className={classes.complexNesting}>
        <div className="child">
          Child element
          <div className="grandchild">Grandchild</div>
        </div>
        <div className="direct-child">Direct child</div>
      </div>
      
      <div className={classes.calculations}>
        Calculated dimensions
      </div>
      
      <div className={classes.customProperties}>
        Custom CSS properties
      </div>
      
      <div className={classes.gridContainer}>
        <header style={{ gridArea: 'header' }}>Header</header>
        <aside style={{ gridArea: 'sidebar' }}>Sidebar</aside>
        <main style={{ gridArea: 'content' }}>Content</main>
        <footer style={{ gridArea: 'footer' }}>Footer</footer>
      </div>
      
      <div className={classes.flexComplex}>
        <div>Flex item 1</div>
        <div>Flex item 2</div>
        <div>Flex item 3</div>
      </div>
      
      <div className={classes.multipleBackgrounds}>
        Multiple backgrounds
      </div>
      
      <div className={classes.transforms}>
        Transform effects
      </div>
      
      <div className={classes.clipped}>
        Clipped content
      </div>
    </div>
  );
};