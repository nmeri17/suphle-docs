## Introduction

Resources created by an authenticated user is usually stored with a reference to its creator —posts, comments, products, what have you. In most applications, we want to restrict CRUD access of such resources to their creator. Manipulating resources for the currently logged in user by merely receiving the resource's identifier implies the authenticated user can violate the privacy of other users by transferring identifiers to their resources over the wire. Authorization is a higher form of authentication that facilitates stricter access to user content.

Suphle provides route-based protection and a entity/model based approach to keep our software sealed and airtight. By utilising these mediums, one can be guaranteed that those resources are constantly in the safe hands of their creator, site administrator, collaborator, and the application's developer. Without such contraceptive in place, new additions to a team, implementing new features, will either need to be aware of existing authorization rules for those resources, roll out a new one, or worse, expose them to the whole world!

## Model-based authorization

This refers to a form of authorization on the DAL directly. It's powerful for the following reasons:

- A single authorization of one model or resource type protects it wherever it's used without the need to secure the routes that manipulate the model

- It offers maintainers a more than granular approach toward authorization where they don't risk forgetting to apply rules, thereby letting insecurity slip through.

In Suphle, this kind of authorization is applied at one central class and propagates wherever the model is used. Co-location has the additional advantage of discoverability of available permissions for each resource. Model-based authorization is defined on classes implementing `Suphle\Contracts\Auth\ModelAuthorities`. Since we'll be working with models, our implementation must be coupled with the underlying ORM. The Eloquent adapter that comes with Suphle provides a base implementation of this interface for you to extend -- `Suphle\Adapters\Orms\Eloquent\Condiments\BaseEloquentAuthorizer`. As authorization requirements differ from software to software and model to model, `BaseEloquentAuthorizer` doesn't implement `ModelAuthorities` methods in itself, but offers an initial platform to streamline our experience properly authorizing Eloquent models.

### Writing model authorizers

Suppose we have an Employment model, we would go about securing it using the following authorizer:

```php
use Suphle\Adapters\Orms\Eloquent\Condiments\BaseEloquentAuthorizer;

use Suphle\Exception\Explosives\UnauthorizedServiceAccess;

class EmploymentAuthorizer extends BaseEloquentAuthorizer {

	public function retrieved ($model):bool {

		return true;
	}

	/**
	 * Model's invariant
	 * 
	 * @param $model Suphle\Adapters\Orms\Eloquent\Models\BaseModel
	*/
	protected function isEmployer ($model):bool {

		return $this->authStorage->getId() == $model->employer->user_id;
	}

	public function updating ($model):bool {

		if ($this->isEmployer($model))

			return true;

		throw new UnauthorizedServiceAccess;
	}

	public function creating ($model):bool {

		return true;
	}

	public function deleting ($model):bool {

		if (!$this->isEmployer($model))

			throw new UnauthorizedServiceAccess;

		foreach ($this->getChildrenMethods(get_class($model)) as $methodName)

			$model->$methodName()->delete();

		return true;
	}
}
```

There are a few things going on in the authorizer above. First of all, return type for methods on ModelAuthorities is `bool`, although Suphle doesn't expect you to actually return `false`. The binary data-type here is a stand-in for what should be a `TrueOrException<T>` generic. `T`, here, would represent the specific authorization being violated. We compensate for lack of such data-type using the following polyfill:

```php

public function updating ($model):bool {

	if ($this->isEmployer($model)) // passes invariant

		return true;

	throw new UnauthorizedServiceAccess; // terminate access
}
```

The generic authorization exception is `Suphle\Exception\Explosives\UnauthorizedServiceAccess`, although it can be replaced with a domain specific exception if that better appeals to your use case. As with [other exceptions](/docs/v2/exceptions), its handler is stored on `Suphle\Contracts\Config\ExceptionInterceptor`, and can be used to override what renderers determine eventual response. The general idea is that while returning `false` will prevent intended operation on the model, user will blissly continue surfing that endpoint.

