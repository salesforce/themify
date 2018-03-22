const postcss = require('postcss');
const fs = require('fs-extra');
const hexToRgba = require('hex-to-rgba');
const THEMIFY = 'themify';
const JSToSass = require('./helpers/js-sass');

export interface ThemifyOptions {
  /**
   * Whether we would like to generate the CSS variables.
   * This should be true, unless you want to inject them yourself.
   */
  createVars: boolean;

  /**
   * Pallete configuration
   */
  pallete: any;

  /**
   * A class prefix to append to the generated themes classes
   */
  classPrefix: string;

  /**
   * Whether to generate a fallback for legacy browsers (ahm..ahm..) that do not supports CSS Variables
   */
  screwIE11: boolean;

  /**
   * Legacy browser fallback
   */
  fallback: {
    /**
     * An absolute path to the fallback CSS.
     */
    cssPath: string | null;

    /**
     * An absolute path to the fallback JSON.
     * This file contains variable that will be replace in runtime, for legacy browsers
     */
    dynamicPath: string | null;
  };
}

const defaultOptions: ThemifyOptions = {
  createVars: true,
  pallete: {},
  classPrefix: '',
  screwIE11: true,
  fallback: {
    cssPath: null,
    dynamicPath: null
  }
};

/** supported color variations */
const ColorVariation = {
  DARK: 'dark',
  LIGHT: 'light'
};

function buildOptions(options: ThemifyOptions) {
  if (!options) {
    throw new Error(`options is required.`);
  }

  // make sure we have a pallete
  if (!options.pallete) {
    throw new Error(`The 'pallete' option is required.`);
  }

  return { ...defaultOptions, ...options };
}

/**
 *
 * @param {string} filePath
 * @param {string} output
 * @returns {Promise<any>}
 */
function writeToFile(filePath: string, output: string) {
  return new Promise((resolve, reject) => {
    fs.outputFile(filePath, output, err => {
      if (err) reject();
      resolve();
    });
  });
}

/**
 * Get the rgba as 88, 88, 33 instead rgba(88, 88, 33, 1)
 * @param value
 */
function getRgbaNumbers(value: string) {
  return hexToRgba(value)
    .replace('rgba(', '')
    .replace(', 1)', '');
}

/** Define the default variation */
const defaultVariation = ColorVariation.LIGHT;
/** An array of variation values  */
const variationValues: string[] = (Object as any).values(ColorVariation);
/** An array of all non-default variations */
const nonDefaultVariations: string[] = variationValues.filter(v => v !== defaultVariation);

