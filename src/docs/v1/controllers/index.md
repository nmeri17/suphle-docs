# Controllers

## Introduction
The Controller is where the behaviour behind each endpoint is decided.

How do we retrieve input from the outside world?

## Validation
Now we have seen how to intercept values from our users, an important caveat to bear in my mind is how to shield our beloved application from receiving unexpected values
/// connect validator to controller

While it may seem daunting to create validators for each non-GET path, recall that Applications crumble when its user is allowed to do unexpected things. It always pays off when their every move is anticipated in the sandbox of a validator

highlight the fact that any method other than GET will result in an error in the absence of a validator for that request

## Model hydration

```php
function jj (ControllerModel $newData) { // conceals News::where(id, id) stored on property x

        $this->newsRepository->updateJj($newData, $request); // cleaner. gets are lazier and under developer's control. avoids duplicating builders
}
```

`newData` has to match the incoming placeholder for this to work (Is this still valid?)

// Example of ControllerModel builder usage
// show fetcing only products with prices above an invalid value (in addition to the id)

Builder Selects

Note that the relationships are not going to have the selects unless manually added (hint: by injection into the relationship method)

...
Action methods are not strictly required by Suphle or your IDE to type their return values. For this reason, it's not enforced. However, if you need a compelling reason to do so, documentation generators and static analyzers will greatly benefit from their availability

## Permitted services
There are two broad categories of actions possible in a controller: those that update the database and those that don't. Those that don't can further be separated into services that interact and those that don't interact with the database. In Suphle, the topmost category is represented by the classes `UpdatefulService` and `UpdatelessService` while the sub-category is represented by `ModelfulPayload` and `ModellessPayload`, although these aren't necessarily services in the way you may expect.

They are mostly POPOs except for the fact that neither can depend on the other i.e. an `UpdatefulService` can't import a dependency inheriting from `UpdatelessService`. Whether or not the distinction for database vs non-database `UpdatelessService` services will be made depends on how frequently they change, how many they are and whether or not it makes sense to test them independent of the rest of the system/their consumer. "They" here, can refer to anything from business logic to database fetch queries

At the most basic level, two practices should be observed while making use of `UpdatefulService`:
1. All its public methods should be run within database transactions
1. It shouldn't be invoked directly unless it returns a value that should be used within calling scope. Otherwise, it should be triggered as an event handler

Suphle provides 2 decorators that make light work of the first point, so you never have to worry about it: SystemModelEdit and MultiUserEdit, both of which will be looked at later in this chapter 

# Services

Explain what ReboundsEvents, CommandService do (assumes the underlying method is laden with db calls to numerous tables)

If the operations fail and are being rolled back, the caller catches the error and either recurses until success is achieved, or doesn't proceed to send out the IO calls

(review above)

In both cases, the caller has to confirm that operation didn't fail, however there are a few differences. With failureState:

1. you don't have to worry about reporting the error
1. you can receive a non-null value, as specified in failureState
1. the objective here is to make it as seamless as possible for the caller to carry on its journey; its next action may or may not be influenced by the call result. But under no circumstance should request terminate on error

When convertToDTO fails, responsibilty for the next action is returned to caller. The point is that expected DTO couldn't materialize, without compromising our central theme of errors not terminating request without caller's permission
// if is null and hasErrors; while failureState always has a value, so if hasErrors

Action methods expect to be injected only with information that is meaningful for handling that request--something that would otherwise lack context within another handler method, or an object that can't be known at compile time, or can't be provided. Anything else should be gathered at the constructor as there's every likelihood that it'll be used for multiple handlers, and we don't want to repeat ourselves. The only objects that fit this description are `ModelfulPayload` and `ModellessPayload`. Violating this rule will result in an `InvalidArgumentsException`

## Logic Factories
...
VariableDependencies

You only want to use this when you have a common list of implementations with diverging dependencies. Arguments on the given methods are auto-wired. This setter pattern gives us a number of benefits we would lose otherwise:
1. This decorator along with the container are not indispensable to initializing the object
1. Dependencies can still be provided for this specific class
1. There's no conundrum if we want to replace dependencies with test doubles
1. Encapsulation is not broken
1. Dependencies are still strongly-typed

See https://pastebin.com/8idvNsyu