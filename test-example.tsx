import { Box } from '@/components/Box';
import { Typography } from '@/components/ui/typography';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useStyles } from './test-styles';
import type { VisibleColorMode } from '../../../store/ui/state';
import React from 'react';
import useElementHeight from '../../../hooks/useElementHeight';

type HorizontalTabProps = {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
};

type HorizontalTabsProps = {
  theme?: VisibleColorMode;
  children: React.ReactElement<HorizontalTabProps>[];
  rootClassName?: string;
  itemsClassName?: string;
  contentClassName?: string;
  current?: string;
  onCurrentChange?: (current: string) => void;
};

export const HorizontalTabs = ({
  children,
  theme,
  rootClassName,
  itemsClassName,
  contentClassName,
  current: controlledCurrent,
  onCurrentChange,
}: React.PropsWithChildren<HorizontalTabsProps>) => {
  const classes = useStyles(theme)();
  const [internalCurrent, setInternalCurrent] = useState('');
  const current = controlledCurrent ?? internalCurrent;

  const [ref, height] = useElementHeight<HTMLDivElement>();

  const mapItems = useMemo(
    () =>
      React.Children.map(children, (child: React.ReactElement<HorizontalTabProps>) => ({
        label: child.props.label,
        content: child.props.children,
        disabled: child.props?.disabled,
      })).reduce(
        (acc, item) => {
          acc[item.label] = {
            content: item.content,
            disabled: item.disabled,
          };
          return acc;
        },
        {} as Record<string, { content: React.ReactNode; disabled?: boolean }>,
      ),
    [children],
  );

  const setCurrent = (newCurrent: string) => {
    if (onCurrentChange) {
      onCurrentChange(newCurrent);
    } else {
      setInternalCurrent(newCurrent);
    }
  };

  useEffect(() => {
    const keys = Object.keys(mapItems);
    const first = keys[0];

    // Set the first tab as current if no tab is selected
    // or if the selected tab is no longer available.
    if (first && !keys.includes(current)) {
      if (onCurrentChange) {
        onCurrentChange(first);
      } else {
        setInternalCurrent(first);
      }
    }
  }, [mapItems, current, onCurrentChange]);

  const counts = Object.keys(mapItems).length;
  const widthItem = 100 / counts;

  return (
    <Box className={cn(classes.root, rootClassName)}>
      <Box className={cn(classes.items, itemsClassName)}>
        {Object.keys(mapItems).map((label, index) => {
          const { disabled } = mapItems[label];
          return (
            <Box
              key={`${index}_${label}`}
              className={cn(classes.item, current === label && classes.itemActive)}
              onClick={() => !disabled && setCurrent(label)}
              style={{ width: `${widthItem}%` }}
            >
              <Typography
                className={cn(
                  classes.label,
                  current === label && classes.labelActive,
                  disabled && classes.labelDisabled,
                )}
                variant="BuilderHeadingDefault"
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box className={cn(classes.content, contentClassName)} style={{ height }}>
        <div ref={ref}>{current && mapItems?.[current]?.content && mapItems[current].content}</div>
      </Box>
    </Box>
  );
};

export default HorizontalTabs;

export const HorizontalTab: React.FC<HorizontalTabProps> = (): React.ReactNode => null;