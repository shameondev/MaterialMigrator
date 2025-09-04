import React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';

// Test dynamic/conditional styles with props
interface StyleProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
}

const useStyles = makeStyles<Theme, StyleProps>((theme) => ({
  root: ({ variant, size, disabled, fullWidth }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.custom.radiusMD,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    // Variant-based styles
    backgroundColor:
      variant === 'primary'
        ? theme.custom.builderActionPrimary
        : variant === 'secondary'
          ? theme.custom.builderActionSecondary
          : theme.custom.builderRed,
    color: variant === 'secondary' ? theme.custom.builderContentPrimary : '#ffffff',
    // Size-based styles
    padding: size === 'small' ? '6px 12px' : size === 'large' ? '12px 24px' : '8px 16px',
    fontSize: size === 'small' ? 12 : size === 'large' ? 18 : 14,
    minHeight: size === 'small' ? 32 : size === 'large' ? 48 : 40,
    '&:hover': {
      backgroundColor: disabled
        ? undefined
        : variant === 'primary'
          ? theme.custom.builderActionPrimaryHover
          : variant === 'secondary'
            ? theme.custom.builderActionSecondaryHover
            : theme.custom.builderRedHover,
    },
  }),

  // Conditional class example
  label: ({ size }) => ({
    fontWeight: 500,
    textTransform: size === 'large' ? 'uppercase' : 'none',
    letterSpacing: size === 'large' ? '0.5px' : 'normal',
  }),

  // Array of conditional styles
  emptyClass: {},
  container: {
    position: 'relative',
    display: 'flex',
    gap: 8,
  },
}));

export const DynamicStylesTest = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
}: Partial<StyleProps>) => {
  const classes = useStyles({ variant, size, disabled, fullWidth });

  return (
    <div className={classes.container}>
      <button className={classes.root} disabled={disabled}>
        <span className={classes.label}>
          Dynamic Button ({variant}, {size})
        </span>
      </button>
    </div>
  );
};
