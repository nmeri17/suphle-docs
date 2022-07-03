# In defence of tests not driving development

The main purpose of writing tests after code is to enable its author confirm his work behaves in an intended way, while taking a second look at it. It's like repeating numbers you just listened to for assurance that you heard correctly. The difference between this and a test - driven approach is that this is more of a cross check whereas with TDD, the checklist is composed and stricken off almost in parallel

In both cases, we target the same end goal, however, their paths are 
divergent. TDD approach gives greater coverage while being more verbose –bugs are spotted on the go. So, what happens when a test fails in the code - first approach? Go to the unit layer, and subject the erring component to further scrutiny. Bear in mind that dependencies at this level will be mocked out ie. The base test replaces SUT's dependencies with mocks, so you are free to fill out their blanks

Tests after code is not the same as using a program to generate test method equivalents of SUT's code. While both are done at the same time and can guarantee the program still (strike through) works, code generation fails to answer the question of regression. Should someone unwittingly alter expected behaviour, the code generator will be unable to identify that. 
Except the generator is an AI that understands input on what is required of the underlying system, it can only convert to tests under the assumption that the developer's logic is accurate and infallible

Unit tests are not compulsory for those not practising TDD, since it 
engages the "green" phase of the red - green - refactor chain. In its absence, some behaviours may fortunately work, while others won't. This implies uncertainty at what point of the chain we start at, thus obscuring the hard requirement on unit tests. When we're not incrementally developing ie progress dictated by success of tests of preceding code, we can get away with having no tests at that level if all the internal code paths can be explored by testing objects with greater hierarchy

## 
You are free to pay the price for posterity sake e.g if code making use of that lower level functionality is removed in future. Otherwise, in my opinion, the failing higher test is already a pointer as to whether the lower code behaves as expected. Using mocks in and of themselves doesn't indirectly fix the test