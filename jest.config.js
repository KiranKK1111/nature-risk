const path = require('path');

module.exports = {
  roots: [path.resolve(__dirname, "./src")],
  testEnvironment: "jest-environment-jsdom",
  // testMatch: ["**//__tests__/**/*.js", "**/?(*.)+(spec|test).[jt]s?(x)"],
  testMatch: ["**/__test__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],

  setupFilesAfterEnv: [path.resolve(__dirname, "./src/setupTests.ts")],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    "^.+\\.[tj]sx?$": "babel-jest", // Transpile your code
    ".+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2|svg)$":
      "jest-transform-stub",
  },
  testPathIgnorePatterns: ["<rootDir>/src/__test__/mock_data/TestData.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-syntax-highlighter|marked|react-quill|geotiff|d3.*|@nivo.*|quick-lru|internmap)/)", // Transpile react-syntax-highlighter, marked, react-quill, all d3-* and @nivo/* and internmap
  ],
  
  
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    // '!src/index.js',
    // '!src/setupTests.ts',
    // '!src/setupProxy.js',
    // '!src/serviceWorker.js',
    // '!src/test',
    // '!src/fonts',
    // '!src/test/test-utils.js',
    // '!src/reportWebVitals.js',
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "src/bootstrap.tsx",
    "/src/__test__/mock_data/",
    "src/utils/",
    "src/components/Model",
    "src/theme",
    "src/services/",
    "src/index.tsx",
    "src/react-app-env.d.ts",
    "src/reportWebVitals.ts",
    "src/redux/thunk",
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  reporters: [
    "default",
    [
      "jest-junit",
      { outputDirectory: "./test-results/junit", outputName: "results.xml" },
    ],
  ],
  coverageReporters: ["text", "cobertura", "lcov"],
};
