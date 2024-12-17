const jestGlobals = require('@jest/globals');

// Mock semver to avoid the SemVer constructor issue
jestGlobals.jest.mock('semver', () => {
    const actual = jestGlobals.jest.requireActual('semver');
    return {
        ...actual,
        parse: jestGlobals.jest.fn((version) => ({ version })),
        valid: jestGlobals.jest.fn(() => true),
        satisfies: jestGlobals.jest.fn(() => true),
        gt: jestGlobals.jest.fn(() => true),
        gte: jestGlobals.jest.fn(() => true),
        lt: jestGlobals.jest.fn(() => false),
        lte: jestGlobals.jest.fn(() => false),
        eq: jestGlobals.jest.fn(() => true),
        neq: jestGlobals.jest.fn(() => false),
        SemVer: jestGlobals.jest.fn((version) => ({ version }))
    };
}); 