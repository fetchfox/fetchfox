import { Template } from '../template/Template.js';

export const minimize = new Template(
  ['html'],
  `You are given some HTML from a real webpage. Your goal is to reduce its size. Your output should be valid HTML, but with cruft and junk removed. Keep key pieces of information, but remove obfuscated classnames, complicated code, any CSS style sheets, SVG code, embedded images, and other pieces of information not critical to the CONTENT of the page.

MAIN GOAL: You want to KEEP THE CONTENT and get rid of FORMATTING, CRUFT, AND JUNK.

Try to keep around 10-20% of the input HTML.

Here is the HTML to minimize: {{html}}`);
