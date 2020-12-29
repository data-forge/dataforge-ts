export { Index, IIndex } from './lib/index';
export { Series, ISeries, SelectorWithIndexFn } from './lib/series';
export { DataFrame, IDataFrame } from './lib/dataframe';
import { ArrayIterable } from './lib/iterables/array-iterable';
import { CsvRowsIterable } from './lib/iterables/csv-rows-iterable';
import { Series, ISeries } from '.';
import { DataFrame, IDataFrame } from '.';
import { isString, isObject, isArray, isNumber } from './lib/utils';
import { isFunction } from 'util';
import JSON5 from 'json5';
// @ts-ignore
import moment from "dayjs";
// @ts-ignore
import customParseFormat from 'dayjs/plugin/customParseFormat';
moment.extend(customParseFormat);

// @ts-ignore
import PapaParse from 'papaparse';

/**
 * Represents a field from a JavaScript object.
 */
export interface IFieldRecord {
    /**
     * The name of the field.
     */
    Field: string;

    /**
     * The value of the field.
     */
    Value: any;
}

/**
 * Convert a regular JavaScript obejct to a dataframe.
 * Each row in the dataframe represents a field from the object.
 * 
 * @param obj - The JavaScript object to convert to a dataframe.
 * 
 * @returns Returns a dataframe that lists the fields in the pass-in object.
 */
export function fromObject (obj: any): IDataFrame<number, IFieldRecord> {
    return new DataFrame<number, IFieldRecord>(
        Object.keys(obj)
            .map(fieldName => ({
                Field: fieldName,
                Value: obj[fieldName],
            }))
    );
}

/**
 * Deserialize a dataframe from a JSON text string.
 *
 * @param jsonTextString The JSON text to deserialize.
 * 
 * @returns Returns a dataframe that has been deserialized from the JSON data.
 */
export function fromJSON (jsonTextString: string): IDataFrame<number, any> {
    
    if (!isString(jsonTextString)) throw new Error("Expected 'jsonTextString' parameter to 'dataForge.fromJSON' to be a string containing data encoded in the JSON format.");

    return new DataFrame<number, any>({
        values: JSON.parse(jsonTextString)
    });
}

/**
 * Deserialize a dataframe from a JSON5 text string.
 *
 * @param jsonTextString The JSON5 text to deserialize.
 * 
 * @returns Returns a dataframe that has been deserialized from the JSON data.
 */
export function fromJSON5 (jsonTextString: string): IDataFrame<number, any> {
    
    if (!isString(jsonTextString)) throw new Error("Expected 'jsonTextString' parameter to 'dataForge.fromJSON5' to be a string containing data encoded in the JSON5 format.");

    return new DataFrame<number, any>({
        values: JSON5.parse(jsonTextString)
    });
}

/**
 * Options for parsing CSV data.
 */
export interface ICSVOptions {
    /**
     * Optionally specifies the column names (when enabled, assumes that the header row is not read from the CSV data).
     * Default: undefined
     */
    columnNames?: Iterable<string>;

    /**
     * Automatically pick types based on what the value looks like.
     * Default: false.
     */
    dynamicTyping?: boolean;

    /**
     * Skip empty lines in the input.
     * Default: true
     */
    skipEmptyLines?: boolean;
}

/**
 * Deserialize a DataFrame from a CSV text string.
 *
 * @param csvTextString The CSV text to deserialize.
 * @param config Optional configuration options for parsing the CSV data. 
 * The config object is passed directly to [PapaParse.parse](https://www.papaparse.com/docs#strings), please see [PapaParse docs for additional options](https://www.papaparse.com/docs#config).
 * 
 * @returns Returns a dataframe that has been deserialized from the CSV data.
 */
