import {TestUtils} from "./test.util";

const options = {
  pallete: TestUtils.tinyPallete
};
const plugins = [TestUtils.plugin.initThemify(options), TestUtils.plugin.sass(), TestUtils.plugin.themify(options)];
TestUtils.run('Themify - CSS Helpers', '__tests__/theme-helpers/*.input.spec.scss', plugins);