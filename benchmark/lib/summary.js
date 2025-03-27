import { logger } from '../../src/log/logger.js';
import { Template } from '../../src/template/Template.js';
import { getAI } from '../../src/ai/index.js';

export const summaryPrompt = new Template(
  ['analyses', 'format'],
  `Given an analysis list or list of objects giving an analysis for runs of possibly related benchmark tests, summarize them into one comprehensive summary analysis.
Each analysis in the list represents a separate run of a benchmark.

Do not include information not mentioned in the analyses. Runs are not ordered but may be referred to by name.
If no analysis is available, respond with (No information) for the summary analysis. If there is only a single analysis, you may use that.

Try to provide a clear, concise and efficient overview that mentions all important differences. Avoid mentioning specific entries except as an example or unless results are otherwise nearly perfect.
You may assume that the reader expects information to refer to the actual results and differences to be from the expected results to the actual results unless otherwise mentioned.

-----

>>> List of analysis objects to summarize:
{{analyses}}

-----

>>> Respond in JSON format:
{{format}}

-----

In the summary, ensure that the most important information is mentioned first:  Start with an overall evaluation, noting any patterns in missing results or fields, any extra results or fields or other major mistakes, then less important issues.  Also note any out of order results, and any format differences that still answer the question properly.
Try to provide a clear, concise and efficient overview.  Maintain a most to least important pattern.

Respond ONLY in JSON, your response will be machine parsed using JSON.parse()`);

export const summarize = async (analyses) => {
  const ai = getAI('google:gemini-2.0-flash');
  const format = {};
  format['summary'] = 'Summary of aggregate analysis data in less than 300 words. Include an overview and the most important information first if available.';

  const context = {
    analyses: JSON.stringify(analyses, null, 2),
    format: JSON.stringify(format, null, 2),
  }
  const { prompt } = await summaryPrompt.renderCapped(context, 'analyses', ai);
  const answer = await ai.ask(prompt, { format: 'json' });
  const summary = answer.partial.summary;

  return summary;
}