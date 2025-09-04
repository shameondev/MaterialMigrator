import React from 'react';
import { Theme } from '@material-ui/core/styles';

export const ThemeComponent = () => {
  return <div className="bg-builder-primary text-builder-content-primary rounded-lg">
      <div className="bg-builder-surface-secondary border rounded-2xl">
        <h2>Theme Example</h2>
      </div>
      <p>Content goes here</p>
    </div>;
};