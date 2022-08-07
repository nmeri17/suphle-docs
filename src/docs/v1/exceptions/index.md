## Introduction

In practice, it's highly important that we test our application's shutdown function. There is a saying that "to have peace, we must prepare for war". If peradventure, an unfortunate event cause application to terminate abruptly, and in its dying breath, it attempts to send an SOS to the external error logger, and that fails too, we can either blurt error to user, assuming he is the developer, or keep mum altogether and pretend nothing happened. In both cases, we will arrive at the same point we were before we set out to alert app maintainer on system malfunction

// show how to throw things at shutdown

We need to take an action with the greatest chance of leaving evidence behind. Writing to a file is relatively reliable but is insufficient since it doesn't actually call anybody to action. By default, we combine both to complement each other. If this outcome doesn't suit, you can override the `disgracefulShutdown` method. Bear in mind that the less fancy action taken here is, the safer for all parties. Assume all else has failed and this is the last ditch of last ditches. The fewer dependencies/IO required to execute this step, the better

$this->message = json_encode(

				$this->evaluator->getValidatorErrors(), JSON_PRETTY_PRINT
			); // using this since error handler will be stubbed out in tests, thus precluding us from seeing what failed

InvestigateSystemCrash
Enables us trigger an action and investigate system behavior afterwards.
... after describing gracefulShutdown and disgracefulShutdown

Three possible paths exist after undertaking a failable action:
1. Action succeeds, no exception is thrown
1. Action fails, but is handled by gracefulShutdown
1. gracefulShutdown fails and falls back to disgracefulShutdown

By default, disgracefulShutdown is stubbed out for you. It's just a helper and doesn't mean the method shouldn't be tested. It's simply expected that tests covering gracefulShutdown will outnumber those for disgracefulShutdown. disgracefulShutdown will never run if gracefulShutdown never fails.

When you're ready to test disgracefulShutdown, set `softenDisgraceful` to false and stub gracefulShutdown with a double that throws an exception
// example (still true?)

You may observe that when your call to `assertWillCatchException` passes, response gets dumped to terminal. This is because PHPUnit starts buffering output during each test. When your action raises the exception you expect it to, this buffer isn't cleaned/flushed, and on script termination, all variables from when request failed are automatically flushed by PHP

`DetectedExceptionManager::queueAlertAdapter` is used for preventing errors from terminating user requests. It's a method used by a number of constructs such as the `ServiceErrorCatcher` decorator, `BaseHttpRequest`, among others. However, when automating tests for the software, we usually do not want to receive alerts about our broken program, so this method is stubbed out with a dummy that does nothing. This is because when requests are sent in, Suphle has another channel it uses to detect whether or not an error occured. When constructs that directly interact with this method fail within a test and we want to know what happened, the `muffleExceptionBroadcast` property should be set to `true`