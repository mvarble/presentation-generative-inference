import * as d3 from 'd3';
import hljs from 'highlight.js/lib/core';
import julia from 'highlight.js/lib/languages/julia';
import 'highlight.js/styles/agate.css';

import jlCode from './model.jl';
import traceTxt from './trace.txt';
import { container, codeContainer, code, plot, trace } from './index.module.css';


/**
 * establish some constants we will use
 */

// error message
const NO_PARENT_MESSAGE = 'GeneratingDiagram: `parentElm` is not in deck';

// sample data
const SAMPLES = require('./samples.json');
const SAMPLES_MAX = SAMPLES.reduce((M, [A,Z]) => Math.max(A,Z,M), -Infinity);
const TIMESTAMPS = Array.from({ length: 101 }).map((_, i) => Math.PI * i / 100);

// viewport data
const HEIGHT = 200;
const XYRATIO = 1.6;
const WIDTH = HEIGHT * XYRATIO;
const PAD = 5;
const XSCALE = d3.scaleLinear()
  .domain([0, Math.PI])
  .range([0, WIDTH-12*PAD]);
const YSCALE = d3.scaleLinear()
  .domain([-SAMPLES_MAX*1.05, SAMPLES_MAX*1.05])
  .range([HEIGHT-2*PAD, 0]);

// code which produced sample data
hljs.registerLanguage('jl', julia);
const CODE = hljs.highlight(jlCode, { language: 'jl' }).value;

// output of example trace
const TRACE = (() => {
  const output = [];
  let i = 0;
  let M = 10;
  while (i < traceTxt.length) {
    output.push(traceTxt.slice(i, i + M));
    i = i + M;
  }
  return output;
})()

/**
 * Configuration of the GeneratingDiagram component
 */
interface GeneratingDiagramConfig {
  parentElm: HTMLElement,
  startStage: number,
}

/**
 * This class will create d3 animations for the `generating sources` slide of the presentation.
 * It will show Gen.jl code in addition to animating a plot
 */
class GeneratingDiagram {
  stage: number; // the stage of the animation
  codeSel: d3.Selection<HTMLElement, null, null, null>;
  plotSel: d3.Selection<HTMLElement, null, null, null>;
  traceSel: d3.Selection<HTMLElement, null, null, null>;

  constructor({ parentElm, startStage }: Partial<GeneratingDiagramConfig>) {
    // we necessarily need a parent element for the diagram to work
    if (!parentElm) throw new Error(NO_PARENT_MESSAGE);

    // create the container element and append it to the parent
    const containerSel = d3.create('div').attr('class', container);
    parentElm.appendChild(containerSel.node());

    // create the code block and append it to the container
    this.codeSel = d3.create('div').attr('class', codeContainer);
    this.codeSel
      .append('div').attr('class', `${code} hljs`)
      .append('code').html(CODE);
    containerSel.node().appendChild(this.codeSel.node());

    // create the trace block and append it to the container
    this.traceSel = d3.create('div').attr('class', trace);
    containerSel.node().appendChild(this.traceSel.node());

    // create the plot block and append it to the container
    this.plotSel = d3.create('div').attr('class', plot)
    const axis = this.plotSel
      .append('svg')
      .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
      .append('g')
        .attr('transform', `translate(${8 * PAD}, ${PAD})`)
        .call(d3.axisLeft(YSCALE).ticks(5));
    axis.append('g').attr('class', 'amplitudes');
    axis.append('g').attr('class', 'paths');
    axis.append('g').attr('class', 'measurements');
    containerSel.node().appendChild(this.plotSel.node());

    // start the diagram at the specified stage
    this.setStage(startStage);
  }

  setStage(stage: number) {
    // perform updates only if stage changed
    if (stage === this.stage) return;
    this.stage = stage;

    // use d3 to animate between stages
    if (this.stage <= 0) this.stage0();
    else if (this.stage === 1) this.stage1();
    else if (this.stage === 2) this.stage2();
    else if (this.stage === 3) this.stage3();
    else if (this.stage === 4) this.stage4();
    else if (this.stage === 5) this.stage5();
    else this.stage6();
  }

