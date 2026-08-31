'use strict';

const { dirname, resolve } = require('node:path');

module.exports = function pixiLayoutMarkupTransformLoader(source) {
  const callback = this.async();
  const options = this.getOptions ? this.getOptions() : {};

  Promise.all([import('./dist/core.js'), import('./dist/config.js')])
    .then(async ([{ compileMarkupClass }, { resolveMarkupConfig }]) => {
      await resolveMarkupConfig(options, { cwd: this.rootContext });
      const transformed = compileMarkupClass(source, this.resourcePath) ?? source;
      const markupImports = transformed.matchAll(/import\s+__\w+MarkupTemplate\s+from\s+['"]([^'"]+\.xml)['"]/g);
      for (const [, request] of markupImports) {
        this.addDependency?.(resolve(dirname(this.resourcePath), request));
      }
      callback(null, transformed);
    })
    .catch((error) => callback(error));
};
