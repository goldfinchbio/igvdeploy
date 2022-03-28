// Based on https://serverless-stack.com/chapters/environments-in-create-react-app.html

const dev = {
    APP_STAGE: 'development',
    DEFAULT_DATA_FOLDER:  ''
};

const prod = {
    APP_STAGE: 'production',
    DEFAULT_DATA_FOLDER:  ''
};

const config = process.env.REACT_APP_STAGE === 'production'
    ? prod
    : dev;

export default config;