/* MagicMirror²
 * Module: MMM-Events
 *
 * By Doug Woolridge https://github.com/dWoolridge
 * MIT Licensed.
 *
 * This class is the blueprint for events to be displayed.
 *
 */
class EventObject {
        /**
         * Constructor for an EventObject
         */
        constructor() {
                this.eventTitle = null;       // String
                this.eventStart = null;       // Date object
                this.eventEnd   = null;       // Date object
                this.eventDescription = null; // String
                this.eventLocation = null;    // String
                this.eventURL = null;         // String
        }

        someFunction() {
                someResult = "something";
                return someResult;
        }
}
