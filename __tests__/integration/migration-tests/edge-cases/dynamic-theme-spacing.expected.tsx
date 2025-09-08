import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(theme => ({
  // Test dynamic theme.spacing() calls that should remain unconvertible
  dynamicSpacing: {
    padding: theme.spacing(props => props.spacing || 2),
    // Dynamic function
    margin: theme.spacing(props.spacing) // Dynamic variable
  },
  // Test theme.spacing() with conditional expressions
  conditionalSpacing: {
    padding: theme.spacing(props.isLarge ? 4 : 2),
    // Conditional
    margin: theme.spacing(props.isSmall && 1) // Logical
  },
  // Test theme.spacing() with calculations
  calculatedSpacing: {
    padding: theme.spacing(props.baseSpacing + 2),
    // Arithmetic
    margin: theme.spacing(props.spacing * 2) // Multiplication
  },
  // Mixed: some convertible, some dynamic
  mixedDynamic: {
    // Should convert to p-6
    margin: theme.spacing(props.dynamicSpacing)
  }
}));
interface Props {
  spacing?: number;
  isLarge?: boolean;
  isSmall?: boolean;
  baseSpacing?: number;
  dynamicSpacing?: number;
}
export const DynamicThemeSpacingComponent: React.FC<Props> = props => {
  const classes = useStyles(props);
  return <div>
      <div className={classes.dynamicSpacing}>Dynamic Spacing</div>
      <div className={classes.conditionalSpacing}>Conditional Spacing</div>
      <div className={classes.calculatedSpacing}>Calculated Spacing</div>
      <div className={cn(classes.mixedDynamic, "p-6 flex flex-col")}>Mixed Dynamic</div>
    </div>;
};
