var FwJs = (function(){

    var routing_rules = {};
    var hash;
    var lib = {
        events:{
            RENDER:"evt_render",
            RENDER_COMPLETE:"evt_render_complete",
            TRANSITION_OUT:"evt_transition_out",
            TRANSITION_IN:"evt_transition_in"
        },
        tools:{}
    };
    var ctrl = {};

    var context = {
        controller:null,
        action:null,
        parameters:null
    };

    function start()
    {
        routing_rules = JSON.parse(document.querySelector("#routing_rules").innerHTML);
        window.addEventListener('hashchange', routingHandler, false);
        routingHandler();
    }

    function routingHandler()
    {
        hash = document.location.hash.replace("#","");
        if(!hash.length || !hash)
        {
            document.location.hash = routing_rules.home.hash;
            return;
        }

        var rule = null, r, route, idx_param, indexed_parameters, defaultRoute;
        for(var i in routing_rules)
        {
            if(!routing_rules.hasOwnProperty(i))
                continue;
            r = routing_rules[i];

            if(r.default)
                defaultRoute = r.hash;

            r.parameters = r.parameters || {};

            route = r.hash.replace('\/', '\\/').replace('.', '\.');
            indexed_parameters = [];
            idx_param = 0;
            for(var name in r.parameters)
            {
                if(!r.parameters.hasOwnProperty(name))
                    continue;

                var re = new RegExp('\\{\\$'+name+'\\}');
                if(!re.test(route))
                    continue;

                indexed_parameters[++idx_param] = name;
                route = route.replace(re, '('+ r.parameters[name]+')');
            }

            var re_route = new RegExp("^"+route+"$");
            if(!re_route.test(hash))
                continue;

            var matches = hash.match(re_route);
            var parameters = [];
            for(var k = 1, maxk = matches.length; k<maxk; k++)
            {
                parameters[indexed_parameters[k]] = matches[k];
            }
            rule = r;
        }

        if(rule != null)
        {
            executeContext(rule.controller, rule.action, parameters);
        }
        else
        {
            window.location.hash = defaultRoute;
        }
    }

    lib.tools.rewriteHash = function(pIdHash, pParameters)
    {
        if(!routing_rules || !routing_rules[pIdHash])
            return false;
        var rule = routing_rules[pIdHash];

        var hash = rule.hash;

        for(var i in rule.parameters)
        {
            if(!rule.parameters.hasOwnProperty(i))
                continue;
            if(!pParameters.hasOwnProperty(i))
            {
                return false;
            }

            hash = hash.replace('{$'+i+'}', pParameters[i]);
        }

        return hash;
    };

    function executeContext(pController, pAction, pParameters)
    {
        var newContext = {
            controller:pController||"Index",
            action:pAction||"defaultAction",
            parameters:pParameters||{}
        };

        var defineNewContext = function()
        {
            context.controller = new ctrl[newContext.controller]();
            context.action = newContext.action;
            context.parameters = newContext.parameters;
            context.controller.addEventListener(TemplateEvent.RENDER_COMPLETE, function(){
                context.controller.transitionIn(context.action);
            });
            context.controller.setTemplate(newContext.controller, context.action);
            context.controller[context.action](context.parameters);
        };

        if(context && context.controller && context.action)
        {
            context.controller.addEventListener(lib.events.TRANSITION_OUT, defineNewContext);
            context.controller.transitionOut(context.action);
        }
        else
        {
            defineNewContext();
        }
    }

    lib.DefaultController = function()
    {
        this.removeAllEventListener();
        this.template = "";
        this.content = {};
        this.addEventListener(lib.events.RENDER, this.render.proxy(this), false);
        document.body.classList.add('loading');
    };

    Class.define(lib.DefaultController, [EventDispatcher], {
        render:function()
        {
            var ref = this;
            var tpl = new Template(this.template);
            tpl.addEventListener(TemplateEvent.RENDER_COMPLETE, function(e){
                document.querySelector('body').classList.remove('loading');
                ref.dispatchEvent(e);
            }, false);
            tpl.assign('content', this.content);
            document.querySelector('#container').innerHTML = "";
            tpl.render(document.querySelector('#container'));
        },
        setTemplate:function(pController, pAction, pName)
        {
            if(!pController && !pAction)
            {
                this.template = pName;
                return;
            }
            this.template = [pController, pAction, "tpl"].join("_");

        },
        addContent:function(pName, pValue)
        {
            this.content[pName] = pValue;
        },
        transitionIn:function(pAction)
        {
            this._transition(pAction, "in", lib.events.TRANSITION_IN);
        },
        transitionOut:function(pAction)
        {
            this._transition(pAction, "out", lib.events.TRANSITION_OUT);
        },
        _transition:function(pAction, pType, pEventType)
        {
            var event = new Event(pEventType);
            if(!this.transitions)
                return this.dispatchEvent(event);
            if(this.transitions[pAction]&&this.transitions[pAction][pType])
            {
                return this.transitions[pAction][pType](this);
            }
            if (this.transitions.generic&&this.transitions.generic[pType])
            {
                return this.transitions.generic[pType](this);
            }
            return this.dispatchEvent(event);
        }

    });

    return {
        newController:function (pName, pConstruct, pPrototype, pParentController)
        {
            pParentController = pParentController||lib.DefaultController;
            pConstruct = pConstruct||function(){this.super();};
            ctrl[pName] = pConstruct;
            Class.define(ctrl[pName], [pParentController], pPrototype);
            return ctrl[pName];
        },
        start:start,
        lib:lib
    };
})();