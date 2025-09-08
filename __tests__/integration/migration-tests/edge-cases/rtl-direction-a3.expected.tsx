import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(theme => ({
  // RTL-aware text alignment and direction
  textContent: {
    // ✅ convertible → text-left (LTR) / text-right (RTL)
    direction: 'ltr',
    // ❌ unconvertible - needs manual RTL handling
    unicodeBidi: 'embed'
  },
  // RTL-aware borders
  cardWithBorder: {
    borderLeft: '4px solid blue',
    // Mixed: border-l-4 border-blue-600 (needs RTL flip)
    borderRight: '1px solid #ccc',
    // Mixed: border-r border-gray-300 (needs RTL flip)
    borderTop: '2px solid red'
  },
  // Complex RTL scenario with transforms
  rtlIcon: {
    transform: 'scaleX(-1)'
  },
  // Grid with RTL considerations  
  gridContainer: {
    // ✅ convertible → gap-4  
    textAlign: 'start' // ✅ convertible → text-start (RTL-aware)
  }
}));
export const RTLDirectionComponent: React.FC = () => {
  const classes = useStyles();
  return <div dir="ltr">
      <div className="ml-4 mr-2 pl-6 pr-3 bg-[#f0f0f0]">
        <p className={cn(classes.textContent, "text-left text-base")}>
          This content should adapt to RTL layouts
        </p>
      </div>
      
      <div className={cn(classes.cardWithBorder, "p-6")}>
        Border handling with RTL awareness
      </div>
      
      <div className={cn(classes.gridContainer, "grid grid-cols-[1fr 200px] gap-4")}>
        <div>Grid item 1</div>
        <div>Grid item 2</div>
      </div>
      
      <button className="fixed right-5 bottom-5 left-auto">
        <span className={cn(classes.rtlIcon, "ml-2 inline-block")}>→</span>
        Action
      </button>
    </div>;
};