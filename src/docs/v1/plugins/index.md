##PLUGINS
Our emphasis on decoupling means domain module authors are encouraged to build 
around standardized interfaces for decreased coupling. A sample library is a module 
whose exports class must implement the library for the category it belongs 
to. For instance, paystack library implements the payment gateway module. 
In the consuming module, we define Suphple payment gateway interface as one 
of the depends, and plug in paystack or flutterwave libraries in the provider

You can either have libraries giving new functionality to the developer or 
those overriding default framework behaviour. For the latter to be 
possible, we have to operate with interfaces, load our own implementation 
during boot, and pull them from the container.
We can either do this everywhere or at positions we intend leaving open for 
extension such as the object that boots controller arguments
The difference between both is that packages/libraries are framework 
agnostic. Or at least, they are meant to be. They ought to rely on language 
constructs for implementing functionality. Plugins on the other hand, are 
for replacing existing 
functionality in the framework

Doc readers want to know what classes are overridable