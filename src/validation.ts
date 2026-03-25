import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';
import { inputSchema, outputSchema } from './schemas.js';
import type { ErrorObject } from 'ajv';
import type { PropertyGrowthInput, PropertyGrowthResult } from './types.js';

const Ajv = AjvModule.default ?? AjvModule;
const addFormats = addFormatsModule.default ?? addFormatsModule;
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validateInputSchema = ajv.compile<PropertyGrowthInput>(inputSchema);
const validateOutputSchema = ajv.compile<PropertyGrowthResult>(outputSchema);

export function withInputDefaults(input: Partial<PropertyGrowthInput>): PropertyGrowthInput {
  return {
    suburb: input.suburb ?? '',
    address: input.address ?? '',
    propertyType: input.propertyType ?? 'unit',
    lastYearValuation: input.lastYearValuation ?? 0,
    comparableType: input.comparableType ?? 'sold',
    currency: input.currency ?? 'AUD',
    knownUrls: input.knownUrls
  };
}

export function validateInput(input: PropertyGrowthInput): { valid: true } | { valid: false; errors: string[] } {
  const valid = validateInputSchema(input);
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
