import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(theme => ({
  card: {
    // Unconvertible properties
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    // Nested selectors
    '& .title': {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: theme.palette.text.primary,
      marginBottom: theme.spacing(1)
    }
  },
  button: {
    // Unconvertible
    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
  }
}));
export const MixedStylesComponent: React.FC = () => {
  const classes = useStyles();
  return <div className={cn(classes.card, "flex flex-col p-6 m-4 bg-[var(--palette-background-paper)] rounded-[var(--theme-shape-borderRadius)] hover:transition-all")}>
      <div className="title">Card Title</div>
      <p>Some convertible styles like flex and padding should become Tailwind classes.</p>
      <p>But complex gradients, transforms, and pseudo-selectors should remain in makeStyles.</p>
      <button className={cn(classes.button, "py-3 px-6 rounded-lg border-0 cursor-pointer transition-all")}>
        Interactive Button
      </button>
    </div>;
};