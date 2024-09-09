import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function extractTypes(sourceCode: string): Promise<string> {
    const systemMessage = `
        You are a helpful coding assistant.
        You are given a Rust source file, and your task is to extract only the type definitions from it.
        These types include structs, enums, and type aliases.
        You should remove everything else, including functions, derive macros, and impl blocks.
        Names that are imported from outside the file should be replaced with the fully qualified name (e.g. replace Rc<...> with std::rc::Rc<...>).
        The resulting code should not require any imports.
        Your output should only contain: structs, enums, and type aliases from the input file, and nothing else e.g. no derive annotations or use statements.
        Do not include any additional commentary or explanations in your output.
        Return only valid Rust code that fits these requirements, without any markdown.
    `;

    const prompt = `Here is the Rust source code. Please return the file with only the type definitions (structs, enums, type aliases), using fully qualified names: ${sourceCode}`;

    try {
        const responseText = await callOpenAI(systemMessage, prompt);
        return responseText;
    } catch (error) {
        console.error('Error formatting source code:', error);
        throw new Error('Failed to format source code');
    }
}

interface OpenAIResponse {
    choices: { message: { content: string } }[];
}

async function callOpenAI(systemMessage: string, prompt: string): Promise<string> {
    try {
        const response = await axios.post<OpenAIResponse>(
            OPENAI_API_URL,
            {
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 16000,
                temperature: 0.0
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            handleAxiosError(error);
        } else {
            console.error('Unexpected error:', error);
        }
        throw new Error('Failed when calling OpenAI API.');
    }
}

function handleAxiosError(error: AxiosError): void {
    if (error.response) {
        console.error('Error response from OpenAI API:', error.response.data);
        console.error('Status code:', error.response.status);
        console.error('Headers:', error.response.headers);
    } else if (error.request) {
        console.error('No response received from OpenAI API:', error.request);
    } else {
        console.error('Error in setting up request:', error.message);
    }
}