'use strict';

/* global storeData, marked, alert, btoa, Vue, $ */
/* eslint-disable no-console */

function randomId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function showEnvVar(envVarNameIncludingDollar) {
    // alert('show env var ' + envVarName);
    let envVarName = envVarNameIncludingDollar.substring(1);
    if (envVarName.startsWith('{') && envVarName.endsWith('}'))
        envVarName = envVarName.substring(1, envVarName.length - 1);
    $.getJSON('/api/envs?env_var=' + envVarName).fail(function () {
        alert('Could not retrieve env var from backend.');
    }).done(function (data) {
        $('#modalTitle').text('Env var ' + envVarName);
        let tabs = `<li class="active"><a data-toggle="tab" href="#tab_default">default</a></li>`;
        let content = `
            <div class="tab-pane fade in active" id="tab_default">
                <div class="panel-content">
                    <p></p>
                    <p>${data.envs['default'].defined ? '<code>' + data.envs['default'].value.value + '</code>' : '(undefined)'}</p>
                    <p>${data.envs['default'].defined && data.envs['default'].value.encrypted ? 'This variable is encrypted at rest.' : ''}</p>
                    <p><a target="_blank" href="/envs/default">Open environment &quot;default&quot;</a>.</p>
                </div>
            </div>`;
        for (let e in data.envs) {
            if (e === 'default')
                continue;
            tabs += `<li><a data-toggle="tab" href="#tab_${e}">${e}</a></li>`;
            content += `
                <div class="tab-pane fade" id="tab_${e}">
                    <div class="panel-content">
                        <p></p>
                        <p>${data.envs[e].defined && data.envs[e].value.inherited ? 'Inherited from <code>default</code>.' : ''}</p>
                        <p>${data.envs[e].defined ? '<code>' + data.envs[e].value.value + '</code>' : '(undefined)'}</p>
                        <p>${data.envs[e].defined && data.envs[e].value.encrypted ? 'This variable is encrypted at rest.' : ''}</p>
                        <p><a target="_blank" href="/envs/${e}">Open environment &quot;${e}&quot;</a>.</p>
                        </div>
                </div>`;
        }
        $('#modalContent').html(`
            <ul class="nav nav-tabs">
                ${tabs}
            </ul>

            <div class="tab-content">
                ${content}
            </div>
          `);
        $('#modalDialog').modal();
    });
}

function makeEnvVar(envVarName, value, encrypt, callback) {
    $.ajax({
        method: 'POST',
        url: '/api/envs/default',
        contentType: 'application/json',
        data: JSON.stringify({
            name: envVarName,
            value: value,
            encrypted: encrypt
        })
    }).fail(function (err) {
        return callback(err);
    }).done(function () {
        return callback(null);
    });
}

function showEnvExplanation() {
    alert('This input value can, or should not, be provided as an environment variable.');
}

Vue.component('wicked-toggle-button', {
  props: ['width', 'name', 'toggled'],
  data: function () {
      return {
          isToggled: this.toggled ? true : false,
          internalId: randomId()
      }
  },
  computed: {
      buttonWidth: function() {
          return this.width && this.width.match(/^([0-9]+)?(px|em)?$/g) || '5em';
      }
  },
  methods: {
      reportToggle: function(event) {
          this.$emit('toggle', event.currentTarget);
      }
  },
  template: `
      <label :id="name" class="btn btn-default" :class="{active: isToggled}" :style="'width:' + buttonWidth">
          <input v-on:click="reportToggle" type="checkbox" style="display: none;" :id="internalId" :value="name" v-model="isToggled"><span v-html="name"></span></input>
      </label>
  `
});

Vue.component('wicked-toggle-array', {
    props: ['value', 'label', 'options', 'width', 'hint'],
    data: function() {
        let selection = {};
        for(let i = 0; this.value && i < this.value.length; i += 1) {
            selection[this.value[i]] = true;
        }
        return {
          checkedNames: selection,
          internalId: randomId()
        };
    },
    computed: {
      displayData: function() {
        return this.options && this.options.split(/\s*,\s*/);
      }
    },
    methods: {
      toggle: function(event) {
        if(event && event.tagName === 'INPUT') {
          this.checkedNames[event.value] = !this.checkedNames[event.value];

          let result = [];
          Object.keys(this.checkedNames).forEach( k => {
            if ( this.checkedNames[k] ) {
                result.push(k);
            }
          });

          this.$emit('input', result);
        }
      },
      isToggled: function(key) {
          return key && this.checkedNames[key];
      }
    },
    template: `
        <div>
            <label>{{label}}</label>
            <div class="panel panel-default">
                <div class="panel-body">
                    <wicked-toggle-button v-for="(s, index) in displayData" v-bind:key="s" :toggled="isToggled(s)" v-on:toggle="toggle" :id="internalId + '.' + index" :name="s" :width="width"/>
                    <div v-if="hint !== null">
                        <span class="wicked-note" v-html="hint"></span>
                    </div>
                </div>
            </div>
        </div>
    `
});


