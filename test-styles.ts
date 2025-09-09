import { makeStyles } from '@material-ui/core';
import { VisibleColorMode } from '../../../store/ui/state';

export const useStyles = (forcedColorMode?: VisibleColorMode) =>
  makeStyles((theme) => {
    const mode = forcedColorMode ? forcedColorMode : theme.custom.currentTheme;

    return {
      root: {
        display: 'flex',
        gap: 16,
        [theme.breakpoints.down('sm')]: {
          flexWrap: 'wrap',
        },
      },
      items: {
        display: 'flex',
        gap: 16,
        width: 184,
        flexDirection: 'column',
        [theme.breakpoints.down('sm')]: {
          width: 'auto',
          flexDirection: 'row',
        },
      },
      item: {},

      label: {
        color: theme.custom[mode].builderContentTertiary,
        cursor: 'pointer',
      },
      labelDisabled: { cursor: 'default' },
      subLabel: {
        color: theme.custom[mode].builderContentTertiary,
        marginTop: 4,
      },
      labelActive: {
        cursor: 'default',
        color: theme.custom[mode].builderActionPrimaryInitial,
      },
      content: {
        overflow: 'hidden',
        transition: 'height .2s',
      },
    };
  });