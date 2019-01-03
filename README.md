# eg-03-node-auth-code-grant
Example 3 Node.JS: User Application with OAuth Auth Code Grant; Signature Request by email


## Browser Support
This example has been tested in Explorer 10, Edge, Chrome, Safari, and Firefox.

## Security
To build a secure application, there is no substitute for consulting
with an Information Security (InfoSec) consultant.
Because DocuSign is used to send and sign legally binding
documents, it is vital that you work with your InfoSec consultants
to build a secure, reliable application for your use case.

This example includes some InfoSec-related safeguards,
but this example software does NOT provide any guarantees.
See the [LICENSE](./LICENSE) file for more information.


### SSL/TLS
In production, SSL/TLS should be used for all communication with the application.

### General InfoSec software libraries
* **[csurf](https://www.npmjs.com/package/csurf)**
express middleware is used to protect forms from
[CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery) attacks.
* **[helmet](https://www.npmjs.com/package/helmet)** express middleware is used to
improve security-related settings.
* **[helmet-csp](https://www.npmjs.com/package/helmet-csp)**
express middleware library is used to add a
[Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) header
to pages. This
[CSP Introduction](https://www.html5rocks.com/en/tutorials/security/content-security-policy/)
and a
[GitHub CSP blog post](https://githubengineering.com/githubs-csp-journey/)
provide additional information on CSP.

### Client ID and Secret Security
Your application's client ID (Integration Key) and client secret should be protected.

### Access Token Security
Access Tokens (Bearer Tokens) are valuable on their own and should not be stored
in a persistent database in cleartext. See [RFC-6819 section 5.1.4.1.4](https://tools.ietf.org/html/rfc6819#section-5.1.4.1.4)
for more information.

Your InfoSec consultants may also recommend that Access Tokens be
encrypted when they are stored in your application's session datastore
or while at rest in memory.

### Refresh Token storage
The DocuSign Refresh Tokens are not valuable on their own since
using a Refresh Token to obtain an Access Token requires the
client id (Integration Key) and the client secret.

Despite this, your InfoSec advisors may recommend that
Refresh Tokens be encrypted when they are stored
or at rest.

### Best practices for production
A [blog post](https://expressjs.com/en/advanced/best-practice-security.html)
from the ExpressJS team provides general production security recommendations for ExpressJS.