Vue.component('wicked-panel', {
    props: {
        type: String,
        title: String,
        open: {
            type: Boolean,
            default: false
        },
        showDelete: {
            type: Boolean,
            default: false
        },
        collapsible: {
            type: Boolean,
            default: true
        }
    },
    data: function () {
        // alert('open: ' + this.open + '( ' + this.title + ')');
        const isCollapsible = this.collapsible;
        const isOpen = this.open || !isCollapsible;
        return {
            isCollapsible: isCollapsible,
            isOpen: isOpen,
            internalId: randomId()
        };
    },
    methods: {
        deleteClick: function () {
            this.$emit('delete');
        }
    },
    template: `
        <div :class="'panel panel-' + type">
            <div class="panel-heading">
                <table width="100%">
                    <tr>
                        <td width="70%">
                            <h4 class="panel-title">
                                <a v-if="isCollapsible" data-toggle="collapse" :href="'#' + internalId">{{ title + ' &#x21E9;' }}</a>
                                <span v-if="!isCollapsible">{{ title }}</span>
                            </h4>
                        </td>
                        <td style="text-align:right" width="30%">
                            <button v-if="showDelete" v-on:click="deleteClick" style="text-align:right;" class="btn btn-sm btn-danger">Delete</button>
                            <span v-if="!showDelete">&nbsp;</span>
                        </td>
                    </tr>
                </table>
            </div>
            <div :id="internalId" :class="{ collapse: true, 'panel-collapse': true, in: isOpen }">
                <div class="panel-body">
                    <slot></slot>
                </div>
            </div>
        </div>
    `
});

