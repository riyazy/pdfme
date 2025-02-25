import * as fontkit from 'fontkit';
import type { Font as FontKitFont } from 'fontkit';
import { FontWidthCalcValues, Template, Schema, Font, isTextSchema, TextSchema } from './type';
import { Buffer } from 'buffer';
import {
  DEFAULT_FONT_VALUE,
  DEFAULT_FONT_NAME,
  DEFAULT_FONT_SIZE,
  DEFAULT_CHARACTER_SPACING,
  DEFAULT_LINE_HEIGHT,
  FONT_SIZE_ADJUSTMENT,
  DEFAULT_DYNAMIC_FIT,
  DYNAMIC_FIT_HORIZONTAL,
  DYNAMIC_FIT_VERTICAL,
  VERTICAL_ALIGN_TOP,
} from './constants';
import { mm2pt, pt2mm, pt2px } from './helper';
import { b64toUint8Array } from "."

export const getFallbackFontName = (font: Font) => {
  const initial = '';
  const fallbackFontName = Object.entries(font).reduce((acc, cur) => {
    const [fontName, fontValue] = cur;

    return !acc && fontValue.fallback ? fontName : acc;
  }, initial);
  if (fallbackFontName === initial) {
    throw Error(`fallback flag is not found in font. true fallback flag must be only one.`);
  }

  return fallbackFontName;
};

const getFallbackFont = (font: Font) => {
  const fallbackFontName = getFallbackFontName(font);
  return font[fallbackFontName];
};

export const getDefaultFont = (): Font => ({
  [DEFAULT_FONT_NAME]: { data: b64toUint8Array(DEFAULT_FONT_VALUE), fallback: true },
});

const uniq = <T>(array: Array<T>) => Array.from(new Set(array));

const getFontNamesInSchemas = (schemas: { [key: string]: Schema }[]) =>
  uniq(
    schemas
      .map((s) => Object.values(s).map((v) => (isTextSchema(v) ? v.fontName : '')))
      .reduce((acc, cur) => acc.concat(cur), [] as (string | undefined)[])
      .filter(Boolean) as string[]
  );

export const checkFont = (arg: { font: Font; template: Template }) => {
  const {
    font,
    template: { schemas },
  } = arg;
  const fontValues = Object.values(font);
  const fallbackFontNum = fontValues.reduce((acc, cur) => (cur.fallback ? acc + 1 : acc), 0);
  if (fallbackFontNum === 0) {
    throw Error(`fallback flag is not found in font. true fallback flag must be only one.`);
  }
  if (fallbackFontNum > 1) {
    throw Error(
      `${fallbackFontNum} fallback flags found in font. true fallback flag must be only one.`
    );
  }

  const fontNamesInSchemas = getFontNamesInSchemas(schemas);
  const fontNames = Object.keys(font);
  if (fontNamesInSchemas.some((f) => !fontNames.includes(f))) {
    throw Error(
      `${fontNamesInSchemas
        .filter((f) => !fontNames.includes(f))
        .join()} of template.schemas is not found in font.`
    );
  }
};

export const getBrowserVerticalFontAdjustments = (
  fontKitFont: FontKitFont,
  fontSize: number,
  lineHeight: number,
  verticalAlignment: string
) => {
  const { ascent, descent, unitsPerEm } = fontKitFont;

  // Fonts have a designed line height that the browser renders when using `line-height: normal`
  const fontBaseLineHeight = (ascent - descent) / unitsPerEm;

  // For vertical alignment top
  // To achieve consistent positioning between browser and PDF, we apply the difference between
  // the font's actual height and the font size in pixels.
  // Browsers middle the font within this height, so we only need half of it to apply to the top.
  // This means the font renders a bit lower in the browser, but achieves PDF alignment
  const topAdjustment = (fontBaseLineHeight * fontSize - fontSize) / 2;

  if (verticalAlignment === VERTICAL_ALIGN_TOP) {
    return { topAdj: pt2px(topAdjustment), bottomAdj: 0 };
  }

  // For vertical alignment bottom and middle
  // When browsers render text in a non-form element (such as a <div>), some of the text may be
  // lowered below and outside the containing element if the line height used is less than
  // the base line-height of the font.
  // This behaviour does not happen in a <textarea> though, so we need to adjust the positioning
  // for consistency between editing and viewing to stop text jumping up and down.
  // This portion of text is half of the difference between the base line height and the used
  // line height. If using the same or higher line-height than the base font, then line-height
  // takes over in the browser and this adjustment is not needed.
  // Unlike the top adjustment - this is only driven by browser behaviour, not PDF alignment.
  let bottomAdjustment = 0;
  if (lineHeight < fontBaseLineHeight) {
    bottomAdjustment = ((fontBaseLineHeight - lineHeight) * fontSize) / 2;
  }

  return { topAdj: 0, bottomAdj: pt2px(bottomAdjustment) };
};

