## Introduction

In a nutshell, Flows are performance-enhancing preemptive caches. It differs from traditional caching in the sense that the latter requires an initial user to warm the cache of that particular content. This drawback implies it's not applicable to applications where that next visit should be unique, or appear dynamic in nature e.g. reshuffling the recommended section of a product. Flows tend to salvage these constraints by caching the request for that user even before they make it.

For instance, suppose an author or artiste's online catalog is visited, Flows would anticipate user's next request will definitely be to one of books in this collection, loads them ahead of time into the cache, thereby creating the illusion of a static site. Due to their inherently temporary nature, they aren't updated when their original content changes on the database.

## Describing a flow

Flows are written using attributes on coordinator methods. Each flow is connected to its originating route definition. Continuing with our analogy above, Flows to the books pattern would be defined in the catalog coordinator as follows:

```php

use Suphle\Services\BaseCoordinator;
use Suphle\Routing\Attributes\{Route, CollectionFlow, CollectionFlowOperation};
use Suphle\Response\Format\Json;
use Suphle\Services\Structures\ModellessPayload;

class CatalogPayload extends ModellessPayload
{
    public function getDomainObject(): array
    {
        return $this->payloadStorage->getKey('data') ?? [];
    }
}

class CatalogCoordinator extends BaseCoordinator
{
    #[Route('catalog/{id}')]
    #[CollectionFlow(
        target: 'books/{id}',
        source: 'data',
        operation: CollectionFlowOperation::PIPE_TO
    )]
    public function getCatalog(CatalogPayload $payload): Json
    {
        return new Json([
            'data' => $this->catalogService->getItems($payload->getDomainObject())
        ]);
    }
}
```

Suppose our coordinator returns the following payload:

```php

class CatalogCoordinator extends BaseCoordinator {

	/**
	 * @return Books[]
	*/
	public function getCatalog (BooksBuilder $catalog):array {

		return [

			"data" => $catalog->get()
		];
	}
}
```

While serving the current request, the Flow definition above will be sent to the queue. When the task runs, it'll lift each of the IDs in the dataset returned by `getCatalog()["data"]`. A special instance of your application is spun up and on it, the route definition designated to handle "books/id" is found, substitute each ID, storing the response in a cache such as Redis. In this state, everything you expect to be executed for an organic request will run. That includes authentication, authorization, middleware and validation, for each unique identifier described during Flow definition.

When an actual request for a Flow-handled resource comes in (otherwise called the subsequent request), Suphle will skip routing, database querying, those other protocols listed above, etc. The only *expensive* process that may occur is for user authentication.

Flow descriptions can point to other Flow descriptions. Suphle will bounce through each of them as they're visited.

## Flow categories

Not all preceding requests return datasets with a collection of identifiers. It's also not cast in stone for all subsequent requests to point to endpoints loading one resource at a time. To that effect, Flows allows us describe the shape of both the preceding and subsequent data responses for most flow sequences possible. The nature of the subsequent request is what determines how or what data will be extracted from the preceding request. Subsequent requests can be divided into the following broad categories:

- Those that extract and work with a single value from a given node, known as **Single Nodes**
- Those that extract and work with nodes that contain a list of data (such as database models), known as **Collection Nodes**

Think of these categories as JavaScript Promises, since they don't work on the response body immediately but resolve to the appropriate renderer at a later date. The idea is to reach into the previous response with a key matching one of those returned from that payload. The value at this key will determine whether it is a single or collection node. The key can either be the actual key name as depicted above, or can be drilled down to relevant property on that node using dot notation:

```php

#[CollectionFlow(
    target: 'resource/{id}',
    source: 'store.id',
    operation: CollectionFlowOperation::PIPE_TO
)]
```

Each handler method returns an instance of the flow type for fluent chaining/operation piping, although handler methods at your disposal will likely deliver for most use cases.

### Handling single nodes

Access to a node holding a single value is obtained using the `SingleFlow` attribute.

