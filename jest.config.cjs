/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@src/(.*)$': '<rootDir>/src/$1',
        '^@tests/(.*)$': '<rootDir>/__tests__/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    roots: [
        '<rootDir>/src',
        '<rootDir>/__tests__'
    ],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: true,
            tsconfig: './tsconfig.json'
        }]
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    resolver: '<rootDir>/jest-resolver.cjs',
    transformIgnorePatterns: [
        'node_modules/(?!(@digital-alchemy|litemcp|semver|zod)/)'
    ],
    modulePathIgnorePatterns: [
        '<rootDir>/dist/'
    ],
    testEnvironmentOptions: {
        experimentalVmModules: true
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    globals: {
        'ts-jest': {
            useESM: true,
            tsconfig: {
                allowJs: true,
                esModuleInterop: true
            }
        }
    }
}; 