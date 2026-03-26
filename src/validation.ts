import Ajv2020Module from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import { inputSchema, outputSchema } from './schemas.js';
import type { ErrorObject } from 'ajv';
import type { PropertyGrowthInput, PropertyGrowthResult } from './types.js';

const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;
const addFormats = addFormatsModule.default ?? addFormatsModule;
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const validateInputSchema = ajv.compile<PropertyGrowthInput>(inputSchema);
const validateOutputSchema = ajv.compile<PropertyGrowthResult>(outputSchema);

export function validateInput(input: PropertyGrowthInput): { valid: true } | { valid: false; errors: string[] } {
  const { knownUrls: _knownUrls, state: _state, postCode: _postCode, ...schemaInput } = input;
  const valid = validateInputSchema(schemaInput);
  if (valid) return { valid: true };
  return {
    valid: false,
    errors: (validateInputSchema.errors ?? []).map((error: ErrorObject) => `${error.instancePath || '/'} ${error.message}`)
  };
}

export function validateOutput(output: PropertyGrowthResult): { valid: true } | { valid: false; errors: string[] } {
  const valid = validateOutputSchema(output);
  if (valid) return { valid: true };
  return {
    valid: false,
    errors: (validateOutputSchema.errors ?? []).map((error: ErrorObject) => `${error.instancePath || '/'} ${error.message}`)
  };
}
