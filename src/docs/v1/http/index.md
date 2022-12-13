## Introduction

This chapter refers to outward HTTP calls made by our application, whose response is required for satisfying user request. Some old applications use native APIs like bare-bones `file_get_contents` or cURL. The problem with these methods is that they don't offer modern facilities such as concurrent, successive requests. But more importantly, most solutions available don't assist with solving the following goals:

1. Object structures that enable request senders to react in an elegant manner to the response. For example, a service vending API would likely respond with codes indicating status of the initiated action. A robust structure ought to account for:

	1. Situations where the response you receive is outside what was promised by the authors of that API
	1. Error/unsuccessful status codes. If the API doesn't make explicit provision for these, the developers are suspect. Guard yourself with a custom else block.

1. Ideally, this plumbing should occur away from the domain layer, who is only interested in an object satisfying its DSL. The application isn't concerned about managing clumsy URLs, filtering through to relevant nodes on the payload, etc.

1. By separating request-response from the caller, we gain the ability to test these parts of our program using whatever data we please, simulating errors, etc.

## Writing request objects

The goals listed above are met by the `Suphle\IO\Http\BaseHttpRequest` class that all outgoing requests are recommended to be wrapped it. It doesn't compete with libraries like Guzzle or HttPlug, rather it collaborates with them to achieve those objectives. It also isn't a platform for writing SDKs.

The simplest request class fetching data over the wire would look like so:

```php

use Suphle\IO\Http\BaseHttpRequest;

use Psr\Http\Message\ResponseInterface;

class VisitSegment extends BaseHttpRequest {

	public function getRequestUrl ():string {

		return "http://example.com/segment";
	}

	protected function getHttpResponse ():ResponseInterface {

		return $this->requestClient->request(
		
			"get", $this->getRequestUrl()/*, $options*/
		);
	}

	protected function convertToDomainObject (ResponseInterface $response) {

		return $response; // filter to taste or cast to DSL
	}
}
```

It can then be consumed in a `getFromApi` coordinator handler as follows:

```php

class HttpCoordinator extends ServiceCoordinator {

	public function __construct (protected readonly VisitSegment $httpService) {

		//
	}

	public function getFromApi ():iterable {

		$dslObject = $this->httpService->getDomainObject();

		if ($this->httpService->hasErrors()) {

			// derive $dslObject some other way
		}

		return ["data" => $dslObject];
}
```

If the presence of `convertToDomainObject` and `getDomainObject` ring a bell, that is because [the same over-arching theme](/docs/v1/service-coordinators#Normalizing-incoming-data) is shared by `ModellessPayload`. Where underlying client throws an exception due to response code 500, or where DSL creation throws an exception, or where response fails to contain expected content, the program doesn't terminate. Application will elegantly recover from any internal conflict in outgoing request handling.

The default implementation of `BaseHttpRequest::translationFailure` is such that when any of the above situations occur, the exception is forwarded to [exception broadcaster](/docs/v1/exceptions#Broadcasting-exception-details), along with response received after sending the request. `getDomainObject` will return null, as discretion on what to do next would be unique from caller to caller, thus flow control should be returned to them.

## Testing outgoing HTTP requests

There's no restriction to what test-type outgoing HTTP requests should be made from. There also is no special trait to enable this.

### Simulating request states

URL or response can be replaced by stubbing the `getRequestUrl` or `getHttpResponse` methods of the request object respectively.

```php

public function test_outgoing_request () {

	$sutName = VisitSegment::class;

	$parameters = $this->getContainer()

	->getMethodParameters(Container::CLASS_CONSTRUCTOR, $sutName);

	$httpService = $this->replaceConstructorArguments(

		$sutName, $parameters, [

			"getRequestUrl" => "demo.example.com/segment" // given
		]
	);

	$response = $httpService->getDomainObject(); // when

	// then => verify expectations on $response
}
```

### Debugging HTTP requests

Since the internal workings of the request object are obscured away, exceptions for failing tests have be explicitly extracted using its `getException` method. To have a more thorough test, we'll modify it as follows:

```php

$response = $httpService->getDomainObject(); // when

if ($httpService->hasErrors()) {

	$exception = $httpService->getException();

	var_dump($exception);

	$this->fail($exception);
}

// continuation of then assertion
```

It's important to call `fail` as a sanity check. Note that if request itself failed i.e. exception doesn't originate from the domain and is as a result of a bad request, `getException` will return the entire `Psr\Http\Message\ResponseInterface` payload. We'll then drill down to the actual body of the response like so:

```php

var_dump($exception->getResponse()->getBody()->getContents());
```