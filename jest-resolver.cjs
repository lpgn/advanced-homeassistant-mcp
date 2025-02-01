const path = require('path');

module.exports = (request, options) => {
    // Handle chalk and related packages
    if (request === 'chalk' || request === '#ansi-styles' || request === '#supports-color') {
        return path.resolve(__dirname, 'node_modules', request.replace('#', ''));
    }

    // Handle .js extensions for TypeScript files
    if (request.endsWith('.js')) {
        const tsRequest = request.replace(/\.js$/, '.ts');
        try {
            return options.defaultResolver(tsRequest, options);
        } catch (e) {
            // If the .ts file doesn't exist, continue with the original request
        }
    }

    // Handle @digital-alchemy packages
    if (request.startsWith('@digital-alchemy/')) {
        try {
            const packagePath = path.resolve(__dirname, 'node_modules', request);
            return options.defaultResolver(packagePath, {
                ...options,
                packageFilter: pkg => {
                    if (pkg.type === 'module') {
                        if (pkg.exports && pkg.exports.import) {
                            pkg.main = pkg.exports.import;
                        } else if (pkg.module) {
                            pkg.main = pkg.module;
                        }
                    }
                    return pkg;
                }
            });
        } catch (e) {
            // If resolution fails, continue with default resolver
        }
    }

    // Call the default resolver
    return options.defaultResolver(request, {
        ...options,
        // Handle ESM modules
        packageFilter: pkg => {
            // Preserve ESM modules
            if (pkg.type === 'module') {
                if (pkg.exports) {
                    if (pkg.exports.import) {
                        pkg.main = pkg.exports.import;
                    } else if (typeof pkg.exports === 'string') {
                        pkg.main = pkg.exports;
                    }
                } else if (pkg.module) {
                    pkg.main = pkg.module;
                }
            }
            return pkg;
        },
    });
}; 