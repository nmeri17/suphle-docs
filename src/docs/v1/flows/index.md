## Introduction

In a nutshell, Flows are performance-enhancing preemptive caches. It differs from traditional caching in the sense that the latter requires an initial user to warm the cache of that particular content. This drawback implies it's not applicable to applications where that next visit should be unique, or appear dynamic in nature e.g. reshuffling the recommended section of a product. Flows tend to salvage these constraints by caching the request for that user even before they make it.

For instance, suppose an author or artiste's online catalog is visited, Flows would anticipate user's next request will definitely be to one of books in this collection, loads them ahead of time into the cache, thereby creating the illusion of a static site. Due to their inherently temporary nature, they aren't updated when their original content changes on the database.

## Describing a flow

Flows are written in [route collections](/docs/v1/routing). Each flow is connected to its originating route definition. Continuing with our analogy above, Flows to the books pattern would be defined in the catalog route as follows:

```php

use Suphle\Routing\BaseCollection;

use Suphle\Response\Format\Json;

use Suphle\Flows\ControllerFlows;

use Suphle\Tests\Mocks\Modules\ModuleOne\Coordinators\CatalogCoordinator;

class CatalogCollection extends BaseCollection {

	public function _handlingClass ():string {

		return CatalogCoordinator::class;
	}

	public function _prefixCurrent ():string {

		return "catalog";
	}

	public function id () {

		$renderer = new Json("getCatalog");

		$flow = new ControllerFlows;

		$flow->linksTo("books/id", $flow->previousResponse()

			->collectionNode("data")->pipeTo()
		);

		$this->_get($renderer->setFlow($flow));
	}
}
```

Suppose our coordinator returns the following payload:

```php

class CatalogCoordinator extends ServiceCoordinator {

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

$flow->linksTo("resource/id", $flow->previousResponse()

	->collectionNode("store.id")->setFromService($serviceContext)
)
```

Each handler method returns an instance of the flow type for fluent chaining/operation piping, although handler methods at your disposal will likely deliver for most use cases.

### Handling single nodes

Access to a node holding a single value is obtained using the `getNode` method.

```php

$flow->previousResponse()->getNode("node_name")
```

Once this node is retrieved, we have to instruct Flows on how to prepare it for subsequent requests by attaching single-node based operations to it. The following operations are available for this Flow category:

#### Query updating operation

This sort of operation is useful when the preceding response is the result of running an incremental query. It is implied that slightly modifying the query will return another dataset. This functionality can be illustrated using a paginated endpoint. The payload would typically contain the actual data, along with meta information regarding what query and parameter to modify in order to load the next page. We can then use Flows to load that next request in the background:

```php

public function id () {

	$renderer = new Json("showProduct");

	$flow = new ControllerFlows;

	$flow->linksTo("/products/recommended", $flow

		->previousResponse()->getNode("next_page_url")

		->altersQuery()
	);

	$this->_get($renderer->setFlow($flow));
};
```

The query at given node is extracted and hydrated into `Suphle\Request\PayloadStorage` for you. Thus, app will treat it just as an organic request to that endpoint with those query parameters.

### Handling collection nodes

Access to a node with data that can be either further manipulated or filtered into an operation is obtained using the `collectionNode` method.

```php

$flow->previousResponse()->collectionNode("node_name")
```

`collectionNode` takes an optional 2nd argument referring to what property on each collection item to work with. We saw in an earlier example, IDs of each item were extracted and forwarded to the application. To extract some other property, we'll use the `columnName` parameter as follows:

```php

$flow->linksTo("books/id", $flow->previousResponse()

	->collectionNode("data", "name")->pipeTo()
);
```

This will cause the name of each book to be forwarded to "books/id". Operations under this category will populate `Suphle\Routing\PathPlaceholders` for subsequent requests, on a matching key.

```php

$this->pathPlaceholders->getSegmentValue("name");
```
Where absent, this argument will fallback to the "id" property.

The following operations are available for collection-based Flows:

#### Iterative operation

This sort of operation extracts and forwards the given property from each item in previous payload to their route handler.

```php

$flow->linksTo("books/id", $flow->previousResponse()

	->collectionNode("data")->pipeTo()
);
```

#### Concatenated indexes operation

Rather than forwarding each property one after the other, this operation extracts them and bundles them into a single string sent to their route handler.

```php

$flow->linksTo("special-books", $flow->previousResponse()

	->collectionNode("data")->asOne()
);
```

Doing so would populate `Suphle\Routing\PathPlaceholders` with a pluralized version of the property. Thus, where the previous dataset allowed us extract IDs, the "special-books" endpoint will receive an "ids" key in its `PathPlaceholders`. The model builder in that subsequent request can then do,

```php

return $this->blankModel->whereIn(explode(

	$this->pathPlaceholders->getSegmentValue("ids")
));
```

Or, use any other way deemed suitable.

#### Contrasting indexes operation

This operation extracts and forwards only indexes at the extremes of a collection, making it feasible for only numeric nodes.

```php

$flow->linksTo("isbn/between", $flow->previousResponse()

	->collectionNode("data")->inRange()
);
```

The `pathPlaceholders` would contain the keys "min" and "max" each pointing to their respective values from the preceding payload. Where this is not desired, key names can be customized using `Suphle\Flows\Structures\RangeContext` object like so,

```php

$flow->linksTo("isbn/between", $flow->previousResponse()

	->collectionNode("data")->inRange(new RangeContext(

		"highest", "lowest"
	))
);
```

