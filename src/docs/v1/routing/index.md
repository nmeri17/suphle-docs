## Introduction

Routing is one of most frameworks' strongest focal points. It's the location from which core components such as authentication, authorization, service-coordinators and middleware are exposed by developer. It'll otherwise be duplicitous to introduce those components elsewhere and apply relevant routes to them.

That being the case, Suphle takes them a step further as the location for defining [flows](/docs/v1/flows) and response types. However, we won't examine all of that in this chapter. This one will only equip you with all you need to translate user requests to their service-coordinators

---
Routing consists of defining [service-coordinator](/docs/v1/service-coordinators) adapters i.e. portals between an incoming request and its execution. This means that for all the power service-coordinators are known to wield, they are answerable to what is being dictated from route definitions. As will soon be seen with route collections, one can plug in various co-existing service-coordinator implementations as the need may be.

## Route collections
These are classes where routes/paths are defined. Route collections can either implement the `Suphle\Contracts\RouteCollection` or preferably, extend `Suphle\Routing\BaseCollection` which should be the base class for your lower level collections. 

## Defining paths

At the most basic level, paths are derived from method names:

```php

use Suphle\Routing\BaseCollection;

use Suphle\Response\Format\Markup;

use Modules\CarModule\Controllers\EntryController;

class CarRoutes extends BaseCollection {

	public function _handlingClass ():string {

		return EntryController::class;
	}
	
	public function SALES() {
		
		return $this->_get(new Markup("salesHandler", "show-sales"));
	}
}
```
From the above, we've defined our route, tagged its http method, and declared what response type (otherwise known as renderers) is expected of it. The method `SALES` corresponds to the path [http://example.com/sales](http://example.com/sales). It's appropriate for methods to return fresh renderers, except in some special cases.
While it may be neater to initialize renderers in a collection's constructor, considering methods aren't evaluated except their pattern matches, it's slightly more efficient to instantiate new ones inside their method.


## Dynamic routes
These refer to paths with segments unknown at *compile time*. Attempting to define paths such as "/user/25", "/music/thriller" will quickly spiral out of control since we'd have to create new methods each time a new song is added to the database. Not to mention how bloated our route definitions will get.
For our collection to catch such routes, we'll define our method like so:

