/* global EventProvider, EventObject */

/* MagicMirror²
 * Module: MMM-Events
 *
 * File:   google.js
 *
 * Provider: google
 *
 * Original by Doug Woolridge
 * MIT Licensed.
 *
 * This class is an event provider for google.com.
 */

EventProvider.register("google", {
        // Set the name of the provider.
        // This isn't strictly necessary, since it will fallback to the provider identifier
        // But for debugging (and future alerts) it would be nice to have the real name.
        providerName: "Google.com",

        // Set the default config properties that is specific to this provider
        defaults: {
                apiBase: "https://google.com/",
                location: "chicago, IL",              // Replace all spaces with '+'
        },

        eventURL: "tbd",
        eventArray: [],

        // Called to set the config, this config is the same as the event module's config.
        setConfig: function (config) {
                this.config = config;
                this.config.apiBase = "https://google.com";
        },

        // Called when the weather provider is about to start.
        start: function () {
                Log.info(`Event provider: ${this.providerName} started.`);
        },

        // This returns the name of the fetched location or an empty string.
        fetchedLocation: function () {
                return this.config.location || "";
	},

        getEventArray: function(payload) {
                this.curDate = moment();
                const eventArray = this.eventArrayFromGooglePage(payload);
                this.setEventList(eventArray);
                this.updateAvailable();
        },

        // Overwrite the fetchEventList method.
        fetchEventList() {
                this.sendSocketNotification("GET_DATA_FROM_URL",this.config.providerURL);
        },

        notificationReceived: function (notification, payload, sender) {
        },


        /** Google.com Specific Methods - These are not part of the default provider methods */

        eventArrayFromGooglePage(pageData) {
                eventArray = [];
                curPos = 0;
                titleEnd = 0;
                var URLdata;

                this.startDateCalculated = false;
                // Find the start of the <div> style data...
                URLdata = this.getSliceFromURL( curPos, 'data-entityname', '=', pageData);

                // TITLE
                URLdata = this.getSliceFromURL( titleEnd, '<div class="bVj5Zb FozYP">', '</div>', pageData);
                titleEnd = URLdata.endPos;
                while ( URLdata.endPos > 0 ) {
                        event = new EventObject();
                        tDate = "";
                        event.eventTitle = this.decodeUnicode(URLdata.sliceText);
                        curPos = titleEnd;

                        // LOCATION
                        URLdata = this.getSliceFromURL( curPos, '<div class="TCYkdd FozYP"><span>', '</span></div>', pageData);
                        if ( URLdata.endPos >= 0 ) {
                                event.eventLocation = this.decodeUnicode(URLdata.sliceText);
                                curPos = URLdata.endPos;
                        }
                        // DATE
                        URLdata = this.getSliceFromURL( curPos, '<div class="t3gkGd"><div>', '</div>', pageData);
                        if ( URLdata.endPos >= 0 ) {
                                tDate = URLdata.sliceText;
                                curPos = URLdata.endPos;
                        }

                        // TIME
                        URLdata = this.getSliceFromURL( curPos, '<div class="oonKPc">', '</div>', pageData);
                        if ( URLdata.endPos >= 0 ) {
                                tDate = tDate + "," + URLdata.sliceText;
                                curPos = URLdata.endPos;
                        }

                        if ( tDate !== "" ) {
                                event.eventStart = this.processDateTime(tDate);
                        }
                        
                        // Skip any dates before startDate
                        if ( this.addThisEventBasedOnStartDate(event.eventStart) ) {
                                eventArray.push(event);
                        }

                        // Next TITLE
                        URLdata = this.getSliceFromURL( titleEnd, '<div class="bVj5Zb FozYP">', '</div>', pageData);
                        titleEnd = URLdata.endPos;
                }

                // Find the start of the class\x3d\x22bVj5Zb FozYP\x22\x3e style data...
                curPos = 0;
                titleEnd = 0;

                // TITLE
                URLdata = this.getSliceFromURL( titleEnd, String.raw`class\x3d\x22bVj5Zb FozYP\x22\x3e`, String.raw`\x3c/div\x3e`, pageData);
                titleEnd = URLdata.endPos;
                while ( URLdata.endPos > 0 ) {
                        event = new EventObject();
                        tDate = "";
                        event.eventTitle = this.decodeUnicode(URLdata.sliceText);
                        curPos = titleEnd;

                        // LOCATION
                        URLdata = this.getSliceFromURL( curPos, String.raw`class\x3d\x22TCYkdd FozYP\x22\x3e\x3cspan\x3e`, String.raw`\x3c`, pageData);
                        if ( URLdata.endPos >= 0 ) {
                                event.eventLocation = this.decodeUnicode(URLdata.sliceText);
                                curPos = URLdata.endPos;
                        }

                        // DATE
                        URLdata = this.getSliceFromURL( curPos, String.raw`\x3cdiv class\x3d\x22t3gkGd\x22\x3e\x3cdiv\x3e`, String.raw`\x3c/div\x3e`, pageData);
                        if ( URLdata.endPos >= 0 ) {
                                tDate = URLdata.sliceText;
                                curPos = URLdata.endPos;
                        }

                        // TIME
                        URLdata = this.getSliceFromURL( curPos, String.raw`\x3cdiv class\x3d\x22oonKPc\x22\x3e`, String.raw`\x3c/div\x3e`, pageData);
                        if ( URLdata.endPos >= 0 ) {
                                tDate = tDate + "," + URLdata.sliceText;
                                curPos = URLdata.endPos;
                        }
                        if ( tDate !== "" ) {
                                event.eventStart = this.processDateTime(tDate);
                        }

                        // Skip any dates before startDate
                        if ( this.addThisEventBasedOnStartDate(event.eventStart) ) {
                                eventArray.push(event);
                        }

                        // Next TITLE
                        URLdata = this.getSliceFromURL( titleEnd, String.raw`class\x3d\x22bVj5Zb FozYP\x22\x3e`, String.raw`\x3c/div\x3e`, pageData);
                        titleEnd = URLdata.endPos;
                }
                return(eventArray);
        },

        getSliceFromURL(startPos, startString, endString, data) {
                var sliceText = "";
                var curPos = 0; 
                var endPos = 0; 

                curPos = data.indexOf(startString,startPos);
                if ( curPos > 0 ) {
                       curPos = curPos + startString.length;
                       endPos = data.indexOf(endString,curPos);
                       if ( endPos > 0 && endPos >= curPos) {
                               sliceText = data.slice(curPos, endPos);
                               ++endPos;
                       } else {
                               sliceText = false;
                               endPos = -1;
                       }
                } else {
                }
                return { sliceText, endPos };
        },
  
        processDateTime: function(tDate) {
                dcurDate = new Date();
                curYear = new Date().getFullYear();
                var datetimeSplit = tDate.split(",");
                if ( datetimeSplit.length > 1 ) {
                        var dateMonthDay = datetimeSplit[1].trim().split(" ");
                        if ( datetimeSplit.length > 2 ) {
                                newDate = new Date(`${dateMonthDay[0]} ${dateMonthDay[1]}, ${curYear} ${datetimeSplit[2]}`);
                        } else {
                                newDate = new Date(`${dateMonthDay[0]} ${dateMonthDay[1]}, ${curYear}`);
                        }

                        if ( newDate.getDate() < dcurDate.getDate() ) {
                                newDate.setFullYear(curYear + 1);
                        }

                }
                return newDate;
        },
        decodeUnicode: function(inStr) {
                inStr = inStr.replace("\\u2019","'");
                inStr = inStr.replace("\\x26","&");
                inStr = inStr.replace("\\x27","'");
                inStr = inStr.replace("&amp;","&");

                return inStr;
        },
})

