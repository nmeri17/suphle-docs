## Introduction
We know we can either write our tests before or after implementing underlying code. The former is already clear enough, but the latter is ambiguous. The development cycle is fairly broad, and "after" can pretty much be anytime. There are a few drivers to bear in mind while deferring testing to a later date

## bite-sized driver
Don't accumulate so much untested code that its eventual testing becomes monotonous and daunting. Systems under test are usually 3 times bulkier than the code testing them. On average, try not to exceed 3 modified classes or methods before losing track of system's functional state

## exposure driver
There is a limited subset of users who should ever interact with unverified software. That list often contains the feature developer, and occasionally, collaborators. This means that whenever your work is to be merged either into master, production, something a teammate should continue from, it's expected to be stable. You usually don't want to work for long without frequent pulls, to prevent tedious reviews /merges. Depending on your team's velocity, this driver reminds you not to introduce regressions into teammates workflows

*cascade on delete
Using migrations deletes it on the database level and isn't supported on all database engines. We will have to sacrifice soft deletes since that's an application based concept. Model observers on the other hand, address these issues when used properly ie after determining authorization, it's a safe location to gather all relations and mark them as deleted. But for any generic solution to this problem to bear any fruit, you must promise not to delete any models using shortcuts such as a DBMS