These methods represent important milestones in the lifetime of a model. Each of them will almost always be populated with domain barriers dictated by the product owner. When a barrier is not immediately apparent, the developer and PO should prevent unforeseen accidents by listing invariants of each entity. This task can be made easier by examining model columns and the contents of a relationship model that would translate into an invalid system state.

#### Evaluating user model

Authorization primarily relies on `Suphle\Contracts\Auth\AuthStorage` to function. However, you will observe that our invariant is made up of,

```php

return $this->authStorage->getId() == $model->employer->user_id;
```

As opposed to,

```php

private $userId;

public function __construct (AuthStorage $authStorage) {

	$this->userId = $authStorage->getId();
}

protected function isEmployer ($model):bool {

	return $this->userId == $model->employer->user_id;
}
```

This is because authentication identifiers are unavailable in authorizer constructors. All model authorizers are hydrated and sent to the `Suphle\Contracts\Database\OrmDialect` before commencing any database operation. `Suphle\Contracts\Auth\UserContract`, the bedrock of authentication, happens to be one of models, which precludes those authorizers from potential knowledge of who authorized user is until at that point in time. This compromise is acceptable since we don't require any retrieval impositions on `Suphle\Contracts\Auth\UserContract` before authentication occurs.

### Connecting model authorizers

Each authorizer has to be paired with the model it authorizes on `AuthStorage::getModelObservers()` config method. Our `EmploymentAuthorizer` above will be paired as follows:

```php

use Suphle\Config\Auth as DefaultAuthConfig;

class CustomAuthConfig extends DefaultAuthConfig {

	public function getModelObservers ():array {

		return [

			Employment::class => EmploymentAuthorizer::class
		];
	}
}
```

### Eloquent authorization adapter

#### Cascade on delete

The `deleting` method of our authorizer features a call to `getChildrenMethods`. This is used to lift related models that shoudln't exist in the absence of the currently deleted models. By default, this covers those relationships defined using `hasOne` or `hasMany`, but you can update it to reflect any additional relationships applicable to your software.

```php

protected $childrenTypes = [

	HasOneOrMany::class, HasManyThrough::class
];
```

There are a few other ways to have gone about this, one of which is the use of model factories. This method deletes it at the database level, but isn't quite supported on all database engines. Model-based authorizers are a safe location to gather child relations and send them to any of the entity decomissioning locations we prefer. Some developers opt for the simpler soft-deletes approach, while others are convinced model archiving is a far superior paradigm.

However, for any generic solution to this problem to bear fruit, you must promise yourself and team members not to delete any models using shortcuts such as a DBMS.

#### Authorization through relationships

Permissions aren't contagious -- those relationships must be protected on their models from any form of undesirable access.


## Route-based authorization

You may have noted that our `retrieved` method in the model-based authorizer simply returned `true`, which would imply everyone can view instances of this resource. In the real world, this isn't always desirable. We want to limit contextual access to our models; that is, while it may be okay to list available `Employment`s, we only want those with sufficient authority to retrieve them within the scope where updates to them can be made; for example, to their edit page. We still retrieve `Employment`s here but since the concept of pages doesn't exist on the DAL, we use route-based authorization to achieve our goal. Furthermore, it is applicable to pages not strictly offering priviliged access to database models, such as an administrative dashboard, pages displaying an interface to create sub-resources, etc. Any mutative endpoint is a ripe candidate for a series of authorization impositions.

### Tagging Route Authorization

Route authorization is achieved by applying the `#[PreMiddleware]` attribute with the `PathAuthorization` to Coordinator methods or classes. Unlike authentication, which simply identifies a user, authorization evaluates specific **Route Rules** to determine if the identified user is permitted to access a resource.

## Route Rule Classes

Path authorization rules are dedicated classes that implement the `permit()` method. These classes have full access to the DI container, allowing them to inject services like `AuthStorage` to check user roles or `RouteInfo` to retrieve ID segments from the URL.

