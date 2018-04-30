![themify](https://i.imgur.com/JZyjWm6.png)

A robust, opinionated solution to create themes in your web application, through CSS.
Themify is built on top of PostCSS to generate your theme during the build phase.
Under the hood, *themify* will replace your CSS colors, with CSS variables, and a fallback for unsupported browsers (such as IE11).

## Features

* :pencil2: **Create your own theme:** Define your theme in a simple JSON format;
* :pencil2: **Replace your colors in runtime:** Provide your users white-labeling capabilities! Let them choose their own colors and replace them instantly!
* :pencil2: **Use the theme inside your CSS:** Use your theme directly in your SASS files; No JavaScript is required!
* :pencil2: **Dark & light Palettes:** Change the active palette at runtime! For the whole application, or for a specific HTML container;
* :pencil2: **Legacy Browser Support:** IE11 Support.

View a full [demo](http://comingsoon.com) (coming soon...).

## Install

### Yarn
```bash
yarn add @datorama/themify
```

### Npm
```bash
npm install @datorama/themify
```

## Usage


### Build

#### Options

|Input|Type|Default|Description|
|---|---|---|---|
|createVars|boolean|`true`|Whether we would like to generate the CSS variables. This should be true, unless you want to inject them yourself|
|palette|{light: [key: string]: string, dark: [key: string]: string}|`{light: {}, dark: {}}`|Palette Colors|
|classPrefix|string|`''`|A class prefix to append to each generated theme class|
|screwIE11|boolean|`true`|Whether to generate a fallback for legacy browsers (ahm..ahm..) that do not supports CSS Variables|
|fallback|{cssPath: string \| null, dynamicPath: string \| null}|`{}`|cssPath: An absolute path to the fallback CSS <br>dynamicPath: An absolute path to the fallback JSON. This file contains variable that will be replace in runtime, for legacy browsers|

```ts
const themifyOptions = {  
  createVars: true,  
  palette : {
	light: {
		'primary-100': '#f2f2f4',
		'primary-200': '#cccece',
		'accent-100': '#e6f9fc',
		'accent-200': '#96e1ed'
    },
    dark: {
		'primary-100': '#505050',
		'primary-200': '#666a6b',
		'accent-100': '#096796',
		'accent-200': '#0a87c6'
    }
  },
  screwIE11 : false,  
  fallback : {  
    cssPath : './dist/theme_fallback.css',  
	dynamicPath: './dist/theme_fallback.json'  
  }  
};
```

#### Gulp

```ts
const themifyOption = {...};
gulp.src('./scss/index.theme.scss')  
    .pipe(postcss([  
		initThemify(themifyOptions),  
		sass(),  
		themify(themifyOptions)  
	]))  
    .pipe(rename("bundle.css"))  
    .pipe(gulp.dest('dist'));
```

#### Webpack

```ts
const isProd = process.env.ENV === 'production';
const basePath = isProd ? './dist' : './.tmp';
const cssPath = `${basePath}/theme_fallback.css`;
const dynamicPath = `${basePath}/theme_fallback.json`;

const themifyOptions = {...};

const getLoaders = () => [{
  loader: "css-loader",
  options: {
    sourceMap: true
  }
},
  {
    loader: 'postcss-loader',
    options: {
      ident: 'postcss2',
      plugins: () => [
        require('@datorama/themify').themify(themifyOptions)
      ]
    }
  },
  {
    loader: "sass-loader",
    options: {
      sourceMap: true
    }
  },
  {
    loader: 'postcss-loader',
    options: {
      ident: 'postcss1',
      plugins: () => [
        require('@datorama/themify').initThemify(themifyOptions)
      ]
    }
  }
]

module.exports = {
  getLoaders: getLoaders
}
```


### SASS

##### Perquisites

In order to use the **themify** function (as mentioned below) and other SASS helpers, you need to import the **themify** library from your main SASS file:

```scss
@import 'node_modules/datorama/themify/dist/themify';
```

#### the themify function
Use the **themify** function in SASS, to set the colors directly in your SASS files.
The **themify** function received the name of the color, defined in the **pallete** map, during the build phase.<br>
**themify** will generate a CSS selector for each palette: one for *light* and one for *dark*.

<br>
throughout the examples, we're using use the following palette:

```json
{
	light: {
		'primary-100': '#f2f2f4',
		'primary-200': '#cccece',
		'accent-100': '#e6f9fc',
		'accent-200': '#96e1ed'
    },
    dark: {
		'primary-100': '#505050',
		'primary-200': '#666a6b',
		'accent-100': '#096796',
		'accent-200': '#0a87c6'
    }
  }
```


##### themify API

```scss
.my-awesome-selector {
	// color-key: a mandatory key from your pallete. For example: primary-100
	// opacity: an optional opacity. Valid values between 0 - 1. Defaults 1.
	property: themify(color-key, opacity);

	// Define a different color for dark and light.
	another-property: themify((dark: color-key-1, light: color-key-2));
}
```

#### Basic Usage

```scss
button {
	background-color: themify(primary-100);
	color: themify(accent-200);
	&:hover {
		background-color: themify(primary-100, 0.5);	
	}
}
```

This will produce the following CSS:

```css
.dark button, button {
	background-color: rgba(var(--primary-100), 1);
	color: rgba(var(--accent-200), 1);
}
.dark button:hover, button:hover {
	background-color: rgba(var(--primary-100), 0.5);	
}
```

And the following fallback for IE11:

##### fallback CSS:
```css
button {
	background-color: #f2f2f4;
	color: #666a6b;
}
.dark button {
	background-color: #505050;
	color: #0a87c6;
}
button:hover {
	background-color: rgba(242, 242, 244, 0.5);	
}
.dark button:hover {
	background-color: rgba(80, 80, 80, 0.5);	
}
```

##### fallback JSON:
```json
{
	"dark": ".dark button {background-color: %[dark, primary-100, 1]%};} .dark button:hover {background-color: %[dark, primary-100, 0.5]%};}",
	"light": "button {background-color: %[light, primary-100, 1]%};} button:hover {background-color: %[light, primary-100, 0.5]%};}"
}
```

#### A Different Color For each Palette

It's possible to use one color for **light** and another color for **dark**:

```scss
button {
	background-color: themify((dark: primary-100, light: accent-200));
}
```

This will produce the following CSS:

```css
.button {
	background-color: rgba(var(--accent-200), 1);
}
.dark button {
	background-color: rgba(var(--parimry-100), 1);
}
```

#### Advanced Usage

**themify** can be combined with every valid CSS:

```scss
button {
	border: solid 1px themify(primary-100);
	background: linear-gradient(themify(accent-200), themify(accent-100));
}
```

Even in your animations:

```scss
 .element {  
  animation: pulse 5s infinite;  
}  
  
@keyframes pulse {  
  0% {  
    background-color: themify(accent-100);  
  }  
  100% {  
    background-color: themify(accent-200);  
  }  
}
```

### Runtime Replacement of Colors

First, we'll create our own theme service, to allow replacement of colors at runtime.

```ts
import {loadCSSVariablesFallback, replaceColors, Theme} from '@datorama/themify/utils';
const palette = require('path_to_my_json_pallete');
// fallback for CSS variables support
const themeCSSFallback = 'theme_fallback.css';
const themeJSONFallback = 'theme_fallback.json';

export class MyThemeService {
	
	constructor(){
		// load the CSS fallback file, in case the browser do not support CSS Variables.
		// Required only if you set screwIE11 option to false.
		loadCSSVariablesFallback(themeCSSFallback);	
	}

	/**  
	 * Replace the theme colors at runtime 
	 * @param partialTheme a partial theme  configuration.  
	 */
	setColors(partialTheme: Theme){
		replaceColors(themeJSONFallback, partialTheme, palette);
	}

}
```

Now let's use this service in our web application:

```ts
const themeService = new MyThemeService();

// replace the colors at runtime!
themeService.setColors({
	light: {
		'primary-100': '#0c93e4'
	}
});

```

### Changing the Active  Palette

In order to switch between dark and light, just add the appropriate class on the desire HTML element. Consider the following example:

```scss
p {
	// #96e1ed in light and #0a87c6 in dark
	color: themify(accent-200);
}
```

```html
<html>
<body>
	<div>
		<p>I'm from the light pallete</p>
		<div class="dark">
			<p>I'm from the dark pallete</p>	
		</div>
	</div>
</body>
</html>
```
### Theme Class Helpers
You can take an advantage of your themes not just in your CSS, but also directly in your HTML, by generating a CSS class for each color you defined.
In order to achieve this, use the **generateThemeHelpers** mixin, and pass the CSS properties you want to generate. For example:

```scss
// generates the following predefined classes, for each color  
$themeRules: (  
  'color',  
  'border-top-color',  
  'border-bottom-color',  
  'border-right-color',  
  'border-left-color',  
  'background-color',  
  'fill',  
  'stroke',  
  // PSEUDO_CLASSES  
  'color:h:f:a:vi'  
);  
@include generateThemeHelpers($themeRules);
```

This will generate the following CSS:

```css
.dark .primary-100-color, .primary-100-color {  
  color: rgba(var(--primary-100), 1)  
}
.dark .primary-200-color, .primary-200-color {  
  color: rgba(var(--primary-100), 1)  
}
.dark .primary-100-color\:vi:visited, .primary-100-color\:vi:visited {  
  color: rgba(var(--primary-100), 1)  
}
```
and so on..

As you see, you can pass any CSS property, including pseudo classes.
The following SASS map represent the pseudo key and his actual value:

```scss
$PSEUDO_CLASSES: (  
  ':a': ':active',  
  ':c': ':checked',  
  ':d': ':default',  
  ':di': ':disabled',  
  ':e': ':empty',  
  ':en': ':enabled',  
  ':fi': ':first',  
  ':fc': ':first-child',  
  ':fot': ':first-of-type',  
  ':fs': ':fullscreen',  
  ':f': ':focus',  
  ':h': ':hover',  
  ':ind': ':indeterminate',  
  ':ir': ':in-range',  
  ':inv': ':invalid',  
  ':lc': ':last-child',  
  ':lot': ':last-of-type',  
  ':l': ':left',  
  ':li': ':link',  
  ':oc': ':only-child',  
  ':oot': ':only-of-type',  
  ':o': ':optional',  
  ':oor': ':out-of-range',  
  ':ro': ':read-only',  
  ':rw' : ':read-write',  
  ':req': ':required',  
  ':r': ':right',  
  ':rt' : ':root',  
  ':s': ':scope',  
  ':t' : ':target',  
  ':va': ':valid',  
  ':vi': ':visited'  
);
```

By using:
```scss
@include generateThemeHelpers(('color', ':a'));
```

will generate an active pseudo class, for each color:
```css
.dark .primary-100-color, .primary-100-color {  
  color: rgba(var(--primary-100), 1)  
}
.dark .primary-200-color, .primary-200-color {  
  color: rgba(var(--primary-200), 1)  
}
.dark .primary-100-color\:a:active, .primary-100-color\:a:active {  
  color: rgba(var(--primary-100), 1)  
}
.dark .primary-200-color\:a:active, .primary-200-color\:a:active {  
  color: rgba(var(--primary-200), 1)  
}
```

<br>
Now you can use the generated CSS classes directly in your HTML:

```html
<html>
<body>
	<div>
		<a href="#" class="primary-100-color primary-200-color:a">The default color is primary-100; The active color will be primary-200 </a>
	</div>
</body>
</html>
```


## License

Apache &copy; [datorama](https://github.com/datorama)