# Authorization

## Introduction

Every resource created by authenticated users is usually stored with a reference to its creator —posts, comments, products, and what have you. In most applications, we want to restrict CRUD access of such resources to their creator. The risk of merely receiving resource identifiers for the currently logged in user implies they can violate the privacy of other users by simply transferring identifiers to their resources over the wire

Authorization is divided into two categories: route-based protection and a entity/model based approach, where both complement each other. By utilising both methods, one can be guaranteed that those resources are constantly in the safe hands of their creator, site administrator, collaborator, and the application's developer. Without such contraceptive in place, new additions to a team, implementing new features, will either need to be aware of existing authorization rules for those resources, roll out a new one, or worse, expose them to the whole world!

## Model-based authorization

Collocating this class of rules provides us the advantage of centralizing module rules to where one can quickly glance at available permissions for each resource

As can be seen above, Return type for methods on ModelAuthorities is bool, although Suphle doesn't expect you to actually return false. The binary data-type here is a stand-in for what should be a TrueOrException<T> generic. `T`, here, would represent the specific authorization being violated. We compensate for lack of such data-type using the following polyfill:

// example showing the current way, but with custom exception

The generic authorization exception is namespace\UnauthorizedServiceAccess. By throwing it, request will promptly be terminated. As with [other exceptions](/exceptions), its handler is stored on `Tilwa\Contracts\Config\ExceptionInterceptor`, and can be used to override what renderers determine eventual response

// example

But the general idea is that custom exceptions should be thrown from authorization methods, in place of `false`.

### Eloquent note

Permissions don't have effect when the model is fetched from a relationship. You'll have to protect the models in those relationships themselves

## Route-based authorization 

Route-based authorization is useful either for protecting pages not strictly offering priviliged access to database models, such as an administrative dashboard. Or, for models that should only draw authorization request on specific routes, such as an edit page. This, to avoid wrangling request paths in the model-based authorization method. For instance, every user may have view access to all products *outside* the context of edition. That context (in this case), is carried by the url path, which is somewhat inaccessible at the model-based authorization/heart of the application, and should be taken care of at the outskirts

// Example

Something similar can be said of creating sub-resources
