import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { cn } from "@/lib/utils";

const useStyles = (theme, props) => ({
  // Dynamic theme.spacing() calls should remain unconvertible
  dynamicSpacing: {
    padding: theme.spacing(props => props.spacing || 2),
    margin: theme.spacing(props.spacing)
  },
  conditionalSpacing: {
    padding: theme.spacing(props.isLarge ? 4 : 2),
    margin: theme.spacing(props.isSmall && 1)
  },
  calculatedSpacing: {
    padding: theme.spacing(props.baseSpacing + 2),
    margin: theme.spacing(props.spacing * 2)
  },
  mixedDynamic: {
    margin: theme.spacing(props.dynamicSpacing)
  }
});

interface Props {
  spacing?: number;
  isLarge?: boolean;
  isSmall?: boolean;
  baseSpacing?: number;
  dynamicSpacing?: number;
}

export const DynamicThemeSpacingComponent: React.FC<Props> = (props) => {
  const classes = useStyles(props);

  return <div>
      <div className={cn(classes.dynamicSpacing)}>Dynamic Spacing</div>
      <div className={cn(classes.conditionalSpacing)}>Conditional Spacing</div>
      <div className={cn(classes.calculatedSpacing)}>Calculated Spacing</div>
      <div className={cn(classes.mixedDynamic, "p-6 flex flex-col")}>Mixed Dynamic</div>
    </div>;
};
