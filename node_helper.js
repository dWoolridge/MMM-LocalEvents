const NodeHelper = require('node_helper');
const axios = require('axios');

module.exports = NodeHelper.create({

    start: function()
    {
        console.log("Starting node_helper for: " + this.name);
    },

    lastResults: [],

    getDataFromURL: function(url)
    {
       let self = this;

       axios( {
         url:              url,
         method:          'get',
         headers: {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'},
         responseType:    'text',
         maxContentLength: Infinity,
         maxBodyLength:    Infinity
       })
           .then(function(response){
                tempPayload = response.data;
                tempPayload = tempPayload.replace(/[\u202f]/g,' ');

                self.sendSocketNotification('RECEIVED_DATA_FROM_URL', tempPayload);
           }).catch(function(err){
                self.sendSocketNotification('RECEIVED_DATA_FROM_URL', "null");
           });
    },

    initializedGetData: false,

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'GET_DATA_FROM_URL')
        {
            this.getDataFromURL(payload);
        }
    }
});
