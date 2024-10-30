function getAllowedOrigins(env) {
  const allowLocalhost = env.ALLOW_LOCALHOST === "true"; // Check the toggle for localhost
  let allowedDomains = env.ALLOWED_DOMAINS.split(",").map(d => d.trim().replace(/\./g, "\\."));
  
  // Filter out localhost if allowLocalhost is false
  if (allowLocalhost) {
    allowedDomains.push("localhost");
  } else {
    allowedDomains = allowedDomains.filter(domain => domain !== "localhost");
  }
  
  // Create regex pattern with optional http for localhost only if allowLocalhost is true
  const allowedDomainsRegex = new RegExp(`https:\\/\\/(?:[a-zA-Z0-9-]+\\.)*(?:${allowedDomains.join("|")})${allowLocalhost ? `|http:\\/\\/localhost` : ""}`);
  
  console.log("Allowed domains regex:", allowedDomainsRegex);
  return allowedDomainsRegex;
}


// CORS check based on the origin
function checkCors(origin, allowedOrigins) {
  const isAllowed = allowedOrigins.test(origin);
  console.log("Checking CORS for origin:", origin, "- Allowed:", isAllowed);
  return isAllowed;
}

// Function to generate a nonce (e.g., a timestamp)
function generateNonce() {
  const nonce = Date.now().toString();
  console.log("Generated nonce:", nonce);
  return nonce;
}

// Function to generate HMAC signature using Web Crypto API
async function generateHMAC(nonce, apiKey, secretKey) {
  console.log("Generating HMAC signature with nonce:", nonce, "API key:", apiKey);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(nonce + apiKey)
  );
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  console.log("Generated HMAC signature:", signatureHex);
  return signatureHex;
}

// Main request handler
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowedOrigins = getAllowedOrigins(env);
    // Try to use the "Origin" header if available; otherwise, use URL origin
    const origin = request.headers.get("origin") || url.origin;
    console.log("Received request for URL:", url, "from origin:", origin);

    // Redirect all requests to /v1/signature if the path is different
    if (url.pathname !== '/v1/signature') {
      console.log("Redirecting to /v1/signature");
      return Response.redirect(`${url.origin}/v1/signature`, 302);
    }

    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      console.log("Handling preflight OPTIONS request");
      return handleOptions(request, allowedOrigins);
    }

    // CORS check for allowed domains
    if (origin && !checkCors(origin, allowedOrigins)) {
      console.log("CORS check failed for origin:", origin);
      return new Response('CORS check failed', { status: 403 });
    } else {
      console.log("CORS check passed or no origin provided.");
    }

    // Handle /v1/signature path
    const nonce = generateNonce();
    const signature = await generateHMAC(nonce, env.API_KEY, env.SECRET_KEY);

    return new Response(
      JSON.stringify({ apiKey: env.API_KEY, signature, nonce }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        }
      }
    );
  },
};

// CORS preflight handler for OPTIONS method
function handleOptions(request, allowedOrigins) {
  const origin = request.headers.get("origin");
  console.log("Handling OPTIONS request for origin:", origin);

  if (origin && !checkCors(origin, allowedOrigins)) {
    console.log("OPTIONS request CORS check failed for origin:", origin);
    return new Response('CORS check failed', { status: 403 });
  }

  console.log("OPTIONS request CORS check passed.");
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
