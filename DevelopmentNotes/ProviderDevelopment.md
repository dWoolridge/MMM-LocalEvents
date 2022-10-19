Objects:
  eventArray as EventObject
  

Your event provider must support the following functions:
-fetchedLocation:  Returns the location for event data
-fetchEventList:  Start getting the event data from the provider.  Ultimately call getEventArray when done
-getEventArray:
    Must call this.setEventList(eventArray);
    Must call this.updateAvailable()

The current node_helper includes axios which can return raw HTML from a website.  This would be accomplished by sendSocketNotification("GET_DATA_FROM_URL", url).  This would retrieve the raw data using the headers for Chrome.

When the node_helper finishes retrieving the website, it sends a socketNotification to the main module, which in turn, calls getEventArray in your provider module.
