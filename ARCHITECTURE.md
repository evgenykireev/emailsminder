
# EmailsMinder Architecture
EmailsMinder is a cloud-based, serverless, even-driven platform built on AWS infrastructure.
It consists of a number of λ functions that respond to triggers - API calls, queue processing.

<h1 align=center>
    <img src="https://raw.githubusercontent.com/evgenykireev/emailsminder/master/assets/diagram.png" />
</h1>

## Architectural Choices
### AWS
EmailsMinder is built to run exclusively on AWS. It leverage some of AWS' proprietary features that make it even more AWS centric. This is done deliberately for sake of faster time to production.

### Serverless
EmailsMinder is built using serverless approach. It was chosen for the following reasons:
* No server management
* Flexible scaling
* Automated high availability

[Serverless framework](http://serverless.com) is used to take care of local development, packaging, and deployment. [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) could be used alternately as well.

### API Gateway
EmailsMinder exposes public API endpoints via API Gateway service. API Gateway is used to do requests processing,
throttling, and params validation. A λ function is triggered to handle each request. Potentially it could be used
for caching and API keys management.

### Processing Queue
An SNS topic is used as a processing queue. For every new message published to this topic, a handler λ function is triggered.

### Database
DynamoDB is used as a NoSQL DB which stores information about email. Pay-per-request feature is utilized to make sure
DB capacity meets the current system load. Potentially DynamoDB features like auto-backups and items expiry could be used.

DynamoDB was chosen to provide persistent data storage. If it is not a requirement, it could be replaced with
in-memory key-value storage like Redis

### Lambda functions
A number of λ functions are used as event handlers.


## Email Send Flow
Each email in the system goes through a series of events
1. A new email is submitted by a user. Once validated, it's added to DB and processing queue
2. Email is picked from processing queue and being processed
3. Based on processing results and active providers next available provider is determined.
4.
  - If one exists, try to deliver it to this provider.
  - If none exists, email delivery is considered to be failed.

5. When a webhook update is received
  - If it's a success status, email delivery is considered to be successful.
  - If it's a failed status, email is put back to Processing queue.

## System Constraints
* Max 10000 requests per second for API endpoints
* Max 1000 concurrent Lambda executions (increasable)
* Max 4 KB x 100 strongly consistent reads per second (increasable up to 10,000 reads/second)
* Max 4 KB x 100 x 2 eventually consistent reads per second (increasable)
* Max 4 KB x 100 write capacity units per second (increasable up to 10,000 writes/second)

## Resistance to data loss
Data loss could potentially happen in
* DynamoDB - DynamoDB runs across proven, high-availability data centers with three times data replication. DynamoDB
backups can be used to provide even more durability.
* SNS - SNS will retry to call λ function twice in case it fails to execute. In case λ function keeps failing a message
will be put into [Dead Letter Queue](https://docs.aws.amazon.com/lambda/latest/dg/dlq.html), from where it could be
accessed for future investigations.

## Monitoring
AWS CloudWatch Metrics can be used for system Audit and Monitoring. Metrics that could be monitored
 * Number of API Gateway requests
 * Number of 2xx / 5xx API responses
 * Number of SNS messages posted/processed
 * Number of successful/failing lambda functions  
