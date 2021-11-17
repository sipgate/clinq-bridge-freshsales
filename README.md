# CLINQ-Bridge for Freshsales

This service provides Freshsales contacts for CLINQ.

The Freshsales API is described [here](https://developer.freshsales.io/api/) 

To run the integration you need a API Key. Get it from the Freshsales Site: "Personal Settings" -> "API Settings"

For local development the follwoing environment variables must be set (use .env file, see envTemplate):
* API_KEY - the API Key you get from the Freshsales seit
* REDIS_URL_OFF (disable usage of redis -> in memory caching, ok for local development)

This urls can be useful in local development.

* http://localhost:8080/contacts 
  * trigger fetching contacts from Freshsales
* http://localhost:8080/events/calls 
  * trigger handling phone calls event, see example payload in callEvent.json