Vue.component('wicked-input', {
    props: ['label', 'readonly', 'number', 'value', 'envVar', 'hint', 'textarea', 'json', 'height'],
    data: function () {
        const isReadOnly = typeof this.readonly !== 'undefined';
        const isTextarea = typeof this.textarea !== 'undefined';
        const isNumber = typeof this.number !== 'undefined';
        const isJson = typeof this.json !== 'undefined';
        const envVarName = typeof this.envVar === 'string' && this.envVar !== '' ? this.envVar : null;
        const textareaHeight = typeof this.height === 'string' && this.height !== '' ? this.height : '100px';
        return {
            internalId: randomId(),
            isReadOnly: isReadOnly,
            isNumber: isNumber,
            isTextarea: isTextarea,
            textareaHeight: textareaHeight,
            isJson: isJson,
            isValidInput: true,
            envVarName: envVarName
        };
    },
    computed: {
        showEnvVar: function () {
            if (!this.envVarName)
                return false;
            if (this.isReadOnly)
                return false;
            if (this.hasEnvVar)
                return false;
            return true;
        },
        hasEnvVar: function () {
            if (this.value && typeof this.value === 'string')
                return this.value.startsWith('$');
            return false;
        }
    },
    methods: {
        makeVar: function (event) {
            const instance = this;
            makeEnvVar(this.envVarName, this.value, false, function (err) {
                if (err) {
                    alert('Could not create env var in environment "default": ' + err.message);
                    console.error(err);
                    return;
                }
                // Replace with env var name instead; this looks counterintuitive, but works.
                instance.$emit('input', `\${${instance.envVarName}}`);
            });
        },
        makeEncryptedVar: function (event) {
            const instance = this;
            makeEnvVar(this.envVarName, this.value, true, function (err) {
                if (err) {
                    alert('Could not create env var in environment "default": ' + err.message);
                    console.error(err);
                    return;
                }
                // Replace with env var name instead; this looks counterintuitive, but works.
                instance.$emit('input', `\${${instance.envVarName}}`);
            });
        },
        showVar: function (event) {
            showEnvVar(this.value);
        },
        showExplanation: function (event) {
            showEnvExplanation();
        },
        verifyValue: function (value) {
            if (this.isJson) {
                try {
                    JSON.parse(value);
                    this.isValidInput = true;
                } catch (err) {
                    this.isValidInput = false;
                }
            }
            else if(this.isNumber) {
                this.isValidInput = !isNaN(value);

                //submit number type
                if(this.isValidInput) {
                    value = Number(value);
                }
            }
            this.$emit('input', value);
        }
    },
    template: `
        <div class="form-group">
            <label :for="internalId"><span v-html="label"></span></label>
            <div v-if="!isTextarea" class="input-group">
                <input :id="internalId" class="form-control"
                    type="text"
                    :readonly=readonly
                    v-bind:value="value"
                    v-on:input="verifyValue($event.target.value)">
                <p v-if="isNumber && !isValidInput"><span style="color:red; font-weight:bold;">ERROR:</span> Content is not valid Number.</p>
                <span class="input-group-btn">
                    <div v-if="showEnvVar" class="dropdown">
                        <button class="btn btn-warning dropdown-toggle" type="button" :id="internalId + '_dd'" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                            Create ENV var
                            <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu" :aria-labelledby="internalId + '_dd'">
                            <li><a v-on:click="makeVar" role="button">Create ENV variable</a></li>
                            <li><a v-on:click="makeEncryptedVar" role="button">Create <b>encrypted</b> ENV variable</a></li>
                            <li role="separator" class="divider"></li>
                            <li class="dropdown-header">Default env var name: {{ envVar }}</li>
                        </ul>
                    </div>
                    <button v-else-if="hasEnvVar" class="btn btn-success" v-on:click="showVar">Show ENV var</button>
                    <button v-else class="btn btn-default" v-on:click="showExplanation">?</button>
                </span>
            </div>
            <div v-if="isTextarea" class="form-group">
                <textarea :id="internalId"
                          class="form-control"
                          :readonly=readonly
                          :value="value"
                          :style="'height:' + textareaHeight"
                          v-on:input="verifyValue($event.target.value)"
                >{{ value }}</textarea>
                <p v-if="isJson && !isValidInput"><span style="color:red; font-weight:bold;">ERROR:</span> Content is not valid JSON.</p>
                <div v-if="!isJson">
                    <p></p>
                    <button v-if="showEnvVar" class="btn btn-warning" v-on:click="makeVar">Make ENV var</button>
                    <button v-else-if="hasEnvVar" class="btn btn-success" v-on:click="showVar">Show ENV var</button>
                </div>
            </div>
            <div v-if="hint !== null">
                <span class="wicked-note" v-html="hint"></span>
            </div>
        </div>
    `
});

Vue.component('wicked-checkbox', {
    props: ['value', 'label'],
    template: `
        <div class="checkbox">
            <label>
                <input v-bind:checked="value" v-on:change="$emit('input', $event.target.checked)" type="checkbox"><span v-html="label"></span></input>
            </label>
        </div>
    `
});

Vue.component('wicked-string-array', {
    props: ['value', 'label', 'allow-empty', 'hint'],
    data: function () {
        // Create a copy of the thing
        const values = this.value ? JSON.parse(JSON.stringify(this.value)) : [];
        let allowEmptyArray = false;
        if (this.allowEmpty) {
            if (typeof this.allowEmpty !== 'boolean') {
                alert('Use :allow-empty=<true|false> to pass in a boolean; defaulting to false');
            } else {
                allowEmptyArray = this.allowEmpty;
            }
        }
        return {
            allowEmptyArray: allowEmptyArray,
            internalId: randomId(),
            values: values
        };
    },
    methods: {
        updateValue: function (event) {
            this.$emit('input', this.values);
        },
        addString: function (event) {
            this.values.push('');
            this.$emit('input', this.values);
        },
        deleteString: function (index) {
            if (this.values.length <= 1 && !this.allowEmptyArray) {
                alert('You cannot delete the last value. There must be at least one value.');
                return;
            }
            this.values.splice(index, 1);
            this.$emit('input', this.values);
        }
    },
    template: `
        <div>
            <label>{{label}}</label>
            <div class="panel panel-default">
                <div class="panel-body">
                    <div v-for="(s, index) in values" class="input-group" style="padding-bottom: 5px">
                        <input v-on:input="updateValue" v-model="values[index]" class="form-control" />
                        <span class="input-group-btn">
                            <button v-on:click="deleteString(index)" :id="internalId + '.' + index" class="btn btn-danger" type="button"><span class="glyphicon glyphicon-remove"></span></button>
                        </span>
                    </div>
                    <div v-if="hint !== null">
                        <span class="wicked-note" v-html="hint"></span>
                    </div>
                    <button v-on:click="addString" class="btn btn-success" type="button"><span class="glyphicon glyphicon-plus"></span></button>
                </div>
            </div>
        </div>
    `
});

