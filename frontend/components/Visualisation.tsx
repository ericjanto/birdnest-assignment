// @ts-nocheck
import * as d3 from "d3"

import { DroneData } from "../types/dronedata.types"

type VisProps = {
  droneData: DroneData[],
  highlighted: string,
  width: Number,
  height: Number
}

export function DroneVisualisation({ droneData, highlighted, width, height }: VisProps) {
  const chart = Scatterplot(droneData, {
    x: d => d.min_position_x,
    y: d => d.min_position_y,
    // title: d => d.first_name,
    id: d => d.serialnumber,
    highlighted: highlighted,
    xDomain: [150, 350],
    yDomain: [150, 350],
    xLabel: "x →",
    yLabel: "↑ y",
    stroke: "#dbeafe",
    width: width,
    height: height
  })

  return (
    <svg style={{ 'width': width, 'height': height }} dangerouslySetInnerHTML={{ __html: chart.innerHTML }} />
  )
}

// Based on: https://observablehq.com/@d3/scatterplot
function Scatterplot(data, {
  x = ([x]) => x, // given d in data, returns the (quantitative) x-value
  y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
  r = 3, // (fixed) radius of dots, in pixels
  title, // given d in data, returns the title
  id, // given d in data, returns the id
  highlighted, // element to highlight, must be an id
  marginTop = 20, // top margin, in pixels
  marginRight = 30, // right margin, in pixels
  marginBottom = 20, // bottom margin, in pixels
  marginLeft = 40, // left margin, in pixels
  inset = r * 2, // inset the default range, in pixels
  insetTop = inset + 10, // inset the default y-range
  insetRight = inset - 5, // inset the default x-range
  insetBottom = inset + 10, // inset the default y-range
  insetLeft = inset - 5, // inset the default x-range
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  xType = d3.scaleLinear, // type of x-scale
  xDomain, // [xmin, xmax]
  xRange = [marginLeft + insetLeft, width - marginRight - insetRight], // [left, right]
  yType = d3.scaleLinear, // type of y-scale
  yDomain, // [ymin, ymax]
  yRange = [height - marginBottom - insetBottom, marginTop + insetTop], // [bottom, top]
  xLabel, // a label for the x-axis
  yLabel, // a label for the y-axis
  xFormat, // a format specifier string for the x-axis
  yFormat, // a format specifier string for the y-axis
  fill = "none", // fill color for dots
  stroke = "currentColor", // stroke color for the dots
  strokeWidth = 1.5, // stroke width for dots
  halo = "#fff", // color of label halo 
  haloWidth = 3 // padding around the labels
} = {}) {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const T = title == null ? null : d3.map(data, title);
  const ID = d3.map(data, id)
  const I = d3.range(X.length).filter(i => !isNaN(X[i]) && !isNaN(Y[i]));

  // Compute default domains.
  if (xDomain === undefined) xDomain = d3.extent(X);
  if (yDomain === undefined) yDomain = d3.extent(Y);

  // Construct scales and axes.
  const xScale = xType(xDomain, xRange);
  const yScale = yType(yDomain, yRange);
  const xAxis = d3.axisBottom(xScale).ticks(width / 50, xFormat);
  const yAxis = d3.axisLeft(yScale).ticks(height / 50, yFormat);

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(xAxis)
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("y2", marginTop + marginBottom - height)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", width)
      .attr("y", marginBottom - 4)
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
      .text(xLabel));

  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(yAxis)
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text(yLabel));

  if (T) svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .selectAll("text")
    .data(I)
    .join("text")
    .attr("dx", 7)
    .attr("dy", "0.35em")
    .attr("x", i => xScale(X[i]))
    .attr("y", i => yScale(Y[i]))
    .text(i => T[i])
    .call(text => text.clone(true))
    .attr("fill", "none")
    .attr("stroke", halo)
    .attr("stroke-width", haloWidth);

  svg.append("g")
    .attr("fill", fill)
    .attr("stroke", stroke)
    .attr("stroke-width", strokeWidth)
    .selectAll("circle")
    .data(I)
    .join("circle")
    .attr("cx", i => xScale(X[i]))
    .attr("cy", i => yScale(Y[i]))
    .attr("r", r)
    .attr("id", i => ID[i])

  svg.append('circle')
    .attr('cx', xScale(250))
    .attr('cy', yScale(250))
    .attr('r', 190)
    .attr("fill", 'none')
    .attr("stroke", '#93c5fd')
    .attr("stroke-width", strokeWidth)

  svg.append('circle')
    .attr('cx', xScale(250))
    .attr('cy', yScale(250))
    .attr('r', 4)
    .attr("fill", '#9f1239')
    .attr("stroke", 'none')
    .attr("stroke-width", strokeWidth)

  // if (highlighted) {
  //   d3.select("#" + highlighted)
  //     .attr("fill", stroke)
  //     .attr("stroke", stroke)
  // }

  return svg.node()
}