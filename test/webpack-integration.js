
const assert = require('chai').assert;
const rimraf = require('rimraf');
const webpack = require('webpack');
const configs = require('./configs');

describe('Webpack Integration', function() {

    // clear output before starting any test
    afterEach(function clearOutput(done) {
        rimraf('./test/output', done);
    });

    // test style-loader
    it('should only emit js files when using style-loader', function(done) {

        const expected = {
            assets: ['example.js', 'example-desktop.js'],
            chunks: ['example', 'example-desktop']
        };

        webpack(configs['only-javascript-output'], (err, stats) => {

            if (err) 
                done(err);
            else if (stats.hasErrors()) 
                done(stats.toString());
    
            const assets = Object.keys(stats.compilation.assets);
            const chunks = stats.compilation.chunks.map(chunk => chunk.id);
    
            assert.deepEqual(assets, expected.assets);
            assert.deepEqual(chunks, expected.chunks);
            done();
        });
    
    });

    // test mini-css-extract-plugin
    it('should emit css files when using mini-css-extract-plugin', function(done) {

        const expected = {
            assets: ['example.css', 'example.js', 'example-desktop.js', 'example-desktop.css'],
            chunks: ['example', 'example-desktop']
        };

        webpack(configs['external-css-output'], (err, stats) => {

            if (err) 
                done(err);
            else if (stats.hasErrors()) 
                done(stats.toString());

            const assets = Object.keys(stats.compilation.assets);
            const chunks = stats.compilation.chunks.map(chunk => chunk.id);

            assert.deepEqual(assets, expected.assets);
            assert.deepEqual(chunks, expected.chunks);
            done();
        });

    });

    it('should use groups option for extraxted file name', function(done) {

        const expected = {
            assets: ['app.css', 'app.js', 'app-desktop.css'],
            chunks: ['app', 'app-desktop']
        };

        webpack(configs['groups-option-output'], (err, stats) => {

            if (err) 
                done(err);
            else if (stats.hasErrors()) 
                done(stats.toString());

            const assets = Object.keys(stats.compilation.assets);
            const chunks = stats.compilation.chunks.map(chunk => chunk.id);

            assert.deepEqual(assets, expected.assets);
            assert.deepEqual(chunks, expected.chunks);
            done();
        });

    });

});