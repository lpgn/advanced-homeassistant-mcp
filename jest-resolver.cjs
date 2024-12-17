module.exports = (path, options) => {
    // Call the default resolver
    return options.defaultResolver(path, {
        ...options,
        // Force node to resolve modules as CommonJS
        packageFilter: pkg => {
            if (pkg.type === 'module') {
                pkg.type = 'commonjs';
                if (pkg.exports && pkg.exports.import) {
                    pkg.main = pkg.exports.import;
                }
            }
            return pkg;
        },
    });
}; 