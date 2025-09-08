import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  gridContainer: {
    // Advanced Grid properties that may not convert well
    display: 'grid',
    gridTemplate: `
      "header header header" 60px
      "sidebar main main" 1fr
      "footer footer footer" 80px
      / 200px 1fr 1fr
    `,
    gridAutoFlow: 'row dense',
    gridAutoRows: 'minmax(100px, auto)',
    gridAutoColumns: 'minmax(150px, 1fr)',
    gap: '20px 15px',
    alignContent: 'space-between',
    justifyContent: 'space-around',
    placeItems: 'center stretch',
  },
  
  gridItem: {
    // Grid item specific properties
    gridArea: 'main',
    gridColumn: 'span 2',
    gridRow: '1 / span 3',
    justifySelf: 'stretch',
    alignSelf: 'center',
    placeSelf: 'center start',
  },
  
  responsiveGrid: {
    // Grid with complex responsive behavior
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gridTemplateRows: 'repeat(auto-fill, minmax(200px, 1fr))',
    
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto',
    },
    
    '@media (min-width: 1200px)': {
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridTemplateRows: 'repeat(3, 200px)',
    },
  },
  
  customProperties: {
    // CSS Custom Properties that should not be converted
    '--primary-color': '#3498db',
    '--secondary-color': '#2ecc71',
    '--grid-gap': '1rem',
    '--border-radius': '8px',
    
    backgroundColor: 'var(--primary-color)',
    borderRadius: 'var(--border-radius)',
    gap: 'var(--grid-gap)',
    
    // CSS functions
    width: 'clamp(200px, 50vw, 800px)',
    height: 'min(400px, 80vh)',
    fontSize: 'max(16px, 2vw)',
  },
}));

export const AdvancedGridComponent: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.gridContainer}>
      <header>Header</header>
      <aside>Sidebar</aside>
      <main className={classes.gridItem}>
        <div className={classes.responsiveGrid}>
          <div className={classes.customProperties}>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
          <div>Item 4</div>
        </div>
      </main>
      <footer>Footer</footer>
    </div>
  );
};