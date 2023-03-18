## Introduction

The question "What part of the application do we test?", spurs a range of possible choices. For instance, one may ponder whether to concentrate efforts on the [coordinators](/docs/v1/service-coordinators) since it encompasses the user's interaction with the web-application? To what extent should attention be paid to [request validators](/docs/v1/service-coordinators#Validating-incoming-requests) so as to secure our endpoints from nonsensical input? What about models, events, services?

This chapter sets out to walk through the various user-land layers, in order to glean which of them would be most beneficial to test.

## Prioritizing test layers

Given enough time and manpower, no layer should be exempt from being tested; that includes model hydrators, middleware, error handlers, authorization, queued tasks, configuration. More often than not, these resources are scarce, thus we must decide based on these salient points:

1. The amount of value testing each layer offers.
1. The layer that provides a broad surface area for examination.
1. The layer that makes for [tests resilient to refactoring](#brittle-test-layers).

Below, we pass some application's layers through these prisms:

- Coordinators pass point 1 but fails point 2. Due to their nature of crowding data from a myriad of sources under the umbrella of one endpoint, it becomes near impossible to exhaustively test those sources independently.

- Validators sit low in the hierarchy of importance, since one can't boast of how foolproof their input interceptor is if the business logic working with the input functions incorrectly.

- Presentation tests ultimately belong in the realm of markup for HTML-based responses, and documentation for API-based ones. These both have dedicated testing libraries, indicating they're beyond the scope of testing the application's functionality. This layer is disqualified because it should not concern itself with whether the information served to it after executing business logic is "correct" or not. Its sole responsibility is to layout that data it receives in a format agreed upon by the applicable consumption mechanism.

- Inbound HTTP tests foster duplicate verification of response bodies when the underlying endpoints re-use services.

In the actual sense, no one sector meets those objectives in an optimal measure. Attempting to do so would result in god-objects and mixed concerns. However, the over-arching concept where those objectives converge is commonly known as the application's business logic. If we can't guarantee its integrity, nothing we are building matters to the stakeholders. Thus, the software layers most vital to test are those situated in this layer -- where activities that define what the business wants are implemented.

For some background, we're differentiating between the *transport layer* and business logic. The transport layer encapsulates peripheral mechanisms for carrying data in and out of the business layer. These are coordinators, queue tasks, middleware, Container and event bindings, console commands, presentation formats, that category of layers. On the other hand, there is company-specific behavior backed by the transport layer, without which those domains lose their meaning. This idea is what is being referred to as *business layer*.

When decoupled from the transport layer, a strictly business layer can be adequately tested irrespective of a specific transport layer. That is one of the driving factors behind Suphle's replacement of Controllers with [Coordinators](/docs/v1/service-coordinators#Coordinator-services), [outgoing request wrappers](/docs/v1/http), and the likes. You're expected to replicate this philosophy across your transport layer i.e. extracting as much behavior as possible out of it. These extracts are what should be rigorously tested.

For example, our objective is to build a feed for users to see content from accounts they are following. If the test for this problem approaches it from the implementation standpoint, it'll make the test look redundant. An working implementation could start out as follows:

```php

// PostsService
public function showPostsToUser (

	UserContract $user, array $fields, int $amount = 20,

	bool $hasSeenAll = false
):iterable {

	$subscribedIds = $this->userModule->mostInteractedWith($user)

	->pluck("id");

	$postsBuilder = $this->blankPost->whereIn("author_id", $subscribedIds)

	->where([
		[
			"created_at", "<=",

			(new DateTime)->add(new DateInterval("PT3H"))
		]
	])
	->inRandomOrder()->limit($amount)->select($fields);

	if (!$hasSeenAll) $postsBuilder->whereDoesntHave("seen", $user->id);

	return $postsBuilder->get();
}
```

The fetcher above almost entirely interacts with the database, but it'll be wasteful to mock those internal methods:

- It's unrealistic to mock all those methods both due to their size and how [brittle](#brittle-test-layers) such a test would be.
- Since the methods belong to 3rd-party maintainers, it's unreliable to stub the mock with an expected return value.
- The database is a transport layer.
- By mocking the internals of `showPostsToUser`, we will end up recreating that invocation sequence, resulting in a redundant test.

What the business demands is that,

> users to see content from accounts they are following

Some of the clauses applied to that query are modifiers not relevant to the aim of this scope. What would guarantee the rectitude of `showPostsToUser`'s results is that the content it returns indeed correspond to accounts they are subscribed to. And that is what we should test.

```php

public function test_fetches_only_subscribed_content () {

	$user = $this->getRandomEntity(); // given

	$postsService = $this->getContainer()->getClass(PostsService::class);

	$posts = $postsService->showPostsToUser($user, ["id"], 10); // when

	$allMatching = $posts->filter(function ($post) use ($user, $postsService) {

		return $postsService->isFollowingAuthor($post, $user);
	});

	$this->assertSame( $posts->count(), $allMatching->count()); // then
}
```

Our `test_fetches_only_subscribed_content` relies on the premise that `isFollowingAuthor` has a test that uses [the `databaseApi` property](/docs/v1/database#Asserting-database-state) to verify at the lower-level, that the relationship column matches the given value.

After testing the business layer, any spare time available should be purposed towards endorsing its integration with the transport layer: confirm the presence of expected validation rules, that your server-rendered template successfully parses against the actual response payload, etc.

## Brittle test layers

Two common testing anti-patterns are known by the terms Flaky tests and Brittle tests. They are similar in characteristic but have a subtle difference: Flaky tests are those dependent on external, unstable factors that cause the test to pass/fail in an unpredictable manner. These factors could range from expected timestamps to filesystem permissions. Brittle tests, on the other hand, are those too tightly coupled to implementation details. These are concrete aspects of the software rather than intangible elements like behavior.

Suphle's testing framework makes it convenient to verify interactions with the transport layer. However, when testing your business logic, behavior can be inferred by observing the shape of return values or its specific properties where necessary. Behavioral tests are not meant to be aware of the actual methods or internal concretes responsible for the effect eventually being observed. They should be observed much like the end user would. There are some exceptions where following this guideline is not always possible:

- When debugging a defect with unit tests.
- When practising TDD.
- When the internals meddles with IO.
- When doubling targets and collaborators with mocks.

Inasmuch as these scenarios have their merits, brittleness can be considered one of their trade-offs when using them is inevitable. But the idea behind a brittle-resistant test is that its inner workings can be modified without requiring adjustment of the test as well, unless those implementation details are aimed at replacing existing behavior.

## Conclusion

In this chapter, we explored the diverse segments of an application in search of which of them would deliver the most profitable tests. We were able to deduce that the behavior of the business layer is where we should exercise our testing might.