function themify(options: ThemifyOptions) {
  const removeNewLineRegex = /(\r\n|\n|\r)/gm;
  /** Regex to get the value inside the themify parenthesis */
  const themifyRegExp = /themify\(([^)]+)\)/gi;

  /**
   * Define the method of color execution
   */
  const enum ExecutionMode {
    CSS_VAR = 'CSS_VAR',
    CSS_COLOR = 'CSS_COLOR',
    DYNAMIC_EXPRESSION = 'DYNAMIC_EXPRESSION'
  }

  options = buildOptions(options);

  return root => {
    // process fallback CSS, without mutating the rules
    if (options.screwIE11 === false) {
      processFallbackRules(root);
    }

    // mutate the existing rules
    processRules(root);
  };

  /**
   * @example themify({"light": ["primary-0", 0.5], "dark": "primary-700"})
   * @example themify({"light": "primary-0", "dark": "primary-700"})
   * @example linear-gradient(themify({"color": "primary-200", "opacity": "1"}), themify({"color": "primary-300", "opacity": "1"}))
   * @example themify({"light": ["primary-100", "1"], "dark": ["primary-100", "1"]})
   * @example 1px solid themify({"light": ["primary-200", "1"], "dark": ["primary-200", "1"]})
   */
  function getThemifyValue(propertyValue: string, execMode: ExecutionMode) {
    /** Remove the start and end ticks **/
    propertyValue = propertyValue.replace(/'/g, '');
    const colorVariations = {};

    function normalize(value, variationName) {
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (ex) {
        throw new Error(`fail to parse the following expression: ${value}.`);
      }

      const currentValue = parsedValue[variationName];

      /** For example: background-color: themify((light: primary-100)); */
      if (!currentValue) {
        throw new Error(`${value} has one variation.`);
      }

      // convert to array
      if (!Array.isArray(currentValue)) {
        // color, alpha
        parsedValue[variationName] = [currentValue, 1];
      } else if (!currentValue.length || !currentValue[0]) {
        throw new Error('Oops. Received an empty color!');
      }

      if (options.pallete) return parsedValue[variationName];
    }

    // iterate through all variations
    variationValues.forEach(variationName => {
      // replace all 'themify' tokens with the right string
      colorVariations[variationName] = propertyValue.replace(themifyRegExp, (occurrence, value) => {
        // parse and normalize the color
        const parsedColor = normalize(value, variationName);
        // convert it to the right format
        return translateColor(parsedColor, variationName, execMode);
      });
    });

    return colorVariations;
  }

  /**
   * Get the underline color, according to the execution mode
   * @param colorArr two sized array with the color and the alpha
   * @param variationName the name of the variation. e.g. light / dark
   * @param execMode
   */
  function translateColor(colorArr: [string, string], variationName: string, execMode: ExecutionMode) {
    const [colorVar, alpha] = colorArr;
    // returns the real color representation
    const palleteColor = options.pallete[variationName][colorVar];

    if (!palleteColor) {
      throw new Error(`The variable name '${colorVar}' doesn't exists in your pallete.`);
    }

    switch (execMode) {
      case ExecutionMode.CSS_COLOR:
        // with default alpha - just returns the color
        if (alpha === '1') {
          return palleteColor;
        }
        // with custom alpha, convert it to rgba
        const rgbaColorArr = getRgbaNumbers(palleteColor);
        return `rgba(${rgbaColorArr}, ${alpha})`;
      case ExecutionMode.DYNAMIC_EXPRESSION:
        // returns it in a unique pattern, so it will be easy to replace it in runtime
        return `%[${variationName}, ${colorVar}, ${alpha}]%`;
      default:
        // return an rgba with the CSS variable name
        return `rgba(var(--${colorVar}), ${alpha})`;
    }
  }

  /**
   * Walk through all rules, and replace each themify occurrence with the corresponding CSS variable.
   * @example background-color: themify(primary-300, 0.5) => background-color: rgba(var(--primary-300),0.6)
   * @param root
   */
  function processRules(root) {
    root.walkRules(rule => {
      let aggragatedSelectorsMap = {};
      let aggragatedSelectors: string[] = [];

      let createdRules: any[] = [];
      const variationRules = {
        [defaultVariation]: rule
      };

      rule.walkDecls(decl => {
        const propertyValue = decl.value;
        if (!hasThemify(propertyValue)) return;

        const property = decl.prop;

        const variationValueMap = getThemifyValue(propertyValue, ExecutionMode.CSS_VAR);
        const defaultVariationValue = variationValueMap[defaultVariation];
        decl.value = defaultVariationValue;

        // create a new declaration and append it to each rule
        nonDefaultVariations.forEach(variationName => {
          const currentValue = variationValueMap[variationName];
          // when the declaration is the same as the default variation,
          // we just need to concatenate our selector to the default rule
          if (currentValue === defaultVariationValue) {
            const selector = getSelectorName(rule, variationName);
            // append the selector once
            if (!aggragatedSelectorsMap[variationName]) {
              aggragatedSelectorsMap[variationName] = true;
              aggragatedSelectors.push(selector);
            }
          } else {
            // creating the rule for the first time
            if (!variationRules[variationName]) {
              const clonedRule = createRuleWithVariation(rule, variationName);
              variationRules[variationName] = clonedRule;
              // append the new rule to the array, so we can append it later
              createdRules.push(clonedRule);
            }

            const variationDecl = createDecl(property, variationValueMap[variationName]);
            variationRules[variationName].append(variationDecl);
          }
        });
      });

      if (aggragatedSelectors.length) {
        rule.selectors = [...rule.selectors, ...aggragatedSelectors];
      }

      // append each created rule
      if (createdRules.length) {
        createdRules.forEach(r => root.append(r));
      }
    });
  }

  /**
   * Walk through all rules, and generate a CSS fallback for legacy browsers.
   * Two files shall be created for full compatibility:
   *  1. A CSS file, contains all the rules with the original color representation.
   *  2. A JSON with the themify rules, in the following form:
   *      themify(primary-100, 0.5) => %[light,primary-100,0.5)%
   * @param root
   */
  function processFallbackRules(root) {
    // an output for each execution mode
    const output = {
      [ExecutionMode.CSS_COLOR]: [],
      [ExecutionMode.DYNAMIC_EXPRESSION]: {}
    };
    // initialize DYNAMIC_EXPRESSION with all existing variations
    variationValues.forEach(variation => (output[ExecutionMode.DYNAMIC_EXPRESSION][variation] = []));

    // define which modes need to be processed
    const execModes = [ExecutionMode.CSS_COLOR, ExecutionMode.DYNAMIC_EXPRESSION];

    root.walkRules(rule => {
      const ruleModeMap = {};

      rule.walkDecls(decl => {
        const propertyValue = decl.value;
        if (!hasThemify(propertyValue)) return;

        const property = decl.prop;

        execModes.forEach(mode => {
          // lazily creating a new rule for each variation, for the specific mode
          if (!ruleModeMap.hasOwnProperty(mode)) {
            ruleModeMap[mode] = {};

            variationValues.forEach(variationName => {
              let newRule;
              if (variationName === defaultVariation) {
                newRule = cloneEmptyRule(rule);
              } else {
                newRule = createRuleWithVariation(rule, variationName);
              }

              // push the new rule into the right place,
              // so we can write them later to external file
              let rulesOutput = output[mode];
              if (!Array.isArray(rulesOutput)) {
                rulesOutput = rulesOutput[variationName];
              }
              rulesOutput.push(newRule);

              ruleModeMap[mode][variationName] = newRule;
            });
          }

          const colorMap = getThemifyValue(propertyValue, mode);

          // create and append a new declaration
          variationValues.forEach(variationName => {
            const newDecl = createDecl(property, colorMap[variationName]);
            ruleModeMap[mode][variationName].append(newDecl);
          });
        });
      });
    });

    // write the CSS & JSON to external files
    if (output[ExecutionMode.CSS_COLOR].length) {
      // write CSS fallback;
      const fallbackCss = output[ExecutionMode.CSS_COLOR].join('');

      writeToFile(options.fallback.cssPath as string, fallbackCss);

      // creating a JSON for the dynamic expressions
      const jsonOutput = {};
      variationValues.forEach(variationName => {
        jsonOutput[variationName] = output[ExecutionMode.DYNAMIC_EXPRESSION][variationName] || [];
        jsonOutput[variationName] = jsonOutput[variationName].join('').replace(removeNewLineRegex, '');
      });

      // stringify and save
      const dynamicCss = JSON.stringify(jsonOutput);

      writeToFile(options.fallback.dynamicPath as string, dynamicCss);
    }
  }

  function createDecl(prop, value) {
    return postcss.decl({ prop, value });
  }

  /**
   * check if there's a themify keyword in this declaration
   * @param propertyValue
   */
  function hasThemify(propertyValue) {
    return propertyValue.indexOf(THEMIFY) > -1;
  }

  /**
   * Create a new rule for the given variation, out of the original rule
   * @param rule
   * @param variationName
   */
  function createRuleWithVariation(rule, variationName) {
    const selector = getSelectorName(rule, variationName);
    return postcss.rule({ selector });
  }

  /**
   * Get a selector name for the given rule and variation
   * @param rule
   * @param variationName
   */
  function getSelectorName(rule, variationName) {
    const selectorPrefix = `.${options.classPrefix || ''}${variationName}`;

    return rule.selectors
      .map(selector => {
        return `${selectorPrefix} ${selector}`;
      })
      .join(',');
  }

  function cloneEmptyRule(rule) {
    const clonedRule = rule.clone();
    // remove all the declaration from this rule
    clonedRule.removeAll();
    return clonedRule;
  }
}

