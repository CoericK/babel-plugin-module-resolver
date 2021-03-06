/* eslint-env jest */
import path from 'path';
import { transform } from 'babel-core'; // eslint-disable-line import/no-extraneous-dependencies
import plugin from '../src';

describe('module-resolver', () => {
  function testRequireImport(source, output, transformerOpts) {
    it('with a require statement', () => {
      const code = `var something = require("${source}");`;
      const result = transform(code, transformerOpts);

      expect(result.code).toBe(`var something = require("${output}");`);
    });

    it('with an import statement', () => {
      const code = `import something from "${source}";`;
      const result = transform(code, transformerOpts);

      expect(result.code).toBe(`import something from "${output}";`);
    });
  }

  describe('root', () => {
    describe('simple root', () => {
      const rootTransformerOpts = {
        babelrc: false,
        plugins: [
          [plugin, {
            root: [
              './test/testproject/src',
            ],
          }],
        ],
      };

      describe('should resolve the file path', () => {
        testRequireImport(
                    'app',
                    './test/testproject/src/app',
                    rootTransformerOpts,
                );
      });

      describe('should resolve the sub file path', () => {
        testRequireImport(
                    'components/Root',
                    './test/testproject/src/components/Root',
                    rootTransformerOpts,
                );
      });

      describe('should resolve a sub file path without /index', () => {
        testRequireImport(
                    'components/Header',
                    './test/testproject/src/components/Header',
                    rootTransformerOpts,
                );
      });

      describe('should resolve the file path while keeping the extension', () => {
        testRequireImport(
                    'components/Header/header.css',
                    './test/testproject/src/components/Header/header.css',
                    rootTransformerOpts,
                );
      });

      describe('should resolve the file path with a filename containing a dot', () => {
        testRequireImport(
                    'libs/custom.modernizr3',
                    './test/testproject/src/libs/custom.modernizr3',
                    rootTransformerOpts,
                );
      });

      describe('should resolve to a file instead of a directory', () => {
                // When a file and a directory on the same level share the same name,
                // the file has priority according to the Node require mechanism
        testRequireImport(
                    'constants',
                    '../constants',
          {
            ...rootTransformerOpts,
            filename: './test/testproject/src/constants/actions.js',
          },
                );
      });

      describe('should not resolve a path outisde of the root directory', () => {
        testRequireImport(
                    'lodash/omit',
                    'lodash/omit',
                    rootTransformerOpts,
                );
      });

      describe('should not try to resolve a local path', () => {
        testRequireImport(
                    './something',
                    './something',
                    rootTransformerOpts,
                );
      });
    });

    describe('glob root', () => {
      const globRootTransformerOpts = {
        babelrc: false,
        plugins: [
          [plugin, {
            root: [
              './test/testproject/src/**',
            ],
          }],
        ],
      };

      describe('should resolve the file path right inside the glob', () => {
        testRequireImport(
                    'app',
                    './test/testproject/src/app',
                    globRootTransformerOpts,
                );
      });

      describe('should resolve the sub file path', () => {
        testRequireImport(
                    'actions/something',
                    './test/testproject/src/actions/something',
                    globRootTransformerOpts,
                );
      });

      describe('should resolve the sub file path without specifying the directory', () => {
        testRequireImport(
                    'something',
                    './test/testproject/src/actions/something',
                    globRootTransformerOpts,
                );
      });

      describe('should resolve the deep file', () => {
        testRequireImport(
                    'SidebarFooterButton',
                    './test/testproject/src/components/Sidebar/Footer/SidebarFooterButton',
                    globRootTransformerOpts,
                );
      });
    });
  });

  describe('alias', () => {
    const aliasTransformerOpts = {
      plugins: [
        [plugin, {
          alias: {
            test: './test/testproject/test',
            libs: './test/testproject/src/libs',
            components: './test/testproject/src/components',
            '~': './test/testproject/src',
            'awesome/components': './test/testproject/src/components',
            abstract: 'npm:concrete',
            underscore: 'lodash',
          },
        }],
      ],
    };

    describe('with a simple alias', () => {
      describe('should alias the file path', () => {
        testRequireImport(
                    'components',
                    './test/testproject/src/components',
                    aliasTransformerOpts,
                );
      });

      describe('should alias the sub file path', () => {
        testRequireImport(
                    'test/tools',
                    './test/testproject/test/tools',
                    aliasTransformerOpts,
                );
      });
    });

    describe('with an alias containing a slash', () => {
      describe('should alias the file path', () => {
        testRequireImport(
                    'awesome/components',
                    './test/testproject/src/components',
                    aliasTransformerOpts,
                );
      });

      describe('should alias the sub file path', () => {
        testRequireImport(
                    'awesome/components/Header',
                    './test/testproject/src/components/Header',
                    aliasTransformerOpts,
                );
      });
    });

    describe('should alias a path containing a dot in the filename', () => {
      testRequireImport(
                'libs/custom.modernizr3',
                './test/testproject/src/libs/custom.modernizr3',
                aliasTransformerOpts,
            );
    });

    describe('should alias the path with its extension', () => {
      testRequireImport(
                'components/Header/header.css',
                './test/testproject/src/components/Header/header.css',
                aliasTransformerOpts,
            );
    });

    describe('should not alias a unknown path', () => {
      describe('when requiring a node module', () => {
        testRequireImport(
                    'other-lib',
                    'other-lib',
                    aliasTransformerOpts,
                );
      });

      describe('when requiring a specific un-mapped file', () => {
        testRequireImport(
                    './l/otherLib',
                    './l/otherLib',
                    aliasTransformerOpts,
                );
      });
    });

    describe('(legacy) should support aliasing a node module with "npm:"', () => {
      testRequireImport(
                'abstract/thing',
                'concrete/thing',
                aliasTransformerOpts,
            );
    });

    describe('should support aliasing a node modules', () => {
      testRequireImport(
                'underscore/map',
                'lodash/map',
                aliasTransformerOpts,
            );
    });
  });

  describe('with custom cwd', () => {
    describe('custom value', () => {
      const transformerOpts = {
        babelrc: false,
        plugins: [
          [plugin, {
            root: [
              './testproject/src',
            ],
            alias: {
              test: './testproject/test',
            },
            cwd: path.join(process.cwd(), 'test'),
          }],
        ],
      };

      describe('should resolve the sub file path', () => {
        testRequireImport(
                    'components/Root',
                    './test/testproject/src/components/Root',
                    transformerOpts,
                );
      });

      describe('should alias the sub file path', () => {
        testRequireImport(
                    'test/tools',
                    './test/testproject/test/tools',
                    transformerOpts,
                );
      });
    });
  });

  describe('babelrc', () => {
    const transformerOpts = {
      babelrc: false,
      plugins: [
        [plugin, {
          root: [
            './src',
          ],
          alias: {
            test: './test',
          },
          cwd: 'babelrc',
        }],
      ],
      filename: './test/testproject/src',
    };

    describe('should resolve the sub file path', () => {
      testRequireImport(
                'components/Root',
                './src/components/Root',
                transformerOpts,
            );
    });

    describe('should alias the sub file path', () => {
      testRequireImport(
                'test/tools',
                './test/tools',
                transformerOpts,
            );
    });
  });
});
