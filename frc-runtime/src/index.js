import { executeScript } from './executor.js';

/**
 * Runs a FRCL script string.
 * @param {string} script 
 * @returns {Promise<any>}
 */
export async function runFRCL(script) {
    if (!script) return null;
    return await executeScript(script);
}
