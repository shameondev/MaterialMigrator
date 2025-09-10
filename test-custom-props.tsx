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
      <Select popoverClassName={classes.popover}>Custom prop</Select>
      <Modal overlayClassName={classes.popover}>Another custom prop</Modal>
    </div>);

};