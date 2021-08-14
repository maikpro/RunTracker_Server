const express = require("express");
const router = express.Router();

router.get('/', (req, res) => {
    const date = new Date();
    const hour = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();

    const day = date.getDate();
    const month = date.getMonth()+1;
    const year = date.getFullYear();

    const dateStr = day + "." + (month < 10 ? '0' + month : '' + month) + "." + year;
    
    const timeJSON = {
      "hour": hour,
      "minute": min,
      "seconds": sec,
      "date": dateStr
    }
    res.send( timeJSON );
  });

module.exports = router