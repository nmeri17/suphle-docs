## Introduction

We know we can either write our tests before or after implementing underlying code. The former is crystal clear, but the latter can both be ambiguous and subjective. Because the development cycle is fairly broad, "after" can pretty much refer to *any time*, including those not so advisable.

Below, we discuss a few drivers to bear in mind while deferring testing to a later date, or while planning to write tests after implementation.

## Bite-sized driver

This driver dissuades the developer from putting off testing until development of the entire software is complete. The likelihood of . The retrofitted tester should endeavor never to accumulate so much untested code that their eventual testing becomes monotonous and daunting, because the risk of abandoning test automation is higher when that route taken.

Systems under test are usually 3 times bulkier than the code testing them. This means that on average, try not to exceed 3 modified classes or methods before covering those additions in relevant tests. Doing so will equally prevent the tester from losing track of system's intended behavior.

## Exposure driver

There is a limited subset of users who should ever interact with unverified functionality. That list often contains the feature developer and occasionally, his collaborators. This means that whenever your work is to be merged either into master, production, something a teammate should continue from, they least those collaborators can ask for is for it to be stable.

You usually don't want to work for long without frequent pulls, to prevent tedious reviews/merges. Depending on your team's velocity, this driver reminds you not to introduce regressions into teammates' workflows, by testing whatever quantity of modifications have been meted out at your end, prior to its exposure to others.