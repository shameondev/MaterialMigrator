import React from 'react';
import { makeStyles } from '@material-ui/core';
export const HorizontalTabs = () => {
  return <div className="flex gap-4 max-sm:flex-wrap">
      <div className="flex gap-4 w-[184px] flex-col max-sm:w-auto max-sm:flex-row">
        <div className={classes.item}>
          <span className="text-gray-600 cursor-pointer">Label</span>
          <span className="cursor-default text-blue-600">Active</span>
          <span className="cursor-default">Disabled</span>
        </div>
      </div>
      <div className="overflow-hidden transition">
        Content
      </div>
    </div>;
};