## Introduction

If you are sold on Suphle's features already but remain reluctant due to your missing framework-specific library, there is cheering news. Chances are your dependencies will still work as expected when connected in Suphle. The package may not work is if it's a Laravel plugin i.e. seeks to replace Laravel core functionality such as the router, or more appropriately, interfaces that don't exist on Suphle

User plugs in their service providers in Config\Laravel -> getProviders() labelled by the class in the provider's register method. Then, we kind of imitate the same functionality of registering routes, views etc within our own scope. There is no need to place them in config/app.php ->Providers, since they will be lazy loaded by Suphle container rather than laravel's

In order to prevent facades being used in place of real object names, there is another verification to ensure instance name matches A's request

our config must be a descendant of BaseConfigLink. it will receive values from the old config in its constructor, in case it wants to retain any

link classes 

for it to work, they ought to create a configurable bridge/laravel/config/app.php in the module root

talk about our artisanCli