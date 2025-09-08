import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { cn } from "@/lib/utils";
const useStyles = makeStyles(() => ({
  header: {
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  content: {
    flex: 1
  },
  footer: {
    borderTop: '1px solid #e0e0e0'
  }
}));
export const MultipleStylesComponent = () => {
  const classes = useStyles();
  return <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      <header className={cn(classes.header, "flex justify-between items-center p-4 bg-[#1976d2] text-white")}>
        <h1 className="text-2xl font-bold m-0">My App</h1>
      </header>
      <main className={cn(classes.content, "p-6 max-w-[800px] my-0 mx-auto w-full")}>
        <p>Main content goes here</p>
      </main>
      <footer className={cn(classes.footer, "p-4 text-center bg-white")}>
        <p>Footer content</p>
      </footer>
    </div>;
};
