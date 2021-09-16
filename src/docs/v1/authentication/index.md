## Authentication

Suphple will not hold you to ransom on what payload field names or database columns to authenticate your users against. This means you are at liberty to use as many fields as you deem fit, in any comparison requirement demanded by the business. Keep in mind that Suphple ships with default comparison for the generic app, which we will soon look at.

As previously discussed, login requests are prioritized by the router. The login flow begins from the paths set for authentication in the config. Requests matching these paths are then forwarded to services attached to it for authentication to be attempted and a response derived.

## Completing the login flow
In order to integrate the default login system to our app, we will need to connect it to our user model/entity

## Customization
The entry point set on the config to customize login requests is `BrowserAuthRepo`.
/// show config. are those paths hard compared or can contain query parameters?

You can extend then switch with a repo containing desired comparers

