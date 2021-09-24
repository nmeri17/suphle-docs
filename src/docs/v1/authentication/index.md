## Authentication

Suphple will not hold you to ransom on what payload field names or database columns to authenticate your users against. This means you are at liberty to use as many fields as you deem fit, in any comparison requirement demanded by the business. Keep in mind that Suphple ships with default comparison for the generic app, which we will soon look at.

As previously discussed, login requests are prioritized by the router. The login flow begins from the paths set for authentication in the config. Requests matching these paths are then forwarded to services attached to it for authentication to be attempted and a response derived.

## Completing the login flow
In order to integrate the default login system to our app, we will need to connect it to our user model/entity

## Customization
The entry point set on the config to customize login requests is `BrowserAuthRepo`.
/// show config. note: the paths hard are compared. you don't add placeholders except you wish to replace the `authConfig->getPathRenderer]` with a regex that does

You can extend then switch with a repo containing desired comparers
/// Example

## Securing routes
Every collection can decide on what authentication mechanism it prefers to use. This is required since route collections are meant to be inter-operable between more than one channel i.e. web, api etc. While different routes utilising diverse mechanisms may seem impractical, the major advantage is for the fluid transition to other channels discussed under the [routing topic](/docs/v1/routing#route-inter-operability). During this process, the mechanism internally switches to that used by the active collection.

To secure regular routes, we need to include their pattern in this collection's list
///

Then, return the mechanism type for this collection
///

Note that whatever mechanism is returned must correspond with the one user was authenticated by while logging in.

## In Services
The currently authenticated user can be resolved by the container by type-hinting the `AuthStorage` interface. By default, a session-based implementation is bound to the container to be returned on routes without authentication. Resources at such routes are intended for consumption by both authenticated and unauthenticated users. This binding can be changed by simply binding your `AuthStorage` of choice
/// Example

Authenticated routes, on the other hand, will resolve using whatever mechanism was attached to either the route's collection or that of its ancestors