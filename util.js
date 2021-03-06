
var Element = require('/home/mjennings/pagebuilder/html.js')
var Selector = require('/home/mjennings/pagebuilder/selector.js')
var styles = require('./styles.js')
var colors = require('./color.js')


/*
  Used to generate a flexbox. It takes the following arguments:

  dir    : the dir of the flexbox, 'row' or 'column'
  dims   : a two element array containing the width and
           height of the flexbox as strings
  justify: the value for 'justify-content' style

  and then returns a function. This function takes as arguments
  first an item to insert into the flexbox, and then, optionally,
  the flex-grow value for that item. This item is inserted into the
  flex box and then the flexbox is returned. If the function is
  called without arguments it will return the flexbox without doing
  anything. The function may take any number of arguments that is a
  multiple of two, in which case the first element of each pair is 
  interpreted as an element to insert and the second element is its
  flex-grow value.
*/
module.exports.flex = function(dir, dims, justify){
  var f = new Element('div').style(
    styles.flex(dir, justify)
  )
  if(dims !== undefined){
    f.style(styles.dims(dims[0], dims[1]))
  }
  
  return function(item, grow /*...*/){
    for(var i = 0; i < arguments.length; i+=2){
      if(arguments[i+1] !== undefined)
        arguments[i].style({'-webkit-flex-grow': arguments[i+1], 'flex-grow' : arguments[i+1]})
    
      f.content(arguments[i])
    }

    return f
  }
}

//the amount, in percentage, the underline is moved up from the bottom
//of the element
var underlinePlace = 9

//standard underline thickness, in pixels
var thicknessStandard = 4

/*
  Creates a span containing the string text underlined

  text: a string to underline
  thickness: the thickness of the underline as a proportion of thicknessStandard
  color: the color of the underline
*/
module.exports.spanUnderline = spanUnderline
function spanUnderline(text, thickness, color){
  if(color === undefined)
    color = colors.pString

  if(thickness === undefined)
    thickness = 1

  thickness = truncate(thicknessStandard * thickness, 2)

  var displacement = truncate(underlinePlace * 2 / 100, 2) + 'em'

  return new Element('span')
  .style({
    'top' : '-' + displacement,
    'position' : 'relative',
    'display' : 'inline-block',
    'border-bottom' : thickness + 'px solid ' + color
   })
  .content(
    new Element('span').style({
      'top' : displacement,
      'display' : 'inline-block',
      'position' : 'relative'
    })
    .content(text)
  )

}

/*
  Similar to spanUnderline, but a div instead of a span. It's a little cleaner
  than spanUnderline, but it can't be put inside paragraph tags

  text, thickness, and color parameters mean the same thing as in spanUnderline
  if the parameter 'active' is false, then the underline's opacity style will
  be set to '0'

  returns an object containing the div (as 'div') and the underline element
  (as 'underline').
*/

//selector to be applied to underlines so they show up when hovered over
var hover = new Selector('$box:hover $underline').style('opacity', '1')

module.exports.divUnderline = function(text, active, thickness, color){
  if(color === undefined)
    color = colors.pString

  if(thickness === undefined)
    thickness = 1

  thickness = truncate(thicknessStandard * thickness, 2)

  var underline =  new Element('div').style(
    styles.dims("100%", thickness + "px"),
    { 'position' : 'absolute',
      'top' : (100 - underlinePlace) + '%',
      'background' : color,
      'z-index' : -1,
      '-webkit-transition' : 'opacity .5s',
      'transition' : 'opacity .5s' }
  )
  .assign(hover, ['underline'])

  var div = new Element('div')
  .content(
    new Element('div').content(
      new Element('span').content(text),
      underline
    ).style({
      'position' : 'relative',
      'display' : 'inline-block'
    })
  )
  .style('display', 'inline-block')
  .style(styles.userSelect("none"))
  .assign(hover, ['box'])

  if(active === false)
    underline.style('opacity', '0')

  return {'div' : div, "underline" : underline}
}

//truncates a number so it has at most precision number
//of digits after the decimal point
module.exports.truncate = truncate
function truncate(number, precision){
  number = number * Math.pow(10, precision)
  number = Math.round(number)
  return number / Math.pow(10, precision)
}

/*
   Takes an array of strings, each of which is interpreted
   as a paragraph.

   For each paragraph, links are subsituted with linked spans
   and the whole pargraph is wrapped in p tags.

   links are denoted according to the convention described in
   the comments for linkify below

   returns an array of the formatted paragraphs
*/
module.exports.linkedParagraphs = function(paragraphs){
  var ret = []
  for(var i = 0; i < paragraphs.length; i++){
    ret.push(new Element('p').content(linkify(paragraphs[i])))
  }
  return ret
}

/*
   Looks for instances of

     '$(link text,www.linkurl.com)' or
     '$(link text,@sectionName)

   inside text and replaces them with links that either
   go to the specified url or that cause the page to scroll
   to the specified section

   Returns an array containing the text and link spans
*/
function linkify(text){
  //split the paragraph up by instances of links
  var broken = text.split('$(')
  //an array containing the split text
  var split = [broken[0]]
  for(var i = 1; i < broken.length; i++){
    var close = broken[i].indexOf(')')
    split.push(broken[i].substr(0, close))
    split.push(broken[i].substr(close + 1))
  }

  var ret = []
  var open = false

  for(var j = 0; j < split.length; j++){
    var item
    if(open){
      var info = split[j].split(',')
      if(info[1].indexOf('@') !== 0){
        //set as link to external site
        item = link(info[0], info[1])
      } else {
        //set as link to internal section
        item = inLink(info[0], info[1].substr(1))
      }
      open = false
    } else {
      item = split[j]
      open = true
    }
    ret.push(item)
  }
  return ret
}

//creates a link with specified text to specified url
module.exports.link = link
function link(text, url){
  return new Element('a')
  .content(spanUnderline(text, .5))
  .style({
    'cursor' : 'pointer',
    'text-decoration' : 'none',
    'outline' : 'none',
    'color' : 'inherit'
  })
  .attribute('href', url)
}

//creates a link with the specified text that scrolls 
//to the specified section when clicked
module.exports.inLink = inLink
function inLink(text, section){
  return spanUnderline(text, .5)
         .attribute('onclick', 'toSection(&quot;' + section + '&quot;)')
         .style('cursor', 'pointer')
}


//returns a selector styled with a media query so that elements assigned 
//to it will be styled with smallstyle when the width of the screen is less
//than breakPoint pixels and bigstyle when the width of the screen is more
//than breakPoint pixels
module.exports.mediaWidth = function(breakPoint, smallstyle, bigstyle){
  var width = new Selector()
  width.nest(
    new Selector('@media (max-width: ' + breakPoint + 'px)', '$').style(smallstyle)
  )
  width.nest(
    new Selector('@media (min-width: ' + breakPoint + 'px)', '$').style(bigstyle)
  )
  return width
}