// changes in the routes section to process routes..

Vue.component('wicked-routes', {
    props: ['value', 'width'],
    data: function () {
        return {
            internalId: randomId(),
            values: this.value.routes,
            route_plugin_status: this.value.enable_routes
        };
    },
    methods: {
        addRoute: function (event) {
            this.values.push({
               strip_path: true,
               preserve_host: false,
               // TODO: removing for now, need to rethink the whole concept
               // plugins: [],
               protocols: [],
               methods: []
            });
            if(this.route_plugin_status) {
                this.addRouteNames()
            } else {
                this.removeRouteNames()
            }
            this.value.routes=this.values
            this.$emit('input', this.value);
        },
        deleteRoute: function (index) {
            if (this.values.length <= 1) {
                alert('You cannot delete the last route. There must be at least one value.');
                return;
            }
            this.values.splice(index, 1);
            this.value.routes=this.values
            this.$emit('input', this.value);
        },
        routePluginEnabled: function(routeChkboxStatus) {
            if(routeChkboxStatus) {
             this.route_plugin_status=true
             this.addRouteNames()
            } else {
             this.route_plugin_status=false
             this.removeRouteNames()
            }
            return
         },
        addRouteNames : function() {
            for(let elem_index in this.values) {
                let route_element = this.values[elem_index]
                if(!route_element.name) {
                  route_element.name = this.value.name + '-route-' + Math.floor(Math.random() * (10000 - this.values.length+1)) + this.values.length  ;
                }
            }
            this.$emit('input', this.value);
        },
        removeRouteNames : function() {
            for(let route_element of this.values) {
                route_element.name = null
            }
            this.$emit('input', this.value);
        }
    },
    template: `
        <wicked-panel title="API Routes" type="default" :collapsible=false :open=true>
        <wicked-checkbox v-model="value.enable_routes" v-on:input="routePluginEnabled" label="<b>Enable Route Plugins</b>. Check this box if you want to enable route level plugins." />
            <div v-for="(route, index) in values">
                <div class="panel panel-default">
                    <button v-if="index > 0" v-on:click="deleteRoute(index)" :id="internalId + '.' + index" class="btn btn-danger pull-right" type="button"><span class="glyphicon glyphicon-remove"></span></button>
                    <div class="panel-body">
                        <wicked-input v-model="route.name" :readonly=true v-if="route_plugin_status" label="Route Name:"/>
                        <wicked-string-array v-model="route.paths" :allow-empty=false label="Paths:" hint="A list of paths that match this Route. For example: <code>/my-path</code>. At least one of <code>hosts</code>, <code>paths</code> or <code>methods</code> must be set." />
                        <wicked-checkbox v-model="route.strip_path" label="<b>Strip Uri</b>. Check this box if you don't want to pass the uri to the backend URL as well. Normally you wouldn't want that." />
                        <wicked-checkbox v-model="route.preserve_host" label="<b>Preserve Host</b>. Preserves the original <code>Host</code> header sent by the client, instead of replacing it with the hostname of the <code>upstream_url</code>." />
                        <wicked-panel title="Advanced Settings" type="default" :collapsible=true :open=false>
                          <wicked-string-array v-model="route.hosts" :allow-empty=true label="Hosts:" hint="A list of domain names that match this Route. For example: <code>example.com</code>. By default it will use <code>APIHOST</code>. At least one of <code>hosts</code>, <code>paths</code> or <code>methods</code> must be set." />
                          <wicked-toggle-array v-model="route.protocols" options="HTTP,HTTPS" width="6em" label="Protocols:" hint="A list of the protocols this Route should allow. By default it is <code>HTTP, HTTPS</code> which means that the Route accepts both."/>
                          <wicked-toggle-array v-model="route.methods" options="GET,HEAD,POST,PUT,PATCH,DELETE" width="6em" label="Methods:" hint="A list of HTTP methods that match this Route. By default it is all. At least one of <code>hosts</code>, <code>paths</code> or <code>methods</code> must be set."/>
                          <!-- <wicked-input v-model="route.plugins" :textarea=true :json=true label="Plugin configuration for this Route:" height="30em" hint="Plugin configuration that will be applied for this Route"/> -->
                        </wicked-panel>
                    </div>
                </div>
            </div>
        <button v-on:click="addRoute" class="btn btn-success" type="button"><span class="glyphicon glyphicon-plus"></span></button>
        </wicked-panel>

    `
});

