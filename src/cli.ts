import { Command } from 'commander';
import { extractTypes } from './extractor.js';
import fs from 'fs/promises';

const program = new Command();

program
    .version('1.0.0')
    .description('Extract types from source code given a file path')
    .command('extract <filePath>')
    .description('Extract types from source code given a file path')
    .action(async (filePath) => {
        try {
            const sourceCode = await fs.readFile(filePath, 'utf-8');
            const types = await extractTypes(sourceCode);
            console.log(types);
        } catch (error) {
            console.error('Error extracting types from source code:', error);
            process.exit(1);
        }
    });

program.parse(process.argv);