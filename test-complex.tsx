import { Collapse } from '@material-ui/core';
import { Box } from '@/components/Box';
import { useStyles } from './test-complex-styles';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import usePersistState from '../../../hooks/usePersistState';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ButtonShort from '../ButtonShort';
import ArrowIcon from '../../icons/arrow.svg?react';
import { Typography } from '@/components/ui/typography';
import useIsMobile from '../../hooks/useIsMobile';
import { memo, useEffect, useState } from 'react';
import { Aside } from '../../../services/aside';
import { useSelector } from 'react-redux';

const colors = ['86, 187, 98', '113, 92, 239', '239, 92, 189', '239, 196, 92', '92, 142, 239'];

type ContentNavigationProps = {
  currentChild: Aside.Nav | undefined;
};

const ContentNavigation = memo(({ currentChild }: ContentNavigationProps) => {
  const classes = useStyles();
  const [short, setShort] = usePersistState<boolean>(false, 'menuChildSideBarShort');
  const toggleShort = () => {
    setShort((short: boolean) => !short);
  };

  const isMobile = useIsMobile();
  const project = useSelector((state) => state.ui.selectedProject?.uid);
  const menuItems = currentChild?.items;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (menuItems) {
      const initialIndex = menuItems.findIndex((item) => item.active);
      setActiveIndex(initialIndex ?? null);
    }
  }, [menuItems]);

  if (!menuItems || isMobile) return null;

  const handleTopLevelClick = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleTopLevelClick(index);
    }
  };

  const renderNavItem = (navItem: Aside.Nav, parentIndex: number) => {
    const commonProps = {
      className: cn(
        classes.item,
        {
          [classes.itemShort]: short,
          [classes.itemActive]: activeIndex === parentIndex && !navItem.items
        },
        `menu-item-child-parent-${navItem.slug}`
      ),
      onKeyDown: (event: React.KeyboardEvent) => handleKeyDown(event, parentIndex),
      tabIndex: 0,
      role: 'tab',
      children:
      <>
          <span
          className="cursor-pointer w-[16px] h-[16px] block rounded-sm border border-[rgba(var(--color, 86, 187, 98), 1)] bg-[rgba(var(--color, 86, 187, 98), .2)] shrink-0 transition"
          style={{ '--color': colors[parentIndex] } as React.CSSProperties} />

          <span className="overflow-hidden whitespace-nowrap text-ellipsis">{navItem.title}</span>
          {navItem.items &&
        <span
          className={cn(classes.arrow, "w-[24px] h-[24px] block ml-auto transition-transform rotate-180", { "rotate-0":
            activeIndex === parentIndex })
          }>

              <ArrowIcon />
            </span>
        }
        </>

    };

    return navItem.items ?
    <div {...commonProps} onClick={() => handleTopLevelClick(parentIndex)} /> :

    <Link {...commonProps} to={`${navItem.path}?project=${project}`} />;

  };

  const renderSubItems = (navItems: Aside.Nav, parentIndex: number) =>
  <Collapse in={activeIndex === parentIndex} timeout="auto" unmountOnExit>
      <Box className={cn("pl-6 transition", { "pl-0": short })}>
        {navItems.items!.map((item) =>
      <Tooltip key={`content-navigation-sub-item_${item.path}`}>
            <TooltipTrigger>
              <Link
            className={cn("flex gap-2 py-2 px-3 rounded items-center transition hover:bg-gray-100 my-[1px] mx-0 overflow-hidden", {


              [classes.subItemShort]: short,
              [classes.subItemActive]: item.active }, `menu-item-child-parent-${

            item.slug}`)
            }
            to={`${item.path}?project=${project}`}
            tabIndex={0}
            role="tab">

                <span
              className={cn("cursor-pointer w-[16px] h-[16px] rounded-2xl border shrink-0 transition-opacity ml-[-22px] opacity-0 border-[rgba(var(--color, 86, 187, 98), 1)] bg-[rgba(var(--color, 86, 187, 98), .2)]", { [classes.circleShort]: short })}
              style={{ '--color': colors[parentIndex] } as React.CSSProperties} />

                <span className="overflow-hidden whitespace-nowrap text-ellipsis">{item.title}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              {short ?
          <Typography className="text-white" variant="subheadMedium14">
                  {item.title}
                </Typography> :

          ''
          }
            </TooltipContent>
          </Tooltip>
      )}
      </Box>
    </Collapse>;


  const renderTooltipTitle = (navItem: Aside.Nav) => {
    if (!short) return '';
    if (navItem.items) {
      return (
        <Box className="min-w-[226px]">
          <Typography className="text-white" variant="subheadMedium14">
            {navItem.title}
          </Typography>
          {navItem.items.map((item) =>
          <Link
            key={`${item.path}_popover-link`}
            className={cn(classes.subItemPopover, "block opacity-50 transition-opacity mb-1 text-white hover:opacity-100", { "opacity-100":
              item.active })
            }
            to={`${item.path}?project=${project}`}>

              {item.title}
            </Link>
          )}
        </Box>);

    }
    return (
      <Typography className="text-white" variant="subheadMedium14">
        {navItem.title}
      </Typography>);

  };

  return (
    <Box className={cn(classes.root, "relative h-[calc(100% + 24px)] pt-3 mr-6 ml-[-12px] w-[prop(maxWidth)px] shrink-0 transition", { "w-[prop(minWidth)px]": short })}>
      <Box className={cn(classes.items, "sticky top-5 pr-3 overflow-hidden overflow-y-auto")} role="tablist" aria-orientation="vertical" tabIndex={0}>
        {menuItems?.map?.((navItem, parentIndex) =>
        <Box key={`content-navigation_${navItem.path}`}>
            <Tooltip>
              <TooltipTrigger asChild>{renderNavItem(navItem, parentIndex)}</TooltipTrigger>
              <TooltipContent side="right">{renderTooltipTitle(navItem)}</TooltipContent>
            </Tooltip>
            {navItem.items && renderSubItems(navItem, parentIndex)}
          </Box>
        )}
      </Box>
      <Box className={cn("fixed bottom-6 ml-[207px] transition", { "ml-6": short })}>
        <ButtonShort
          short={short}
          onClick={toggleShort}
          tooltipTitle={short ? `Open ${currentChild.title}` : `Close ${currentChild.title}`} />

      </Box>
    </Box>);

});

ContentNavigation.displayName = 'ContentNavigation';

export default ContentNavigation;