
import test from 'ava';
import rimraf from 'rimraf';
import webpack from 'webpack';
import configs from './configs';

// clear output before starting any test
test.before.cb('clear output folder', t => {
    rimraf('./test/output', () => {
        t.pass();
        t.end();
    });
});

// test style-loader
test.cb('only javascript output', t => {

    const expected = {
        assets: ['example.js', 'example-desktop.js'],
        chunks: ['example', 'example-desktop']
    };

    webpack(configs['only-javascript-output'], (err, stats) => {

        if (err) 
            return err;
        else if (stats.hasErrors()) 
            return stats.toString();

        const assets = Object.keys(stats.compilation.assets);
        const chunks = stats.compilation.chunks.map(chunk => chunk.id);

        t.is(assets.length, expected.assets.length);
        t.deepEqual(chunks, expected.chunks);
        t.end();
    });

});

// test mini-css-extract-plugin
test.cb('external css output', t => {

    const expected = {
        assets: ['example.css', 'example.js', 'example-desktop.js', 'example-desktop.css'],
        chunks: ['example', 'example-desktop']
    };

    webpack(configs['external-css-output'], (err, stats) => {

        if (err) 
            return err;
        else if (stats.hasErrors()) 
            return stats.toString();

        const assets = Object.keys(stats.compilation.assets);
        const chunks = stats.compilation.chunks.map(chunk => chunk.id);

        t.is(assets.length, expected.assets.length);
        t.deepEqual(chunks, expected.chunks);
        t.end();
    });

});