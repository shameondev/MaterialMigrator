import React from 'react';
export const MultipleStylesComponent = () => {
  return <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      <header className="flex justify-between items-center p-4 bg-[#1976d2] text-white">
        <h1 className="text-2xl font-bold m-0">My App</h1>
      </header>
      <main className="p-6 max-w-[800px] my-0 mx-auto w-full">
        <p>Main content goes here</p>
      </main>
      <footer className="p-4 text-center bg-white">
        <p>Footer content</p>
      </footer>
    </div>;
};
