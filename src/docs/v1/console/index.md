## Introduction

It is sometimes desirable to narrow hydrating Container to one that belongs to module given using the `module` CLI argument. When this is not necessary, commands can receive services that do the heavy lifting/computation logic in their constructors. Insodoing, remember to call `parent::_construct`

what can i do with them?
// show terminal example

how do i create one? what do i extend and how do i connect it? how do i trigger it?

Commands are being loaded into the test runner from the `setUp` method of your `CommandLineTest`. This makes it convenient for you to simply find command and run it
// example

This snippet assumes you aren't testing command itself, but its side effects. If you are doing the former perhaps, trying to provide a double to your modules within your test method, the double will not be acknowledged. In such cases, you want to inject your doubles from `getModules`
// example