const path = require('path')
const webpack = require('webpack')

module.exports = (settings) => (
    {
        entry: {
            'authorizer/index': './authorizer/index.js',
            'loghandler/index': './loghandler/index.js',
            'logreceiver/index': './logreceiver/index.js',
            'echo/index': './echo/index.js',
            'helloworld/index': './helloworld/index.js',
        },

        output: {
            libraryTarget: 'commonjs',
            path: path.join(__dirname, '.webpack'),
            filename: '[name].js',
        },

        externals: [
            'aws-sdk', // aws-sdk included in Lambda
        ],

        resolve: {
            // set root resolver to app directory.
            // this allows using absolute paths for imports starting from
            // the app folder instead of relative paths
            // ie import { } from dir/dir/dir vs
            // ie import { } from ../../../
            root: __dirname,
        },


        module: {
            preLoaders: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'eslint',
                },
            ],
            loaders: [
                {
                    test: /\.js$/,
                    loaders: ['babel'],
                    exclude: /node_modules/,
                },
                {
                    test: /\.json$/,
                    loader: 'json',
                },
            ],
        },
        plugins: [
            // set NODE_ENV variable to production. Used by some libraries such
            // as react to perform extra optimizations
            new webpack.DefinePlugin(settings),
            new webpack.IgnorePlugin(/\.(css|less)$/),
            //new webpack.BannerPlugin('require("source-map-support").install();',
            //                        { raw: true, entryOnly: false })
        ],
        target: 'node',
        devtool: 'source-map',
    }
)
