export type Theme = {
  [name: string]: {
    [variable: string]: string;
  };
};

/**
 *
 * @param {string} path
 * @param {(event: Event) => void} cb
 */
export function loadScript(path: string, cb: (this: HTMLElement, event: Event) => void) {
  const head = document.getElementsByTagName('head')[0];
  const script = document.createElement('script');
  script.src = path;
  script.type = 'text/javascript';
  head.appendChild(script);
  script.onload = cb;
}

/**
 *
 * @param {string} path
 */
export function loadCSS(path: string) {
  const head = document.getElementsByTagName('head')[0];
  const style = document.createElement('link');
  style.href = path;
  style.rel = 'stylesheet';
  head.appendChild(style);
}

/**
 *
 * @param {string} style
 */
export function injectStyle(style: string) {
  var node = document.createElement('style');
  node.innerHTML = style;
  document.head.appendChild(node);
}

/**
 *
 * .dark {
 *   --primary-100: 30, 24, 33;
 * }
 *
 * :root {
 *   --primary-100: 22, 21, 22;
 * }
 *
 * @param customTheme
 * @returns {string}
 */
export function generateNewVariables(customTheme: Theme) {
  // First, we need the variations [dark, light]
  const variations = Object.keys(customTheme);
  return variations.reduce((finalOutput, variation) => {
    // Next, we need the variation keys [primary-100, accent-100]
    const variationKeys = Object.keys(customTheme[variation]);

    const variationOutput = variationKeys.reduce((acc, variable) => {
      const value = normalizeColor(customTheme[variation][variable]);
      return (acc += `--${variable}: ${value};`);
    }, '');

    return (finalOutput += `${variation === 'light' ? ':root' : '.' + variation}{${variationOutput}}`);
  }, '');
}

/**
 *
 * @returns {boolean}
 */
export function hasNativeCSSProperties() {
  const opacity = '1';
  const el = document.head;
  let hasNativeCSSProperties;

  // Setup CSS properties.
  el.style.setProperty('--test-opacity', opacity);
  el.style.setProperty('opacity', 'var(--test-opacity)');

  // Feature detect then remove all set properties.
  hasNativeCSSProperties = window.getComputedStyle(el).opacity == opacity;
  el.style.setProperty('--test-opacity', '');
  el.style.opacity = '';

  return hasNativeCSSProperties;
}

/**
 * Load the CSS fallback file on load
 */
export function loadCSSVariablesFallback() {
  if (!hasNativeCSSProperties()) {
    loadCSS('/dist/theme_fallback.css');
  }
}

/**
 *
 * @param customTheme
 */
export function replaceColors(customTheme: Theme, pallete) {
  if (customTheme) {
    if (hasNativeCSSProperties()) {
      const newColors = generateNewVariables(customTheme);
      injectStyle(newColors);
    } else {
      loadScript('/dist/theme_fallback.js', () => {
        handleUnSupportedBrowsers(customTheme, pallete, (window as any).themify);
      });
    }
  }
}

/**
 *
 * @param customTheme
 */
export function handleUnSupportedBrowsers(customTheme: Theme, pallete: Theme, JSONFallback) {
  const themifyRegExp = /%\[(.*?)\]%/gi;
  const merged = mergeDeep(pallete, customTheme);

  let finalOutput = Object.keys(customTheme).reduce((acc, variation) => {
    let value = JSONFallback[variation].replace(themifyRegExp, (occurrence, value) => {
      const [variation, variable, opacity] = value.replace(/\s/g, '').split(',');
      const color = merged[variation][variable];
      const normalized = hexToRGB(color, opacity);
      return normalized;
    });

    return (acc += value);
  }, '');

  injectStyle(finalOutput);
  return finalOutput;
}

/**
 * Omit the rgb and braces from rgb
 * rgb(235, 246, 244) => 235, 246, 244
 * @param rgb
 * @returns {string}
 */
function normalizeRgb(rgb: string) {
  return rgb.replace('rgb(', '').replace(')', '');
}

/**
 *
 * @param color
 * @returns {*}
 */
function normalizeColor(color: string) {
  if (isHex(color)) {
    return normalizeRgb(hexToRGB(color));
  }

  if (isRgb(color)) {
    return normalizeRgb(color);
  }

  return color;
}

/**
 *
 * @param color
 * @returns {boolean}
 */
function isHex(color: string) {
  return color.indexOf('#') > -1;
}

/**
 *
 * @param color
 * @returns {boolean}
 */
function isRgb(color: string) {
  return color.indexOf('rgb') > -1;
}

/**
 *
 * @param hex
 * @param alpha
 * @returns {string}
 */
function hexToRGB(hex: string, alpha = false) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (alpha) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 *
 * @param target
 * @param sources
 * @returns {*}
 */
function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

/**
 *
 * @param item
 * @returns {*|boolean}
 */
function isObject(value: any) {
  return Object.prototype.toString.call(value) === '[object Object]';
}