export function fromCSV (csvTextString: string, config?: ICSVOptions) {
    if (!isString(csvTextString)) throw new Error("Expected 'csvTextString' parameter to 'dataForge.fromCSV' to be a string containing data encoded in the CSV format.");

    if (config) {
        if (!isObject(config)) throw new Error("Expected 'config' parameter to 'dataForge.fromCSV' to be an object with CSV parsing configuration options.");

        if (config.columnNames) {
            if (!isFunction(config.columnNames[Symbol.iterator])) {
                if (!isArray(config.columnNames)) throw new Error("Expect 'columnNames' field of 'config' parameter to DataForge.fromCSV to be an array or iterable of strings that specifies column names.")
            }


            for (const columnName of config.columnNames) {
                if (!isString(columnName)) throw new Error("Expect 'columnNames' field of 'config' parameter to DataForge.fromCSV to be an array of strings that specify column names.")
            }
        }
        
        if (config.skipEmptyLines === undefined) {
            config = Object.assign({}, config); // Clone the config. Don't want to modify the original.
            config.skipEmptyLines = true;
        }
    }
    else {
        config = {
            skipEmptyLines: true,
        }
    }

    const parsed = PapaParse.parse(csvTextString, config as any);
    let rows = <string[][]> parsed.data;

    if (rows.length === 0) {
        return new DataFrame<number, any>();
    }

    let columnNames;
    rows = rows.map(row => {
            return row.map(cell => isString(cell) ? cell.trim() : cell); // Trim each cell that is still a string.
        });

    if (config && config.columnNames) {
        columnNames = config.columnNames;
    }
    else {
        columnNames = rows.shift()
        columnNames = columnNames && columnNames.map(String); // Column names must be string
    }

    return new DataFrame<number, any>({
        rows: rows,
        columnNames: columnNames,
    });
}

const concat = Series.concat;

/**
 * Concatenate multiple series into a single series.
 * THIS FUNCTION IS DEPRECATED. Instead use dataFrame.Series.concat.
 * 
 * @param {array} series - Array of series to concatenate.
 *
 * @returns {Series} - Returns the single concatendated series.  
 */
export { concat as concatSeries };

const zip = Series.zip;

/**
 * Zip together multiple series to create a new series.
 * THIS FUNCTION IS DEPRECATED. Instead use dataFrame.Series.zip.
 *
 * @param {array} series - Array of series to zip together.
 * @param {function} selector - Selector function that produces a new series based on the input series.
 * 
 * @returns {Series} Returns a single series that is the combination of multiple input series that have been 'zipped' together by the 'selector' function.
 */
export { zip as zipSeries }

/**
 * Generate a series from a range of numbers.
 *
 * @param start - The value of the first number in the range.
 * @param count - The number of sequential values in the range.
 * 
 * @returns Returns a series with a sequence of generated values. The series contains 'count' values beginning at 'start'. 
 */
export function range (start: number, count: number): ISeries<number, number> {

    if (!isNumber(start)) throw new Error("Expect 'start' parameter to 'dataForge.range' function to be a number.");
    if (!isNumber(count)) throw new Error("Expect 'count' parameter to 'dataForge.range' function to be a number.");

    const values: number[] = [];
    for (let valueIndex = 0; valueIndex < count; ++valueIndex) {
        values.push(start + valueIndex);
    }

    return new Series<number, number>(values);
}

/**
 * Replicate a particular value N times to create a series.
 * 
 * @param value The value to replicate.
 * @param count The number of times to replicate the value.
 * 
 * @returns Returns a new series that contains N copies of the value.
 */
export function replicate<ValueT> (value: ValueT, count: number): ISeries<number, ValueT> {
    const values: ValueT[] = [];
    for (let i = 0; i < count; ++i) {
        values.push(value);
    }

    return new Series<number, ValueT>(values);
}

/**
 * Generate a data-frame containing a matrix of values.
 *
 * @param numColumns - The number of columns in the data-frame.
 * @param numRows - The number of rows in the data-frame.
 * @param start - The starting value.
 * @param increment - The value to increment by for each new value.
 * 
 * @returns Returns a dataframe that contains a matrix of generated values.
 */
export function matrix (numColumns: number, numRows: number, start: number, increment: number): IDataFrame<number, any> {
    if (!isNumber(numColumns)) throw new Error("Expect 'numColumns' parameter to 'dataForge.matrix' function to be a number.");
    if (!isNumber(numRows)) throw new Error("Expect 'numRows' parameter to 'dataForge.matrix' function to be a number.");
    if (!isNumber(start)) throw new Error("Expect 'start' parameter to 'dataForge.matrix' function to be a number.");
    if (!isNumber(increment)) throw new Error("Expect 'increment' parameter to 'dataForge.matrix' function to be a number.");

    const rows: number[][] = [];
    const columnNames: string[] = [];
    var nextValue = start;

    for (let colIndex = 0; colIndex < numColumns; ++colIndex) {
        columnNames.push((colIndex+1).toString());
    }
    
    for (let rowIndex = 0; rowIndex < numRows; ++rowIndex) {
        var row: number[] = [];

        for (let colIndex = 0; colIndex < numColumns; ++colIndex) {
            row.push(nextValue + (colIndex * increment));
        }

        nextValue += numColumns * increment;
        rows.push(row);
    }

    return new DataFrame({
        columnNames: columnNames,
        rows: rows,
    });
}
