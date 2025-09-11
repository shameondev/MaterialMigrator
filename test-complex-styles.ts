import { makeStyles } from '@material-ui/core';
import { getTypographyStyles } from '@/components/ui/typography';

const maxWidth = 223;
const minWidth = 41;

export const useStyles = makeStyles((theme) => ({
  root: {


    borderRight: `1px solid ${theme.custom?.divider}`






  },



  items: {





    '-ms-overflow-style': 'none',
    'scrollbar-width': 'none',
    '&::-webkit-scrollbar': {
      '-webkit-appearance': 'none',
      width: 0,
      height: 0
    }
  },





























  itemActive: {

    '& $square': {
      background: 'rgba(var(--color, 86, 187, 98), 1)'
    }
  },






























  arrow: {






    filter: theme.custom?.isDarkMode ? 'invert(1)' : undefined
  },



























  subItemActive: {

    '& $circle': {
      background: 'rgba(var(--color, 86, 187, 98), 1)'
    }
  },






  subItemPopover: {




    ...getTypographyStyles(theme).captionRegular12,




    '&:first-of-type': {
      marginTop: 8
    }
  }




}));