```php
class MusicRoutes extends BaseCollection {
	
	public function ARTISES_id() {
		
		return $this->_get(new Markup("artistesHandler", "show-artistes"));
	}
}
```
The method above will respond to requests to [http://example.com/artistes/44](http://example.com/artistes/44)

::: tip
Note the difference in capitalization: Upper cases denote static path segments, lower cases represent placeholders.
:::

## Hyphenated segments

As you may have realized, path method names are delimited by underscores, which equally happens to be a valid path character. Let's look at how you'd go about defining your route to account for static segments containing hyphens

```php
class EmployeeRoutes extends BaseCollection {
	
	public function FIELD__AGENTSh_id() {
		
		return $this->_get(new Markup("agentsHandler", "show-agents"));
	}
	
	public function OTHER__STAFFu_id() {
		
		return $this->_get(new Markup("staffHandler", "show-staff"));
	}
}
```
The first method, `FIELD__AGENTSh_id()` corresponds to the following path [http://example.com/field-agents/15](http://example.com/field-agents/15), while the `OTHER__STAFFu_id()` responds to [http://example.com/other_staff/32](http://example.com/other_staff/32). With some vigilance, you may observe the introduction of the letters **h** and **u** just after each static segment.

To recap, static segments ending with a **h** will have all their underscores replaced by a hyphen, while those ending with a **u** will be replaced with underscores.

Remarkable, isn't it?! We've managed to replace all the incompatible URL tokens with string equivalents to fit our every purpose. One last thing, though.

## Optional placeholders
Say, we intend to create a path to [http://example.com/towns/venice](http://example.com/towns/venice), but we equally want the same handler to match [http://example.com/towns](http://example.com/towns), we'll need to present a method name responds when everything else matches along with the presence or absence of "venice". such method will be defined like so:

```php
class TownRoutes extends BaseCollection {
	
	public function TOWNS_name0() {
		
		return $this->_get(new Markup("townsHandler", "show-towns"));
	}
}
```
The trailing number **0** indicates that whether "name" is present or not, this method is qualified to execute request.

## Request methods
So far, we have only seen methods mapping to **GET** requests through the `_get()` method. What about the three other major HTTP request methods namely **POST**, **PUT**, and **DELETE** HTTP methods? Suphle currently makes provision for them through the `_post()`, `_put()`, and `_delete()` methods respectively.

---
But it's not advisable to compress all our segments into one method as we have in all the earlier examples. Ideally, each 
method should contain either one static segment or a placeholder.

In line with the "S" part of the [SOLID](https://en.wikipedia.org/wiki/SOLID) principle, each route collection 
should only cater to a top-level resource. Any content that doesn't directly pertain to it should exist on another collection below it, which it has no direct knowledge of. This enhances cohesion among route related functionality and co-location of related endpoints.

## Route prefixing

The common term for describing grouping sub-patterns is route prefixes. In light of the dividends of grouping our patterns into as many collections as required, let's look at the way to make that possible.

```php

namespace Modules\ZooModule\Collections;

class AnimalRoutes extends BaseCollection {
	
	public function dragons() {
			
		return $this->_prefixFor(DragonCollection::class);
	}
}
```

Note that the above method neither returns a renderer nor tags any http method. So what's the catch? We will find out after looking at the contents of `Modules\ZooModule\Collections`.

Wrapping related endpoints under the same umbrella happens to come with some additional perks: let's take a moment to understand how routes are matched in Suphle, shall we?

## Route matching: a brief history

Rather than parsing each module's routes into one master list of app routes loaded into cache/memory and comparing them for every request, our patterns are sort of composed down a [trie](https://en.wikipedia.org/wiki/Trie); both the collections underneath and their patterns are as good as non existent. Each method and its pattern is pulled on demand using [generators](https://www.php.net/manual/en/language.generators.overview.php). Only when the incoming request matches the currently evaluated method is it loaded lazily and compared.

In other words, irrelevant groups are spotted faster, which in turn, translates to one of the fastest pattern matching in all of PHP; all because that next segment was wrapped its own collection. If prefixes and grouping are so powerful, they may be worth giving a closer look.

## Revisiting prefixes

```php

namespace Modules\ZooModule\Collections;

class AnimalRoutes extends BaseCollection {
	
	public function dragons() {
			
		return $this->_prefixFor(DragonCollection::class);
	}
}

class DragonCollection extends BaseCollection {
	
	public function FIGHTS() {
			
		return $this->_get(new Markup("fightsHandler", "fights-page"));
	}
}
```

It is apparent with the above that the lower level collection is part of a bigger puzzle collaborating in the grand scheme of things, and it doesn't even know it! For all it cares, it can exist just as independently as its host collection. As long as it either defines its group name AAA, or lets a host collection do that for it through the method name where it's defined. 
When both are present, the outer declaration takes precedence ((still true??)). This means authors can publish modules containing route collections, which can be imported into any parent scope whatsoever

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

## Api Versioning
Api endpoints are backwards compatible. We need the given version of a path. If it isn't specified on this version, we look for it on the previous version, recursively Lazy loading the route classes on demand
ApiRoutes = [V1 => this->browserRoutes(), v2 => classB ] //

1) request comes in for v1, we skip v2 
2)  v2, we slice the array from v2, and load backwards till a match is found

You don't have to Extend api route collections as this would tightly couple each new collection to the previous one. Incoming collections should be able to pick up where their preceding collection left off

We're not reading its parents automatically from a numerically indexed array of versions cuz it won't be immediately understood by a human reader

API documentation should be cast in stone. This means that after generating documentation for a certain version of your API, once it has consumers or clients, that artifact should become immutable. New changes should be destined for a patch or minor release version

## Route Inter-operability
...after introduction

talk about the config and applicable middleware if any
...
It's not always that our APIs return the same response verbatim. Some developers may decide to follow one of the JSON specifications such as JSON-LD, Hapi, and what have you. In such case, we will simply plant a middleware in the stack that wraps all outgoing API response appropriately

// example

## CRUD routes
CRUD are operations commonly used for managing resources or entities. Rather than defining them for each entity in our application, the collection class offers the `_crud` method. It doesn't in itself return the required method, but a `CrudBuilder` object that enables us fashion the prepared renderers to our desired tastes.

`CrudBuilder` assumes the application's primary consumer is a browser and as such, uses browser-based renderers rather than JSON

For endpoints rendering HTML content the `CrudBuilder`

describe the method behaviors so they can know which ones they want overriden. draw a table showing their end patterns against the returned renderer

Below, you will find a table containing method, route patterns and their handlers

## The three challenges of api dev

Decoupled development
Documentation
Seamless integration

If you don't have the luxury of developing at your pace, you will greatly benefit from design first tools like API blueprint. It's important to not work under pressure of delivering endpoints to kick off API consumption. Aside from this, APIs should be rapidly prototyped. And the first step in doing so would be setting up the routes and returning dummy responses. That's the bare minimum promise of what is to come

If you don't care much about using an API design tool, it is assumed you have an alternative or intuitive means of arriving at a decent design your consumers will consent to. Should this be the case, after implementation, suphle solves the documentation problem by generating openAPI schemas from your routes and their associated responses

---
probably an odd location and would require a requests page

talk about these methods
		$this->pathPlaceholders->allNumericToPositive();