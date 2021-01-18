const express = require("express");
const router = express.Router();

// router.get("/", (req, res) => {
//   res.send({ response: "Server is up and running." }).status(200);
// });

router.get("/", (req, res) => {
    const data = {
        data: {
            msg: "Socket API"
        }
    };

    res.json(data);
});

module.exports = router;
