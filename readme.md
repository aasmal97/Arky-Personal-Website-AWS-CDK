## Introduction
The purpose of this web application is to showcase the projects that Arky has created throughout his software development journey. 

This is entire backend, deployed on AWS. The client side is deployed [here](https://arkyasmal.com)


If you are looking for the client side code go [here](https://github.com/aasmal97/Arky-Personal-Website-Client-Side)
## Notable Structure
This app is structured into 3 categories, with important functions associated with each
1. [Hosting](./app/lib/hosting/) contains the functions required to deploy cloudfront distributions, all domains, and s3 buckets.
2. [Rest API](./app/lib/restAPI/) contains the function to deploy the monolithic Rest API on API Gateway, as well as every lambda function connected to it.
3. [Webhooks](./app/lib/webhooks/) contains the functions that deploy a DynamoDB Table that is used to store webhook data, so a cron job can run and refresh them after expiration. This also contains the logic that deploys a seperate API on API Gateway that handle callback events from a github and google drive webhook events. 
## Dependencies
This app uses a series of dependencies and you can check the list in the following [package.json file](./package.json). Most notably are the following: 
1. [AWS CDK Lib](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html) which is used to deploy all AWS infastructure, as code.
2.  [Google Apis](https://github.com/googleapis/google-api-nodejs-client) for creating webhooks on a personal google drive, that push changes to database when changes are made
3. [Jimp](https://github.com/jimp-dev/jimp) for programmatically editing images
4. [HTML to Text](https://github.com/html-to-text/node-html-to-text) for parsing through HTML, and allowing personal site to display information available to the public UI, but not available on it's public API
5. [Email validator](https://github.com/manishsaraan/email-validator) for validating email structures, and [date-fns](https://date-fns.org/) for validating dates
6. [Azure's Computer Vision AI API](https://azure.microsoft.com/en-ca/products/cognitive-services/computer-vision) that is used to generate a caption to an uploaded image. 

## Build + Deploy
#### Build 
This project uses typescript for type safety, however, AWS lambda functions cannot be written as such. Therefore, custom build steps need to be outlined in the build step to compile typescript to javascript. 

This is automated by using built-in node libraries, like ```execShellCommand``` and `fs` for initiating custom build actions, and copying the resulting files into the build folder.
This works suprisingly well, and no issues have been observed to date. However, there is always a chance that files will take to long to copy, and cause build failure.  

1. To build this project, run ```npm build```

#### Deployment
This project is auto deployed through a custom github action, that creates cloudformation templates from the infastructure defined here, and then auto deploys them to AWS.

To initate the deploy process on your local machine you must:
1. Request access to an account on AWS, that has AWS Lambda, Route 53, API gateway, Cloudfront and/or DynamoDB access. You will only be able to change infastructure that your account has access to.
2. Run ```npm serve```
