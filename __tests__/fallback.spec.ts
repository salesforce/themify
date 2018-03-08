import {TestUtils} from "./test.util";
import {ThemifyOptions} from "../core/themify";

const glob = require("glob");
const tmp = require('tmp');

const options: Partial<ThemifyOptions> = {
    pallete: TestUtils.tinyPallete,
    screwIE11: false,
    fallback: {
        cssPath: '',
        dynamicPath: ''
    }
};

const inputFiles = glob.sync('__tests__/fallback/*.input.spec.scss');
describe('Themify - Fallback', () => {
    inputFiles.forEach((inputFile) => {
        const testName = TestUtils.getTestName(inputFile);
        it(testName, (done) => {
            test(inputFile, done);
        });
    });
});

function test(inputFile, done) {
    console.log(inputFile);
    // creating temp files for the CSS & JSON files
    const {cssTmp, dynamicTmp} = {
        cssTmp: tmp.fileSync(),
        dynamicTmp: tmp.fileSync()
    };

    const myOptions = {
        ...{}, ...options, ...{
            fallback: {
                cssPath: cssTmp.name,
                dynamicPath: dynamicTmp.name
            }
        }
    };

    return TestUtils.processFile(inputFile, getPlugins(myOptions)).then(() => {
        setTimeout(() => {
            const cssTempContent = TestUtils.minify(TestUtils.readFile(cssTmp.name));
            const jsonTempContent = TestUtils.minify(TestUtils.readFile(dynamicTmp.name));

            const cssTempExpectedContent = TestUtils.minify(TestUtils.readFile(inputFile.replace("input", "output-css")));
            const jsonTempExpectedContent = TestUtils.minify(TestUtils.readFile(inputFile.replace("input.spec.scss", "output-json.spec.json")));

            // expect the fallback CSS file will be equal to the generated one
            expect(cssTempContent).toEqual(cssTempExpectedContent);
            // expect the fallback JSON file will be equal
            expect(jsonTempContent).toEqual(jsonTempExpectedContent);

            // cleanup
            cssTmp.removeCallback();
            dynamicTmp.removeCallback();

            done();
        });

    }, (err) => {
        console.log(err);
        throw err;
    });

}

function getPlugins(pluginOptions) {
    return [TestUtils.plugin.initThemify(pluginOptions), TestUtils.plugin.sass(), TestUtils.plugin.themify(pluginOptions)];
}