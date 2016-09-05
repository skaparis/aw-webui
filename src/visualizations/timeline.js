"use strict";

const d3 = require("d3");
const Color = require("color");
const _ = require("lodash");

// TODO: Always give the same appname the same color
// TODO: When hovering over a thin element, expand it's height so that more details can be viewed.
//       For example, an element is 10px thin, make it's width 50px and move it's y-pos 20px up so
//       that it overlaps the element above and below equally.

function _windowLabelsAsProps(events) {
  return _.map(events, function(event) {
    _.each(event.label, function(label) {
      if(label.startsWith("appname:")) {
        event.appname = label.slice(8);
      } else if(label.startsWith("title:")) {
        event.title = label.slice(6);
      }
    });
    return event;
  });
}

function _mergeWithSameAppname(events) {
  return _.reduce(events, function(result, value, key) {
    if(key === 0) {
      result.push(value);
    } else {
      let last_event = result[result.length-1];
      console.log(last_event);
      if(last_event.appname === value.appname) {
        last_event.duration[0].value += value.duration[0].value;
      } else {
        result.push(value);
      }
    }
    return result;
  }, []);
}

// Whenever a appname is found without a color in this dict, create one and assign
let appname_colors = {};
var color = Color();
color.hsv(0, 75, 100);
function getColor(appname) {
  if(!(appname in appname_colors)) {
    appname_colors[appname] = color.rgbString();
    color.hue(color.hue() + 90);
  }
  return appname_colors[appname];
}

function renderTimeline(el, events) {
  // Clear element
  el.innerHTML = "";

  let svg = d3.select(el).append("svg");
  let width = "100%";
  svg.attr("width", width);

  events = _windowLabelsAsProps(events);
  events = _mergeWithSameAppname(events);

  let g = svg.append("g");
  //g.attr("transform", "translate(" + 50 + ", 0)");

  // TODO: Add ability to zoom by modifying this variable
  let secondsPerPixel = 2;

  var curr_y = 0;
  _.each(events, function(e, i) {
    console.log(i, e);

    let barHeight = e.duration[0].value / secondsPerPixel;
    let textSize = 0;
    if(barHeight > 20) {
      textSize = 16;
    } else if(barHeight > 14) {
      textSize = 10;
    }

    let eg = g.append("g");
    eg.append("svg:title")
      .text("Appname: " + e.appname + "\n" + "Duration: " + Math.round(e.duration[0].value) + "s");

    eg.append("rect")
     .attr("x", 0)
     .attr("y", curr_y)
     .attr("width", "100%")
     .attr("height", barHeight)
     .style("fill", getColor(e.appname));
    eg.append("text")
     .attr("x", 5)
     .attr("y", curr_y + 2 + textSize)
     .text(e.appname)
     .attr("font-family", "sans-serif")
     .attr("font-size", textSize + "px")
     .attr("fill", "black");
    curr_y += barHeight;
  });

  // Set so that SVG resizes depending on timeline length
  svg.attr("height", curr_y);

  return svg;
}

module.exports = renderTimeline;