Vue.component('wicked-plugins', {
    props: ['value', 'hint', 'envPrefix', 'disableAwsLambda', 'disableCors','config'],
    data: function () {
        const disableAwsLambda = typeof this.disableAwsLambda !== 'undefined';
        const disableCors = typeof this.disableCors !== 'undefined';
        let wicked_plugins ={
            'rate-limiting': false,
            'cors': false,
            'jwt': false,
            'aws-lambda': false,
            'url-replace': false,
            'eureka-router': false,
            'session-validation' :false,
            'keyauth-entitlement' : false,
            'wos-session-auth' : false,
            'other-plugins': false,
            'auth-extensions':false

        }
        let service_plugins_data = {plugin_data : [] ,active_plugins : JSON.parse(JSON.stringify(wicked_plugins))}
        let route_plugin_section_toggle = this.config.api.routes[0].name ? true : false
        let routes_plugins_panel_data = {}
        // get the route level plugins
        for(let j=0;j<this.config.api.routes.length; j++ ) {
            console.log(this.config.api.routes)
            let route_elem = this.config.api.routes[j]
            let otherRoutePlugins = []
            let active_route_plugins = route_elem.plugins
            routes_plugins_panel_data[route_elem.name] = {plugin_data:[],active_plugins : JSON.parse(JSON.stringify(wicked_plugins))}
            if(active_route_plugins && active_route_plugins.length > 0) {
                route_plugin_section_toggle = true
                for(let i=0;i<active_route_plugins.length;i++) {
                        let plugin_conf = active_route_plugins[i]
                        if(!wicked_plugins.hasOwnProperty(plugin_conf.name)) {
                            routes_plugins_panel_data[route_elem.name].active_plugins['other-plugins'] = true
                            otherRoutePlugins.push(plugin_conf)
                            continue;   
                        }
                        routes_plugins_panel_data[route_elem.name].plugin_data.push(plugin_conf)
                        routes_plugins_panel_data[route_elem.name].active_plugins[plugin_conf.name]=true    
                }

            }
            if(otherRoutePlugins.length > 0) {
                routes_plugins_panel_data[route_elem.name].plugin_data.push({name : 'other-plugins', config : otherRoutePlugins})
            }

        }
        //similarly get the service plugins...
        let otherServicePlugins = []
        for(let j=0;j<this.config.plugins.length; j++ ) { 

            let plugin_obj = this.config.plugins[j]
            if(!wicked_plugins.hasOwnProperty(plugin_obj.name)) {
                service_plugins_data.active_plugins['other-plugins'] = true
                otherServicePlugins.push(plugin_obj)
                continue;   
            }
            service_plugins_data.active_plugins[plugin_obj.name] = true
            service_plugins_data.plugin_data.push(plugin_obj)
        }
        if(otherServicePlugins.length > 0) {
            service_plugins_data.plugin_data.push({name : 'other-plugins', config : otherServicePlugins})
        }
        return {
            username: '',
            password: '',
            hideAwsLambda: disableAwsLambda,
            hideCors: disableCors,
            service_plugins : service_plugins_data,
            routes_checkbox : route_plugin_section_toggle,
            routes_plugins :routes_plugins_panel_data,
            wicked_plugins : wicked_plugins,
            apiName : this.config.api.name
        };
    },
    methods: {
        getPanelType: function (enabled) {
            return enabled ? 'success' : 'info';
        },
        addHeader: function (header) {
            try {
                const otherPlugins = JSON.parse(this.value.others.config);
                if (!Array.isArray(otherPlugins))
                    throw new Error('Plugin configuration must be an array.');

                let reqTransformer = null;
                for (let i = 0; i < otherPlugins.length; ++i) {
                    const pl = otherPlugins[i];
                    if (pl.name == 'request-transformer') {
                        reqTransformer = pl;
                        break;
                    }
                }
                if (!reqTransformer) {
                    reqTransformer = {
                        name: 'request-transformer'
                    };
                    otherPlugins.push(reqTransformer);
                }
                if (!reqTransformer.config)
                    reqTransformer.config = {};
                const config = reqTransformer.config;
                if (!config.add)
                    config.add = {};
                const add = config.add;
                if (!add.headers)
                    add.headers = [];
                const headers = add.headers;
                headers.push(header);

                this.value.others.config = JSON.stringify(otherPlugins, null, 2);
                return true;
            } catch (err) {
                alert('Cannot add header; plugin configuration is possibly not a valid JSON object: ' + err.message);
                return false;
            }
        },
        addForwarded: function () {
            this.addHeader("%%Forwarded");
        },
        addBasicAuth: function () {
            try {
                const base64Creds = btoa(this.username + ':' + this.password);
                const headerText = 'Authorization:Basic ' + base64Creds;
                const envVarName = this.envPrefix + 'BASICAUTH';

                const instance = this;
                $.post({
                    url: '/api/envs/default',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        name: envVarName,
                        value: headerText,
                        encrypted: true
                    })
                }).done(function () {
                    instance.addHeader('$' + envVarName);
                });
            } catch (err) {
                alert('An error occurred. Possibly your browser does not support "btoa". The exception: ' + err.message);
            }
        },
        updateRoutes : function(routesInfo) {
                this.routes_checkbox = routesInfo.enable_routes
                if(!this.routes_checkbox) {
                  
                    this.routes_plugins ={}
                    this.$forceUpdate();
                    return
                } else {
                   
                    this.addRoutePlugins(routesInfo)
                }
                this.deleteExtraRoutePlugins(routesInfo)
                this.$forceUpdate();
            },
        addRoutePlugins : function(routesInfo) {
            for(let z=0;z<routesInfo.routes.length;++z) {
                let route_elem = routesInfo.routes[z];
                if(!this.routes_plugins[route_elem.name]) { 
                 this.routes_plugins[route_elem.name] = {plugin_data:[],active_plugins : JSON.parse(JSON.stringify(this.wicked_plugins))}
                }
            }
        },

        deleteExtraRoutePlugins : function(routesInfo) {
            let array_elem = JSON.parse(JSON.stringify(this.routes_plugins))
                for(let key in array_elem) {
                    let found = false
                    for(let m=0;m<routesInfo.routes.length;++m) {
                      let r_elem = routesInfo.routes[m]
                      if(r_elem.name==key) {
                        found=true
                        }
                    }
                  if(!found) {
                    delete this.routes_plugins[key]
                   }
    
                }
        },
        deleteRoutePlugin : function(route_name,index_value) {
            let route_data = this.routes_plugins[route_name]
            route_data.splice(index_value, 1);
            if(route_data.length == 0) {
                delete this.mock_routes[route_name]
            } else  {
            this.routes_plugins[route_name] = route_data
            }
        },

        deleteRouteName : function(route_name) {
            delete this.routes_plugins[route_name]
        },

        updateRoutePluginList : function(plugin_name,route_name,event) {
        if(event.target.checked) {
           this.routes_plugins[route_name].active_plugins[plugin_name] = true
           let plugin_body = { name:plugin_name}
           if(plugin_name != 'other-plugins') {
                    plugin_body.config = {}
            } else  {
                plugin_body.config = []
            }
            this.routes_plugins[route_name].plugin_data.push(plugin_body)
        } else {
                this.routes_plugins[route_name].active_plugins[plugin_name] = false
                for(let i=0;i< this.routes_plugins[route_name].plugin_data.length ; ++i) {
                    let data = this.routes_plugins[route_name].plugin_data[i]
                    if(plugin_name==data.name) {
                        this.routes_plugins[route_name].plugin_data.splice(i, 1);
                    }
                }
        }
        this.$forceUpdate();
       },
       updateServicePluginList: function(plugin_name,event) {
        if(event.target.checked) {

           this.service_plugins.active_plugins[plugin_name] = true
           let plugin_body = { name:plugin_name}
           if(plugin_name != 'other-plugins') {
                    plugin_body.config = {}
            } else  {
                plugin_body.config = []
            }
           this.service_plugins.plugin_data.push(plugin_body)

        } else {
                this.service_plugins.active_plugins[plugin_name] = false
                for(let i=0;i< this.service_plugins.plugin_data.length ; ++i) {
                    let data = this.service_plugins.plugin_data[i]
                    if(plugin_name==data.name) {
                        this.service_plugins.plugin_data.splice(i, 1);
                    }
                }
        }
        this.$forceUpdate();
       },
       updatePluginValue : function(event,plugin_name,route_name) {
        try {
            let event_data = JSON.parse(event.target.value)
            let p_data = this.routes_plugins[route_name].plugin_data
            for(let i=0;i<p_data.length;++i) {
                if(plugin_name==p_data[i].name){
                    if(plugin_name != 'other-plugins') {
                    p_data[i] = {name:plugin_name,config:event_data.config} 
                    } else  {
                    p_data[i] = {name:plugin_name,config:event_data}   
                    }

                }
            }
            this.routes_plugins[route_name].plugin_data = p_data
        } catch(err) {
            alert("Warning! Plugin " + plugin_name + "under route " + route_name + " changes will not be saved because of invalid json format")
        }
       },
       updateServicePluginValue : function(event,service_plugin_config) {
        try {
            let event_data = JSON.parse(event.target.value)
            let p_data = this.service_plugins.plugin_data
            for(let i=0;i<p_data.length;++i) {
                if(service_plugin_config.name==p_data[i].name){
                    if(service_plugin_config.name != 'other-plugins') {
                        p_data[i] = {name:service_plugin_config.name,config:event_data.config} 
                    } else  {
                        p_data[i] = {name:service_plugin_config.name,config:event_data}   
                    }

                }
            }
            this.service_plugins.plugin_data = p_data
        } catch(err) {
           alert("Warning! Service plugin "+service_plugin_config.name +" changes will not be saved because of invalid json format")
        }
    }
    },
    template: `
        <wicked-panel title="Plugin Configurations" type="primary" :open=true>
            <div style="float:right">
            <a href="/plugindocs" target="_blank"> Sample Plugin Configs </a>
            </div>
            <br>
            <br>
            <wicked-panel title=" Service plugins" type="primary">
                <p>This wicked Kickstarter application only has direct support for a few of Kong's plugins.
                You can, by editing the following JSON snippet, configure all other plugins according to
                the <a href='https://getkong.org/plugins/' target='_blank'>plugin documentation at Mashape</a>.
                Kickstarter will unfortunately not really help you with it. The input area will expect a
                JSON array of plugin configuration, as described at Kong's documentation pages.</p>
                <p><strong>Important Note</strong>: You must not try to use any of the following plugins, as they
                are used under the hood by wicked to achieve the subscription mechanisms:</p>
                
                <ul>
                    <li><strong>Access Control Lists</strong> (ACL)</li>
                    <li><strong>Key Authentication</strong> (<code>key-auth</code>)</li>
                    <li><strong>OAuth2</strong> (<code>oauth2</code>)</li>
                </ul>
                <div v-for="(service_plugin_status, service_plugin_name,index) in service_plugins.active_plugins" style="display: inline-block;text-align:center;">
                    <input type='checkbox' :name=service_plugin_name :value=service_plugin_name @change="updateServicePluginList(service_plugin_name,$event)" :checked=service_plugin_status style="margin: 0px 0px 0px 0px;"><label style="margin: 0px 20px 0px 3px;">{{service_plugin_name}}</label>
                </div>
                <div v-for="(service_plugin_config,index) in service_plugins.plugin_data">
                    <wicked-panel :title=service_plugin_config.name :type="getPanelType(false)">
                        <textarea class="form-control" :value="service_plugin_config.name =='other-plugins' ? JSON.stringify(service_plugin_config.config,null,4) : JSON.stringify(service_plugin_config,null,4)" style="height:200px" @change="updateServicePluginValue($event,service_plugin_config)" >{{ service_plugin_config }}</textarea>  
                    </wicked-panel>
                </div>
            </wicked-panel>
            <wicked-panel title="Route level plugins" :type="getPanelType(routes_checkbox)" v-if="routes_checkbox">
                        <div v-for="(value,route_name,index) in routes_plugins">
                            <wicked-panel :title=route_name :type="getPanelType(routes_checkbox)">
                                <div v-for="(value, name,index) in value.active_plugins" style="display: inline-block;text-align:center;">
                                   <input type='checkbox' :name=name :value=name @change="updateRoutePluginList(name,route_name,$event)" :checked=value style="margin: 0px 0px 0px 0px;"><label style="margin: 0px 20px 0px 3px;">{{name}}</label>
                                </div>
                                <div id="app">
                                    <div v-for="(value1, index1) in value.plugin_data">
                                        <wicked-panel :title=value1.name :type="getPanelType(routes_checkbox)">
                                            <textarea class="form-control" :value="value1.name == 'other-plugins' ? JSON.stringify(value1.config,null,4) : JSON.stringify(value1,null,4)" style="height:200px" @change="updatePluginValue($event,value1.name,route_name)">{{ value }}</textarea>  
                                        </wicked-panel>
                                    </div>
                                </div>
                            </wicked-panel>
                        </div>
            </wicked-panel>
        </wicked-panel>
    `
});

