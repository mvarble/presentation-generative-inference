import React from 'react';
import * as d3 from 'd3';
import hljs from 'highlight.js/lib/core';
import julia from 'highlight.js/lib/languages/julia';

import jlCode from 'raw-loader!./model.jl';
import traceTxt from 'raw-loader!./trace.txt';
import SAMPLES from './samples.json';
import { useDeck, SlideState, Deck } from '@presentations';
import { Palette, colorsByTheme } from '@utils/colors';
import { Theme } from '@utils/themes';
import useTheme from '@hooks/use-theme';

/**
 * establish some constants we will use
 */

// error message
const NO_PARENT_MESSAGE = 'GeneratingDiagram: `parentElm` is not in deck';

// sample data
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
  const output: string[] = [];
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
  theme: Theme,
  parentElm: HTMLElement,
  startStage: number,
}

/**
 * This class will create d3 animations for the `generating sources` slide of the presentation.
 * It will show Gen.jl code in addition to animating a plot
 */
class GeneratingDiagram {
  stage: number | undefined; // the stage of the animation
  codeSel: d3.Selection<HTMLDivElement, undefined, null, undefined>;
  plotSel: d3.Selection<HTMLDivElement, undefined, null, undefined>;
  traceSel: d3.Selection<HTMLDivElement, undefined, null, undefined>;
  theme: Theme | undefined;
  colors: Palette | undefined;

  constructor({ theme, parentElm, startStage }: GeneratingDiagramConfig) {
    // we necessarily need a parent element for the diagram to work
    if (!parentElm) throw new Error(NO_PARENT_MESSAGE);

    // create the container element and append it to the parent
    const containerSel = d3.create('div')
      .attr('class', 'w-full h-full flex flex-col overflow-y-hidden border border-stone-600 dark:border-black');
    parentElm.appendChild(containerSel.node() as HTMLElement);

    // create the code block and append it to the container
    this.codeSel = d3.create('div')
      .attr('class', 'm-0 overflow-y-hidden relative h-full');
    this.codeSel
      .append('div')
      .attr('class', 'hljs w-full absolute text-left pl-4 whitespace-pre')
      .attr('style', 'line-height: 24px; font-size: 18px;')
      .append('code')
        .html(CODE);
    (containerSel.node() as Node).appendChild(this.codeSel.node() as HTMLElement);

    // create the trace block and append it to the container
    this.traceSel = d3.create('div')
      .attr('class', 'flex-1 m-0 text-left font-mono bg-gray-300 text-lime-900 dark:bg-zinc-900 dark:text-lime-300 dark:opacity-50 ')
      .style('font-size', '10px');
    (containerSel.node() as Node).appendChild(this.traceSel.node() as HTMLElement);

    // create the plot block and append it to the container
    this.plotSel = d3.create('div').attr('class', 'flex flex-1 chart')
    const axis = this.plotSel
      .append('svg')
      .attr('class', 'm-auto')
      .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
      .append('g')
        .attr('transform', `translate(${8 * PAD}, ${PAD})`)
        .call(d3.axisLeft(YSCALE).ticks(5));
    axis.append('g').attr('class', 'amplitudes');
    axis.append('g').attr('class', 'paths');
    axis.append('g').attr('class', 'measurements');
    (containerSel.node() as Node).appendChild(this.plotSel.node() as HTMLElement);

    // start the diagram at the specified stage
    this.setStage(startStage, theme);
  }

  setStage(stage: number, theme: Theme) {
    // perform updates only if stage or palette changed
    if (stage === this.stage && theme === this.theme) return;
    this.stage = stage;
    this.theme = theme;
    this.colors = colorsByTheme(this.theme);

    // use d3 to animate between stages
    if (this.stage <= 0) this.stage0();
    else if (this.stage === 1) this.stage1();
    else if (this.stage === 2) this.stage2();
    else if (this.stage === 3) this.stage3();
    else if (this.stage === 4) this.stage4();
    else if (this.stage === 5) this.stage5();
    else if (this.stage === 6) this.stage6();
    else this.stage7();
  }