export const getFontDescentInPt = (fontKitFont: FontKitFont, fontSize: number) => {
  const { descent, unitsPerEm } = fontKitFont;

  return (descent / unitsPerEm) * fontSize;
};

export const heightOfFontAtSize = (fontKitFont: FontKitFont, fontSize: number) => {
  const { ascent, descent, bbox, unitsPerEm } = fontKitFont;

  const scale = 1000 / unitsPerEm;
  const yTop = (ascent || bbox.maxY) * scale;
  const yBottom = (descent || bbox.minY) * scale;

  let height = yTop - yBottom;
  height -= Math.abs(descent * scale) || 0;

  return (height / 1000) * fontSize;
};

const calculateCharacterSpacing = (textContent: string, textCharacterSpacing: number) => {
  return (textContent.length - 1) * textCharacterSpacing;
};

export const widthOfTextAtSize = (text: string, fontKitFont: FontKitFont, fontSize: number, characterSpacing: number) => {
  const { glyphs } = fontKitFont.layout(text);
  const scale = 1000 / fontKitFont.unitsPerEm;
  const standardWidth =
    glyphs.reduce((totalWidth, glyph) => totalWidth + glyph.advanceWidth * scale, 0) *
    (fontSize / 1000);
  return standardWidth + calculateCharacterSpacing(text, characterSpacing);
};

const fontKitFontCache: { [fontName: string]: FontKitFont } = {};
export const getFontKitFont = async (textSchema: TextSchema, font: Font) => {
  const fontName = textSchema.fontName || getFallbackFontName(font);
  if (fontKitFontCache[fontName]) {
    return fontKitFontCache[fontName];
  }

  const currentFont = font[fontName] || getFallbackFont(font) || getDefaultFont()[DEFAULT_FONT_NAME];
  let fontData = currentFont.data;
  if (typeof fontData === 'string') {
    fontData = fontData.startsWith('http') ? await fetch(fontData).then((res) => res.arrayBuffer()) : b64toUint8Array(fontData);
  }

  const fontKitFont = fontkit.create(fontData instanceof Buffer ? fontData : Buffer.from(fontData as ArrayBuffer));
  fontKitFontCache[fontName] = fontKitFont;

  return fontKitFont;
};


const isTextExceedingBoxWidth = (text: string, calcValues: FontWidthCalcValues) => {
  const { font, fontSize, characterSpacing, boxWidthInPt } = calcValues;
  const textWidth = widthOfTextAtSize(text, font, fontSize, characterSpacing);
  return textWidth > boxWidthInPt;
};

/**
 * Incrementally checks the current line for its real length
 * and returns the position where it exceeds the box width.
 * Returns `null` to indicate if textLine is shorter than the available box.
 */
const getOverPosition = (textLine: string, calcValues: FontWidthCalcValues) => {
  for (let i = 0; i <= textLine.length; i++) {
    if (isTextExceedingBoxWidth(textLine.slice(0, i + 1), calcValues)) {
      return i;
    }
  }

  return null;
};

/**
 * Gets the position of the split. Splits the exceeding line at
 * the last whitespace prior to it exceeding the bounding box width.
 */
const getSplitPosition = (textLine: string, calcValues: FontWidthCalcValues) => {
  const overPos = getOverPosition(textLine, calcValues);
  if (overPos === null) return textLine.length; // input line is shorter than the available space

  let overPosTmp = overPos;
  while (textLine[overPosTmp] !== ' ' && overPosTmp >= 0) {
    overPosTmp--;
  }

  // For very long lines with no whitespace use the original overPos
  return overPosTmp > 0 ? overPosTmp : overPos;
};

/**
 * Recursively splits the line at getSplitPosition.
 * If there is some leftover, split the rest again in the same manner.
 */
export const getSplittedLines = (textLine: string, calcValues: FontWidthCalcValues): string[] => {
  const splitPos = getSplitPosition(textLine, calcValues);
  const splittedLine = textLine.substring(0, splitPos);
  const rest = textLine.substring(splitPos).trimStart();

  if (rest === textLine) {
    // if we went so small that we want to split on the first char
    // then end recursion to avoid infinite loop
    return [textLine];
  }

  if (rest.length === 0) {
    // end recursion if there is no leftover
    return [splittedLine];
  }

  return [splittedLine, ...getSplittedLines(rest, calcValues)];
};

/**
 * If using dynamic font size, iteratively increment or decrement the
 * font size to fit the containing box.
 * Calculating space usage involves splitting lines where they exceed
 * the box width based on the proposed size.
 */
