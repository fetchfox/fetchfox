
export const models = {
  "source": "https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json",
  "sample_spec": {
    "max_tokens": "set to max_output_tokens if provider specifies it. IF not set to max_tokens provider specifies", 
    "max_input_tokens": "max input tokens, if the provider specifies it. if not default to max_tokens",
    "max_output_tokens": "max output tokens, if the provider specifies it. if not default to max_tokens", 
    "input_cost_per_token": 0.0000,
    "output_cost_per_token": 0.000,
    "litellm_provider": "one of https://docs.litellm.ai/docs/providers",
    "mode": "one of chat, embedding, completion, image_generation, audio_transcription, audio_speech",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "gpt-4": {
    "max_tokens": 4096, 
    "max_input_tokens": 8192,
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.00003,
    "output_cost_per_token": 0.00006,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true
  },
  "gpt-4o": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000005,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "gpt-4o-mini": {
    "max_tokens": 16384,
    "max_input_tokens": 128000,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.00000015,
    "output_cost_per_token": 0.00000060,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "gpt-4o-mini-2024-07-18": {
    "max_tokens": 16384,
    "max_input_tokens": 128000,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.00000015,
    "output_cost_per_token": 0.00000060,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "o1-mini": {
    "max_tokens": 65536,
    "max_input_tokens": 128000,
    "max_output_tokens": 65536,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000012,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "o1-mini-2024-09-12": {
    "max_tokens": 65536,
    "max_input_tokens": 128000,
    "max_output_tokens": 65536,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000012,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "o1-preview": {
    "max_tokens": 32768,
    "max_input_tokens": 128000,
    "max_output_tokens": 32768,
    "input_cost_per_token": 0.000015,
    "output_cost_per_token": 0.000060,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "o1-preview-2024-09-12": {
    "max_tokens": 32768,
    "max_input_tokens": 128000,
    "max_output_tokens": 32768,
    "input_cost_per_token": 0.000015,
    "output_cost_per_token": 0.000060,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "chatgpt-4o-latest": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000005,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "gpt-4o-2024-05-13": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000005,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "gpt-4o-2024-08-06": {
    "max_tokens": 16384,
    "max_input_tokens": 128000,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.0000025,
    "output_cost_per_token": 0.000010,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "gpt-4-turbo-preview": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "gpt-4-0314": {
    "max_tokens": 4096,
    "max_input_tokens": 8192,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00003,
    "output_cost_per_token": 0.00006,
    "litellm_provider": "openai",
    "mode": "chat"
  },
  "gpt-4-0613": {
    "max_tokens": 4096,
    "max_input_tokens": 8192,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00003,
    "output_cost_per_token": 0.00006,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true
  },
  "gpt-4-32k": {
    "max_tokens": 4096,
    "max_input_tokens": 32768,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00006,
    "output_cost_per_token": 0.00012,
    "litellm_provider": "openai",
    "mode": "chat"
  },
  "gpt-4-32k-0314": {
    "max_tokens": 4096,
    "max_input_tokens": 32768,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00006,
    "output_cost_per_token": 0.00012,
    "litellm_provider": "openai",
    "mode": "chat"
  },
  "gpt-4-32k-0613": {
    "max_tokens": 4096,
    "max_input_tokens": 32768,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00006,
    "output_cost_per_token": 0.00012,
    "litellm_provider": "openai",
    "mode": "chat"
  },
  "gpt-4-turbo": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "gpt-4-turbo-2024-04-09": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "gpt-4-1106-preview": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "gpt-4-0125-preview": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "gpt-4-vision-preview": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_vision": true
  },
  "gpt-4-1106-vision-preview": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_vision": true
  },
  "gpt-3.5-turbo": {
    "max_tokens": 4097,
    "max_input_tokens": 16385,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000015,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true
  },
  "gpt-3.5-turbo-0301": {
    "max_tokens": 4097,
    "max_input_tokens": 4097,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000015,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "openai",
    "mode": "chat"
  },
  "gpt-3.5-turbo-0613": {
    "max_tokens": 4097,
    "max_input_tokens": 4097,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000015,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true
  },
  "gpt-3.5-turbo-1106": {
    "max_tokens": 16385,
    "max_input_tokens": 16385,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000010,
    "output_cost_per_token": 0.0000020,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "gpt-3.5-turbo-0125": {
    "max_tokens": 16385,
    "max_input_tokens": 16385,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000015,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "gpt-3.5-turbo-16k": {
    "max_tokens": 16385,
    "max_input_tokens": 16385,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000004,
    "litellm_provider": "openai",
    "mode": "chat"
  },
  "gpt-3.5-turbo-16k-0613": {
    "max_tokens": 16385,
    "max_input_tokens": 16385,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000004,
    "litellm_provider": "openai",
    "mode": "chat"
  },
  "ft:gpt-3.5-turbo": {
    "max_tokens": 4096,
    "max_input_tokens": 16385,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000006,
    "litellm_provider": "openai",
    "mode": "chat"
  },
  "ft:gpt-3.5-turbo-0125": {
    "max_tokens": 4096,
    "max_input_tokens": 16385,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000006,
    "litellm_provider": "openai",
    "mode": "chat"
  },
  "ft:gpt-3.5-turbo-1106": {
    "max_tokens": 4096,
    "max_input_tokens": 16385,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000006,
    "litellm_provider": "openai",
    "mode": "chat"
  },
  "ft:gpt-3.5-turbo-0613": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000006,
    "litellm_provider": "openai",
    "mode": "chat"
  },
  "ft:gpt-4-0613": {
    "max_tokens": 4096,
    "max_input_tokens": 8192,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00003,
    "output_cost_per_token": 0.00006,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "source": "OpenAI needs to add pricing for this ft model, will be updated when added by OpenAI. Defaulting to base model pricing"
  },
  "ft:gpt-4o-2024-08-06": {
    "max_tokens": 16384,
    "max_input_tokens": 128000,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.00000375,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "ft:gpt-4o-mini-2024-07-18": {
    "max_tokens": 16384,
    "max_input_tokens": 128000,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.0000003,
    "output_cost_per_token": 0.0000012,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "ft:davinci-002": {
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000002,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "text-completion-openai",
    "mode": "completion"
  },
  "ft:babbage-002": {
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000004,
    "output_cost_per_token": 0.0000004,
    "litellm_provider": "text-completion-openai",
    "mode": "completion"
  },
  "text-embedding-3-large": {
    "max_tokens": 8191,
    "max_input_tokens": 8191,
    "output_vector_size": 3072,
    "input_cost_per_token": 0.00000013,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "openai",
    "mode": "embedding"
  },
  "text-embedding-3-small": {
    "max_tokens": 8191,
    "max_input_tokens": 8191,
    "output_vector_size": 1536, 
    "input_cost_per_token": 0.00000002,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "openai",
    "mode": "embedding"
  },
  "text-embedding-ada-002": {
    "max_tokens": 8191,
    "max_input_tokens": 8191,
    "output_vector_size": 1536, 
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "openai",
    "mode": "embedding"
  },
  "text-embedding-ada-002-v2": {
    "max_tokens": 8191,
    "max_input_tokens": 8191,
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "openai",
    "mode": "embedding"
  },
  "text-moderation-stable": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 0,
    "input_cost_per_token": 0.000000,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "openai",
    "mode": "moderations"
  },
  "text-moderation-007": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 0,
    "input_cost_per_token": 0.000000,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "openai",
    "mode": "moderations"
  },
  "text-moderation-latest": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 0,
    "input_cost_per_token": 0.000000,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "openai",
    "mode": "moderations"
  },
  "256-x-256/dall-e-2": {
    "mode": "image_generation",
    "input_cost_per_pixel": 0.00000024414,
    "output_cost_per_pixel": 0.0,
    "litellm_provider": "openai"
  },
  "512-x-512/dall-e-2": {
    "mode": "image_generation",
    "input_cost_per_pixel": 0.0000000686,
    "output_cost_per_pixel": 0.0,
    "litellm_provider": "openai"
  },
  "1024-x-1024/dall-e-2": {
    "mode": "image_generation",
    "input_cost_per_pixel": 0.000000019,
    "output_cost_per_pixel": 0.0,
    "litellm_provider": "openai"
  },
  "hd/1024-x-1792/dall-e-3": {
    "mode": "image_generation",
    "input_cost_per_pixel": 0.00000006539,
    "output_cost_per_pixel": 0.0,
    "litellm_provider": "openai"
  },
  "hd/1792-x-1024/dall-e-3": {
    "mode": "image_generation",
    "input_cost_per_pixel": 0.00000006539,
    "output_cost_per_pixel": 0.0,
    "litellm_provider": "openai"
  },
  "hd/1024-x-1024/dall-e-3": {
    "mode": "image_generation",
    "input_cost_per_pixel": 0.00000007629,
    "output_cost_per_pixel": 0.0,
    "litellm_provider": "openai"
  },
  "standard/1024-x-1792/dall-e-3": {
    "mode": "image_generation",
    "input_cost_per_pixel": 0.00000004359,
    "output_cost_per_pixel": 0.0,
    "litellm_provider": "openai"
  },
  "standard/1792-x-1024/dall-e-3": {
    "mode": "image_generation",
    "input_cost_per_pixel": 0.00000004359,
    "output_cost_per_pixel": 0.0,
    "litellm_provider": "openai"
  },
  "standard/1024-x-1024/dall-e-3": {
    "mode": "image_generation",
    "input_cost_per_pixel": 0.0000000381469,
    "output_cost_per_pixel": 0.0,
    "litellm_provider": "openai"
  },
  "whisper-1": {
    "mode": "audio_transcription",
    "input_cost_per_second": 0,
    "output_cost_per_second": 0.0001, 
    "litellm_provider": "openai"
  }, 
  "tts-1": {
    "mode": "audio_speech", 
    "input_cost_per_character": 0.000015,
    "litellm_provider": "openai"
  },
  "tts-1-hd": {
    "mode": "audio_speech", 
    "input_cost_per_character": 0.000030,
    "litellm_provider": "openai"
  },
  "azure/tts-1": {
    "mode": "audio_speech", 
    "input_cost_per_character": 0.000015,
    "litellm_provider": "azure"
  },
  "azure/tts-1-hd": {
    "mode": "audio_speech", 
    "input_cost_per_character": 0.000030,
    "litellm_provider": "azure"
  },
  "azure/whisper-1": {
    "mode": "audio_transcription",
    "input_cost_per_second": 0, 
    "output_cost_per_second": 0.0001, 
    "litellm_provider": "azure"
  },
  "azure/gpt-4o": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000005,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "azure/gpt-4o-2024-08-06": {
    "max_tokens": 16384,
    "max_input_tokens": 128000,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.00000275,
    "output_cost_per_token": 0.000011,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "azure/global-standard/gpt-4o-2024-08-06": {
    "max_tokens": 16384,
    "max_input_tokens": 128000,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.0000025,
    "output_cost_per_token": 0.000010,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "azure/global-standard/gpt-4o-mini": {
    "max_tokens": 16384,
    "max_input_tokens": 128000,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.00000015,
    "output_cost_per_token": 0.00000060,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "azure/gpt-4o-mini": {
    "max_tokens": 16384,
    "max_input_tokens": 128000,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.000000165,
    "output_cost_per_token": 0.00000066,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "azure/gpt-4-turbo-2024-04-09": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "azure/gpt-4-0125-preview": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "azure/gpt-4-1106-preview": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "azure/gpt-4-0613": {
    "max_tokens": 4096,
    "max_input_tokens": 8192,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00003,
    "output_cost_per_token": 0.00006,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true
  },
  "azure/gpt-4-32k-0613": {
    "max_tokens": 4096,
    "max_input_tokens": 32768,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00006,
    "output_cost_per_token": 0.00012,
    "litellm_provider": "azure",
    "mode": "chat"
  },
  "azure/gpt-4-32k": {
    "max_tokens": 4096,
    "max_input_tokens": 32768,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00006,
    "output_cost_per_token": 0.00012,
    "litellm_provider": "azure",
    "mode": "chat"
  },
  "azure/gpt-4": {
    "max_tokens": 4096,
    "max_input_tokens": 8192,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00003,
    "output_cost_per_token": 0.00006,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true
  },
  "azure/gpt-4-turbo": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "litellm_provider": "azure", 
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "azure/gpt-4-turbo-vision-preview": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "litellm_provider": "azure", 
    "mode": "chat",
    "supports_vision": true
  },
  "azure/gpt-35-turbo-16k-0613": {
    "max_tokens": 4096,
    "max_input_tokens": 16385,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000004,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true
  },
  "azure/gpt-35-turbo-1106": {
    "max_tokens": 4096,
    "max_input_tokens": 16384,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000001,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "azure/gpt-35-turbo-0125": {
    "max_tokens": 4096,
    "max_input_tokens": 16384,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000015,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "azure/gpt-35-turbo-16k": {
    "max_tokens": 4096,
    "max_input_tokens": 16385,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000004,
    "litellm_provider": "azure",
    "mode": "chat"
  },
  "azure/gpt-35-turbo": {
    "max_tokens": 4096,
    "max_input_tokens": 4097,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000015,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true
  },
  "azure/gpt-3.5-turbo-instruct-0914": {
    "max_tokens": 4097,
    "max_input_tokens": 4097,
    "input_cost_per_token": 0.0000015,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "text-completion-openai",
    "mode": "completion"
  },
  "azure/gpt-35-turbo-instruct": {
    "max_tokens": 4097,
    "max_input_tokens": 4097,
    "input_cost_per_token": 0.0000015,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "text-completion-openai",
    "mode": "completion"
  },
  "azure/mistral-large-latest": {
    "max_tokens": 32000,
    "max_input_tokens": 32000,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true
  },
  "azure/mistral-large-2402": {
    "max_tokens": 32000,
    "max_input_tokens": 32000,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true
  },
  "azure/command-r-plus": {
    "max_tokens": 4096, 
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "azure",
    "mode": "chat",
    "supports_function_calling": true
  },
  "azure/ada": {
    "max_tokens": 8191,
    "max_input_tokens": 8191,
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "azure",
    "mode": "embedding"
  },
  "azure/text-embedding-ada-002": {
    "max_tokens": 8191,
    "max_input_tokens": 8191,
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "azure",
    "mode": "embedding"
  },
  "azure/text-embedding-3-large": {
    "max_tokens": 8191,
    "max_input_tokens": 8191,
    "input_cost_per_token": 0.00000013,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "azure",
    "mode": "embedding"
  },
  "azure/text-embedding-3-small": {
    "max_tokens": 8191,
    "max_input_tokens": 8191,
    "input_cost_per_token": 0.00000002,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "azure",
    "mode": "embedding"
  },    
  "azure/standard/1024-x-1024/dall-e-3": {
    "input_cost_per_pixel": 0.0000000381469,
    "output_cost_per_token": 0.0,
    "litellm_provider": "azure", 
    "mode": "image_generation"
  },
  "azure/hd/1024-x-1024/dall-e-3": {
    "input_cost_per_pixel": 0.00000007629,
    "output_cost_per_token": 0.0,
    "litellm_provider": "azure", 
    "mode": "image_generation"
  },
  "azure/standard/1024-x-1792/dall-e-3": {
    "input_cost_per_pixel": 0.00000004359,
    "output_cost_per_token": 0.0,
    "litellm_provider": "azure", 
    "mode": "image_generation"
  },
  "azure/standard/1792-x-1024/dall-e-3": {
    "input_cost_per_pixel": 0.00000004359,
    "output_cost_per_token": 0.0,
    "litellm_provider": "azure", 
    "mode": "image_generation"
  },
  "azure/hd/1024-x-1792/dall-e-3": {
    "input_cost_per_pixel": 0.00000006539,
    "output_cost_per_token": 0.0,
    "litellm_provider": "azure", 
    "mode": "image_generation"
  },
  "azure/hd/1792-x-1024/dall-e-3": {
    "input_cost_per_pixel": 0.00000006539,
    "output_cost_per_token": 0.0,
    "litellm_provider": "azure", 
    "mode": "image_generation"
  },
  "azure/standard/1024-x-1024/dall-e-2": {
    "input_cost_per_pixel": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "azure", 
    "mode": "image_generation"
  },
  "azure_ai/jamba-instruct": {
    "max_tokens": 4096,
    "max_input_tokens": 70000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000007,
    "litellm_provider": "azure_ai",
    "mode": "chat"
  },
  "azure_ai/mistral-large": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000004,
    "output_cost_per_token": 0.000012,
    "litellm_provider": "azure_ai",
    "mode": "chat",
    "supports_function_calling": true
  },
  "azure_ai/mistral-small": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000001,
    "output_cost_per_token": 0.000003,
    "litellm_provider": "azure_ai",
    "supports_function_calling": true,
    "mode": "chat"
  },
  "azure_ai/Meta-Llama-3-70B-Instruct": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0000011,
    "output_cost_per_token": 0.00000037,
    "litellm_provider": "azure_ai",
    "mode": "chat"
  },
  "azure_ai/Meta-Llama-31-8B-Instruct": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token": 0.0000003,
    "output_cost_per_token": 0.00000061,
    "litellm_provider": "azure_ai",
    "mode": "chat",
    "source":"https://azuremarketplace.microsoft.com/en-us/marketplace/apps/metagenai.meta-llama-3-1-8b-instruct-offer?tab=PlansAndPrice"
  },
  "azure_ai/Meta-Llama-31-70B-Instruct": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token": 0.00000268,
    "output_cost_per_token": 0.00000354,
    "litellm_provider": "azure_ai",
    "mode": "chat",
    "source":"https://azuremarketplace.microsoft.com/en-us/marketplace/apps/metagenai.meta-llama-3-1-70b-instruct-offer?tab=PlansAndPrice"
  },
  "azure_ai/Meta-Llama-31-405B-Instruct": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token": 0.00000533,
    "output_cost_per_token": 0.000016,
    "litellm_provider": "azure_ai",
    "mode": "chat",
    "source":"https://azuremarketplace.microsoft.com/en-us/marketplace/apps/metagenai.meta-llama-3-1-405b-instruct-offer?tab=PlansAndPrice"
  },
  "babbage-002": {
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000004,
    "output_cost_per_token": 0.0000004,
    "litellm_provider": "text-completion-openai",
    "mode": "completion"
  },
  "davinci-002": {
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000002,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "text-completion-openai",
    "mode": "completion"
  },    
  "gpt-3.5-turbo-instruct": {
    "max_tokens": 4096,
    "max_input_tokens": 8192,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000015,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "text-completion-openai",
    "mode": "completion"
  },
  "gpt-3.5-turbo-instruct-0914": {
    "max_tokens": 4097,
    "max_input_tokens": 8192,
    "max_output_tokens": 4097,
    "input_cost_per_token": 0.0000015,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "text-completion-openai",
    "mode": "completion"

  },
  "claude-instant-1": {
    "max_tokens": 8191,
    "max_input_tokens": 100000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000163,
    "output_cost_per_token": 0.00000551,
    "litellm_provider": "anthropic",
    "mode": "chat"
  },
  "mistral/mistral-tiny": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000025,
    "output_cost_per_token": 0.00000025,
    "litellm_provider": "mistral",
    "mode": "chat",
    "supports_assistant_prefill": true
  },
  "mistral/mistral-small": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000001,
    "output_cost_per_token": 0.000003,
    "litellm_provider": "mistral",
    "supports_function_calling": true,
    "mode": "chat",
    "supports_assistant_prefill": true
  },
  "mistral/mistral-small-latest": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000001,
    "output_cost_per_token": 0.000003,
    "litellm_provider": "mistral",
    "supports_function_calling": true,
    "mode": "chat",
    "supports_assistant_prefill": true
  },
  "mistral/mistral-medium": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.0000027,
    "output_cost_per_token": 0.0000081,
    "litellm_provider": "mistral",
    "mode": "chat",
    "supports_assistant_prefill": true
  },
  "mistral/mistral-medium-latest": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.0000027,
    "output_cost_per_token": 0.0000081,
    "litellm_provider": "mistral",
    "mode": "chat",
    "supports_assistant_prefill": true
  },
  "mistral/mistral-medium-2312": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.0000027,
    "output_cost_per_token": 0.0000081,
    "litellm_provider": "mistral",
    "mode": "chat",
    "supports_assistant_prefill": true
  },
  "mistral/mistral-large-latest": {
    "max_tokens": 32000,
    "max_input_tokens": 32000,
    "max_tokens_wrong": 128000,
    "max_input_tokens_wrong": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000009,
    "litellm_provider": "mistral",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_assistant_prefill": true
  },
  "mistral/mistral-large-2402": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000004,
    "output_cost_per_token": 0.000012,
    "litellm_provider": "mistral",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_assistant_prefill": true
  },
  "mistral/mistral-large-2407": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000009,
    "litellm_provider": "mistral",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_assistant_prefill": true
  },
  "mistral/open-mistral-7b": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000025,
    "output_cost_per_token": 0.00000025,
    "litellm_provider": "mistral",
    "mode": "chat",
    "supports_assistant_prefill": true
  },
  "mistral/open-mixtral-8x7b": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.0000007,
    "output_cost_per_token": 0.0000007,
    "litellm_provider": "mistral",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_assistant_prefill": true
  },
  "mistral/open-mixtral-8x22b": {
    "max_tokens": 8191,
    "max_input_tokens": 64000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000002,
    "output_cost_per_token": 0.000006,
    "litellm_provider": "mistral",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_assistant_prefill": true
  },
  "mistral/codestral-latest": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000001,
    "output_cost_per_token": 0.000003,
    "litellm_provider": "mistral",
    "mode": "chat",
    "supports_assistant_prefill": true
  },
  "mistral/codestral-2405": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000001,
    "output_cost_per_token": 0.000003,
    "litellm_provider": "mistral",
    "mode": "chat",
    "supports_assistant_prefill": true
  },
  "mistral/open-mistral-nemo": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token":  0.0000003,
    "output_cost_per_token": 0.0000003,
    "litellm_provider": "mistral",
    "mode": "chat",
    "source": "https://mistral.ai/technology/",
    "supports_assistant_prefill": true
  },
  "mistral/open-mistral-nemo-2407": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token":  0.0000003,
    "output_cost_per_token": 0.0000003,
    "litellm_provider": "mistral",
    "mode": "chat",
    "source": "https://mistral.ai/technology/",
    "supports_assistant_prefill": true
  },
  "mistral/open-codestral-mamba": {
    "max_tokens": 256000,
    "max_input_tokens": 256000,
    "max_output_tokens": 256000,
    "input_cost_per_token": 0.00000025,
    "output_cost_per_token": 0.00000025,
    "litellm_provider": "mistral",
    "mode": "chat",
    "source": "https://mistral.ai/technology/",
    "supports_assistant_prefill": true
  },
  "mistral/codestral-mamba-latest": {
    "max_tokens": 256000,
    "max_input_tokens": 256000,
    "max_output_tokens": 256000,
    "input_cost_per_token": 0.00000025,
    "output_cost_per_token": 0.00000025,
    "litellm_provider": "mistral",
    "mode": "chat",
    "source": "https://mistral.ai/technology/",
    "supports_assistant_prefill": true
  },
  "mistral/mistral-embed": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "input_cost_per_token": 0.0000001,
    "litellm_provider": "mistral",
    "mode": "embedding"
  },
  "deepseek-chat": {
    "max_tokens": 4096,
    "max_input_tokens": 32000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000014,
    "input_cost_per_token_cache_hit": 0.000000014,
    "output_cost_per_token": 0.00000028,
    "litellm_provider": "deepseek",
    "mode": "chat",
    "supports_function_calling": true, 
    "supports_assistant_prefill": true,
    "supports_tool_choice": true
  },
  "codestral/codestral-latest": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000000,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "codestral",
    "mode": "chat",
    "source": "https://docs.mistral.ai/capabilities/code_generation/",
    "supports_assistant_prefill": true
  },
  "codestral/codestral-2405": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000000,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "codestral",
    "mode": "chat",
    "source": "https://docs.mistral.ai/capabilities/code_generation/",
    "supports_assistant_prefill": true
  },
  "text-completion-codestral/codestral-latest": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000000,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "text-completion-codestral",
    "mode": "completion",
    "source": "https://docs.mistral.ai/capabilities/code_generation/"
  },
  "text-completion-codestral/codestral-2405": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000000,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "text-completion-codestral",
    "mode": "completion",
    "source": "https://docs.mistral.ai/capabilities/code_generation/"
  },
  "deepseek-coder": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000014,
    "input_cost_per_token_cache_hit": 0.000000014,
    "output_cost_per_token": 0.00000028,
    "litellm_provider": "deepseek",
    "mode": "chat",
    "supports_function_calling": true, 
    "supports_assistant_prefill": true,
    "supports_tool_choice": true
  },
  "groq/llama2-70b-4096": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000070,
    "output_cost_per_token": 0.00000080,
    "litellm_provider": "groq",
    "mode": "chat",
    "supports_function_calling": true
  },
  "groq/llama3-8b-8192": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000005,
    "output_cost_per_token": 0.00000008,
    "litellm_provider": "groq",
    "mode": "chat",
    "supports_function_calling": true
  },
  "groq/llama3-70b-8192": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000059,
    "output_cost_per_token": 0.00000079,
    "litellm_provider": "groq",
    "mode": "chat",
    "supports_function_calling": true
  },
  "groq/llama-3.1-8b-instant": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000059,
    "output_cost_per_token": 0.00000079,
    "litellm_provider": "groq",
    "mode": "chat",
    "supports_function_calling": true
  },
  "groq/llama-3.1-70b-versatile": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000059,
    "output_cost_per_token": 0.00000079,
    "litellm_provider": "groq",
    "mode": "chat",
    "supports_function_calling": true
  },
  "groq/llama-3.1-405b-reasoning": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000059,
    "output_cost_per_token": 0.00000079,
    "litellm_provider": "groq",
    "mode": "chat",
    "supports_function_calling": true
  },
  "groq/mixtral-8x7b-32768": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 32768,
    "input_cost_per_token": 0.00000024,
    "output_cost_per_token": 0.00000024,
    "litellm_provider": "groq",
    "mode": "chat",
    "supports_function_calling": true
  },
  "groq/gemma-7b-it": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000007,
    "output_cost_per_token": 0.00000007,
    "litellm_provider": "groq",
    "mode": "chat",
    "supports_function_calling": true
  },
  "groq/llama3-groq-70b-8192-tool-use-preview": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000089,
    "output_cost_per_token": 0.00000089,
    "litellm_provider": "groq",
    "mode": "chat",
    "supports_function_calling": true
  },
  "groq/llama3-groq-8b-8192-tool-use-preview": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000019,
    "output_cost_per_token": 0.00000019,
    "litellm_provider": "groq",
    "mode": "chat",
    "supports_function_calling": true
  },
  "cerebras/llama3.1-8b": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.0000001,
    "litellm_provider": "cerebras",
    "mode": "chat",
    "supports_function_calling": true
  },
  "cerebras/llama3.1-70b": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token": 0.0000006,
    "output_cost_per_token": 0.0000006,
    "litellm_provider": "cerebras",
    "mode": "chat",
    "supports_function_calling": true
  },
  "friendliai/mixtral-8x7b-instruct-v0-1": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 32768,
    "input_cost_per_token": 0.0000004,
    "output_cost_per_token": 0.0000004,
    "litellm_provider": "friendliai",
    "mode": "chat",
    "supports_function_calling": true
  },
  "friendliai/meta-llama-3-8b-instruct": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.0000001,
    "litellm_provider": "friendliai",
    "mode": "chat",
    "supports_function_calling": true
  },
  "friendliai/meta-llama-3-70b-instruct": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0000008,
    "output_cost_per_token": 0.0000008,
    "litellm_provider": "friendliai",
    "mode": "chat",
    "supports_function_calling": true
  },
  "claude-instant-1.2": {
    "max_tokens": 8191,
    "max_input_tokens": 100000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000000163,
    "output_cost_per_token": 0.000000551,
    "litellm_provider": "anthropic",
    "mode": "chat"
  },
  "claude-2": {
    "max_tokens": 8191,
    "max_input_tokens": 100000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "anthropic",
    "mode": "chat"
  },
  "claude-2.1": {
    "max_tokens": 8191,
    "max_input_tokens": 200000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "anthropic",
    "mode": "chat"
  },
  "claude-3-haiku-20240307": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000025,
    "output_cost_per_token": 0.00000125,
    "cache_creation_input_token_cost": 0.0000003,
    "cache_read_input_token_cost": 0.00000003,
    "litellm_provider": "anthropic",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "tool_use_system_prompt_tokens": 264,
    "supports_assistant_prefill": true
  },
  "claude-3-opus-20240229": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000015,
    "output_cost_per_token": 0.000075,
    "cache_creation_input_token_cost": 0.00001875,
    "cache_read_input_token_cost": 0.0000015,
    "litellm_provider": "anthropic",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "tool_use_system_prompt_tokens": 395,
    "supports_assistant_prefill": true
  },
  "claude-3-sonnet-20240229": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "anthropic",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "tool_use_system_prompt_tokens": 159,
    "supports_assistant_prefill": true
  },
  "claude-3-5-sonnet-20240620": {
    "max_tokens": 8192,
    "max_input_tokens": 200000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "cache_creation_input_token_cost": 0.00000375,
    "cache_read_input_token_cost": 0.0000003,
    "litellm_provider": "anthropic",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "tool_use_system_prompt_tokens": 159,
    "supports_assistant_prefill": true
  },
  "text-bison": {
    "max_tokens": 2048,
    "max_input_tokens": 8192,
    "max_output_tokens": 2048,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "text-bison@001": {
    "max_tokens": 1024,
    "max_input_tokens": 8192,
    "max_output_tokens": 1024,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "text-bison@002": {
    "max_tokens": 1024,
    "max_input_tokens": 8192,
    "max_output_tokens": 1024,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "text-bison32k": {
    "max_tokens": 1024,
    "max_input_tokens": 8192,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "text-bison32k@002": {
    "max_tokens": 1024,
    "max_input_tokens": 8192,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "text-unicorn": {
    "max_tokens": 1024,
    "max_input_tokens": 8192,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.000028,
    "litellm_provider": "vertex_ai-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "text-unicorn@001": {
    "max_tokens": 1024,
    "max_input_tokens": 8192,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.000028,
    "litellm_provider": "vertex_ai-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "chat-bison": {
    "max_tokens": 4096,
    "max_input_tokens": 8192,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-chat-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "chat-bison@001": {
    "max_tokens": 4096,
    "max_input_tokens": 8192,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-chat-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "chat-bison@002": {
    "max_tokens": 4096,
    "max_input_tokens": 8192,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-chat-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "chat-bison-32k": {
    "max_tokens": 8192,
    "max_input_tokens": 32000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-chat-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "chat-bison-32k@002": {
    "max_tokens": 8192,
    "max_input_tokens": 32000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-chat-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "code-bison": {
    "max_tokens": 1024,
    "max_input_tokens": 6144,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-code-text-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "code-bison@001": {
    "max_tokens": 1024,
    "max_input_tokens": 6144,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-code-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "code-bison@002": {
    "max_tokens": 1024,
    "max_input_tokens": 6144,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-code-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "code-bison32k": {
    "max_tokens": 1024,
    "max_input_tokens": 6144,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-code-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "code-bison-32k@002": {
    "max_tokens": 1024,
    "max_input_tokens": 6144,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-code-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "code-gecko@001": {
    "max_tokens": 64,
    "max_input_tokens": 2048,
    "max_output_tokens": 64,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "litellm_provider": "vertex_ai-code-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "code-gecko@002": {
    "max_tokens": 64,
    "max_input_tokens": 2048,
    "max_output_tokens": 64,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "litellm_provider": "vertex_ai-code-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "code-gecko": {
    "max_tokens": 64,
    "max_input_tokens": 2048,
    "max_output_tokens": 64,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "litellm_provider": "vertex_ai-code-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "code-gecko-latest": {
    "max_tokens": 64,
    "max_input_tokens": 2048,
    "max_output_tokens": 64,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "litellm_provider": "vertex_ai-code-text-models",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "codechat-bison@latest": {
    "max_tokens": 1024,
    "max_input_tokens": 6144,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-code-chat-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "codechat-bison": {
    "max_tokens": 1024,
    "max_input_tokens": 6144,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-code-chat-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "codechat-bison@001": {
    "max_tokens": 1024,
    "max_input_tokens": 6144,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-code-chat-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "codechat-bison@002": {
    "max_tokens": 1024,
    "max_input_tokens": 6144,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-code-chat-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "codechat-bison-32k": {
    "max_tokens": 8192,
    "max_input_tokens": 32000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-code-chat-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "codechat-bison-32k@002": {
    "max_tokens": 8192,
    "max_input_tokens": 32000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "input_cost_per_character": 0.00000025,
    "output_cost_per_character": 0.0000005,
    "litellm_provider": "vertex_ai-code-chat-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-pro": {
    "max_tokens": 8192,
    "max_input_tokens": 32760,
    "max_output_tokens": 8192,
    "input_cost_per_image": 0.0025,
    "input_cost_per_video_per_second": 0.002,
    "input_cost_per_token": 0.0000005, 
    "input_cost_per_character": 0.000000125, 
    "output_cost_per_token": 0.0000015,
    "output_cost_per_character": 0.000000375,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/pricing"
  },
  "gemini-1.0-pro": { 
    "max_tokens": 8192,
    "max_input_tokens": 32760,
    "max_output_tokens": 8192,
    "input_cost_per_image": 0.0025,
    "input_cost_per_video_per_second": 0.002,
    "input_cost_per_token": 0.0000005, 
    "input_cost_per_character": 0.000000125, 
    "output_cost_per_token": 0.0000015,
    "output_cost_per_character": 0.000000375,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/pricing#google_models"
  },
  "gemini-1.0-pro-001": { 
    "max_tokens": 8192,
    "max_input_tokens": 32760,
    "max_output_tokens": 8192,
    "input_cost_per_image": 0.0025,
    "input_cost_per_video_per_second": 0.002,
    "input_cost_per_token": 0.0000005, 
    "input_cost_per_character": 0.000000125, 
    "output_cost_per_token": 0.0000015,
    "output_cost_per_character": 0.000000375,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.0-ultra": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 2048,
    "input_cost_per_image": 0.0025,
    "input_cost_per_video_per_second": 0.002,
    "input_cost_per_token": 0.0000005, 
    "input_cost_per_character": 0.000000125, 
    "output_cost_per_token": 0.0000015,
    "output_cost_per_character": 0.000000375,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_function_calling": true,
    "source": "As of Jun, 2024. There is no available doc on vertex ai pricing gemini-1.0-ultra-001. Using gemini-1.0-pro pricing. Got max_tokens info here: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.0-ultra-001": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 2048,
    "input_cost_per_image": 0.0025,
    "input_cost_per_video_per_second": 0.002,
    "input_cost_per_token": 0.0000005, 
    "input_cost_per_character": 0.000000125, 
    "output_cost_per_token": 0.0000015,
    "output_cost_per_character": 0.000000375,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_function_calling": true,
    "source": "As of Jun, 2024. There is no available doc on vertex ai pricing gemini-1.0-ultra-001. Using gemini-1.0-pro pricing. Got max_tokens info here: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.0-pro-002": { 
    "max_tokens": 8192,
    "max_input_tokens": 32760,
    "max_output_tokens": 8192,
    "input_cost_per_image": 0.0025,
    "input_cost_per_video_per_second": 0.002,
    "input_cost_per_token": 0.0000005, 
    "input_cost_per_character": 0.000000125, 
    "output_cost_per_token": 0.0000015,
    "output_cost_per_character": 0.000000375,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.5-pro": { 
    "max_tokens": 8192,
    "max_input_tokens": 2097152,
    "max_output_tokens": 8192,
    "input_cost_per_image": 0.001315,
    "input_cost_per_audio_per_second": 0.000125,
    "input_cost_per_video_per_second": 0.001315,
    "input_cost_per_token": 0.0000035,
    "input_cost_per_character": 0.00000125, 
    "input_cost_per_token_above_128k_tokens": 0.000007,
    "input_cost_per_character_above_128k_tokens": 0.0000025, 
    "output_cost_per_token": 0.000015,
    "output_cost_per_character": 0.00000375,
    "output_cost_per_token_above_128k_tokens": 0.00003,
    "output_cost_per_character_above_128k_tokens": 0.0000075,
    "output_cost_per_image": 0.00263,
    "output_cost_per_video_per_second": 0.00263,
    "output_cost_per_audio_per_second": 0.00025,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_tool_choice": true, 
    "supports_response_schema": true, 
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.5-pro-001": { 
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "input_cost_per_image": 0.001315,
    "input_cost_per_audio_per_second": 0.000125,
    "input_cost_per_video_per_second": 0.001315,
    "input_cost_per_token": 0.000005, 
    "input_cost_per_character": 0.00000125, 
    "input_cost_per_token_above_128k_tokens": 0.00001, 
    "input_cost_per_character_above_128k_tokens": 0.0000025, 
    "output_cost_per_token": 0.000015,
    "output_cost_per_character": 0.00000375,
    "output_cost_per_token_above_128k_tokens": 0.00003,
    "output_cost_per_character_above_128k_tokens": 0.0000075,
    "output_cost_per_image": 0.00263,
    "output_cost_per_video_per_second": 0.00263,
    "output_cost_per_audio_per_second": 0.00025,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_tool_choice": true, 
    "supports_response_schema": true, 
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.5-pro-preview-0514": { 
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "input_cost_per_image": 0.001315,
    "input_cost_per_audio_per_second": 0.000125,
    "input_cost_per_video_per_second": 0.001315,
    "input_cost_per_token": 0.000005, 
    "input_cost_per_character": 0.00000125, 
    "input_cost_per_token_above_128k_tokens": 0.00001, 
    "input_cost_per_character_above_128k_tokens": 0.0000025, 
    "output_cost_per_token": 0.000015,
    "output_cost_per_character": 0.00000375,
    "output_cost_per_token_above_128k_tokens": 0.00003,
    "output_cost_per_character_above_128k_tokens": 0.0000075,
    "output_cost_per_image": 0.00263,
    "output_cost_per_video_per_second": 0.00263,
    "output_cost_per_audio_per_second": 0.00025,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_tool_choice": true, 
    "supports_response_schema": true, 
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.5-pro-preview-0215": { 
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "input_cost_per_image": 0.001315,
    "input_cost_per_audio_per_second": 0.000125,
    "input_cost_per_video_per_second": 0.001315,
    "input_cost_per_token": 0.000005, 
    "input_cost_per_character": 0.00000125, 
    "input_cost_per_token_above_128k_tokens": 0.00001, 
    "input_cost_per_character_above_128k_tokens": 0.0000025, 
    "output_cost_per_token": 0.000015,
    "output_cost_per_character": 0.00000375,
    "output_cost_per_token_above_128k_tokens": 0.00003,
    "output_cost_per_character_above_128k_tokens": 0.0000075,
    "output_cost_per_image": 0.00263,
    "output_cost_per_video_per_second": 0.00263,
    "output_cost_per_audio_per_second": 0.00025,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_tool_choice": true, 
    "supports_response_schema": true, 
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.5-pro-preview-0409": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "input_cost_per_image": 0.001315,
    "input_cost_per_audio_per_second": 0.000125,
    "input_cost_per_video_per_second": 0.001315,
    "input_cost_per_token": 0.000005, 
    "input_cost_per_character": 0.00000125, 
    "input_cost_per_token_above_128k_tokens": 0.00001, 
    "input_cost_per_character_above_128k_tokens": 0.0000025, 
    "output_cost_per_token": 0.000015,
    "output_cost_per_character": 0.00000375,
    "output_cost_per_token_above_128k_tokens": 0.00003,
    "output_cost_per_character_above_128k_tokens": 0.0000075,
    "output_cost_per_image": 0.00263,
    "output_cost_per_video_per_second": 0.00263,
    "output_cost_per_audio_per_second": 0.00025,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_tool_choice": true,
    "supports_response_schema": true, 
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.5-flash": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "max_images_per_prompt": 3000,
    "max_videos_per_prompt": 10,
    "max_video_length": 1,
    "max_audio_length_hours": 8.4,
    "max_audio_per_prompt": 1,
    "max_pdf_size_mb": 30,
    "input_cost_per_image": 0.0001315,
    "input_cost_per_video_per_second": 0.0001315,
    "input_cost_per_audio_per_second": 0.000125,
    "input_cost_per_token": 0.000000075,
    "input_cost_per_character": 0.000000125, 
    "input_cost_per_token_above_128k_tokens": 0.00000015,
    "input_cost_per_character_above_128k_tokens": 0.00000025, 
    "output_cost_per_token": 0.0000003,
    "output_cost_per_character": 0.000000375,
    "output_cost_per_token_above_128k_tokens": 0.0000006,
    "output_cost_per_character_above_128k_tokens": 0.00000075,
    "output_cost_per_image": 0.000263,
    "output_cost_per_video_per_second": 0.000263,
    "output_cost_per_audio_per_second": 0.00025,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_response_schema": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.5-flash-exp-0827": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "max_images_per_prompt": 3000,
    "max_videos_per_prompt": 10,
    "max_video_length": 1,
    "max_audio_length_hours": 8.4,
    "max_audio_per_prompt": 1,
    "max_pdf_size_mb": 30,
    "input_cost_per_image": 0.0001315,
    "input_cost_per_video_per_second": 0.0001315,
    "input_cost_per_audio_per_second": 0.000125,
    "input_cost_per_token": 0.0000005, 
    "input_cost_per_character": 0.000000125, 
    "input_cost_per_token_above_128k_tokens": 0.000001, 
    "input_cost_per_character_above_128k_tokens": 0.00000025, 
    "output_cost_per_token": 0.0000015,
    "output_cost_per_character": 0.000000375,
    "output_cost_per_token_above_128k_tokens": 0.000003,
    "output_cost_per_character_above_128k_tokens": 0.00000075,
    "output_cost_per_image": 0.000263,
    "output_cost_per_video_per_second": 0.000263,
    "output_cost_per_audio_per_second": 0.00025,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_response_schema": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.5-flash-001": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "max_images_per_prompt": 3000,
    "max_videos_per_prompt": 10,
    "max_video_length": 1,
    "max_audio_length_hours": 8.4,
    "max_audio_per_prompt": 1,
    "max_pdf_size_mb": 30,
    "input_cost_per_image": 0.0001315,
    "input_cost_per_video_per_second": 0.0001315,
    "input_cost_per_audio_per_second": 0.000125,
    "input_cost_per_token": 0.0000005, 
    "input_cost_per_character": 0.000000125, 
    "input_cost_per_token_above_128k_tokens": 0.000001, 
    "input_cost_per_character_above_128k_tokens": 0.00000025, 
    "output_cost_per_token": 0.0000015,
    "output_cost_per_character": 0.000000375,
    "output_cost_per_token_above_128k_tokens": 0.000003,
    "output_cost_per_character_above_128k_tokens": 0.00000075,
    "output_cost_per_image": 0.000263,
    "output_cost_per_video_per_second": 0.000263,
    "output_cost_per_audio_per_second": 0.00025,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_response_schema": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.5-flash-preview-0514": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "max_images_per_prompt": 3000,
    "max_videos_per_prompt": 10,
    "max_video_length": 1,
    "max_audio_length_hours": 8.4,
    "max_audio_per_prompt": 1,
    "max_pdf_size_mb": 30,
    "input_cost_per_image": 0.0001315,
    "input_cost_per_video_per_second": 0.0001315,
    "input_cost_per_audio_per_second": 0.000125,
    "input_cost_per_token": 0.0000005, 
    "input_cost_per_character": 0.000000125, 
    "input_cost_per_token_above_128k_tokens": 0.000001, 
    "input_cost_per_character_above_128k_tokens": 0.00000025, 
    "output_cost_per_token": 0.0000015,
    "output_cost_per_character": 0.000000375,
    "output_cost_per_token_above_128k_tokens": 0.000003,
    "output_cost_per_character_above_128k_tokens": 0.00000075,
    "output_cost_per_image": 0.000263,
    "output_cost_per_video_per_second": 0.000263,
    "output_cost_per_audio_per_second": 0.00025,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-pro-experimental": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0,
    "output_cost_per_token": 0,
    "input_cost_per_character": 0,
    "output_cost_per_character": 0,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_function_calling": false,
    "supports_tool_choice": true, 
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/gemini-experimental"
  },
  "gemini-pro-flash": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0,
    "output_cost_per_token": 0,
    "input_cost_per_character": 0,
    "output_cost_per_character": 0,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "supports_function_calling": false,
    "supports_tool_choice": true, 
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/gemini-experimental"
  },
  "gemini-pro-vision": {
    "max_tokens": 2048,
    "max_input_tokens": 16384,
    "max_output_tokens": 2048,
    "max_images_per_prompt": 16,
    "max_videos_per_prompt": 1,
    "max_video_length": 2,
    "input_cost_per_token": 0.00000025, 
    "output_cost_per_token": 0.0000005,
    "litellm_provider": "vertex_ai-vision-models",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.0-pro-vision": {
    "max_tokens": 2048,
    "max_input_tokens": 16384,
    "max_output_tokens": 2048,
    "max_images_per_prompt": 16,
    "max_videos_per_prompt": 1,
    "max_video_length": 2,
    "input_cost_per_token": 0.00000025, 
    "output_cost_per_token": 0.0000005,
    "litellm_provider": "vertex_ai-vision-models",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini-1.0-pro-vision-001": {
    "max_tokens": 2048,
    "max_input_tokens": 16384,
    "max_output_tokens": 2048,
    "max_images_per_prompt": 16,
    "max_videos_per_prompt": 1,
    "max_video_length": 2,
    "input_cost_per_token": 0.00000025, 
    "output_cost_per_token": 0.0000005,
    "litellm_provider": "vertex_ai-vision-models",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "medlm-medium": {
    "max_tokens": 8192,
    "max_input_tokens": 32768,
    "max_output_tokens": 8192,
    "input_cost_per_character": 0.0000005,
    "output_cost_per_character": 0.000001,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "medlm-large": {
    "max_tokens": 1024,
    "max_input_tokens": 8192,
    "max_output_tokens": 1024,
    "input_cost_per_character": 0.000005,
    "output_cost_per_character": 0.000015,
    "litellm_provider": "vertex_ai-language-models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "vertex_ai/claude-3-sonnet@20240229": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "vertex_ai-anthropic_models",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_assistant_prefill": true
  },
  "vertex_ai/claude-3-5-sonnet@20240620": {
    "max_tokens": 8192,
    "max_input_tokens": 200000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "vertex_ai-anthropic_models",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_assistant_prefill": true
  },
  "vertex_ai/claude-3-haiku@20240307": {
    "max_tokens": 4096, 
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000025,
    "output_cost_per_token": 0.00000125,
    "litellm_provider": "vertex_ai-anthropic_models",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_assistant_prefill": true
  },
  "vertex_ai/claude-3-opus@20240229": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000015,
    "output_cost_per_token": 0.000075,
    "litellm_provider": "vertex_ai-anthropic_models",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_assistant_prefill": true
  },
  "vertex_ai/meta/llama3-405b-instruct-maas": {
    "max_tokens": 32000,
    "max_input_tokens": 32000,
    "max_output_tokens": 32000,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "vertex_ai-llama_models",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/pricing#partner-models"
  },
  "vertex_ai/mistral-large@latest": {
    "max_tokens": 8191,
    "max_input_tokens": 128000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000009,
    "litellm_provider": "vertex_ai-mistral_models",
    "mode": "chat",
    "supports_function_calling": true
  },
  "vertex_ai/mistral-large@2407": {
    "max_tokens": 8191,
    "max_input_tokens": 128000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000009,
    "litellm_provider": "vertex_ai-mistral_models",
    "mode": "chat",
    "supports_function_calling": true
  },
  "vertex_ai/mistral-nemo@latest": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000003,
    "litellm_provider": "vertex_ai-mistral_models",
    "mode": "chat",
    "supports_function_calling": true
  },
  "vertex_ai/jamba-1.5-mini@001": {
    "max_tokens": 256000,
    "max_input_tokens": 256000,
    "max_output_tokens": 256000,
    "input_cost_per_token": 0.0000002,
    "output_cost_per_token": 0.0000004,
    "litellm_provider": "vertex_ai-ai21_models",
    "mode": "chat"
  },
  "vertex_ai/jamba-1.5-large@001": {
    "max_tokens": 256000,
    "max_input_tokens": 256000,
    "max_output_tokens": 256000,
    "input_cost_per_token": 0.000002,
    "output_cost_per_token": 0.000008,
    "litellm_provider": "vertex_ai-ai21_models",
    "mode": "chat"
  },
  "vertex_ai/jamba-1.5": {
    "max_tokens": 256000,
    "max_input_tokens": 256000,
    "max_output_tokens": 256000,
    "input_cost_per_token": 0.0000002,
    "output_cost_per_token": 0.0000004,
    "litellm_provider": "vertex_ai-ai21_models",
    "mode": "chat"
  },
  "vertex_ai/jamba-1.5-mini": {
    "max_tokens": 256000,
    "max_input_tokens": 256000,
    "max_output_tokens": 256000,
    "input_cost_per_token": 0.0000002,
    "output_cost_per_token": 0.0000004,
    "litellm_provider": "vertex_ai-ai21_models",
    "mode": "chat"
  },
  "vertex_ai/jamba-1.5-large": {
    "max_tokens": 256000,
    "max_input_tokens": 256000,
    "max_output_tokens": 256000,
    "input_cost_per_token": 0.000002,
    "output_cost_per_token": 0.000008,
    "litellm_provider": "vertex_ai-ai21_models",
    "mode": "chat"
  },
  "vertex_ai/mistral-nemo@2407": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000003,
    "litellm_provider": "vertex_ai-mistral_models",
    "mode": "chat",
    "supports_function_calling": true
  },
  "vertex_ai/codestral@latest": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token": 0.000001,
    "output_cost_per_token": 0.000003,
    "litellm_provider": "vertex_ai-mistral_models",
    "mode": "chat",
    "supports_function_calling": true
  },
  "vertex_ai/codestral@2405": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000,
    "input_cost_per_token": 0.000001,
    "output_cost_per_token": 0.000003,
    "litellm_provider": "vertex_ai-mistral_models",
    "mode": "chat",
    "supports_function_calling": true
  },
  "vertex_ai/imagegeneration@006": {
    "cost_per_image": 0.020,
    "litellm_provider": "vertex_ai-image-models",
    "mode": "image_generation",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/pricing"
  },
  "vertex_ai/imagen-3.0-generate-001": {
    "cost_per_image": 0.04,
    "litellm_provider": "vertex_ai-image-models",
    "mode": "image_generation",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/pricing"
  },
  "vertex_ai/imagen-3.0-fast-generate-001": {
    "cost_per_image": 0.02,
    "litellm_provider": "vertex_ai-image-models",
    "mode": "image_generation",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/pricing"
  },
  "text-embedding-004": {
    "max_tokens": 3072,
    "max_input_tokens": 3072,
    "output_vector_size": 768,
    "input_cost_per_token": 0.00000000625,
    "output_cost_per_token": 0,
    "litellm_provider": "vertex_ai-embedding-models",
    "mode": "embedding",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models"
  },
  "text-multilingual-embedding-002": {
    "max_tokens": 2048,
    "max_input_tokens": 2048,
    "output_vector_size": 768,
    "input_cost_per_token": 0.00000000625,
    "output_cost_per_token": 0,
    "litellm_provider": "vertex_ai-embedding-models",
    "mode": "embedding",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models"
  },
  "textembedding-gecko": {
    "max_tokens": 3072,
    "max_input_tokens": 3072,
    "output_vector_size": 768,
    "input_cost_per_token": 0.00000000625,
    "output_cost_per_token": 0,
    "litellm_provider": "vertex_ai-embedding-models",
    "mode": "embedding",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "textembedding-gecko-multilingual": {
    "max_tokens": 3072,
    "max_input_tokens": 3072,
    "output_vector_size": 768,
    "input_cost_per_token": 0.00000000625,
    "output_cost_per_token": 0,
    "litellm_provider": "vertex_ai-embedding-models",
    "mode": "embedding",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "textembedding-gecko-multilingual@001": {
    "max_tokens": 3072,
    "max_input_tokens": 3072,
    "output_vector_size": 768,
    "input_cost_per_token": 0.00000000625,
    "output_cost_per_token": 0,
    "litellm_provider": "vertex_ai-embedding-models",
    "mode": "embedding",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "textembedding-gecko@001": {
    "max_tokens": 3072,
    "max_input_tokens": 3072,
    "output_vector_size": 768,
    "input_cost_per_token": 0.00000000625,
    "output_cost_per_token": 0,
    "litellm_provider": "vertex_ai-embedding-models",
    "mode": "embedding",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "textembedding-gecko@003": {
    "max_tokens": 3072,
    "max_input_tokens": 3072,
    "output_vector_size": 768,
    "input_cost_per_token": 0.00000000625,
    "output_cost_per_token": 0,
    "litellm_provider": "vertex_ai-embedding-models",
    "mode": "embedding",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "text-embedding-preview-0409": {
    "max_tokens": 3072,
    "max_input_tokens": 3072,
    "output_vector_size": 768,
    "input_cost_per_token": 0.00000000625,
    "input_cost_per_token_batch_requests": 0.000000005,
    "output_cost_per_token": 0,
    "litellm_provider": "vertex_ai-embedding-models",
    "mode": "embedding",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/pricing"
  },
  "text-multilingual-embedding-preview-0409":{
    "max_tokens": 3072,
    "max_input_tokens": 3072,
    "output_vector_size": 768,
    "input_cost_per_token": 0.00000000625,
    "output_cost_per_token": 0,
    "litellm_provider": "vertex_ai-embedding-models",
    "mode": "embedding",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "palm/chat-bison": {
    "max_tokens": 4096,
    "max_input_tokens": 8192,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "litellm_provider": "palm",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "palm/chat-bison-001": {
    "max_tokens": 4096,
    "max_input_tokens": 8192,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "litellm_provider": "palm",
    "mode": "chat",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "palm/text-bison": {
    "max_tokens": 1024,
    "max_input_tokens": 8192,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "litellm_provider": "palm",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "palm/text-bison-001": {
    "max_tokens": 1024,
    "max_input_tokens": 8192,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "litellm_provider": "palm",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "palm/text-bison-safety-off": {
    "max_tokens": 1024,
    "max_input_tokens": 8192,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "litellm_provider": "palm",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "palm/text-bison-safety-recitation-off": {
    "max_tokens": 1024,
    "max_input_tokens": 8192,
    "max_output_tokens": 1024,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000125,
    "litellm_provider": "palm",
    "mode": "completion",
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini/gemini-1.5-flash-001": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "max_images_per_prompt": 3000,
    "max_videos_per_prompt": 10,
    "max_video_length": 1,
    "max_audio_length_hours": 8.4,
    "max_audio_per_prompt": 1,
    "max_pdf_size_mb": 30, 
    "input_cost_per_token": 0.000000075,
    "input_cost_per_token_above_128k_tokens": 0.00000015,
    "output_cost_per_token": 0.0000003,
    "output_cost_per_token_above_128k_tokens": 0.0000006,
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_response_schema": true,
    "source": "https://ai.google.dev/pricing"
  },
  "gemini/gemini-1.5-flash": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "max_images_per_prompt": 3000,
    "max_videos_per_prompt": 10,
    "max_video_length": 1,
    "max_audio_length_hours": 8.4,
    "max_audio_per_prompt": 1,
    "max_pdf_size_mb": 30, 
    "input_cost_per_token": 0.000000075,
    "input_cost_per_token_above_128k_tokens": 0.00000015,
    "output_cost_per_token": 0.0000003,
    "output_cost_per_token_above_128k_tokens": 0.0000006,
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_response_schema": true, 
    "source": "https://ai.google.dev/pricing"
  },
  "gemini/gemini-1.5-flash-latest": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "max_images_per_prompt": 3000,
    "max_videos_per_prompt": 10,
    "max_video_length": 1,
    "max_audio_length_hours": 8.4,
    "max_audio_per_prompt": 1,
    "max_pdf_size_mb": 30, 
    "input_cost_per_token": 0.000000075,
    "input_cost_per_token_above_128k_tokens": 0.00000015,
    "output_cost_per_token": 0.0000003,
    "output_cost_per_token_above_128k_tokens": 0.0000006,
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_response_schema": true,
    "source": "https://ai.google.dev/pricing"
  },
  "gemini/gemini-1.5-flash-exp-0827": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "max_images_per_prompt": 3000,
    "max_videos_per_prompt": 10,
    "max_video_length": 1,
    "max_audio_length_hours": 8.4,
    "max_audio_per_prompt": 1,
    "max_pdf_size_mb": 30, 
    "input_cost_per_token": 0,
    "input_cost_per_token_above_128k_tokens": 0,
    "output_cost_per_token": 0,
    "output_cost_per_token_above_128k_tokens": 0,
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_response_schema": true,
    "source": "https://ai.google.dev/pricing"
  },
  "gemini/gemini-1.5-flash-8b-exp-0827": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "max_images_per_prompt": 3000,
    "max_videos_per_prompt": 10,
    "max_video_length": 1,
    "max_audio_length_hours": 8.4,
    "max_audio_per_prompt": 1,
    "max_pdf_size_mb": 30, 
    "input_cost_per_token": 0,
    "input_cost_per_token_above_128k_tokens": 0,
    "output_cost_per_token": 0,
    "output_cost_per_token_above_128k_tokens": 0,
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "source": "https://ai.google.dev/pricing"
  },
  "gemini/gemini-pro": {
    "max_tokens": 8192,
    "max_input_tokens": 32760,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000035, 
    "input_cost_per_token_above_128k_tokens": 0.0000007, 
    "output_cost_per_token": 0.00000105, 
    "output_cost_per_token_above_128k_tokens": 0.0000021, 
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini/gemini-1.5-pro": {
    "max_tokens": 8192,
    "max_input_tokens": 2097152,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0000035, 
    "input_cost_per_token_above_128k_tokens": 0.000007, 
    "output_cost_per_token": 0.0000105, 
    "output_cost_per_token_above_128k_tokens": 0.000021, 
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_tool_choice": true, 
    "supports_response_schema": true, 
    "source": "https://ai.google.dev/pricing"
  },
  "gemini/gemini-1.5-pro-exp-0801": {
    "max_tokens": 8192,
    "max_input_tokens": 2097152,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0000035,
    "input_cost_per_token_above_128k_tokens": 0.000007,
    "output_cost_per_token": 0.0000105,
    "output_cost_per_token_above_128k_tokens": 0.000021,
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_tool_choice": true,
    "supports_response_schema": true,
    "source": "https://ai.google.dev/pricing"
  },
  "gemini/gemini-1.5-pro-exp-0827": {
    "max_tokens": 8192,
    "max_input_tokens": 2097152,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0,
    "input_cost_per_token_above_128k_tokens": 0,
    "output_cost_per_token": 0,
    "output_cost_per_token_above_128k_tokens": 0,
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_tool_choice": true,
    "supports_response_schema": true,
    "source": "https://ai.google.dev/pricing"
  },
  "gemini/gemini-1.5-pro-latest": {
    "max_tokens": 8192,
    "max_input_tokens": 1048576,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0000035, 
    "input_cost_per_token_above_128k_tokens": 0.000007, 
    "output_cost_per_token": 0.00000105, 
    "output_cost_per_token_above_128k_tokens": 0.000021, 
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_system_messages": true,
    "supports_function_calling": true,
    "supports_vision": true,
    "supports_tool_choice": true, 
    "supports_response_schema": true, 
    "source": "https://ai.google.dev/pricing"
  },
  "gemini/gemini-pro-vision": {
    "max_tokens": 2048,
    "max_input_tokens": 30720,
    "max_output_tokens": 2048,
    "input_cost_per_token": 0.00000035, 
    "input_cost_per_token_above_128k_tokens": 0.0000007, 
    "output_cost_per_token": 0.00000105, 
    "output_cost_per_token_above_128k_tokens": 0.0000021, 
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini/gemini-gemma-2-27b-it": {
    "max_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000035, 
    "output_cost_per_token": 0.00000105, 
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "gemini/gemini-gemma-2-9b-it": {
    "max_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000035, 
    "output_cost_per_token": 0.00000105, 
    "litellm_provider": "gemini",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "source": "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models#foundation_models"
  },
  "command-r": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000015,
    "output_cost_per_token": 0.0000006,
    "litellm_provider": "cohere_chat",
    "mode": "chat",
    "supports_function_calling": true
  },
  "command-r-08-2024": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000015,
    "output_cost_per_token": 0.0000006,
    "litellm_provider": "cohere_chat",
    "mode": "chat",
    "supports_function_calling": true
  },
  "command-light": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000003,
    "output_cost_per_token": 0.0000006,
    "litellm_provider": "cohere_chat",
    "mode": "chat"
  },
  "command-r-plus": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000025,
    "output_cost_per_token": 0.00001,
    "litellm_provider": "cohere_chat",
    "mode": "chat",
    "supports_function_calling": true
  },
  "command-r-plus-08-2024": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000025,
    "output_cost_per_token": 0.00001,
    "litellm_provider": "cohere_chat",
    "mode": "chat",
    "supports_function_calling": true
  },
  "command-nightly": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000001,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "cohere",
    "mode": "completion"
  },
  "command": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000001,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "cohere",
    "mode": "completion"
  },
  "embed-english-v3.0": {
    "max_tokens": 512, 
    "max_input_tokens": 512,
    "input_cost_per_token": 0.00000010,
    "output_cost_per_token": 0.00000,
    "litellm_provider": "cohere",
    "mode": "embedding"
  },
  "embed-english-light-v3.0": {
    "max_tokens": 512, 
    "max_input_tokens": 512,
    "input_cost_per_token": 0.00000010,
    "output_cost_per_token": 0.00000,
    "litellm_provider": "cohere",
    "mode": "embedding"
  },
  "embed-multilingual-v3.0": {
    "max_tokens": 512, 
    "max_input_tokens": 512,
    "input_cost_per_token": 0.00000010,
    "output_cost_per_token": 0.00000,
    "litellm_provider": "cohere",
    "mode": "embedding"
  },
  "embed-english-v2.0": {
    "max_tokens": 512, 
    "max_input_tokens": 512,
    "input_cost_per_token": 0.00000010,
    "output_cost_per_token": 0.00000,
    "litellm_provider": "cohere",
    "mode": "embedding"
  },
  "embed-english-light-v2.0": {
    "max_tokens": 512, 
    "max_input_tokens": 512,
    "input_cost_per_token": 0.00000010,
    "output_cost_per_token": 0.00000,
    "litellm_provider": "cohere",
    "mode": "embedding"
  },
  "embed-multilingual-v2.0": {
    "max_tokens": 256, 
    "max_input_tokens": 256,
    "input_cost_per_token": 0.00000010,
    "output_cost_per_token": 0.00000,
    "litellm_provider": "cohere",
    "mode": "embedding"
  },
  "replicate/meta/llama-2-13b": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.0000005,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "replicate/meta/llama-2-13b-chat": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.0000005,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "replicate/meta/llama-2-70b": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000065,
    "output_cost_per_token": 0.00000275,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "replicate/meta/llama-2-70b-chat": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000065,
    "output_cost_per_token": 0.00000275,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "replicate/meta/llama-2-7b": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000005,
    "output_cost_per_token": 0.00000025,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "replicate/meta/llama-2-7b-chat": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000005,
    "output_cost_per_token": 0.00000025,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "replicate/meta/llama-3-70b": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000065,
    "output_cost_per_token": 0.00000275,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "replicate/meta/llama-3-70b-instruct": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000065,
    "output_cost_per_token": 0.00000275,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "replicate/meta/llama-3-8b": {
    "max_tokens": 8086,
    "max_input_tokens": 8086,
    "max_output_tokens": 8086,
    "input_cost_per_token": 0.00000005,
    "output_cost_per_token": 0.00000025,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "replicate/meta/llama-3-8b-instruct": {
    "max_tokens": 8086,
    "max_input_tokens": 8086,
    "max_output_tokens": 8086,
    "input_cost_per_token": 0.00000005,
    "output_cost_per_token": 0.00000025,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "replicate/mistralai/mistral-7b-v0.1": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000005,
    "output_cost_per_token": 0.00000025,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "replicate/mistralai/mistral-7b-instruct-v0.2": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000005,
    "output_cost_per_token": 0.00000025,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "replicate/mistralai/mixtral-8x7b-instruct-v0.1": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000003,
    "output_cost_per_token": 0.000001,
    "litellm_provider": "replicate",
    "mode": "chat"
  },
  "openrouter/deepseek/deepseek-coder": {
    "max_tokens": 4096,
    "max_input_tokens": 32000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000014,
    "output_cost_per_token": 0.00000028,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/microsoft/wizardlm-2-8x22b:nitro": {
    "max_tokens": 65536,
    "input_cost_per_token": 0.000001,
    "output_cost_per_token": 0.000001,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/google/gemini-pro-1.5": {
    "max_tokens": 8192,
    "max_input_tokens": 1000000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0000025,
    "output_cost_per_token": 0.0000075,
    "input_cost_per_image": 0.00265, 
    "litellm_provider": "openrouter",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "openrouter/mistralai/mixtral-8x22b-instruct": {
    "max_tokens": 65536,
    "input_cost_per_token": 0.00000065,
    "output_cost_per_token": 0.00000065,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/cohere/command-r-plus": {
    "max_tokens": 128000,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/databricks/dbrx-instruct": {
    "max_tokens": 32768,
    "input_cost_per_token": 0.0000006,
    "output_cost_per_token": 0.0000006,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/anthropic/claude-3-haiku": {
    "max_tokens": 200000,
    "input_cost_per_token": 0.00000025,
    "output_cost_per_token": 0.00000125,
    "input_cost_per_image": 0.0004, 
    "litellm_provider": "openrouter",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "openrouter/anthropic/claude-3-haiku-20240307": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000025,
    "output_cost_per_token": 0.00000125,
    "litellm_provider": "openrouter",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "tool_use_system_prompt_tokens": 264
  },
  "openrouter/anthropic/claude-3.5-sonnet": {
    "max_tokens": 8192,
    "max_input_tokens": 200000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "openrouter",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "tool_use_system_prompt_tokens": 159,
    "supports_assistant_prefill": true
  },
  "openrouter/anthropic/claude-3.5-sonnet:beta": {
    "max_tokens": 8192,
    "max_input_tokens": 200000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "openrouter",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "tool_use_system_prompt_tokens": 159
  },
  "openrouter/anthropic/claude-3-sonnet": {
    "max_tokens": 200000,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "input_cost_per_image": 0.0048,  
    "litellm_provider": "openrouter",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "openrouter/mistralai/mistral-large": {
    "max_tokens": 32000,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/cognitivecomputations/dolphin-mixtral-8x7b": {
    "max_tokens": 32769,
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000005,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/google/gemini-pro-vision": {
    "max_tokens": 45875,
    "input_cost_per_token": 0.000000125,
    "output_cost_per_token": 0.000000375,
    "input_cost_per_image": 0.0025,  
    "litellm_provider": "openrouter",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "openrouter/fireworks/firellava-13b": {
    "max_tokens": 4096,
    "input_cost_per_token": 0.0000002,
    "output_cost_per_token": 0.0000002,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/meta-llama/llama-3-8b-instruct:free": {
    "max_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/meta-llama/llama-3-8b-instruct:extended": {
    "max_tokens": 16384,
    "input_cost_per_token": 0.000000225,
    "output_cost_per_token": 0.00000225,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/meta-llama/llama-3-70b-instruct:nitro": {
    "max_tokens": 8192,
    "input_cost_per_token": 0.0000009,
    "output_cost_per_token": 0.0000009,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/meta-llama/llama-3-70b-instruct": {
    "max_tokens": 8192,
    "input_cost_per_token": 0.00000059,
    "output_cost_per_token": 0.00000079,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/openai/o1-mini": {
    "max_tokens": 65536,
    "max_input_tokens": 128000,
    "max_output_tokens": 65536,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000012,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "openrouter/openai/o1-mini-2024-09-12": {
    "max_tokens": 65536,
    "max_input_tokens": 128000,
    "max_output_tokens": 65536,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000012,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "openrouter/openai/o1-preview": {
    "max_tokens": 32768,
    "max_input_tokens": 128000,
    "max_output_tokens": 32768,
    "input_cost_per_token": 0.000015,
    "output_cost_per_token": 0.000060,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "openrouter/openai/o1-preview-2024-09-12": {
    "max_tokens": 32768,
    "max_input_tokens": 128000,
    "max_output_tokens": 32768,
    "input_cost_per_token": 0.000015,
    "output_cost_per_token": 0.000060,
    "litellm_provider": "openai",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "openrouter/openai/gpt-4o": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000005,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "openrouter",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "openrouter/openai/gpt-4o-2024-05-13": {
    "max_tokens": 4096,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000005,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "openrouter",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true,
    "supports_vision": true
  },
  "openrouter/openai/gpt-4-vision-preview": {
    "max_tokens": 130000,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00003,
    "input_cost_per_image": 0.01445, 
    "litellm_provider": "openrouter",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "openrouter/openai/gpt-3.5-turbo": {
    "max_tokens": 4095,
    "input_cost_per_token": 0.0000015,
    "output_cost_per_token": 0.000002,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/openai/gpt-3.5-turbo-16k": {
    "max_tokens": 16383,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000004,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/openai/gpt-4": {
    "max_tokens": 8192,
    "input_cost_per_token": 0.00003,
    "output_cost_per_token": 0.00006,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/anthropic/claude-instant-v1": {
    "max_tokens": 100000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000163,
    "output_cost_per_token": 0.00000551,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/anthropic/claude-2": {
    "max_tokens": 100000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00001102,
    "output_cost_per_token": 0.00003268,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/anthropic/claude-3-opus": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000015,
    "output_cost_per_token": 0.000075,
    "litellm_provider": "openrouter",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true,
    "tool_use_system_prompt_tokens": 395
  },
  "openrouter/google/palm-2-chat-bison": {
    "max_tokens": 25804,
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000005,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/google/palm-2-codechat-bison": {
    "max_tokens": 20070,
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000005,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/meta-llama/llama-2-13b-chat": {
    "max_tokens": 4096,
    "input_cost_per_token": 0.0000002,
    "output_cost_per_token": 0.0000002,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/meta-llama/llama-2-70b-chat": {
    "max_tokens": 4096,
    "input_cost_per_token": 0.0000015,
    "output_cost_per_token": 0.0000015,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/meta-llama/codellama-34b-instruct": {
    "max_tokens": 8192,
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000005,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/nousresearch/nous-hermes-llama2-13b": {
    "max_tokens": 4096,
    "input_cost_per_token": 0.0000002,
    "output_cost_per_token": 0.0000002,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/mancer/weaver": {
    "max_tokens": 8000,
    "input_cost_per_token": 0.000005625,
    "output_cost_per_token": 0.000005625,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/gryphe/mythomax-l2-13b": {
    "max_tokens": 8192,
    "input_cost_per_token": 0.000001875,
    "output_cost_per_token": 0.000001875,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/jondurbin/airoboros-l2-70b-2.1": {
    "max_tokens": 4096,
    "input_cost_per_token": 0.000013875,
    "output_cost_per_token": 0.000013875,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/undi95/remm-slerp-l2-13b": {
    "max_tokens": 6144,
    "input_cost_per_token": 0.000001875,
    "output_cost_per_token": 0.000001875,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/pygmalionai/mythalion-13b": {
    "max_tokens": 4096,
    "input_cost_per_token": 0.000001875,
    "output_cost_per_token": 0.000001875,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/mistralai/mistral-7b-instruct": {
    "max_tokens": 8192,
    "input_cost_per_token": 0.00000013,
    "output_cost_per_token": 0.00000013,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "openrouter/mistralai/mistral-7b-instruct:free": {
    "max_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "openrouter",
    "mode": "chat"
  },
  "j2-ultra": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000015,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "ai21",
    "mode": "completion"
  },
  "jamba-1.5-mini@001": {
    "max_tokens": 256000,
    "max_input_tokens": 256000,
    "max_output_tokens": 256000,
    "input_cost_per_token": 0.0000002,
    "output_cost_per_token": 0.0000004,
    "litellm_provider": "ai21",
    "mode": "chat"
  },
  "jamba-1.5-large@001": {
    "max_tokens": 256000,
    "max_input_tokens": 256000,
    "max_output_tokens": 256000,
    "input_cost_per_token": 0.000002,
    "output_cost_per_token": 0.000008,
    "litellm_provider": "ai21",
    "mode": "chat"
  },
  "jamba-1.5": {
    "max_tokens": 256000,
    "max_input_tokens": 256000,
    "max_output_tokens": 256000,
    "input_cost_per_token": 0.0000002,
    "output_cost_per_token": 0.0000004,
    "litellm_provider": "ai21",
    "mode": "chat"
  },
  "jamba-1.5-mini": {
    "max_tokens": 256000,
    "max_input_tokens": 256000,
    "max_output_tokens": 256000,
    "input_cost_per_token": 0.0000002,
    "output_cost_per_token": 0.0000004,
    "litellm_provider": "ai21",
    "mode": "chat"
  },
  "jamba-1.5-large": {
    "max_tokens": 256000,
    "max_input_tokens": 256000,
    "max_output_tokens": 256000,
    "input_cost_per_token": 0.000002,
    "output_cost_per_token": 0.000008,
    "litellm_provider": "ai21",
    "mode": "chat"
  },
  "j2-mid": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00001,
    "output_cost_per_token": 0.00001,
    "litellm_provider": "ai21",
    "mode": "completion"
  },
  "j2-light": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000003,
    "litellm_provider": "ai21",
    "mode": "completion"
  },
  "dolphin": {
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000005,
    "litellm_provider": "nlp_cloud",
    "mode": "completion"
  },
  "chatdolphin": {
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000005,
    "litellm_provider": "nlp_cloud",
    "mode": "chat"
  },
  "luminous-base": {
    "max_tokens": 2048, 
    "input_cost_per_token": 0.00003,
    "output_cost_per_token": 0.000033,
    "litellm_provider": "aleph_alpha",
    "mode": "completion"
  },
  "luminous-base-control": {
    "max_tokens": 2048, 
    "input_cost_per_token": 0.0000375,
    "output_cost_per_token": 0.00004125,
    "litellm_provider": "aleph_alpha",
    "mode": "chat"
  },
  "luminous-extended": {
    "max_tokens": 2048, 
    "input_cost_per_token": 0.000045,
    "output_cost_per_token": 0.0000495,
    "litellm_provider": "aleph_alpha",
    "mode": "completion"
  },
  "luminous-extended-control": {
    "max_tokens": 2048, 
    "input_cost_per_token": 0.00005625,
    "output_cost_per_token": 0.000061875,
    "litellm_provider": "aleph_alpha",
    "mode": "chat"
  },
  "luminous-supreme": {
    "max_tokens": 2048, 
    "input_cost_per_token": 0.000175,
    "output_cost_per_token": 0.0001925,
    "litellm_provider": "aleph_alpha",
    "mode": "completion"
  },
  "luminous-supreme-control": {
    "max_tokens": 2048, 
    "input_cost_per_token": 0.00021875,
    "output_cost_per_token": 0.000240625,
    "litellm_provider": "aleph_alpha",
    "mode": "chat"
  },
  "ai21.j2-mid-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 8191, 
    "max_output_tokens": 8191, 
    "input_cost_per_token": 0.0000125,
    "output_cost_per_token": 0.0000125,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "ai21.j2-ultra-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 8191, 
    "max_output_tokens": 8191, 
    "input_cost_per_token": 0.0000188,
    "output_cost_per_token": 0.0000188,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "ai21.jamba-instruct-v1:0": {
    "max_tokens": 4096,
    "max_input_tokens": 70000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000007,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_system_messages": true
  },
  "amazon.titan-text-lite-v1": {
    "max_tokens": 4000, 
    "max_input_tokens": 42000,
    "max_output_tokens": 4000, 
    "input_cost_per_token": 0.0000003,
    "output_cost_per_token": 0.0000004,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "amazon.titan-text-express-v1": {
    "max_tokens": 8000, 
    "max_input_tokens": 42000,
    "max_output_tokens": 8000, 
    "input_cost_per_token": 0.0000013,
    "output_cost_per_token": 0.0000017,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "amazon.titan-text-premier-v1:0": {
    "max_tokens": 32000, 
    "max_input_tokens": 42000,
    "max_output_tokens": 32000, 
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000015,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "amazon.titan-embed-text-v1": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "output_vector_size": 1536,
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.0,
    "litellm_provider": "bedrock", 
    "mode": "embedding"
  },
  "amazon.titan-embed-text-v2:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "output_vector_size": 1024,
    "input_cost_per_token": 0.0000002,
    "output_cost_per_token": 0.0,
    "litellm_provider": "bedrock", 
    "mode": "embedding"
  },
  "mistral.mistral-7b-instruct-v0:2": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000015,
    "output_cost_per_token": 0.0000002,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "mistral.mixtral-8x7b-instruct-v0:1": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000045,
    "output_cost_per_token": 0.0000007,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "mistral.mistral-large-2402-v1:0": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true
  },
  "mistral.mistral-large-2407-v1:0": {
    "max_tokens": 8191,
    "max_input_tokens": 128000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000009,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true
  },
  "mistral.mistral-small-2402-v1:0": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000001,
    "output_cost_per_token": 0.000003,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true
  },
  "bedrock/us-west-2/mistral.mixtral-8x7b-instruct-v0:1": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000045,
    "output_cost_per_token": 0.0000007,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/mistral.mixtral-8x7b-instruct-v0:1": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000045,
    "output_cost_per_token": 0.0000007,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-west-3/mistral.mixtral-8x7b-instruct-v0:1": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000059,
    "output_cost_per_token": 0.00000091,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/mistral.mistral-7b-instruct-v0:2": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000015,
    "output_cost_per_token": 0.0000002,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/mistral.mistral-7b-instruct-v0:2": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000015,
    "output_cost_per_token": 0.0000002,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-west-3/mistral.mistral-7b-instruct-v0:2": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.0000002,
    "output_cost_per_token": 0.00000026,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/mistral.mistral-large-2402-v1:0": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/mistral.mistral-large-2402-v1:0": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true
  },
  "bedrock/eu-west-3/mistral.mistral-large-2402-v1:0": {
    "max_tokens": 8191,
    "max_input_tokens": 32000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.0000104,
    "output_cost_per_token": 0.0000312,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true
  },
  "anthropic.claude-3-sonnet-20240229-v1:0": {
    "max_tokens": 4096, 
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "anthropic.claude-3-5-sonnet-20240620-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 200000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "anthropic.claude-3-haiku-20240307-v1:0": {
    "max_tokens": 4096, 
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000025,
    "output_cost_per_token": 0.00000125,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "anthropic.claude-3-opus-20240229-v1:0": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000015,
    "output_cost_per_token": 0.000075,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "us.anthropic.claude-3-sonnet-20240229-v1:0": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "us.anthropic.claude-3-5-sonnet-20240620-v1:0": {
    "max_tokens": 8192,
    "max_input_tokens": 200000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "us.anthropic.claude-3-haiku-20240307-v1:0": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000025,
    "output_cost_per_token": 0.00000125,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "us.anthropic.claude-3-opus-20240229-v1:0": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000015,
    "output_cost_per_token": 0.000075,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "eu.anthropic.claude-3-sonnet-20240229-v1:0": {
    "max_tokens": 8192,
    "max_input_tokens": 200000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "eu.anthropic.claude-3-5-sonnet-20240620-v1:0": {
    "max_tokens": 8192,
    "max_input_tokens": 200000,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.000003,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "eu.anthropic.claude-3-haiku-20240307-v1:0": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000025,
    "output_cost_per_token": 0.00000125,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "eu.anthropic.claude-3-opus-20240229-v1:0": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000015,
    "output_cost_per_token": 0.000075,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true,
    "supports_vision": true
  },
  "anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-northeast-1/anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-northeast-1/1-month-commitment/anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.0455,
    "output_cost_per_second": 0.0455,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-northeast-1/6-month-commitment/anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.02527,
    "output_cost_per_second": 0.02527,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-central-1/anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-central-1/1-month-commitment/anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.0415,
    "output_cost_per_second": 0.0415,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-central-1/6-month-commitment/anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.02305,
    "output_cost_per_second": 0.02305,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/1-month-commitment/anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.0175,
    "output_cost_per_second": 0.0175,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/6-month-commitment/anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.00972,
    "output_cost_per_second": 0.00972,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/1-month-commitment/anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.0175,
    "output_cost_per_second": 0.0175,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/6-month-commitment/anthropic.claude-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.00972,
    "output_cost_per_second": 0.00972,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-northeast-1/anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-northeast-1/1-month-commitment/anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.0455,
    "output_cost_per_second": 0.0455,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-northeast-1/6-month-commitment/anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.02527,
    "output_cost_per_second": 0.02527,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-central-1/anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-central-1/1-month-commitment/anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.0415,
    "output_cost_per_second": 0.0415,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-central-1/6-month-commitment/anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.02305,
    "output_cost_per_second": 0.02305,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/1-month-commitment/anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.0175,
    "output_cost_per_second": 0.0175,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/6-month-commitment/anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.00972,
    "output_cost_per_second": 0.00972,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/1-month-commitment/anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.0175,
    "output_cost_per_second": 0.0175,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/6-month-commitment/anthropic.claude-v2": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000,
    "max_output_tokens": 8191, 
    "input_cost_per_second": 0.00972,
    "output_cost_per_second": 0.00972,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-northeast-1/anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-northeast-1/1-month-commitment/anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.0455,
    "output_cost_per_second": 0.0455,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-northeast-1/6-month-commitment/anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.02527,
    "output_cost_per_second": 0.02527,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-central-1/anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.000008,
    "output_cost_per_token": 0.000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-central-1/1-month-commitment/anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.0415,
    "output_cost_per_second": 0.0415,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-central-1/6-month-commitment/anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.02305,
    "output_cost_per_second": 0.02305,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/1-month-commitment/anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.0175,
    "output_cost_per_second": 0.0175,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/6-month-commitment/anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.00972,
    "output_cost_per_second": 0.00972,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/1-month-commitment/anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.0175,
    "output_cost_per_second": 0.0175,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/6-month-commitment/anthropic.claude-v2:1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.00972,
    "output_cost_per_second": 0.00972,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000163,
    "output_cost_per_token": 0.00000551,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.0000008,
    "output_cost_per_token": 0.0000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/1-month-commitment/anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.011,
    "output_cost_per_second": 0.011,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/6-month-commitment/anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.00611,
    "output_cost_per_second": 0.00611,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/1-month-commitment/anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.011,
    "output_cost_per_second": 0.011,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/6-month-commitment/anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.00611,
    "output_cost_per_second": 0.00611,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-2/anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.0000008,
    "output_cost_per_token": 0.0000024,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-northeast-1/anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000223,
    "output_cost_per_token": 0.00000755,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-northeast-1/1-month-commitment/anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.01475,
    "output_cost_per_second": 0.01475,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-northeast-1/6-month-commitment/anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.008194,
    "output_cost_per_second": 0.008194,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-central-1/anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000248,
    "output_cost_per_token": 0.00000838,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-central-1/1-month-commitment/anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.01635,
    "output_cost_per_second": 0.01635,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-central-1/6-month-commitment/anthropic.claude-instant-v1": {
    "max_tokens": 8191, 
    "max_input_tokens": 100000, 
    "max_output_tokens": 8191,
    "input_cost_per_second": 0.009083,
    "output_cost_per_second": 0.009083,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "cohere.command-text-v14": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096,
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.0000015,
    "output_cost_per_token": 0.0000020,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/*/1-month-commitment/cohere.command-text-v14": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096,
    "max_output_tokens": 4096, 
    "input_cost_per_second": 0.011,
    "output_cost_per_second": 0.011,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/*/6-month-commitment/cohere.command-text-v14": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096,
    "max_output_tokens": 4096, 
    "input_cost_per_second": 0.0066027,
    "output_cost_per_second": 0.0066027,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "cohere.command-light-text-v14": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096,
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.0000003,
    "output_cost_per_token": 0.0000006,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/*/1-month-commitment/cohere.command-light-text-v14": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096,
    "max_output_tokens": 4096, 
    "input_cost_per_second": 0.001902,
    "output_cost_per_second": 0.001902,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/*/6-month-commitment/cohere.command-light-text-v14": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096,
    "max_output_tokens": 4096, 
    "input_cost_per_second": 0.0011416,
    "output_cost_per_second": 0.0011416,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "cohere.command-r-plus-v1:0": {
    "max_tokens": 4096, 
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000030,
    "output_cost_per_token": 0.000015,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "cohere.command-r-v1:0": {
    "max_tokens": 4096, 
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.0000015,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "cohere.embed-english-v3": {
    "max_tokens": 512, 
    "max_input_tokens": 512, 
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "bedrock",
    "mode": "embedding"
  },
  "cohere.embed-multilingual-v3": {
    "max_tokens": 512, 
    "max_input_tokens": 512, 
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "bedrock",
    "mode": "embedding"
  },
  "meta.llama2-13b-chat-v1": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.00000075,
    "output_cost_per_token": 0.000001,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "meta.llama2-70b-chat-v1": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.00000195,
    "output_cost_per_token": 0.00000256,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "meta.llama3-8b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.0000003,
    "output_cost_per_token": 0.0000006,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/meta.llama3-8b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.0000003,
    "output_cost_per_token": 0.0000006,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-1/meta.llama3-8b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.0000003,
    "output_cost_per_token": 0.0000006,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-south-1/meta.llama3-8b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000036,
    "output_cost_per_token": 0.00000072,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ca-central-1/meta.llama3-8b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000035,
    "output_cost_per_token": 0.00000069,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-west-1/meta.llama3-8b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000032,
    "output_cost_per_token": 0.00000065,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-west-2/meta.llama3-8b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000039,
    "output_cost_per_token": 0.00000078,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/sa-east-1/meta.llama3-8b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.0000005,
    "output_cost_per_token": 0.00000101,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "meta.llama3-70b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000265,
    "output_cost_per_token": 0.0000035,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-east-1/meta.llama3-70b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000265,
    "output_cost_per_token": 0.0000035,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/us-west-1/meta.llama3-70b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000265,
    "output_cost_per_token": 0.0000035,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ap-south-1/meta.llama3-70b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000318,
    "output_cost_per_token": 0.0000042,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/ca-central-1/meta.llama3-70b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000305,
    "output_cost_per_token": 0.00000403,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-west-1/meta.llama3-70b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000286,
    "output_cost_per_token": 0.00000378,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/eu-west-2/meta.llama3-70b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000345,
    "output_cost_per_token": 0.00000455,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "bedrock/sa-east-1/meta.llama3-70b-instruct-v1:0": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000445,
    "output_cost_per_token": 0.00000588,
    "litellm_provider": "bedrock",
    "mode": "chat"
  },
  "meta.llama3-1-8b-instruct-v1:0": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 2048,
    "input_cost_per_token": 0.00000022,
    "output_cost_per_token": 0.00000022,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true, 
    "supports_tool_choice": false
  },
  "meta.llama3-1-70b-instruct-v1:0": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 2048,
    "input_cost_per_token": 0.00000099,
    "output_cost_per_token": 0.00000099,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true, 
    "supports_tool_choice": false
  },
  "meta.llama3-1-405b-instruct-v1:0": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000532,
    "output_cost_per_token": 0.000016,
    "litellm_provider": "bedrock",
    "mode": "chat",
    "supports_function_calling": true, 
    "supports_tool_choice": false
  },
  "512-x-512/50-steps/stability.stable-diffusion-xl-v0": {
    "max_tokens": 77, 
    "max_input_tokens": 77, 
    "output_cost_per_image": 0.018,
    "litellm_provider": "bedrock",
    "mode": "image_generation"
  },
  "512-x-512/max-steps/stability.stable-diffusion-xl-v0": {
    "max_tokens": 77, 
    "max_input_tokens": 77, 
    "output_cost_per_image": 0.036,
    "litellm_provider": "bedrock",
    "mode": "image_generation"
  },
  "max-x-max/50-steps/stability.stable-diffusion-xl-v0": {
    "max_tokens": 77, 
    "max_input_tokens": 77, 
    "output_cost_per_image": 0.036,
    "litellm_provider": "bedrock",
    "mode": "image_generation"
  },
  "max-x-max/max-steps/stability.stable-diffusion-xl-v0": {
    "max_tokens": 77, 
    "max_input_tokens": 77, 
    "output_cost_per_image": 0.072,
    "litellm_provider": "bedrock",
    "mode": "image_generation"
  },
  "1024-x-1024/50-steps/stability.stable-diffusion-xl-v1": {
    "max_tokens": 77, 
    "max_input_tokens": 77, 
    "output_cost_per_image": 0.04,
    "litellm_provider": "bedrock",
    "mode": "image_generation"
  },
  "1024-x-1024/max-steps/stability.stable-diffusion-xl-v1": {
    "max_tokens": 77, 
    "max_input_tokens": 77, 
    "output_cost_per_image": 0.08,
    "litellm_provider": "bedrock",
    "mode": "image_generation"
  },
  "sagemaker/meta-textgeneration-llama-2-7b": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.000,
    "output_cost_per_token": 0.000,
    "litellm_provider": "sagemaker",
    "mode": "completion"
  },
  "sagemaker/meta-textgeneration-llama-2-7b-f": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.000,
    "output_cost_per_token": 0.000,
    "litellm_provider": "sagemaker",
    "mode": "chat"
  },
  "sagemaker/meta-textgeneration-llama-2-13b": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.000,
    "output_cost_per_token": 0.000,
    "litellm_provider": "sagemaker",
    "mode": "completion"
  },
  "sagemaker/meta-textgeneration-llama-2-13b-f": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.000,
    "output_cost_per_token": 0.000,
    "litellm_provider": "sagemaker",
    "mode": "chat"
  },
  "sagemaker/meta-textgeneration-llama-2-70b": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.000,
    "output_cost_per_token": 0.000,
    "litellm_provider": "sagemaker",
    "mode": "completion"
  },
  "sagemaker/meta-textgeneration-llama-2-70b-b-f": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.000,
    "output_cost_per_token": 0.000,
    "litellm_provider": "sagemaker",
    "mode": "chat"
  },
  "together-ai-up-to-4b": {
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.0000001,
    "litellm_provider": "together_ai"
  },
  "together-ai-4.1b-8b": {
    "input_cost_per_token": 0.0000002,
    "output_cost_per_token": 0.0000002,
    "litellm_provider": "together_ai"
  },
  "together-ai-8.1b-21b": {
    "max_tokens": 1000,
    "input_cost_per_token": 0.0000003,
    "output_cost_per_token": 0.0000003,
    "litellm_provider": "together_ai"
  },
  "together-ai-21.1b-41b": {
    "input_cost_per_token": 0.0000008,
    "output_cost_per_token": 0.0000008,
    "litellm_provider": "together_ai"
  },
  "together-ai-41.1b-80b": {
    "input_cost_per_token": 0.0000009,
    "output_cost_per_token": 0.0000009,
    "litellm_provider": "together_ai"
  },
  "together-ai-81.1b-110b": {
    "input_cost_per_token": 0.0000018,
    "output_cost_per_token": 0.0000018,
    "litellm_provider": "together_ai"
  },
  "together_ai/mistralai/Mixtral-8x7B-Instruct-v0.1": {
    "input_cost_per_token": 0.0000006,
    "output_cost_per_token": 0.0000006,
    "litellm_provider": "together_ai",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "together_ai/mistralai/Mistral-7B-Instruct-v0.1": {
    "litellm_provider": "together_ai",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "together_ai/togethercomputer/CodeLlama-34b-Instruct": {
    "litellm_provider": "together_ai",
    "supports_function_calling": true,
    "supports_parallel_function_calling": true
  },
  "ollama/codegemma": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "completion"
  },
  "ollama/codegeex4": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat", 
    "supports_function_calling": false
  },
  "ollama/deepseek-coder-v2-instruct": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat", 
    "supports_function_calling": true
  },
  "ollama/deepseek-coder-v2-base": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "completion", 
    "supports_function_calling": true
  },
  "ollama/deepseek-coder-v2-lite-instruct": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat", 
    "supports_function_calling": true
  },
  "ollama/deepseek-coder-v2-lite-base": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "completion", 
    "supports_function_calling": true
  },
  "ollama/internlm2_5-20b-chat": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat", 
    "supports_function_calling": true
  },
  "ollama/llama2": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "completion"
  },
  "ollama/llama2:7b": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "completion"
  },
  "ollama/llama2:13b": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "completion"
  },
  "ollama/llama2:70b": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "completion"
  },
  "ollama/llama2-uncensored": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "completion"
  },
  "ollama/llama3": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat"
  },
  "ollama/llama3:8b": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat"
  },
  "ollama/llama3:70b": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat"
  },
  "ollama/llama3.1": {
    "max_tokens": 32768,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat", 
    "supports_function_calling": true
  },
  "ollama/mistral-large-instruct-2407": {
    "max_tokens": 65536,
    "max_input_tokens": 65536,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat"
  },
  "ollama/mistral": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "completion"
  },
  "ollama/mistral-7B-Instruct-v0.1": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat"
  },
  "ollama/mistral-7B-Instruct-v0.2": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 32768,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat"
  },
  "ollama/mixtral-8x7B-Instruct-v0.1": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 32768,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat"
  },
  "ollama/mixtral-8x22B-Instruct-v0.1": {
    "max_tokens": 65536,
    "max_input_tokens": 65536,
    "max_output_tokens": 65536,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "chat"
  },
  "ollama/codellama": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "completion"
  },
  "ollama/orca-mini": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "completion"
  },
  "ollama/vicuna": {
    "max_tokens": 2048,
    "max_input_tokens": 2048,
    "max_output_tokens": 2048,
    "input_cost_per_token": 0.0,
    "output_cost_per_token": 0.0,
    "litellm_provider": "ollama",
    "mode": "completion"
  },
  "deepinfra/lizpreciatior/lzlv_70b_fp16_hf": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000070,
    "output_cost_per_token": 0.00000090,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/Gryphe/MythoMax-L2-13b": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000022,
    "output_cost_per_token": 0.00000022,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/mistralai/Mistral-7B-Instruct-v0.1": {
    "max_tokens": 8191,
    "max_input_tokens": 32768,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000013,
    "output_cost_per_token": 0.00000013,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/meta-llama/Llama-2-70b-chat-hf": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000070,
    "output_cost_per_token": 0.00000090,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/cognitivecomputations/dolphin-2.6-mixtral-8x7b": {
    "max_tokens": 8191,
    "max_input_tokens": 32768,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000027,
    "output_cost_per_token": 0.00000027,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/codellama/CodeLlama-34b-Instruct-hf": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000060,
    "output_cost_per_token": 0.00000060,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/deepinfra/mixtral": {
    "max_tokens": 4096,
    "max_input_tokens": 32000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000027,
    "output_cost_per_token": 0.00000027,
    "litellm_provider": "deepinfra",
    "mode": "completion"
  },
  "deepinfra/Phind/Phind-CodeLlama-34B-v2": {
    "max_tokens": 4096,
    "max_input_tokens": 16384,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000060,
    "output_cost_per_token": 0.00000060,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/mistralai/Mixtral-8x7B-Instruct-v0.1": {
    "max_tokens": 8191,
    "max_input_tokens": 32768,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000027,
    "output_cost_per_token": 0.00000027,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/deepinfra/airoboros-70b": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000070,
    "output_cost_per_token": 0.00000090,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/01-ai/Yi-34B-Chat": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000060,
    "output_cost_per_token": 0.00000060,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/01-ai/Yi-6B-200K": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000013,
    "output_cost_per_token": 0.00000013,
    "litellm_provider": "deepinfra",
    "mode": "completion"
  },
  "deepinfra/jondurbin/airoboros-l2-70b-gpt4-1.4.1": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000070,
    "output_cost_per_token": 0.00000090,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/meta-llama/Llama-2-13b-chat-hf": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000022,
    "output_cost_per_token": 0.00000022,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/amazon/MistralLite": {
    "max_tokens": 8191,
    "max_input_tokens": 32768,
    "max_output_tokens": 8191,
    "input_cost_per_token": 0.00000020,
    "output_cost_per_token": 0.00000020,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/meta-llama/Llama-2-7b-chat-hf": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000013,
    "output_cost_per_token": 0.00000013,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/meta-llama/Meta-Llama-3-8B-Instruct": {
    "max_tokens": 8191,
    "max_input_tokens": 8191,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000008,
    "output_cost_per_token": 0.00000008,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/meta-llama/Meta-Llama-3-70B-Instruct": {
    "max_tokens": 8191,
    "max_input_tokens": 8191,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000059,
    "output_cost_per_token": 0.00000079,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "deepinfra/01-ai/Yi-34B-200K": {
    "max_tokens": 4096,
    "max_input_tokens": 200000,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000060,
    "output_cost_per_token": 0.00000060,
    "litellm_provider": "deepinfra",
    "mode": "completion"
  },
  "deepinfra/openchat/openchat_3.5": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000013,
    "output_cost_per_token": 0.00000013,
    "litellm_provider": "deepinfra",
    "mode": "chat"
  },
  "perplexity/codellama-34b-instruct": { 
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.00000035, 
    "output_cost_per_token": 0.00000140,  
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/codellama-70b-instruct": { 
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.00000070, 
    "output_cost_per_token": 0.00000280,  
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/llama-3.1-70b-instruct": { 
    "max_tokens": 131072,
    "max_input_tokens": 131072,
    "max_output_tokens": 131072,
    "input_cost_per_token": 0.000001, 
    "output_cost_per_token": 0.000001,
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/llama-3.1-8b-instruct": { 
    "max_tokens": 131072,
    "max_input_tokens": 131072,
    "max_output_tokens": 131072,
    "input_cost_per_token": 0.0000002, 
    "output_cost_per_token": 0.0000002,  
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/llama-3.1-sonar-huge-128k-online": { 
    "max_tokens": 127072,
    "max_input_tokens": 127072,
    "max_output_tokens": 127072,
    "input_cost_per_token": 0.000005, 
    "output_cost_per_token": 0.000005,
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/llama-3.1-sonar-large-128k-online": { 
    "max_tokens": 127072,
    "max_input_tokens": 127072,
    "max_output_tokens": 127072,
    "input_cost_per_token": 0.000001, 
    "output_cost_per_token": 0.000001,
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/llama-3.1-sonar-large-128k-chat": { 
    "max_tokens": 131072,
    "max_input_tokens": 131072,
    "max_output_tokens": 131072,
    "input_cost_per_token": 0.000001, 
    "output_cost_per_token": 0.000001,
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/llama-3.1-sonar-small-128k-chat": { 
    "max_tokens": 131072,
    "max_input_tokens": 131072,
    "max_output_tokens": 131072,
    "input_cost_per_token": 0.0000002, 
    "output_cost_per_token": 0.0000002,  
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/llama-3.1-sonar-small-128k-online": { 
    "max_tokens": 127072,
    "max_input_tokens": 127072,
    "max_output_tokens": 127072,
    "input_cost_per_token": 0.0000002, 
    "output_cost_per_token": 0.0000002,  
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/pplx-7b-chat": { 
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000007, 
    "output_cost_per_token": 0.00000028, 
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/pplx-70b-chat": {  
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000070, 
    "output_cost_per_token": 0.00000280, 
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/pplx-7b-online": { 
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.0000000, 
    "output_cost_per_token": 0.00000028, 
    "input_cost_per_request": 0.005,
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/pplx-70b-online": { 
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.0000000, 
    "output_cost_per_token": 0.00000280, 
    "input_cost_per_request": 0.005,
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/llama-2-70b-chat": { 
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.00000070, 
    "output_cost_per_token": 0.00000280,
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/mistral-7b-instruct": { 
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.00000007,
    "output_cost_per_token": 0.00000028,
    "litellm_provider": "perplexity", 
    "mode": "chat" 
  },
  "perplexity/mixtral-8x7b-instruct": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000007,
    "output_cost_per_token": 0.00000028,
    "litellm_provider": "perplexity",
    "mode": "chat"
  },
  "perplexity/sonar-small-chat": {
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.00000007,
    "output_cost_per_token": 0.00000028,
    "litellm_provider": "perplexity",
    "mode": "chat"
  },
  "perplexity/sonar-small-online": {
    "max_tokens": 12000,
    "max_input_tokens": 12000,
    "max_output_tokens": 12000,
    "input_cost_per_token": 0,
    "output_cost_per_token": 0.00000028,
    "input_cost_per_request": 0.005,
    "litellm_provider": "perplexity",
    "mode": "chat"
  },
  "perplexity/sonar-medium-chat": {
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.0000006,
    "output_cost_per_token": 0.0000018,
    "litellm_provider": "perplexity",
    "mode": "chat"
  },
  "perplexity/sonar-medium-online": {
    "max_tokens": 12000,
    "max_input_tokens": 12000,
    "max_output_tokens": 12000,
    "input_cost_per_token": 0,
    "output_cost_per_token": 0.0000018,
    "input_cost_per_request": 0.005,
    "litellm_provider": "perplexity",
    "mode": "chat"
  },
  "fireworks_ai/accounts/fireworks/models/firefunction-v2": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0000009, 
    "output_cost_per_token": 0.0000009,
    "litellm_provider": "fireworks_ai", 
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://fireworks.ai/pricing"
  },
  "fireworks_ai/accounts/fireworks/models/mixtral-8x22b-instruct-hf": {
    "max_tokens": 65536,
    "max_input_tokens": 65536,
    "max_output_tokens": 65536,
    "input_cost_per_token": 0.0000012, 
    "output_cost_per_token": 0.0000012,
    "litellm_provider": "fireworks_ai", 
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://fireworks.ai/pricing"
  },
  "fireworks_ai/accounts/fireworks/models/qwen2-72b-instruct": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 32768,
    "input_cost_per_token": 0.0000009, 
    "output_cost_per_token": 0.0000009,
    "litellm_provider": "fireworks_ai", 
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://fireworks.ai/pricing"
  },
  "fireworks_ai/accounts/fireworks/models/yi-large": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 32768,
    "input_cost_per_token": 0.000003, 
    "output_cost_per_token": 0.000003,
    "litellm_provider": "fireworks_ai", 
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://fireworks.ai/pricing"
  },
  "fireworks_ai/accounts/fireworks/models/deepseek-coder-v2-instruct": {
    "max_tokens": 65536,
    "max_input_tokens": 65536,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.0000012, 
    "output_cost_per_token": 0.0000012,
    "litellm_provider": "fireworks_ai", 
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://fireworks.ai/pricing"
  },
  "anyscale/mistralai/Mistral-7B-Instruct-v0.1": {
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.00000015, 
    "output_cost_per_token": 0.00000015,
    "litellm_provider": "anyscale", 
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://docs.anyscale.com/preview/endpoints/text-generation/supported-models/mistralai-Mistral-7B-Instruct-v0.1"
  },
  "anyscale/mistralai/Mixtral-8x7B-Instruct-v0.1": {
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.00000015, 
    "output_cost_per_token": 0.00000015,
    "litellm_provider": "anyscale", 
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://docs.anyscale.com/preview/endpoints/text-generation/supported-models/mistralai-Mixtral-8x7B-Instruct-v0.1"
  },
  "anyscale/mistralai/Mixtral-8x22B-Instruct-v0.1": {
    "max_tokens": 65536,
    "max_input_tokens": 65536,
    "max_output_tokens": 65536,
    "input_cost_per_token": 0.00000090, 
    "output_cost_per_token": 0.00000090,
    "litellm_provider": "anyscale", 
    "mode": "chat",
    "supports_function_calling": true,
    "source": "https://docs.anyscale.com/preview/endpoints/text-generation/supported-models/mistralai-Mixtral-8x22B-Instruct-v0.1"
  },
  "anyscale/HuggingFaceH4/zephyr-7b-beta": {
    "max_tokens": 16384,
    "max_input_tokens": 16384,
    "max_output_tokens": 16384,
    "input_cost_per_token": 0.00000015, 
    "output_cost_per_token": 0.00000015,
    "litellm_provider": "anyscale", 
    "mode": "chat"
  },
  "anyscale/google/gemma-7b-it": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000015, 
    "output_cost_per_token": 0.00000015,
    "litellm_provider": "anyscale", 
    "mode": "chat",
    "source": "https://docs.anyscale.com/preview/endpoints/text-generation/supported-models/google-gemma-7b-it"
  },
  "anyscale/meta-llama/Llama-2-7b-chat-hf": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000015, 
    "output_cost_per_token": 0.00000015, 
    "litellm_provider": "anyscale", 
    "mode": "chat"
  },
  "anyscale/meta-llama/Llama-2-13b-chat-hf": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.00000025, 
    "output_cost_per_token": 0.00000025, 
    "litellm_provider": "anyscale", 
    "mode": "chat"
  },
  "anyscale/meta-llama/Llama-2-70b-chat-hf": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000001, 
    "output_cost_per_token": 0.000001, 
    "litellm_provider": "anyscale", 
    "mode": "chat"
  },
  "anyscale/codellama/CodeLlama-34b-Instruct-hf": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000001, 
    "output_cost_per_token": 0.000001, 
    "litellm_provider": "anyscale", 
    "mode": "chat"
  },
  "anyscale/codellama/CodeLlama-70b-Instruct-hf": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096,
    "input_cost_per_token": 0.000001, 
    "output_cost_per_token": 0.000001, 
    "litellm_provider": "anyscale", 
    "mode": "chat",
    "source" : "https://docs.anyscale.com/preview/endpoints/text-generation/supported-models/codellama-CodeLlama-70b-Instruct-hf"
  },
  "anyscale/meta-llama/Meta-Llama-3-8B-Instruct": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000015, 
    "output_cost_per_token": 0.00000015, 
    "litellm_provider": "anyscale", 
    "mode": "chat",
    "source": "https://docs.anyscale.com/preview/endpoints/text-generation/supported-models/meta-llama-Meta-Llama-3-8B-Instruct"
  },
  "anyscale/meta-llama/Meta-Llama-3-70B-Instruct": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192,
    "input_cost_per_token": 0.00000100, 
    "output_cost_per_token": 0.00000100, 
    "litellm_provider": "anyscale", 
    "mode": "chat",
    "source" : "https://docs.anyscale.com/preview/endpoints/text-generation/supported-models/meta-llama-Meta-Llama-3-70B-Instruct"
  },
  "cloudflare/@cf/meta/llama-2-7b-chat-fp16": {
    "max_tokens": 3072, 
    "max_input_tokens": 3072, 
    "max_output_tokens": 3072, 
    "input_cost_per_token": 0.000001923, 
    "output_cost_per_token": 0.000001923, 
    "litellm_provider": "cloudflare", 
    "mode": "chat"
  },
  "cloudflare/@cf/meta/llama-2-7b-chat-int8": {
    "max_tokens": 2048, 
    "max_input_tokens": 2048, 
    "max_output_tokens": 2048, 
    "input_cost_per_token": 0.000001923, 
    "output_cost_per_token": 0.000001923, 
    "litellm_provider": "cloudflare", 
    "mode": "chat"
  },
  "cloudflare/@cf/mistral/mistral-7b-instruct-v0.1": {
    "max_tokens": 8192, 
    "max_input_tokens": 8192, 
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.000001923, 
    "output_cost_per_token": 0.000001923, 
    "litellm_provider": "cloudflare", 
    "mode": "chat"
  },
  "cloudflare/@hf/thebloke/codellama-7b-instruct-awq": {
    "max_tokens": 4096, 
    "max_input_tokens": 4096, 
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.000001923, 
    "output_cost_per_token": 0.000001923, 
    "litellm_provider": "cloudflare", 
    "mode": "chat"
  },
  "voyage/voyage-01": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "voyage",
    "mode": "embedding"
  },
  "voyage/voyage-lite-01": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "voyage",
    "mode": "embedding"
  },
  "voyage/voyage-large-2": {
    "max_tokens": 16000,
    "max_input_tokens": 16000,
    "input_cost_per_token": 0.00000012,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "voyage",
    "mode": "embedding"
  },
  "voyage/voyage-law-2": {
    "max_tokens": 16000,
    "max_input_tokens": 16000,
    "input_cost_per_token": 0.00000012,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "voyage",
    "mode": "embedding"
  },
  "voyage/voyage-code-2": {
    "max_tokens": 16000,
    "max_input_tokens": 16000,
    "input_cost_per_token": 0.00000012,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "voyage",
    "mode": "embedding"
  },
  "voyage/voyage-2": {
    "max_tokens": 4000,
    "max_input_tokens": 4000,
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "voyage",
    "mode": "embedding"
  },
  "voyage/voyage-lite-02-instruct": {
    "max_tokens": 4000,
    "max_input_tokens": 4000,
    "input_cost_per_token": 0.0000001,
    "output_cost_per_token": 0.000000,
    "litellm_provider": "voyage",
    "mode": "embedding"
  },
  "databricks/databricks-meta-llama-3-1-405b-instruct": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000, 
    "input_cost_per_token": 0.000005,
    "input_dbu_cost_per_token": 0.000071429,
    "output_cost_per_token": 0.00001500002,
    "output_db_cost_per_token": 0.000214286,
    "litellm_provider": "databricks",
    "mode": "chat",
    "source": "https://www.databricks.com/product/pricing/foundation-model-serving",
    "metadata": {"notes": "Input/output cost per token is dbu cost * $0.070, based on databricks Llama 3.1 70B conversion. Number provided for reference, '*_dbu_cost_per_token' used in actual calculation."}
  },
  "databricks/databricks-meta-llama-3-1-70b-instruct": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000, 
    "input_cost_per_token": 0.00000100002,
    "input_dbu_cost_per_token": 0.000014286,
    "output_cost_per_token": 0.00000299999,
    "output_dbu_cost_per_token": 0.000042857,
    "litellm_provider": "databricks",
    "mode": "chat",
    "source": "https://www.databricks.com/product/pricing/foundation-model-serving",
    "metadata": {"notes": "Input/output cost per token is dbu cost * $0.070, based on databricks Llama 3.1 70B conversion. Number provided for reference, '*_dbu_cost_per_token' used in actual calculation."}
  },
  "databricks/databricks-dbrx-instruct": {
    "max_tokens": 32768,
    "max_input_tokens": 32768,
    "max_output_tokens": 32768, 
    "input_cost_per_token": 0.00000074998,
    "input_dbu_cost_per_token": 0.000010714,
    "output_cost_per_token": 0.00000224901,
    "output_dbu_cost_per_token": 0.000032143,
    "litellm_provider": "databricks",
    "mode": "chat",
    "source": "https://www.databricks.com/product/pricing/foundation-model-serving",
    "metadata": {"notes": "Input/output cost per token is dbu cost * $0.070, based on databricks Llama 3.1 70B conversion. Number provided for reference, '*_dbu_cost_per_token' used in actual calculation."}
  },
  "databricks/databricks-meta-llama-3-70b-instruct": {
    "max_tokens": 128000,
    "max_input_tokens": 128000,
    "max_output_tokens": 128000, 
    "input_cost_per_token": 0.00000100002,
    "input_dbu_cost_per_token": 0.000014286,
    "output_cost_per_token": 0.00000299999,
    "output_dbu_cost_per_token": 0.000042857,
    "litellm_provider": "databricks",
    "mode": "chat",
    "source": "https://www.databricks.com/product/pricing/foundation-model-serving",
    "metadata": {"notes": "Input/output cost per token is dbu cost * $0.070, based on databricks Llama 3.1 70B conversion. Number provided for reference, '*_dbu_cost_per_token' used in actual calculation."}
  },
  "databricks/databricks-llama-2-70b-chat": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.00000050001,
    "input_dbu_cost_per_token": 0.000007143,
    "output_cost_per_token": 0.0000015,
    "output_dbu_cost_per_token": 0.000021429,
    "litellm_provider": "databricks",
    "mode": "chat",
    "source": "https://www.databricks.com/product/pricing/foundation-model-serving",
    "metadata": {"notes": "Input/output cost per token is dbu cost * $0.070, based on databricks Llama 3.1 70B conversion. Number provided for reference, '*_dbu_cost_per_token' used in actual calculation."}
  },
  "databricks/databricks-mixtral-8x7b-instruct": {
    "max_tokens": 4096,
    "max_input_tokens": 4096,
    "max_output_tokens": 4096, 
    "input_cost_per_token": 0.00000050001,
    "input_dbu_cost_per_token": 0.000007143,
    "output_cost_per_token": 0.00000099902,
    "output_dbu_cost_per_token": 0.000014286,
    "litellm_provider": "databricks",
    "mode": "chat",
    "source": "https://www.databricks.com/product/pricing/foundation-model-serving",
    "metadata": {"notes": "Input/output cost per token is dbu cost * $0.070, based on databricks Llama 3.1 70B conversion. Number provided for reference, '*_dbu_cost_per_token' used in actual calculation."}
  },
  "databricks/databricks-mpt-30b-instruct": {
    "max_tokens": 8192,
    "max_input_tokens": 8192,
    "max_output_tokens": 8192, 
    "input_cost_per_token": 0.00000099902,
    "input_dbu_cost_per_token": 0.000014286,
    "output_cost_per_token": 0.00000099902,
    "output_dbu_cost_per_token": 0.000014286,
    "litellm_provider": "databricks",
    "mode": "chat",
    "source": "https://www.databricks.com/product/pricing/foundation-model-serving",
    "metadata": {"notes": "Input/output cost per token is dbu cost * $0.070, based on databricks Llama 3.1 70B conversion. Number provided for reference, '*_dbu_cost_per_token' used in actual calculation."}
  },
    "databricks/databricks-mpt-7b-instruct": {
        "max_tokens": 8192,
        "max_input_tokens": 8192,
        "max_output_tokens": 8192, 
        "input_cost_per_token": 0.00000050001,
        "input_dbu_cost_per_token": 0.000007143,
        "output_cost_per_token": 0.0,
        "output_dbu_cost_per_token": 0.0,
        "litellm_provider": "databricks",
        "mode": "chat",
        "source": "https://www.databricks.com/product/pricing/foundation-model-serving",
        "metadata": {"notes": "Input/output cost per token is dbu cost * $0.070, based on databricks Llama 3.1 70B conversion. Number provided for reference, '*_dbu_cost_per_token' used in actual calculation."}
    },
    "databricks/databricks-bge-large-en": {
        "max_tokens": 512,
        "max_input_tokens": 512,
        "output_vector_size": 1024, 
        "input_cost_per_token": 0.00000010003,
        "input_dbu_cost_per_token": 0.000001429,
        "output_cost_per_token": 0.0,
        "output_dbu_cost_per_token": 0.0,
        "litellm_provider": "databricks",
        "mode": "embedding",
        "source": "https://www.databricks.com/product/pricing/foundation-model-serving",
        "metadata": {"notes": "Input/output cost per token is dbu cost * $0.070, based on databricks Llama 3.1 70B conversion. Number provided for reference, '*_dbu_cost_per_token' used in actual calculation."}
    },
    "databricks/databricks-gte-large-en": {
        "max_tokens": 8192,
        "max_input_tokens": 8192,
        "output_vector_size": 1024, 
        "input_cost_per_token": 0.00000012999,
        "input_dbu_cost_per_token": 0.000001857,
        "output_cost_per_token": 0.0,
        "output_dbu_cost_per_token": 0.0,
        "litellm_provider": "databricks",
        "mode": "embedding",
        "source": "https://www.databricks.com/product/pricing/foundation-model-serving",
        "metadata": {"notes": "Input/output cost per token is dbu cost * $0.070, based on databricks Llama 3.1 70B conversion. Number provided for reference, '*_dbu_cost_per_token' used in actual calculation."}
    }
}
