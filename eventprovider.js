/* global Class */

/* MagicMirror²
 * Module: MMM-Events
 * File:   eventprovider.js
 *
 * By Doug Woolridge https://github.com/dWoolridge
 * MIT Licensed.
 *
 * This class is the blueprint for an event provider.
 */
const EventProvider = Class.extend({
        // Event Provider Properties
        providerName: null,
        defaults: {},

        // The following properties have accessor methods.
        // Try to not access them directly.
        currentEventObject: null,
        fetchedLocationName: null,

        // The following properties will be set automatically.
        // You do not need to overwrite these properties.
        config: null,
        delegate: null,
        providerIdentifier: null,

        // Event Provider Methods
        // All the following methods can be overwritten, although most are good as they are.

        // Called when a event provider is initialized.
        init: function (config) {
                this.config = config;
                Log.info(`Event provider: ${this.providerName} initialized.`);
        },

        // Called to set the config, this config is the same as the event module's config.
        setConfig: function (config) {
                this.config = config;
                Log.info(`Event provider: ${this.providerName} config set.`, this.config);
        },

        // Called when the event provider is about to start.
        start: function () {
                Log.info(`Event provider: ${this.providerName} started.`);
        },

        // This method should start the API request to fetch the events.
        // This method should definitely be overwritten in the provider.
        fetchEventList: function () {
                Log.warn(`Event provider: ${this.providerName} does not subclass the fetchEventList method.`);
        },

        // this returns an array of Event objects for the current event list.
        eventList: function () {
                return this.eventArray;
        },

        // This returns the name of the fetched location or an empty string.
        fetchedLocation: function () {
                return this.fetchedLocationName || "";
        },

        // Set the EventList and notify the delegate that new information is available.
        setEventList: function (eventArray) {
                this.currentEventObject = eventArray; 
        },

        // Set the fetched location name.
        setFetchedLocation: function (name) {
                this.fetchedLocationName = name;
        },


        // Notify the delegate that new events are available.
        updateAvailable: function () {
                this.delegate.updateAvailable(this);
        },

        getCorsUrl: function () {
                if (this.config.mockData || typeof this.config.useCorsProxy === "undefined" || !this.config.useCorsProxy) {
                        return "";
                } else {
                        return location.protocol + "//" + location.host + "/cors?url=";
                }
        },

        // A convenience function to make requests. It returns a promise.
        fetchData: function (url, method = "GET", type = "json", header) {
                url = this.getCorsUrl() + url;
                const getData = function (mockData) {
                        return new Promise(function (resolve, reject) {
                                if (mockData) {
                                        let data = mockData;
                                        data = data.substring(1, data.length - 1);
                                        resolve(JSON.parse(data));
                                } else {
                                        const request = new XMLHttpRequest();
                                        const headerLabel = header.slice(0,header.search(":")).trim(); 
                                        const headerData = header.slice(header.search(":")+1).trim();
                                        request.open(method, url, true);
                                        request.setRequestHeader(headerLabel, headerData);
                                        request.onreadystatechange = function () {
                                                if (this.readyState === 4) {
                                                        if (this.status === 200) {
                                                                if (type === "xml") {
                                                                        resolve(this.responseXML);
                                                                } else {
                                                                        resolve(JSON.parse(this.response));
                                                                }
                                                        } else {
                                                                reject(request);
                                                        }
                                                }
                                        };
                                        request.send();
                                }
                        });
                };
                return getData(this.config.mockData);
        },

        calculateStartDate: function () {
                this.startDate = this.curDate;
                this.startDate = this.startDate.startOf('day');
 
                // Calculate the startDate to filter the array
                if ( this.config.ignoreToday ) {
                        this.startDate = this.startDate.add(1, 'days');
                } 
//                else {
//                        switch ( this.config.type.toLowerCase() ) {
//                                case "nextweek":
//                                        // Find the next Sunday, that becomes the startDate
//                                        this.startDate = this.startDate.add( 7 - this.startDate.day(), 'days');
//                                        break;
//                                case "nextmonth":
//                                        // Find the next first of the Month, that becomes the startDate
//                                        this.startDate = moment(this.curDate.format("YYYY-MM-01"));
//                                        this.startDate = this.startDate.add(1,'M');
//                                        break;
//                                //Make the invalid values use the "Loading..." from events
//                                default:
//                        }
//                }
                this.startDateCalculated = true;
        },

        addThisEventBasedOnStartDate: function (eventStartDate) {
                if ( !this.startDateCalculated ) { this.calculateStartDate(); }
 
                // Skip any dates before startDate
                let tMoment = moment(eventStartDate);
                tMoment = tMoment.startOf('day');
                if ( tMoment.diff(this.startDate, 'days') >=0 ) {
                        return true;
                } else {
                        return false;
                }
        }, 

        addFilters() {
                this.nunjucksEnvironment().addFilter(
                        "formatTime",
                        function (date) {
                                date = moment(date);

                                if (this.config.timeFormat !== 24) {
                                        if (this.config.showPeriod) {
                                                if (this.config.showPeriodUpper) {
                                                        return date.format("h:mm A");
                                                } else {
                                                        return date.format("h:mm a");
                                                }
                                        } else {
                                                return date.format("h:mm");
                                        }
                                }

                                return date.format("HH:mm");
                        }.bind(this)
                );

                this.nunjucksEnvironment().addFilter(
                        "calcNumSteps",
                        function (forecast) {
                                return Math.min(forecast.length, this.config.maxNumberOfDays);
                        }.bind(this)
                );

                this.nunjucksEnvironment().addFilter(
                        "calcNumEntries",
                        function (dataArray) {
                                return Math.min(dataArray.length, this.config.maxEntries);
                        }.bind(this)
                );

                this.nunjucksEnvironment().addFilter(
                        "opacity",
                        function (currentStep, numSteps) {
                                if (this.config.fade && this.config.fadePoint < 1) {
                                        if (this.config.fadePoint < 0) {
                                                this.config.fadePoint = 0;
                                        }
                                        const startingPoint = numSteps * this.config.fadePoint;
                                        const numFadesteps = numSteps - startingPoint;
                                        if (currentStep >= startingPoint) {
                                                return 1 - (currentStep - startingPoint) / numFadesteps;
                                        } else {
                                                return 1;
                                        }
                                } else {
                                        return 1;
                                }
                        }.bind(this)
                );
        }
});

/**
 * Collection of registered event providers.
 */
EventProvider.providers = [];

/**
 * Static method to register a new event provider.
 *
 * @param {string} providerIdentifier The name of the event provider
 * @param {object} providerDetails The details of the event provider
 */
EventProvider.register = function (providerIdentifier, providerDetails) {
        EventProvider.providers[providerIdentifier.toLowerCase()] = EventProvider.extend(providerDetails);
};

/**
 * Static method to initialize a new event provider.
 *
 * @param {string} providerIdentifier The name of the event provider
 * @param {object} delegate The event module
 * @returns {object} The new event provider
 */
EventProvider.initialize = function (providerIdentifier, delegate) {
        providerIdentifier = providerIdentifier.toLowerCase();

        const provider = new EventProvider.providers[providerIdentifier]();
        const config = Object.assign({}, provider.defaults, delegate.config);

        provider.delegate = delegate;
        provider.setConfig(config);

        provider.providerIdentifier = providerIdentifier;
        if (!provider.providerName) {
                provider.providerName = providerIdentifier;
        }

        return provider;
};

