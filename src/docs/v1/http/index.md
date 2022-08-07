## Introduction

For making HTTP requests, Suphle provides the `BaseHttpRequest` class. It doesn't compete with libraries like Guzzle or HttPlug for functionality regarding outgoing requests. It also isn't a platform for writing SDKs. It's primary objective is to sequester:

1. The application/domain from the clumsiness of outgoing links, payloads etc
1. The request itself from data relevant to the application/consumer. Aside distilling data, this gives the additional advantage of testing these parts of our program using whatever data we please, simulating errors, etc.

We may have other needs that intersect with those listed earlier under [ModellessPayload](controllers/services/section)s. For this reason, they both implement the same interfaces but with slightly diverging implementations