const mainPages = [
    "envs",
    "ipconfig",
    "database",
    "users",
    "auth",
    "groups",
    "plans",
    "pools",
    "apis",
    "authservers",
    "recaptcha",
    "content",
    "email",
    "chatbot",
    "templates",
    "design",
    "kongAdapter",
    "deploy"
];

Vue.component('nav-buttons', {
    props: ['hideHome', 'returnLink', 'next', 'prev', 'thisPage'],
    data: function () {
        let nextLink = this.next;
        let prevLink = this.prev;
        if (this.thisPage) {
            const index = mainPages.findIndex(p => p === this.thisPage);
            if (index >= 0) {
                if (!nextLink && index < mainPages.length - 1)
                    nextLink = '/' + mainPages[index + 1];
                if (!prevLink && index > 0)
                    prevLink = '/' + mainPages[index - 1];
            }
        }
        const hasNext = !!nextLink;
        const hasPrev = !!prevLink;
        const hasReturn = !!this.returnLink;
        const hideHomeLink = typeof this.hideHome !== 'undefined';
        return {
            nextLink: nextLink,
            hasNext: hasNext,
            prevLink: prevLink,
            hasPrev: hasPrev,
            hasReturn: hasReturn,
            hideHomeLink: hideHomeLink
        };
    },
    methods: {
        storeData: function () {
            // This has to be declared for each page
            storeData();
        }
    },
    template: `
        <table width="100%">
            <tr>
                <td>
                    <a v-if="hasReturn" class="btn btn-default" :href="returnLink">&laquo; Return</a>
                    <a v-if="hasPrev" class="btn btn-default" :href="prevLink">&laquo; Previous</a>
                </td>
                <td style="text-align:right">
                    <a v-if="!hideHomeLink" class="btn btn-default" href="/">Home</a>
                    <button v-on:click="storeData" class="btn btn-primary">Save</button>
                    <a v-if="hasNext" class="btn btn-default" :href="nextLink">Next &raquo;</a>
                </td>
            </tr>
        </table>
    `
});

