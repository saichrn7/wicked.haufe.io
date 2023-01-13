var sample_plugins = {

    "data" : [
        {
            "name" : "url-replace",
            "config" : {
                  "replacement" : [
                    {
                      "search": "/api/",
                      "replace": "/"
                    },
                    {
                      "search": "/apifoo/",
                      "replace": "/bar"
                    }
                  ]
                },
            "description" : "This plugin replaces the string value in path according to the rules provided in config"
        },
        {
            "name" : "eureka-router",
            "config" : {
                "vipAddress" : "1pauth.{CLOUD_STACK}.{CLOUD_DEV_PHASE}.{CLOUD_ENVIRONMENT}"
                },
            "description" : "This plugin routes the incoming request to microservices registered in clarivate"
        },
        {
            "name" : "request-transformer",
            "config": {
                         "remove": {
                            "headers": [
                               "x-toremove",
                               "x-another-one"
                            ]
                         },
                         "replace": {
                            "body": [
                               "body-param1:new-value-1",
                               "body-param2:new-value-2"
                            ]
                         },
                         "rename": {
                            "headers": [
                               "header-old-name:header-new-name",
                               "another-old-name:another-new-name"
                            ]
                         },
                         "add": {
                            "headers": [
                               "x-new-header:value",
                               "x-another-header:something"
                            ]
                         }
            },
            "description" : "This plugin routes the incoming request to microservices registered in clarivate"
        },
        {
            "name": "cors",
            "config": {
               "origins": [
                  "http://mockbin.com"
               ],
               "methods": [
                  "GET",
                  "POST"
               ],
               "headers": [
                  "Accept",
                  "Accept-Version",
                  "Content-Length",
                  "Content-MD5",
                  "Content-Type",
                  "Date",
                  "X-Auth-Token"
               ],
               "exposed_headers": [
                  "X-Auth-Token"
               ],
               "credentials": true,
               "max_age": 3600
            },
            "description" : "This plugin is used to configure cors policy"
        },
        {
            "name": "ip-restriction",
            "config": {
               "allow": [
                  "54.13.21.1",
                  "143.1.0.0/24"
               ],
               "deny" : [
                "5.3.21.1",
                "1.4.0.0/23"
               ],
               "status" : 200,
               "message" : "some custom message to be returned to user with desired status code above"
            },
            "description" : "This plugin is for restricting the ips"
        },
        {
            "name": "rate-limiting",
            "config": {
               "second": 5,
               "hour": 10000,
               "policy": "local",
               "day" : 200000,
               "month" : 100000,
               "year" :600000,
               "limit_by" :"header",
               "header_name" : "some dummy header",
               "path" :"Path to be used if limit_by is set to path"
            },
            "description" : "This plugin is for limiting the requests according to time metrics.For more info visit https://docs.konghq.com/hub/kong-inc/rate-limiting/2.8.x.html"
        },
        {
            "name": "request-size-limiting",
            "config": {
               "allowed_payload_size": 128, 
               "require_content_length": false,
               "size_unit" : "kilobytes",
               "require_content_length" : true 
            },
            "description" : "Block incoming requests whose body is greater than a specific size in megabytes/kilobytes/bytes.Visit https://docs.konghq.com/hub/kong-inc/request-size-limiting/2.8.x.html"
        },
        {
            "name": "request-termination",
            "config": {
               "status_code": 403,
               "message": "So long and thanks for all the fish!"
            },
            "description" : "This plugin terminates incoming requests with a specified status code and message. This can be used to (temporarily) stop traffic on a Service or a Route.https://docs.konghq.com/hub/kong-inc/request-termination/2.8.x.html"
        }
    ]

}

module.exports = sample_plugins