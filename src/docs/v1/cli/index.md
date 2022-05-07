## Console Commands
// add to toc

Commands are being loaded into the test runner from the `setUp` method of your `CommandLineTest`. This makes it convenient for you to simply find command and run it
// example

This snippet assumes you aren't testing command itself, but its side effects. If you were doing the former, perhaps, trying to provide a double to your modules within your test method, the double will not be acknowledged. In such cases, you want to inject your doubles from `getModules`
// example