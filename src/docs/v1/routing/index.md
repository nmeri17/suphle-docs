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

#### Retrieving pattern segments

The essence of dynamic segments is placeholders planted to represent values unknown at compile-time. The values are subject to each incoming request and are collected [before even hitting](/docs/v1/service-coordinators#Builder-selects) the coordinator. At that layer, the `Suphle\Routing\PathPlaceholders::getSegmentValue` method is used to read the given dynamic segment.

Given our `MusicRoutes` collection above, the `id` segment of the request to `http://example.com/44` can be fetched like so:

```php

class BaseProductBuilder extends ModelfulPayload {

	protected function getBaseCriteria ():object {

		return $this->blankProduct->where([

			"id" => $this->pathPlaceholders->getSegmentValue("id")
		]);
	}
}
```

Note that a more complete implementation of this class is listed in [its relevant chapter](/docs/v1/service-coordinators#Builder-selects).

`getSegmentValue` has a more liberal cousin called `getAllSegmentValues`, that returns all segments in one go.

```php

protected function getBaseCriteria ():object {

	return $this->blankProduct->where(

		$this->pathPlaceholders->getAllSegmentValues()
	);
}
```

Its usage is mostly safe at this layer since validation has been processed and succeeded. Additional scrutiny is only necessary if input type makes room for content that needs escaping.

##### Reading integer input

When inserting things like item price into your database, or when integers, in general, are lifted from the outside world for placement into your persistence layer, it's safer to ensure they are of positive value. We do this in Suphle using the `getKeyForPositiveInt` method.

```php

protected function getBaseCriteria ():object {

	return $this->blankProduct->where([

		"id" => $this->pathPlaceholders->getKeyForPositiveInt("id")
	]);
}
```

It's only necessary when positivity cannot be left to chance. When this is true for all fields on the payload (as this equally applies to the `Suphle\Request\PayloadReader` object), they can all be converted in one go, to their positive equivalents using the `allNumericToPositive` method.

```php

protected function getBaseCriteria ():object {

	$this->pathPlaceholders->allNumericToPositive();

	return $this->blankProduct->where([

		"id" => $this->pathPlaceholders->getSegmentValue("id")
	]);
}
```	

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

When [reading incoming placeholder values](#Retrieving-pattern-segments), the 2nd `id` will overwrite the first.

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

We use an explicit API-channel configuration instead of a JSON negotiator middleware so we can have a high-level affair with the API state of the request and perform [actions tailored to it](#Route-mirroring) aside content negotiation. This configuration enables us differentiate between specialized request handlers (unique content on browser vs mobile), response formats, user-accessible version-controlled API results, etc. If none of these are important to you, perhaps you're building a first-party API for an SPA, use the browser channel and return [presentation formats](#presentation-formats) that render to JSON.

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

In version 3, that pattern is overriden once again:

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

##### Versioned authentication

Since lower routes are sequentially loaded only when preceding ones are not suitable to handle incoming request, authentication is not resolved except it's defined on that version's collection. This means that if `LowerMirror::CASCADE` was [bound to the authentication receptor](/docs/v1/authentication#Securing-routes), the *overrides* on those other collections won't actually have any effect on it unless they themselves lock this pattern.

If the risk of forgetting to rebind overridden route patterns is too great, consider actually extending the lower collection instead of starting on a fresh slate.

```php

class LowerMirror extends BaseApiCollection {

	public function _handlingClass ():string {

		return ApiEntryCoordinator::class;
	}

	public function CASCADE () {

		$this->_get(new Json("originalCascade"));
	}

	public function _authenticatedPaths ():array {

		return ["CASCADE"];
	}
}
```

To save ourselves from re-binding to this overriden pattern, we extend the original collection.

```php

class ApiUpdate2Entry extends LowerMirror {

	public function _handlingClass ():string {

		return ApiUpdate2Coordinator::class;
	}

	public function CASCADE () {

		$this->_get(new Json("secondCascade"));
	}
}
```

## CRUD builders

Majority of web applications are built around the Resource -- operations are geared towards its Creation, Reading, Updating and Deletion. This premise informs the permission hooks prescribed on [model-based authorizations](/docs/v1/authorization#Model-based-authorization). Most other endpoints that don't simply do this either combine multiple elements from it or exhibit a more complex form of it.

Consequently, the `Suphle\Contracts\Routing\RouteCollection` interface provides a `_crud` method for marshalling out CRUD pattern definitions with sensible bindings that are also open to customization, using the `CrudBuilder` object that it returns.

When defining CRUD builders, the method under which they're introduced is interpreted as a prefix and will be skipped if it doesn't match incoming request. Thus, to describe requests to an `Envelope` resource, its CRUD builder will be created as follows:

```php

use AllModules\ModuleOne\Coordinators\CrudCoordinator;

class BasicRoutes extends BaseCollection {

	public function _handlingClass ():string {

		return CrudCoordinator::class;
	}
	
	public function SAVE__ALLh () {
		
		$this->_crud("envelope")->registerCruds();
	}
}
```

This builder is initialized with the string "envelope", denoting the directory to dig for presentation templates. The eventual path of a markup-based renderer will compute to `/module/view-path/envelope/renderer-template`. Renderer template names are indicated in the [browser binding chart](#Browser-CRUD-binding-chart).

### CRUD binding chart

#### Handler constant legend

In order to facilitate pairing and overriding coordinator handlers, CRUD builders provide constants that translate into the actual method names. The Coordinator connected to the collection where this builder is initialized is expected to have any of the methods bundled with that builder on it.

For the sake of brevity, all constants in the table below are derived from the class `Suphle\Routing\Crud\BaseBuilder`.

|Constant name|Method name|
|-------------|-----------|
|BaseBuilder::SHOW_CREATE|`showCreateForm`|
|BaseBuilder::SAVE_NEW|`saveNew`|
|BaseBuilder::SHOW_ALL|`showAll`|
|BaseBuilder::SHOW_ONE|`showOne`|
|BaseBuilder::UPDATE_ONE|`updateOne`|
|BaseBuilder::DELETE_ONE|`deleteOne`|
|BaseBuilder::SHOW_SEARCH|`showSearchForm`|
|BaseBuilder::SHOW_EDIT|`showEditForm`|
|BaseBuilder::SEARCH_RESULTS|`getSearchResults`|

#### Browser CRUD binding chart

The definition on `BasicRoutes` guarantees that incoming requests will correspond to the handlers on the table below. The renderers will be bound to associated handler constant but are omitted here for the sake of brevity.

|Method pattern |HTTP Method |Handler constant|Renderer |
|---------------|------------|----------------|---------|
|CREATE			|GET		|BaseBuilder::SHOW_CREATE|`Markup("create-form")`|
|SAVE			|POST		|BaseBuilder::SAVE_NEW|`Redirect(/*collection_prefix/new_id*/)`|
|\_index			|GET		|BaseBuilder::SHOW_ALL|`Markup("show-all")`|
|id			|GET		|BaseBuilder::SHOW_ONE|`Markup("show-one")`|
|EDIT_id			|GET		|BaseBuilder::SHOW_EDIT|`Markup("edit-form")`|
|EDIT			|PUT		|BaseBuilder::UPDATE_ONE|`Reload`|
|DELETE			|DELETE		|BaseBuilder::DELETE_ONE|`Redirect(/*collection_prefix*/)`|
|SEARCH			|GET		|BaseBuilder::SHOW_SEARCH|`Markup("show-search-form")`|

In the renderer bound to the `CREATE` pattern, the new ID is derived from an action handler expected to return a payload with the signature:

```php

return ["resource" => $newModel]; // where `newModel` has an `id` property
```

#### API CRUD binding chart

Renderers returned by the CRUD builder on `BaseCollection` are geared towards a browser-based presentation. When working with an API-based collection, it may be more reasonable to return JSON response formats. `BaseApiCollection` returns a more specialized CRUD builder for this purpose. In all cases, a `Json` renderer bound to the handler constant is returned.

Its full list of available endpoints are enumerated below.

|Method pattern |HTTP Method |Handler constant|
|---------------|------------|----------------|
|SAVE			|POST		|BaseBuilder::SAVE_NEW|
|\_index			|GET		|BaseBuilder::SHOW_ALL|
|id			|GET		|BaseBuilder::SHOW_ONE|
|EDIT			|PUT		|BaseBuilder::UPDATE_ONE|
|DELETE			|DELETE		|BaseBuilder::DELETE_ONE|
|SEARCH_RESULTS			|GET		|BaseBuilder::SHOW_SEARCH|

Since there's no markup and template folder to read from for this resource, there's no first argument to `_crudJson`.

```php

class BasicRoutes extends BaseApiCollection {

	public function _handlingClass ():string {

		return CrudCoordinator::class;
	}
	
	public function SAVE__ALLh () {
		
		$this->_crudJson()->registerCruds();
	}
}
```

### Disabling CRUD routes

Modules without content to serve at all the patterns registered by a builder, or those who simply prefer to restrict access to some of them can disable those patterns with its `disableHandlers` method.

In the collection below, all patterns are registered except that represented by `BaseBuilder::SAVE_NEW`.

```php

class BasicRoutes extends BaseApiCollection {

	public function _handlingClass ():string {

		return CrudCoordinator::class;
	}
	
	public function DISABLE__SOMEh () {
			
		$this->_crud("envelope")->disableHandlers([BaseBuilder::SAVE_NEW])

		->registerCruds();
	}
}
```

### Replacing CRUD renderers

When you have a different renderer in mind from the default being bound, the `replaceRenderer` method should be used to return it.

```php

public function OVERRIDE () {
			
	$this->_crud("envelope")->replaceRenderer(

		BaseBuilder::SHOW_ONE,

		new Markup("myOverride", "envelope/show-one")
	)
	->registerCruds();
}
```

`replaceRenderer` only allows for replacing the renderer. If you need to change the route's pattern or its HTTP method, you'll be better off disabling that pattern and redefining it.

## HTTP request methods

The `BaseCollection` class offers the following methods for assigning request methods to our patterns:

|Assignment method|HTTP method|
|-----------------|-----------|
|`_get`			|GET|
|`_post`			|POST|
|`_delete`			|DELETE|
|`_put`			|PUT|

## Presentation formats

These are classes bound to route patterns. After the pattern executes, the result it returns is bound to these classes and they either determine response format received by the user or user's browser behavior. Due to this intricate relationship, all route definitions are incomplete in the absence of a presentation format.

Classes dedicated to presentation formatting are called Renderers and are required to implement the `Suphle\Contracts\Presentation\BaseRenderer` interface. The user's intended experience will influence what renderer is bound to a pattern.

### Customizing response meta

Suphle's renderers all extend from the abstract class, `Suphle\Response\Format\GenericRenderer`, allowing them share functionality for controlling base behavior. These handles are intended for single use. When customization of a renderer's metadata grows recurrent, consider moving it up to the [middleware](/docs/v1/middleware) layer.

#### Changing status code

Except otherwise specified and in special cases such as [handled exceptions](/docs/v1/exceptions#Writing-custom-diffusers), all renderers will respond with status code `200`. To change what code is returned after successful handling of a renderer's action handler, use the `setHeaders` method.

Below, that method causes its renderer to return the given status code:

```php
	
public function SALES() {

	$renderer = new Markup("salesHandler", "show-sales");

	$renderer->setHeaders(201, []);
	
	$this->_get($renderer);
}
```

#### Setting custom headers

The default renderers will take care of the content types expected of them. These can either be overridden or new headers included in the response using the 2nd argument to the `setHeaders` method.

```php

$renderer->setHeaders(200, [ "X-POWERED-BY" => "Suphle" ]);
```

### Default renderers

The following renderers are available. If none of them suits your needs, you can either extend `GenericRenderer` or implement `BaseRenderer` itself.

#### Json renderer

Perhaps the simplest renderer to make use of the `Suphle\Response\Format\Json` renderer. It receives an iterable payload from action handler and converts it to a JSON string which is eventually flushed to the user.

```php

class LowerMirror extends BaseApiCollection {

	public function _handlingClass ():string {

		return ApiEntryCoordinator::class;
	}

	public function CASCADE () {

		$this->_get(new Json("originalCascade"));
	}
}
```

#### Markup renderer

The `Suphle\Response\Format\Markup` renderer is the default renderer responsible for binding data to a given HTML template and producing a parsed, valid HTML string for display in browsers. It takes the handler name, the view name, and an optional presentation logic sheet as arguments.

```php

class CarRoutes extends BaseCollection {

	public function _handlingClass ():string {

		return EntryCoordinator::class;
	}
	
	public function SALES() {
		
		$this->_get(new Markup("salesHandler", "show-sales"));
	}
}
```

It's configuration and parser replacement are all treated in greater detail [in its chapter](/docs/v1/templating).

#### Reload renderer

The `Suphle\Response\Format\Reload` renderer causes the browser to reload the originating request. This sort of behavior is usually desirable when the originating request delivered a form and developer wants to display some alert regarding operation's success.

Similar to the `Json` renderer, it only accepts the handler as argument, but will return a response with status code `205`.

```php
	
public function SHOW__FORMh () {
	
	$this->_get(new Markup("showCreateForm", "show-form"));
}

public function PROCESS__FORMh () {
	
	$this->_get(new Reload("getProcessingResult"));
}
```

`Reload` renderer expects another renderer to have responded to a preceding request. The raw result of that preceding response is then combined with that generated while processing the current one, to form a final payload. Contents of preceding request are stored on the session, thus making this renderer type applicable only in contexts such as browser-visited routes.

The presentation template of that preceding request is equally borrowed to form a new response.

#### Redirect renderer

The `Suphle\Response\Format\Redirect` renderer is used for endpoints that don't directly return a response after the action handler executes, but rather, usher the browser to another URL either predetermined or dynamically created while handling the request.

When the destination is foreknown, it can simply be returned by the callback given as 2nd argument to the `Redirect` constructor.

```php
	
public function PAYMENT__GATEWAYh () {
	
	$this->_get(new Redirect("saveCartPayment", function () {

		return "/hello";
	}));
}
```

However, in most cases, the destination relies on the result or data created while handling the request. When this is the case, the given callback should read action handler response from the `rawResponse` property. Suppose the action handler looks similar to this:

```php
	
public function paymentGatewayHook (CartBuilder $cartBuilder):array {

	$this->cartService->initializeUpdateModels($cartBuilder);

	return [

		"message" => $this->cartService->updateModels()
	];
}
```

Assuming `updateModels` returns what amount to charge or some other information relevant to the payment provider, the `Redirect` callback will read that data as follows:

```php
	
public function PAYMENT__GATEWAYh () {
	
	$this->_get(new Redirect("paymentGatewayHook", function () {

		return PaymentProcessor::generateUrl($this->rawResponse["message"]);
	}));
}
```

Due to renderers being serialized in session for all non-API-channel requests, if your `rawResponse` property contains active PDO instances such as an ORM model, we will be unable to read it. To get around this limitation, the callback has to be doubly wrapped.

In the example above, the static method of a collaborator, `PaymentProcessor`, was used to generate the next destination URL. Collaborators without a static method i.e. that require an instance, should be type-hinted as arguments to the given callback, and will be auto-wired for you. Putting both caveats together (the assumption of the presence of a PDO instance and auto-wiring), our definition can be modified as follows:

```php
	
public function PAYMENT__GATEWAYh () {
	
	$this->_get(new Redirect("paymentGatewayHook", fn () => function (PaymentProcessor $processor) {

		return $processor->generateUrl($this->rawResponse["resource"]->id);
	}));
}
```

## Feature toggling

Whether we're releasing short-lived features or internally demo-ing a permanent one to a subset of the user-base, that which is under review had preferably not leak out to the general public. The standard term for this is canary releases.

A common strategy for implementing them is to read the availability of such feature from its config, an `.env` entry, or a database table. The code-base is then rigged with conditionals constantly consulting any of the feature indicators listed above. Whenever it's present, that block of code is executed. Not only is this highly inefficient, we get to leave dead code behind after feature is toggled off, or hunt the conditional all over the code to get rid of them.

An more elegant choice would be reading the indicator once, one conditional that when applicable, will branch off to a section of the project entirely in conformity with that feature.

### Canary contextual classes

Suphle implements this solution by connecting contextual route collections. These collections are gateways that when evaluated, will determine whether their route collection is eligible to handle the request for that user. They reside in feature folders and point to related service-coordinators, services, events, tests, etc, as a **unit** that can be deleted or moved around without affecting the main/permanent contents of the module.

Canary contextual classes are required to implement the `Suphle\Contracts\Routing\CanaryGateway` interface.

```php
interface CanaryGateway {

	public function willLoad ():bool;

	public function entryClass ():string;
}
```

The route collection returned by `entryClass` will be used as a collection prefix if the `willLoad` method evaluates to `true`. Suppose we have special content at `http://example.com/special-foo/same-url` for user with ID 5, his gateway will be written like so:

```php

use Suphle\Contracts\{Routing\CanaryGateway, Auth\AuthStorage};

use AllModules\ModuleOne\Routes\CanaryCollections\CollectionForUser5;

class CanaryForUser5 implements CanaryGateway {

	public function __construct(protected readonly AuthStorage $authStorage) {

		//
	}

	public function willLoad ():bool {

		return !is_null($this->authStorage->getUser()) &&

		$this->authStorage->getId() == 5;
	}

	public function entryClass ():string {

		return CollectionForUser5::class;
	}
}
```

```php
class CollectionForUser5 extends BaseCollection {

	public function _handlingClass ():string {

		return CanaryController::class;
	}

	public function SAME__URLh () {

		$this->_get(new Json("user5Handler"));
	}
}
```

As many gateways can define this same route pattern. But internally, they will point to an entirely different suite of collections and coordinators that serve their specific needs.

Not all canary gateways rely on the presence of an authenticated user, as in `CanaryForUser5`. Some could depend on request's IP address, presence of a request parameter or any other quantity. Naturally, authentication is resolved *after* the eventual route is determined, as that is only when one can be certain of that pattern's authentication requirements. In the case of the `CanaryForUser5` gateway however, the default authentication mechanism being bound is the one that will be used.

Ultimately, regular authentication will be evaluated after the full route pattern has been identified. Although it may seem redundant at this point, it also implies that if the final collection reports usage of an authentication mechanism different from that which was used for the gateway, authentication failure will result in request termination, as usual.

### Connecting contextual collections

Their connection is linked using the `BaseCollection::_canaryEntry` method.

```php
namespace AllModules\ModuleOne\Routes;

use Suphle\Routing\BaseCollection;

use AllModules\ModuleOne\Routes\Canaries\{DefaultCanary, CanaryRequestHasFoo, CanaryForUser5};

class CanaryRoutes extends BaseCollection {

	public function _handlingClass ():string {

		return "";
	}

	public function SPECIAL__FOOh () {

		$this->_canaryEntry([

			CanaryForUser5::class, CanaryRequestHasFoo::class, DefaultCanary::class
		]);
	}
}
```

As always, the method pattern must match incoming request before the route parser descends into it. The canary evaluator will cycle through all gateways given for that prefix. The underlying collection of the successful gateway could hold a host of patterns that no other user will be able to access.

While connecting gateways, prepare for the eventuality of the visitor not matching any of the feature gateways, and provide a fallback gateway that will respond with default content/route collection for that pattern.

```php

class DefaultCanary implements CanaryGateway {

	public function willLoad ():bool {

		return true;
	}

	public function entryClass ():string {

		return DefaultCollection::class;
	}
}
```

Failure to do so will cause the routing component to pretend that route doesn't exist to any visitor who doesn't match any of the given gateways i.e. it will respond with the regular status code `404`, and "Not found" protocols in place.

## Route mirroring

This phenomenon refers to the act of making route collections configured to the [browser channel](#Browser-channel-configuration) equally visible under the [configured API prefix](#API-prefix). When this is activated, the browser collection behaves like a "version-0" of the API -- in other words, it has the following characteristics:

1. Most significantly, all renderers returned by any browser pattern matching incoming request + API prefix, will be converted into `Json` renderers.

1. It acts as a fallback collection for the API collections. Any matching pattern on any of the connected version collections will respond to the incoming request. Otherwise, the routing component will strip the prefix and check for the pattern on the browser collection.

### Route mirroring vs content-negotiation

This sequence described in the introductory section of this topic may sound like the familiar concept of content-negotiation middleware. However, the nature of middleware virtually forces us to lose out on the versioning and browser-side overridding benefits of dedicated API routes i.e. since they can only be determined after computing route segments. If it's satisafactory to simply translate browser collection response types into JSON, you can add the `Suphle\Middleware\Handlers\JsonNegotiator` middleware to the [default list](/docs/v1/middleware#Generic-binding), and it will take care of the rest.

### Activating route mirroring

For it to go into effect, the `Suphle\Contracts\Config\Router::mirrorsCollections` method must return `true`. Its turned off on the default implementation.

```php

class RouterMock extends Router {

	public function browserEntryRoute ():?string {

		return BrowserNoPrefix::class;
	}

	public function apiStack ():array {

		return [
			"v2" => ApiUpdate2Entry::class,

			"v1" => LowerMirror::class
		];
	}

	public function mirrorsCollections ():bool {

		return true;
	}
}
```

### Authenticating mirrored routes

This is a question of what mechanism should be used to verify authentication status of application visitor when those patterns are inverted into the API prefix. The default value for this configuration on `Suphle\Config\Router` is `Suphle\Auth\Storage\TokenStorage`.

If your API is used by a SPA or if for any other reason, a cookie/session form of authentication is more convenient, the `Suphle\Contracts\Config\Router::mirrorAuthenticator` method can be used to set this config to that.

```php

use Suphle\Auth\Storage\SessionStorage;

use Suphle\Config\Router;

class RouterMock extends Router {

	public function mirrorAuthenticator ():string {

		return SessionStorage::class;
	}
}
```

## Selectively extending route collections

Suppose we want to reuse a route collection from another project but don't want all its route patterns to appear within the present scope, we can't use traits or inheritance since the collection automatically reads all class methods. When possible, the collection should be bundled as a [component template](/docs/v1/component-templates), and customized to taste on the consuming scope.