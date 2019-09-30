<h1 align=center>
  EmailsMinder
</h1>


# What is EmailsMinder?
EmailsMinder is an opensource cloud-based service that allows you to send emails by using simple API.
It supports multiple email providers and in case email delivery fails with one provider,
it will automatically retry with others. Currently, two email providers are supported: mailgun and sendgrid.
However, the service is built to be easily extended to other providers.


# Usage
EmailsMinder is an HTTPS API based service. All endpoints produce JSON data.

OpenAPI definitions of the service: [openapi.json](openapi.json). You can paste
definitions to [swagger editor](http://editor.swagger.io/) for a nice UI.

### Webhook
EmailsMinder allows receiving real-time event notifications by using webhooks. Webhook is a URL where information about
email updates will be POSTed.

### To be implemented
* Better test coverage
* Support for HTML body
* Support for attachments
* Webhook as a separate lambda with retry strategy
* Validation of incoming webhooks



# Development
Feel free to install EmailsMinder locally or deploy it to your hosting.

### Architecture
Please refer to [Architecture Overview](../../blob/master/ARCHITECTURE.md) for a better understanding of the system architecture.

### Running locally
```
git clone https://github.com/evgenykireev/emailsminder
cd emailsminder
yarn
```

Create `env.yml` file in the application root with stage-specific variables.
Example of file contents (all variables are mandatory):
```
dev:
    AWS_ACCOUNT: "value"
    AWS_REGION: "value"
    MAILGUN_DOMAIN: "value"
    MAILGUN_API_KEY: "value"
    SENDGRID_API_KEY: "value"

otherStage
    AWS_ACCOUNT: "value"
    AWS_REGION: "value"
    MAILGUN_DOMAIN: "value"
    MAILGUN_API_KEY: "value"
    SENDGRID_API_KEY: "value"
```

EmailsMinder is a serverless application. Currently, it does not support full offline development as it
needs to use some AWS resources (though it's possible). It means that you'll have to deploy the application before you
can run it locally to `dev` stage. To do so please follow steps in "[Deploying](#deploying)" section.

Once dev stage is deployed, run the application:
 * Sending email:   `sls invoke local --stage dev --function emailSend --path fixtures/sendEmail.json`
 * Getting email:   `sls invoke local --stage dev --function emailGet --data '{"pathParameters": { "emailID": "123" }}'`
 * Processing email `sls invoke local --stage dev --function emailProcess --path fixtures/processEmailSNS.json`
 * Webhook          `sls invoke local --stage dev --function emailWebhook --path fixtures/mailgunWebhook.json`

### Deploying
EmailsMinder utilizes [Serverless framework](http://serverless.com) for building and deploying the application.
To create a new environment:
 * Make sure you have environment configuration in `env.yml` and in `config/config.json` files  
 * Make sure you have your AWS credentials set in `.aws/credentials`
 * Run `sls deploy --stage {STAGE}` Please see
 [Serveless documentation](https://serverless.com/framework/docs/providers/aws/guide/deploying/) in case of problems
 * Copy url of created `/email/webhook/` endpoint and configure email providers to use it for updates. There's
 automated process for it as well - see `/src/email/provider/enableWebhook()`    

### Testing
 Run
 ```
yarn run test
```
