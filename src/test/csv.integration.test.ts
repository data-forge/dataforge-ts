import { assert, expect } from 'chai';
import 'mocha';
import * as dataForge from '../index';
// @ts-ignore
import moment from "dayjs";

describe('csv integration', () => {

	it('can read data frame from CSV', () => {

		var csv =
			"Date, Value1, Value2, Value3\n" +
			"1975-2-24, 100, foo, 22\n" +
			"2015-10-23, 300, bar, 23";

		var dataFrame = dataForge.fromCSV(csv);
		var series1 = dataFrame.getSeries('Value1');
		expect(series1.toArray()).to.eql([
			'100',
			'300',
		]);

		var series2 = dataFrame.getSeries('Value2');
		expect(series2.toArray()).to.eql([
			'foo',
			'bar',
		]);

		expect(dataFrame.getColumnNames()).to.eql([
			"Date",
			'Value1',
			'Value2',
			'Value3',
		]);

		expect(dataFrame.toRows()).to.eql([
			['1975-2-24', '100', "foo", '22'],
			['2015-10-23', '300', "bar", '23'],
		]);
	});

	it('blank lines in the CSV data are automatically skipped by default', () => {

		var csv =
			"Date, Value1, Value2, Value3\n" +
			"1975-2-24, 100, foo, 22\n" +
			"\n" +
			"2015-10-23, 300, bar, 23";

		var df = dataForge.fromCSV(csv);
		expect(df.toRows()).to.eql([
			['1975-2-24', '100', "foo", '22'],
			['2015-10-23', '300', "bar", '23'],
		]);
	});

	it('can automatically choose types from CSV values', () => {

		var csv =
			"Value1, Value2\n" +
			"100, foo\n" +
			"300, bar";

		var dataFrame = dataForge.fromCSV(csv, { dynamicTyping: true });

		expect(dataFrame.getSeries('Value1').toArray()).to.eql([
			100,
			300,
		]);

		expect(dataFrame.getSeries('Value2').toArray()).to.eql([
			'foo',
			'bar',
		]);
	});

	it('can read CSV with explicit header', () => {

		var csv =
			"1975-2-24, 100, foo, 22\n" +
			"2015-10-23, 300, bar, 23";

		var dataFrame = dataForge.fromCSV(csv, { columnNames: ["Date", "Value1", "Value2", "Value3"] });
		var series1 = dataFrame.getSeries('Value1');
		expect(series1.toArray()).to.eql([
			'100',
			'300',
		]);

		var series2 = dataFrame.getSeries('Value2');
		expect(series2.toArray()).to.eql([
			'foo',
			'bar',
		]);

		expect(dataFrame.getColumnNames()).to.eql([
			"Date",
			'Value1',
			'Value2',
			'Value3',
		]);

		expect(dataFrame.toRows()).to.eql([
			['1975-2-24', '100', "foo", '22'],
			['2015-10-23', '300', "bar", '23'],
		]);
	});

	it('can handle CSV with numbers in the header, and dynamic typing on', () => {

		var csv =
			'c1,123\n' +
			'abc,987\n' +
			'def,654'

		var dataFrame = dataForge.fromCSV(csv, { dynamicTyping: true });
		expect(dataFrame.getColumnNames()).to.eql(["c1", '123']);

		var series1 = dataFrame.getSeries('c1');
		expect(series1.toArray()).to.eql([
			'abc',
			'def',
		]);

		var series2 = dataFrame.getSeries('123');
		expect(series2.toArray()).to.eql([
			987,
			654,
		]);
	});

	it('can handle CSV with trailing commas', () => {

		var csv =
			"c1, c2,\n" +
			"f, 1,2\n" +
			"x, 2,2";

		var dataFrame = dataForge.fromCSV(csv);
		expect(dataFrame.getColumnNames()).to.eql(["c1", "c2", ""]);

		var series1 = dataFrame.getSeries('c1');
		expect(series1.toArray()).to.eql([
			'f',
			'x',
		]);

		var series2 = dataFrame.getSeries('c2');
		expect(series2.toArray()).to.eql([
			'1',
			'2',
		]);
	});

	it('can handle CSV with quoted fields', () => {

		var csv =
			'"c1","c2"\n' +
			'"a","1"\n' +
			'"b","2"';

		var dataFrame = dataForge.fromCSV(csv);
		expect(dataFrame.getColumnNames()).to.eql(["c1", "c2"]);

		var series1 = dataFrame.getSeries('c1');
		expect(series1.toArray()).to.eql([
			'a',
			'b',
		]);

		var series2 = dataFrame.getSeries('c2');
		expect(series2.toArray()).to.eql([
			'1',
			'2',
		]);
	});

	it('can handle CSV with unix line endings', () => {

		var csv =
			'c1,c2\n' +
			'a,1\n' +
			'b,2';

		var dataFrame = dataForge.fromCSV(csv);
		expect(dataFrame.getColumnNames()).to.eql(["c1", "c2"]);

		var series1 = dataFrame.getSeries('c1');
		expect(series1.toArray()).to.eql([
			'a',
			'b',
		]);

		var series2 = dataFrame.getSeries('c2');
		expect(series2.toArray()).to.eql([
			'1',
			'2',
		]);
	});

	it('can handle CSV with windows line endings', () => {

		var csv =
			'c1,c2\r\n' +
			'a,1\r\n' +
			'b,2';

		var dataFrame = dataForge.fromCSV(csv);
		expect(dataFrame.getColumnNames()).to.eql(["c1", "c2"]);

		var series1 = dataFrame.getSeries('c1');
		expect(series1.toArray()).to.eql([
			'a',
			'b',
		]);

		var series2 = dataFrame.getSeries('c2');
		expect(series2.toArray()).to.eql([
			'1',
			'2',
		]);
	});

	it('can handle ASX share game CSV', () => {

		var csv =
			'"Company name","Code",\n' +
			'"AUSTRALIAN AGRICULTURAL COMPANY LIMITED.","AAC",\n' +
			'"ARDENT LEISURE GROUP","AAD",\n';

		var dataFrame = dataForge.fromCSV(csv);
		expect(dataFrame.getColumnNames()).to.eql(["Company name", "Code", ""]);

		var series1 = dataFrame.getSeries('Company name');
		expect(series1.toArray()).to.eql([
			'AUSTRALIAN AGRICULTURAL COMPANY LIMITED.',
			'ARDENT LEISURE GROUP',
		]);

		var series2 = dataFrame.getSeries('Code');
		expect(series2.toArray()).to.eql([
			'AAC',
			'AAD',
		]);

	});
});
