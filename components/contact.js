
var Element = require('/home/mjennings/pagebuilder/html.js')
var templates = require('../templates.js')
var content = require('../content.js')
var util = require('../util.js')

/*
  The contact section
*/

module.exports = function(name, width){
  var body = new Element('div')
  .content(
    util.linkedParagraphs(content("contact"))
  )
  .style('text-align', 'center')

  return templates.section("CONTACT", body, width)
}
