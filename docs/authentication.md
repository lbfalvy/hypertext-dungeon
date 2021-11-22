# Overview

The API uses refresh token rotation (RTR) to grant self-contained access tokens. Access tokens can't be invalidated for performance reasons, therefore their lifespan is limited. By the nature of an API, CSRF tokens aren't used. CORS headers are intentionally completely relaxed to faccilitate automation and third party clients. 

# Flow

This is the authentication flow as seen from the client, taking into account the possibility that there may be multiple clients (tabs) sharing a session.

### Main loop

- #assess: see what's in persistent storage
    - if it's an old pair of tokens but the refresh token is still valid
        - write BUSY@(current timestamp);pair into persistent storage
        - use refresh token with API
            - if request fails, go to beginning
        - if persistent storage did not change
            - write results into persistent storage
    - if it's empty or a pair of tokens with the refresh token expired
        - ask the user for credentials (also wait for storage to change and react when it does)
        - Obtain tokens from the API
        - write the results into persistent storage
    - if it's a new pair of tokens
        - nothing to do
    - if it's BUSY@time;pair
        - wait until a short while after @time
            (configuration parameter: retry timeout)
        - if it did not change, write pair to persistent storage
        - go to beginning
- read new tokens from persistent storage
- wait until the access token is about to expire or persistent storage changes (configuration parameter: time to expiration)
- go to beginning

### Remarks

1. Because the above flow will always check storage after waiting, logging out can be accomplished by clearing persistent storage.
2. The waiting periods should be offset by a (low security) random amount to avoid a thundering herd scenario

# Endpoints

## Login endpoints

Each accept a particular set of credentials, the most basic being a username and a password. Generates a pair of refresh and acces tokens to return and adds the refresh token in the database.

## Refresh

Accepts a refresh token. If it is not found in the database, deletes all tokens of the user and returns with a compromised token error. If the token exists, generates a new refresh and access token to return and overwrites the token in the database with the new refresh token.

## Authenticated API endpoint

Accepts a valid, signed access token, serves the user without having to consult the database for authentication purposes.

# Storage

Refresh tokens are stored along with identifiers of the users they belong to, the collection is indexed for both columns. These fields are populated by the login endpoint and have no criteria beyond that they must be the same for subsequent logins using the same credentials.

# Contents of the tokens

The refresh token includes its own expiry and the username.  
The access token contains, besides the regular JWT fields like expiry, the fields necessary to programmatically handle permission management.  
The access token does NOT contain the user profile, which can be requested from the API. This is both to simplify the token renewal system and to make the token as short as possible since it's included in every request. The fields in the token may be read by clients and used to preemptively reject actions for which the user does not have permission.
