/* MagicMirror²
 * Module: MMM-LocalEvents
 *
 * File:   MMM-LocalEvents.js
 *
 * By Doug Woolridge https://github.com/dWoolridge
 * MIT Licensed.
 */

Module.register("MMM-LocalEvents", {
        // Default module config.
        defaults: {
                eventProvider:  "google",
                providerURL:    "https://www.google.com/search?q=[TYPE]events+[LOCATION]&events&rciv=evn",
                location:       "fond du lac, wi",
                eventType:       "",                 // "sports/movie/theater" leave blank for no filtering

                reloadInterval:  10 * 60 * 1000,     // time to reload event data (in ms -- 10 minutes)
                updateInterval:  10 * 1000,          // time to cycle through pages (in ms -- 10 seconds)
                maxRows:         8,                  // Number of rows to display on the screenN
                maxEvents:       -1,                 // Max number of Events to store (-1 is unlimited)
                cycleEventPages: true,               // If number of events > maxRows, then cycle through pages of events
                animationSpeed:  2 * 1000,           // Set to 0 for no animation (fade-out / fade-in)
 
                timeFormat:       config.timeFormat,
                lang:             config.language,

                ignoreToday:      false,             // Don't list any events ocurring today

                fade:             false,             // Fade out the last several rows 
                fadePoint:        0.75,              // Start on 3/4th of the list.
                initialLoadDelay: 0,                 // 0 seconds delay
                appendLocationNameToHeader: true,    // Add the location: variable to the header
                tableClass:       "small",
                showPeriod:       true,              // Add am/pm to time format
                showPeriodUpper:  false,             // Show as AM / PM rather than am / pm

        },
        
        eventProvider:        null,
        curPageNum:              0,
        lastPageNum:             0,

        curDate:              null,
        startDate:            null,
        startDateCalculated: false,

        // Define required scripts.

        getStyles: function () {
                return ["font-awesome.css", "events.css"];
        },

        // Return the scripts that are necessary for the weather module.
        getScripts: function () {
                return ["moment.js", "eventprovider.js", "eventobject.js", this.file("providers/" + this.config.eventProvider.toLowerCase() + ".js")];
        },

        // Override getHeader method.
        getHeader: function () {
                if (this.config.appendLocationNameToHeader && this.eventProvider) {
                        if (this.data.header) return this.data.header + " for " + this.eventProvider.fetchedLocation();
                        else return this.eventProvider.fetchedLocation();
                }

                return this.data.header ? this.data.header : "";
        },

        // Start the events module.
        start: function () {
                moment.locale(this.config.lang);
                this.curDate = moment();

//                modLocation = "";
//                // Configure this.config.modLocation
//                modLocation = this.config.location.replace(/ /g,'+');
//                modLocation = modLocation.replace(/,/g,'%2C');
//                // Configure the URL
//                this.config.providerURL = this.config.providerURL.replace(/\[LOCATION\]/g,modLocation);

                // Initialize the event provider.
                this.eventProvider = EventProvider.initialize(this.config.eventProvider, this);

                // Let the weather event know we are starting.
                this.eventProvider.start();

                // Add custom filters
                this.addFilters();

                // Schedule the first repload
                this.scheduleReload(this.config.initialLoadDelay);

                // Schedule the first pageupdate
                this.scheduleUpdate(this.config.initialLoadDelay);
        },

        // Override notification handler.
        notificationReceived: function (notification, payload, sender) {
        },

        socketNotificationReceived: function(notification, payload) {
                if (notification === "RECEIVED_DATA_FROM_URL") {
                        this.eventProvider.getEventArray(payload);
                }
        },

        // Select the template depending on the display type.
        getTemplate: function () {
//                switch (this.config.type.toLowerCase()) {
//                        case "upcoming":
//                        case "nextweek":
//                        case "nextmonth":
//                                return "events.njk";
//                        //Make the invalid values use the "Loading..." from events
//                        default:
                        return "events.njk";
//                }
        },

        // Add all the data to the template.
        getTemplateData: function () {
                const eventList = this.eventProvider.eventList();

                return {
                        config: this.config,
                        eventList:  this.eventProvider.currentEventObject
                }
        },

        // What to do when the event provider has new information available?
        updateAvailable: function () {
                Log.log("New event information available.");
                this.curPageNum = 0;
                this.lastPageNum = Math.trunc(this.eventProvider.currentEventObject.length / this.config.maxRows);
                this.updateDom(this.config.animationSpeed);
                this.scheduleReload();

                const notificationPayload = {
                        eventList: this.eventProvider.currentEventObject ?? null,
                        locationName: this.eventProvider.fetchedLocationName,
                        providerName: this.eventProvider.providerName
                };
                this.sendNotification("EVENTLIST_UPDATED", notificationPayload);
        },

        scheduleReload: function (delay = null) {
                let nextLoad = this.config.reloadInterval;
                this.curDate = moment();
                if (delay !== null && delay >= 0) {
                        nextLoad = delay;
                }
                setTimeout(() => {
                                  this.eventProvider.fetchEventList();
                }, nextLoad);
        },

        scheduleUpdate: function () {
                if ( this.config.cycleEventPages && this.config.updateInterval > 0 ) {
                
                        setTimeout(() => {
                                // Update code here
                                if ( this.eventProvider.currentEventObject ) {
                                        ++this.curPageNum;
                                        if ( this.curPageNum * this.config.maxRows >= this.eventProvider.currentEventObject.length ) { 
                                                this.curPageNum = 0;
                                        }
                                        this.updateDom(this.config.animationSpeed);
                                }
                        this.scheduleUpdate();
                        }, this.config.updateInterval);
                }
        },

        addFilters() {
                this.nunjucksEnvironment().addFilter(
                        "formatDate",
                        function (date) {
                                date = moment(date);

                                let dowFilter = "ddd ";
                                let returnDate = "";
 
                                if ( this.curDate.format("DD") == date.format("DD") ) {
                                        dowFilter = "";
                                        returnDate = "Today";
                                }


                                if ( (this.curDate.dayOfYear() + 1) == date.dayOfYear()  ) {
                                        dowFilter = "";
                                        returnDate = "Tomorrow";
                                }
                                if ( dowFilter !== "" ) {
                                        returnDate = date.format(`${dowFilter}`);
                                }
                                return returnDate.trim();
                        }.bind(this)
                );

                this.nunjucksEnvironment().addFilter(
                        "formatTime",
                        function (date) {
                                date = moment(date);

                                let hourFilter = "HH";
                                let minFilter = ":mm";
                                let amPmFilter = "";
                                let returnDate = "";

                                if (this.config.timeFormat !== 24) {
                                        hourFilter = "h";
                                        if (this.config.showPeriod) {
                                                if (this.config.showPeriodUpper) {
                                                        amPmFilter = "A";
                                                } else {
                                                        amPmFilter = "a";
                                                }
                                        }

                                        if ( date.minute() == 0 ) {
                                                minFilter = "";
                                        }

                                return date.format(`${hourFilter}${minFilter}${amPmFilter}`);
                                }
                        }.bind(this)
                );

                this.nunjucksEnvironment().addFilter(
                        "calcStartEntry",
                        function (dataArray) {
                                return ( this.curPageNum * this.config.maxRows );
                        }.bind(this)
                );
                this.nunjucksEnvironment().addFilter(
                        "calcEndEntry",
                        function (dataArray) {
                                if (this.config.maxEvents <= 0) {
                                        tempMaxEvents = 999;
                                } else {
                                        tempMaxEvents = this.config.maxEvents;
                                }
                                return Math.min( (this.curPageNum+1)*this.config.maxRows, dataArray.length, tempMaxEvents );
                        }.bind(this)
                );

                this.nunjucksEnvironment().addFilter(
                        "opacity",
                        function (currentStep) {
                                if ( this.curPageNum == this.lastPageNum ) {
                                        if (this.config.fade && this.config.fadePoint < 1) {
                                                if (this.config.fadePoint < 0) {
                                                        this.config.fadePoint = 0;
                                                }
                                                const startingPoint = this.config.maxRows * ( 1 - this.config.fadePoint);
                                                const numFadesteps = this.config.maxRows - startingPoint;

                                                if (currentStep >= startingPoint) {
                                                        return 1 - (currentStep - startingPoint) / numFadesteps;
                                                } else {
                                                        return 1;
                                                }
                                        } else {
                                                return 1;
                                        }
                                }

                        }.bind(this)
                );
        },
});


