##SERVICES AND CONTROLLERS
While decisive steps are put in place on controllers to drive the point of 
micro services home, the onus of writing atomic services lies in the 
developer's 
hands. It is up to you to recognize and extract recurring patterns or 
behaviour in your services into individual private methods

#
Validating dependencies at runtime may raise some eyebrows, especially when 
there are less on-demand solutions such as validating the code base after 
each update. It is assumed that the barrier for syntax memorization is so 
low, any beginner can get in — junior developers who should not be trusted 
to 
know what they're doing. In exchange, the cost of validation is a few micro 
seconds in performance. If it's either not a price you are willing to pay, 
perhaps out of trust in your abilities and that of your colleagues, the 
controller configuration setting method "validates" should return false

#
Super classes aren't returned when consumers try to pull their sub classes 
because there's simply no way for the consumer to know a sub exists. 
However, providing base classes can be served to a known type of consumers. 
To illustrate, consider (convert this to code) X is a sub-class of Y, B is 
the sub of A

1) A pulls X --> only works if A provided X
2) B pulls Y --> works if A provided Y

Scenario 2 is useful when a variable group of classes with a base type need 
to provide an immutable or unchanging instance
In order to achieve scenario 1, convert Y to an interface and provide X as 
an implementation

#model hydration

<?php
function jj (NewsRequest $request, ControllerModel $newData) { // conceals 
News::where(id, id) stored on property x

        $this->newsRepository->updateJj($newData, $request); // cleaner. 
gets are lazier and under developer's control. avoids duplicating builders
}

#Logic Factories
For adequately testing all possible use cases, alternate flow paths 
(control flow, not Suphple flow) must be visited as well. At each endpoint, 
we dive deeper by testing its range of output. By using a declarative 
syntax, we're able to able to inform the framework this is an alternate 
path of execution, we try to fulfill that condition and test it as well.

See https://pastebin.com/8idvNsyu