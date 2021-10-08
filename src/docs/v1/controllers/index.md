# Controllers

## Introduction
Controllers are where the behaviour behind each endpoint 
is decided.

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

`newData` has to match the incoming placeholder for this to work

## Permitted services
Constructor injection

## Config
Validating dependencies at runtime may raise some eyebrows, especially when there are less on-demand solutions such as static analysis after each code update. It is assumed that the barrier for syntax memorization is so low, any beginner can get in — junior developers who should not be trusted to know what they're doing. In exchange, the cost of validation is a few micro seconds in performance. If it's either not a price you are willing to pay, perhaps out of trust in your abilities and that of your colleagues, the controller configuration setting method "validates" should return false

## Atomic services
While decisive steps are put in place to drive the service-oriented gospel home, it is not an invitation to delegate your entire calls to the services. That way, we will still end up with fat services, and be repeating the same structure we claim to run away from, by converting what should be value pipes into bloated controllers.

/// Example

The ideology here is to recognize and extract recurring patterns or behaviour into atomic methods. This makes them flexible for reuse, and testing. The onus of achieving this recognition ultimately lies in developer's hands. Thus, our above example will be rewritten as

/// Alternative

Here, the services do not care about presentation format (which is the controller's primary responsibilty), but are helpers to accessing value objects.

# Services

Explain what ReboundsEvents, CommandService do (assumes the underlying method is laden with db calls to numerous tables)

## Logic Factories

See https://pastebin.com/8idvNsyu