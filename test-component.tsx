import React from 'react';
export const TestComponent: React.FC = () => {
  return <div className="flex flex-col bg-blue-500 p-4 rounded-lg">
      <h1 className="text-gray-800 text-2xl font-bold mb-2">Test Component</h1>
      <div className="bg-gray-50 p-2 border rounded-md">
        <p>This is a test component with various custom theme properties.</p>
        <button className="bg-green-600 text-white p-[${template-literal}] border-0 rounded cursor-pointer mt-4 hover:bg-green-700">
          Click Me
        </button>
      </div>
    </div>;
};