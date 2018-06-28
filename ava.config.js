
export default () => {
    return {
        files: [
            'test/*.js'
        ],
        sources: [
            'src/**/*.{js,scss}'
        ],
        cache: true,
        concurrency: 5,
        failWithoutAssertions: true,
        verbose: true
    }
};
