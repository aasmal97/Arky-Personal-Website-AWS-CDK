## Introduction
The purpose of this web application is to showcase the projects that Arky has created throughout his software development journey. 

This is the entire backend, deployed on AWS. The client side is deployed [here](https://arkyasmal.com)


If you are looking for the client side code go [here](https://github.com/aasmal97/Arky-Personal-Website-Client-Side)
## Notable Structure
This app is structured into 3 categories, with important functions associated with each
1. [Hosting](./app/lib/hosting/) contains the functions required to deploy cloudfront distributions, all domains, and s3 buckets.
2. [Rest API](./app/lib/restAPI/) contains the function to deploy the monolithic Rest API on API Gateway, as well as every lambda function connected to it.
3. [Webhooks](./app/lib/webhooks/) contains the functions that deploy a DynamoDB Table that is used to store webhook data, so a cron job can run and refresh them after expiration. This also contains the logic that deploys a seperate API on API Gateway that handles callback events from a github and google drive webhook event. 
## Dependencies
This app uses a series of dependencies and you can check the list in the following [package.json file](./package.json). Most notably are the following: 
1. [AWS CDK Lib](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html) which is used to deploy all AWS infastructure, as code.
2.  [Google Apis](https://github.com/googleapis/google-api-nodejs-client) for creating webhooks on a personal google drive, that push changes to database when changes are made
3. [Jimp](https://github.com/jimp-dev/jimp) for programmatically editing images
4. [HTML to Text](https://github.com/html-to-text/node-html-to-text) for parsing through HTML, and allowing personal site to display information available to the public UI, but not available on it's public API
5. [Email validator](https://github.com/manishsaraan/email-validator) for validating email structures, and [date-fns](https://date-fns.org/) for validating dates
6. [Azure's Computer Vision AI API](https://azure.microsoft.com/en-ca/products/cognitive-services/computer-vision) that is used to generate a caption to an uploaded image. 

## Develop, Build, & Deploy

#### Understanding the Output of an AWS CDK App
Using the `AWS-CDK`, running & building the app means we are generating the AWS VALID CloudFormation Template Files to deploy our infastructure. When we run the app for development, we are simply checking for type saftey and proper linking within our AWS CDK application. To achieve these upon hot reloading, or on command you can use the following commands:

#### Local Development
To run this command, ensure you have Docker installed on your machine. This will hot reload the CloudFromation template files output, and check types, every time a change is made
```bash
npm run dev
```
#### Build 
This command generates the CloudFromation template files output, only. For this command to work, you must have run `npm install` prior.
```bash 
npm run synth
```
#### Deployment
This project is auto deployed through a custom GitHub Action, that creates CloudFormation Templates and then auto deploys them to AWS.

For deployment from your current machine you must:
1. Request access to an account on AWS, that has AWS Lambda, Route 53, API gateway, Cloudfront and/or DynamoDB access. You will only be able to change infastructure that your account has access to.
2. Run ```npm i```.
3. Run ```npm run deploy```