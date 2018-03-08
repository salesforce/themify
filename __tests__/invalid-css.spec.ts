import {TestUtils} from "./test.util";

const options = {
  pallete: TestUtils.defaultPallete
};
const plugins = [TestUtils.plugin.sass(), TestUtils.plugin.themify(options)];
TestUtils.run('Themify - Invalid CSS', '__tests__/invalid-css/*.input.spec.scss', plugins, true);