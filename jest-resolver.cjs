const path = require('path');

module.exports = (request, options) => {
    // Handle chalk and related packages
    if (request === 'chalk' || request === '#ansi-styles' || request === '#supports-color') {
        return path.resolve(__dirname, 'node_modules', request.replace('#', ''));
    }

    // Handle source files with .js extension
    if (request.endsWith('.js')) {
        const tsRequest = request.replace(/\.js$/, '.ts');
        try {
            return options.defaultResolver(tsRequest, {
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
            // If the .ts file doesn't exist, try resolving without extension
            try {
                return options.defaultResolver(request.replace(/\.js$/, ''), options);
            } catch (e2) {
                // If that fails too, try resolving with .ts extension
                try {
                    return options.defaultResolver(tsRequest, options);
                } catch (e3) {
                    // If all attempts fail, try resolving the original request
                    return options.defaultResolver(request, options);
                }
            }
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

    // Call the default resolver with enhanced module resolution
    return options.defaultResolver(request, {
        ...options,
        // Handle ESM modules
        packageFilter: pkg => {
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
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        paths: [...(options.paths || []), path.resolve(__dirname, 'src')]
    });
}; 