Vue.component('wicked-markdown', {
    props: ['value'],
    data: function () {
        return {
            internalId: randomId(),
            initialValue: marked(this.value)
        };
    },
    methods: {
        updateMarkdown: function (value) {
            $('#' + this.internalId + '_markdown').html(marked(value));
            this.$emit('input', value);
        }
    },
    template: `
        <div>
            <div class="row">
                <div class="col-md-6">
                    <textarea :id="internalId"
                            class="form-control"
                            :value="value"
                            style="height:500px"
                            v-on:input="updateMarkdown($event.target.value)">{{ value }}</textarea>
                </div>
                <div class="col-md-6">
                    <div :id="internalId + '_markdown'"><span v-html="initialValue"></span></div>
                </div>
            </div>
        </div>
    `
});

Vue.component('wicked-group-picker', {
    props: ['value', 'groups', 'includeNone'],
    template: `
        <select class="form-control" :value="value" v-on:input="$emit('input', $event.target.value)">
            <option v-if="!value && !includeNone" disabled value>Select an option</option>
            <option v-if="!!includeNone" value="">&lt;none&gt;</option>
            <option v-for="(group, index) in groups.groups" :value="group.id">{{ group.name }} ({{ group.id }})</option>
        </select>
    `
});

Vue.component('helm-chart', {
    template: `
        <a href="https://github.com/Haufe-Lexware/wicked.haufe.io/tree/master/wicked" target="_blank">Wicked Kubernetes Helm Chart</a>
    `
});