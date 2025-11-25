import Axios, { AxiosInstance } from 'axios';
import { injectable, inject } from 'inversify';
import llamaTokenizer from 'llama-tokenizer-js';

import { ConfigsModule } from '../../configs';
import { LoggerModule } from '../../logger';

import { LlmClient, LlmClientError } from './llm.client.interface';

const MAX_TOKEN_COUNT = 2048;
@injectable()
export class OpenAIClientAdapter implements LlmClient {
  private static llmClient: OpenAIClientAdapter | null = null;
  private readonly api: AxiosInstance;

  constructor(
    @inject(ConfigsModule.CONFIGS) private readonly configs: ConfigsModule.Configs,
    @inject(LoggerModule.LOGGER) private readonly logger: LoggerModule.Logger
  ) {
    this.api = Axios.create({
      baseURL: this.configs.get('LLM_API_URL'),
      timeout: 300000,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.configs.get('LLM_API_KEY'),
      },
    });
    this.logger.info({
      message: 'OpenAI Client initialized',
      baseURL: this.configs.get('LLM_API_URL'),
    });
  }

  getClient: LlmClient['getClient'] = () => {
    if (!OpenAIClientAdapter.llmClient) {
      throw new LlmClientError(undefined, 'LLM Client not initialized');
    }
    return OpenAIClientAdapter.llmClient;
  };

  ask: LlmClient['ask'] = async (prompt: string) => {
    this.logger.info({
      message: 'Asking LuxiaCloud LLM',
    });
    this.logger.debug({
      message: 'Prompt being sent to LuxiaCloud',
      prompt,
    });

    try {
      const response = await this.api.post('/chat/completions/gpt-4o-mini/create', {
        model: 'llm',
        messages: [
          { role: 'system', content: 'You are a GDPR compliance assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        stream: false,
      });

      this.logger.debug({
        message: 'Response received from LuxiaCloud',
        response: response.data,
      });

      const { data } = response;

      if (!data.choices || data.choices.length === 0) {
        return new LlmClientError(undefined, 'Invalid response from LLM');
      }

      const content = data.choices[0]?.message?.content;
      if (!content) {
        return new LlmClientError(undefined, 'No content in LLM response');
      }

      // Parse JSON from response
      const parseResult = this.parseResponse(content);
      if (LoggerModule.isError(parseResult)) {
        return new LlmClientError(undefined, 'Failed to parse LLM response', parseResult);
      }

      return parseResult;
    } catch (errorRaw) {
      this.logger.debug({
        message: 'LuxiaCloud API Error Details',
        error: (errorRaw as any).response?.data,
        status: (errorRaw as any).response?.status,
      });
      return new LlmClientError(
        {
          status: (errorRaw as any).response?.status,
          data: (errorRaw as any).response?.data,
        },
        'Unable to ask the LLM',
        LoggerModule.convertToError(errorRaw)
      );
    }
  };

  private parseResponse = (response: string) => {
    const start = response.indexOf('[');
    const end = response.lastIndexOf(']');

    if (start === -1 || end === -1 || end <= start) {
      return new LlmClientError(
        {
          response,
        },
        'No valid JSON array found.'
      );
    }
    const raw = response.slice(start, end + 1);

    try {
      return JSON.parse(raw);
    } catch (errorRaw) {
      return new LlmClientError(
        {
          raw: raw,
        },
        'Failed to parse extracted JSON array.',
        LoggerModule.convertToError(errorRaw)
      );
    }
  };

  isTooMuchToken: LlmClient['isTooMuchToken'] = (prompt: string) => {
    return llamaTokenizer.encode(prompt).length > MAX_TOKEN_COUNT;
  };
}