  createAmplitudes(delay: boolean) {
    return this.plotSel.select('.amplitudes')
      .selectAll('circle')
      .data(SAMPLES)
      .join(
        enter => 
          enter.append('circle')
            .attr('cx', 0)
            .attr('cy', d => YSCALE(d[0]))
            .attr('fill', 'green')
            .attr('fill-opacity', 0.25)
            .attr('stroke', 'green')
            .attr('r', 0)
            .transition()
            .delay((_, i) => delay ? 1000 * i / SAMPLES.length : 0)
            .duration(delay ? 500 : 0)
            .attr('r', 2),
        update => update.attr('r', 2)
      );
  }

  createPaths(delay: boolean) {
    const line = d3.line().x(d => d[0]).y(d => d[1]);
    return this.plotSel.select('.paths')
      .selectAll('path')
      .data(SAMPLES)
      .join(
        enter => {
          const path = enter.append('path')
            .datum(d => line(TIMESTAMPS.map(t => [XSCALE(t), YSCALE(d[0] * Math.cos(t))])))
            .attr("d", d => d)
            .attr('stroke', '#41825A');
          if (delay && path.node()) {
            const length = path.node().getTotalLength() * 1.5;
            path
              .attr('stroke-dashoffset', length)
              .attr('stroke-dasharray', length)
              .transition()
              .delay((_, i) => 1000 * i / SAMPLES.length)
              .duration(500)
              .attr('stroke-dashoffset', 0);
          }
          return path;
        },
        update => update.attr('stroke-dashoffset', 0),
      )
  }

  createMeasurements(delay: boolean) {
    return this.plotSel.select('.measurements')
      .selectAll('circle')
      .data(SAMPLES)
      .join(
        enter => 
          enter.append('circle')
            .attr('cx', XSCALE(Math.PI))
            .attr('cy', d => YSCALE(d[1]))
            .attr('fill', 'red')
            .attr('fill-opacity', 0.25)
            .attr('stroke', 'red')
            .attr('r', 0)
            .transition()
            .delay((_, i) => delay ? 1000 * i / SAMPLES.length : 0)
            .duration(delay ? 500 : 0)
            .attr('r', 2),
        update => update.attr('r', 2)
      );
  }

  createTrace(delay: boolean) {
    return this.traceSel
      .selectAll('span')
      .data(TRACE)
      .join(
        enter => enter.append('span')
          .html(d => d)
          .style('visibility', 'hidden')
          .transition()
          .delay((_, i) => delay ? 1000 * i / TRACE.length: 0)
          .style('visibility', 'visible'),
        update => update.style('visibility', 'visible')
      );
  }

  codeStage0() {
    this.codeSel.transition().duration(250).style('height', '65px');
    this.codeSel.select('.hljs').transition().duration(250).style('top', '-73px');
  }

  codeStage1() {
    this.codeSel.transition().duration(250).style('height', '127px');
    this.codeSel.select('.hljs').transition().duration(250).style('top', '-97px');
  }

  codeStage2() {
    this.codeSel.transition().duration(250).style('height', '127px');
    this.codeSel.select('.hljs').transition().duration(250).style('top', '-168px');
  }

  codeStage3() {
    this.codeSel.transition().duration(250).style('height', '315px');
    this.codeSel.select('.hljs').transition().duration(250).style('top', '0px');
  }

  plotStage0() {
    this.plotSel.style('display', 'flex');
    this.plotSel.selectChild().style('visibility', 'hidden');
    this.plotSel.select('.amplitudes').selectAll('circle').remove()
    this.plotSel.select('.paths').selectAll('path').remove()
    this.plotSel.select('.measurements').selectAll('circle').remove()
  }

  plotStage1() {
    this.plotSel.style('display', 'flex');
    this.plotSel.selectChild().style('visibility', 'visible');
    this.createAmplitudes(true);
    this.plotSel.select('.paths').selectAll('path').remove()
    this.plotSel.select('.measurements').selectAll('circle').remove()
  }

