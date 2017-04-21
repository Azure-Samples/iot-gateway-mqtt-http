(function() {
  'use strict';

  const Gateway = require('azure-iot-gateway');
  const gw = new Gateway('gw.config.json');
  gw.run();
})();
