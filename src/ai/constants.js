const _4k = 4096;
const _8k = 8192;
const _16k = 16384;
const _32k = 32768;
const _128k = 128000;

export const MODEL_LIMITS = {
  'gpt-4o': _128k,
  'gpt-4o-2024-08-06': _128k,
  'gpt-4o-mini': _128k,
  'gpt-4o-mini-2024-07-18': _128k,
  'gpt-4o-2024-05-13': _128k,
  'gpt-4-turbo': _128k,
  'gpt-4-turbo-2024-04-09': _128k,
  'gpt-4-0125-preview': _128k,
  'gpt-4-1106-preview': _128k,
  'gpt-4-vision-preview': _128k,
  'gpt-4-turbo-preview': _128k,
  'gpt-4': _8k,
  'gpt-4-0613': _8k,
  'gpt-4-0314': _8k,
  'gpt-4-32k': _32k,
  'gpt-4-32k-0613': _32k,
  'gpt-3.5-turbo': _4k,
  'gpt-3.5-turbo-16k': _16k,
  'gpt-3.5-turbo-0613': _4k,
  'gpt-3.5-turbo-16k-0613': _16k,
  'gpt-3.5-turbo-0125': _16k,
  'gpt-3.5-turbo-instruct': _4k,
  'text-embedding-ada-002': _8k - 1,
  'text-embedding-3-small': _8k - 1,
  'text-embedding-3-large': _8k - 1,
  'text-davinci-003': _4k + 1,
  'text-davinci-002': _4k + 1,
  'code-davinci-002': 8001,
};
