import {OpenAI} from 'openai';
import {LlmChatMessage, LlmChatMessageRole, LlmProvider, LlmProviderParams} from './types';
import {HttpsProxyAgent} from 'https-proxy-agent';


export class OpenAILlmProvider implements LlmProvider {
    private openai: OpenAI
    private readonly model: string

    constructor({token, model}: LlmProviderParams) {
        const agent = new HttpsProxyAgent('http://oCtxPU:E2U4CA@172.245.201.134:8000');
        this.openai = new OpenAI({
            apiKey: token,
            httpAgent: agent
        });
        this.model = model
    }

    // TODO: dynamically identify token limits based on model
    getTokenLimit(): number {
        return 64_000;
    }

    async sendMessage(message: string): Promise<string> {
        return this.sendMessages([{
            role: LlmChatMessageRole.USER,
            content: message
        }]);
    }

    async sendMessages(messages: LlmChatMessage[]): Promise<string> {
        try {
            const stream = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages.map(msg => ({role: msg.role, content: msg.content})),
                stream: true,
            });

            let response: string = "";

            for await (const chunk of stream) {
                response += chunk.choices[0]?.delta?.content || "";
            }

            return new Promise<string>((resolve, _) => resolve(response));
        } catch (error) {
            return new Promise<string>((_, reject) => reject(error));
        }
    }
}