```php

use Suphle\Routing\Attributes\{Route, SingleFlow, SingleFlowOperation};

#[Route('products/{id}')]
#[SingleFlow(
    target: '/products/recommended',
    source: 'next_page_url',
    operation: SingleFlowOperation::ALTERS_QUERY
)]
public function getProduct(CatalogPayload $payload): Json
{
    return new Json([
        'next_page_url' => '/products/recommended?page=2&category=electronics'
    ]);
}
```

Once this node is retrieved, we have to instruct Flows on how to prepare it for subsequent requests by attaching single-node based operations to it. The following operations are available for this Flow category:

#### Query updating operation

This sort of operation is useful when the preceding response is the result of running an incremental query. It is implied that slightly modifying the query will return another dataset. This functionality can be illustrated using a paginated endpoint. The payload would typically contain the actual data, along with meta information regarding what query and parameter to modify in order to load the next page. We can then use Flows to load that next request in the background:

```php

#[Route('products/{id}')]
#[SingleFlow(
    target: '/products/recommended',
    source: 'next_page_url',
    operation: SingleFlowOperation::ALTERS_QUERY
)]
public function getProduct(CatalogPayload $payload): Json
{
    return new Json([
        'next_page_url' => '/products/recommended?page=2&category=electronics'
    ]);
}
```

The query at given node is extracted and hydrated into `Suphle\Request\PayloadStorage` for you. Thus, app will treat it just as an organic request to that endpoint with those query parameters.

### Handling collection nodes

Access to a node with data that can be either further manipulated or filtered into an operation is obtained using the `CollectionFlow` attribute. 

Used when the current response contains a list (collection) of data, and you want to warm a unique request for items within that list.

| Argument | Type | Description |
| :--- | :--- | :--- |
| `target` | `string` | The URI pattern to warm (e.g., `"users/{id}/stats"`). |
| `source` | `string` | The key in the response payload containing the data. |
| `operation` | `Enum` | The strategy for processing the collection. Defaults to CollectionFlowOperation::PIPE_TO |
| `columnName` | `string` | The specific key in the collection items to map to the URL. |
| `ttl` | `int` | Expiration time in seconds (Default: 600). |
| `maxHits` | `int` | Number of times the cache can be served before eviction. |

```php

#[CollectionFlow(
    target: 'books/{id}',
    source: 'data'
)]
```

`CollectionFlow` takes an optional `columnName` parameter referring to what property on each collection item to work with. We saw in an earlier example, IDs of each item were extracted and forwarded to the application. To extract some other property, we'll use the `columnName` parameter as follows:

```php

#[CollectionFlow(
    target: 'books/{id}',
    source: 'data',
    operation: CollectionFlowOperation::PIPE_TO,
    columnName: 'name'
)]
```

This will cause the name of each book to be forwarded to "books/{id}". Operations under this category will populate `Suphle\Routing\Structures\RouteInfo` for subsequent requests, on a matching key.

```php

$this->routeInfo->getSegmentValue("name");
```

Where absent, this argument will fallback to the "id" property.

The following operations are available for collection-based Flows:

#### Iterative operation

Warming the profile page for every user returned in a search result.

```php
#[Route("search", HttpMethod::GET)]
#[CollectionFlow(
    target: "user/{id}/profile",
    source: "results",
    columnName: "username" // Maps $results[]['username'] to {id}
)]
public function search(): Json {
    return new Json([
        "results" => $this->userService->findMany(...)
    ]);
}
```

#### Concatenated indexes operation

Rather than forwarding each property one after the other, this operation extracts them and bundles them into a single string sent to their route handler.

```php

#[CollectionFlow(
    target: 'special-books',
    source: 'data',
    operation: CollectionFlowOperation::AS_ONE,
    columnName: 'id'
)]
```

Doing so would populate `Suphle\Routing\Structures\RouteInfo` with a pluralized version of the property. Thus, where the previous dataset allowed us extract IDs, the "special-books" endpoint will receive an "ids" key in its `RouteInfo`. The model builder in that subsequent request can then do,

```php

return $this->blankModel->whereIn(explode(

	$this->routeInfo->getSegmentValue("ids")
));
```

Or, use any other way deemed suitable.

