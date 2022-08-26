## Introduction

Resources created by an authenticated user is usually stored with a reference to its creator —posts, comments, products, what have you. In most applications, we want to restrict CRUD access of such resources to their creator. Manipulating resources for the currently logged in user by merely receiving the resource's identifier implies the authenticated user can violate the privacy of other users by transferring identifiers to their resources over the wire. Authorization is a higher form of authentication that facilitates stricter access to user content.

Suphle provides route-based protection and a entity/model based approach to keep our software sealed and airtight. By utilising these mediums, one can be guaranteed that those resources are constantly in the safe hands of their creator, site administrator, collaborator, and the application's developer. Without such contraceptive in place, new additions to a team, implementing new features, will either need to be aware of existing authorization rules for those resources, roll out a new one, or worse, expose them to the whole world!

## Model-based authorization

This refers to a form of authorization on the DAL directly. It's powerful for the following reasons:

- A single authorization of one model or resource type protects it wherever it's used without the need to secure the routes that manipulate the model

- It offers maintainers a more than granular approach toward authorization where they don't risk forgetting to apply rules, thereby letting insecurity slip through.

In Suphle, this kind of authorization is applied at one central class and propagates wherever the model is used. Collocation has the additional advantage of discoverability of available permissions for each resource. Model-based authorization is defined on classes implementing `Suphle\Contracts\Auth\ModelAuthorities`. Since we'll be working with models, our implementation must be coupled with the underlying ORM. The Eloquent adapter that comes with Suphle provides a base implementation of this interface for you to extend -- `Suphle\Adapters\Orms\Eloquent\Condiments\BaseEloquentAuthorizer`. As authorization requirements differ from software to software and model to model, `BaseEloquentAuthorizer` doesn't implement `ModelAuthorities` methods in itself, but offers an initial platform to streamline our experience properly authorizing Eloquent models.

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

The generic authorization exception is `Suphle\Exception\Explosives\UnauthorizedServiceAccess`, although it can be replaced with a domain specific exception if that better appeals to your use case. As with [other exceptions](/docs/v1/exceptions), its handler is stored on `Suphle\Contracts\Config\ExceptionInterceptor`, and can be used to override what renderers determine eventual response. The general idea is that while returning `false` will prevent intended operation on the model, but user will blissly continue surfing the endpoint, whatever actions are available there.

Authorization primarily relies on `Suphle\Contracts\Auth\AuthStorage` to function. However, you will observe that our invariant is made up of

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

### Eloquent authorization adapter

The `deleting` method of our authorizer features a call to `getChildrenMethods`. This is used to lift related models that shoudln't exist in the absence of the currently deleted models. By default, this covers those relationships defined using `hasOne` or `hasMany`, but you can update it to reflect any additional relationships applicable to your software.

```php

protected $childrenTypes = [

	HasOneOrMany::class, HasManyThrough::class
];
```

Still on the subject of relationships, note that permissions aren't contagious. You'll have to protect the models in those relationships themselves from any form of undesirable access.


## Route-based authorization

You may have noted that our `retrieved` method in the model-based authorizer simply returned `true`, which would imply everyone can view instances of this resource. In the real world, this isn't always desirable. We want to limit contextual access to our models; that is, while it may be okay to list available `Employment`s, we only want those with sufficient authority to retrieve them within the scope where updates to them can be made, for example, to their edit page. We still retrieve `Employment`s here but since the concept of pages doesn't exist on the DAL, we use route-based authorization to achieve our goal. Furthermore, it is applicable to pages not strictly offering priviliged access to database models, such as an administrative dashboard, pages displaying an interface to create sub-resources, etc. Any mutative endpoint is a ripe candidate for a series of authorization impositions.

### Tagging route authorization

As you may have guessed, this form of authorization is defined on route collection, using the `Suphle\Contracts\Routing\RouteCollection::_authorizePaths (PathAuthorizer $pathAuthorizer)` method. `Suphle\Routing\BaseCollection`defines an empty implementation of this method, meaning that when absent, it is assumed that no route is authorized. However, when present, it works in conjuction with `Suphle\Request\RouteRule`. Suppose we want to secure routes on a collection `AuthorizeRoutes`, they will be tagged as follows:

```php
use Suphle\Routing\BaseCollection;

use Suphle\Request\PathAuthorizer;

use Suphle\Response\Format\Json;

use Suphle\Tests\Mocks\Modules\ModuleOne\{Controllers\BaseController, Authorization\Paths\AdminRule};

class AuthorizeRoutes extends BaseCollection {

	public function _handlingClass ():string {

		return BaseController::class;
	}

	public function ADMIN__ENTRYh () {

		$this->_get(new Json("plainSegment"));
	}

	public function ADMIN () {

		$this->_prefixFor(UnlocksAuthorization1::class);
	}

	public function _authorizePaths (PathAuthorizer $pathAuthorizer):void {

		$pathAuthorizer->addRule (

			[ "ADMIN__ENTRYh", "ADMIN"], AdminRule::class
		);
	}
}
```

`addRule` returns a fluent interface that allows us to pair as many patterns to as many rules as necessary.

Meanwhile, `AdminRule` will look like this:

```php
use Suphle\Request\RouteRule;

class AdminRule extends RouteRule {

	public function permit ():bool {

		return $this->authStorage->getUser()->isAdmin();
	}
}
```

The above tag will prohibit access to all routes matching "/admin-entry", as well as sub-patterns under "/admin/\*" for users who aren't admins.

### Untagging route authorization

Suppose we want to exclude certain sub-patterns under "/admin/\*", we'll use `Suphle\Request\PathAuthorizer::forgetRule(array $patterns, string $rule):self` method:

```php
```

## Testing