/** @type {import('bun:test').BunTestConfig} */
module.exports = {
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            statements: 50,
            branches: 50,
            functions: 50,
            lines: 50
        }
    },
    setupFilesAfterEnv: ['./jest.setup.ts']
}; 