The `inRange` method has a specialized cousin, `dateRange`, for date comparison of fields.

#### Custom collection operation

The `setFromService` method allows the developer connect a service/class that primes the outgoing payload as desired.

```php

public function id () {

	$renderer = new Json("handleFromService");

	$flow = new ControllerFlows;

	$serviceContext = new ServiceContext(FlowService::class, "customHandlePrevious");

	$flow->linksTo("segment", $flow->previousResponse()

		->collectionNode("data")

		->setFromService($serviceContext)

		->inRange()
	);

	$this->_get($renderer->setFlow($flow));
}
```

`customHandlePrevious` will receive payload verbatim and is expected to return another iterable that would then be treated as previous response. This new iterable can either be returned directly on the subsequent request, or piped to any of the other collection-based operations. Above, it is shown being piped to `inRange`.

```php

class FlowService {

	public function customHandlePrevious ( $payload):iterable {

		return array_map(function ($model) {

			return $model->id * 2;

		}, $payload["data"]);
	}
}
```

## Activating flows

Flows are not implemented as [middleware](/docs/v1/middleware) so we can short-circuit routing altogether (during the subsequent request), which middleware depends on. Suphle determines whether requests should be evaluated for Flow eligibility using the `Suphle\Contracts\Config\Flows` config interface. Since no Flow definitions are present on module installation, this feature is turned off. To enable it, the `isEnabled` method of this [config's implementation](/docs/v1/container#Config-interfaces) is expected to return true.

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

We use the `setTTL` method to determine how long we want the resource to be stored. When the time elapses, request will skip the Flow handler and revert to the organic method of user request handling.

```php

$flow->linksTo("books/id", $flow->previousResponse()

	->collectionNode("data")->pipeTo()->setTTL(function ($userId, $pattern) {

		if ($pattern == "books/15") $timeout = new DateInterval("PT3M");

		else $timeout = new DateInterval("PT5M");

		return (new DateTime)->add($timeout);
	})
);
```

`setTTL` takes a callback that receives incoming user ID and the actual path being requested. Resources requested by a guest would be denoted by the special user ID `Suphle\Flows\OuterFlowWrapper::ALL_USERS`. These arguments allow for most fine-grained control over every endpoint response stored in the cache. Timeout for cached resources should coincide with how often content is updated, and should fall within the a reasonably short time it should take user to request one of them. Default timeout for all resources is 10 minutes.

Above, `setTTL` is applied to a collection node, but it is equally compatible with other Flow categories. Flow expiration takes precedence over other methods.

### Limiting access by hits

This Flow invalidation method determines how many times a resource should be accessed before thrown out of the cache.

```php

$flow->linksTo("books/id", $flow->previousResponse()

	->collectionNode("data")->pipeTo()->setMaxHits(function ($userId, $pattern) {

		return 3;
	})
);
```

Its default value is 1.

## Flow usage considerations

### HTTP method compatibility

Only GET routes are eligible for Flow handling. Aside the fact that we'll be making multiple assumptive database alterations, requests to those other HTTP methods require validation.

### Action methods with side-effects

Side effects are actions that leave external platforms they interact with in a different state after their execution. An external platform could be a database or filesystem. Without Flows, it's safe to leave in the side effects in your route handlers. Otherwise, those actions will be executed each time the Flow was decribed to.

When a user actually sends a request for a URL stored by the Flows component, Suphle [will emit](/docs/v1/events) the route handler as an event on behalf of the route's coordinator. Side effects should be extracted into this event's handler.

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

$flow->linksTo("books/id", $flow->previousResponse() // all visitors to this pattern must conform to the mechanism used by the first request to it

	->collectionNode("data")->pipeTo()
);
```

### Database precaution

One fear while making use of Flows, especially with handlers like the [ iterative one](#Iterative-operation), is running the risk of DDOS-sing the database since you may be firing more queries than ordinarily necessary. If you find yourself using this handler a lot, and you're on the Eloquent adapter, it can help if your database connection credentials specifies unique configuration for read and write. Otherwise, it's recommended that you look into other ORMs like Cycle and Hyperf instead, as they'll permit you fire concurrent queries to the database.

## Testing flows

The `Suphle\Testing\Condiments\QueueInterceptor` trait contains some verifications regarding Flow-based expectations, either during core Suphle development or while practising TDD. While testing the Flow feature, you would likely want your database integrated and seeded. Since both traits responsible for these operations are initialized from their `setUp` methods, the conflict will have to be resolved from your test class, with the database trait taking precedence. The most minimal combination of both will look like this:

```php

use Suphle\Hydration\Container;

use Suphle\Testing\Condiments\{QueueInterceptor, BaseDatabasePopulator};

use Suphle\Testing\TestTypes\ModuleLevelTest;

use Suphle\Tests\Integration\Modules\ModuleDescriptor\DescriptorCollection;

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

	protected function preDatabaseFreeze ():void {

		$this->replicator->modifyInsertion(10);
	}
}
```

### assertPushedToFlow

This method allows us confirm whether visiting a given URL does trigger hydration of sub-resources in the Flow context.

```php

public function id () {

	$renderer = new Json("getCatalog");

	$flow = new ControllerFlows;

	$flow->linksTo("books/id", $flow->previousResponse()

		->collectionNode("data")->pipeTo()
	);

	$this->_get($renderer->setFlow($flow));
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