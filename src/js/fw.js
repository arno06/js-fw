var FwJs = (function(){

    var routing_rules = {};
    var hash;
    var lib = {
        events:{
            RENDER:"evt_render",
            RENDER_COMPLETE:"evt_render_complete"
        }
    };
    var ctrl = {};

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

    function executeContext(pController, pAction, pParameters)
    {
        pController = pController||"Index";
        pAction = pAction||"defaultAction";
        pParameters = pParameters||{};

        var ins = new ctrl[pController]();
        ins.setTemplate(pController, pAction);
        ins[pAction](pParameters);
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