```php
namespace App\Authorization\Rules;

use Suphle\Request\RouteRule;

class AdminRule extends RouteRule {

    public function permit(): bool {

        return $this->authStorage->getUser()->isAdmin();
    }
}
```

## Applying Authorization Rules

Suppose we want to restrict access to an admin dashboard. We apply the funnel directly to the Coordinator. This prohibits access to the mapped routes for any user who does not satisfy the `AdminRule`.

```php
namespace App\Coordinators;

use Suphle\Routing\Attributes\{RoutePrefix, Route, PreMiddleware};
use Suphle\Auth\Middleware\PathAuthorization;
use App\Authorization\Rules\AdminRule;
use Suphle\Response\Format\Json;

#[RoutePrefix(prefix: "admin")]
#[PreMiddleware(PathAuthorization::class, [AdminRule::class])]
class AdminCoordinator {

    #[Route("/entry")]
    public function getEntry(): Json {

        return new Json([
            "message" => "Welcome to the Admin Panel"
        ]);
    }
}
```

## Detaching Parent Route Authorization

In an attribute-driven architecture, class-level middleware is inherited by all methods. To exclude specific sub-routes from inherited authorization, the `#[ClearMiddleware]` attribute is used. This allows you to "secede" from the overarching security policy.

```php
#[RoutePrefix(prefix: "employment")]
#[PreMiddleware(PathAuthorization::class, [AdminRule::class])]
class EmploymentCoordinator {

    #[Route("/public-list")]
    #[ClearMiddleware(PathAuthorization::class)]
    public function getPublicList(): Json {

        return new Json([
            "data" => "Public job postings"
        ]);
    }

    #[Route("/edit/{id}")]
    public function editEmployment(int $id): Json {

        return new Json([
            "data" => "Editing employment record $id"
        ]);
    }
}
```

In the example above, `getPublicList` is accessible to everyone, while `editEmployment` remains restricted to administrators.

## Combining Authorization Rules

Authorization rules are additive. When multiple `PathAuthorization` attributes are present (either through inheritance or by stacking them on a single method), Suphle executes them in sequence. A localized rule will only run if the inherited class-level rules have already passed.

Model-based authorization often requires checking the owner of a specific resource. Because `RouteInfo` are populated before the rules run, you can easily retrieve URL parameters like `{id}` within the rule.

```php
namespace App\Authorization\Rules;

use Suphle\Request\RouteRule;
use Suphle\Auth\Contracts\AuthStorage;
use Suphle\Routing\Structures\RouteInfo;
use App\Models\Employment;

class EmploymentEditRule extends RouteRule {

    public function __construct (
        AuthStorage $authStorage,
        protected readonly Employment $model,
        protected readonly RouteInfo $routeInfo
    ) {
        parent::__construct($authStorage);
    }

    public function permit(): bool {

        return $this->authStorage->getId() === $this->getCreatorId();
    }

    protected function getCreatorId(): int {

        return $this->model->find(
            $this->routeInfo->getSegmentValue("id")
        )->employer->user_id;
    }
}
```

By stacking this on the coordinator method, you can combine logic seamlessly:

```php
#[PreMiddleware(PathAuthorization::class, [EmploymentEditRule::class])]
public function updateEmployment(int $id): Json {

    return new Json(["message" => "Update successful"]);
}
```

If this method is inside the `AdminCoordinator` from the previous section, the resulting access requirement for `/admin/employment/update/1603` is reduced to users who are both **Admins** AND the **Creator** of the resource.

## Testing authorization

```php

protected function assertForbidden ():void
```

We use this on HTTP-based tests to verify permission to access resources was properly restricted. If denial was encountered, test will fail.

```php

public function test_nested_missing_all_rules_fails () {

	$this->actingAs($this->admin); // given

	$this->get(self::EDIT_PATH . $this->randomEmploymentId()) // when

	->assertForbidden(); // then
}
```
