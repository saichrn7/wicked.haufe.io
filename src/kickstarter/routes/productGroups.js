'use strict';

const express = require('express');
const router = express.Router();
const { debug, info, warn, error } = require('portal-env').Logger('kickstarter:productGroups');

const utils = require('./utils');

router.get('/', function (req, res, next) {
    const productGroups = utils.loadProductGroups(req.app);
    const glob = utils.loadGlobals(req.app);
    console.log(productGroups);
    // Remove old alt_ids if present, add explicit properties
    productGroups.product_groups.forEach(b => {
        if (b.hasOwnProperty('alt_ids'))
            delete b.alt_ids;
    });

    res.render('productGroups', {
        glob: glob,
        configPath: req.app.get('config_path'),
        productGroups: productGroups,
    });
});

router.post('/api', function (req, res, next) {
    const body = utils.getJson(req.body);
    const productGroups = body.productGroups;
 
    // Check if adding duplicate Ids
    const ids ={};
    let hasDuplicateKeys = false;


    for (const group of productGroups.product_groups) {
       if(ids[group.id]){
        hasDuplicateKeys =true;break;
       }
       ids[group.id]=true;
    }
    if(hasDuplicateKeys){
        console.log('Duplicate');
        res.status(500).send('Duplicate Segments , Cannot save');
    }else{
    utils.saveProductGroups(req.app, productGroups);
    }


    // Write changes to Kickstarter.json
    const kickstarter = utils.loadKickstarter(req.app);
    kickstarter.groups = 3;
    utils.saveKickstarter(req.app, kickstarter);

    res.json({ message: "OK" });
});

module.exports = router;