  createAmplitudes(delay: boolean) {
    if (typeof this.colors === 'undefined') return;
    const colors = this.colors;
    return this.plotSel.select('.amplitudes')
      .selectAll('circle')
      .data(SAMPLES)
      .join(
        // @ts-ignore
        enter => 
          enter.append('circle')
            .attr('cx', 0)
            .attr('cy', d => YSCALE(d[0]))
            .attr('fill', colors.green)
            .attr('fill-opacity', 0.25)
            .attr('stroke', colors.green)
            .attr('r', 0)
            .transition()
            .delay((_, i) => delay ? 1000 * i / SAMPLES.length : 0)
            .duration(delay ? 500 : 0)
            .attr('r', 2),
        update => 
          update
            .attr('fill', colors.green)
            .attr('stroke', colors.green)
            .attr('r', 2)
      );
  }

  createPaths(delay: boolean) {
    if (typeof this.colors === 'undefined') return;
    const colors = this.colors;
    const line = d3.line().x(d => d[0]).y(d => d[1]);
    return this.plotSel.select('.paths')
      .selectAll('path')
      .data(SAMPLES)
      .join(
        // @ts-ignore
        enter => {
          const path = enter.append('path')
            .datum(d => line(TIMESTAMPS.map(t => [XSCALE(t), YSCALE(d[0] * Math.cos(t))])))
            .attr("d", d => d)
            .attr('stroke', colors.green);
          if (delay && path.node()) {
            const length = (path.node() as SVGPathElement).getTotalLength() * 1.5;
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
        update => 
          update
            .attr('stroke', colors.green)
            .attr('stroke-dashoffset', 0),
      )
  }

  createMeasurements(delay: boolean) {
    if (typeof this.colors === 'undefined') return;
    const colors = this.colors;
    return this.plotSel.select('.measurements')
      .selectAll('circle')
      .data(SAMPLES)
      .join(
        // @ts-ignore
        enter => 
          enter.append('circle')
            .attr('cx', XSCALE(Math.PI))
            .attr('cy', d => YSCALE(d[1]))
            .attr('fill', colors.pink)
            .attr('fill-opacity', 0.25)
            .attr('stroke', colors.pink)
            .attr('r', 0)
            .transition()
            .delay((_, i) => delay ? 1000 * i / SAMPLES.length : 0)
            .duration(delay ? 500 : 0)
            .attr('r', 2),
        update => 
          update
            .attr('r', 2)
            .attr('fill', colors.pink)
            .attr('stroke', colors.pink)
      );
  }

  createTrace(delay: boolean) {
    return this.traceSel
      .selectAll('span')
      .data(TRACE)
      .join(
        // @ts-ignore
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
    this.codeSel.transition().duration(250).style('height', '312px');
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
    this.traceSel.selectAll('span').remove();
  }

  traceStage2() {
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

  stage7() {
    this.codeStage3();
    this.plotStage4();
    this.traceStage2();
  }

  static get LAST_STAGE() {
    return 7;
  }
}

/**
 * This React component will interface our GeneratingDiagram with React
 */
export default function GeneratingDiagramManager(
  { index, slideIndex, ...props }: { index: number, slideIndex: number }
) {
  // get a ref for the element
  const domRef = React.useRef<HTMLElement>(null);

  // get a ref for our diagram object
  const diagramRef = React.useRef<GeneratingDiagram>(null);

  // create a map of the stages
  const map = React.useMemo(() => (slideState: SlideState) => {
    if (!slideState) {
      return 0;
    } else {
      const { indexh, indexf } = slideState;
      if (indexh < slideIndex) return 0
      else if (indexh > slideIndex) return GeneratingDiagram.LAST_STAGE;
      else if (indexf < index) return 0;
      else if (indexf < index + 2) return indexf - index;
      else if (indexf < index + 5) return indexf - index - 1;
      else if (indexf < index + 9) return indexf - index - 2;
      else return GeneratingDiagram.LAST_STAGE;
    }
  }, [index, slideIndex]);

  // parse the deck state
  const slideState = useDeck((deck: Deck) => deck.slideState);

  // interface with the theme for colors
  const theme = useTheme();

  // effect: mount the diagramRef on domRef init
  React.useEffect(() => {
    if (domRef.current && !diagramRef.current) {
      // @ts-ignore
      diagramRef.current = new GeneratingDiagram({
        theme,
        parentElm: domRef.current,
        startStage: map(slideState),
      });
    }
  }, [domRef.current, map, slideState]);

  // effect: change stage on slideState and color change
  React.useEffect(() => {
    if (diagramRef.current) {
      diagramRef.current.setStage(map(slideState), theme);
    }
  }, [slideState, map, diagramRef.current, theme]);

  // @ts-ignore
  return <div { ...props } ref={ domRef } />;
}
