"use strict";

var transitions = {
    generic:{
        in:function()
        {
            let completeHandler = function(){
                this.dispatchEvent(event);
            };
            var event = new Event(FwJs.lib.events.TRANSITION_IN);
            M4Tween.to(document.querySelector('h1'),.3, {opacity:1, marginLeft:"0px"})
                .onComplete(completeHandler.bind(this));
        },
        out:function()
        {
            let completeHandler = function(){
                this.dispatchEvent(event);
            };
            var event = new Event(FwJs.lib.events.TRANSITION_OUT);
            M4Tween.to(document.querySelector('h1'),.3, {opacity:0, marginLeft:"-30px"})
                .onComplete(completeHandler.bind(this));
        }
    }
};

class IndexController extends FwJs.lib.DefaultController
{
    constructor()
    {
        super();
        this.transitions = transitions;
    }

    defaultAction()
    {
        console.log("default");
        this.dispatchEvent(new Event(FwJs.lib.events.RENDER));
    }

    secondAction(pParameters)
    {
        console.log("secondAction");
        if(pParameters)
        {
            console.log(pParameters);

            console.log(FwJs.lib.tools.rewriteHash('withParameters', pParameters));
        }
        this.dispatchEvent(new Event(FwJs.lib.events.RENDER));
    }
}

FwJs.newController(IndexController);

window.addEventListener('load', FwJs.start);