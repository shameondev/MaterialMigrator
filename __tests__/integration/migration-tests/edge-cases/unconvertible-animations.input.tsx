import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  animatedBox: {
    // These animations cannot be converted to Tailwind
    animation: 'fadeInUp 0.5s ease-out, pulse 2s infinite',
    animationDelay: '0.2s',
    animationFillMode: 'both',
    // Complex transforms
    transform: 'perspective(1000px) rotateX(45deg) translateZ(100px)',
    transformOrigin: '50% 25%',
    transformStyle: 'preserve-3d',
    // Advanced filters
    filter: 'drop-shadow(0 0 10px rgba(255, 0, 0, 0.5)) blur(2px) brightness(1.2)',
    backdropFilter: 'blur(10px) saturate(180%)',
  },
  gradientBackground: {
    // Complex gradients that should remain as-is
    background: 'linear-gradient(45deg, #FF6B6B 0%, #4ECDC4 25%, #45B7D1 50%, #96CEB4 75%, #FFEAA7 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  complexPseudo: {
    // These pseudo-selectors and content should not be converted
    '&::before': {
      content: '"★"',
      position: 'absolute',
      top: '-10px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '20px',
      color: 'gold',
    },
    '&:nth-child(odd)': {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    '&:hover::after': {
      content: 'attr(data-tooltip)',
      position: 'absolute',
      background: 'black',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
    },
  },
}));

export const UnconvertibleComponent: React.FC = () => {
  const classes = useStyles();

  return (
    <div>
      <div className={classes.animatedBox}>
        Animated Box with Complex Transforms
      </div>
      <h1 className={classes.gradientBackground}>
        Gradient Text
      </h1>
      <div className={classes.complexPseudo} data-tooltip="Hover me">
        Complex Pseudo Content
      </div>
    </div>
  );
};