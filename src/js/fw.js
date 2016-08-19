"use strict";

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
    var controllers = {};

    var context = {
        controller:null,
        action:null,
        parameters:null
    };

    function routingHandler()
    {
        hash = document.location.hash.replace("#","");
        if(!hash.length || !hash)
        {
            document.location.hash = routing_rules.home.hash;
            return;
        }

        var rule = null, defaultRoute;
        for(let i in routing_rules)
        {
            if(!routing_rules.hasOwnProperty(i))
                continue;
            let r = routing_rules[i];

            if(r.default)
                defaultRoute = r.hash;

            r.parameters = r.parameters || {};

            let route = r.hash.replace('\/', '\\/').replace('.', '\.');
            let indexed_parameters = [];
            let idx_param = 0;
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
            for(let k = 1, maxk = matches.length; k<maxk; k++)
            {
                parameters[indexed_parameters[k]] = decodeURI(matches[k]);
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

    lib.tools.rewriteHash = (pIdHash, pParameters)=>
    {
        if(!routing_rules || !routing_rules[pIdHash])
            return false;
        let rule = routing_rules[pIdHash];

        let hash = rule.hash;

        for(let i in rule.parameters)
        {
            if(!rule.parameters.hasOwnProperty(i))
                continue;
            if(!pParameters.hasOwnProperty(i))
            {
                return false;
            }

            hash = hash.replace('{$'+i+'}', encodeURI(pParameters[i]));
        }

        return hash;
    };

    function executeContext(pController, pAction, pParameters)
    {
        let newContext = {
            controller:pController||"Index",
            action:pAction||"defaultAction",
            parameters:pParameters||{}
        };

        let defineNewContext = _=>
        {
            context.controller = new controllers[newContext.controller]();
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

    lib.DefaultController = class extends EventEmitter
    {
        constructor()
        {
            super();
            this.template = "";
            this.content = {};
            this.addEventListener(lib.events.RENDER, this.render.bind(this), false);
            document.body.classList.add('loading');
        }

        render()
        {
            let tpl = new Template(this.template);
            tpl.addEventListener(TemplateEvent.RENDER_COMPLETE, ((e)=>
            {
                document.querySelector('body').classList.remove('loading');
                this.dispatchEvent(new Event(TemplateEvent.RENDER_COMPLETE));
            }).bind(this), false);
            tpl.assign('content', this.content);
            document.querySelector('#container').innerHTML = "";
            tpl.render(document.querySelector('#container'));
        }

        addContent(pName, pValue)
        {
            this.content[pName] = pValue;
        }

        setTemplate(pController, pAction, pName)
        {
            if(!pController && !pAction)
            {
                this.template = pName;
                return;
            }
            this.template = [pController, pAction, "tpl"].join("_");

        }

        addContent(pName, pValue)
        {
            this.content[pName] = pValue;
        }

        transitionIn(pAction)
        {
            this._transition(pAction, "in", lib.events.TRANSITION_IN);
        }

        transitionOut(pAction)
        {
            this._transition(pAction, "out", lib.events.TRANSITION_OUT);
        }

        _transition(pAction, pType, pEventType)
        {
            let event = new Event(pEventType);
            if(!this.transitions)
                return this.dispatchEvent(event);
            if(this.transitions[pAction]&&this.transitions[pAction][pType])
            {
                return this.transitions[pAction][pType].bind(this)();
            }
            if (this.transitions.generic&&this.transitions.generic[pType])
            {
                return this.transitions.generic[pType].bind(this)();
            }
            return this.dispatchEvent(event);
        }
    };

    return {
        start:_=>{
            routing_rules = JSON.parse(document.querySelector("#routing_rules").innerHTML);
            window.addEventListener('hashchange', routingHandler, false);
            routingHandler();
        },
        newController: (pClass)=>{
            controllers[pClass.name] = pClass;
        },
        lib:lib
    };
})();