  plotStage2() {
    this.plotSel.style('display', 'flex');
    this.plotSel.selectChild().style('visibility', 'visible');
    this.createAmplitudes(false);
    this.createPaths(true);
    this.plotSel.select('.measurements').selectAll('circle').remove()
  }

  plotStage3() {
    this.plotSel.style('display', 'flex');
    this.plotSel.selectChild().style('visibility', 'visible');
    this.createAmplitudes(false);
    this.createPaths(false);
    this.createMeasurements(true);
  }

  plotStage4() {
    this.plotSel.style('display', 'none');
    this.plotSel.selectChild().style('visibility', 'visible');
    this.createAmplitudes(false);
    this.createPaths(false);
    this.createMeasurements(false);
  }

  traceStage0() {
    this.traceSel.style('display', 'none');
    this.traceSel.selectAll('span').remove();
  }

  traceStage1() {
    this.traceSel.style('display', 'block');
    this.createTrace(true);
  }

  stage0() {
    this.codeStage0();
    this.plotStage0();
    this.traceStage0();
  }

  stage1() {
    this.codeStage0();
    this.plotStage1();
    this.traceStage0();
  }

  stage2() {
    this.codeStage1();
    this.plotStage1();
    this.traceStage0();
  }

  stage3() {
    this.codeStage1();
    this.plotStage2();
    this.traceStage0();
  }

  stage4() {
    this.codeStage2();
    this.plotStage2();
    this.traceStage0();
  }

  stage5() {
    this.codeStage2();
    this.plotStage3();
    this.traceStage0();
  }

  stage6() {
    this.codeStage3();
    this.plotStage4();
    this.traceStage1();
  }

  static get LAST_STAGE() {
    return 6;
  }
}


interface Reveal {
  on: (event: string, cb: (args: any[]) => void) => void,
  getCurrentSlide: () => HTMLElement,
  getConfig: () => { generatingDiagram: Partial<GeneratingDiagramConfig> },
  getState: () => { indexh: number, indexv: number, indexf: number },
  getSlides: () => HTMLElement[],
}

/**
 * This Reveal.js plugin will interface our class events with slide changes.
 */
function GeneratingDiagramPlugin() {
  let deck: Reveal | undefined;
  let parentElm: HTMLElement | undefined;
  let diagram: GeneratingDiagram | undefined;

  return {
    id: 'generatingDiagram',
    init: (reveal: Reveal) => {
      // when the deck is ready, we will append the GeneratingDiagram
      deck = reveal;
      deck.on('ready', (_) => {
        // ensure that there is a parent element in the configuration
        const generatingDiagramConfig = deck.getConfig().generatingDiagram;
        parentElm = generatingDiagramConfig.parentElm;
        if (!parentElm) throw new Error(NO_PARENT_MESSAGE);

        // establish the slide in which the parent resides (ASSUMES HORIZONTAL)
        const slideNum = deck.getSlides().findIndex(slide => slide.contains(parentElm));
        if (slideNum === -1) throw new Error(NO_PARENT_MESSAGE);

        // establish the current stage of the animation
        const getStage = ({ indexh, indexf }) => {
          if (indexh < slideNum) return 0;
          if (indexh > slideNum) return GeneratingDiagram.LAST_STAGE;
          switch (indexf) {
            case -1: return -1;
            case 0: return -1;
            case 1: return 0;
            case 2: return 1;
            case 3: return 1;
            case 4: return 2;
            case 5: return 3;
            case 6: return 3;
            case 7: return 4;
            case 8: return 5;
            case 9: return 5;
            case 10: return 6;
          }
        };
        const startStage = getStage(deck.getState());

        // start the GeneratingDiagram component
        diagram = new GeneratingDiagram({ 
          ...generatingDiagramConfig, 
          parentElm,
          startStage,
        });

        // interface the Reveal.js events with the diagram
        const fragmentCallback = () => diagram.setStage(getStage(deck.getState()));
        deck.on('fragmentshown', fragmentCallback);
        deck.on('fragmenthidden', fragmentCallback);
      });
    },
  };
}


export default GeneratingDiagramPlugin;
