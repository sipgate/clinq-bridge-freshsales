# CLINQ-Bridge for Freshsales

This service provides Freshsales contacts for CLINQ.

The Freshsales API is described [here](https://developer.freshsales.io/api/) 

To run the integration you need a API Key. Get it from the Freshsales Site: "Personal Settings" -> "API Settings"

For local development the API Key and API URL must be provided as Header:
* "x-provider-key" is the Header for the API Key 
* "x-provider-url" is the Header for the API URL

This urls can be useful in local development.

* GET http://localhost:8080/contacts 
  * trigger fetching contacts from Freshsales
* POST http://localhost:8080/events/calls 
  * trigger handling phone calls event, see example payload in callEvent.json
* POST http://localhost:8080/contacts
  * trigger creating contact
* PUT http://localhost:8080/contacts
  * trigger updating contact 
* DELETE http://localhost:8080/contacts
  * trigger deleting contact



