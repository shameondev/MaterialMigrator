import React from 'react';
import { Button } from '@material-ui/core';

export const SimpleComponent = () => {
  return <div className="flex flex-col items-center p-4 m-2 bg-white rounded">
      <h1>Hello World</h1>
      <Button className="mt-3 py-2 px-4 text-sm font-bold">
        Click me
      </Button>
    </div>;
};