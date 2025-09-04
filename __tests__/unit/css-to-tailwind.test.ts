import { CSS_TO_TAILWIND_MAP } from '../../src/mappings/css-to-tailwind.js';

describe('CSS to Tailwind Mappings', () => {
  describe('Display mappings', () => {
    it('should convert display values correctly', () => {
      expect(CSS_TO_TAILWIND_MAP.display('block')).toEqual(['block']);
      expect(CSS_TO_TAILWIND_MAP.display('flex')).toEqual(['flex']);
      expect(CSS_TO_TAILWIND_MAP.display('grid')).toEqual(['grid']);
      expect(CSS_TO_TAILWIND_MAP.display('inline-block')).toEqual(['inline-block']);
      expect(CSS_TO_TAILWIND_MAP.display('none')).toEqual(['hidden']);
      expect(CSS_TO_TAILWIND_MAP.display('hidden')).toEqual(['hidden']);
    });

    it('should return empty array for unknown display values', () => {
      expect(CSS_TO_TAILWIND_MAP.display('invalid')).toEqual([]);
    });
  });

  describe('Flexbox mappings', () => {
    it('should convert flexDirection values', () => {
      expect(CSS_TO_TAILWIND_MAP.flexDirection('row')).toEqual(['flex-row']);
      expect(CSS_TO_TAILWIND_MAP.flexDirection('column')).toEqual(['flex-col']);
      expect(CSS_TO_TAILWIND_MAP.flexDirection('row-reverse')).toEqual(['flex-row-reverse']);
      expect(CSS_TO_TAILWIND_MAP.flexDirection('column-reverse')).toEqual(['flex-col-reverse']);
    });

    it('should convert alignItems values', () => {
      expect(CSS_TO_TAILWIND_MAP.alignItems('flex-start')).toEqual(['items-start']);
      expect(CSS_TO_TAILWIND_MAP.alignItems('center')).toEqual(['items-center']);
      expect(CSS_TO_TAILWIND_MAP.alignItems('flex-end')).toEqual(['items-end']);
      expect(CSS_TO_TAILWIND_MAP.alignItems('stretch')).toEqual(['items-stretch']);
      expect(CSS_TO_TAILWIND_MAP.alignItems('baseline')).toEqual(['items-baseline']);
    });

    it('should convert justifyContent values', () => {
      expect(CSS_TO_TAILWIND_MAP.justifyContent('flex-start')).toEqual(['justify-start']);
      expect(CSS_TO_TAILWIND_MAP.justifyContent('center')).toEqual(['justify-center']);
      expect(CSS_TO_TAILWIND_MAP.justifyContent('space-between')).toEqual(['justify-between']);
      expect(CSS_TO_TAILWIND_MAP.justifyContent('space-around')).toEqual(['justify-around']);
      expect(CSS_TO_TAILWIND_MAP.justifyContent('space-evenly')).toEqual(['justify-evenly']);
    });

    it('should convert alignContent values', () => {
      expect(CSS_TO_TAILWIND_MAP.alignContent('flex-start')).toEqual(['content-start']);
      expect(CSS_TO_TAILWIND_MAP.alignContent('center')).toEqual(['content-center']);
      expect(CSS_TO_TAILWIND_MAP.alignContent('space-between')).toEqual(['content-between']);
      expect(CSS_TO_TAILWIND_MAP.alignContent('stretch')).toEqual(['content-stretch']);
    });

    it('should convert flexWrap values', () => {
      expect(CSS_TO_TAILWIND_MAP.flexWrap('wrap')).toEqual(['flex-wrap']);
      expect(CSS_TO_TAILWIND_MAP.flexWrap('nowrap')).toEqual(['flex-nowrap']);
      expect(CSS_TO_TAILWIND_MAP.flexWrap('wrap-reverse')).toEqual(['flex-wrap-reverse']);
    });
  });

  describe('Grid mappings', () => {
    it('should convert gridTemplateColumns values', () => {
      expect(CSS_TO_TAILWIND_MAP.gridTemplateColumns('1fr')).toEqual(['grid-cols-1']);
      expect(CSS_TO_TAILWIND_MAP.gridTemplateColumns('1fr 1fr')).toEqual(['grid-cols-2']);
      expect(CSS_TO_TAILWIND_MAP.gridTemplateColumns('1fr 1fr 1fr')).toEqual(['grid-cols-3']);
    });

    it('should handle repeat patterns in gridTemplateColumns', () => {
      expect(CSS_TO_TAILWIND_MAP.gridTemplateColumns('repeat(4, 1fr)')).toEqual(['grid-cols-4']);
      expect(CSS_TO_TAILWIND_MAP.gridTemplateColumns('repeat(auto-fit, minmax(200px, 1fr))')).toEqual(['grid-cols-[repeat(auto-fit, minmax(200px, 1fr))]']);
    });

    it('should convert complex gridTemplateColumns to arbitrary values', () => {
      expect(CSS_TO_TAILWIND_MAP.gridTemplateColumns('100px auto 1fr')).toEqual(['grid-cols-[100px auto 1fr]']);
    });

    it('should convert gridTemplateRows values', () => {
      expect(CSS_TO_TAILWIND_MAP.gridTemplateRows('auto')).toEqual(['grid-rows-auto']);
      expect(CSS_TO_TAILWIND_MAP.gridTemplateRows('1fr')).toEqual(['grid-rows-1']);
      expect(CSS_TO_TAILWIND_MAP.gridTemplateRows('1fr 1fr')).toEqual(['grid-rows-2']);
      expect(CSS_TO_TAILWIND_MAP.gridTemplateRows('100px auto')).toEqual(['grid-rows-[100px auto]']);
    });
  });

  describe('Position mappings', () => {
    it('should convert position values', () => {
      expect(CSS_TO_TAILWIND_MAP.position('static')).toEqual(['static']);
      expect(CSS_TO_TAILWIND_MAP.position('relative')).toEqual(['relative']);
      expect(CSS_TO_TAILWIND_MAP.position('absolute')).toEqual(['absolute']);
      expect(CSS_TO_TAILWIND_MAP.position('fixed')).toEqual(['fixed']);
      expect(CSS_TO_TAILWIND_MAP.position('sticky')).toEqual(['sticky']);
    });
  });

  describe('Spacing mappings', () => {
    it('should convert single margin values', () => {
      expect(CSS_TO_TAILWIND_MAP.margin('0')).toEqual(['m-0']);
      expect(CSS_TO_TAILWIND_MAP.margin('8px')).toEqual(['m-2']);
      expect(CSS_TO_TAILWIND_MAP.margin('16px')).toEqual(['m-4']);
      expect(CSS_TO_TAILWIND_MAP.margin('24px')).toEqual(['m-6']);
    });

    it('should convert multi-value margin (vertical horizontal)', () => {
      expect(CSS_TO_TAILWIND_MAP.margin('8px 16px')).toEqual(['my-2', 'mx-4']);
    });

    it('should convert four-value margin (top right bottom left)', () => {
      expect(CSS_TO_TAILWIND_MAP.margin('8px 16px 12px 4px')).toEqual(['mt-2', 'mr-4', 'mb-3', 'ml-1']);
    });

    it('should convert specific margin directions', () => {
      expect(CSS_TO_TAILWIND_MAP.marginTop('8px')).toEqual(['mt-2']);
      expect(CSS_TO_TAILWIND_MAP.marginRight('16px')).toEqual(['mr-4']);
      expect(CSS_TO_TAILWIND_MAP.marginBottom('12px')).toEqual(['mb-3']);
      expect(CSS_TO_TAILWIND_MAP.marginLeft('4px')).toEqual(['ml-1']);
    });

    it('should convert padding values', () => {
      expect(CSS_TO_TAILWIND_MAP.padding('16px')).toEqual(['p-4']);
      expect(CSS_TO_TAILWIND_MAP.paddingTop('8px')).toEqual(['pt-2']);
      expect(CSS_TO_TAILWIND_MAP.paddingRight('12px')).toEqual(['pr-3']);
    });

    it('should handle custom spacing values with arbitrary syntax', () => {
      expect(CSS_TO_TAILWIND_MAP.margin('18px')).toEqual(['m-[18px]']);
      expect(CSS_TO_TAILWIND_MAP.padding('7px')).toEqual(['p-[7px]']);
    });
  });

  describe('Sizing mappings', () => {
    it('should convert width values', () => {
      expect(CSS_TO_TAILWIND_MAP.width('auto')).toEqual(['w-auto']);
      expect(CSS_TO_TAILWIND_MAP.width('100%')).toEqual(['w-full']);
      expect(CSS_TO_TAILWIND_MAP.width('100vw')).toEqual(['w-screen']);
      expect(CSS_TO_TAILWIND_MAP.width('50%')).toEqual(['w-1/2']);
      expect(CSS_TO_TAILWIND_MAP.width('25%')).toEqual(['w-1/4']);
      expect(CSS_TO_TAILWIND_MAP.width('75%')).toEqual(['w-3/4']);
    });

    it('should convert height values', () => {
      expect(CSS_TO_TAILWIND_MAP.height('auto')).toEqual(['h-auto']);
      expect(CSS_TO_TAILWIND_MAP.height('100vh')).toEqual(['h-screen']);
      expect(CSS_TO_TAILWIND_MAP.height('64px')).toEqual(['h-16']);
    });

    it('should convert pixel values to Tailwind scale', () => {
      expect(CSS_TO_TAILWIND_MAP.width('16px')).toEqual(['w-4']);
      expect(CSS_TO_TAILWIND_MAP.width('64px')).toEqual(['w-16']);
      expect(CSS_TO_TAILWIND_MAP.width('256px')).toEqual(['w-64']);
    });

    it('should handle custom pixel values with arbitrary syntax', () => {
      expect(CSS_TO_TAILWIND_MAP.width('123px')).toEqual(['w-[123px]']);
      expect(CSS_TO_TAILWIND_MAP.height('77px')).toEqual(['h-[77px]']);
    });

    it('should convert min/max width and height', () => {
      expect(CSS_TO_TAILWIND_MAP.minWidth('0')).toEqual(['min-w-0']);
      expect(CSS_TO_TAILWIND_MAP.maxWidth('100%')).toEqual(['max-w-full']);
      expect(CSS_TO_TAILWIND_MAP.minHeight('64px')).toEqual(['min-h-16']);
      expect(CSS_TO_TAILWIND_MAP.maxHeight('100vh')).toEqual(['max-h-screen']);
    });
  });

  describe('Color mappings', () => {
    it('should convert common color values', () => {
      expect(CSS_TO_TAILWIND_MAP.color('#ffffff')).toEqual(['text-white']);
      expect(CSS_TO_TAILWIND_MAP.color('#fff')).toEqual(['text-white']);
      expect(CSS_TO_TAILWIND_MAP.color('#000000')).toEqual(['text-black']);
      expect(CSS_TO_TAILWIND_MAP.color('#000')).toEqual(['text-black']);
      expect(CSS_TO_TAILWIND_MAP.color('white')).toEqual(['text-white']);
      expect(CSS_TO_TAILWIND_MAP.color('black')).toEqual(['text-black']);
      expect(CSS_TO_TAILWIND_MAP.color('transparent')).toEqual(['text-transparent']);
      expect(CSS_TO_TAILWIND_MAP.color('currentColor')).toEqual(['text-current']);
    });

    it('should convert backgroundColor values', () => {
      expect(CSS_TO_TAILWIND_MAP.backgroundColor('white')).toEqual(['bg-white']);
      expect(CSS_TO_TAILWIND_MAP.backgroundColor('#ff0000')).toEqual(['bg-[#ff0000]']);
      expect(CSS_TO_TAILWIND_MAP.backgroundColor('rgb(255, 0, 0)')).toEqual(['bg-[rgb(255, 0, 0)]']);
    });

    it('should convert borderColor values', () => {
      expect(CSS_TO_TAILWIND_MAP.borderColor('black')).toEqual(['border-black']);
      expect(CSS_TO_TAILWIND_MAP.borderColor('#333333')).toEqual(['border-[#333333]']);
    });

    it('should handle custom hex colors with arbitrary syntax', () => {
      expect(CSS_TO_TAILWIND_MAP.color('#1a2b3c')).toEqual(['text-[#1a2b3c]']);
      expect(CSS_TO_TAILWIND_MAP.backgroundColor('#f5f5f5')).toEqual(['bg-[#f5f5f5]']);
    });

    it('should handle RGB/RGBA colors', () => {
      expect(CSS_TO_TAILWIND_MAP.color('rgb(255, 255, 255)')).toEqual(['text-[rgb(255, 255, 255)]']);
      expect(CSS_TO_TAILWIND_MAP.backgroundColor('rgba(0, 0, 0, 0.5)')).toEqual(['bg-[rgba(0, 0, 0, 0.5)]']);
    });
  });

  describe('Typography mappings', () => {
    it('should convert fontSize values', () => {
      expect(CSS_TO_TAILWIND_MAP.fontSize('12')).toEqual(['text-xs']);
      expect(CSS_TO_TAILWIND_MAP.fontSize('14')).toEqual(['text-sm']);
      expect(CSS_TO_TAILWIND_MAP.fontSize('16')).toEqual(['text-base']);
      expect(CSS_TO_TAILWIND_MAP.fontSize('18')).toEqual(['text-lg']);
      expect(CSS_TO_TAILWIND_MAP.fontSize('24')).toEqual(['text-2xl']);
    });

    it('should handle custom fontSize with arbitrary syntax', () => {
      expect(CSS_TO_TAILWIND_MAP.fontSize('15')).toEqual(['text-[15px]']);
      expect(CSS_TO_TAILWIND_MAP.fontSize('22')).toEqual(['text-[22px]']);
    });

    it('should convert fontWeight values', () => {
      expect(CSS_TO_TAILWIND_MAP.fontWeight('100')).toEqual(['font-thin']);
      expect(CSS_TO_TAILWIND_MAP.fontWeight('400')).toEqual(['font-normal']);
      expect(CSS_TO_TAILWIND_MAP.fontWeight('700')).toEqual(['font-bold']);
      expect(CSS_TO_TAILWIND_MAP.fontWeight('900')).toEqual(['font-black']);
      expect(CSS_TO_TAILWIND_MAP.fontWeight('normal')).toEqual(['font-normal']);
      expect(CSS_TO_TAILWIND_MAP.fontWeight('bold')).toEqual(['font-bold']);
    });

    it('should handle custom fontWeight with arbitrary syntax', () => {
      expect(CSS_TO_TAILWIND_MAP.fontWeight('350')).toEqual(['font-[350]']);
    });

    it('should convert lineHeight values', () => {
      expect(CSS_TO_TAILWIND_MAP.lineHeight('1')).toEqual(['leading-none']);
      expect(CSS_TO_TAILWIND_MAP.lineHeight('1.25')).toEqual(['leading-tight']);
      expect(CSS_TO_TAILWIND_MAP.lineHeight('1.5')).toEqual(['leading-normal']);
      expect(CSS_TO_TAILWIND_MAP.lineHeight('2')).toEqual(['leading-loose']);
    });

    it('should handle custom lineHeight with arbitrary syntax', () => {
      expect(CSS_TO_TAILWIND_MAP.lineHeight('1.3')).toEqual(['leading-[1.3]']);
    });

    it('should convert textAlign values', () => {
      expect(CSS_TO_TAILWIND_MAP.textAlign('left')).toEqual(['text-left']);
      expect(CSS_TO_TAILWIND_MAP.textAlign('center')).toEqual(['text-center']);
      expect(CSS_TO_TAILWIND_MAP.textAlign('right')).toEqual(['text-right']);
      expect(CSS_TO_TAILWIND_MAP.textAlign('justify')).toEqual(['text-justify']);
    });

    it('should convert textTransform values', () => {
      expect(CSS_TO_TAILWIND_MAP.textTransform('uppercase')).toEqual(['uppercase']);
      expect(CSS_TO_TAILWIND_MAP.textTransform('lowercase')).toEqual(['lowercase']);
      expect(CSS_TO_TAILWIND_MAP.textTransform('capitalize')).toEqual(['capitalize']);
      expect(CSS_TO_TAILWIND_MAP.textTransform('none')).toEqual(['normal-case']);
    });

    it('should convert textDecoration values', () => {
      expect(CSS_TO_TAILWIND_MAP.textDecoration('none')).toEqual(['no-underline']);
      expect(CSS_TO_TAILWIND_MAP.textDecoration('underline')).toEqual(['underline']);
      expect(CSS_TO_TAILWIND_MAP.textDecoration('line-through')).toEqual(['line-through']);
    });

    it('should convert letterSpacing values', () => {
      expect(CSS_TO_TAILWIND_MAP.letterSpacing('-0.05em')).toEqual(['tracking-tighter']);
      expect(CSS_TO_TAILWIND_MAP.letterSpacing('0')).toEqual(['tracking-normal']);
      expect(CSS_TO_TAILWIND_MAP.letterSpacing('0.05em')).toEqual(['tracking-wider']);
      expect(CSS_TO_TAILWIND_MAP.letterSpacing('0.1em')).toEqual(['tracking-widest']);
    });

    it('should handle custom letterSpacing with arbitrary syntax', () => {
      expect(CSS_TO_TAILWIND_MAP.letterSpacing('0.03em')).toEqual(['tracking-[0.03em]']);
    });
  });

  describe('Border mappings', () => {
    it('should convert border values', () => {
      expect(CSS_TO_TAILWIND_MAP.border('none')).toEqual(['border-0']);
      expect(CSS_TO_TAILWIND_MAP.border('0')).toEqual(['border-0']);
      expect(CSS_TO_TAILWIND_MAP.border('1px solid black')).toEqual(['border']);
      expect(CSS_TO_TAILWIND_MAP.border('2px solid red')).toEqual(['border-2']);
      expect(CSS_TO_TAILWIND_MAP.border('4px dashed blue')).toEqual(['border-4']);
    });

    it('should convert borderWidth values', () => {
      expect(CSS_TO_TAILWIND_MAP.borderWidth('0')).toEqual(['border-0']);
      expect(CSS_TO_TAILWIND_MAP.borderWidth('1')).toEqual(['border']);
      expect(CSS_TO_TAILWIND_MAP.borderWidth('2')).toEqual(['border-2']);
      expect(CSS_TO_TAILWIND_MAP.borderWidth('4')).toEqual(['border-4']);
      expect(CSS_TO_TAILWIND_MAP.borderWidth('8')).toEqual(['border-8']);
    });

    it('should handle custom borderWidth with arbitrary syntax', () => {
      expect(CSS_TO_TAILWIND_MAP.borderWidth('3')).toEqual(['border-[3px]']);
    });

    it('should convert borderRadius values', () => {
      expect(CSS_TO_TAILWIND_MAP.borderRadius('0')).toEqual(['rounded-none']);
      expect(CSS_TO_TAILWIND_MAP.borderRadius('2')).toEqual(['rounded-sm']);
      expect(CSS_TO_TAILWIND_MAP.borderRadius('4')).toEqual(['rounded']);
      expect(CSS_TO_TAILWIND_MAP.borderRadius('8')).toEqual(['rounded-lg']);
      expect(CSS_TO_TAILWIND_MAP.borderRadius('16')).toEqual(['rounded-2xl']);
      expect(CSS_TO_TAILWIND_MAP.borderRadius('9999')).toEqual(['rounded-full']);
      expect(CSS_TO_TAILWIND_MAP.borderRadius('50%')).toEqual(['rounded-full']);
    });

    it('should handle custom borderRadius with arbitrary syntax', () => {
      expect(CSS_TO_TAILWIND_MAP.borderRadius('5')).toEqual(['rounded-[5px]']);
    });
  });

  describe('Effects mappings', () => {
    it('should convert opacity values', () => {
      expect(CSS_TO_TAILWIND_MAP.opacity(0)).toEqual(['opacity-0']);
      expect(CSS_TO_TAILWIND_MAP.opacity(0.05)).toEqual(['opacity-5']);
      expect(CSS_TO_TAILWIND_MAP.opacity(0.25)).toEqual(['opacity-25']);
      expect(CSS_TO_TAILWIND_MAP.opacity(0.5)).toEqual(['opacity-50']);
      expect(CSS_TO_TAILWIND_MAP.opacity(0.75)).toEqual(['opacity-75']);
      expect(CSS_TO_TAILWIND_MAP.opacity(1)).toEqual(['opacity-100']);
    });

    it('should handle opacity edge cases', () => {
      expect(CSS_TO_TAILWIND_MAP.opacity(0.1)).toEqual(['opacity-10']);
      expect(CSS_TO_TAILWIND_MAP.opacity(0.95)).toEqual(['opacity-95']);
      expect(CSS_TO_TAILWIND_MAP.opacity(0.97)).toEqual(['opacity-100']);
    });
  });

  describe('Cursor mappings', () => {
    it('should convert cursor values', () => {
      expect(CSS_TO_TAILWIND_MAP.cursor('auto')).toEqual(['cursor-auto']);
      expect(CSS_TO_TAILWIND_MAP.cursor('default')).toEqual(['cursor-default']);
      expect(CSS_TO_TAILWIND_MAP.cursor('pointer')).toEqual(['cursor-pointer']);
      expect(CSS_TO_TAILWIND_MAP.cursor('wait')).toEqual(['cursor-wait']);
      expect(CSS_TO_TAILWIND_MAP.cursor('text')).toEqual(['cursor-text']);
      expect(CSS_TO_TAILWIND_MAP.cursor('not-allowed')).toEqual(['cursor-not-allowed']);
    });

    it('should handle custom cursor with arbitrary syntax', () => {
      expect(CSS_TO_TAILWIND_MAP.cursor('grab')).toEqual(['cursor-[grab]']);
    });
  });

  describe('Overflow mappings', () => {
    it('should convert overflow values', () => {
      expect(CSS_TO_TAILWIND_MAP.overflow('visible')).toEqual(['overflow-visible']);
      expect(CSS_TO_TAILWIND_MAP.overflow('hidden')).toEqual(['overflow-hidden']);
      expect(CSS_TO_TAILWIND_MAP.overflow('scroll')).toEqual(['overflow-scroll']);
      expect(CSS_TO_TAILWIND_MAP.overflow('auto')).toEqual(['overflow-auto']);
    });

    it('should convert overflowX values', () => {
      expect(CSS_TO_TAILWIND_MAP.overflowX('hidden')).toEqual(['overflow-x-hidden']);
      expect(CSS_TO_TAILWIND_MAP.overflowX('scroll')).toEqual(['overflow-x-scroll']);
    });

    it('should convert overflowY values', () => {
      expect(CSS_TO_TAILWIND_MAP.overflowY('hidden')).toEqual(['overflow-y-hidden']);
      expect(CSS_TO_TAILWIND_MAP.overflowY('auto')).toEqual(['overflow-y-auto']);
    });
  });

  describe('Z-Index mappings', () => {
    it('should convert zIndex values', () => {
      expect(CSS_TO_TAILWIND_MAP.zIndex('0')).toEqual(['z-0']);
      expect(CSS_TO_TAILWIND_MAP.zIndex('10')).toEqual(['z-10']);
      expect(CSS_TO_TAILWIND_MAP.zIndex('20')).toEqual(['z-20']);
      expect(CSS_TO_TAILWIND_MAP.zIndex('50')).toEqual(['z-50']);
      expect(CSS_TO_TAILWIND_MAP.zIndex('auto')).toEqual(['z-auto']);
    });

    it('should handle custom zIndex with arbitrary syntax', () => {
      expect(CSS_TO_TAILWIND_MAP.zIndex('999')).toEqual(['z-[999]']);
    });
  });

  describe('Transition mappings', () => {
    it('should convert transition values', () => {
      expect(CSS_TO_TAILWIND_MAP.transition('all 0.3s ease')).toEqual(['transition-all']);
      expect(CSS_TO_TAILWIND_MAP.transition('colors 0.2s')).toEqual(['transition-colors']);
      expect(CSS_TO_TAILWIND_MAP.transition('opacity 0.3s')).toEqual(['transition-opacity']);
      expect(CSS_TO_TAILWIND_MAP.transition('transform 0.2s')).toEqual(['transition-transform']);
      expect(CSS_TO_TAILWIND_MAP.transition('width 0.3s')).toEqual(['transition']);
    });

    it('should convert transitionDuration values', () => {
      expect(CSS_TO_TAILWIND_MAP.transitionDuration('75')).toEqual(['duration-75']);
      expect(CSS_TO_TAILWIND_MAP.transitionDuration('150')).toEqual(['duration-150']);
      expect(CSS_TO_TAILWIND_MAP.transitionDuration('300')).toEqual(['duration-300']);
      expect(CSS_TO_TAILWIND_MAP.transitionDuration('1000')).toEqual(['duration-1000']);
      expect(CSS_TO_TAILWIND_MAP.transitionDuration('75ms')).toEqual(['duration-75']);
    });

    it('should handle custom transitionDuration with arbitrary syntax', () => {
      expect(CSS_TO_TAILWIND_MAP.transitionDuration('250')).toEqual(['duration-[250]']);
      expect(CSS_TO_TAILWIND_MAP.transitionDuration('2s')).toEqual(['duration-[2s]']);
    });
  });

  describe('Gap mappings (Grid and Flexbox)', () => {
    it('should convert gap values using spacing converter', () => {
      expect(CSS_TO_TAILWIND_MAP.gap('8px')).toEqual(['gap-2']);
      expect(CSS_TO_TAILWIND_MAP.gap('16px')).toEqual(['gap-4']);
      expect(CSS_TO_TAILWIND_MAP.gap('24px')).toEqual(['gap-6']);
    });

    it('should convert gridGap values using spacing converter', () => {
      expect(CSS_TO_TAILWIND_MAP.gridGap('12px')).toEqual(['gap-3']);
      expect(CSS_TO_TAILWIND_MAP.gridGap('20px')).toEqual(['gap-5']);
    });

    it('should handle multi-value gap (row column)', () => {
      expect(CSS_TO_TAILWIND_MAP.gap('8px 16px')).toEqual(['gapy-2', 'gapx-4']);
    });
  });

  describe('Position offset mappings', () => {
    it('should convert top/right/bottom/left values using spacing converter', () => {
      expect(CSS_TO_TAILWIND_MAP.top('0')).toEqual(['top-0']);
      expect(CSS_TO_TAILWIND_MAP.top('8px')).toEqual(['top-2']);
      expect(CSS_TO_TAILWIND_MAP.right('16px')).toEqual(['right-4']);
      expect(CSS_TO_TAILWIND_MAP.bottom('auto')).toEqual(['bottom-auto']);
      expect(CSS_TO_TAILWIND_MAP.left('100%')).toEqual(['left-full']);
    });
  });

  describe('Edge cases and type handling', () => {
    it('should handle number inputs', () => {
      expect(CSS_TO_TAILWIND_MAP.margin(16)).toEqual(['m-4']);
      expect(CSS_TO_TAILWIND_MAP.padding(8)).toEqual(['p-2']);
      expect(CSS_TO_TAILWIND_MAP.fontSize(14)).toEqual(['text-sm']);
    });

    it('should handle string number inputs', () => {
      expect(CSS_TO_TAILWIND_MAP.width('64')).toEqual(['w-[64px]']);
      expect(CSS_TO_TAILWIND_MAP.height('32')).toEqual(['h-[32px]']);
    });

    it('should return empty arrays for unknown values in strict mappings', () => {
      expect(CSS_TO_TAILWIND_MAP.display('invalid')).toEqual([]);
      expect(CSS_TO_TAILWIND_MAP.flexDirection('invalid')).toEqual([]);
      expect(CSS_TO_TAILWIND_MAP.position('invalid')).toEqual([]);
      expect(CSS_TO_TAILWIND_MAP.textAlign('invalid')).toEqual([]);
    });

    it('should handle empty or undefined values gracefully', () => {
      expect(CSS_TO_TAILWIND_MAP.display('')).toEqual([]);
      expect(CSS_TO_TAILWIND_MAP.margin('')).toEqual(['m-[px]']);
    });
  });
});