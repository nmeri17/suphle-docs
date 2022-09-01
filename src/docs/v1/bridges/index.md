## Introduction

Considering Suphle's age, there's a high probability that you have projects built on top of older PHP frameworks. If you have one of such projects but desire taking advantage of the features Suphle has to offer, you may have planned to do so on the next project that comes along. Actually, the existing project can be integrated into Suphle right away, on condition that it implements the bridge adapters. In this chapter, we'll be looking at how to utilize the existing adapter and eventually, how to write our own.

## Laravel bridge

Currently, only a Laravel bridge has been written. The Laravel framework cannot run without finding its "app-root/config/app.php". In order to make this file available, Suphle provides a [component](/docs/v1/component-templates). For the sake of convenience, this component is already connected for you. But to circumvent bundling a local copy of that file, the Laravel component will attempt to download a fresh copy from their online repository. As such, an internet connection is required if you're starting a new project that relies on the [Eloquent adapter](/docs/v1/database#eloquent). If you have an existing project, chances are you have a customized "config/app.php" that should replace the downloaded version.

The installed component location should be considered your Laravel app root. This is for the most basic use-case i.e. providers, config, etc. In order to bring to life our Laravel routes, connect their config to strong typed Suphle config, some additional work is required.

### Configuring Laravel bridge

For more involved usage, Suphle provides the `Suphle\Contracts\Config\Laravel` interface for configuring this bridge.

#### Handling Laravel routes

When `Suphle\Contracts\Config\Laravel::registersRoutes()` returns true, HTTP requests into the Suphle module where this component resides will consult the Laravel installation for routes it's unable to load. If it exists there, request will be delegated, response flushed, just as if we processed it. The default value is `false`.

#### Strong-typing Laravel config

To avoid any ambiguity that may arise from combining Suphle strong-typed configurations with their procedural Laravel counterparts, we use `Suphle\Contracts\Config\Laravel::configBridge()` to streamline them all to become strong-typed. Note that this is not necessary if the request will be handled by Laravel app, anyway. You only need it when using a Laravel-based library within Suphle.

Within this method, we bond flat config files with classes we intend to read in Suphle. An example of such pair would look like this:

```php

use Suphle\Tests\Mocks\Modules\ModuleOne\InstalledComponents\SuphleLaravelTemplates\ConfigLinks\{AppConfig, NestedConfig};

public function configBridge ():array {

	return [

		"app" => AppConfig::class,

		"nested" => NestedConfig::class
	];
}
```

What this does is it permits you to define methods on `AppConfig` that can be read from Laravel's regular `config("app.thing")` or `config("nested.foo")`. During Laravel framework booting, the mirror classes are synced with the files, meaning you can freely type-hint and receive identical values to whatever `config("app.thing")` would've yielded, if you have the need to.

The sole requirement is that the mirror class inherits `Suphle\Bridge\Laravel\Config\BaseConfigLink`. Sub-classes will receive values from the flat config in its constructor, and can opt to use that expose new values under its methods. But whatever value returned from methods on the mirror classes is single source of truth for clients calling the procedural or OOP interface.

A common entry in  "config/app.php" is the following:

```php
return [
	// some other keys
	'name' => env('APP_NAME', 'Laravel')
	//... 
];
```

A complimentary mirror classes can override this like so,

```php
use Suphle\Bridge\Laravel\Config\BaseConfigLink;

class AppConfig extends BaseConfigLink {

	public function name ():string {

		return "Some other name!";
	}
}
```

##### Nesting mirror classes
The objective is to carry along our philosophy of not working with unidentified entities. This means mirror methods should not return arrays but other `BaseConfigLink`s.

```php
class NestedConfig extends BaseConfigLink {

	public function first_level ():FirstLevel {

		return new FirstLevel($this->nativeValues["first_level"]);
	}
}
```

```php
class FirstLevel extends BaseConfigLink {

	public function second_level ():SecondLevel {

		return new SecondLevel($this->nativeValues["second_level"]);
	}
}
```

The above is functionally equivalent to `config("nested.first_level.second_level")`. At each level, `BaseConfigLink::nativeValues` gives access to deserialized flat file value for that node.

For configs with voluminous options, you mustn't redefine them all as methods on your mirror class -- only those necessary for use within Suphle. We will automatically fallback to the flat file for missing methods.


### Artisan commands

While importing your existing project, it may not be necessary to bring the `artisan` command line runner along. Suphle provides a proxy that's especially useful when attempting to run Eloquent-based commands. The proxy has the following signature:

```bash

php suphle bridge:laravel your-command --hydrating_module=ModuleInterface
```

What this does is, it takes an optional module to determine what module to effect the command on. When absent, it simply uses defaults to titular module. It then boots Laravel instance it finds at that module accordingly before forwarding given command to it. A real life example would look like so,

```bash

php suphle bridge:laravel make:migration create_users_table --path=user/module/destination
```

## Building new bridges

Because the specifics of each framework vary, it's impossible to have a single interface all bridges can conform to. A ubiqutous concern is regarding routing. A bridge seeking to include this functionality would have to connect an implementation of `Suphle\Contracts\Routing\ExternalRouter` via `Suphle\Contracts\Config\Router::externalRouters()`.