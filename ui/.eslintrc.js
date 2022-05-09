module.exports = {
    plugins: ['cypress'],
    extends: ['react-app', 'react-app/jest', 'plugin:cypress/recommended'],
    env: {
        'cypress/globals': true,
    },
    rules: {
        'testing-library/no-render-in-setup': [
            'error',
            { allowTestingFrameworkSetupHook: 'beforeEach' },
        ],
        'testing-library/no-unnecessary-act': ['off', { isStrict: false }],
    },
};
