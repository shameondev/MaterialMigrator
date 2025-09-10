import { makeStyles } from '@material-ui/core';








const TestComponent = () => {


  return (
    <div>
      <Tooltip tooltipClassName="p-2 m-1">Tooltip</Tooltip>
      <Dialog dialogClassName="p-2 m-1">Dialog</Dialog>
      <Popover popoverClassName="p-2 m-1">Popover</Popover>
      <Menu menuClassName="p-2 m-1">Menu</Menu>
      <Button buttonClassName="p-2 m-1">Button</Button>
    </div>);

};