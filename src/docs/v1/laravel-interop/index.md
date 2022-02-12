# Laravel inter-operability
If you are sold on Suphple's features already but remain reluctant due to your missing favourite Laravel library, there is cheering news.

## The cheering news!
There's no need to feel left out, because [^chances] are your dependencies will still work as expected. One of Laravel's most notable features is in its extensibility and tremendous flexibility. What this means is that its regular booting process can be hijacked and replicated within foreign territory

## The downer!
As a package developer, don't get carried away into building new Laravel packages just because they are cross platform. The process of booting a Laravel application instance in the background is an expensive one whose specific cost can be calculated by how demanding the package being provided is. Packages registering views, routes, and configs typically cost more those that register only one of those

Beyond that, care is taken to prevent procedural helper functions that may be present in those packages from leaking into your app. This responsibility comes with its own overhead

In summary, it works, but should be used as band aid for Suphple's current lack of packages

#

Some of Laravel components require scripts that aren't shipped independently. As such, in order to replicate their functionality in your Suphple project, you must first install the framework

```bash
composer require laravel/framework
```

User plugs in their service providers in Config\Laravel -> getProviders() labelled by the class in the provider's register method. Then, we kind of imitate the same functionality of registering routes, views etc within our own scope. There is no need to place them in config/app.php ->Providers, since they will be lazy loaded by Suphle container rather than laravel's

In order to prevent facades being used in place of real object names, there is another verification to ensure instance name matches A's request

[^chances]: The package may not work is if it's a Laravel [plugin](/docs/v1/plugins#plugin-vs-library) i.e. seeks to replace Laravel core functionality such as the router, or more appropriately, interfaces that don't exist on Suphple

our config must be a descendant of BaseConfigLink. it will receive values from the old config in its constructor, in case it wants to retain any

link classes 

for it to work, they ought to create a configurable bridge/laravel/config/app.php in the module root