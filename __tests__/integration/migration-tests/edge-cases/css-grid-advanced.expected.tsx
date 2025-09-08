import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(() => ({
  gridContainer: {
    gridTemplate: `
      "header header header" 60px
      "sidebar main main" 1fr
      "footer footer footer" 80px
      / 200px 1fr 1fr
    `,
    gridAutoFlow: 'row dense',
    gridAutoRows: 'minmax(100px, auto)',
    gridAutoColumns: 'minmax(150px, 1fr)',
    placeItems: 'center stretch'
  },
  gridItem: {
    // Grid item specific properties
    gridArea: 'main',
    gridColumn: 'span 2',
    gridRow: '1 / span 3',
    justifySelf: 'stretch',
    alignSelf: 'center',
    placeSelf: 'center start'
  },
  responsiveGrid: {
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto'
    },
    '@media (min-width: 1200px)': {
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridTemplateRows: 'repeat(3, 200px)'
    }
  },
  customProperties: {
    // CSS Custom Properties that should not be converted
    '--primary-color': '#3498db',
    '--secondary-color': '#2ecc71',
    '--grid-gap': '1rem',
    '--border-radius': '8px'
  }
}));
export const AdvancedGridComponent: React.FC = () => {
  const classes = useStyles();
  return <div className={cn(classes.gridContainer, "grid gapy-5 gapx-[15px] content-between justify-around")}>
      <header>Header</header>
      <aside>Sidebar</aside>
      <main className={classes.gridItem}>
        <div className={cn(classes.responsiveGrid, "grid grid-cols-[repeat(auto-fit, minmax(250px, 1fr))] grid-rows-[repeat(auto-fill, minmax(200px, 1fr))]")}>
          <div className={cn(classes.customProperties, "bg-[var(--primary-color)] rounded-[var(--border-radius)px] gap-[var(--grid-gap)px] w-[clamp(200px, 50vw, 800px)] h-[min(400px, 80vh)] text-[max(16px, 2vw)]")}>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
          <div>Item 4</div>
        </div>
      </main>
      <footer>Footer</footer>
    </div>;
};