import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.+(ts|tsx|js)',
        '**/?(*.)+(spec|test).+(ts|tsx|js)'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    setupFilesAfterEnv: [
        '<rootDir>/src/__tests__/setup.ts'
    ],
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
            isolatedModules: true
        }
    },
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**',
        '!src/**/__mocks__/**',
        '!src/**/types/**'
    ],
    coverageReporters: ['text', 'lcov', 'html'],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    verbose: true,
    testTimeout: 10000,
    maxWorkers: '50%',
    errorOnDeprecated: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/.cursor/'
    ],
    watchPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/.cursor/',
        '/coverage/'
    ],
    modulePathIgnorePatterns: [
        '/dist/',
        '/.cursor/'
    ],
    moduleFileExtensions: [
        'ts',
        'tsx',
        'js',
        'jsx',
        'json',
        'node'
    ]
};

export default config; 