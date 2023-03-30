'use strict';

const express = require('express');
const router = express.Router();
const { debug, info, warn, error } = require('portal-env').Logger('kickstarter:businessSegments');

const utils = require('./utils');

router.get('/', function (req, res, next) {
    const businessSegments = utils.loadBusinessSegments(req.app);
    console.log(businessSegments);
    const glob = utils.loadGlobals(req.app);

    // Remove old alt_ids if present, add explicit properties
    businessSegments.business_segments.forEach(b => {
        if (b.hasOwnProperty('alt_ids'))
            delete b.alt_ids;
    });

    res.render('businessSegments', {
        glob: glob,
        configPath: req.app.get('config_path'),
        businessSegments: businessSegments,
    });
});

router.post('/api', function (req, res, next) {
    const body = utils.getJson(req.body);
    const businessSegments = body.businessSegments;
    console.log(businessSegments);
    
    // Check if adding duplicate Ids
    const ids ={};
    let hasDuplicateKeys = false;


    for (const segment of businessSegments.business_segments) {
       if(ids[segment.id]){
        hasDuplicateKeys =true;break;
       }
       ids[segment.id]=true;
    }
    if(hasDuplicateKeys){
        console.log('Duplicate');
        res.status(500).send('Duplicate Segments , Cannot save');
    }else{
    utils.saveBusinessSegment(req.app, businessSegments);
    }


    // Write changes to Kickstarter.json
    const kickstarter = utils.loadKickstarter(req.app);
    kickstarter.groups = 3;
    utils.saveKickstarter(req.app, kickstarter);

    res.json({ message: "OK" });
});

module.exports = router;
