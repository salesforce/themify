/** Remove this 💩 when postcss-node-sass will upgrade the node-sass version */
const replace = require('replace-in-file');

const options = {
  files: 'src/sass/encode/encode/api/_json.scss',
  from: `@return call(get-function('_json-encode--#{$type}'), $value);`,
  to: `@return call('_json-encode--#{$type}', $value);`,
};

const optionsTwo = {
  files: 'src/sass/encode/encode/api/_json.scss',
  to: `@return call(get-function('_json-encode--#{$type}'), $value);`,
  from: `@return call('_json-encode--#{$type}', $value);`,
};

try {
  if(process.env.NODE_ENV === 'test') {
    const changes = replace.sync(options);
  } else {
    const changes = replace.sync(optionsTwo);
  }
}
catch (error) {
  console.error('Error occurred:', error);
}