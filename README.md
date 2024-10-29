# Metal Pay Connect - Example of Nonce Generator on Cloudflare Pages 

This repository contains a demo for generating nonces and HMAC signatures for your Cloudflare Pages Application. The application includes CORS handling and redirects all requests to `/v1/signature`.

### We are Leveraging Cloudflare Pages Functions [Advanced Mode Functions](https://developers.cloudflare.com/pages/functions/advanced-mode/)

## Quickstart

### Prerequisites


- Cloudflare account
- [Cloudflare Pages Site](https://dash.cloudflare.com/sign-up/workers-and-pages)
- Wrangler CLI installed (`npm install -g wrangler`)

1. **Clone the repository:**

   ```sh
   git clone https://github.com/MetalPay/metal-pay-connect-example-cloudflare-pages-functions.git
   cd metal-pay-connect-example-cloudflare-pages-functions
   ``` 

2. Configure Wrangler:

Update the wrangler.toml file with your Cloudflare account details and environment variables.  

```toml
name = "my-worker"
compatibility_date = "2023-05-13" # set to the current date
compatibility_flags = [ "nodejs_compat" ]

[vars]
SECRET_KEY = "your_secret_key"
API_KEY = "your_api_key"
ALLOWED_DOMAINS = "example.com"
ALLOW_LOCALHOST = "true"
```

3. Deploy the application 

```sh
npx wrangler pages deploy .
```

## Usage 

Once deployed, the application will handle requests to `/v1/signature` and generate a nonce and HMAC signature.

- Endpoint: `/v1/signature`
- Method: `GET`

## Example Request 

```sh
curl -X GET https://your-cloudflare-pages-url/v1/signature
```

## Example Response
```
{
  "apiKey": "your_api_key",
  "signature": "generated_hmac_signature",
  "nonce": "generated_nonce"
}
```


# Code Overview 

## _wrangler.js 

This file contains the main logic for handling requests, generating nonces, and creating HMAC signatures.

- getAllowedOrigins(env): Generates a regex for allowed origins based on environment variables.
- checkCors(origin, allowedOrigins): Checks if the request origin is allowed.
- generateNonce(): Generates a nonce (timestamp).
- generateHMAC(nonce, apiKey, secretKey): Generates an HMAC signature using the Web Crypto API.
- fetch(request, env): Main request handler.
- handleOptions(request, allowedOrigins): Handles CORS preflight OPTIONS requests.


## wrangler.toml

This file contains the configuration for the Cloudflare Pages application. Especially for Local Testing with wrangler. 

```toml

compatibility_date = "2023-05-13" # set to the current date
compatibility_flags = [ "nodejs_compat" ]

[vars]
SECRET_KEY = "your_secret_key"
API_KEY = "your_api_key"
ALLOWED_DOMAINS = "example.com"
ALLOW_LOCALHOST = "true"
``` 

# Local Testing of _wrangler.js 


### Please make sure appropriate data is in your wrangler.toml for expected config and then run the following.

```sh
npx wrangler pages dev .
``` 