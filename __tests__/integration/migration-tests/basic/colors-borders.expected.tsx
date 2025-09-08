import React from 'react';
export const ColorsComponent = () => {
  return <div className="flex flex-col items-center justify-center p-4 m-2">
      <div className="bg-white text-black rounded border p-5">
        <div className="w-full">
          <p>Paper content</p>
        </div>
        <button className="bg-[#1976d2] text-white rounded-lg border-0 cursor-pointer">Click me</button>
      </div>
    </div>
};