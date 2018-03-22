import {generateNewVariables, handleUnSupportedBrowsers} from '../src/utils';

const whitelabel = {
  "dark": {
    "primary-100": "#c333d3",
    "primary-200": "#c333d3"
  },
  "light": {
    "accent-300": "#ff0000"
  }
}

const whitelabelOnlyDark = {
  "dark": {
    "primary-100": "#c333d3",
    "primary-200": "#c333d3"
  }
}

const fallbackJSON = {
  "dark": ".dark button {    color: %[dark, primary-100, 1]%;    background-color: %[dark, primary-200, 0.5]%;    border: 1px solid %[dark, primary-300, 0.5]%}.dark h1 {    color: %[dark, accent-300, 1]%;    background: linear-gradient(to right, %[dark, primary-100, 1]%, %[dark, accent-100, 1]%)}.dark p {    color: %[dark, primary-100, 1]%}",
  "light": "button {    color: %[light, primary-100, 1]%;    background-color: %[light, primary-200, 0.5]%;    border: 1px solid %[light, primary-300, 0.5]%;}h1 {    color: %[light, accent-300, 1]%;    background: linear-gradient(to right, %[light, primary-100, 1]%, %[light, accent-100, 1]%);}p {    color: %[light, accent-300, 1]%;}"
};

describe.only('Utils', () => {

  describe('Supported Browsers', () => {
    it('should generate the correct scheme', () => {
      const output = `.dark{--primary-100: 195, 51, 211;--primary-200: 195, 51, 211;}:root{--accent-300: 255, 0, 0;}`;
      expect(generateNewVariables(whitelabel)).toEqual(output);
    });

    it('should work with one variation', () => {
      const output = `.dark{--primary-100: 195, 51, 211;--primary-200: 195, 51, 211;}`;
      expect(generateNewVariables(whitelabelOnlyDark)).toEqual(output);
    });
  });

  describe('UnSupported Browsers', () => {
    it('should generate the correct scheme', () => {
      const output = ".darkbutton{color:rgba(195,51,211,1);background-color:rgba(195,51,211,0.5);border:1pxsolidrgba(156,160,160,0.5)}.darkh1{color:rgba(4,162,214,1);background:linear-gradient(toright,rgba(195,51,211,1),rgba(9,103,150,1))}.darkp{color:rgba(195,51,211,1)}button{color:rgba(242,242,244,1);background-color:rgba(204,206,206,0.5);border:1pxsolidrgba(156,160,160,0.5);}h1{color:rgba(255,0,0,1);background:linear-gradient(toright,rgba(242,242,244,1),rgba(230,249,252,1));}p{color:rgba(255,0,0,1);}"
      expect(handleUnSupportedBrowsers(whitelabel, pallete, fallbackJSON).replace(/\s/g, '')).toEqual(output.replace(/\s/g, ''));
    });
  });

});


var pallete = {
  light: {
    'primary-700': '#303030',
    'primary-600': '#383838',
    'primary-500': '#505050',
    'primary-400': '#666a6b',
    'primary-300': '#9ca0a0',
    'primary-200': '#cccece',
    'primary-100': '#f2f2f4',
    'primary-50': '#f8f8f9',
    'primary-0': '#ffffff',
    'accent-700': '#096796',
    'accent-600': '#0a87c6',
    'accent-500': '#04a2d6',
    'accent-400': '#00bee8',
    'accent-300': '#4cd1ef',
    'accent-200': '#96e1ed',
    'accent-100': '#e6f9fc',
  },
  dark: {
    'primary-700': '#ffffff',
    'primary-600': '#f8f8f9',
    'primary-500': '#f2f2f4',
    'primary-400': '#cccece',
    'primary-300': '#9ca0a0',
    'primary-200': '#666a6b',
    'primary-100': '#505050',
    'primary-50': '#383838',
    'primary-0': '#303030',
    'accent-700': '#e6f9fc',
    'accent-600': '#96e1ed',
    'accent-500': '#4cd1ef',
    'accent-400': '#00bee8',
    'accent-300': '#04a2d6',
    'accent-200': '#0a87c6',
    'accent-100': '#096796',
  }
};