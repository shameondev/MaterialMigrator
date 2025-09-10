import { makeStyles } from '@material-ui/core';
import { cn } from '@/lib/utils';

export const useStyles = makeStyles((theme) => ({








  popover: {
    background: 'none',

    boxShadow: 'none'

  }
}));

const TestComponent = () => {
  const classes = useStyles();

  return (
    <div>
      <div className="bg-[#D5D5D5]">Regular className</div>
      <div className={cn('rounded-lg bg-secondary p-1.5', "rounded-lg bg-white p-1.5")}>Mixed className</div>
      <Select popoverClassName={cn(classes.popover, "h-[424px] overflow-visible")}>Custom prop</Select>
      <Modal overlayClassName={cn(classes.popover, "h-[424px] overflow-visible")}>Another custom prop</Modal>
    </div>);

};