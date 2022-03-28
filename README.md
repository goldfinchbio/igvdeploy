This project was created as follows:
- Start from the Amplify tutorial at https://docs.amplify.aws/start/getting-started/installation/q/integration/react/
- Install and configure the AWS CLI as described on the Prerequisites page
- Create a new React app and run "amplify init" as described on the "Set up fullstack project" page
- npm install to install dependencies in package.json
- Run "amplify hosting add" to enable publishing, then "amplify publish"
- Now the basic project is created.  The Create React App default app is deployed on Amplify.
- Add Cognito authentication
  - amplify add auth
  - Choose Default configuration
  - Choose Username sign in  (Email is also fine)
  - No to Advanced settings
- Add a REST API
  - amplify add api
  - Choose REST
  - Friendly name is apiawsigv
  - Path is /api
  - Accept default suggestion for Lambda function name
  - Choose NodeJS
  - Choose Serverless ExpressJS function (Integration with API Gateway)
  - No to Advanced settings
  - No to Restrict API access
  - No to Add another path
- Note that config.js is set up for both dev and prod environments, but amplify/team-provider-info.json has just the dev environment.
  - If DEFAULT_DATA_FOLDER is set to an S3 path, that folder will be loaded when the Web page first loads.
- zlib would no longer import due to Webpack 5 breaking changes.
  - Quick fix was to downgrade version of react scripts using npm install react-scripts@4.0.3
- To handle files in S3 (list, headObject, restore from Glacier, presign URLs)
  - You may need to add CORS permissions to your S3 bucket
    - Example: 
      - [
          {
              "AllowedHeaders": [
                  "*"
              ],
              "AllowedMethods": [
                  "HEAD",
                  "GET",
                  "POST"
              ],
              "AllowedOrigins": [
                  "*"
              ],
              "ExposeHeaders": [
                  "Content-Length",
                  "Content-Type",
                  "Content-Range"
              ],
              "MaxAgeSeconds": 3000
          }
        ]
  - Create a new IAM policy called AmazonS3ReadOnlyPlusGlacierRestoreAccess
    - {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:Get*",
                    "s3:List*",
                    "s3:RestoreObject",
                    "s3-object-lambda:Get*",
                    "s3-object-lambda:List*"
                ],
                "Resource": "*"
            }
        ]
      }
  - Go to IAM roles and search for the Cognito pool authRole
  - Attach the policy AmazonS3ReadOnlyPlusGlacierRestoreAccess created above to the authRole
  - Go to IAM roles and search for the LambdaRole for the Amplify function
    - Attach the AWS policy AmazonS3ReadOnlyAccess to the Lambda role



TODOs
- File src/api/API.js:
  - Move AWS region to config
  - Get Amplify API name from aws-exports.js
  - AWS client SDK call returns undefined for Restore key in response object, so have to use a backend call instead
- File src/components/FileStatus.js:
  - Reload only the row containing this component or at least only the file table container.
	- Preserve current folder on reload.

Below is the Create React App README

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
