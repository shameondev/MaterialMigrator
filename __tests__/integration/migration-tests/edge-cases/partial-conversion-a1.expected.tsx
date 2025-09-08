import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Card } from '@material-ui/core';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(theme => ({
  // Mixed convertible and unconvertible properties - 50% conversion rate
  container: {
    // ✅ convertible → m-4
    animation: 'fadeIn 0.3s ease-out',
    // ❌ unconvertible
    transform: 'rotate(3deg) scale(1.02)',
    // ❌ unconvertible
    clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
    // ❌ unconvertible
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' // ❌ unconvertible
  }
}));
export const PartialConversionComponent: React.FC = () => {
  const classes = useStyles();
  return <div className={cn(classes.container, "flex flex-col p-[{CallExpression}px] m-4")}>
      <Card className="bg-[#f5f5f5] rounded-lg var(--theme-shadows)">
        <h2>Partial Conversion Test</h2>
        <p>This component tests 50% convertible properties scenario</p>
      </Card>
      
      <Button className="text-primary text-sm">
        Interactive Button
      </Button>
    </div>;
};