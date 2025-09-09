import React from 'react';
import { makeStyles } from '@material-ui/core';
import { cn } from '@/lib/utils';
export const TestComponent = () => {
  return <div className="flex gap-4 max-sm:flex-wrap">
      <div className="p-2 bg-[red]">
        <span className="text-gray-600 cursor-pointer">Label</span>
      </div>
    </div>;
};