#### Contrasting indexes operation

This operation extracts and forwards only indexes at the extremes of a collection, making it feasible for only numeric nodes.

The `routeInfo` would contain the keys "min" and "max" each pointing to their respective values from the preceding payload. Where this is not desired, key names can be customized using the `rangeContext` parameter like so,

```php
use Suphle\Flows\Structures\RangeContext;

#[CollectionFlow(
    target: 'isbn/between',
    source: 'data',
    operation: CollectionFlowOperation::RANGE,
    rangeContext: new RangeContext('min', 'max')
)]
```

The `Range` mode has a specialized cousin for date comparison of fields.

```php

#[CollectionFlow(
    target: 'isbn/between',
    source: 'data',
    operation: CollectionFlowOperation::RANGE,
    rangeContext: new RangeContext('highest', 'lowest', isDateMode: true)
)]
```

## Activating flows

Flows are not implemented as [middleware](/docs/v2/middleware) so we can short-circuit routing altogether (during the subsequent request), which middleware depends on. Suphle determines whether requests should be evaluated for Flow eligibility using the `Suphle\Contracts\Config\Flows` config interface. Since no Flow definitions are present on module installation, this feature is turned off. To enable it, the `isEnabled` method of this [config's implementation](/docs/v2/container#Config-interfaces) is expected to return true.

```php

use Suphle\Config\DefaultFlowConfig;

class FlowMock extends DefaultFlowConfig {

	/**
	 * {@inheritdoc}
	*/
	public function isEnabled ():bool {

		return true;
	}
}
```

## Configuring flows

This refers to handles that allow us control how long or how much a flow can be accessed before it's deemed ineligible for access. When these conditions are met for a Flow-handled path or resource, it's being cleared from the cache. However, note that only the accessed content is cleared. Other cached items in the series remain intact until their own configuration sees to their exit.

### Expiring Flows

We use the `ttl` parameter to determine how long we want the resource to be stored. When the time elapses, request will skip the Flow handler and revert to the organic method of user request handling.

```php

#[CollectionFlow(
    target: 'books/{id}',
    source: 'data',
    operation: CollectionFlowOperation::PIPE_TO,
    ttl: 'PT5M'
)]
```

The `ttl` parameter accepts a DateInterval string. Timeout for cached resources should coincide with how often content is updated, and should fall within the a reasonably short time it should take user to request one of them. Default timeout for all resources is 10 minutes.

### Limiting access by hits

This Flow invalidation method determines how many times a resource should be accessed before thrown out of the cache.

```php

#[CollectionFlow(
    target: 'books/{id}',
    source: 'data',
    operation: CollectionFlowOperation::PIPE_TO,
    maxHits: 3
)]
```

Its default value is 1.

## Flow usage considerations

### HTTP method compatibility

Only GET routes are eligible for Flow handling. Aside the fact that we'll be making multiple assumptive database alterations, requests to those other HTTP methods require validation.

### Action methods with side-effects

Side effects are actions that leave external platforms they interact with in a different state after their execution. An external platform could be a database or filesystem. Without Flows, it's safe to leave in the side effects in your route handlers. Otherwise, those actions will be executed each time the Flow was decribed to.

When a user actually sends a request for a URL stored by the Flows component, Suphle [will emit](/docs/v2/events) the route handler as an event on behalf of the route's coordinator. Side effects should be extracted into this event's handler.

```php

$this->local(CatalogCoordinator::class, CatalogSideEffects::class)
			
->on( "getSingleBook", "logBookFetch" );
```

### Authenticated resources

Since Flow requests are preemptively initiated, there's neither user detail nor payloads to read from within that Flow context. The only way to maintain the integrity of authenticated content is to store the identifier behind the preceding request, along with their authentication mechanism. These details will both be used during the *fake* request, and for comparison when user returns to read one of the stored responses waiting for them.

So far, this would cause your application to behave as you'd expect, without consequence to the presence of Flows. There is but one slight inconvenience: Due to the manner resources are being stored (for quick lookup), each URL pattern can only be apportioned one authentication mechanism. If for any of the follow reasons:

- Route mirroring
- URL leading on to a Flow request is visible to originators using different authentication mechanisms
- Any other similar scenario

The mechanism used by the first user will determine what mechanism is used for that URL pattern. Suppose our hypothetical author is viewing his catalogue from a browser, Suphle will have to determine whether he's authorized to view any of those items at that moment using the `SessionStorage` mechanism (or whichever is connected on your RouteCollection). A fan of his simultaneously surfing our app can equally have a dynamic catalog under the same URL pattern cached for him, but only under the condition that he's authenticated by the same authentication method.

```php

#[CollectionFlow(
    target: 'books/{id}',
    source: 'data',
    operation: CollectionFlowOperation::PIPE_TO
)] // all visitors to this pattern must conform to the mechanism used by the first request to it
```

### Database precaution

One fear while making use of Flows, especially with handlers like the [ iterative one](#Iterative-operation), is running the risk of DDOS-sing the database since you may be firing more queries than ordinarily necessary. If you find yourself using this handler a lot, and you're on the Eloquent adapter, it can help if your database connection credentials specifies unique configuration for read and write. Otherwise, it's recommended that you look into other ORMs like Cycle and Hyperf instead, as they'll permit you fire concurrent queries to the database.

## Testing flows

The `Suphle\Testing\Condiments\QueueInterceptor` trait contains some verifications regarding Flow-based expectations, either during core Suphle development or while practising TDD. While testing the Flow feature, you would likely want your database integrated and seeded. Since both traits responsible for these operations are initialized from their `setUp` methods, the conflict will have to be resolved from your test class, with the database trait taking precedence. The most minimal combination of both will look like this:

```php

use Suphle\Hydration\Container;

use Suphle\Testing\Condiments\{QueueInterceptor, BaseDatabasePopulator};

use Suphle\Testing\TestTypes\ModuleLevelTest;

use Suphle\Tests\Mocks\Models\Eloquent\User as EloquentUser;

use Suphle\Tests\Mocks\Modules\ModuleOne\Meta\ModuleOneDescriptor;

class SomeFlowTest extends ModuleLevelTest {

	use QueueInterceptor, BaseDatabasePopulator {

		BaseDatabasePopulator::setUp as databaseAllSetup;
	}

	protected function setUp ():void {

		$this->databaseAllSetup();

		$this->catchQueuedTasks();
	}

	protected function getActiveEntity ():string {

		return EloquentUser::class; // assumes this is the model used by coordinator handler
	}

	protected function getModules ():array {

		return [new ModuleOneDescriptor(new Container)];
	}
}
```

### assertPushedToFlow

This method allows us confirm whether visiting a given URL does trigger hydration of sub-resources in the Flow context.

```php

#[CollectionFlow(
    target: 'books/{id}',
    source: 'data',
    operation: CollectionFlowOperation::PIPE_TO
)]
public function getCatalog(CatalogPayload $payload): Json
{
    return new Json([
        'data' => $this->catalogService->getItems($payload->getDomainObject())
    ]);
}
```

```php

public function test_visiting_catalog_initializes_flow () {

	$this->assertPushedToFlow("/catalog/1234");
}
```

No reference to destination request is held, thus we don't offer this level of specificity for this assertion method. It equally has the inverse method, `assertNotPushedToFlow`.

### assertHandledByFlow

We use this method to determine a URL has been successfully initialized by a preceding one and handled by the Flow component. This method is inversed by the `assertNotHandledByFlow` assertion.

```php
		
public function test_user_will_read_flowSaved_book () {

	// given
	$this->actingAs($authorInstance);

	$this->get("/catalog/1234");

	$this->processQueuedTasks(); // when

	$this->assertHandledByFlow("/books/5678"); // then
}
```

In the sample, we slipped in a call to `actingAs`. This is not strictly necessary for Flow requests. However, recall that Flow stored resources are accessible only to the user who originated them, or to guests, for unprotected routes. If there's book recommendation logic at "books/id", the assertion `assertHandledByFlow` will fail unless incoming user and mechanism match that which Flow was triggered by.