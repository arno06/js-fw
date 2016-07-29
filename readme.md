#JS MVC Framework

Yet another JS MVC'ish framework (client side)

##Request Life Cycle

 * Observe changes onto hash
 * Checks routing rules, parses current hash and define next context
 * If a context already exists, transitionOut is called on Controller Instance
 * Next we define the new context, setup the new Controller Instance
 * Call action requested onto new Controller Instance
 * On render Event, Template is parsed for rendering onto #container html element
 * On render completed Event, transitionIn is called on Controller Instance

##Dependencies :
* [Template](http://github.com/arno06/Template)

##todo :
- [ ] 404 Page