export const calculateDynamicFontSize = async ({
  textSchema,
  font,
  input,
  startingFontSize,
}: {
  textSchema: TextSchema;
  font: Font;
  input: string;
  startingFontSize?: number | undefined;
}) => {
  const {
    fontSize: schemaFontSize,
    dynamicFontSize: dynamicFontSizeSetting,
    characterSpacing: schemaCharacterSpacing,
    width: boxWidth,
    height: boxHeight,
    lineHeight = DEFAULT_LINE_HEIGHT,
  } = textSchema;
  const fontSize = startingFontSize || schemaFontSize || DEFAULT_FONT_SIZE;
  if (!dynamicFontSizeSetting) return fontSize;
  if (dynamicFontSizeSetting.max < dynamicFontSizeSetting.min) return fontSize;

  const characterSpacing = schemaCharacterSpacing ?? DEFAULT_CHARACTER_SPACING;
  const fontKitFont = await getFontKitFont(textSchema, font);
  const paragraphs = input.split('\n');

  let dynamicFontSize = fontSize;
  if (dynamicFontSize < dynamicFontSizeSetting.min) {
    dynamicFontSize = dynamicFontSizeSetting.min;
  } else if (dynamicFontSize > dynamicFontSizeSetting.max) {
    dynamicFontSize = dynamicFontSizeSetting.max;
  }
  const dynamicFontFit = dynamicFontSizeSetting.fit ?? DEFAULT_DYNAMIC_FIT;

  const calculateConstraints = (size: number) => {
    let totalWidthInMm = 0;
    let totalHeightInMm = 0;

    const boxWidthInPt = mm2pt(boxWidth);
    const firstLineTextHeight = heightOfFontAtSize(fontKitFont, size);
    const firstLineHeightInMm = pt2mm(firstLineTextHeight * lineHeight);
    const otherRowHeightInMm = pt2mm(size * lineHeight);

    paragraphs.forEach((paragraph, paraIndex) => {
      const lines = getSplittedLines(paragraph, {
        font: fontKitFont,
        fontSize: size,
        characterSpacing,
        boxWidthInPt,
      });
      lines.forEach((line, lineIndex) => {
        if (dynamicFontFit === DYNAMIC_FIT_VERTICAL) {
          // For vertical fit we want to consider the width of text lines where we detect a split
          const textWidth = widthOfTextAtSize(line, fontKitFont, size, characterSpacing);
          const textWidthInMm = pt2mm(textWidth);
          totalWidthInMm = Math.max(totalWidthInMm, textWidthInMm);
        }

        if (paraIndex + lineIndex === 0) {
          totalHeightInMm += firstLineHeightInMm;
        } else {
          totalHeightInMm += otherRowHeightInMm;
        }
      });
      if (dynamicFontFit === DYNAMIC_FIT_HORIZONTAL) {
        // For horizontal fit we want to consider the line's width 'unsplit'
        const textWidth = widthOfTextAtSize(paragraph, fontKitFont, size, characterSpacing);
        const textWidthInMm = pt2mm(textWidth);
        totalWidthInMm = Math.max(totalWidthInMm, textWidthInMm);
      }
    });

    return { totalWidthInMm, totalHeightInMm };
  };

  const shouldFontGrowToFit = (totalWidthInMm: number, totalHeightInMm: number) => {
    if (dynamicFontSize >= dynamicFontSizeSetting.max) {
      return false;
    }
    if (dynamicFontFit === DYNAMIC_FIT_HORIZONTAL) {
      return totalWidthInMm < boxWidth;
    }
    return totalHeightInMm < boxHeight;
  };

  const shouldFontShrinkToFit = (totalWidthInMm: number, totalHeightInMm: number) => {
    if (dynamicFontSize <= dynamicFontSizeSetting.min || dynamicFontSize <= 0) {
      return false;
    }
    return totalWidthInMm > boxWidth || totalHeightInMm > boxHeight;
  };

  let { totalWidthInMm, totalHeightInMm } = calculateConstraints(dynamicFontSize);

  // Attempt to increase the font size up to desired fit
  while (shouldFontGrowToFit(totalWidthInMm, totalHeightInMm)) {
    dynamicFontSize += FONT_SIZE_ADJUSTMENT;
    const { totalWidthInMm: newWidth, totalHeightInMm: newHeight } = calculateConstraints(dynamicFontSize);

    if (newHeight < boxHeight) {
      totalWidthInMm = newWidth;
      totalHeightInMm = newHeight;
    } else {
      dynamicFontSize -= FONT_SIZE_ADJUSTMENT;
      break;
    }
  }

  // Attempt to decrease the font size down to desired fit
  while (shouldFontShrinkToFit(totalWidthInMm, totalHeightInMm)) {
    dynamicFontSize -= FONT_SIZE_ADJUSTMENT;
    ({ totalWidthInMm, totalHeightInMm } = calculateConstraints(dynamicFontSize));
  }

  return dynamicFontSize;
};
