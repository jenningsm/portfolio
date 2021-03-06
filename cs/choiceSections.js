
/*
  A choice section is a section which has a bar with several
  options and different content corresponding to each of these
  options.

  each choice section has a name and each option also has a name.

  When option x of choice section y is clicked, it will
  call choose(y, x), and choose should replace the current content
  in section y with the content corresponding to option x.

*/


/*
  Get the shared information about the choices. Each section that is
  a choice section will share the following data:

    sectionName: {
     first: the name of the option whose content is displayed at first
     container: the main content container for the section
     choices: {
       $(choice X name) : 
         {
           'underline' : $(choice X underline)
           'container' : $(choice X content container)
         }
       $(choice Y name) : 
         {
           'underline' : $(choice Y underline)
           'container' : $(choice Y content container)
         }
           ...
           ...
     }

  In case it's not clear, choices is an associative array that maps 
  the name of each choice to the container that contains that choice's
  content and that choice's underline

  underline is the element that is the underline for that choice's menu
  item. 

  each container for each options' content is contained within the 
  section's main content container
  
*/

//to contain all data on each choice section
//in the same format as above, except the shared getters are replaced
//by the actual elements, and first is replaced by current
var choiceSections = {}

//fill choiceSections
var keys = Object.keys(pbr.sections)
for(var i = 0; i < keys.length; i++){
  //data is only defined if this is a choice section
  if(pbr.sections[keys[i]].data !== undefined){
    var section = pbr.sections[keys[i]].data
    section.container = section.container.get()
  
    var choiceKeys = Object.keys(section.choices)
    for(var j = 0; j < choiceKeys.length; j++){
      var choice = section.choices[choiceKeys[j]]
      choice.container = choice.container.get()
      choice.underline = choice.underline.get()
    }

    //the currently active option
    section.current = section.first
    section.choices[section.current].underline.style.opacity = 1
    //used to prevent two transitions from happening at once
    section.lock = false
    choiceSections[keys[i]] = section
  }
}

function choose(sectionName, choice){
  var section = choiceSections[sectionName]
  //if not locked and choice is not already active
  if(!section.lock && choice !== section.current){
    //lock the section so no other transition will take place on this
    //section until this transition has finished
    section.lock = true

    section.choices[section.current].underline.style.opacity = ''
    //the container of the content of the option that is currently active
    var from = section.choices[section.current].container
    var fromHeight = from.clientHeight

    section.choices[choice].underline.style.opacity = 1
    //the container of the content of the option we want to transition to
    var to = section.choices[choice].container
    //get the height of the container
    to.style.position = 'absolute'
    to.style.opacity = 0 
    to.style.display = 'block'
    var toHeight = to.clientHeight
  
    section.container.style.height = fromHeight

    //this event is to let the rest of the code know that the height
    //of this section has changed, since this will change the position
    //of every element after it  
    var resizeEvent = new Event('bodyChange')

    //resizes the main content container from its current height to the
    //height of the content we are transitioning to, then calls callback
    function resize(callback){

      function sizer(pos){
        section.container.style.height = pos + "px"
        window.dispatchEvent(resizeEvent)
      }

      return function(){
        new MoveGen(sizer, .07 * Math.sqrt(Math.abs(toHeight - fromHeight)))
        .ends(fromHeight, toHeight)
        .acceleration(1, 1, .7)
        .callback(callback)
        .run()
      }
    }

    //fades out the current content and fades in the new content
    function switchContent(callback){

      function fader(el){
        return function(pos){
          el.style.opacity = pos
        }
      }

      return function(){
        //the amount of time, in seconds, to spend on the transition
        var time = .8 
        //fade the current container out
        new MoveGen(fader(from), time / 2)
        .acceleration(0, 0, 1)
        .ends(1, 0)
        .callback(
          //fade the new container in
          function(){
            from.style.display = 'none'
            new MoveGen(fader(to), time / 2)
            .acceleration(0, 0, 1)
            .ends(0, 1)
            .callback(callback)
            .run()
          }
        )
        .run()
      }
    }
 
    //if the new content is taller than the current content, we want
    //to resize the main content container first, so that there is room
    //for the new content, and then fade the new content in. Otherwise,
    //we want to fade the new content in and then resize the content container. 
    var first, second
    if(toHeight > fromHeight){
      first = resize
      second = switchContent
    } else {
      first = switchContent
      second = resize
    }

    first(
      second(
        function (){
          from.style.position = 'absolute'
          to.style.position = 'relative'
          section.container.style.height = 'auto'
          section.current = choice
          section.lock = false
        }
      )
    )()

  }
}
