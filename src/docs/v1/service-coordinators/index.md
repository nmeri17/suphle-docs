## Introduction

Just to clear any possible confusion, this component represents what is known as controllers in back-end MVC architectures. They're identified as service coordinators because their function is more opinionated than MVC's controllers. The freedom those controllers confer make them very easy to misuse. Thus, service coordinators restrain the amount of responsibility you'll demand of them.

Probably the most common theme of this component is to centralize things as much as possible. In your software, you're likely to check whether an account is restricted before performing actions. You want to check whether user has an active subscription before accessing certain services. A common trope engages the use of middleware. Conceptually speaking, this is wrong, since both examples are inherently authoritative in nature. They should be dealt with [in that layer](/docs/v1/authorization). An even worse solution often seen in codebases is manually checking the condition for each action that should be protected by it. By "centralize", what you're adviced to do is to move that condition to the source. Delegate it to an intermediary and use that as source rather than the entity itself.

The caller shouldn't be responsible for that check, as it's easy to forget. This isn't limited to conditionals. It equally applies to adding a clause to a query. These points are raised here since there's a limit to how much Suphle can interfer with the domain layer.

To summarize, any action expected to precede another should be abstracted as high as realistically required business wise, without callers concerning themselves with it. Candidates for centralization are validation, model hydration, conditionals, business logic. Actions preceding model operations should be hook into its [lifecycle methods](/docs/v1/authorization#Model-based-authorization). The solitary purpose of a service coordinator is to serve as conduit or juncture between these central points.

## Creating a service coordinator

Candidates for centralization listed are not vague concepts we expect you to religiously adhere to. Suphle provides a class that enforces this obedience automatically, inferring behavior from incoming request type. This means service coordinators will either complain bitterly or simply not work without those candidates. All service coordinators are expected to extend `Suphle\Services\ServiceCoordinator`, and are activated by connecting them through a route collection.

```php

use Suphle\Routing\{BaseCollection, Decorators\HandlingCoordinator};

use Suphle\Response\Format\Json;

use Suphle\Tests\Mocks\Modules\ModuleOne\Controllers\BaseCoordinator;

#[HandlingCoordinator(BaseCoordinator::class)]
class BrowserNoPrefix extends BaseCollection {

	public function SEGMENT() {

		$this->_httpGet(new Json("plainSegment"));
	}
}
```

After this, we have to define the coordinating or action method on the service coordinator.

```php

use Suphle\Services\ServiceCoordinator;

class BaseCoordinator extends ServiceCoordinator {

	public function plainSegment () {

		return ["message" => "plain Segment"];
	}
}
```

The most simplistic service coordinator, such as the one defined above, will return a self contained response. It is this response that will be attached as response body of the `Json` renderer declared in the route collection.

In the real world, however, it's pertinent that input is validated, before utilizing it in sensitive areas such as our internal, trusted DTO, or a service with unrestricted access to the database. We'll look at the designated location for these roles below, starting with validation.

## Validating incoming requests

Before intercepting values from our users, it's important to shield the precious domain layer from receiving unexpected values. This step is only optional for GET requests. Every other request type working with user input is subject to being validated. While it may seem daunting to create validators for each non-GET path, recall that software crumbles when its user is allowed to do unexpected things. It always pays off when their every move is anticipated in the sandbox of a validator.

### Linking validators to request handler

For HTTP methods where validators are compulsory, if no validator aggregate or matching method is found, a `Suphle\Exception\Explosives\DevError\NoCompatibleValidator` exception is thrown, which in turn, is a sub-class of the famous [Suphle\\Contracts\\Exception\\BroadcastableException](/docs/v1/exception/#programmer-level-exceptions).

Our validations thus need to meet the following objectives:

- Co-location with the action method they oversee since this is only entity they're relevant to.
- Reside outside the action method to avoid cluttering actual service calls.
- Remain visible to the Framework such that their absence can duly prevent action method invocation.

One of the constructs that allows us meet us these requirements is the `Suphle\Services\Decorators\ValidationRules` attribute, where validation rules can be defined.

```php

class ValidatorCoordinator extends ServiceCoordinator {

	#[ValidationRules([

		"foo_field" => "required",
		"bar_field" => "email"
	])]
	public function postWithValidator (CartBuilder $cartBuilder) {

		//
	}
}
```

Validation rules are bound to the action handlers rather than the builders or database models since not all requests using the same model are qualified by the presence of the same fields or validation rules.

### Validator adapters

Suphle employs an agnostic approach to underlying validator. This means the rules are merely expected to conform to whatever active, compatible validation library is connected under the hood. The default library in use is that of Illuminate. This makes all rules defined on [that doc](https://laravel.com/docs/8.x/validation#available-validation-rules) equally applicable in Suphle. To gain access to a rule collection you're more conversant with, you want to replace this default with another library by implementing the `Suphle\Contracts\Requests\RequestValidator` interface and connecting it as an [interface loader](/docs/v1/container#interface-loaders).

```php
namespace Suphle\Contracts\Requests;

interface RequestValidator {

	public function validate (array $parameters, array $rules):void;

	public function getErrors ():iterable;
}
```

### Validation failure

As expected, when incoming request is unable to satisfy rules bound to a handler, the handler is not executed. As with all exceptions, the output of a validation failure is [determined by](/docs/v1/exceptions#Exception-diffusers) its diffuser. Requests matching the API configuration will parse any renderer connected to the incoming route, usually expected to be the `JSON` renderer. Other situations are anticipated to originate from the browser, however, the behavior will vary depending on the validation evaluator configured.

The default evaluator will perform the equivalent of using the `Reload` renderer, but in addition, it will include two keys in your payload serialized by the preceding request being handled. This combination is then received by your presentation layer. If you want to adulterate it with extra content, the `ValidationFailureDiffuser::prepareRendererData` method is what is used as the action handler for all failed requests. You can override and bind a descendant with choice objects.

#### Checking for validation errors

When flow is reverted to previous renderer, you want to ascertain whether the arrival is the original `GET` request or as a result of validation failure redirect. The default evaluator adds a key corresponding to the constant `Suphle\Exception\Diffusers\ValidationFailureDiffuser::ERRORS_PRESENCE`, or the literal value `"validation_errors"`.

#### Restoring request data

After confirming it's a re-render, it's not desirable UX to empty the form inputs altogether. Instead, it should be populated using data sent during last request. This value is to be obtained using the `ValidationFailureDiffuser::PAYLOAD_KEY` constant, or the literal equivalent, `"payload_storage"`:

## Retrieving request input

After validation, authentication and authorization, it can be considered safe to send incoming input to our services. In just about any back-end framework you're familiar with, there's a way to translate payload into strong typed request objects -- all but in Suphle; which should come as a surprise, since one of our foremost philosophies is typing everything. There are a few reason for this:

1. Such objects are single use.

1. The type doesn't bear much meaning to the domain or serve any purpose beside transferring data to the service doing the actual work.

1. In applications doing more complex work than bland CRUD, simply type-hinting the model obstructs us from streamlining the query.

There is but one justification for strongly typed request objects: validation. However, the fact that proper or complete validation in those languages is usually aided by decorators and annotations, replacing them with [string-based rules](#linking-validators-to-request-handler) seems like a pragmatic compromise.

Suphle provides strongly typed objects, namely, `Suphle\Services\Structures\ModelfulPayload` and `Suphle\Services\Structures\ModellessPayload`. They escape the traps listed above, while making provision for specialized handling of the distinct kinds of user input.

### Model-based request type

We use this whenever there's direct correlation between segments on the URL or incoming payload, and database models. The objective is not to ostracize model hydration or represent request fields with object properties, but to centralize the location for optimizing model queries according to controller constraints at each endpoint.

```php

class BaseCoordinator extends ServiceCoordinator {

	public function getActiveProducts (BaseProductBuilder $productBuilder):iterable {

		return [

			"products" => $this->productRepository->getAboveInvalidValue($productBuilder)
		];
	}
}
```

```php

use Suphle\Services\Structures\ModelfulPayload;

class BaseProductBuilder extends ModelfulPayload {

	public function __construct (protected readonly Product $blankProduct) {

		//
	}

	protected function getBaseCriteria ():object {

		return $this->blankProduct->where([

			"id" => $this->pathPlaceholders->getSegmentValue("id")
		]);
	}
}
```

```php

class ProductRepository extends UpdatelessService {

	const PRICE_MIN = 250;

	public function getAboveInvalidValue (Product $builtProduct):Collection {

		return $builtProduct->where([

			["price", ">", self::PRICE_MIN]
		])->get();
	}
}
```

If we focus on our coordinator, there are a few things to observe:

- Aside the fact that it visually looks cleaner than dumping everything there,
- Fetches are lazier and under caller's control, giving room for extended query clauses.
- We avoided duplicating builders across request objects.
- Coordinator doesn't mingle into implementation details of the payload.

#### Builder selects

Segregating base builders from the Coordinator is great, but mostly gets rid of design-based impediments. Before handing builders over to the endpoints, we want to apply constraints for performant queries consuming lesser memory, view clients receiving only relevant columns, lighter response payloads, etc. We do this using the `ModelfulPayload::onlyFields` method. By default, it'll only return the *id* and *name* columns. Builders for models and callers where this does not apply can override this method as desired:

```php

class BaseProductBuilder extends ModelfulPayload {

	public function __construct (protected readonly Product $blankProduct) {

		//
	}

	protected function getBaseCriteria ():object {

		return $this->blankProduct->where([

			"id" => $this->pathPlaceholders->getSegmentValue("id")
		]);
	}

	protected function onlyFields ():array {

		return ["id", "price", "description"];
	}
}
```

For more stringent fetching, model relationships should not be exempt from trimming off irrelevant fields. Filter clauses can either be set inside relationship definition or injected into relationship method by the caller.

### Non-model-based request type

Almost every other incoming payload not interacting with a model falls into this bracket. Specialized services for handling these are treated in greater detail in their respective chapters. But the base payload reader is `Suphle\Services\Structures\ModellessPayload`. The domain services shouldn't be dragged into extracting relevant information from the payload. Thus, we use this class as crutch for creating objects matching our DSL.

```php

class ExtractsName extends ModellessPayload {

	protected function convertToDomainObject () {

		return new ForeignUserDSL(

			$this->payloadStorage->getKey("data")["name"]
		);
	}
}
```

```php
class BaseCoordinator extends ServiceCoordinator {

	public function computeForeignerDetail (ExtractsName $payloadReader):array {

		return [

			"data" => $this->foreignerService->computeDetail(

				$payloadReader->getDomainObject()
			)
		];
	}
}
```

In practise, you'll likely require mapping to more fields than one, and would require a more robust mapping library such as [Valinor](https://github.com/cuyz/valinor).

Aside handling requests that don't map to models/entities, `ModellessPayload` is useful for things like callback endpoints where a user is waiting for feedback on our end, but obviously not on the automated, calling service's end. In such cases, mere validation errors won't cut it. We need to respond to the waiting services with something to complete user flow. For this reason, it requires safe and [user friendly data conversion](#normalizing-incoming-data).

Do be aware that this input reader type doesn't cover image upload. For that sort of payload, please see [its designated chapter](/docs/v1/image-upload). 

## Permitted dependencies

In order to keep our Coordinators lean, cohesive and disciplined, they have a narrow list of dependencies that can be injected into their constructors. Their every dependency must either be a sub-class from this list or should exist in its designated layer. Permitted classes are:

- `Suphle\Contracts\Modules\ControllerModule`

- `Suphle\IO\Http\BaseHttpRequest`

- `Suphle\Request\PayloadStorage`

- `Suphle\Services\ConditionalFactory`

- `Suphle\Services\UpdatefulService` and `Suphle\Services\UpdatelessService`

- `Suphle\Contracts\IO\Session`,

- `Suphle\Security\CSRF\CsrfGenerator`

Attempting to inject a dependency outside this list will throw a `Suphle\Exception\Explosives\DevError\UnacceptableDependency` exception and prevent app server from being built. Details about each class is treated in its appropriate section.

Action methods can only type-hint arguments extending `Suphle\Services\Structures\ModelfulPayload` and `Suphle\Services\Structures\ModellessPayload`. This is because any other service we want to inject will likely be applicable to other endpoints on this coordinator and should be injected through the constructor. Violating this rule will throw an `InvalidArgumentsException` while equally preventing app server from being built.

## Securing POST requests

You may already be aware of the famous CSRF [middleware](/docs/v1/middlewares) customary for non-GET requests. In Suphle, this alone is not enough -- it's mandatory for such endpoints to use services that [facilitate such operations](#mutative-database-decorators), by injecting at least one service decorated with either `Suphle\Contracts\Services\Decorators\SystemModelEdit` or `Suphle\Contracts\Services\Decorators\MultiUserModelEdit`. Failure to adhere to this will throw a `Suphle\Exception\Explosives\DevError\MissingPostDecorator` runtime exception.

## Coordinator services

When we advocate extraction of endpoint behaviour into service classes, what is our end goal? The Coordinators are themselves, classes. Why are they restricted from housing logic?

You may expect to see testability leading the pack as one of the reasons. In traditional controllers, action methods return full blown response objects. You will hardly test the methods without constructing a request and testing response object returned. This problem doesn't exist in Suphle. Some argue that it's difficult to test IO operations with doubles. Fair enough; although stubbing database calls out is unnecessary.

However, there are other concerns that make it imperative for logic to be abstracted away:

1. **Reuse:**
Your logic may be used by other endpoints, services, modules. You want them to exist in a fluid, atomic state, free of unwanted dependencies. You want to reliably test the individual nodes your response payloads aggregate. Bear in mind that prioritising the service layer is not an invitation to delegate your entire calls to them. That way, we will still end up with fat services, essentially repeating the same structure we claim to run away from by converting what should be value pipes into bloated controllers. The ideology here is to recognize and extract recurring patterns or behaviour into atomic methods. This makes them flexible for reuse and testing. The onus of achieving this recognition ultimately lies in developer's hands.

1. **Replaceablility:**
Arguably the most important. Applications evolve. And when they do, you don't want to stand the [risk of breaking things](/docs/v1/testing/confidently-integrating-upgrades.md). You want to develop and test the next step of the evolution before it's connected through the Coordinator.

1. **Controllers are god classes:**
They're not the kind of object you want to be moving around everywhere. They contain diverse functionality that isn't relevant to all requests.

1. Suphle service types enable us define application-level constraints. Services should be simple POPOs, but there is a high-level category every service can possibly belong into. This dichotomy is known as service types.

### Service types

Conceptually, there is a difference between services that update the database and those that don't. All service classes are expected to extend of them.

#### Pure services

This can refer to anything from business logic to database fetch queries. In Suphle, this semantic is represented by the class `Suphle\Services\UpdatelessService`.

#### Database mutating services

Services causing database side-effects should extend `Suphle\Services\UpdatefulService`. Regardless of their unique detail, there are basic practices that should be observed on such services:

1. All its public methods should be run within database transactions.
1. It shouldn't be invoked directly unless it returns a value that should be used within calling scope. Otherwise, it should be triggered as an [event handler](/docs/v1/events).

Suphle provides sub-decorators that make light work of the common kinds of database transactions, to avoid continuous boilerplate of manual implementation. These sub-decorators are being examined [later in this](#mutative-database-decorators) chapter.

## Condition factories

We often have blobs of conditionals comparing variables to decide on business logic to execute. These conditionals and their code blocks can often grow to enormous proportions, making them difficult to change, test, sometimes overshadowing the rest of the code meant to work with the result of this conditional. For this reason, we need to standardize design of this procedure by abstracting it away, for the caller and reader to concentrate on invocation and a possible result alone.

### Defining condition factories

We do this by extending `Suphle\Services\ConditionalFactory` class. An example of such factory would have this signature:

```php

use Suphle\Tests\Mocks\Modules\ModuleOne\Interfaces\GreaterFields;

use Suphle\Tests\Mocks\Modules\ModuleOne\Concretes\Services\ConditionalHandlers\{FieldBGreater, FieldAGreater, BothFieldsEqual};

class ConditionalFactoryMock extends ConditionalFactory {

	protected function manufacturerMethod ():string {

		return "greatestFields";
	}

	protected function greatestFields (int $fieldA, int $fieldB, int $fieldC):void {

		$this->whenCase($this->caseACondition(...), FieldAGreater::class, $fieldA, $fieldB)

		->whenCase($this->caseBCondition(...), FieldBGreater::class, $fieldB, $fieldA)

		->finally( BothFieldsEqual::class, $fieldC);
	}

	protected function getInterface ():string {

		return GreaterFields::class;
	}

	public function caseACondition (int $fieldA, int $fieldB):bool {

		return $fieldA > $fieldB;
	}

	public function caseBCondition (int $fieldB, int $fieldA):bool {

		return $fieldB > $fieldA;
	}
}
```

Our conditions are extracted into the methods `caseACondition` and `caseBCondition`. Domains requiring this factory will most likely involve more complex comparisons, but for the purpose of this illustration, they are oversimplified.

The conditions are then aggregated a domain-specific `greatestFields` method, injecting use-cases with `ConditionalFactory::whenCase` and `ConditionalFactory::finally`. These methods receive an arbitrary number of arguments necessary for the comparison. When universal or not unique to the caller, these arguments should be injected through `ConditionalFactory::__construct`.

Each condition's body is defined in a class implementing the contract defined in `ConditionalFactory::getInterface`. This decouples the conditions from the code blocks they're purported to execute:

```php
interface GreaterFields {

	public function plow ();
}
```

```php
use Suphle\Tests\Mocks\Modules\ModuleOne\Interfaces\GreaterFields;

class FieldAGreater implements GreaterFields {

	public function plow () {}
}
```

### Consuming conditional factories

With implementation details of the conditional obscured, the service or Coordinator is free to invoke `ConditionalFactory::retrieveConcrete` like so:

```php

use Suphle\Request\PayloadStorage;

use Suphle\Tests\Mocks\Modules\ModuleOne\Concretes\Services\ConditionalFactoryMock;

class BaseCoordinator extends ServiceCoordinator {

	public function __construct (
		protected readonly ConditionalFactoryMock $factory,

		protected readonly PayloadStorage $payloadStorage
	) {

		//
	}

	public function doGreaterThing () {

		$plowValue = $this->greaterFieldFactory->retrieveConcrete(

			$this->payloadStorage->getKey("fieldA"),

			$this->payloadStorage->getKey("fieldB"),

			$this->payloadStorage->getKey("fieldC")
		)->plow();
	}
}
```

## Service decorators

Service [decorators](/docs/v1/container#object-decoration) are utilities applied either to Coordinators or available for the developer to apply to their own services. Their purpose is to promote diverse practises, from cross-cutting object design to intuitive UX with lowered developer friction.

### Auto service error handling

The current application error options are:

- Developer aims for >90% test coverage.
- Invocations beyond developer's control are wrapped in try-catch.

Some drawbacks with these options are:

- If some critical operation somehow fails in spite of its code coverage, developer will be unaware.
- Service consumers have to consciously check for errors.
- In the event of an error to a single data source, the rest of the response is terminated.

To solve these problems, Suphle provides a meta decorator `Suphle\Services\Decorators\InterceptsCalls`, that leads to more specific sub-decorators. Without additional arguments, this decorator will lead to the `Suphle\Contracts\Services\CallInterceptors\ServiceErrorCatcher` sub-decorator, and expects the decorated class to implement it. Among sub-decorators available, it's only necessary to implement one, as each higher-level sub-decorator relies on the handler for `ServiceErrorCatcher` to carry out its more streamlined duties.

In order to help with some boilerplate on consumers of this decorator, Suphle provides the trait `Suphle\Services\Structures\BaseErrorCatcherService`.

All failable actions within your action handlers, mutative ones especially, should be wrapped in the safety net of a class with this decorator or that of any of its descendants. That way, any unintended failure that occurs will be isolated to that invocation and that invocation alone, without corrupting or forcely terminating the request.

#### Substituting call result

When decorator handler encounters an error during execution of decorated service, instead of terminating request or responding to caller with empty hands, it first [forwards the exception](/docs/v1/exceptions#Broadcasting-exception-details), before deriving a value to resolve the original call with.

Fallback values for each method can be defined on `ServiceErrorCatcher::failureState` like so,

```php

use Suphle\Contracts\Services\CallInterceptors\ServiceErrorCatcher;

use Suphle\Services\{UpdatelessService, Structures\BaseErrorCatcherService, Decorators\InterceptsCalls};

#[InterceptsCalls]
class DatalessErrorThrower extends UpdatelessService implements ServiceErrorCatcher {

	use BaseErrorCatcherService;

	public function failureState (string $method) {

		if (in_array($method, [ "deliberateError", "deliberateException"]))

			return "Alternate value";
	}

	public function deliberateError ():string {

		trigger_error("error_msg");
	}

	public function deliberateException ():string {

		throw new Exception;
	}
}
```

Decorator handler will consult `ServiceErrorCatcher::failureState` on failure, requesting a return value for the original call to user-defined method. When no value is returned from this method, the handler will attempt to construct one for the caller, using method's type-hint as guide.

#### Identifying failed calls

A consumer of `DatalessErrorThrower` can comfortably call `deliberateError`. However, it may be necessary for the caller to distinguish between fallback and accurate results. For this, we can use `ServiceErrorCatcher::matchesErrorMethod` as a shorter alias for a `catch` block.

```php

$response = compact("service1Result");

$service2Result = $this->throwableService->getValue();

if ($this->throwableService->matchesErrorMethod("getValue"))

	$service2Result = $this->otherSource->alternateValue(); // perform some valid action

$response["service2Result"] = $service2Result;

return $response;
```

`matchesErrorMethod` always matches the last method that threw an exception on this service. Just as `failureState` is for the service to control its output on failure, `matchesErrorMethod` is for the consumer to determine what action to take on failure. But the idea is that the on no account would request terminate or result in an unplanned response.

#### Terminating exceptions by type

Some operations throw a predictable class of exceptions, even though we may be unable to tell when exactly they'll occur -- quite similar to the classes piled in multiple catch blocks. For instance, we may have a ORM call such as `find` or `findOrFail` that may legitimately terminate service call. When these exceptions are encountered, it may be unreasonable to continue handling the request altogether. Thus, they should be translated into one of the exceptions defined under the [exceptions config](/docs/v1/exceptions#connecting-exceptions).

```php

use Suphle\Exception\Explosives\NotFoundException;

class DatalessErrorThrower implements ServiceErrorCatcher {

	use BaseErrorCatcherService;

	public function rethrowAs ():array {

		return [
			OrmException::class => NotFoundException::class
		];
	}
}
```

`Suphle\Contracts\Services\CallInterceptors\ServiceErrorCatcher` can be summarized as an OOP wrapper for the classic `try-catch` programming construct but with lesser keystrokes, actual error reporting, not having to think about or enforce wrapping all calls to such services in a try-catch, etc.

#### Intercepting PHP 8 classes

##### Never return type

Since PHP doesn't have generics yet, return value for `ServiceErrorCatcher::failureState` is untyped. But for consistency, it should correspond to whatever type the erring method would've return on successful execution. This means such methods are prohibited from having `void` or PHP 8's `never` return type, as they will interfer with an alternate result being returned on its behalf.

##### Readonly modifier

When using this decorator, as well as all others that extend from it, if the class has constructor promoted properties, those properties cannot use the signature `protected readonly`. They can only be `private readonly`, or the `readonly` keyword removed if the `protected` visibility must be present. This happens because the proxifier will try to reset the properties when they're protected but will be unable to do so since they're readonly. When they're private, it uses those on the original class.

### Mutative database decorators

There is a narrow list of users authorized to update a database resource:

- The resource's owner(s).
- The software's developer.

Accordingly, all update queries must first confirm the updater matches resource owner. The service call (possibly housing multiple queries) ought to lock active rows accordingly, run under a database transaction, alert developer on error before rolling back the transaction. Remembering to do all this manually for each mutative service will quickly deteriorate into a nightmare. In order to avoid this conscious effort or boilerplate on the part of developer, Suphle provides decorators from which one must be applied on each `Suphle\Services\UpdatefulService`.

By using them, authorization level challenges common among user created resources within database layer are unable to propagate. The user type is what determines applicable decorator.

#### Programmatic updates

This refers to system-managed updates. Any update where the application is responsible for variables involved in database modification, or where it's not explicitly received from the user should be regarded as a programmatic update. Alterations in this category should decorate the service with `Suphle\Contracts\Services\Decorators\SystemModelEdit`. A decorated service will have the following signature:

```php

use Suphle\Services\{UpdatefulService, Structures\BaseErrorCatcherService};

use Suphle\Services\Decorators\{InterceptsCalls, VariableDependencies};

use Suphle\Contracts\{Events, Services\CallInterceptors\SystemModelEdit};

use Suphle\Events\EmitProxy;

#[InterceptsCalls(SystemModelEdit::class)]
#[VariableDependencies([

	"setPayloadStorage", "setPlaceholderStorage"
])]
class CheckoutCart extends UpdatefulService implements SystemModelEdit {

	use BaseErrorCatcherService, EmitProxy;

	public const EMPTIED_CART = "cart_empty";

	public function __construct (private readonly Events $eventManager) {

		//
	}

	public function updateModels (object $cartBuilder) {

		$cartBuilder->products()->update(["sold" => true]);

		$this->emitHelper (self::EMPTIED_CART, $cartBuilder); // received by payment, order modules etc

		return $cartBuilder->delete();
	}

	public function modelsToUpdate (object $cartBuilder):array {

		return $cartBuilder->products;
	}
}
```

`CheckoutProducts` will be consumed in a Coordinator like so:

```php

class CheckoutCoordinator extends ServiceCoordinator {

	public function __construct (protected readonly CheckoutCart $cartService) {

		//
	}

	public function previewCartProducts (CartBuilder $cartBuilder):array {

		return [

			"data" => $this->cartService->modelsToUpdate($cartBuilder)
		];
	}

	public function paymentGatewayHook (CartBuilder $cartBuilder):array {

		return [

			"message" => $this->cartService->updateModels($cartBuilder)
		];
	}
}
```

We use the `Suphle\Contracts\Services\CallInterceptors\SystemModelEdit::initializeUpdateModels` method to keep the service idempotent in-between both requests.

In addition to cohesion, co-locating update subjects beside the data source affords us the advantage of using a soft-lock on the elements from returned from `Suphle\Contracts\Services\CallInterceptors\SystemModelEdit::modelsToUpdate` in order to guarantee their integrity during the transaction.

The same options discussed in [Auto service error handling](#Auto-service-error-handling) are available for services with this decoration.

#### User-induced updates

This refers to updates directly influenced by user input. Resources maintained by single users don't have much to worry about this problem, but there is a delicate collision we risk occuring when a resource is owned by multiple users: they can trigger its update within seconds of each other. Unless you're building a collaborative app, you'd want to reduce chances of this collision. For this use-case, Suphle provides the `Suphle\Contracts\Services\CallInterceptors\MultiUserModelEdit` interface. A service with this decoration would look like this:

```php

use Suphle\Contracts\Services\{Models\IntegrityModel, CallInterceptors\MultiUserModelEdit};

use Suphle\Services\{UpdatefulService, Structures\BaseErrorCatcherService};

use Suphle\Services\Decorators\{InterceptsCalls, VariableDependencies};

use Suphle\Tests\Mocks\Models\Eloquent\Employment;

#[InterceptsCalls(MultiUserModelEdit::class)]
#[VariableDependencies([

	"setPayloadStorage", "setPlaceholderStorage"
])]
class EmploymentEditMock extends UpdatefulService implements MultiUserModelEdit {

	use BaseErrorCatcherService;

	public function __construct (private readonly Employment $blankModel) {

		//
	}

	public function getResource ():IntegrityModel {

		return $this->blankModel->find(

			$this->pathPlaceholders->getSegmentValue("id")
		);
	}

	public function updateResource () {

		$this->model->where([

			"id" => $this->pathPlaceholders->getSegmentValue("id")
		])
		->update($this->payloadStorage->only(["salary"]));
	}
}
```

The service will then be consumed in a Coordinator like so:

```php

class EmploymentCoordinator extends ServiceCoordinator {

	public function __construct (protected readonly EmploymentEditMock $employmentService) {

		//
	}

	public function employmentDetails ():array {

		return [

			"data" => $this->employmentService->getResource()
		];
	}

	public function editEmployment ():array {

		return [

			"message" => $this->employmentService->updateResource(

				$this->payloadStorage->only(["salary"])
			)
		];
	}
}
```

The setup above looks similar to `Suphle\Contracts\Services\CallInterceptors\SystemModelEdit`, but has some significant enforcements:

- The call to `Suphle\Contracts\Services\CallInterceptors\MultiUserModelEdit::getResource` will throw a `Suphle\Exception\Explosives\EditIntegrityException` if no [path authorization](/docs/v1/authorization#Route-based-authorization) is found. This method doesn't enjoy the protection of automatic error handling.

- Update requests must be accompanied by a field indicating resource matches its last edited state, otherwise, a `Suphle\Exception\Explosives\EditIntegrityException` will be thrown. For this field to be active, the resource in question ought to be defined as update-protected. This exception's [default diffuser](/docs/v1/exceptions#Exception-diffusers) is `Suphle\Exception\Diffusers\StaleEditDiffuser`. It responds with received JSON payload or re-renders the previous markup and loaded fields, along with error indicators:

	- Status code: 400
	- Additional payload path: *errors.0.message*

##### Update-protected models

For the decorator handler to properly compare a resource's values before and after update request is received for it, it has to implement the `Suphle\Contracts\Services\Models\IntegrityModel` interface. The methods on this interface are meta-level, so you're more likely to use an implementation for your ORM rather than a custom one. For Eloquent users, this is `Suphle\Adapters\Orms\Eloquent\Condiments\EditIntegrity`. Thus, the signature of an update-protected model would combine both as follows:

```php
use Suphle\Contracts\Services\Models\IntegrityModel;

use Suphle\Adapters\Orms\Eloquent\Models\{BaseModel, User};

use Suphle\Adapters\Orms\Eloquent\Condiments\EditIntegrity;

class Employment extends BaseModel implements IntegrityModel {

	use EditIntegrity;

	// relationship, factory and migration definition
}
```

What `IntegrityModel` does is:

- It defines a database field, `updated_at`, that is compared against an incoming request field, `_collision_protect`. All you have to do is set this form field to the resource's `updated_at`. Each time resource is updated, this field is equally updated such that any editor with a now stale copy will be informed they're about to unwittingly overwrite a fresh value, by throwing a `Suphle\Exception\Explosives\EditIntegrityException`. This exception exists in the following states:

- `EditIntegrityException::NO_AUTHORIZER`
- `EditIntegrityException::KEY_MISMATCH`
- `EditIntegrityException::MISSING_KEY`

They are constants that can be read for custom error display using the `EditIntegrityException::getIntegrityType()` method.

- It records each update to a resource, provided the `IntegrityModel::enableAudit` method returns `true`. Default implementation on `EditIntegrity` returns true, and expects shema relevant for record-keeping to be present. For Eloquent, this is among migrations on its component template. For this feature to function properly:

	- Intending models are urged to [include it](/docs/v1/database#eloquent-migrations) among their migration list.
	- Within test environments and otherwise, one of the storage mechanisms should be populated as it will be used to indicate user responsible for incoming change. This behavior can be replaced by overriding `EditIntegrity::makeHistory` and modifying the migration as desired.

This update is then ran within a transaction for you, with idempotent elements returned from `MultiUserModelEdit::getResource` hard-locked under the same safety net as `ServiceErrorCatcher::failureState`. It doesn't matter whether `updateResource` triggers an event laden with database calls to module-related tables -- they will all be tucked safely into the transaction.

### Normalizing incoming data

After receiving data from outside sources, our services ought to be able to work with information it needs in a manner it's familiar with, decoupled from the original structure input port received. The objective is to perform this conversion, guarantee safety of the operation, usher this or a fallback object to the caller. `Suphle\Services\IndicatesCaughtException` provides a structure for facilitating these goals. It's a low-level class but we'll describe how it functions here to give its sub-classes room to focus on their own unique features.

The basic premise behind `IndicatesCaughtException` classes can be understood with the following heirarchy:

```php

use Suphle\Services\IndicatesCaughtException;

class MidLevelSub extends IndicatesCaughtException {

	abstract protected function convertToDomainObject ();
}

class UserFacingClass extends MidLevelSub {

	protected function convertToDomainObject () {

		return $convertedDTO;
	}
}
```

`MidLevelSub`es define a signature suitable for intercepting the data they're predominantly converting, channeling it to `MidLevelSub::convertToDomainObject()`. If the call to `convertToDomainObject` fails, responsibility for the next action is returned to caller. In concrete terms, despite expected DTO's inability to materialize, we didn't compromise our central theme of "exceptions not terminating request without caller's permission".

`IndicatesCaughtException`'s data conversion details should be opaque to the caller. Only the familiar object should be read through `IndicatesCaughtException::getDomainObject()`. When proper conversion is impossible, `IndicatesCaughtException::hasErrors()` will return `true` while `IndicatesCaughtException::getDomainObject` will return `null`.

```php

$value = $this->remoteConfig->getDomainObject();

if ($this->remoteConfig->hasErrors())

	$value = $this->fallbackValue();
```

Unless you're receiving data from a source not covered under `Suphle\Services\Structures\ModellessPayload`, `Suphle\IO\Http\BaseHttpRequest`, you have no need to directly extend this class.

### Conducting basic search

Suphle offers a class, `Suphle\Services\Search\SimpleSearch`, for elegant manipulation of search parameters, especially targeted at software with a relatively small number of records. It's more pragmatic to offload the search feature on larger databases to more robust platforms such as [ Typesense](typesense.org).

`SimpleSearch` is most useful for search requests containing paramters that rather than directly correspond to database columns, require clauses further filtration. These clauses are expected to assemble at the class extending `SimpleSearch`.

```php
use Suphle\Services\Search\SimpleSearch;

class SimpleSearchService extends SimpleSearch {

	public function better_than ($model, $value) {

		return $model->where([

			"complex_join" => $value
		]);
	}	
}

class BaseCoordinator extends ServiceCoordinator {

	public function searchProducts (SearchProductBuilder $searchBuilder):iterable {

		return [

			"results" => $this->searchService->convertToQuery(

				$searchBuilder, ["q"]
			)->get();
		];
	}
}
```

`SimpleSearch` will cycle through incoming query parameters for one matching a method defined on `SimpleSearchService`. On encountering such method, it will delegate the model for it to apply relevant customization. Each parameter not matching a method is assumed to correspond to a column on the model and added as a `WHERE` clause automatically.

The caller uses `convertToQuery` to either retrieve a loaded builder and apply its own queries, or fetch right away. The 2nd argument to this method is a list of parameters not falling into either columns or method categories. At the very least, you'll want to omit the query key itself since it's expected to be set on the builder in `SearchProductBuilder`.

Now, we can send a search request with parameters `/search/?q=ogbogu&better_than=nmeri`.

`SimpleSearch` contains the protected properties `payloadStorage`, `ormDialect`.

### Variadic setters

This refers to a developer-level situation where mid-level with diverging dependencies share a base class requiring its own dependencies. By defining the base dependencies on the constructor, mid-level classes will be forced to combine all into a lengthy signature.

This problem should be solved by the base class defining setter methods for each of its dependencies. This pattern gives us a number of benefits we would lose otherwise:

1. The container is not indispensable for initializing the object
1. Dependencies can still be provided for the mid-level class
1. There's no conundrum if we want to replace dependencies with test doubles
1. Encapsulation is not broken
1. Dependencies are still strongly-typed
1. Argument-based decorators still work

Suphle provides the decorator `Suphle\Services\Decorators\VariableDependencies` for this purpose. It's a utility for auto-wiring arguments into methods given to it.

```php
use Suphle\Contracts\Database\OrmDialect;

use Suphle\Services\Decorators\VariableDependencies;

#[VariableDependencies([

	"setOrmDialect"
])]
class MidLevelBase implements VariableDependencies {

	protected $ormDialect;

	public function setOrmDialect (OrmDialect $ormDialect):void {

		$this->ormDialect = $ormDialect;
	}
}
```