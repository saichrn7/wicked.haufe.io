'use strict';

const express = require('express');
const router = express.Router();
const utils = require('./utils');
const { debug, info, warn, error } = require('portal-env').Logger('kickstarter:index');

/* GET home page. */
router.get('/', function (req, res, next) {
    const kickstarter = utils.loadKickstarter(req.app);
    res.render('index',
        {
            configPath: req.app.get('config_path'),
            kickstarter: kickstarter
        });
});

router.post('/', function (req, res, next) {
    const redirect = req.body.redirect;

    // Do things with the POST body.

    res.redirect(redirect);
});

//get help page
router.get('/plugindocs', function (req, res) {
    const plugin_doc = JSON.parse(JSON.stringify(utils.getPluginSwagger()))
    for(let elem of plugin_doc.data) {
      elem.config = {name : elem.name,config:elem.config}
    }
    console.log(JSON.stringify(plugin_doc))
    res.render('help',
        {
            p_data: plugin_doc.data
        });
});
module.exports = router;
