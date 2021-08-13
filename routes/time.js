const express = require("express");
const router = express.Router();

router.get('/', (req, res) => {
    const date = new Date();
    const hour = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();
    
    const timeJSON = {
      "hour": hour,
      "minute": min,
      "seconds": sec
    }
    res.send( timeJSON );
  });

module.exports = router