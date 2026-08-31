'use strict';

module.exports = function pixiLayoutMarkupLoader(source) {
  const callback = this.async();
  const options = this.getOptions ? this.getOptions() : {};

  Promise.all([import('./dist/core.js'), import('./dist/config.js')])
    .then(async ([{ compileMarkupFile, writeMarkupRefTypes }, { resolveMarkupConfig }]) => {
      const { config } = await resolveMarkupConfig(options, { cwd: this.rootContext });
      const compiled = compileMarkupFile(source, this.resourcePath, config);
      writeMarkupRefTypes(compiled);
      callback(null, compiled.code, compiled.map);
    })
    .catch((error) => callback(error));
};
