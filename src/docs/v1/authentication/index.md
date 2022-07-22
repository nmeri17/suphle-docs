## Authentication

Suphle will not hold you to ransom on what payload field names or database columns to authenticate your users against. This means you are at liberty to use as many fields as you deem fit, in any comparison requirement demanded by the business. Keep in mind that Suphle ships with default comparison for the generic app, which we will soon look at.

As previously discussed, login requests are prioritized by the router. The login flow begins from the paths set for authentication in the config. Requests matching these paths are then forwarded to services attached to it for authentication to be attempted and a response derived.

## Completing the login flow
In order to integrate the default login system to our app, we will need to connect it to our user entity. An instance of `Illuminate\Database\Eloquent\Model` is linked by default, in accordance with the underlying ORM. When Eloquent is not in use, replace the injected concrete for `Suphle\Contracts\Auth\User` with an implementation conforming to the active ORM.

## Customization
The entry point set on the config to customize login requests is through the renderers, which in turn derive or perform designated actions from the repositories they point to. These two concepts are crucial to bending the authentication system to any shape desired.

/// show config. note: the paths are hard compared. you don't add placeholders except you wish to replace the `authConfig->getPathRenderer]` with a regex that does

The renderers are the specialized login equivalent of route collections. However, rather than implement `Suphle\Contracts\Routing\RouteCollection`, they are required to implement `Suphle\Contracts\LoginRenderers`

// example

Note that they're not wrapped in a http method.

The repos can be considered as the controller action method but for login requests. As such, they are expected to provide a validator

On successful validation, control is handed over to the repos, where there's no need to check for presence of fields. In accordance with the two routes on the renderer, the repos are expected to expose two handler methods for successful and failed login attempts respectively. On success, `BrowserAuthRepo` initializes a session for the authenticated user and, as directed by the renderer, will redirect to the page of choice. `ApiAuthRepo` on the other hand, responds with the token of the logged in user.

Both authentication forms utilize an identical identification technique that compares the incoming email and password with a user on the underlying database. In later sections, we will see how to customize that when it doesn't satisfy business requirements.

## Validation
The difference between login and regular validators is that the method name for the former is being derived from the action method. Login only consists of one route, thus, only one valid rule-set is required. The default repos, implementing `LoginActions`, return the name of the validator class
// show method (validatorCollection)

tell us what it does

## Securing routes
Every collection can decide on what authentication mechanism it prefers to use. This is required since route collections are meant to be inter-operable between more than one channel i.e. web, api etc. While different routes utilising diverse mechanisms may seem impractical, the major advantage is for the fluid transition to other channels discussed under the [routing topic](/docs/v1/routing#route-inter-operability). During this process, the mechanism internally switches to that used by the active collection.

To secure regular routes, we need to include their pattern in this collection's list
///

Then, return the mechanism type for this collection
///

Note that whatever mechanism is returned must correspond with the one user was authenticated by while logging in. The caveat to bear in mind while working with mirrored routes is that it is assumed that the user visiting a mirrored route must have authenticated himself with the **current** mechanism i.e. only users who have logged in through the token channel can still access mirrored routes locked under the session channel, as long as their requests are accompanied with the authentication token they received.

## Retrieving user instance
This can be achieved in two different ways, depending on where the user is requested. Either way, an instance of `Suphle\Contracts\Auth\User` will be returned. Below, we will look at the two kinds of locations user can be requested from.

### During login flow
The user doesn't exist on `AuthStorage` during the login procedure but in subsequent requests with the active authentication criteria resolved. By default, the resolved user instance can be read from `Suphle\Auth\EmailPasswordComparer` which is accessible from the `comparer` property if you're making use of the default repositories mentioned in the [Customization section](/docs/v1/authentication#Customization).

/// Example of comparer->getUser() in a repo

If your authentication needs exceed those provided by an email-password comparison, you can either override the provided implementation of `Suphle\Contracts\Auth\UserHydrator` in the container, or pass your own comparer altogether to an extended version of the repos
/// Example of the latter not even using email/password checks, perhaps for logging some info or sending notification or other fields

For simple cases where password is required but user hydration logic differs, the above is an overkill. It's safe to override the hydrator and specifically, the `findAtLogin` method. When this is not suitable, you are responsible for retrieving the user however you deem fit. The only important factor is that the framework is informed through the active repo's `compareCredentials` method whether or not authentication succeeded.

### Everywhere else
Authenticated user can be resolved by the container by type-hinting the `AuthStorage` interface and calling its `getUser` method. By default, a session-based implementation is bound to the container to be returned on routes without authentication. Resources at such routes are intended for consumption by both authenticated and unauthenticated users. This binding can be changed by simply binding your `AuthStorage` of choice.

/// Example using a different provider rather than binding entity

Authenticated routes, on the other hand, will resolve using whatever mechanism was attached to either the route's collection or that of its ancestors

## Logging out
The framework can be instructed to invalidate current authenticated status by calling the `logout` method of the `AuthStorage` interface from any location. When session mechanism is active, it will be discarded and will no longer yield a `Suphle\Contracts\Auth\User` instance when invoked. For token-based authentication, only the latter action is performed.

You are encouraged to plant the logout-bearing module on the very first module in your apps module tree in order to avoid cycling through others down the stack

## Multi-user login
Talk about `impersonate` flow for both mechanisms. What happens when I logout in that mode? How do I switch between users?