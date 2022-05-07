## Error Handling

In practice, it's highly important that we test our application's shutdown function. There is a saying that "to have peace, we must prepare for war". If peradventure, an unfortunate event cause application to terminate abruptly, and in its dying breath, it attempts to send an SOS to the external error logger, and that fails too, we can either blurt error to user, assuming he is the developer, or keep mum altogether and pretend nothing happened. In both cases, we will arrive at the same point we were before we set out to alert app maintainer on system malfunction

// show how to throw things at shutdown

We need to take an action with the greatest chance of leaving evidence behind. Writing to a file is relatively reliable but is insufficient since it doesn't actually call anybody to action. By default, we combine both to complement each other. If this outcome doesn't suit, you can override the `disgracefulShutdown` method. Bear in mind that the less fancy action taken here is, the safer for all parties. Assume all else has failed and this is the last ditch of last ditches. The fewer dependencies/IO required to execute this step, the better