/**
 * Generating a SASS definition file with the palette map and the CSS variables.
 * This file should be injected into your bundle.
 */
function init(options) {
  options = buildOptions(options);

  return root => {
    const pallete = options.pallete;
    const css = generateVars(pallete, options.classPrefix);

    const parsedCss = postcss.parse(css);
    root.prepend(parsedCss);
  };

  /**
   * This function responsible for creating the CSS variable.
   *
   *  The output should look like the following:
   *
   *  .light {
       --primary-700: 255, 255, 255;
       --primary-600: 248, 248, 249;
       --primary-500: 242, 242, 244;
 *   }
   *
   *  .dark {
       --primary-700: 255, 255, 255;
       --primary-600: 248, 248, 249;
       --primary-500: 242, 242, 244;
 *   }
   *
   */
  function generateVars(pallete, prefix) {
    let cssOutput = '';
    prefix = prefix || '';

    // iterate through the different variations
    Object.keys(pallete).forEach(variationName => {
      const selector = variationName === ColorVariation.LIGHT ? ':root' : `.${prefix}${variationName}`;
      const variationColors = pallete[variationName];

      // make sure we got colors for this variation
      if (!variationColors) {
        throw new Error(`Expected map of colors for the variation name ${variationName}`);
      }

      const variationKeys = Object.keys(variationColors);

      // generate CSS variables
      const vars = variationKeys
        .map(varName => {
          return `--${varName}: ${getRgbaNumbers(variationColors[varName])};`;
        })
        .join(' ');

      // concatenate the variables to the output
      const output = `${selector} {${vars}}`;
      cssOutput = `${cssOutput} ${output}`;
    });

    // generate the $pallete variable
    cssOutput += `$pallete: ${JSToSass(pallete)};`;

    return cssOutput;
  }
}

module.exports = {
  initThemify: postcss.plugin('datoThemes', init),
  themify: postcss.plugin('datoThemes', themify)
};
