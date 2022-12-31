## Introduction

At its most basic level, routing is an application layer that can be regarded as a portal between incoming requests and their execution. The application identifies what coordinator will handle an incoming request using the interchangeable terms route/path/pattern. A number of other framework components, collectively known as Pattern Indicators, are equally coupled to the routing concept. However, instead of shuttling between dedicated locations for those indicators and the route patterns, Suphle removes this duplication by offering only one place to house routes and their indicators, if any.

Pattern indicators include [authentication](/docs/v1/authentication#Securing-routes), [authorization](/docs/v1/authorization#Tagging-route-authorization), [middleware](/docs/v1/middleware#Route-binding), and are all bound on what we call Route Collections. These are primarily classes where routes patterns are defined. They are sub-classes of `Suphle\Routing\BaseCollection`. There are a few surprising differences between Suphle's route collections and the way you may be used to defining your routes:

- As already mentioned, collections are classes rather than a single master file. But instead of finding plain strings mutating a static, global, singleton, Suphle patterns are defined as methods on their collection.

- Status code and response format are defined within the patterns, not in the attached coordinator.

This style isn't a vain attempt to stand out but one that happens to come with some perks:

- Being classes imbues them with qualities such as the ease of replacement (while temporarily modifying features) that extension brings. 

- Class methods give room for further activity pertaining to each pattern, without forming nasty callback hells.

- API response formats can be statically documented.

- The structure of collections and sub-collections allows patterns to be composed down a [trie](https://en.wikipedia.org/wiki/Trie), implying an almost instantenous failure for collections not matching incoming request.

In addition to routing, sub-collections and pattern indication, route collections enable access to advanced concerns such as CRUD, canary routes and route mirroring, which will all be explored in subsequent sections.

PHP 8's Attributes will never be used for route definitions, as they strongly impede route discoverability. A more feasible option for attributes would be an elegant use in pattern indicators. Unfortunately, this will not be pursued since it's faster to read those indicators from methods, where present, rather than reflecting on the collection.

## Pattern syntax

The `BaseCollection` interface defines reserved methods guiding it through the collection's desired behavior. Every other developer-defined method on its implementation will be treated as a route pattern.

### Static pattern segments

Static patterns are treated as defined (rather than as placeholders), by the routing engine. Below, one is connected to the `EntryCoordinator::salesHandler` method.

```php

use Suphle\Routing\BaseCollection;

use Suphle\Response\Format\Markup;

use AllModules\CarModule\Coordinators\EntryCoordinator;

class CarRoutes extends BaseCollection {

	public function _handlingClass ():string {

		return EntryCoordinator::class;
	}
	
	public function SALES() {
		
		$this->_get(new Markup("salesHandler", "show-sales"));
	}
}
```

Upper-case method segments such as `SALES` correspond to their literal equivalents. The definition above says that GET requests to `http://example.com/sales` should execute `EntryCoordinator::salesHandler`, and use the result of that invocation to parse the HTML template at `/configured/path/show-sales.php`.

`_get` and `Markup` refer to the [HTTP method](#HTTP-request-methods) and response [content format](#Presentation-formats) respectively.

#### Hyphenated pattern segments

Illegal characters in method definitions mean that static segments containing the special non-alphanumeric characters hyphens and underscores have to introduce additional letters to help signify developer's intent.

In the collection below, we define patterns that route to `field-agents` and `other_staff`, respectively.

```php

class EmployeeRoutes extends BaseCollection {

	public function _handlingClass ():string {

		return EntryCoordinator::class;
	}
	
	public function FIELD__AGENTSh () {
		
		$this->_get(new Markup("agentsHandler", "show-agents"));
	}
	
	public function OTHER__STAFFu () {
		
		$this->_get(new Markup("staffHandler", "show-staff"));
	}
}
```

With some vigilance, you may observe the introduction of the letters **h** and **u** just after each static segment.

### Dynamic pattern segments

Dynamic patterns bind placeholders to resources accessed with their identifiers. Suppose our database has a table with details about music tracks. Attempting to define static patterns for each row will quickly spiral out of control since we'd have to create new methods each time a new song is added to the database. Not to mention how bloated the collection would grow.

Instead, we employ the use of dynamic segments, by defining them with lower-case characters.

```php

class MusicRoutes extends BaseCollection {

	public function _handlingClass ():string {

		return EntryCoordinator::class;
	}
	
	public function id () {
		
		$this->_get(new Markup("artistesHandler", "show-artistes"));
	}
}
```

When the routing engine encounters this collection, the `id` method will be treated as a wildcard matching any single segment of incoming request not explicitly defined as a static pattern. This means a request to `http://example.com/44` will be sent to `EntryCoordinator::artistesHandler`, whereas a request to `http://example.com/44/something-else` will disregard this definition.

#### Empty segments

We use the reserved method `_index` to define a pattern that matches requests without an additional segment after its [prefix](#Route-prefixing). The collection below will direct requests to `http://example.com/` to `EntryCoordinator::musicHome`.

```php

class MusicRoutes extends BaseCollection {

	public function _handlingClass ():string {

		return EntryCoordinator::class;
	}
	
	public function _index () {
		
		$this->_get(new Markup("musicHome", "show-homepage"));
	}
}
```

#### Optional placeholder segments

Optional placeholders were part of earlier drafts of the routing component, but was ultimately deprecated. If you find yourself caught in the extremely rare case where it's needed, you can escape by representing the optional segment with any of the following options:

- Using query parameters.
- As standalone route patterns.
- As a [sub-collection prefix](#High-level-prefixes).

## Route prefixing

Each route collection should only cater to a top-level resource. Patterns pertaining to resources not directly related to the main theme on a collection, e.g. a product resource succeeding a parent resource such as `http://example.com/store/19/products/14`, should be moved to a separate collection. This enhances cohesion among route related functionality and co-location of related patterns.

Sometimes, resources breaking off into sub-collections are exhibiting a potential to exist in their own [modules](/docs/v1/modules). However, do not force it. It's not always reasonable for parts of the application to exist independent of a given parent.

Breaking the route collections to match the URL `http://example.com/store/19/products/14`, we'll define them as follows:

```php

class StoreCollection extends BaseCollection {

	public function _prefixCurrent ():string {

		return "STORE";
	}
	
	public function storeid_PRODUCTS () {
			
		$this->_prefixFor(ProductsCollection::class);
	}
}
```

```php

class ProductsCollection extends BaseCollection {
	
	public function productid () {
			
		$this->_get(new Markup("showOne", "show-product"));
	}
}
```

There are a number of new introductions in the collections above:

### Inline Prefixes

The call to `_prefixFor` in the `StoreCollection::storeid_PRODUCTS` method is used to usher in the sub-collection. Here, the dynamic segment syntax is combined with that of static segments to match the `19/products` part of the full URL. The routing parser interprets single underscores as the forward slash in a URL. This means any length of segments can be represented with a single underscore-delimited method. However, doing this comes with a few downsides that include sacrificing readability and the ability that comes with tries.

That said, when demoing/prototyping a route, it's more convenient, even forgivable, to use inline prefixes as opposed to creating and connecting a new collection altogether. The following definition will match requests to `http://example.com/store/19`.

```php

class StoreCollection extends BaseCollection {
	
	public function STORE_id () {
			
		$this->_get(new Markup("showOne", "show-store"));
	}
}
```

All other conventions discussed in preceding sections of this chapter remain valid.

### Prefixing dynamic segments

The only caution to be advised while working with dynamic prefixes in general, not just inline ones, is to endeavor to use unique names when defining dynamic segments rather than generic ones such as `id`. Suppose the definition above is modified to match the URL path `http://example.com/store/19/14` as follows:

```php

class StoreCollection extends BaseCollection {
	
	public function STORE_id_id () {
			
		$this->_get(new Markup("showProduct", "show-product"));
	}
}
```

Or, its less obvious counterpart,

```php

class StoreCollection extends BaseCollection {
	
	public function STORE_id () {
			
		$this->_prefixFor(ProductsCollection::class);
	}
}
```

```php

class ProductsCollection extends BaseCollection {
	
	public function PRODUCTS_id () {
			
		$this->_get(new Markup("showOne", "show-product"));
	}
}
```

When [reading incoming placeholder values](/docs/v1/service-coordinators#Builder-selects), the 2nd `id` will overwrite the first.

### High-level prefixes

These are prefixes that apply to the whole collection. We saw them defined using the reserved collection method `_prefixCurrent`. Using it saves us from prepending all our methods with it. In `StoreCollection::_prefixCurrent`, a static prefix is returned, although a dynamic one can equally be returned where applicable.

Sub-collections wield some influence over what prefix is applied on them. For instance, a collection may want to make some adjustments to the prefix of its patterns when it's used as a sub-collection rather than a standalone one.

```php

class ProductsCollection extends BaseCollection {

	public function _prefixCurrent ():string {

		return !empty($this->parentPrefix) ? $this->parentPrefix: "PRODUCTS";
	}
	
	public function productid () {
			
		$this->_get(new Markup("showOne", "show-product"));
	}
}
```

When used in isolation, patterns under this collection will all be prefixed with `PRODUCTS`, thereby resulting in paths like `http://example.com/products/14`. When this same collection is used as a sub-collection, its prefix is dictated by the parent one. The property `parentPrefix` is automatically updated for each collection consumed by another, to the value of the method/pattern that initiated it.

## Connecting route collections

Route collections are connected to the module containing them based on what mode we intend to use them in. Each module that performs routing duties must contain an entry collection that would lead to the high-level prefixes it serves. It is this entry collection that must be connected through its appropriate channel.

Unless the module should explicitly respond to only API requests, collections should be configured to the browser channel. All configuration modes are done using methods defined on the `Suphle\Contracts\Config\Router` interface, although it's more convenient to extend its base implementation, `Suphle\Config\Router`.

To activate a `Router` implementation on any channel, at least one collection must be set, otherwise its module will be inert to all routing activities.

### Browser channel configuration

This configuration is done when the name of the module's entry collection is returned by the `Router::browserEntryRoute` method. Suppose the highest-level collection in our module is `BrowserNoPrefix`, we'll lead the route parser into that module like so:

```php

namespace AllModules\ModuleOne\Config;

use Suphle\Config\Router;

use AllModules\ModuleOne\Routes\BrowserNoPrefix;

class RouterMock extends Router {

	public function browserEntryRoute ():?string {

		return BrowserNoPrefix::class;
	}
}
```

When the incoming request doesn't match the API channel and `browserEntryRoute` returns null, route evaluator will skip this module and move on to the next one.

### API channel configuration

We use an explicit API-channel configuration instead of a JSON negotiator middleware so we can have a high-level affair with the API state of the request and perform [actions tailored to it](#actions-tailored-to-the-API-channel) aside content negotiation. This configuration enables us differentiate between specialized request handlers (unique content on browser vs mobile), response formats, user-accessible version-controlled API results, etc. If none of these are important to you, perhaps you're building a first-party API for an SPA, use the browser channel and return [presentation formats](#presentation-formats) that render to JSON.

It takes 2 settings to complete an API-channel configuration:

1. An API prefix.
1. The route collection stack.

#### API prefix

This is the primary setting that is checked to determine the API status of an incoming request. Its value is set using the `apiPrefix` method. On the default config class, `Suphle\Config\Router` this method returns the ubiquitous prefix, "api".

```php

interface Router extends ConfigMarker {

    public function apiPrefix ():string;
}
```

#### API collection stack

This allows us connect a list of route collections for each version of the application in a descending order. Each successive version inherits all route patterns on the previous one and is only required to either override these or define new ones that won't be available on earlier versions.

Route collections either defined here or intended for responding to API requests in general, are advised to extend the `Suphle\Routing\BaseApiCollection` class for the more specialized utilities it provides that may be useful to them.

Your modules with start out just one API version collection. Once it has been released to actual clients, that version of it should be treated as immutable, since tampering with it will adversely affect those who rely on its response structures, status codes, URLs, ACLs, or any other user-facing characteristic. Instead, new changes after each official release should be destined for a patch or minor release version.

A mild collection stack introducing new updates in latter versions is shown below.

```php

namespace AllModules\ModuleOne\Config;

use Suphle\Config\Router;

use AllModules\ModuleOne\Routes\ApiRoutes\{V1\LowerMirror, V2\ApiUpdate2Entry, V3\ApiUpdate3Entry};

class RouterMock extends Router {

	public function apiStack ():array {

		return [
			"v3" => ApiUpdate3Entry::class,

			"v2" => ApiUpdate2Entry::class,

			"v1" => LowerMirror::class
		];
	}
}
```

```php

use AllModules\ModuleOne\Coordinators\Versions\V1\ApiEntryCoordinator;

class LowerMirror extends BaseApiCollection {

		public function _handlingClass ():string {

			return ApiEntryCoordinator::class;
		}
		
		public function API__SEGMENTh () {
			
			$this->_get(new Json("segmentHandler"));
		}

		public function SEGMENT_id() {

			$this->_get(new Json("simplePairOverride"));
		}

		public function CASCADE () {

			$this->_get(new Json("originalCascade"));
		}
	}
```

On version 2, a fresh handler for an existing route pattern is provided. It exists simultaneously with the first version but will only be visible on this version and those above it on the stack.

In addition, one new pattern is added to this version.

```php

use AllModules\ModuleOne\Coordinators\Versions\V2\ApiUpdate2Coordinator;

class ApiUpdate2Entry extends BaseApiCollection {

	public function _handlingClass ():string {

		return ApiUpdate2Coordinator::class;
	}

	public function CASCADE () {

		$this->_get(new Json("secondCascade"));
	}

	public function SEGMENT__IN__SECONDh () {

		$this->_get(new Json("segmentInSecond"));
	}
}
```

Every other pattern not explicitly defined on this collection will be delegated to version collections beneath it.

In version 3, we override that pattern once again

```php

use AllModules\ModuleOne\Coordinators\Versions\V3\ApiUpdate3Coordinator;

class ApiUpdate3Entry extends BaseApiCollection {

	public function _handlingClass ():string {

		return ApiUpdate3Coordinator::class;
	}

	public function CASCADE () {

		$this->_get(new Json("thirdCascade"));
	}
}
```

When requests come in without a version matching segment, the routing parser will fallback to the topmost version on the stack.

## Actions tailored to the API channel

### Route mirroring

see docblock on JsonNegotiator middleware

propagate to 
...after introduction

talk about the config and applicable middleware if any

both can be used simultaneously
...
It's not always that our APIs return the same response verbatim. Some developers may decide to follow one of the JSON specifications such as JSON-LD, Hapi, and what have you. In such case, we will simply plant a middleware in the stack that wraps all outgoing API response appropriately

// example

## HTTP request methods

So far, we have only seen methods mapping to **GET** requests through the `_get()` method. What about the three other major HTTP request methods namely **POST**, **PUT**, and **DELETE** HTTP methods? Suphle currently makes provision for them through the `_post()`, `_put()`, and `_delete()` methods respectively.

## Presentation formats

is one of the available response formats. It's treated in greater detail [in its chapter](/docs/v1/templating)

## Selectively extending route collections

Suppose we want to reuse a route collection, but don't want all the routes there to appear in the current app, we can't use traits or inheritance since the collection automatically reads all class methods. Class composition is elegant and comes in handy when the number of patterns to import are minor
// example

It may become cumbersome having collections making so many calls to a dependency. In such case, it may be better exposed through a [component template](/docs/v1/component-templates)

Subsequent solutions to be examined are familiar to those who have dabbled in devops and deployment. But they are invited into the programmatic domain for the purpose of developers either oblivious of their existence, or those who have limited access to tooling regarding the subject and the deployment level.

## Canaries And Feature Toggling

Whether we're developing short lived features or internally demoing a permanent one to a subset of the userbase, that which is under review had preferably not leak out to the general public. As such we want to keep them decoupled from permanent routes. This allows them exist in their own little world, likely having their own service-coordinators. The standard term for this is canary releases.

You usually want to read the availability of such feature from its config, a .env, or database

Canary releases should protect URLs under it from direct access, except users are authorized to be there

We're using this in combination with extension instead of conditionals in the existing code

Note: When serving to a group of users, use a concrete auth implementation, not the interface

/// show how to point to a collection with more routes then that guy's service-coordinator is the extended one injecting relevant entities

Authentication resumption happens before canary routing. Or, better put, authentication is evaluated for canaries attempting to read user status, before the app-wide one that terminates on user absence

## CRUD routes
CRUD are operations commonly used for managing resources or entities. Rather than defining them for each entity in our application, the collection class offers the `_crud` method. It doesn't in itself return the required method, but a `CrudBuilder` object that enables us fashion the prepared renderers to our desired tastes.

`CrudBuilder` assumes the application's primary consumer is a browser and as such, uses browser-based renderers rather than JSON

For endpoints rendering HTML content the `CrudBuilder`

describe the method behaviors so they can know which ones they want overriden. draw a table showing their end patterns against the returned renderer

Below, you will find a table containing method, route patterns and their handlers


talk about these methods
		$this->pathPlaceholders->allNumericToPositive();